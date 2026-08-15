// Floating AI assistant widget: chat + hands-free voice, result cards, and Confirm
// chips for write actions. StrictMode-safe — open/closed and the auto-open are
// guarded so effects don't double-fire destructively.

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssistant } from './useAssistant';
import { useVoice } from './useVoice';
import { fetchStatus } from './assistantClient';
import './assistant.css';

const TAMIL = /[஀-௿]/;
const detectLang = (t) => (TAMIL.test(t || '') ? 'ta' : 'en');

const T = {
  en: { title: 'Pondy Properties AI Assistant', placeholder: 'Ask about properties for sale…', hi: "👋 Welcome! I'm your Pondy Properties assistant. I can help you find properties for sale, check your points and more.", micHint: 'To talk to me, just tap the microphone button.', listen: 'Listening… tap to stop', tapPlay: '🔊 Tap to play reply', details: 'Details', confirm: 'Confirm', addBuyer: '➕ Add Buyer Assistance', addProperty: '🏠 Add Property', buyPoints: '💎 Buy Points', sent: 'Done ✓', spend: 'Spends points', voiceListen: '🎙️ Listening…', voiceThink: '💭 Thinking…', voiceSpeak: '🔊 Speaking…', callStart: 'Hands-free voice', callEnd: 'End voice', pressToChat: 'AI Assistant', callHint: 'Tap to talk with me', voicePrompt: 'How can I help you?', micBlocked: '🎤 I need microphone access to talk. Please tap the 🔒/ⓘ icon next to the address bar, allow the Microphone, then tap 🎤 again.', micNoDevice: '🎤 No microphone was found on this device.' },
  ta: { title: 'பாண்டி ப்ராப்பர்டீஸ் உதவியாளர்', placeholder: 'Property பற்றி கேளுங்கள்…', hi: '👋 வணக்கம்! நான் உங்க Pondy Properties assistant. Property தேட, points பார்க்க எல்லாம் help பண்ணுவேன்.', micHint: 'என்னோட பேச, மைக் பட்டனை அழுத்துங்க.', listen: 'கேட்கிறேன்… நிறுத்த தட்டவும்', tapPlay: '🔊 பதிலைக் கேட்க தட்டவும்', details: 'விவரம்', confirm: 'உறுதி', addBuyer: '➕ Buyer Assistance சேர்க்க', addProperty: '🏠 Property போடு', buyPoints: '💎 Points வாங்க', sent: 'முடிந்தது ✓', spend: 'புள்ளிகள் செலவாகும்', voiceListen: '🎙️ கேட்கிறேன்…', voiceThink: '💭 யோசிக்கிறேன்…', voiceSpeak: '🔊 பேசுறேன்…', callStart: 'குரல் மோட்', callEnd: 'நிறுத்து', pressToChat: 'AI உதவியாளர்', callHint: 'பேச தட்டவும்', voicePrompt: 'சொல்லுங்க, நான் எப்படி உதவட்டும்?', micBlocked: '🎤 பேச மைக் அனுமதி தேவை. Address bar பக்கத்துல இருக்கிற 🔒/ⓘ icon-ஐ தட்டி, Microphone-ஐ allow பண்ணிட்டு, மறுபடியும் 🎤 தட்டுங்க.', micNoDevice: '🎤 இந்த device-ல மைக் இல்லை.' },
};

// Sale prices run to lakhs/crores, so a raw "₹4500000" is hard to read at a
// glance. Match how the app quotes prices elsewhere: Cr above 1 crore, L above
// 1 lakh, plain grouped rupees below that.
function formatPrice(v) {
  if (v == null || v === '') return '';
  if (typeof v !== 'number') {
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v); // e.g. "On Demand"
    v = n;
  }
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2).replace(/\.00$/, '')} L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function ResultCard({ card, onOpen, t }) {
  if (!card || card.ppcId == null) return null;
  const price = formatPrice(card.price ?? card.priceDisplay);
  const size = card.totalArea ? `${card.totalArea} ${card.areaUnit || 'sqft'}` : '';
  return (
    <div className="ppc-card" onClick={() => onOpen(card.ppcId)}>
      <div className="ppc-card-top">
        <span className="ppc-card-type">{card.propertyType || 'Property'}</span>
        <span className="ppc-card-rent">{price}</span>
      </div>
      <div className="ppc-card-area">{card.area || card.city || ''}</div>
      <div className="ppc-card-meta">
        {card.bedrooms && card.bedrooms !== 'No' ? `${card.bedrooms} BHK · ` : ''}
        {card.furnished || ''}{size ? ` · ${size}` : ''}
      </div>
      <div className="ppc-card-cta">#{card.ppcId} · {t.details} →</div>
    </div>
  );
}

