// Assistant conversation hook. Owns the message list, drives the SSE stream, keeps
// sessionId in localStorage, and exposes confirm/reset. Result cards (from tool
// results) and action proposals (Confirm chips) are attached to the assistant turn.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  streamChat, transcribe, speakToBlob, confirmAction, fetchOwnerContact, resetSession, getPhone,
} from './assistantClient';

const SESSION_KEY = 'ppc_assist_session';
const MSG_KEY = 'ppc_assist_messages';

function newSessionId() {
  const rnd = Math.random().toString(36).slice(2);
  return `sess_web_${Date.now()}_${rnd}`;
}
function loadSessionId() {
  let s = localStorage.getItem(SESSION_KEY);
  if (!s) { s = newSessionId(); localStorage.setItem(SESSION_KEY, s); }
  return s;
}
// Restore the chat (incl. result cards) after navigating to a detail page and back
// — the widget unmounts on route change, so we rehydrate from sessionStorage.
function loadMessages() {
  try {
    const arr = JSON.parse(sessionStorage.getItem(MSG_KEY) || '[]');
    return Array.isArray(arr) ? arr.map((m) => ({ ...m, streaming: false })) : [];
  } catch { return []; }
}

export function useAssistant() {
  const [messages, setMessages] = useState(loadMessages); // {id, role, content, cards?, actions?}
  const [busy, setBusy] = useState(false);
  const sessionRef = useRef(loadSessionId());
  // Continue id numbering past whatever was restored so ids stay unique.
  const idRef = useRef(messages.reduce((mx, m) => Math.max(mx, parseInt(String(m.id).slice(1), 10) || 0), 0));
  const nextId = () => `m${++idRef.current}`;

  // Persist the chat on every change (throttled implicitly by React batching).
  useEffect(() => {
    try { sessionStorage.setItem(MSG_KEY, JSON.stringify(messages)); } catch { /* quota */ }
  }, [messages]);

  const patchLast = useCallback((patch) => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const copy = prev.slice();
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = typeof patch === 'function' ? patch(last) : { ...last, ...patch };
      return copy;
    });
  }, []);

  const send = useCallback(async (text, { lang } = {}) => {
    const message = (text || '').trim();
    if (!message || busy) return;
    if (!getPhone()) {
      setMessages((p) => [...p, { id: nextId(), role: 'assistant', content: 'Please log in first to use the assistant.' }]);
      return;
    }

    setMessages((p) => [
      ...p,
      { id: nextId(), role: 'user', content: message },
      { id: nextId(), role: 'assistant', content: '', cards: [], actions: [], streaming: true },
    ]);
    setBusy(true);
    let finalText = '';

    try {
      await streamChat({ message, sessionId: sessionRef.current, lang }, (event, data) => {
        switch (event) {
          case 'session':
            if (data.sessionId) {
              sessionRef.current = data.sessionId;
              localStorage.setItem(SESSION_KEY, data.sessionId);
            }
            break;
          case 'token':
            finalText += data.text || '';
            patchLast((m) => ({ ...m, content: m.content + (data.text || '') }));
            break;
          case 'results': {
            const cards = [];
            (Array.isArray(data) ? data : []).forEach((r) => {
              const res = r.result;
              if (res && Array.isArray(res.results)) cards.push(...res.results);
              if (res && res.property) cards.push(res.property);
            });
            if (cards.length) patchLast((m) => ({ ...m, cards: [...(m.cards || []), ...cards].slice(0, 12) }));
            break;
          }
          case 'action':
            patchLast((m) => ({ ...m, actions: [...(m.actions || []), { ...data, state: 'pending' }] }));
            break;
          case 'done':
            if (data.text) finalText = data.text;
            patchLast((m) => ({ ...m, content: data.text || m.content, streaming: false }));
            break;
          case 'error':
            patchLast((m) => ({ ...m, content: m.content || `Sorry, something went wrong (${data.message || 'error'}).`, streaming: false }));
            break;
          default:
            break;
        }
      });
    } catch (e) {
      patchLast((m) => ({ ...m, content: m.content || 'Sorry, I could not reach the assistant.', streaming: false }));
    } finally {
      setBusy(false);
      patchLast((m) => ({ ...m, streaming: false }));
    }
    return finalText;
  }, [busy, patchLast]);

  // Confirm a proposed write. Updates that action's state on the message.
  const confirm = useCallback(async (msgId, actionIdx) => {
    let target;
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const actions = (m.actions || []).slice();
      if (actions[actionIdx]) { target = actions[actionIdx]; actions[actionIdx] = { ...target, state: 'working' }; }
      return { ...m, actions };
    }));
    if (!target) return;
    try {
      const result = await confirmAction(target);
      setMessages((prev) => prev.map((m) => {
        if (m.id !== msgId) return m;
        const actions = (m.actions || []).slice();
        actions[actionIdx] = { ...actions[actionIdx], state: 'done' };
        return { ...m, actions };
      }));

      // Owner-contact reveal: the points deduction succeeded, but /points-deduct
      // never returns the number — fetch it now and show it in the chat (the app
      // reveals it from the property record the same way).
      if (target.tool === 'request_contact_owner' && result && result.success !== false) {
        const ppcId = target.body?.ppcId ?? target.body?.rentId;
        let text;
        try {
          const { number, alt } = await fetchOwnerContact(ppcId);
          const used = result.alreadyDeducted ? 'already unlocked earlier — no points charged' : `${target.body?.points} points used`;
          text = number
            ? `📞 Owner contact for #${ppcId}: ${number}${alt ? `\nAlternate: ${alt}` : ''}\n(${used})`
            : `Payment done, but I couldn't fetch the number right now. Please open property #${ppcId} to view it.`;
        } catch {
          text = `Payment done, but I couldn't fetch the number right now. Please open property #${ppcId} to view it.`;
        }
        setMessages((p) => [...p, { id: nextId(), role: 'assistant', content: text }]);
      }
    } catch (e) {
      setMessages((prev) => prev.map((m) => {
        if (m.id !== msgId) return m;
        const actions = (m.actions || []).slice();
        actions[actionIdx] = { ...actions[actionIdx], state: 'error', error: e.message };
        return { ...m, actions };
      }));
    }
  }, []);

  const reset = useCallback(async () => {
    const old = sessionRef.current;
    const fresh = newSessionId();
    sessionRef.current = fresh;
    localStorage.setItem(SESSION_KEY, fresh);
    setMessages([]);
    resetSession(old);
  }, []);

  // Push a canned assistant line (e.g. the voice greeting) without calling the model.
  const say = useCallback((text) => {
    if (!text) return;
    setMessages((p) => [...p, { id: nextId(), role: 'assistant', content: text }]);
  }, []);

  return { messages, busy, send, confirm, reset, transcribe, speakToBlob, say };
}

export default useAssistant;
