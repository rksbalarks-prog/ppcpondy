// Low-level assistant client: token mint, SSE streaming with a single 401->refresh
// retry, transcribe, speak, and write-action confirmation. No dependencies — plain
// fetch + localStorage. The OpenAI key never touches the browser; this only talks
// to our own assistant backend.

const ASSISTANT_BASE = (process.env.REACT_APP_ASSISTANT_URL || 'http://localhost:5006/api/assistant').replace(/\/+$/, '');
// Canonical app API (production) — write confirmations POST here, exactly like the
// rest of the app does today.
const APP_API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

const TOKEN_KEY = 'ppc_assist_token';

export function getPhone() {
  return localStorage.getItem('phoneNumber') || '';
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}
function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Public status: { enabled, provider, greeting:{en,ta} }. Used to pick up an
// admin-set welcome greeting. Best-effort — callers fall back to their defaults.
export async function fetchStatus() {
  const res = await fetch(`${ASSISTANT_BASE}/status`, { method: 'GET' });
  if (!res.ok) throw new Error('status_failed');
  return res.json();
}

export async function mintToken() {
  const phone = getPhone();
  if (!phone) throw new Error('not_logged_in');
  const res = await fetch(`${ASSISTANT_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) throw new Error('token_failed');
  const { token } = await res.json();
  setToken(token);
  return token;
}

async function ensureToken() {
  return getToken() || (await mintToken());
}

// Parse an SSE stream, invoking onEvent(type, data) per frame. Handles a single
// 401 by re-minting the token and retrying once.
export async function streamChat({ message, sessionId, lang }, onEvent, _retried = false) {
  const token = await ensureToken();
  const res = await fetch(`${ASSISTANT_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message, sessionId, lang }),
  });

  if (res.status === 401 && !_retried) {
    clearToken();
    await mintToken();
    return streamChat({ message, sessionId, lang }, onEvent, true);
  }
  if (!res.ok || !res.body) {
    let detail = '';
    try { detail = (await res.json()).error; } catch {}
    onEvent('error', { message: detail || `http_${res.status}` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    // Frames are separated by a blank line.
    let idx;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let event = 'message';
      let dataLine = '';
      for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLine += line.slice(5).trim();
      }
      if (!dataLine) continue;
      let data;
      try { data = JSON.parse(dataLine); } catch { data = dataLine; }
      onEvent(event, data);
    }
  }
}

export async function transcribe(blob, filename) {
  const token = await ensureToken();
  const fd = new FormData();
  fd.append('audio', blob, filename);
  let res = await fetch(`${ASSISTANT_BASE}/transcribe`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
  });
  if (res.status === 401) {
    clearToken();
    const t = await mintToken();
    res = await fetch(`${ASSISTANT_BASE}/transcribe`, {
      method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: fd,
    });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'transcribe_failed');
  return json; // { text, lang }
}

// Returns an audio Blob (mp3) or null on failure.
export async function speakToBlob(text, lang) {
  const token = await ensureToken();
  const res = await fetch(`${ASSISTANT_BASE}/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, lang, format: 'mp3' }),
  });
  if (!res.ok) return null;
  return await res.blob();
}

export async function fetchSession(sessionId) {
  const token = await ensureToken();
  const res = await fetch(`${ASSISTANT_BASE}/session/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { messages: [] };
  return res.json();
}

export async function resetSession(sessionId) {
  const token = await ensureToken();
  await fetch(`${ASSISTANT_BASE}/session/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

// Save an owner's intake as a follow-up lead (assistant backend).
export async function saveOwnerLead(payload) {
  const token = await ensureToken();
  const res = await fetch(`${ASSISTANT_BASE}/owner-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'lead_failed');
  return json;
}

// After a successful contact-reveal deduction, fetch the owner's phone number to
// show in the chat. The /points-deduct response never carries it — the app reads
// it from the property record. Prefer the admin-assigned/masked number, exactly
// like Details.jsx does. Only called AFTER points are spent.
export async function fetchOwnerContact(ppcId) {
  const res = await fetch(`${APP_API_BASE}/property/${encodeURIComponent(ppcId)}`, {
    headers: { Accept: 'application/json' },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'contact_fetch_failed');
  const p = json?.property || json?.data || json || {};
  const number = p.assignedPhoneNumber || p.phoneNumber || p.postedUserPhoneNumber || '';
  const alt = p.alternatePhone || p.alternatePhoneNumber || p.secondaryPhone || '';
  return { number, alt };
}

// Confirm a write action by calling the canonical app endpoint (production API),
// exactly as the app does elsewhere. The proposal body already carries the
// verified phone from the session.
export async function confirmAction(action) {
  const url = `${APP_API_BASE}${action.endpoint}`;
  const res = await fetch(url, {
    method: action.method || 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action.body || {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'action_failed');
  return json;
}