const ss = {
  get: (k, d) => { try { const v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ } },
};

export default function AssistantWidget() {
  // Restore UI state on remount (e.g. after visiting a detail page and going back).
  const [open, setOpen] = useState(() => ss.get('ppc_assist_open', false));
  const [input, setInput] = useState('');
  // Default to Tamil (Tanglish) — most users are Tamil speakers; the EN/த toggle still switches.
  const [lang, setLang] = useState(() => ss.get('ppc_assist_lang', 'ta'));
  const [speakerOn, setSpeakerOn] = useState(true);
  const [blockedBlob, setBlockedBlob] = useState(null);
  const [voiceMode, setVoiceMode] = useState(false);   // hands-free continuous voice
  const [voiceStatus, setVoiceStatus] = useState('');  // '', 'listening', 'thinking', 'speaking'
  const voiceModeRef = useRef(false);
  const openRef = useRef(open);
  openRef.current = open;

  // Persist the parts that must survive navigation.
  useEffect(() => { ss.set('ppc_assist_open', open); }, [open]);
  useEffect(() => { ss.set('ppc_assist_lang', lang); }, [lang]);

  const { messages, busy, send, confirm, transcribe, speakToBlob, reset, say } = useAssistant();
  const voice = useVoice();
  const navigate = useNavigate();

  const scrollRef = useRef(null);
  const firstScroll = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // On the first render after a remount, restore where the user was (so they can
    // keep browsing the list); afterwards, follow new messages to the bottom.
    if (firstScroll.current) {
      firstScroll.current = false;
      const saved = ss.get('ppc_assist_scroll', null);
      if (typeof saved === 'number') { el.scrollTop = saved; return; }
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const t = T[lang];

  // Admin-set welcome greeting (from /status). Falls back to the built-in T.hi.
  const [greeting, setGreeting] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchStatus()
      .then((st) => { if (alive && st && st.greeting) setGreeting(st.greeting); })
      .catch(() => { /* best-effort; default greeting stays */ });
    return () => { alive = false; };
  }, []);
  const hi = (greeting && greeting[lang] && String(greeting[lang]).trim()) || t.hi;

  // Auto-open the assistant once per tab-session when the user is logged in.
  // Guard on sessionStorage so StrictMode's double-invoked effect is a no-op.
  useEffect(() => {
    const phone = localStorage.getItem('phoneNumber');
    if (!phone) return;
    if (sessionStorage.getItem('ppc_assist_opened')) return;
    sessionStorage.setItem('ppc_assist_opened', '1');
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speak the welcome greeting aloud once per tab-session. Browsers block audio
  // until a user gesture, so we play it on the user's FIRST interaction anywhere.
  // If that first interaction is starting voice mode (orb / mic), we skip it —
  // voice mode's own "How can I help you?" greeting takes over instead.
  const welcomeSpokenRef = useRef(false);
  useEffect(() => {
    if (!open || welcomeSpokenRef.current) return;
    if (messages.length > 0) { welcomeSpokenRef.current = true; return; }
    if (sessionStorage.getItem('ppc_assist_welcome_spoken')) { welcomeSpokenRef.current = true; return; }

    const remove = () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      window.removeEventListener('touchstart', onGesture);
    };
    const onGesture = async (e) => {
      if (welcomeSpokenRef.current) { remove(); return; }
      welcomeSpokenRef.current = true;
      try { sessionStorage.setItem('ppc_assist_welcome_spoken', '1'); } catch { /* quota */ }
      remove();
      const startingVoice = e && e.target && e.target.closest && e.target.closest('.ppc-aibtn, .ppc-mic');
      if (startingVoice) return; // voice mode greets instead
      voice.unlockAudio();
      // Greet AND tell the user how to talk back: "…tap the microphone button."
      const welcome = `${hi} ${t.micHint}`;
      const blob = await speakToBlob(welcome, detectLang(welcome));
      if (!blob) return;
      const played = await voice.playBlob(blob);
      if (!played) setBlockedBlob(blob); // autoplay still blocked → tap-to-play chip
    };
    window.addEventListener('pointerdown', onGesture);
    window.addEventListener('keydown', onGesture);
    window.addEventListener('touchstart', onGesture);
    return remove;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── voice / chat ────────────────────────────────────────────────────────────
  const maybeSpeak = async (text) => {
    if (!speakerOn || !text) return;
    const blob = await speakToBlob(text, detectLang(text));
    if (!blob) return;
    const played = await voice.playBlob(blob);
    if (!played) setBlockedBlob(blob);
  };

  // ── Hands-free voice mode ─────────────────────────────────────────────────────
  // Continuous loop: listen (auto-stop on silence) → transcribe → reply → speak
  // (wait for it to finish) → listen again, until ended. Listen and speak are
  // strictly sequential so the mic never records the assistant's own voice.
  const runVoiceLoop = async () => {
    // On a fresh start, greet first: show + speak "How can I help you?" before listening.
    if (messages.length === 0 && voiceModeRef.current && openRef.current) {
      say(t.voicePrompt);
      if (speakerOn) {
        setVoiceStatus('speaking');
        const g = await speakToBlob(t.voicePrompt, lang === 'ta' ? 'ta' : 'en');
        if (g && voiceModeRef.current && openRef.current) await voice.playBlobAwait(g);
      }
    }
    while (voiceModeRef.current && openRef.current) {
      setVoiceStatus('listening');
      let result;
      try { result = await voice.recordUntilSilence(); }
      catch { stopVoiceMode(); return; } // mic denied / unsupported
      if (!voiceModeRef.current || !openRef.current) break;
      if (!result || !result.blob || result.blob.size < 1500) continue; // silence → keep listening

      setVoiceStatus('thinking');
      let text = '';
      try { const r = await transcribe(result.blob, result.filename); text = (r.text || '').trim(); }
      catch { continue; }
      if (!voiceModeRef.current || !openRef.current) break;
      if (!text) continue;

      const useLang = lang === 'ta' || detectLang(text) === 'ta' ? 'ta' : 'en';
      const reply = await send(text, { lang: useLang });
      if (!voiceModeRef.current || !openRef.current) break;

      if (reply && speakerOn) {
        setVoiceStatus('speaking');
        const blob = await speakToBlob(reply, useLang);
        if (blob && voiceModeRef.current && openRef.current) await voice.playBlobAwait(blob);
      }
    }
    setVoiceStatus('');
  };

  const startVoiceMode = async () => {
    if (!voice.supported || voiceModeRef.current || !openRef.current) return;
    voice.unlockAudio();
    setBlockedBlob(null);
    // Request mic permission up-front, inside this tap, so Android/mobile browsers
    // show the permission prompt immediately. If blocked or denied, tell the user
    // how to enable it instead of failing silently.
    const perm = await voice.ensureMic();
    if (!perm.ok) {
      if (openRef.current) say(perm.error === 'NotFoundError' ? t.micNoDevice : t.micBlocked);
      return;
    }
    if (voiceModeRef.current || !openRef.current) return; // state changed while awaiting the prompt
    voiceModeRef.current = true;
    setVoiceMode(true);
    runVoiceLoop();
  };

  const stopVoiceMode = () => {
    voiceModeRef.current = false;
    setVoiceMode(false);
    setVoiceStatus('');
    voice.cancelListening();
  };

  // Stop hands-free mode when the panel closes or the widget unmounts.
  useEffect(() => { if (!open) stopVoiceMode(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);
  useEffect(() => () => { voiceModeRef.current = false; try { voice.cancelListening(); } catch { /* */ } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submitText = async (text) => {
    const msg = (text || '').trim();
    if (!msg) return;
    voice.unlockAudio();
    setInput('');
    setBlockedBlob(null);
    // Honor the selected language; also switch to Tamil if the message itself is Tamil.
    const useLang = lang === 'ta' || detectLang(msg) === 'ta' ? 'ta' : 'en';
    const reply = await send(msg, { lang: useLang });
    maybeSpeak(reply);
  };

  const playBlocked = async () => {
    if (!blockedBlob) return;
    await voice.playBlob(blockedBlob);
    setBlockedBlob(null);
  };

  // A navigate action (e.g. "Add Buyer Assistance") opens a full app page instead
  // of POSTing. End any voice session, route with the prefill carried in
  // location.state, then CLOSE the panel so the form isn't hidden behind it. The
  // chat (messages + this button) is persisted to sessionStorage, so tapping the
  // floating button later reopens it exactly where the user left off.
  //
  // `a.navigate` already carries the phone segment the app's routes expect
  // (/buyer-assistance/:phoneNumber, /add-property/:phoneNumber) — the backend
  // builds it from the VERIFIED session phone, so it is not taken from the client.
  const openNavAction = (a) => {
    if (!a || !a.navigate) return;
    stopVoiceMode();
    const phoneNumber = localStorage.getItem('phoneNumber') || '';
    navigate(a.navigate, { state: { phoneNumber, prefill: a.prefill || {} } });
    setOpen(false);
  };

  // Opening a result card routes to the property detail page. End any voice
  // session and CLOSE the panel so the details aren't hidden behind it (same
  // rationale as openNavAction). The chat is persisted to sessionStorage, so
  // tapping the floating button reopens it exactly where the user left off.
  const openDetail = (ppcId) => {
    if (ppcId == null) return;
    stopVoiceMode();
    const phoneNumber = localStorage.getItem('phoneNumber') || '';
    navigate(`/detail/${ppcId}`, { state: { phoneNumber } });
    setOpen(false);
  };

  const inputPlaceholder = voice.isRecording ? t.listen : t.placeholder;

  return (
    <>
      {!open && (
        <button className="ppc-fab" aria-label="Open AI assistant" onClick={() => { voice.unlockAudio(); setOpen(true); }}>
          {/* White sparkle on solid teal — Flutter's Icons.auto_awesome FAB. */}
          <svg className="ppc-fab-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2.5c.6 4.3 2.2 5.9 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.6 5.9-2.2 6.5-6.5Z" fill="#fff" />
            <path d="M18.4 14c.25 1.7.85 2.3 2.6 2.5-1.75.2-2.35.8-2.6 2.5-.2-1.7-.8-2.3-2.5-2.5 1.7-.2 2.3-.8 2.5-2.5Z" fill="#fff" opacity=".9" />
          </svg>
        </button>
      )}

      {open && (
        <>
        {/* Dark scrim behind the sheet; tapping it closes (Flutter's Positioned.fill). */}
        <div className="ppc-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
        <div className="ppc-panel" role="dialog" aria-label={t.title}>
          <div className="ppc-head">
            <div className="ppc-head-title">{t.title}</div>
            <div className="ppc-head-tools">
              <button className={`ppc-ic ${lang === 'ta' ? 'on' : ''}`} title="Language" onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}>{lang === 'en' ? 'EN' : 'த'}</button>
              <button className={`ppc-ic ${speakerOn ? 'on' : ''}`} title="Voice replies" onClick={() => { voice.unlockAudio(); setSpeakerOn((s) => !s); }}>{speakerOn ? '🔊' : '🔈'}</button>
              <button className="ppc-ic" title="Reset" onClick={() => { reset(); firstScroll.current = true; try { sessionStorage.removeItem('ppc_assist_scroll'); } catch {} }}>↺</button>
              <button className="ppc-ic ppc-close" title="Close" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          <div className="ppc-body" ref={scrollRef} onScroll={(e) => ss.set('ppc_assist_scroll', e.currentTarget.scrollTop)}>
            {messages.length === 0 && (
              <div className="ppc-hi">
                {hi}
                <div className="ppc-hi-mic">🎤 {t.micHint}</div>
              </div>
            )}

            {/* Centered AI-assistant voice call-to-action */}
            {!voiceMode && messages.length === 0 && voice.supported && (
              <div className="ppc-callcta">
                <span className="ppc-aibtn-wrap">
                  <button className="ppc-aibtn" onClick={startVoiceMode} aria-label={t.callStart}>
                    <span className="ppc-aibtn-core">
                      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 2.5c.6 4.3 2.2 5.9 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.6 5.9-2.2 6.5-6.5Z" fill="#fff" />
                        <path d="M18.4 14c.25 1.7.85 2.3 2.6 2.5-1.75.2-2.35.8-2.6 2.5-.2-1.7-.8-2.3-2.5-2.5 1.7-.2 2.3-.8 2.5-2.5Z" fill="#fff" opacity=".9" />
                      </svg>
                    </span>
                  </button>
                  <span className="ppc-tapfinger" aria-hidden="true">👆</span>
                </span>
                <div className="ppc-callcta-label">{t.pressToChat}</div>
                <div className="ppc-callcta-hint">{t.callHint}</div>
              </div>
            )}

            {/* AI chat stream */}
            {messages.map((m) => (
              <div key={m.id} className={`ppc-msg ppc-${m.role}`}>
                {m.content && <div className="ppc-bubble">{m.content}{m.streaming ? <span className="ppc-caret" /> : null}</div>}
                {m.cards && m.cards.length > 0 && (
                  <div className="ppc-cards">
                    {m.cards.map((c, i) => (
                      <ResultCard key={`${m.id}-c${i}`} card={c} t={t} onOpen={openDetail} />
                    ))}
                  </div>
                )}
                {m.actions && m.actions.map((a, i) => (
                  <div key={`${m.id}-a${i}`} className={`ppc-action ${a.spendsMoney ? 'spend' : ''} ${a.navigate ? 'nav' : ''}`}>
                    <div className="ppc-action-txt">
                      <div className="ppc-action-label">{a.label}</div>
                      {a.summary && <div className="ppc-action-sum">{a.summary}</div>}
                      {a.spendsMoney && <div className="ppc-action-warn">⚠ {t.spend}</div>}
                    </div>
                    {a.navigate ? (
                      // Navigate action (Add Buyer Assistance / Add Property / Buy Points)
                      // → open the app page. Label comes from the proposal's cta key so
                      // each action reads correctly.
                      <button className="ppc-chip nav" onClick={() => openNavAction(a)}>{t[a.cta] || a.label}</button>
                    ) : a.state === 'done' ? (
                      <span className="ppc-chip done">{t.sent}</span>
                    ) : a.state === 'error' ? (
                      <span className="ppc-chip err">✕ {a.error || 'failed'}</span>
                    ) : (
                      <button className="ppc-chip" disabled={a.state === 'working'} onClick={() => confirm(m.id, i)}>
                        {a.state === 'working' ? '…' : t.confirm}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {blockedBlob && <button className="ppc-tapplay" onClick={playBlocked}>{t.tapPlay}</button>}
          </div>

          {voiceMode && (
            <div className={`ppc-voicebar ${voiceStatus === 'listening' ? 'listening' : ''}`}>
              <span className="ppc-voicebar-dot" />
              <span>{voiceStatus === 'speaking' ? t.voiceSpeak : voiceStatus === 'thinking' ? t.voiceThink : t.voiceListen}</span>
              <button className="ppc-voicebar-end" onClick={stopVoiceMode}>{t.callEnd} ✕</button>
            </div>
          )}

          <div className="ppc-input">
            {voice.supported && (
              <button className={`ppc-mic ${voiceMode ? 'rec' : ''}`} title={voiceMode ? t.callEnd : t.callStart} onClick={() => (voiceMode ? stopVoiceMode() : startVoiceMode())}>
                {voiceMode ? '⏹' : '🎤'}
              </button>
            )}
            <input
              className="ppc-text"
              value={input}
              placeholder={inputPlaceholder}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitText(input); }}
              disabled={busy}
            />
            {/* Greyed only while busy, never on empty input (submitText already
                no-ops on blank text). */}
            <button className="ppc-send" onClick={() => submitText(input)} disabled={busy}>➤</button>
          </div>
        </div>
        </>
      )}
    </>
  );
}
