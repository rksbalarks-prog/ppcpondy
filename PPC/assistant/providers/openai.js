// OpenAI provider. Implements the three-method provider contract:
//   chatStream({messages, tools})  -> async generator of normalized events
//   transcribe({buffer, filename, prompt})  -> {text}
//   speak({text, instructions, voice, format}) -> {audio: Buffer, contentType}
//
// chatStream normalizes OpenAI's streaming chunks into:
//   { type: 'text', delta }        streamed assistant prose
//   { type: 'tool_calls', calls }  assembled tool calls (once, at end)
//   { type: 'usage', usage }       token usage (once, at end)
//   { type: 'done', finishReason }
// Tool-call fragments arrive spread across chunks by index; we accumulate them
// here so the orchestrator receives whole calls.

// openai v6 is a CommonJS package that exports NAMED bindings only — it does not
// assign the class to module.exports, so `require('openai')` returns the namespace
// and must be destructured (the ESM `import OpenAI from 'openai'` form has no CJS
// equivalent here).
const { OpenAI, toFile } = require('openai');
const config = require('../config');

let _client = null;
function client() {
  if (!_client) _client = new OpenAI({ apiKey: config.openai.apiKey });
  return _client;
}

async function* chatStream({ messages, tools, model, temperature = 0.3 }) {
  const req = {
    model: model || config.openai.chatModel,
    messages,
    temperature,
    stream: true,
    stream_options: { include_usage: true },
  };
  if (tools && tools.length) {
    req.tools = tools;
    req.tool_choice = 'auto';
  }

  const stream = await client().chat.completions.create(req);

  const toolAcc = []; // index -> { id, name, args(string) }
  let finishReason = null;

  for await (const chunk of stream) {
    const choice = chunk.choices && chunk.choices[0];
    if (chunk.usage) {
      yield { type: 'usage', usage: chunk.usage };
    }
    if (!choice) continue;

    const delta = choice.delta || {};
    if (delta.content) {
      yield { type: 'text', delta: delta.content };
    }
    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const i = tc.index ?? 0;
        if (!toolAcc[i]) toolAcc[i] = { id: '', name: '', args: '' };
        if (tc.id) toolAcc[i].id = tc.id;
        if (tc.function && tc.function.name) toolAcc[i].name += tc.function.name;
        if (tc.function && tc.function.arguments) toolAcc[i].args += tc.function.arguments;
      }
    }
    if (choice.finish_reason) finishReason = choice.finish_reason;
  }

  const calls = toolAcc.filter(Boolean).map((t) => ({
    id: t.id,
    name: t.name,
    arguments: t.args,
  }));
  if (calls.length) yield { type: 'tool_calls', calls };
  yield { type: 'done', finishReason };
}

async function transcribe({ buffer, filename, mimetype, prompt, language }) {
  // Filename extension MUST match the recorded container (webm/mp4/ogg) or the
  // model mis-parses the audio. The caller derives `filename` from the browser's
  // recorder.mimeType; we just pass it through with the correct content type.
  const file = await toFile(buffer, filename, { type: mimetype });
  const res = await client().audio.transcriptions.create({
    file,
    model: config.openai.transcribeModel,
    // Domain vocabulary biases recognition toward app terms — big win on Tamil.
    prompt: prompt || undefined,
    ...(language ? { language } : {}),
  });
  return { text: (res.text || '').trim() };
}

async function speak({ text, instructions, voice, format = 'mp3' }) {
  const res = await client().audio.speech.create({
    model: config.openai.ttsModel,
    voice: voice || config.openai.ttsVoice,
    input: text,
    // Without accent/pacing instructions the model reads Tamil in a flat American
    // accent — the single most jarring thing about TTS here.
    instructions: instructions || undefined,
    response_format: format,
  });
  const audio = Buffer.from(await res.arrayBuffer());
  const contentType =
    format === 'wav' ? 'audio/wav' :
    format === 'opus' ? 'audio/opus' :
    format === 'aac' ? 'audio/aac' :
    format === 'flac' ? 'audio/flac' :
    'audio/mpeg';
  return { audio, contentType };
}

module.exports = { name: 'openai', chatStream, transcribe, speak };
