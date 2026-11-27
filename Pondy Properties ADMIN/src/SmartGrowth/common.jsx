// Shared pieces for every SmartGrowth screen: the page shell with its
// "connected?" banner, status pills, tiles, a pager, and the two loaders
// nearly every page needs (the panel's config, the template library).

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { sgGet } from './sgApi';
import './sg.css';

/** India time, the office's clock — not the browser's. */
export function fmtWhen(v, withYear = false) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', ...(withYear ? { year: 'numeric' } : {}),
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export const fmtNum = (n) => (Number(n) || 0).toLocaleString('en-IN');

/** "+91 98765 43210" for a stored 91XXXXXXXXXX. */
export function fmtPhone(p) {
  const d = String(p || '').replace(/\D+/g, '');
  if (d.length === 12 && d.startsWith('91')) return '+91 ' + d.slice(2, 7) + ' ' + d.slice(7);
  if (d.length === 10) return '+91 ' + d.slice(0, 5) + ' ' + d.slice(5);
  return p ? '+' + d : '';
}

export function StatusPill({ status }) {
  const s = String(status || '').toLowerCase().split(/[\s_]/)[0];
  if (!s) return null;
  return <span className={'sg-st ' + s}>{status}</span>;
}

export function CatBadge({ category }) {
  const c = String(category || '').toUpperCase();
  if (!c) return null;
  return <span className={'sg-cat ' + c} title={c === 'MARKETING' ? 'Charged at the higher marketing rate' : c}>{c}</span>;
}

/** { type: 'success'|'danger'|'warning'|'info', text } -> an Alert. */
export function Msg({ msg, onClose }) {
  if (!msg || !msg.text) return null;
  return (
    <Alert variant={msg.type || 'info'} className="py-2 px-3 mb-2" dismissible={!!onClose} onClose={onClose}
      style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
      {msg.text}
    </Alert>
  );
}

export function Tiles({ items }) {
  return (
    <div className="sg-tiles">
      {items.filter(Boolean).map((t, i) => (
        <div key={i} className={'sg-tile ' + (t.kind || '') + (t.onClick ? ' click' : '') + (t.on ? ' on' : '')} onClick={t.onClick} title={t.title}>
          <div className="n">{typeof t.n === 'number' ? fmtNum(t.n) : t.n}</div>
          <div className="l">{t.l}</div>
        </div>
      ))}
    </div>
  );
}

export function Pager({ page, pages, onPage, total, busy }) {
  if (!pages || pages <= 1) return total !== undefined ? <div className="sg-mini mt-2">{fmtNum(total)} in all</div> : null;
  return (
    <div className="d-flex align-items-center gap-2 mt-2 sg-mini">
      <Button size="sm" variant="outline-secondary" disabled={busy || page <= 1} onClick={() => onPage(page - 1)}>‹ Prev</Button>
      <span>Page {page} of {pages}{total !== undefined ? ` · ${fmtNum(total)} in all` : ''}</span>
      <Button size="sm" variant="outline-secondary" disabled={busy || page >= pages} onClick={() => onPage(page + 1)}>Next ›</Button>
    </div>
  );
}

export const Busy = ({ text = 'Loading…' }) => (
  <div className="sg-mini d-flex align-items-center gap-2 my-2"><Spinner size="sm" animation="border" /> {text}</div>
);

// ── Loaders ────────────────────────────────────────────────────────────────

/** The panel's config: connected?, token mask, API code, runner. `skip` when the page already has it. */
export function useSgConfig(skip = false) {
  const [cfg, setCfg] = useState(null);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    try { setCfg(await sgGet('/config')); setError(''); }
    catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { if (!skip) reload(); }, [reload, skip]);
  return { cfg, error, reload, setCfg };
}

// The template library, shared by every screen for a minute: the Send page,
// Chats' template dialog and the bot forms must agree about what exists.
let tplCache = null;
let tplAt = 0;
let tplInflight = null;

export function useTemplates() {
  const [state, setState] = useState({ templates: tplCache || [], loading: !tplCache, error: '' });
  const reload = useCallback(async (fresh = true) => {
    if (!fresh && tplCache && Date.now() - tplAt < 60000) { setState({ templates: tplCache, loading: false, error: '' }); return; }
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      tplInflight = tplInflight || sgGet('/templates');
      const d = await tplInflight;
      tplCache = d.templates || [];
      tplAt = Date.now();
      setState({ templates: tplCache, loading: false, error: '' });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    } finally {
      tplInflight = null;
    }
  }, []);
  useEffect(() => { reload(false); }, [reload]);
  return { ...state, reload };
}

// ── The page shell ─────────────────────────────────────────────────────────

/** Connected or not — the first thing every page says. */
export function ConnBanner({ cfg, error }) {
  if (error) return <div className="sg-banner bad"><div><span className="sg-ban-title">Could not reach the server</span>{error}</div></div>;
  if (!cfg) return null;
  if (cfg.configured)
    return (
      <div className="sg-banner ok">
        <div>
          <span className="sg-ban-title">Connected to SmartGrowth</span>
          API code <span className="sg-mono">{cfg.apiCode}</span>, token {cfg.tokenMask}
          {cfg.tokenFromEnv ? ' (from the server .env)' : ''}.
        </div>
      </div>
    );
  return (
    <div className="sg-banner warn">
      <div>
        <span className="sg-ban-title">Not connected yet</span>
        Enter your SmartGrowth <b>API token</b> and <b>API code</b> under <b>More Info</b> on{' '}
        <Link to="/dashboard/sg-send">Send Message</Link>. Nothing on this page can reach the account until they are saved.
      </div>
    </div>
  );
}

export function SgPage({ title, sub, right, banner = true, cfgState, children }) {
  const own = useSgConfig(!!cfgState || !banner);
  const st = cfgState || own;
  return (
    <div className="sg-page">
      <div className="sg-head">
        <div>
          <h2>{title}</h2>
          {sub && <div className="sg-sub">{sub}</div>}
        </div>
        {right && <div className="sg-head-right">{right}</div>}
      </div>
      {banner && <ConnBanner cfg={st.cfg} error={st.error} />}
      {children}
    </div>
  );
}

/** The Report button most pages carry, opening Campaign Report pre-filtered. */
export const ReportLink = ({ query = '' }) => (
  <Link className="btn btn-sm btn-outline-success" to={'/dashboard/sg-report' + (query ? '?' + query : '')}>📊 Report</Link>
);

/** Save a text/blob response as a file. */
export function downloadUrl(url) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
