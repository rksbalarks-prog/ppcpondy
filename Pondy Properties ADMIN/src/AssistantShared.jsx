import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Button, Card, Modal, Spinner } from 'react-bootstrap';

// Shared pieces for the Workspace pages (My Assistant, AI Handled, …).

export const ASSISTANT_API = `${process.env.REACT_APP_API_URL}/assistant/admin`;

export const fmtDateTime = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');
export const errMsg = (e) => e?.response?.data?.error || e?.message || 'Request failed';

export function Kpi({ label, value, hint, color = '#1a73e8', onClick, active }) {
  return (
    <Card className="h-100 shadow-sm" role={onClick ? 'button' : undefined} onClick={onClick}
      style={{ border: active ? `2px solid ${color}` : '1px solid transparent' }}>
      <Card.Body>
        <div className="text-muted small">{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
        {hint && <div className="text-muted small">{hint}</div>}
      </Card.Body>
    </Card>
  );
}

export function Loading() {
  return <div className="text-center p-4"><Spinner animation="border" size="sm" /> Loading…</div>;
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center">
      <span>{error}</span>
      {onRetry && <Button size="sm" variant="outline-danger" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

// Chat transcript for one user. With `sessionId`, shows just that session first
// (with a toggle to see the user's other sessions).
export function TranscriptModal({ phone, sessionId, onHide }) {
  const [state, setState] = useState({ loading: false, error: '', messages: [] });
  const [showAll, setShowAll] = useState(!sessionId);

  useEffect(() => {
    if (!phone) return;
    setShowAll(!sessionId);
    let cancelled = false;
    setState({ loading: true, error: '', messages: [] });
    axios.get(`${ASSISTANT_API}/chat-history/${phone}/messages`)
      .then((res) => { if (!cancelled) setState({ loading: false, error: '', messages: res.data.messages || [] }); })
      .catch((e) => { if (!cancelled) setState({ loading: false, error: errMsg(e), messages: [] }); });
    return () => { cancelled = true; };
  }, [phone, sessionId]);

  const sessions = useMemo(() => {
    const out = [];
    for (const m of state.messages) {
      const last = out[out.length - 1];
      if (!last || last.sessionId !== m.sessionId) out.push({ sessionId: m.sessionId, items: [m] });
      else last.items.push(m);
    }
    return showAll || !sessionId ? out : out.filter((s) => s.sessionId === sessionId);
  }, [state.messages, showAll, sessionId]);

  const otherCount = sessionId
    ? new Set(state.messages.map((m) => m.sessionId).filter((s) => s !== sessionId)).size : 0;

  return (
    <Modal show={!!phone} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Chat with {phone}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: '#f5f7fb' }}>
        {state.loading && <Loading />}
        <ErrorBox error={state.error} />
        {!state.loading && !state.error && sessions.length === 0 && (
          <div className="text-muted text-center">No messages.</div>
        )}
        {sessions.map((s) => (
          <div key={s.sessionId} className="mb-4">
            <div className="text-center text-muted small mb-2">
              Session {String(s.sessionId).slice(-8)} · {fmtDateTime(s.items[0]?.at)}
            </div>
            {s.items.map((m, idx) => {
              const mine = m.role === 'user';
              return (
                <div key={idx} className={`d-flex mb-2 ${mine ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div style={{
                    maxWidth: '78%', whiteSpace: 'pre-wrap', padding: '8px 12px', borderRadius: 12,
                    background: mine ? '#1a73e8' : '#fff', color: mine ? '#fff' : '#212529',
                    boxShadow: '0 1px 2px rgba(0,0,0,.08)',
                  }}>
                    <div className="small" style={{ opacity: 0.75 }}>{mine ? 'User' : 'Assistant'} · {fmtDateTime(m.at)}</div>
                    {m.content}
                    {Array.isArray(m.actions) && m.actions.length > 0 && (
                      <div className="mt-1 small" style={{ opacity: 0.8 }}>
                        {m.actions.map((a, j) => <div key={j}>→ {a.label || a.tool}</div>)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {sessionId && otherCount > 0 && (
          <div className="text-center">
            <Button size="sm" variant="link" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show only this session' : `Show this user's other ${otherCount} session${otherCount > 1 ? 's' : ''}`}
            </Button>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button size="sm" variant="outline-secondary" href={`${ASSISTANT_API}/chat-history/${phone}/transcript`}>
          Download transcript
        </Button>
        <Button size="sm" variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

// Page-level permission check, same rule as the other admin pages: the admin's
// role must have `fileName` ticked in User Rolls. Also logs the view (/record-view).
// `children` is a function receiving the admin's name.
export function PermissionGate({ fileName, children }) {
  const reduxAdminName = useSelector((state) => state.admin?.name);
  const reduxAdminRole = useSelector((state) => state.admin?.role);
  const adminName = reduxAdminName || localStorage.getItem('adminName') || '';
  const adminRole = reduxAdminRole || localStorage.getItem('adminRole') || '';
  const [access, setAccess] = useState('checking'); // checking | allowed | denied

  useEffect(() => {
    if (!adminRole) { setAccess('denied'); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
        const perms = (res.data || []).find((p) => p.role === adminRole);
        const ok = (perms?.viewedFiles || []).map((f) => f.trim()).includes(fileName);
        if (!cancelled) setAccess(ok ? 'allowed' : 'denied');
      } catch (e) {
        if (!cancelled) setAccess('denied');
      }
    })();
    return () => { cancelled = true; };
  }, [adminRole, fileName]);

  useEffect(() => {
    if (access !== 'allowed' || !adminName) return;
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
      userName: adminName,
      role: adminRole,
      viewedFile: fileName,
      viewTime: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
    }).catch(() => {});
  }, [access, adminName, adminRole, fileName]);

  if (access === 'checking') return <Loading />;
  if (access === 'denied') {
    return (
      <div className="text-center text-danger fw-semibold mt-5">
        You don’t have access to {fileName}. Ask an admin to enable it for your role in User Rolls.
      </div>
    );
  }
  return children(adminName);
}
