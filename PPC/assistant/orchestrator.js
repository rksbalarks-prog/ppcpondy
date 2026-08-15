// The agent loop. An async generator that drives the model <-> tools cycle and
// yields typed events the transport turns into SSE frames:
//   { type: 'token',   data: <text delta> }
//   { type: 'tool',    data: { name, args, kind } }        a tool is about to run
//   { type: 'results', data: [ { name, result|error } ] }  read-tool outputs
//   { type: 'action',  data: <proposal> }                  a write awaiting Confirm
//   { type: 'done',    data: { text, actions, usage } }
//   { type: 'error',   data: { message } }
//
// Read tools execute immediately. Write tools do NOT execute — they emit an
// action proposal and the model is told it is awaiting user confirmation. On the
// final loop the tools are dropped so the model must answer in prose.

const config = require('./config');
const { getProvider } = require('./providers');
const { openaiToolSchemas, getTool } = require('./tools/registry');
const { scrubPII } = require('./sanitize');

async function* runAgent({ messages, phone, wantsPoints = false }) {
  const provider = getProvider();
  const schemas = openaiToolSchemas();
  const convo = [...messages];
  const actions = [];
  const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  // Track the turn's search outcome so we can DETERMINISTICALLY show the
  // "Add Buyer Assistance" button when the user searched and nothing matched —
  // even if the model only talks about it in prose and forgets to call the tool.
  let searchAttempted = false;
  let anyPropertyFound = false;
  let offerProposed = false;
  let firstSearchArgs = null;
  // Same idea for the "Buy Points" button: if the user clearly asked for the
  // points page / to buy points, show the button no matter what — otherwise the
  // model only describes it in prose and the user has to insist.
  let pointsProposed = false;

  // Emit the buyer-assistance navigate button iff a search ran, nothing was found,
  // and it wasn't already offered. Prefill uses the user's ORIGINAL (first) filters.
  function* offerAssistanceIfEmpty() {
    if (!searchAttempted || anyPropertyFound || offerProposed) return;
    const offerTool = getTool('offer_buyer_assistance');
    if (!offerTool) return;
    const proposal = offerTool.proposal(phone, firstSearchArgs || {});
    actions.push(proposal);
    offerProposed = true;
    yield { type: 'action', data: proposal };
  }

  // Emit the Buy-Points button iff the user asked for it and the model didn't
  // already propose it this turn.
  function* offerPointsIfRequested() {
    if (!wantsPoints || pointsProposed) return;
    const tool = getTool('offer_points_purchase');
    if (!tool) return;
    const proposal = tool.proposal(phone, {});
    actions.push(proposal);
    pointsProposed = true;
    yield { type: 'action', data: proposal };
  }

  try {
    for (let loop = 0; loop < config.maxToolLoops; loop++) {
      const isFinal = loop === config.maxToolLoops - 1;
      const tools = isFinal ? undefined : schemas; // final loop -> force prose

      let text = '';
      let toolCalls = [];

      for await (const ev of provider.chatStream({ messages: convo, tools })) {
        if (ev.type === 'text') {
          text += ev.delta;
          yield { type: 'token', data: ev.delta };
        } else if (ev.type === 'tool_calls') {
          toolCalls = ev.calls;
        } else if (ev.type === 'usage' && ev.usage) {
          usage.prompt_tokens += ev.usage.prompt_tokens || 0;
          usage.completion_tokens += ev.usage.completion_tokens || 0;
          usage.total_tokens += ev.usage.total_tokens || 0;
        }
      }

      // No tool calls => this is the model's final answer.
      if (!toolCalls.length) {
        yield* offerAssistanceIfEmpty();
        yield* offerPointsIfRequested();
        convo.push({ role: 'assistant', content: text });
        yield { type: 'done', data: { text, actions, usage } };
        return;
      }

      // Record the assistant turn that requested the tools.
      convo.push({
        role: 'assistant',
        content: text || null,
        tool_calls: toolCalls.map((c) => ({
          id: c.id,
          type: 'function',
          function: { name: c.name, arguments: c.arguments || '{}' },
        })),
      });

      const results = [];
      for (const call of toolCalls) {
        let args = {};
        try { args = call.arguments ? JSON.parse(call.arguments) : {}; }
        catch { args = {}; }

        const tool = getTool(call.name);
        yield { type: 'tool', data: { name: call.name, args, kind: tool?.kind || 'unknown' } };
        if (call.name === 'offer_buyer_assistance') offerProposed = true;
        if (call.name === 'offer_points_purchase') pointsProposed = true;

        let toolResultForModel;
        if (!tool) {
          toolResultForModel = { error: `Unknown tool: ${call.name}` };
          results.push({ name: call.name, error: toolResultForModel.error });
        } else if (tool.kind === 'write' || tool.kind === 'navigate') {
          // Never execute. Emit a proposal — the frontend renders a Confirm chip
          // (write) or a navigate button (navigate). The model must not claim done.
          const proposal = tool.proposal(phone, args);
          actions.push(proposal);
          yield { type: 'action', data: proposal };
          toolResultForModel = {
            status: tool.kind === 'navigate' ? 'button_shown' : 'awaiting_user_confirmation',
            action: proposal.tool,
            label: proposal.label,
            note: proposal.note || 'Do not claim it is done. Tell the user to tap Confirm.',
          };
          results.push({ name: call.name, proposal });
        } else {
          try {
            // Belt-and-braces: scrub PII from EVERY read result before it reaches
            // the model OR the UI cards (the `results` event below feeds both).
            // Individual tools already allowlist their fields; this is the net
            // that catches anything a tool forgot or a future field introduces.
            const out = scrubPII(await tool.execute(phone, args));
            toolResultForModel = out;
            results.push({ name: call.name, result: out });
            if (call.name === 'search_properties') {
              searchAttempted = true;
              if (!firstSearchArgs) firstSearchArgs = args;
              const found = out && (Number(out.count) > 0 || (Array.isArray(out.results) && out.results.length > 0));
              if (found) anyPropertyFound = true;
            }
          } catch (e) {
            toolResultForModel = { error: e?.message || 'tool execution failed' };
            results.push({ name: call.name, error: toolResultForModel.error });
          }
        }

        convo.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(toolResultForModel),
        });
      }

      yield { type: 'results', data: results };
    }

    // Safety net: loops exhausted without prose (shouldn't happen — final loop
    // drops tools). Emit whatever we have.
    yield* offerAssistanceIfEmpty();
    yield* offerPointsIfRequested();
    yield { type: 'done', data: { text: '', actions, usage } };
  } catch (err) {
    yield { type: 'error', data: { message: err?.message || 'assistant error' } };
  }
}

module.exports = { runAgent };
