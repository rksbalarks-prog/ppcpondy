import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Badge, Button, Col, Form, OverlayTrigger, Row, Table, Tooltip } from 'react-bootstrap';
import {
  ErrorBox, Kpi, Loading, PermissionGate, TranscriptModal, errMsg, fmtDateTime, fmtNum,
} from './AssistantShared';

/*
 * Hot Clients
 * -----------
 * People showing the strongest intent to buy or rent right now, ranked by a
 * score computed by GET /hot-clients from real activity (help requests, call
 * clicks, contact unlocks, interest, buyer requirements, untaken AI offers,
 * property views). Staff log each call's outcome via PUT /hot-clients/:phone/note.
 */

const API = process.env.REACT_APP_API_URL;
const PERIODS = [3, 7, 14, 30];
const TIERS = {
  hot: { label: 'Hot', bg: 'danger', color: '#dc2626' },
  warm: { label: 'Warm', bg: 'warning', color: '#d97706' },
  active: { label: 'Active', bg: 'secondary', color: '#6c757d' },
};
const STATUSES = {
  new: { label: 'Not called yet', bg: 'light' },
  called: { label: 'Called', bg: 'info' },
  interested: { label: 'Interested', bg: 'success' },
  not_interested: { label: 'Not interested', bg: 'secondary' },
  closed: { label: 'Closed / deal done', bg: 'dark' },
};
const DONE = new Set(['not_interested', 'closed']);
const ACTION_LABEL = {
  help: 'help', call: 'called', unlock: 'unlocked', contact: 'contacted',
  interest: 'interest', favorite: 'favourite', view: 'viewed',
};

