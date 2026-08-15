// Deterministic mock provider — no API key, no network. Lets the whole pipeline
// (agent loop, tool execution, SSE, store) run in tests/CI. Selected via
// ASSISTANT_PROVIDER=mock.
//
// Behaviour is a function of its inputs only:
//   - chatStream WITH tools + search intent + no prior tool result -> a
//     search_properties tool call (exercises the tool loop).
//   - chatStream WITHOUT tools (the orchestrator's final loop) -> prose. If a
//     tool result is present it summarises the count; otherwise it echoes.
//   - Replies in Tamil when the user's last message contains Tamil characters.

const TAMIL = /[஀-௿]/;

function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return String(messages[i].content || '');
  }
  return '';
}

function hasToolResult(messages) {
  return messages.some((m) => m.role === 'tool');
}

function parseFilters(text) {
  const f = {};
  const t = text.toLowerCase();
  const bhk = t.match(/(\d+)\s*(?:bhk|bed|bedroom|படுக்கை)/);
  if (bhk) f.bedrooms = bhk[1];
  // Sale prices are quoted in lakhs/crores — normalise both to plain rupees.
  const crore = t.match(/(?:under|below|less than|<|க்குள்|கீழ்)?\s*([\d.]+)\s*(?:crore|cr|கோடி)/);
  const lakh = t.match(/(?:under|below|less than|<|க்குள்|கீழ்)?\s*([\d.]+)\s*(?:lakh|lac|l\b|லட்சம்)/);
  if (crore) f.maxPrice = Math.round(Number(crore[1]) * 10000000);
  else if (lakh) f.maxPrice = Math.round(Number(lakh[1]) * 100000);
  if (/chennai|சென்னை/.test(t)) f.city = 'Chennai';
  else if (/pondy|pondicherry|puducherry|புது|பாண்டி/.test(t)) f.city = 'Pondicherry';
  if (/plot|land|மனை|நிலம்/.test(t)) f.propertyType = 'Plot';
  return f;
}

function tokenize(str) {
  // Split into small chunks so streaming looks realistic.
  return str.match(/\S+\s*/g) || [str];
}

async function* chatStream({ messages, tools }) {
  const text = lastUserText(messages);
  const tamil = TAMIL.test(text);

  const searchIntent =
    /search|find|show|looking|want|buy|sale|house|home|bhk|bedroom|flat|apartment|plot|land|தேடு|வீடு|மனை|விற்பனை|காட்டு/i.test(
      text
    );

  if (tools && tools.length && searchIntent && !hasToolResult(messages)) {
    yield {
      type: 'tool_calls',
      calls: [
        {
          id: 'mock_call_1',
          name: 'search_properties',
          arguments: JSON.stringify(parseFilters(text)),
        },
      ],
    };
    yield { type: 'usage', usage: { prompt_tokens: 40, completion_tokens: 12, total_tokens: 52 } };
    yield { type: 'done', finishReason: 'tool_calls' };
    return;
  }

  // Final answer (prose). Summarise a tool result if we have one.
  let reply;
  if (hasToolResult(messages)) {
    const toolMsg = [...messages].reverse().find((m) => m.role === 'tool');
    let count = null;
    try {
      const parsed = JSON.parse(toolMsg.content);
      count = parsed.count ?? (Array.isArray(parsed.results) ? parsed.results.length : null);
    } catch { /* ignore */ }
    if (tamil) {
      reply = count != null
        ? `உங்கள் தேடலுக்கு ${count} properties கிடைச்சுது. மேலும் விவரம் வேணுமா?`
        : `சில பொருத்தமான properties கிடைச்சுது. மேலும் விவரம் வேணுமா?`;
    } else {
      reply = count != null
        ? `I found ${count} matching ${count === 1 ? 'property' : 'properties'}. Want details on any of them?`
        : `I found some matching properties. Want details on any of them?`;
    }
  } else {
    reply = tamil
      ? 'வணக்கம்! நான் Pondy Properties assistant. எந்த area-ல property தேடுறீங்க?'
      : "Hi! I'm the Pondy Properties assistant. Which area are you looking to buy in?";
  }

  for (const tok of tokenize(reply)) {
    yield { type: 'text', delta: tok };
  }
  yield { type: 'usage', usage: { prompt_tokens: 30, completion_tokens: reply.length, total_tokens: 30 + reply.length } };
  yield { type: 'done', finishReason: 'stop' };
}

async function transcribe({ buffer }) {
  // Deterministic: a fixed domain phrase so downstream steps are testable.
  // (Varies a little by size so tests can distinguish inputs.)
  const big = (buffer && buffer.length ? buffer.length : 0) > 50000;
  return { text: big ? 'Show me 3 bedroom apartments in White Town under 80 lakhs' : 'plot for sale in Pondicherry' };
}

async function speak({ text, format = 'mp3' }) {
  // Minimal valid-ish audio bytes — enough for the round-trip contract without
  // a real TTS engine. Not playable audio; tests only assert bytes + headers.
  const header = format === 'wav' ? 'RIFF' : 'ID3';
  const audio = Buffer.from(header + ' mock-tts:' + (text || '').slice(0, 32));
  const contentType = format === 'wav' ? 'audio/wav' : 'audio/mpeg';
  return { audio, contentType };
}

module.exports = { name: 'mock', chatStream, transcribe, speak };
