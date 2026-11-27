// Communication > WhatsApp > Chats — ported from PM_Matri_Admin's
// whatsapp/index (tab 'chats').
//
// The inbox, laid out like WhatsApp because that is the shape everyone reading
// it already knows. A campaign is one message to a list; what comes BACK is a
// conversation, and until now reading it meant signing in to SmartGrowth's own
// dashboard. Reading costs nothing; replying sends a real message.
//
// Which side a bubble goes on is decided on the server (`mine`) — an inbound
// message carries a status of its own, so sides read off that would scatter
// the other person's replies onto ours.
//
// A typed reply only reaches them inside Meta's 24-hour window; outside it the
// Template button sends an approved template, which has no window. Both states
// are said out loud, and the box stays usable either way — the window is
// Meta's to judge, and what it says if we are wrong is printed under the bubble.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Form, Modal } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { sgGet, sgPost, sgUpload } from './sgApi';
import { SgPage, Msg, Busy, ReportLink, StatusPill, fmtWhen, fmtPhone, useTemplates } from './common';
import { TemplatePicker, TemplatePreview, HeaderMediaBox, VarInputs, MEDIA_FORMATS } from './TemplateBits';

const LIST_POLL_MS = 20000;
const THREAD_POLL_MS = 15000;
const PHOTO_MAX = 5 * 1024 * 1024;
const MEDIA_TYPES = ['image', 'video', 'audio', 'voice', 'document', 'sticker'];

const adminName = () => { try { return localStorage.getItem('adminName') || ''; } catch (_) { return ''; } };