const rupees = (v) => {
  const n = Number(v);
  if (!n) return '';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 ? 2 : 0)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 ? 1 : 0)} L`;
  return `₹${fmtNum(n)}`;
};
const requirementText = (r) => {
  if (!r) return '';
  const budget = r.minPrice && r.maxPrice ? `${rupees(r.minPrice)}–${rupees(r.maxPrice)}`
    : r.maxPrice ? `up to ${rupees(r.maxPrice)}` : r.minPrice ? `from ${rupees(r.minPrice)}` : '';
  return [r.bedrooms && `${r.bedrooms} BHK`, r.propertyType, r.propertyMode,
    [r.area, r.city].filter(Boolean).join(', '), budget].filter(Boolean).join(' · ');
};
const ago = (d) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${Math.max(m, 1)} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
};
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

function FollowUpCell({ client, adminName, onSaved }) {
  const [form, setForm] = useState({
    status: client.note.status, remark: client.note.remark || '', followUpDate: toDateInput(client.note.followUpDate),
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const dirty = form.status !== client.note.status || form.remark !== (client.note.remark || '')
    || form.followUpDate !== toDateInput(client.note.followUpDate);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await axios.put(`${API}/hot-clients/${client.phone}/note`, {
        status: form.status, remark: form.remark, followUpDate: form.followUpDate || null, updatedBy: adminName,
      });
      onSaved(client.phone, res.data.note);
      setMsg('Saved');
    } catch (e) {
      setMsg(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minWidth: 200 }}>
      <Form.Select size="sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} aria-label="Status">
        {Object.entries(STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
      </Form.Select>
      <Form.Control size="sm" className="mt-1" placeholder="Remark" value={form.remark}
        onChange={(e) => setForm({ ...form, remark: e.target.value })} />
      <div className="d-flex gap-1 mt-1 align-items-center">
        <Form.Control size="sm" type="date" value={form.followUpDate} title="Next follow-up date"
          onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
        <Button size="sm" variant={dirty ? 'success' : 'outline-secondary'} disabled={!dirty || saving} onClick={save}>
          {saving ? '…' : 'Save'}
        </Button>
      </div>
      {msg && <div className={`small ${msg === 'Saved' ? 'text-success' : 'text-danger'}`}>{msg}</div>}
      {client.note.updatedBy && !msg && (
        <div className="small text-muted">by {client.note.updatedBy}{client.note.updatedAt ? `, ${ago(client.note.updatedAt)}` : ''}</div>
      )}
    </div>
  );
}

function HotClientsPage({ adminName }) {
  const [days, setDays] = useState(7);
  const [state, setState] = useState({ loading: true, error: '', clients: [], total: 0, weights: {} });
  const [tier, setTier] = useState('');
  const [statusFilter, setStatusFilter] = useState('open'); // open | new | due | all
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await axios.get(`${API}/hot-clients`, { params: { days } });
      setState({ loading: false, error: '', clients: res.data.clients || [], total: res.data.total || 0, weights: res.data.weights || {} });
    } catch (e) {
      setState({ loading: false, error: errMsg(e), clients: [], total: 0, weights: {} });
    }
  }, [days]);
  useEffect(() => { load(); }, [load]);

  const onSaved = (phone, note) => setState((s) => ({
    ...s, clients: s.clients.map((c) => (c.phone === phone ? { ...c, note } : c)),
  }));

  const today = new Date(); today.setHours(23, 59, 59, 999);
  const isDue = (c) => c.note.followUpDate && new Date(c.note.followUpDate) <= today && !DONE.has(c.note.status);

  const counts = useMemo(() => {
    const open = state.clients.filter((c) => !DONE.has(c.note.status));
    return {
      hot: open.filter((c) => c.tier === 'hot').length,
      warm: open.filter((c) => c.tier === 'warm').length,
      new: open.filter((c) => c.note.status === 'new' && c.tier !== 'active').length,
      due: state.clients.filter(isDue).length,
    };
  }, [state.clients]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => {
    const q = search.replace(/\D/g, '');
    return state.clients.filter((c) => {
      if (tier && c.tier !== tier) return false;
      if (q && !c.phone.includes(q)) return false;
      if (statusFilter === 'open') return !DONE.has(c.note.status);
      if (statusFilter === 'new') return c.note.status === 'new';
      if (statusFilter === 'due') return isDue(c);
      return true;
    });
  }, [state.clients, tier, statusFilter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const weightTip = (
    <Tooltip id="hc-weights">
      <div className="text-start small">
        {Object.values(state.weights).map((w) => <div key={w.label}>{w.label}: {w.weight} pts (max {w.max})</div>)}
        <div className="mt-1">Last 3 days count full, 4–7 days 70%, older 40%. Hot ≥ 30, Warm ≥ 15.</div>
      </div>
    </Tooltip>
  );

  return (
    <div className="container-fluid p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h4 className="mb-0">Hot Clients</h4>
          <div className="text-muted small">
            People most likely to buy or rent right now, ranked by their activity.{' '}
            <OverlayTrigger placement="bottom" overlay={weightTip}>
              <span className="text-primary" style={{ cursor: 'help', textDecoration: 'underline dotted' }}>How is the score worked out?</span>
            </OverlayTrigger>
          </div>
        </div>
        <div className="d-flex gap-1 align-items-center">
          {PERIODS.map((p) => (
            <Button key={p} size="sm" variant={days === p ? 'dark' : 'outline-dark'} onClick={() => setDays(p)}>
              {p} days
            </Button>
          ))}
          <Button size="sm" variant="outline-primary" className="ms-2" onClick={load}>Refresh</Button>
        </div>
      </div>

      <Row className="g-3 mb-3">
        <Col xs={6} lg={3}>
          <Kpi label="Hot" value={fmtNum(counts.hot)} color={TIERS.hot.color} hint="Score 30+ · call today"
            onClick={() => setTier(tier === 'hot' ? '' : 'hot')} active={tier === 'hot'} />
        </Col>
        <Col xs={6} lg={3}>
          <Kpi label="Warm" value={fmtNum(counts.warm)} color={TIERS.warm.color} hint="Score 15–29"
            onClick={() => setTier(tier === 'warm' ? '' : 'warm')} active={tier === 'warm'} />
        </Col>
        <Col xs={6} lg={3}>
          <Kpi label="Not called yet" value={fmtNum(counts.new)} color="#1a73e8" hint="Hot + warm with no call logged"
            onClick={() => { setStatusFilter(statusFilter === 'new' ? 'open' : 'new'); setTier(''); }} active={statusFilter === 'new'} />
        </Col>
        <Col xs={6} lg={3}>
          <Kpi label="Follow-up due" value={fmtNum(counts.due)} color="#7c3aed" hint="Follow-up date is today or earlier"
            onClick={() => { setStatusFilter(statusFilter === 'due' ? 'open' : 'due'); setTier(''); }} active={statusFilter === 'due'} />
        </Col>
      </Row>

      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2">
        <div className="d-flex gap-2 flex-wrap">
          <Form.Control style={{ width: 220 }} placeholder="Search phone number" value={search}
            onChange={(e) => setSearch(e.target.value)} />
          <Form.Select style={{ width: 190 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Show">
            <option value="open">Open clients</option>
            <option value="new">Not called yet</option>
            <option value="due">Follow-up due</option>
            <option value="all">All (incl. closed)</option>
          </Form.Select>
        </div>
        <div className="small text-muted">
          Showing {shown.length} of {state.clients.length}
          {state.total > state.clients.length ? ` (top ${state.clients.length} of ${state.total} active users)` : ''}
          {(tier || statusFilter !== 'open' || search) && (
            <Button size="sm" variant="link" onClick={() => { setTier(''); setStatusFilter('open'); setSearch(''); }}>clear filters</Button>
          )}
        </div>
      </div>

      <ErrorBox error={state.error} onRetry={load} />
      {state.loading ? <Loading /> : (
        <div className="table-responsive">
          <Table striped bordered hover size="sm" className="align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th><th>Client</th><th>Score</th><th style={{ minWidth: 200 }}>Why they're hot</th>
                <th style={{ minWidth: 220 }}>Looked at</th><th>Looking for</th><th>Last active</th><th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted p-3">No clients match.</td></tr>
              )}
              {shown.map((c, i) => (
                <tr key={c.phone}>
                  <td>{i + 1}</td>
                  <td className="text-nowrap">
                    <a href={`tel:+91${c.phone}`} className="fw-semibold">{c.phone}</a>
                    <div className="small">
                      <a href={`https://wa.me/91${c.phone}`} target="_blank" rel="noreferrer">WhatsApp</a>
                    </div>
                    {(c.pointsBalance > 0 || c.pointsBought > 0) && (
                      <div className="small text-muted">
                        {c.pointsBalance > 0 && `${fmtNum(c.pointsBalance)} pts left`}
                        {c.pointsBought > 0 && `${c.pointsBalance > 0 ? ' · ' : ''}paid ₹${fmtNum(c.pointsBought)}`}
                      </div>
                    )}
                  </td>
                  <td className="text-nowrap">
                    <Badge bg={TIERS[c.tier].bg}>{TIERS[c.tier].label}</Badge>
                    <div className="fw-bold fs-5">{c.score}</div>
                  </td>
                  <td>
                    {c.reasons.map((r) => (
                      <div key={r.type} className="small">
                        {r.label}{r.count > 1 ? ` ×${r.count}` : ''}
                        {r.type === 'help' && c.helpReason ? <span className="text-muted"> ({c.helpReason})</span> : null}
                      </div>
                    ))}
                    {c.ai && (
                      <Button size="sm" variant="outline-primary" className="mt-1 py-0"
                        onClick={() => setViewing({ phone: c.phone, sessionId: c.ai.sessionId })}>
                        View AI chat
                      </Button>
                    )}
                  </td>
                  <td className="small">
                    {c.properties.length === 0 ? <span className="text-muted">—</span> : c.properties.map((p) => (
                      <div key={p.ppcId}>
                        <span className="fw-semibold">#{p.ppcId}</span>{' '}
                        {[p.bedrooms && `${p.bedrooms} BHK`, p.propertyType, p.area || p.city, rupees(p.price)].filter(Boolean).join(' · ')}
                        <span className="text-muted"> — {p.actions.map((a) => ACTION_LABEL[a] || a).join(', ')}</span>
                      </div>
                    ))}
                  </td>
                  <td className="small">
                    {requirementText(c.requirement) || (c.ai?.question ? <span className="text-muted">“{c.ai.question}”</span> : <span className="text-muted">—</span>)}
                  </td>
                  <td className="text-nowrap small" title={fmtDateTime(c.lastActivity)}>{ago(c.lastActivity)}</td>
                  <td><FollowUpCell key={c.phone} client={c} adminName={adminName} onSaved={onSaved} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <TranscriptModal phone={viewing?.phone} sessionId={viewing?.sessionId} onHide={() => setViewing(null)} />
    </div>
  );
}

export default function HotClients() {
  // 'Hot Clients' = permission key in UserRolls.jsx
  return <PermissionGate fileName="Hot Clients">{(adminName) => <HotClientsPage adminName={adminName} />}</PermissionGate>;
}
