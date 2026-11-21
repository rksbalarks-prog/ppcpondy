import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Badge, Button, Card, Col, Form, Row, Tab, Table, Tabs } from 'react-bootstrap';
import {
  ASSISTANT_API as API, ErrorBox, Kpi, Loading, PermissionGate, TranscriptModal, errMsg, fmtDateTime, fmtNum,
} from './AssistantShared';

/*
 * My Assistant
 * ------------
 * Admin dashboard for the website/app AI assistant. Everything here is backed by
 * the existing assistant admin API in PPC/assistant (admin*Route.js):
 *
 *   Overview       — rollup of the tabs below
 *   Conversations  — GET  /assistant/admin/chat-history (+ /:phone/messages, /:phone/transcript)
 *   Owner Leads    — GET  /assistant/admin/owner-leads, PUT /:id, POST /:id/preapprove
 *   Safety         — GET  /assistant/admin/guardrail-stats, /guardrail-events
 *   Settings       — GET/PUT /assistant/admin/settings (changes apply live)
 */

const LEAD_STATUSES = ['new', 'contacted', 'preapproved', 'dropped'];
const CATEGORY_LABEL = {
  contact_extraction: 'Contact extraction',
  jailbreak: 'Jailbreak attempt',
  impersonation: 'Impersonation',
};

const toDateInput = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

// ─── Conversations ──────────────────────────────────────────────────────────
function Conversations({ users, loading, error, reload }) {
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null); // phone

  const filtered = useMemo(() => {
    const q = search.replace(/\D/g, '');
    return q ? users.filter((u) => String(u.phone).includes(q)) : users;
  }, [users, search]);

  return (
    <>
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <Form.Control style={{ maxWidth: 260 }} placeholder="Search phone number" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <Button size="sm" variant="outline-primary" onClick={reload}>Refresh</Button>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading ? <Loading /> : (
        <div className="table-responsive">
          <Table striped bordered hover size="sm" className="align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th><th>Phone</th><th className="text-end">Sessions</th><th className="text-end">Messages</th>
                <th className="text-end">Tokens</th><th>First chat</th><th>Last active</th><th>Transcript</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted p-3">No conversations found.</td></tr>
              )}
              {filtered.map((u, i) => (
                <tr key={u.phone}>
                  <td>{i + 1}</td>
                  <td><a href={`tel:+91${u.phone}`}>{u.phone}</a></td>
                  <td className="text-end">{fmtNum(u.sessions)}</td>
                  <td className="text-end">{fmtNum(u.messages)}</td>
                  <td className="text-end">{fmtNum(u.tokens)}</td>
                  <td>{fmtDateTime(u.firstMessageAt)}</td>
                  <td>{fmtDateTime(u.lastMessageAt)}</td>
                  <td className="text-nowrap">
                    <Button size="sm" variant="primary" className="me-1" onClick={() => setViewing(u.phone)}>View</Button>
                    <Button size="sm" variant="outline-secondary" href={`${API}/chat-history/${u.phone}/transcript`}>
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <TranscriptModal phone={viewing} onHide={() => setViewing(null)} />
    </>
  );
}

// ─── Owner leads ────────────────────────────────────────────────────────────
function LeadRow({ lead, index, adminName, onSaved }) {
  const [draft, setDraft] = useState({
    status: lead.status || 'new',
    remark: lead.remark || '',
    followupDate: toDateInput(lead.followupDate),
  });
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const dirty = draft.status !== (lead.status || 'new') || draft.remark !== (lead.remark || '')
    || draft.followupDate !== toDateInput(lead.followupDate);

  const save = async () => {
    setBusy('save'); setMsg('');
    try {
      const body = { status: draft.status, remark: draft.remark, calledBy: adminName || '' };
      if (draft.followupDate) body.followupDate = draft.followupDate;
      const res = await axios.put(`${API}/owner-leads/${lead._id}`, body);
      onSaved(res.data.lead);
      setMsg('Saved');
    } catch (e) { setMsg(errMsg(e)); } finally { setBusy(''); }
  };

  const preapprove = async () => {
    if (!window.confirm(`Create a PreApproved property from this lead (${lead.contactPhone || lead.phone})?\n\nIt will NOT go live until approved on the PreApproved page.`)) return;
    setBusy('pre'); setMsg('');
    try {
      const res = await axios.post(`${API}/owner-leads/${lead._id}/preapprove`);
      onSaved({ ...lead, status: 'preapproved', ppcId: res.data.ppcId });
      setDraft((d) => ({ ...d, status: 'preapproved' }));
      setMsg(`PPC ID ${res.data.ppcId} created`);
    } catch (e) { setMsg(errMsg(e)); } finally { setBusy(''); }
  };

  const summary = [lead.propertyMode, lead.propertyType, lead.bedrooms && `${lead.bedrooms} BHK`,
    lead.totalArea && `${lead.totalArea} ${lead.areaUnit || ''}`].filter(Boolean).join(' · ');
  const place = [lead.streetName, lead.area, lead.pinCode].filter(Boolean).join(', ');

  return (
    <tr>
      <td>{index + 1}</td>
      <td className="text-nowrap">{fmtDateTime(lead.createdAt)}</td>
      <td>
        <a href={`tel:+91${String(lead.contactPhone || lead.phone).replace(/\D/g, '').slice(-10)}`}>
          {lead.contactPhone || lead.phone}
        </a>
        {lead.contactPhone && lead.contactPhone !== lead.phone && <div className="small text-muted">chat: {lead.phone}</div>}
      </td>
      <td>
        <div>{summary || '-'}</div>
        {place && <div className="small text-muted">{place}</div>}
      </td>
      <td className="text-end">{lead.price ? `₹${fmtNum(lead.price)}` : '-'}</td>
      <td style={{ minWidth: 130 }}>
        <Form.Select size="sm" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}
          disabled={!!lead.ppcId}>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Form.Select>
      </td>
      <td style={{ minWidth: 180 }}>
        <Form.Control size="sm" as="textarea" rows={1} value={draft.remark}
          onChange={(e) => setDraft({ ...draft, remark: e.target.value })} />
        {lead.calledBy && <div className="small text-muted">by {lead.calledBy}</div>}
      </td>
      <td style={{ minWidth: 140 }}>
        <Form.Control size="sm" type="date" value={draft.followupDate}
          onChange={(e) => setDraft({ ...draft, followupDate: e.target.value })} />
      </td>
      <td className="text-nowrap">
        <Button size="sm" variant="success" className="me-1" disabled={!dirty || !!busy} onClick={save}>
          {busy === 'save' ? 'Saving…' : 'Save'}
        </Button>
        {lead.ppcId ? (
          <Badge bg="success">PPC {lead.ppcId}</Badge>
        ) : (
          <Button size="sm" variant="outline-primary" disabled={!!busy} onClick={preapprove}>
            {busy === 'pre' ? 'Creating…' : 'Pre-approve'}
          </Button>
        )}
        {msg && <div className="small mt-1">{msg}</div>}
      </td>
    </tr>
  );
}