/** WhatsApp says Photo, not Image, and so does everyone using this. */
function mediaWord(type) {
  const t = String(type || '').toLowerCase();
  return { image: 'Photo', audio: 'Voice message', voice: 'Voice message', video: 'Video', document: 'Document', sticker: 'Sticker', location: 'Location' }[t]
    || (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');
}

const looksJson = (s) => /^\s*[{[]/.test(String(s || ''));

/** The one line under a name. A template's own wording is ours, not theirs, and three lines long. */
function previewOf(t) {
  const type = String(t.type || '').toLowerCase();
  if (type === 'template') return 'Template message';
  const body = String(t.preview || '').trim();
  if (type === 'interactive' || type === 'button') return looksJson(body) ? '📝 Form reply' : (body || t.phone);
  if (type && type !== 'text') return mediaWord(type) + (body ? ' · ' + body : '');
  return looksJson(body) ? '📝 Form reply' : (body || t.phone);
}

/** India date of a message, for the day separators. */
const dayKey = (v) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtTime = (v) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
};

/** "3h 24m", rounded down so it never promises time already gone. */
function leftFor(seconds) {
  const s = Number(seconds) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return h + 'h ' + m + 'm';
  if (m > 0) return m + 'm';
  return 'less than a minute';
}

/** Meta's word on our own bubbles, as the ticks everyone already reads. */
function Tick({ status }) {
  const st = String(status || '').toLowerCase();
  if (st === 'read') return <span title="Read" style={{ color: '#34B7F1', fontWeight: 700 }}>✓✓</span>;
  if (st === 'delivered') return <span title="Delivered">✓✓</span>;
  if (st === 'sent') return <span title="Sent">✓</span>;
  if (st === 'failed' || st === 'cancelled') return <span title={st} style={{ color: '#a12626', fontWeight: 700 }}>✗</span>;
  if (st) return <span title={st}>🕓</span>;
  return null;
}

/** What kind of message this was, when it was not somebody typing. */
function msgTag(m) {
  const t = String(m.type || '').toLowerCase();
  if (t === 'template') return 'Template' + (m.template ? ' · ' + m.template : '') + (m.campaign ? ' · ' + m.campaign : '');
  if (t === 'button' || t === 'interactive') return 'Tapped a button' + (m.campaign ? ' · ' + m.campaign : '');
  return '';
}

/** Fold the newest page into what is on screen — keeps earlier pages, updates ticks. */
function merge(old, incoming) {
  const byId = new Map(old.map((m) => [m.id, m]));
  let changed = false;
  const out = old.slice();
  for (const m of incoming) {
    const o = byId.get(m.id);
    if (o) {
      if (o.status !== m.status || o.error !== m.error || o.media !== m.media) {
        out[out.indexOf(o)] = { ...o, status: m.status, error: m.error, media: m.media || o.media };
        changed = true;
      }
    } else {
      out.push(m);
      byId.set(m.id, m);
      changed = true;
    }
  }
  if (changed) out.sort((a, b) => String(a.cursor).localeCompare(String(b.cursor)));
  return changed ? out : old;
}

// ── The bubble ─────────────────────────────────────────────────────────────

function Bubble({ m, tplBody }) {
  const type = String(m.type || '').toLowerCase();
  const tag = msgTag(m);
  let content;
  if (MEDIA_TYPES.includes(type)) {
    const caption = m.body ? <div>{m.body}</div> : null;
    if (m.media && (type === 'image' || type === 'sticker')) content = <><a href={m.media} target="_blank" rel="noopener noreferrer"><img className="sg-m-img" src={m.media} alt={m.body || mediaWord(type)} loading="lazy" /></a>{caption}</>;
    else if (m.media && type === 'video') content = <><video className="sg-m-img" src={m.media} controls preload="metadata" />{caption}</>;
    else if (m.media && (type === 'audio' || type === 'voice')) content = <><audio src={m.media} controls preload="metadata" />{caption}</>;
    else if (m.media) content = <><a href={m.media} target="_blank" rel="noopener noreferrer">📄 {m.mediaName || mediaWord(type)}</a>{caption}</>;
    else content = (
      <>
        <div className="sg-b-media" style={{ padding: '10px 6px' }}>
          {type === 'video' ? '🎬' : type === 'audio' || type === 'voice' ? '🎤' : type === 'document' ? '📄' : '📷'} {mediaWord(type)}
          <div className="sg-mini">{m.mine ? 'Sent from somewhere that kept no copy of it.' : 'SmartGrowth sent no link for this one.'}</div>
        </div>
        {caption}
      </>
    );
  } else {
    let body = String(m.body || '');
    if (!body && type === 'template') body = tplBody || '…';
    if (looksJson(body) && (type === 'interactive' || type === 'button')) {
      // A WhatsApp form's answers arrive as JSON — shown as label: value lines.
      try {
        const o = JSON.parse(body);
        body = Object.entries(o).filter(([k]) => k !== 'flow_token').map(([k, v]) => k.replace(/_/g, ' ') + ': ' + (typeof v === 'object' ? JSON.stringify(v) : v)).join('\n');
      } catch (_) { /* not JSON after all — shown as it came */ }
    }
    content = <div>{body}</div>;
  }
  return (
    <div className={'sg-msg' + (m.mine ? ' mine' : '')}>
      <div className="sg-bubble">
        {tag && <div className="sg-mini" style={{ fontWeight: 600, marginBottom: 3 }}>{tag}</div>}
        {content}
        {m.error && <div className="sg-m-err">⚠ {m.error}</div>}
        <div className="sg-m-meta">{fmtTime(m.when)} {m.mine && <Tick status={m.status} />}</div>
      </div>
    </div>
  );
}

// ── Template into this thread ──────────────────────────────────────────────

function TemplateModal({ show, onHide, phone, name, tpl, onSent }) {
  const [t, setT] = useState(null);
  const [vars, setVars] = useState([]);
  const [head, setHead] = useState({ mediaUrl: '', fileName: '', headerParams: [] });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (show) { setMsg(null); } }, [show]);
  const pick = (x) => { setT(x); setVars([]); setHead({ mediaUrl: '', fileName: '', headerParams: [] }); setMsg(null); };
  const send = async () => {
    if (!t) { setMsg({ type: 'warning', text: 'Choose a template first.' }); return; }
    if (MEDIA_FORMATS.includes(String(t.headerFormat || '').toUpperCase()) && !head.mediaUrl) {
      setMsg({ type: 'warning', text: 'This template opens with a ' + String(t.headerFormat).toLowerCase() + '. Upload the file or paste its public link.' });
      return;
    }
    if (t.variableCount && vars.filter((v) => String(v || '').trim()).length < t.variableCount) {
      setMsg({ type: 'warning', text: 'Fill every {{n}} value — WhatsApp refuses a template with a blank left empty.' });
      return;
    }
    setBusy(true); setMsg(null);
    try {
      const d = await sgPost('/chats/send-template', {
        phone, templateId: t.id, templateName: t.name, variables: vars,
        mediaUrl: head.mediaUrl, fileName: head.fileName, headerParams: head.headerParams,
      });
      onSent(d.message);
      pick(null);
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton><Modal.Title as="h5">📄 Send a template</Modal.Title></Modal.Header>
      <Modal.Body>
        <div className="sg-help">
          An approved template reaches them at any time, with no 24-hour window. It is a real WhatsApp message, it spends a credit,
          and it is filed in <b>Recent Campaigns</b> like any other send.
        </div>
        <div className="sg-mini mb-2">To <b>{name || fmtPhone(phone)}</b> {name ? '(' + fmtPhone(phone) + ')' : ''}</div>
        {tpl.loading && <Busy text="Loading templates…" />}
        {tpl.error && <Msg msg={{ type: 'danger', text: tpl.error }} />}
        <Form.Group className="mb-2">
          <Form.Label className="mb-1">Template</Form.Label>
          <TemplatePicker templates={tpl.templates} value={t && t.id} onChange={pick} />
        </Form.Group>
        {t && <TemplatePreview t={t} vars={vars} headerVar={(head.headerParams || [])[0]} mediaUrl={head.mediaUrl} />}
        <div className="mt-2"><HeaderMediaBox t={t} value={head} onChange={setHead} /></div>
        <VarInputs t={t} values={vars} onChange={setVars} />
        <Msg msg={msg} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button variant="success" disabled={busy || !t} onClick={send}>{busy ? 'Sending…' : '🟢 Send template'}</Button>
      </Modal.Footer>
    </Modal>
  );
}

// ── The page ───────────────────────────────────────────────────────────────

export default function SgChats() {
  const [params] = useSearchParams();
  const tpl = useTemplates();

  // Threads
  const [threads, setThreads] = useState([]);
  const [listBusy, setListBusy] = useState(true);
  const [listErr, setListErr] = useState('');
  const [q, setQ] = useState('');
  const [qLive, setQLive] = useState('');
  const listInflight = useRef(false);
  const readRef = useRef({});              // a thread opened here is a thread read
  const openWanted = useRef(String(params.get('chat') || '').replace(/\D+/g, ''));
  const openThreadRef = useRef(null);      // the list opens a ?chat= thread through this

  // The open conversation
  const [cur, setCur] = useState(null);    // { phone, name }
  const [msgs, setMsgs] = useState([]);
  const [info, setInfo] = useState(null);  // window / who / hasMore from the last thread call
  const [threadBusy, setThreadBusy] = useState(false);
  const [threadErr, setThreadErr] = useState('');
  const [olderBusy, setOlderBusy] = useState(false);
  const threadInflight = useRef(false);
  const curRef = useRef(null);
  const bodyRef = useRef(null);
  const scrollPlan = useRef(null);         // 'bottom' | { keepFrom: height, top }

  // Compose
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);       // { file, url }
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);
  const [tplOpen, setTplOpen] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { curRef.current = cur; }, [cur]);

  // ── the list ──
  const loadThreads = useCallback(async (quiet) => {
    if (listInflight.current) return;
    listInflight.current = true;
    if (!quiet) setListBusy(true);
    try {
      const d = await sgGet('/chats', { q: qLive });
      setThreads(d.rows || []);
      setListErr('');
      // Arrived with ?chat=… — opened straight away, and honoured even when
      // SmartGrowth does not list that thread: "no messages yet" beats silence.
      if (openWanted.current) {
        const want = openWanted.current;
        openWanted.current = '';
        const hit = (d.rows || []).find((t) => t.phone === want || t.phone.endsWith(want));
        if (openThreadRef.current) openThreadRef.current(hit || { phone: want.length === 10 ? '91' + want : want, name: '' });
      }
    } catch (e) {
      if (!quiet) setListErr(e.message);
    } finally {
      listInflight.current = false;
      setListBusy(false);
    }
  }, [qLive]);

  useEffect(() => { const id = setTimeout(() => setQLive(q.trim()), 400); return () => clearTimeout(id); }, [q]);
  useEffect(() => { loadThreads(false); }, [loadThreads]);
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) loadThreads(true); }, LIST_POLL_MS);
    return () => clearInterval(id);
  }, [loadThreads]);

  // ── one conversation ──
  // In flight per number: a quiet poll of the last thread must not stop the
  // one just clicked from loading.
  const loadThread = useCallback(async (phone, { quiet = false, toBottom = false } = {}) => {
    if (!phone || threadInflight.current === phone) return;
    threadInflight.current = phone;
    if (!quiet) { setThreadBusy(true); setThreadErr(''); }
    const b = bodyRef.current;
    const wasBottom = !b || b.scrollTop + b.clientHeight >= b.scrollHeight - 50;
    try {
      const d = await sgGet('/chats/thread', { phone });
      if (!curRef.current || curRef.current.phone !== phone) return;   // moved on meanwhile
      setInfo(d);
      if (d.name) setCur((c) => (c && c.phone === phone && !c.name ? { ...c, name: d.name } : c));
      setMsgs((old) => {
        const next = merge(old, d.messages || []);
        if (next !== old && (toBottom || wasBottom)) scrollPlan.current = 'bottom';
        return next;
      });
      if (toBottom) scrollPlan.current = 'bottom';
    } catch (e) {
      if (!quiet && curRef.current && curRef.current.phone === phone) setThreadErr(e.message);
    } finally {
      if (threadInflight.current === phone) threadInflight.current = null;
      if (curRef.current && curRef.current.phone === phone) setThreadBusy(false);
    }
  }, []);

  const openThread = useCallback((t) => {
    readRef.current[t.phone] = true;
    setCur({ phone: t.phone, name: t.name || '' });
    curRef.current = { phone: t.phone, name: t.name || '' };
    setMsgs([]);
    setInfo(null);
    setMsg(null);
    // A photo staged for one person must not go to whoever is on screen next.
    setPhoto(null);
    setText('');
    setThreadErr('');
    loadThread(t.phone, { toBottom: true });
  }, [loadThread]);
  openThreadRef.current = openThread;

  useEffect(() => {
    if (!cur) return undefined;
    const id = setInterval(() => { if (!document.hidden) loadThread(cur.phone, { quiet: true }); }, THREAD_POLL_MS);
    return () => clearInterval(id);
  }, [cur, loadThread]);

  // Hold the reader where they were across redraws; go to the bottom only when asked.
  useEffect(() => {
    const b = bodyRef.current;
    const plan = scrollPlan.current;
    if (!b || !plan) return;
    scrollPlan.current = null;
    if (plan === 'bottom') b.scrollTop = b.scrollHeight;
    else if (plan.keepFrom !== undefined) b.scrollTop = plan.top + (b.scrollHeight - plan.keepFrom);
  }, [msgs]);

  const loadOlder = async () => {
    if (!cur || !msgs.length || olderBusy) return;
    setOlderBusy(true);
    const b = bodyRef.current;
    const keep = b ? { keepFrom: b.scrollHeight, top: b.scrollTop } : null;
    try {
      const d = await sgGet('/chats/thread', { phone: cur.phone, before: msgs[0].cursor });
      const have = new Set(msgs.map((m) => m.id));
      const add = (d.messages || []).filter((m) => !have.has(m.id));
      scrollPlan.current = keep;
      setMsgs((old) => add.concat(old));
      setInfo((i) => ({ ...(i || {}), hasMore: !!(d.hasMore && add.length) }));
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
    } finally {
      setOlderBusy(false);
    }
  };

  // Template wording for campaign bubbles that arrived with only the reference.
  const tplBodies = useMemo(() => {
    const m = {};
    for (const t of tpl.templates) { if (t.id) m[t.id] = t.bodyText; if (t.name) m['n:' + t.name.toLowerCase()] = t.bodyText; }
    return m;
  }, [tpl.templates]);
  const tplBodyFor = (m) => tplBodies[m.templateId] || tplBodies['n:' + String(m.template || '').toLowerCase()]
    || (tpl.loading ? '…' : '(this template’s wording is no longer on the account)');

  // ── sending ──
  const afterSend = (text2) => {
    setMsg(text2 ? { type: 'success', text: text2 } : null);
    if (cur) loadThread(cur.phone, { quiet: true, toBottom: true });
  };

  const pickPhoto = (file) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) { setMsg({ type: 'warning', text: 'WhatsApp carries JPG and PNG photos only.' }); return; }
    if (file.size > PHOTO_MAX) { setMsg({ type: 'warning', text: 'That photo is ' + (Math.round(file.size / 104857.6) / 10) + ' MB. WhatsApp carries images up to 5 MB — send a smaller copy.' }); return; }
    setMsg(null);
    setPhoto({ file, url: URL.createObjectURL(file) });
  };
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  const send = async () => {
    if (!cur || sending) return;
    const body = text.trim();
    if (!photo && !body) return;
    if (photo && body.length > 1024) { setMsg({ type: 'warning', text: 'A caption is limited to 1,024 characters; this one is ' + body.length + '.' }); return; }
    setSending(true); setMsg(null);
    try {
      if (photo) {
        const fd = new FormData();
        fd.append('phone', cur.phone);
        fd.append('caption', body);
        fd.append('profileName', adminName());
        fd.append('photo', photo.file, photo.file.name);
        await sgUpload('/chats/send-image', fd);
        setPhoto(null);
      } else {
        await sgPost('/chats/send', { phone: cur.phone, message: body, profileName: adminName() });
      }
      setText('');
      afterSend('');
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
      if (cur) loadThread(cur.phone, { quiet: true, toBottom: true });
    } finally {
      setSending(false);
    }
  };

  const toggleBlock = async () => {
    if (!cur || !info || !info.who) return;
    const blocking = !info.who.blocked;
    if (blocking && !window.confirm('Block ' + (cur.name || fmtPhone(cur.phone)) + '? No campaign, bot or action message will go to this number until it is unblocked.')) return;
    setBlockBusy(true);
    try {
      const d = await sgPost('/chats/block', { phone: cur.phone, block: blocking });
      setInfo((i) => ({ ...i, who: { ...i.who, blocked: d.blocked } }));
      setMsg({ type: 'success', text: d.message });
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
    } finally {
      setBlockBusy(false);
    }
  };

  const totalUnread = threads.reduce((a, t) => a + (readRef.current[t.phone] ? 0 : (Number(t.unread) || 0)), 0);
  const who = info && info.who;

  // Day separators, in India time.
  const rendered = [];
  let lastDay = '';
  for (const m of msgs) {
    const k = dayKey(m.when);
    if (k && k !== lastDay) { lastDay = k; rendered.push(<div key={'d' + k + m.id} className="sg-day"><span>{k}</span></div>); }
    rendered.push(<Bubble key={m.id || m.cursor} m={m} tplBody={String(m.type).toLowerCase() === 'template' && !m.body ? tplBodyFor(m) : ''} />);
  }

  return (
    <SgPage title="Chats" sub="Every conversation this WhatsApp number has had, newest first" right={<ReportLink query="src=chat" />}>
      <div className="sg-chat">
        <div className="sg-chat-list">
          <div className="sg-chat-search">
            <Form.Control size="sm" placeholder="Search name or number" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
            <Button size="sm" variant="outline-secondary" title="Refresh" onClick={() => loadThreads(false)}>⟳</Button>
          </div>
          <div className="sg-chat-threads">
            {listBusy && !threads.length && <div className="px-3"><Busy text="Loading conversations…" /></div>}
            {listErr && <div className="p-3 text-danger small">{listErr}</div>}
            {!listBusy && !listErr && !threads.length && (
              <div className="p-3 sg-mini">{qLive ? 'Nobody matches “' + qLive + '”.' : 'No conversations yet. Anyone who answers a campaign appears here.'}</div>
            )}
            {threads.map((t) => {
              const unread = readRef.current[t.phone] ? 0 : (Number(t.unread) || 0);
              return (
                <div key={t.phone} className={'sg-thread' + (cur && cur.phone === t.phone ? ' on' : '')} onClick={() => openThread(t)}>
                  <div className="sg-t-main">
                    <div className="sg-t-name">{t.name || fmtPhone(t.phone)}</div>
                    <div className="sg-t-prev">{previewOf(t)}</div>
                  </div>
                  <div className="sg-t-side">
                    <div>{fmtWhen(t.when)}</div>
                    {unread > 0 && <span className="sg-unread">{unread}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="sg-chat-foot">
            {threads.length} conversation{threads.length === 1 ? '' : 's'}{totalUnread ? ' · ' + totalUnread + ' unread' : ''}
          </div>
        </div>

        <div className="sg-chat-pane">
          {!cur && (
            <div className="sg-chat-body"><div className="sg-chat-empty"><div style={{ fontSize: 38 }}>💬</div><div>Pick a conversation on the left.</div></div></div>
          )}
          {cur && (
            <>
              <div className="sg-chat-head">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{cur.name || fmtPhone(cur.phone)}</div>
                  <div className="sg-mini">{fmtPhone(cur.phone)}</div>
                </div>
                {who && (
                  <div className="sg-mini" style={{ maxWidth: 420 }}>
                    {who.properties && who.properties.length > 0 && (
                      <div>🏠 {who.properties.slice(0, 4).map((p) => (
                        <span key={p.rentId} className="me-2">Rent ID <b>{p.rentId}</b> <StatusPill status={p.status} /></span>
                      ))}{who.properties.length > 4 ? '+' + (who.properties.length - 4) + ' more' : ''}</div>
                    )}
                    {who.tenant && <div>🔑 Tenant RA <b>{who.tenant.raId}</b> <StatusPill status={who.tenant.status} />{who.tenant.area ? ' · ' + who.tenant.area : ''}</div>}
                    {!(who.properties && who.properties.length) && !who.tenant && <div>Not a listed owner or tenant on Rent Pondy.</div>}
                  </div>
                )}
                {who && who.blocked && <Badge bg="danger">Blocked</Badge>}
                {who && (
                  <Button size="sm" variant={who.blocked ? 'outline-success' : 'outline-danger'} disabled={blockBusy} onClick={toggleBlock}
                    title={who.blocked ? 'Let campaigns and bots message this number again' : 'Stop every campaign, bot and action message to this number'}>
                    {who.blocked ? 'Unblock' : 'Block'}
                  </Button>
                )}
                <Button size="sm" variant="outline-secondary" title="Reload this conversation" onClick={() => loadThread(cur.phone, {})}>⟳</Button>
              </div>

              <div className="sg-chat-body" ref={bodyRef}>
                {threadBusy && !msgs.length && <div className="sg-chat-empty"><Busy text="Loading…" /></div>}
                {threadErr && <div className="text-danger small p-2">{threadErr}</div>}
                {!threadBusy && !threadErr && info && !msgs.length && (
                  <div className="sg-chat-empty"><div style={{ fontSize: 32 }}>🗨️</div><div>Nothing in this conversation yet.</div></div>
                )}
                {info && info.hasMore && msgs.length > 0 && (
                  <div className="text-center mb-2">
                    <Button size="sm" variant="light" disabled={olderBusy} onClick={loadOlder}>{olderBusy ? 'Loading…' : 'Load earlier messages'}</Button>
                  </div>
                )}
                {rendered}
              </div>

              {info && (info.windowOpen ? (
                <div className="sg-chat-warn" style={{ background: '#e8f8ee', borderTopColor: '#b8e6c8', color: '#1d5b35' }}>
                  ✓ You can reply in your own words for another <b>{leftFor(info.windowLeft)}</b>
                  {info.lastInbound ? ' — they last wrote ' + fmtWhen(info.lastInbound) : ''}.
                </div>
              ) : (
                <div className="sg-chat-warn">
                  🕓 {info.lastInbound ? 'They last wrote ' + fmtWhen(info.lastInbound) + ', more than ' + (info.windowHours || 24) + ' hours ago. ' : 'This contact has never written to us. '}
                  The 24-hour reply window is closed — only a template reaches them now; a typed message will almost certainly come back refused.
                  <Button size="sm" variant="warning" className="ms-2 py-0" onClick={() => setTplOpen(true)}>📄 Send a template instead</Button>
                </div>
              ))}
              <div className="px-2 pt-1"><Msg msg={msg} onClose={() => setMsg(null)} /></div>

              {photo && (
                <div className="sg-chat-photo">
                  <img src={photo.url} alt="" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sg-mini" style={{ fontWeight: 600 }}>{photo.file.name}</div>
                    <div className="sg-mini">Type a caption below if you want one.</div>
                  </div>
                  <Button size="sm" variant="outline-secondary" title="Don’t send this photo" onClick={() => setPhoto(null)}>✕</Button>
                </div>
              )}
              <div className="sg-chat-compose">
                <Button variant="outline-secondary" title="Send a photo — JPG or PNG, up to 5 MB" onClick={() => fileRef.current && fileRef.current.click()}>📎</Button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={(e) => pickPhoto(e.target.files[0])} />
                <Form.Control as="textarea" rows={2} value={text}
                  placeholder={photo ? 'Caption (optional) — Enter sends' : 'Type a reply — Enter sends, Shift+Enter starts a new line'}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
                <Button variant="outline-secondary" title="Send an approved template — no 24-hour limit" onClick={() => setTplOpen(true)}>📄 Template</Button>
                <Button variant="success" disabled={sending || (!text.trim() && !photo)} onClick={send}>{sending ? '…' : '➤ Send'}</Button>
              </div>
            </>
          )}
        </div>
      </div>

      {cur && (
        <TemplateModal show={tplOpen} onHide={() => setTplOpen(false)} phone={cur.phone} name={cur.name} tpl={tpl}
          onSent={(t) => { setTplOpen(false); afterSend(t); }} />
      )}
    </SgPage>
  );
}
