// WhatsApp replies, in the header of every admin page — ported from
// PM_Matri_Admin's layouts/main.php "waAlert" dropdown.
//
// Chats answers "what did they say"; this answers the question before it —
// "has anybody written?" — from wherever somebody happens to be working. A
// reply nobody notices for a day is a person who rang the office instead.
//
// GATED, AND IT FAILS CLOSED. The dropdown carries customers' numbers and
// what they wrote, so it shows only to a role allowed "SG Chats" — the same
// key as the Chats page — and stays hidden until that is known (unlike the
// Sidebar's can(), which defaults open while loading: right for a menu that
// would flicker, wrong for a panel that would flash customer messages). The
// polling sits in an inner component, so a denied role never polls at all.
//
// Quiet about its own troubles: no token, an expired session or a bad minute
// at SmartGrowth come back as "nothing to report", never as an error banner.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaWhatsapp } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { sgGet } from './sgApi';
import { fmtWhen, fmtPhone } from './common';
import './sg.css';

const PERMISSION_KEY = 'SG Chats';
const POLL_MS = 15000;
// Its own toast container: the admin has no global one (pages mount their own),
// and a toast carrying this id shows only here — never doubled in a page's.
const TOAST_ID = 'sg-reply-alert';

const looksJson = (s) => /^\s*[{[]/.test(String(s || ''));

function previewOf(t) {
  const type = String(t.type || '').toLowerCase();
  if (type === 'template') return 'Template message';
  const body = String(t.preview || '').trim();
  if (looksJson(body)) return '📝 Form reply';
  if (type && !['text', 'button', 'interactive'].includes(type)) return (type === 'image' ? 'Photo' : type) + (body ? ' · ' + body : '');
  return body.length > 70 ? body.slice(0, 70) + '…' : body;
}

function allowedFrom(perms, role) {
  if (!Array.isArray(perms) || !role) return false;
  const rp = perms.find((p) => p.role === role);
  return !!(rp && Array.isArray(rp.viewedFiles) && rp.viewedFiles.map((f) => String(f).trim()).includes(PERMISSION_KEY));
}

function AlertInner() {
  const navigate = useNavigate();
  const [data, setData] = useState({ unread: 0, threads: [], newest: '' });
  const newestRef = useRef(null);          // null until the first poll has been seen
  const inflight = useRef(false);

  const poll = useCallback(async () => {
    if (inflight.current || document.hidden) return;
    inflight.current = true;
    try {
      const d = await sgGet('/chat-alerts');
      const next = { unread: Number(d.unread) || 0, threads: Array.isArray(d.threads) ? d.threads : [], newest: d.newest || '' };
      // A toast only for something newer than what was already on screen —
      // never for the backlog that was there when the page opened.
      if (newestRef.current !== null && next.newest && next.newest > newestRef.current && next.threads[0]) {
        const t = next.threads[0];
        toast.success('💬 New WhatsApp reply from ' + (t.name || fmtPhone(t.phone)) + (t.preview && !looksJson(t.preview) ? ': ' + String(t.preview).slice(0, 60) : ''), {
          containerId: TOAST_ID,
          onClick: () => navigate('/dashboard/sg-chats?chat=' + encodeURIComponent(t.phone)),
        });
      }
      if (newestRef.current === null || (next.newest && next.newest > newestRef.current)) newestRef.current = next.newest || '';
      setData(next);
    } catch (_) {
      // Deliberately silent — this runs on every page.
    } finally {
      inflight.current = false;
    }
  }, [navigate]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [poll]);

  const open = (phone) => navigate('/dashboard/sg-chats' + (phone ? '?chat=' + encodeURIComponent(phone) : ''));

  return (
    <>
    <ToastContainer containerId={TOAST_ID} position="bottom-right" autoClose={8000} newestOnTop />
    <Dropdown align="end" className="me-2">
      <Dropdown.Toggle as="button" className="sg-alert-btn" bsPrefix="sg-alert-toggle" title="WhatsApp replies">
        <FaWhatsapp />
        {data.unread > 0 && <span className="sg-unread">{data.unread > 99 ? '99+' : data.unread}</span>}
      </Dropdown.Toggle>
      <Dropdown.Menu className="sg-alert-menu">
        <div className="sg-alert-head">
          WhatsApp replies{data.unread > 0 ? ' · ' + data.unread + ' unread' : ''}
        </div>
        {data.threads.length === 0 && <div className="sg-alert-row sg-mini" style={{ cursor: 'default' }}>No unread replies.</div>}
        {data.threads.map((t) => (
          <div key={t.phone} className="sg-alert-row" onClick={() => open(t.phone)}>
            <div className="d-flex justify-content-between gap-2">
              <b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name || fmtPhone(t.phone)}</b>
              <span className="sg-mini" style={{ whiteSpace: 'nowrap' }}>{fmtWhen(t.when)}</span>
            </div>
            <div className="sg-mini d-flex justify-content-between gap-2">
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewOf(t)}</span>
              {t.unread > 0 && <span className="sg-unread">{t.unread}</span>}
            </div>
          </div>
        ))}
        <div className="sg-alert-foot"><a href="#open-chats" onClick={(e) => { e.preventDefault(); open(''); }}>Open Chats</a></div>
      </Dropdown.Menu>
    </Dropdown>
    </>
  );
}

export default function SgReplyAlert() {
  const reduxRole = useSelector((state) => (state.admin ? state.admin.role : null));
  const role = reduxRole || (() => { try { return localStorage.getItem('adminRole'); } catch (_) { return null; } })();
  const [allowed, setAllowed] = useState(false);   // closed until known

  useEffect(() => {
    const readCache = () => {
      try {
        const cached = localStorage.getItem('rolePermissions');
        setAllowed(cached ? allowedFrom(JSON.parse(cached), role) : false);
      } catch (_) {
        setAllowed(false);
      }
    };
    readCache();
    // Real-time, when Roles & Access changes a permission (same event Sidebar.jsx listens to).
    const onUpdate = (e) => setAllowed(allowedFrom(e.detail, role));
    window.addEventListener('permissionsUpdated', onUpdate);
    // The Sidebar refreshes the cache from the server without an event; look again now and then.
    const id = setInterval(readCache, 30000);
    return () => { window.removeEventListener('permissionsUpdated', onUpdate); clearInterval(id); };
  }, [role]);

  if (!allowed) return null;
  return <AlertInner />;
}