function OwnerLeads({ leads, setLeads, loading, error, reload, adminName }) {
  const [statusFilter, setStatusFilter] = useState('');
  const shown = statusFilter ? leads.filter((l) => (l.status || 'new') === statusFilter) : leads;
  const onSaved = (updated) => setLeads((all) => all.map((l) => (l._id === updated._id ? { ...l, ...updated } : l)));

  return (
    <>
      <p className="text-muted small mb-2">
        Property owners who described their property to the assistant. Follow up, then <b>Pre-approve</b> to
        create the property on the PreApproved page (it does not go live until approved there).
      </p>
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <div className="d-flex gap-1 flex-wrap">
          {['', ...LEAD_STATUSES].map((s) => (
            <Button key={s || 'all'} size="sm" variant={statusFilter === s ? 'dark' : 'outline-dark'}
              onClick={() => setStatusFilter(s)}>
              {s || 'All'} ({s ? leads.filter((l) => (l.status || 'new') === s).length : leads.length})
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline-primary" onClick={reload}>Refresh</Button>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading ? <Loading /> : (
        <div className="table-responsive">
          <Table striped bordered hover size="sm" className="align-middle">
            <thead className="table-light">
              <tr><th>#</th><th>Date</th><th>Owner phone</th><th>Property</th><th className="text-end">Price</th>
                <th>Status</th><th>Remark</th><th>Follow-up</th><th>Action</th></tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={9} className="text-center text-muted p-3">No owner leads yet.</td></tr>
              )}
              {shown.map((l, i) => (
                <LeadRow key={l._id} lead={l} index={i} adminName={adminName} onSaved={onSaved} />
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}

// ─── Safety (guardrail) ─────────────────────────────────────────────────────
function Safety({ stats, events, loading, error, reload }) {
  const [onlyBlocked, setOnlyBlocked] = useState(false);
  const shown = onlyBlocked ? events.filter((e) => e.action === 'block') : events;
  return (
    <>
      <p className="text-muted small mb-2">
        Messages the assistant flagged as trying to extract owner contacts, jailbreak it, or impersonate staff.
        Snippets are redacted.
      </p>
      <ErrorBox error={error} onRetry={reload} />
      {loading ? <Loading /> : (
        <>
          <Row className="g-3 mb-3">
            <Col xs={6} md={3}><Kpi label="Flagged (all time)" value={fmtNum(stats?.totals?.all)} /></Col>
            <Col xs={6} md={3}><Kpi label="Blocked" value={fmtNum(stats?.totals?.blocked)} color="#dc3545" /></Col>
            <Col xs={6} md={3}><Kpi label="Last 30 days" value={fmtNum(stats?.totals?.last30)} color="#f59e0b" /></Col>
            <Col xs={6} md={3}>
              <Card className="h-100 shadow-sm border-0"><Card.Body>
                <div className="text-muted small">By category</div>
                {(stats?.byCategory || []).length === 0 && <div className="text-muted">-</div>}
                {(stats?.byCategory || []).map((c) => (
                  <div key={c._id} className="small d-flex justify-content-between">
                    <span>{CATEGORY_LABEL[c._id] || c._id}</span><b>{fmtNum(c.attempts)}</b>
                  </div>
                ))}
              </Card.Body></Card>
            </Col>
          </Row>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Check type="switch" id="only-blocked" label="Show blocked only" checked={onlyBlocked}
              onChange={(e) => setOnlyBlocked(e.target.checked)} />
            <Button size="sm" variant="outline-primary" onClick={reload}>Refresh</Button>
          </div>
          <div className="table-responsive">
            <Table striped bordered hover size="sm" className="align-middle">
              <thead className="table-light">
                <tr><th>Time</th><th>User</th><th>Category</th><th>Severity</th><th>Action</th><th>Message (redacted)</th></tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted p-3">Nothing flagged.</td></tr>
                )}
                {shown.map((e) => (
                  <tr key={e._id}>
                    <td className="text-nowrap">{fmtDateTime(e.createdAt)}</td>
                    <td>{e.key || '-'}</td>
                    <td>{CATEGORY_LABEL[e.category] || e.category}</td>
                    <td>{'●'.repeat(e.severity || 1)}</td>
                    <td><Badge bg={e.action === 'block' ? 'danger' : 'secondary'}>{e.action}</Badge></td>
                    <td style={{ maxWidth: 420 }}>{e.snippet}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}

// ─── Settings ───────────────────────────────────────────────────────────────
const NUMBER_FIELDS = [
  { key: 'contactRevealPoints', label: 'Points to reveal an owner contact', min: 1 },
  { key: 'rateChat', label: 'Chat messages allowed per user (rate limit)', min: 1 },
  { key: 'rateVoice', label: 'Voice requests allowed per user (rate limit)', min: 1 },
  { key: 'dailyTokenBudget', label: 'Daily token budget (all users)', min: 0 },
];

function Settings({ settings, loading, error, reload, adminName, onSaved }) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => { if (settings) setDraft({ ...settings }); }, [settings]);

  const save = async () => {
    if (draft.enabled !== settings.enabled && !draft.enabled
      && !window.confirm('Turn the assistant OFF for all website and app users?')) return;
    setSaving(true); setMsg({ type: '', text: '' });
    try {
      const body = { enabled: !!draft.enabled, greetingEn: draft.greetingEn || '', greetingTa: draft.greetingTa || '',
        promptExtra: draft.promptExtra || '', updatedBy: adminName || '' };
      NUMBER_FIELDS.forEach((f) => { body[f.key] = Number(draft[f.key]); });
      const res = await axios.put(`${API}/settings`, body);
      onSaved(res.data.settings);
      setMsg({ type: 'success', text: 'Saved — changes are live now.' });
    } catch (e) {
      setMsg({ type: 'danger', text: errMsg(e) });
    } finally { setSaving(false); }
  };

  if (loading || !draft) return error ? <ErrorBox error={error} onRetry={reload} /> : <Loading />;
  const set = (k, v) => setDraft({ ...draft, [k]: v });

  return (
    <div style={{ maxWidth: 760 }}>
      <ErrorBox error={error} onRetry={reload} />
      <Card className="mb-3 shadow-sm border-0"><Card.Body>
        <Form.Check type="switch" id="assistant-enabled"
          label={<b>{draft.enabled ? 'Assistant is ON for users' : 'Assistant is OFF for users'}</b>}
          checked={!!draft.enabled} onChange={(e) => set('enabled', e.target.checked)} />
        {settings.updatedBy && (
          <div className="small text-muted mt-1">Last changed by {settings.updatedBy}
            {settings.updatedAt ? ` on ${fmtDateTime(settings.updatedAt)}` : ''}</div>
        )}
      </Card.Body></Card>

      <Row className="g-3 mb-3">
        {NUMBER_FIELDS.map((f) => (
          <Col md={6} key={f.key}>
            <Form.Label className="small mb-1">{f.label}</Form.Label>
            <Form.Control type="number" min={f.min} value={draft[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
          </Col>
        ))}
      </Row>

      <Form.Group className="mb-3">
        <Form.Label className="small mb-1">Greeting (English) — blank uses the default</Form.Label>
        <Form.Control as="textarea" rows={2} maxLength={500} value={draft.greetingEn || ''}
          onChange={(e) => set('greetingEn', e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="small mb-1">Greeting (Tamil) — blank uses the default</Form.Label>
        <Form.Control as="textarea" rows={2} maxLength={500} value={draft.greetingTa || ''}
          onChange={(e) => set('greetingTa', e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="small mb-1">Extra instructions for the assistant (offers, today’s focus, etc.)</Form.Label>
        <Form.Control as="textarea" rows={4} maxLength={4000} value={draft.promptExtra || ''}
          onChange={(e) => set('promptExtra', e.target.value)} />
        <Form.Text>{(draft.promptExtra || '').length}/4000</Form.Text>
      </Form.Group>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      <Button variant="success" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
      <Button variant="link" onClick={() => { setDraft({ ...settings }); setMsg({ type: '', text: '' }); }}>Reset</Button>
    </div>
  );
}

// ─── Page (permission-guarded like the other admin pages) ───────────────────
export default function MyAssistant() {
  // 'My Assistant' = permission key in UserRolls.jsx
  return <PermissionGate fileName="My Assistant">{(adminName) => <MyAssistantPage adminName={adminName} />}</PermissionGate>;
}

function MyAssistantPage({ adminName }) {
  const [tab, setTab] = useState('overview');

  const [chats, setChats] = useState({ loading: true, error: '', users: [] });
  const [leads, setLeadsState] = useState({ loading: true, error: '', leads: [] });
  const [safety, setSafety] = useState({ loading: true, error: '', stats: null, events: [] });
  const [settings, setSettings] = useState({ loading: true, error: '', settings: null });

  const loadChats = useCallback(async () => {
    setChats((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await axios.get(`${API}/chat-history`);
      setChats({ loading: false, error: '', users: res.data.users || [] });
    } catch (e) { setChats({ loading: false, error: errMsg(e), users: [] }); }
  }, []);
  const loadLeads = useCallback(async () => {
    setLeadsState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await axios.get(`${API}/owner-leads`);
      setLeadsState({ loading: false, error: '', leads: res.data.leads || [] });
    } catch (e) { setLeadsState({ loading: false, error: errMsg(e), leads: [] }); }
  }, []);
  const loadSafety = useCallback(async () => {
    setSafety((s) => ({ ...s, loading: true, error: '' }));
    try {
      const [st, ev] = await Promise.all([
        axios.get(`${API}/guardrail-stats`),
        axios.get(`${API}/guardrail-events`, { params: { limit: 300 } }),
      ]);
      setSafety({ loading: false, error: '', stats: st.data, events: ev.data.events || [] });
    } catch (e) { setSafety({ loading: false, error: errMsg(e), stats: null, events: [] }); }
  }, []);
  const loadSettings = useCallback(async () => {
    setSettings((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await axios.get(`${API}/settings`);
      setSettings({ loading: false, error: '', settings: res.data.settings });
    } catch (e) { setSettings({ loading: false, error: errMsg(e), settings: null }); }
  }, []);

  useEffect(() => { loadChats(); loadLeads(); loadSafety(); loadSettings(); },
    [loadChats, loadLeads, loadSafety, loadSettings]);

  const setLeads = (fn) => setLeadsState((s) => ({ ...s, leads: fn(s.leads) }));

  const totals = useMemo(() => {
    const u = chats.users;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      users: u.length,
      messages: u.reduce((a, x) => a + (x.messages || 0), 0),
      sessions: u.reduce((a, x) => a + (x.sessions || 0), 0),
      tokens: u.reduce((a, x) => a + (x.tokens || 0), 0),
      active24h: u.filter((x) => x.lastMessageAt && new Date(x.lastMessageAt).getTime() >= dayAgo).length,
      active7d: u.filter((x) => x.lastMessageAt && new Date(x.lastMessageAt).getTime() >= weekAgo).length,
      newLeads: leads.leads.filter((l) => (l.status || 'new') === 'new').length,
    };
  }, [chats.users, leads.leads]);

  const s = settings.settings;
  const loadingAny = chats.loading || leads.loading || safety.loading || settings.loading;

  return (
    <div className="container-fluid p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h4 className="mb-0">My Assistant</h4>
          <div className="text-muted small">AI assistant on pondyproperty.com and the app</div>
        </div>
        {s && (
          <Badge bg={s.enabled ? 'success' : 'danger'} style={{ fontSize: 14 }} role="button"
            onClick={() => setTab('settings')}>
            {s.enabled ? '● Assistant ON' : '● Assistant OFF'}
          </Badge>
        )}
      </div>

      <Tabs activeKey={tab} onSelect={(k) => setTab(k)} className="mb-3" mountOnEnter>
        <Tab eventKey="overview" title="Overview">
          {loadingAny && <Loading />}
          <Row className="g-3 mb-3">
            <Col xs={6} lg={3}><Kpi label="Users who chatted" value={fmtNum(totals.users)}
              hint={`${totals.active24h} today · ${totals.active7d} this week`} /></Col>
            <Col xs={6} lg={3}><Kpi label="Messages" value={fmtNum(totals.messages)}
              hint={`${fmtNum(totals.sessions)} sessions`} /></Col>
            <Col xs={6} lg={3}><Kpi label="New owner leads" value={fmtNum(totals.newLeads)} color="#16a34a"
              hint={`${fmtNum(leads.leads.length)} total`} /></Col>
            <Col xs={6} lg={3}><Kpi label="Blocked attempts" value={fmtNum(safety.stats?.totals?.blocked)} color="#dc3545"
              hint={`${fmtNum(safety.stats?.totals?.last30)} flagged in 30 days`} /></Col>
          </Row>
          <Row className="g-3">
            <Col lg={7}>
              <Card className="shadow-sm border-0 h-100"><Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <b>Recent conversations</b>
                  <Button size="sm" variant="link" onClick={() => setTab('chats')}>View all</Button>
                </div>
                <Table size="sm" className="mb-0">
                  <thead><tr><th>Phone</th><th className="text-end">Messages</th><th>Last active</th></tr></thead>
                  <tbody>
                    {chats.users.slice(0, 8).map((u) => (
                      <tr key={u.phone}><td>{u.phone}</td><td className="text-end">{u.messages}</td><td>{fmtDateTime(u.lastMessageAt)}</td></tr>
                    ))}
                    {!chats.loading && chats.users.length === 0 && <tr><td colSpan={3} className="text-muted">No conversations yet.</td></tr>}
                  </tbody>
                </Table>
              </Card.Body></Card>
            </Col>
            <Col lg={5}>
              <Card className="shadow-sm border-0 h-100"><Card.Body>
                <b>Usage</b>
                <div className="d-flex justify-content-between mt-2"><span>Tokens used (all time)</span><b>{fmtNum(totals.tokens)}</b></div>
                <div className="d-flex justify-content-between"><span>Daily token budget</span><b>{s ? fmtNum(s.dailyTokenBudget) : '-'}</b></div>
                <div className="d-flex justify-content-between"><span>Points to reveal a contact</span><b>{s ? s.contactRevealPoints : '-'}</b></div>
                <div className="d-flex justify-content-between"><span>Chat limit per user</span><b>{s ? s.rateChat : '-'}</b></div>
                <Button size="sm" variant="outline-primary" className="mt-3" onClick={() => setTab('settings')}>Change settings</Button>
              </Card.Body></Card>
            </Col>
          </Row>
        </Tab>
        <Tab eventKey="chats" title={`Conversations (${chats.users.length})`}>
          <Conversations users={chats.users} loading={chats.loading} error={chats.error} reload={loadChats} />
        </Tab>
        <Tab eventKey="leads" title={`Owner Leads (${totals.newLeads} new)`}>
          <OwnerLeads leads={leads.leads} setLeads={setLeads} loading={leads.loading} error={leads.error}
            reload={loadLeads} adminName={adminName} />
        </Tab>
        <Tab eventKey="safety" title="Safety">
          <Safety stats={safety.stats} events={safety.events} loading={safety.loading} error={safety.error} reload={loadSafety} />
        </Tab>
        <Tab eventKey="settings" title="Settings">
          <Settings settings={settings.settings} loading={settings.loading} error={settings.error} reload={loadSettings}
            adminName={adminName} onSaved={(ns) => setSettings({ loading: false, error: '', settings: ns })} />
        </Tab>
      </Tabs>
    </div>
  );
}
