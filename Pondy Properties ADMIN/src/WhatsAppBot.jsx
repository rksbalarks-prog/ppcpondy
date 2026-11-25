import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Badge, Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { ErrorBox, Kpi, Loading, PermissionGate, errMsg, fmtDateTime, fmtNum } from './AssistantShared';

/*
 * WhatsApp Bot (Buyer / Seller forms)
 * -----------------------------------
 * The Pondy Property WhatsApp number (SmartGrowth) answers "Hi" with two
 * buttons - Buyer | Seller - and sends a short in-WhatsApp form asking only the
 * mandatory details. Buyer form -> Buyer Assistance request (baPending);
 * Seller form -> a property in PreApproved. Same idea as the Pondicherry
 * Matrimony bot. Backend: PPC/WhatsAppBot (polls SmartGrowth every minute).
 */

const API = process.env.REACT_APP_API_URL;
const KIND = {
  welcome: { label: 'Said Hi', bg: 'secondary' },
  ai: { label: 'AI answered', bg: 'dark' },
  buyer_tap: { label: 'Buyer form sent', bg: 'info' },
  seller_tap: { label: 'Seller form sent', bg: 'info' },
  buyer_form: { label: 'Buyer submitted', bg: 'success' },
  seller_form: { label: 'Seller submitted', bg: 'primary' },
};
const OUTCOME = { saved: 'success', sent: 'secondary', failed: 'danger', working: 'warning', ignored: 'light' };

function FormCard({ kind, settings, form, onDone }) {
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const id = settings[`${kind}FlowId`];
  const mode = settings[`${kind}FlowMode`];
  const act = async (what) => {
    if (what === 'publish' && !window.confirm(`Publish the ${kind} form? Every customer will get it, and a published form can no longer be changed.`)) return;
    setBusy(what); setMsg(null);
    try {
      const r = await axios.post(`${API}/wa-bot/flows/${kind}/${what}`);
      setMsg({ ok: !(r.data.errors || []).length, text: r.data.message, errors: r.data.errors || [] });
      onDone();
    } catch (e) {
      setMsg({ ok: false, text: errMsg(e), errors: [] });
    } finally { setBusy(''); }
  };
  return (
    <Card className="h-100"><Card.Body>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div>
          <h6 className="mb-0 text-capitalize">{kind} form</h6>
          <div className="small text-muted">{kind === 'buyer'
            ? 'Name, Residential/Commercial, type, budget, bedrooms, city, area'
            : 'Name, owner/agent, Residential/Commercial, type, new/resale, price, area + unit, bedrooms, city, locality'}</div>
        </div>
        {id ? <Badge bg={mode === 'published' ? 'success' : 'warning'} text={mode === 'published' ? undefined : 'dark'}>
          {mode === 'published' ? 'Live' : 'Draft (test numbers only)'}</Badge>
          : <Badge bg="secondary">Not uploaded</Badge>}
      </div>
      <div className="small mb-2">
        Form id: <b>{id || '—'}</b>
        {form && form.status && <> · Meta status: <b>{form.status}</b></>}
      </div>
      {form && form.errors && form.errors.length > 0 && (
        <Alert variant="danger" className="py-1 small mb-2">{form.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}</Alert>
      )}
      {!id && <div className="small text-muted mb-2">Until it is uploaded, Buyer / Seller taps are answered with a link to the website.</div>}
      <div className="d-flex gap-2 flex-wrap">
        <Button size="sm" variant="outline-primary" disabled={!settings.hasToken || !!busy || mode === 'published'} onClick={() => act('upload')}>
          {busy === 'upload' ? 'Uploading…' : id ? 'Upload again' : 'Upload to SmartGrowth'}
        </Button>
        <Button size="sm" variant="success" disabled={!id || !!busy || mode === 'published'} onClick={() => act('publish')}>
          {busy === 'publish' ? 'Publishing…' : 'Publish'}
        </Button>
        <Button size="sm" variant="link" href={`${API}/wa-bot/flows/${kind}/json`} target="_blank" rel="noreferrer">View form JSON</Button>
      </div>
      {msg && (
        <Alert variant={msg.ok ? 'success' : 'danger'} className="py-1 small mt-2 mb-0">
          {msg.text}{msg.errors.map((e, i) => <div key={i}>{e}</div>)}
        </Alert>
      )}
    </Card.Body></Card>
  );
}

function SettingsCard({ settings, ai, onSaved }) {
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    setF({ allowList: settings.allowList, welcomeText: settings.welcomeText,
      buyerFlowId: settings.buyerFlowId, sellerFlowId: settings.sellerFlowId });
  }, [settings]);
  if (!f) return null;
  const save = async (extra = {}) => {
    setSaving(true); setMsg(null);
    try {
      await axios.put(`${API}/wa-bot/settings`, { ...f, ...extra });
      setMsg({ ok: true, text: 'Saved.' });
      onSaved();
    } catch (e) { setMsg({ ok: false, text: errMsg(e) }); } finally { setSaving(false); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Card><Card.Body>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Settings</h6>
        <Form.Check type="switch" id="wa-bot-on" disabled={saving || !settings.hasToken}
          label={settings.enabled ? <b className="text-success">Bot is ON</b> : <span className="text-muted">Bot is off</span>}
          checked={settings.enabled}
          onChange={(e) => {
            if (e.target.checked && !window.confirm('Switch the bot on? It will start answering customers on the WhatsApp number.')) return;
            save({ enabled: e.target.checked });
          }} />
      </div>
      <div className="border rounded p-2 mb-2" style={{ background: settings.sharedNumber ? '#fffbeb' : '#f8fafc' }}>
        <Form.Check type="switch" id="wa-bot-shared" disabled={saving}
          label={<span><b>Shared with Pondicherry Matrimony</b> (same SmartGrowth account / WhatsApp number)</span>}
          checked={settings.sharedNumber}
          onChange={(e) => {
            if (!e.target.checked && !window.confirm('Only switch this off if Pondy Property has its OWN WhatsApp number. Off = this bot answers EVERY message on the number, including matrimony members. Continue?')) return;
            save({ sharedNumber: e.target.checked });
          }} />
        <div className="small text-muted">
          {settings.sharedNumber
            ? <>The bot answers only property messages (“property”, “Buyer”, “Seller”, “sell my plot”, “2 BHK for sale”, “1200 sqft”, Tamil மனை / வீடு வாங்க / விற்க…) and
              what the matrimony bot hands over while a property chat is going on (20 min). “Hi” and everything else stays with the matrimony bot.
              Customers reach the property menu by typing <b>Property</b>.</>
            : 'The bot answers every message on this number (its own Pondy Property number).'}
        </div>
      </div>
      <div className="border rounded p-2 mb-3" style={{ background: '#f8fafc' }}>
        <Form.Check type="switch" id="wa-bot-ai" disabled={saving}
          label={<span><b>AI answers typed messages</b> (OpenAI — the same assistant as the website)</span>}
          checked={settings.aiEnabled}
          onChange={(e) => save({ aiEnabled: e.target.checked })} />
        <div className="small text-muted">
          When a customer types a question (not a button), the AI searches live listings and replies, and sends the Buyer / Seller
          form when they want to register or sell. Button taps and forms keep the bot's fixed replies. Every WhatsApp chat is shown
          in <b>Workspace › AI Handled</b> (WhatsApp tab). Off = typed messages get the Buyer / Seller buttons.
        </div>
        {ai && settings.aiEnabled && (!ai.configured || !ai.assistantOn) && (
          <div className="small text-danger mt-1">
            The AI cannot answer yet: {!ai.configured ? 'no OpenAI API key on the server (OPENAI_API_KEY) or the assistant is disabled there'
              : 'the assistant is switched off in My Assistant › Settings'}. Until then typed messages get the Buyer / Seller buttons.
          </div>
        )}
        {ai && ai.configured && ai.assistantOn && (
          <div className="small text-success mt-1">AI ready ({ai.provider}{ai.model ? ` · ${ai.model}` : ''}). Prompt, limits and daily budget: My Assistant › Settings.</div>
        )}
      </div>
      <Row className="g-2">
        <Col md={6}>
          <Form.Label className="small mb-0">Test numbers only (allow-list)</Form.Label>
          <Form.Control size="sm" value={f.allowList} onChange={set('allowList')} placeholder="9876543210, 9123456789" />
          <div className="small text-muted">When filled, the bot answers ONLY these numbers. Empty = everyone.</div>
        </Col>
        <Col md={3}>
          <Form.Label className="small mb-0">Buyer form id</Form.Label>
          <Form.Control size="sm" value={f.buyerFlowId} onChange={set('buyerFlowId')} />
        </Col>
        <Col md={3}>
          <Form.Label className="small mb-0">Seller form id</Form.Label>
          <Form.Control size="sm" value={f.sellerFlowId} onChange={set('sellerFlowId')} />
        </Col>
        <Col md={12}>
          <Form.Label className="small mb-0">Welcome message (above the Buyer / Seller buttons)</Form.Label>
          <Form.Control size="sm" as="textarea" rows={3} value={f.welcomeText} onChange={set('welcomeText')}
            placeholder="Empty = default: Welcome to Pondy Properties 🏠 Are you looking to buy a property, or do you want to sell yours?" />
        </Col>
      </Row>
      <div className="d-flex gap-2 align-items-center mt-3">
        <Button size="sm" disabled={saving} onClick={() => save()}>{saving ? 'Saving…' : 'Save settings'}</Button>
        {msg && <span className={`small ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</span>}
      </div>
    </Card.Body></Card>
  );
}

/*
 * SmartGrowth account: which WhatsApp Business account (token + API code) this admin
 * uses. Test checks new credentials without saving; Switch saves them and resets what
 * belonged to the old account (form ids, poll watermark) and turns the bot and the
 * templates OFF until the forms and templates are set up on the new account.
 */
function AccountCard({ settings, onSwitched }) {
  const blank = { label: '', apiToken: '', apiCode: '', baseUrl: settings.baseUrl || 'https://newapp.smartgrowthai.com', sharedNumber: settings.sharedNumber };
  const [open, setOpen] = useState(!settings.hasToken);
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState('');
  const [test, setTest] = useState(null);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setTest(null); };

  const runTest = async (useSaved) => {
    setBusy(useSaved ? 'test-saved' : 'test'); setMsg(null);
    try {
      const r = await axios.post(`${API}/wa-bot/account/test`, useSaved ? {} : { apiToken: f.apiToken, apiCode: f.apiCode, baseUrl: f.baseUrl });
      setTest({ ...r.data, which: useSaved ? 'saved' : 'new' });
    } catch (e) { setTest({ ok: false, error: errMsg(e), which: useSaved ? 'saved' : 'new' }); } finally { setBusy(''); }
  };
  const doSwitch = async () => {
    if (!window.confirm(`Connect ${f.label ? `"${f.label}"` : 'this SmartGrowth account'}?\n\nThe WhatsApp bot and the templates are switched OFF, and the Buyer / Seller form ids are cleared - upload the forms and submit the templates on the new account, test, then switch them on again.`)) return;
    setBusy('switch'); setMsg(null);
    try {
      const r = await axios.post(`${API}/wa-bot/account/switch`, { ...f, sharedNumber: f.sharedNumber });
      setMsg({ ok: true, text: r.data.message }); setF(blank); setTest(null); setOpen(false); onSwitched();
    } catch (e) { setMsg({ ok: false, text: errMsg(e) }); } finally { setBusy(''); }
  };

  const Result = ({ t }) => (
    t.ok ? (
      <Alert variant="success" className="py-1 small mb-2">
        <b>Connected</b> ({t.which === 'saved' ? 'saved account' : 'new credentials, not saved yet'}): {t.templates} templates
        {t.ppTemplates ? ` (${t.ppTemplates} Pondy Properties, ${t.approvedPp} approved)` : ' (no Pondy Properties templates yet)'} · {t.flows} forms
        {t.ppForms.length ? ` (${t.ppForms.join(', ')})` : ''} · {t.chats == null ? 'chats not readable' : `${t.chats} chats`}
        {t.otherTemplates.length > 0 && <div className="text-muted">Other templates on it: {t.otherTemplates.join(', ')}{t.templates > t.otherTemplates.length + t.ppTemplates ? '…' : ''}</div>}
        {t.which === 'new' && !t.apiCodeGiven && <div className="text-danger">Add the API code too - templates cannot be sent without it.</div>}
      </Alert>
    ) : <Alert variant="danger" className="py-1 small mb-2">{t.error}</Alert>
  );

  return (
    <Card className="mb-3"><Card.Body>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h6 className="mb-0">SmartGrowth account</h6>
          {settings.hasToken ? (
            <div className="small">
              <b>{settings.accountLabel || 'Connected account'}</b> · token {settings.apiTokenMasked}
              {' · '}API code {settings.hasApiCode ? settings.apiCodeMasked : <span className="text-danger">missing</span>}
              {' · '}<span className="text-muted">{settings.baseUrl}</span>
              {settings.sharedNumber && <Badge bg="warning" text="dark" className="ms-2">Shared with Pondicherry Matrimony</Badge>}
              {settings.accountChangedAt && <div className="text-muted">Connected {fmtDateTime(settings.accountChangedAt)}</div>}
            </div>
          ) : <div className="small text-danger">No account connected yet.</div>}
        </div>
        <div className="d-flex gap-2">
          {settings.hasToken && (
            <Button size="sm" variant="outline-secondary" disabled={!!busy} onClick={() => runTest(true)}>
              {busy === 'test-saved' ? 'Checking…' : 'Test connection'}
            </Button>
          )}
          <Button size="sm" variant={open ? 'secondary' : 'outline-primary'} onClick={() => { setOpen(!open); setTest(null); setMsg(null); }}>
            {open ? 'Cancel' : settings.hasToken ? 'Change account' : 'Connect account'}
          </Button>
        </div>
      </div>
      {test && test.which === 'saved' && <div className="mt-2"><Result t={test} /></div>}
      {open && (
        <div className="border rounded p-2 mt-2" style={{ background: '#f8fafc' }}>
          <Row className="g-2">
            <Col md={4}>
              <Form.Label className="small mb-0">Name (for you)</Form.Label>
              <Form.Control size="sm" value={f.label} onChange={set('label')} placeholder="e.g. PM shared number / Pondy own number" />
            </Col>
            <Col md={8}>
              <Form.Label className="small mb-0">Base URL</Form.Label>
              <Form.Control size="sm" value={f.baseUrl} onChange={set('baseUrl')} />
            </Col>
            <Col md={6}>
              <Form.Label className="small mb-0">API token (Bearer)</Form.Label>
              <Form.Control size="sm" type="password" autoComplete="off" value={f.apiToken} onChange={set('apiToken')} placeholder="paste the new account's token" />
            </Col>
            <Col md={6}>
              <Form.Label className="small mb-0">API code (for sending templates)</Form.Label>
              <Form.Control size="sm" type="password" autoComplete="off" value={f.apiCode} onChange={set('apiCode')} placeholder="paste the new account's API code" />
            </Col>
            <Col md={12}>
              <Form.Check type="switch" id="acct-shared" checked={f.sharedNumber}
                onChange={(e) => setF({ ...f, sharedNumber: e.target.checked })}
                label={<span className="small">This number is <b>shared with Pondicherry Matrimony</b> (same account as PM admin) — answer property messages only</span>} />
            </Col>
          </Row>
          {test && test.which === 'new' && <div className="mt-2"><Result t={test} /></div>}
          <div className="d-flex gap-2 mt-2 align-items-center">
            <Button size="sm" variant="outline-secondary" disabled={!!busy || !f.apiToken.trim()} onClick={() => runTest(false)}>
              {busy === 'test' ? 'Testing…' : 'Test'}
            </Button>
            <Button size="sm" variant="primary" disabled={!!busy || !test || test.which !== 'new' || !test.ok || !f.apiCode.trim()} onClick={doSwitch}>
              {busy === 'switch' ? 'Switching…' : 'Switch to this account'}
            </Button>
            <span className="small text-muted">Test first — Switch unlocks once the test passes.</span>
          </div>
        </div>
      )}
      {msg && <Alert variant={msg.ok ? 'success' : 'danger'} className="py-1 small mt-2 mb-0">{msg.text}</Alert>}
      {settings.accountHistory.length > 1 && (
        <details className="small mt-2">
          <summary className="text-muted">Account history</summary>
          {settings.accountHistory.map((h, i) => (
            <div key={i}>{fmtDateTime(h.at)} · {h.label || 'unnamed'} · token {h.token}{i === 0 ? ' (current)' : ''}</div>
          ))}
        </details>
      )}
    </Card.Body></Card>
  );
}

const TPL_STATUS = { APPROVED: 'success', PENDING: 'warning', REJECTED: 'danger', 'NOT SUBMITTED': 'secondary' };
const AUDIENCE_LABEL = { owner: 'To owner', user: 'To buyer', account: 'Account' };
const SOURCE_LABEL = {
  'send-message': 'Website / app alert', login: 'First login', bot: 'WhatsApp bot (if its text cannot go)', admin: 'Not automatic yet',
};

/*
 * WhatsApp templates (PPC/WhatsAppTemplates): the Meta-approved versions of the
 * website / app action alerts, account messages and registration messages. When
 * switched on, POST /send-message sends an alert as its approved template on the
 * official number; anything else (switched off, not approved, failed) still goes
 * by OneMsg as before. The website and app are unchanged.
 */
function TemplatesCard() {
  const [st, setSt] = useState({ loading: true, error: '', data: null });
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [limit, setLimit] = useState('');
  const [testPhone, setTestPhone] = useState('');

  const load = useCallback(async (refresh = false) => {
    setSt((x) => ({ ...x, loading: true, error: '' }));
    try {
      const r = await axios.get(`${API}/wa-templates`, { params: refresh ? { refresh: 1 } : {} });
      setSt({ loading: false, error: '', data: r.data });
      setLimit(String(r.data.settings.templateDailyLimit ?? ''));
    } catch (e) { setSt({ loading: false, error: errMsg(e), data: null }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const call = async (what, fn) => {
    setBusy(what); setMsg(null);
    try { const r = await fn(); setMsg({ ok: true, text: r.data.message || 'Done.', results: r.data.results }); await load(true); }
    catch (e) { setMsg({ ok: false, text: errMsg(e) }); }
    finally { setBusy(''); }
  };
  const save = (body) => call('save', () => axios.put(`${API}/wa-templates/settings`, body));

  if (st.loading && !st.data) return <Card className="mb-3"><Card.Body><Loading /></Card.Body></Card>;
  if (!st.data) return <Card className="mb-3"><Card.Body><ErrorBox error={st.error} onRetry={() => load()} /></Card.Body></Card>;
  const s = st.data.settings;
  const tpls = st.data.templates;
  const approved = tpls.filter((t) => t.status === 'APPROVED').length;

  return (
    <Card className="mb-3"><Card.Body>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
        <div>
          <h6 className="mb-0">WhatsApp templates — action alerts, login &amp; registration</h6>
          <div className="small text-muted">
            {tpls.length} templates · {approved} approved by Meta · {fmtNum(s.sentToday)} sent today
            {s.templateDailyLimit ? ` (limit ${fmtNum(s.templateDailyLimit)})` : ''}
          </div>
        </div>
        <Form.Check type="switch" id="wa-tpl-on" disabled={!!busy || !s.hasToken || !s.hasApiCode}
          label={s.templatesEnabled ? <b className="text-success">Templates ON</b> : <span className="text-muted">Templates off (all alerts by OneMsg)</span>}
          checked={s.templatesEnabled}
          onChange={(e) => {
            if (e.target.checked && !window.confirm('Send the website / app alerts as approved WhatsApp templates from the official number? Each template message is charged by WhatsApp on the SmartGrowth account (shared with Pondicherry Matrimony).')) return;
            save({ templatesEnabled: e.target.checked });
          }} />
      </div>
      <div className="small text-muted mb-2">
        Approved templates replace the matching OneMsg alert; switched-off, unapproved or failed ones still go by OneMsg, so nothing stops.
        The website and app need no change. Owner phone numbers are never put in buyer messages (except after the buyer has unlocked the contact).
      </div>
      {st.data.accountError && <Alert variant="warning" className="py-1 small">Could not read the templates on the account: {st.data.accountError}</Alert>}
      <Row className="g-2 align-items-end mb-2">
        <Col md={2}>
          <Form.Label className="small mb-0">Daily limit (0 = none)</Form.Label>
          <Form.Control size="sm" type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} />
        </Col>
        <Col md="auto">
          <Button size="sm" disabled={!!busy} onClick={() => save({ templateDailyLimit: Number(limit) || 0 })}>
            {busy === 'save' ? 'Saving…' : 'Save'}
          </Button>
        </Col>
        <Col md="auto">
          <Button size="sm" variant="outline-primary" disabled={!!busy || !s.hasToken}
            onClick={() => window.confirm('Send every template that is not yet on the account to Meta for approval?') && call('all', () => axios.post(`${API}/wa-templates/submit-all`))}>
            {busy === 'all' ? 'Submitting…' : 'Submit all to Meta'}
          </Button>
        </Col>
        <Col md={2}>
          <Form.Control size="sm" placeholder="Test number" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
        </Col>
        <Col md="auto"><Button size="sm" variant="link" onClick={() => load(true)}>Refresh status</Button></Col>
      </Row>
      {msg && (
        <Alert variant={msg.ok ? 'success' : 'danger'} className="py-1 small" dismissible onClose={() => setMsg(null)}>
          {msg.text}
          {msg.results && msg.results.map((r) => <div key={r.name}><code>{r.name}</code> — {r.result}</div>)}
        </Alert>
      )}
      <div className="table-responsive">
        <Table size="sm" bordered hover className="align-middle small mb-0">
          <thead className="table-light"><tr><th>Template</th><th style={{ minWidth: 320 }}>Message (with example values)</th><th>Sent when</th><th>Meta</th><th>On</th><th /></tr></thead>
          <tbody>
            {tpls.map((t) => (
              <tr key={t.key}>
                <td className="text-nowrap">
                  <div className="fw-semibold">{t.label}</div>
                  <code className="small">{t.name}</code>
                  <div><Badge bg="light" text="dark" className="border fw-normal">{AUDIENCE_LABEL[t.audience] || t.audience}</Badge>{' '}
                    {t.category === 'AUTHENTICATION' && <Badge bg="info">OTP</Badge>}</div>
                </td>
                <td>
                  {t.preview}
                  {t.note && <div className="text-warning-emphasis mt-1">{t.note}</div>}
                  {t.problems.length > 0 && <div className="text-danger">{t.problems.join('; ')}</div>}
                </td>
                <td><div>{t.when}</div><div className="text-muted">{SOURCE_LABEL[t.source] || t.source}</div></td>
                <td><Badge bg={TPL_STATUS[t.status] || 'secondary'}>{t.status}</Badge></td>
                <td>
                  <Form.Check type="switch" id={`tpl-${t.key}`} disabled={!!busy} checked={t.on}
                    onChange={(e) => save({ templateOn: { [t.key]: e.target.checked } })} />
                </td>
                <td className="text-nowrap">
                  {(t.status === 'NOT SUBMITTED' || t.status === 'REJECTED') && (
                    <Button size="sm" variant="outline-primary" className="me-1" disabled={!!busy || !s.hasToken}
                      onClick={() => call(`sub-${t.key}`, () => axios.post(`${API}/wa-templates/${t.key}/submit`))}>
                      {busy === `sub-${t.key}` ? '…' : 'Submit'}
                    </Button>
                  )}
                  {t.status === 'APPROVED' && (
                    <Button size="sm" variant="outline-success" disabled={!!busy || !s.hasApiCode || testPhone.replace(/\D/g, '').length < 10}
                      title={testPhone ? '' : 'Type a test number above'}
                      onClick={() => call(`test-${t.key}`, () => axios.post(`${API}/wa-templates/${t.key}/test`, { phone: testPhone }))}>
                      {busy === `test-${t.key}` ? '…' : 'Test'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card.Body></Card>
  );
}

function WhatsAppBotPage() {
  const [cfg, setCfg] = useState({ loading: true, error: '', data: null });
  const [days, setDays] = useState(7);
  const [kind, setKind] = useState('');
  const [leads, setLeads] = useState({ loading: true, error: '', data: null });
  const [run, setRun] = useState({ busy: '', result: null });

  const loadCfg = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/wa-bot/settings`);
      setCfg({ loading: false, error: '', data: r.data });
    } catch (e) { setCfg({ loading: false, error: errMsg(e), data: null }); }
  }, []);
  const loadLeads = useCallback(async () => {
    setLeads((l) => ({ ...l, loading: true, error: '' }));
    try {
      const r = await axios.get(`${API}/wa-bot/leads`, { params: { days, kind } });
      setLeads({ loading: false, error: '', data: r.data });
    } catch (e) { setLeads({ loading: false, error: errMsg(e), data: null }); }
  }, [days, kind]);
  useEffect(() => { loadCfg(); }, [loadCfg]);
  useEffect(() => { loadLeads(); }, [loadLeads]);

  const runNow = async (dry) => {
    if (!dry && !window.confirm('Run the bot once now? It will really answer new messages.')) return;
    setRun({ busy: dry ? 'dry' : 'live', result: null });
    try {
      const r = await axios.post(`${API}/wa-bot/run`, { dry });
      setRun({ busy: '', result: r.data });
      if (!dry) { loadLeads(); loadCfg(); }
    } catch (e) { setRun({ busy: '', result: { error: errMsg(e), log: [] } }); }
  };

  if (cfg.loading) return <div className="container-fluid p-3"><Loading /></div>;
  if (!cfg.data) return <div className="container-fluid p-3"><ErrorBox error={cfg.error} onRetry={loadCfg} /></div>;
  const s = cfg.data.settings;
  const st = leads.data?.stats || {};
  const n = (k, f = 'total') => fmtNum(st[k]?.[f] || 0);

  return (
    <div className="container-fluid p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h4 className="mb-0">WhatsApp Bot — Buyer / Seller</h4>
          <div className="text-muted small">Customer says Hi → taps Buyer or Seller → fills a short form inside WhatsApp → it lands in Buyer Assistance / PreApproved. Typed questions → the AI (see AI Handled)</div>
        </div>
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-secondary" disabled={!!run.busy || !s.hasToken} onClick={() => runNow(true)}>
            {run.busy === 'dry' ? 'Checking…' : 'Test run (sends nothing)'}
          </Button>
          <Button size="sm" variant="outline-success" disabled={!!run.busy || !s.hasToken} onClick={() => runNow(false)}>
            {run.busy === 'live' ? 'Running…' : 'Run now'}
          </Button>
        </div>
      </div>

      <AccountCard key={s.accountChangedAt || "none"} settings={s} onSwitched={loadCfg} />
      {cfg.data.formsError && <Alert variant="warning" className="py-2 small">{cfg.data.formsError}</Alert>}
      {s.allowList && s.enabled && <Alert variant="warning" className="py-2 small">Test mode: the bot only answers {s.allowList}.</Alert>}
      {run.result && (
        <Alert variant={run.result.error ? 'danger' : 'light'} className="small border" dismissible onClose={() => setRun({ busy: '', result: null })}>
          {run.result.skipped && <div><b>Skipped:</b> {run.result.skipped}</div>}
          {run.result.error && <div><b>Error:</b> {run.result.error}</div>}
          {run.result.log && run.result.log.length > 0 && <pre className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>{run.result.log.join('\n')}</pre>}
          {!run.result.skipped && !run.result.error && !(run.result.log || []).length && 'Nothing new.'}
        </Alert>
      )}

      <Row className="g-3 mb-3">
        <Col xs={6} lg={3}><Kpi label="Said Hi" value={n('welcome')} hint={`${n('welcome', 'people')} people`} color="#64748b"
          onClick={() => setKind(kind === 'welcome' ? '' : 'welcome')} active={kind === 'welcome'} /></Col>
        <Col xs={6} lg={3}><Kpi label="Buyer requests saved" value={n('buyer_form', 'saved')} hint={`${n('buyer_tap')} buyer forms sent`} color="#16a34a"
          onClick={() => setKind(kind === 'buyer_form' ? '' : 'buyer_form')} active={kind === 'buyer_form'} /></Col>
        <Col xs={6} lg={3}><Kpi label="Properties saved" value={n('seller_form', 'saved')} hint={`${n('seller_tap')} seller forms sent`} color="#1a73e8"
          onClick={() => setKind(kind === 'seller_form' ? '' : 'seller_form')} active={kind === 'seller_form'} /></Col>
        <Col xs={6} lg={3}><Kpi label="Last check" value={s.lastRun ? fmtDateTime(s.lastRun.at).split(',').pop() : '—'} color="#0D9488"
          hint={s.enabled ? (s.lastRun ? `${s.lastRun.opened} chats read, ${s.lastRun.sent} sent${s.lastRun.aiAnswered ? `, ${s.lastRun.aiAnswered} by AI` : ''}${s.lastRun.failed ? `, ${s.lastRun.failed} failed` : ''}` : 'every minute') : 'bot is off'} /></Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={6}><FormCard kind="buyer" settings={s} form={cfg.data.forms?.buyer} onDone={loadCfg} /></Col>
        <Col lg={6}><FormCard kind="seller" settings={s} form={cfg.data.forms?.seller} onDone={loadCfg} /></Col>
      </Row>

      <div className="mb-3"><SettingsCard settings={s} ai={cfg.data.ai} onSaved={loadCfg} /></div>

      <TemplatesCard key={s.accountChangedAt || "none"} />

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
        <h6 className="mb-0">What the bot did</h6>
        <div className="d-flex gap-1">
          {[1, 7, 30, 90].map((p) => (
            <Button key={p} size="sm" variant={days === p ? 'dark' : 'outline-dark'} onClick={() => setDays(p)}>{p === 1 ? 'Today' : `${p} days`}</Button>
          ))}
          <Button size="sm" variant="outline-primary" className="ms-2" onClick={loadLeads}>Refresh</Button>
        </div>
      </div>
      <ErrorBox error={leads.error} onRetry={loadLeads} />
      {leads.loading && !leads.data ? <Loading /> : leads.data && (
        <div className="table-responsive">
          <Table striped bordered hover size="sm" className="align-middle">
            <thead className="table-light"><tr><th>Time</th><th>Phone</th><th>What</th><th>Result</th><th>Record</th><th style={{ minWidth: 260 }}>Details</th></tr></thead>
            <tbody>
              {leads.data.items.length === 0 && <tr><td colSpan={6} className="text-center text-muted p-3">Nothing yet in this period.</td></tr>}
              {leads.data.items.map((x) => (
                <tr key={x._id}>
                  <td className="small text-nowrap">{fmtDateTime(x.createdAt)}</td>
                  <td className="text-nowrap"><a href={`tel:+91${x.phone}`}>{x.phone}</a></td>
                  <td><Badge bg={KIND[x.kind]?.bg || 'secondary'}>{KIND[x.kind]?.label || x.kind}</Badge></td>
                  <td><Badge bg={OUTCOME[x.outcome] || 'secondary'} text={x.outcome === 'ignored' ? 'dark' : undefined}>{x.outcome}</Badge></td>
                  <td className="small text-nowrap">
                    {x.refId ? (x.kind === 'buyer_form' ? `Buyer #${x.refId}` : `PPC-ID ${x.refId}`) : '—'}
                  </td>
                  <td className="small">
                    {x.detail}
                    {x.form && (
                      <div className="text-muted">
                        {Object.entries(x.form).filter(([k, v]) => k.startsWith('pp_') && k !== 'pp_form' && v).map(([k, v]) => `${k.slice(3)}: ${v}`).join(' · ')}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {leads.data.matching > leads.data.items.length && (
            <div className="small text-muted">Showing the latest {leads.data.items.length} of {fmtNum(leads.data.matching)}.</div>
          )}
        </div>
      )}
      <div className="small text-muted mt-2">
        Buyer requests appear in Buyer Assistance (pending approval). Properties appear in PreApproved with “Added by: WhatsApp Bot”.
      </div>
    </div>
  );
}

export default function WhatsAppBot() {
  // 'WhatsApp Bot' = permission key in UserRolls.jsx
  return <PermissionGate fileName="WhatsApp Bot">{() => <WhatsAppBotPage />}</PermissionGate>;
}
