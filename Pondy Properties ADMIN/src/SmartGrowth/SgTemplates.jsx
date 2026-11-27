// Communication > WhatsApp > Templates — ported from PM_Matri_Admin's
// whatsapp/templates (the library and the builder that adds to it).
//
// A template is the ONLY thing that reaches somebody who has not written to us
// in the last 24 hours, and Meta approves every one first. Written here it
// goes straight to Meta: PENDING while they read it, then APPROVED and ready
// for Send Message, or REJECTED with their reason. The name and the language
// cannot be changed afterwards; everything else can be edited and sent back
// for approval — the old wording keeps sending until the new one is approved.

import React, { useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup, Col, Dropdown, Form, Modal, Row, Table } from 'react-bootstrap';
import { sgGet, sgPost, sgUrl } from './sgApi';
import { SgPage, Msg, Busy, StatusPill, CatBadge, useTemplates, downloadUrl } from './common';
import { TemplatePreview } from './TemplateBits';

const BODY_MAX = 1024;
const FOOTER_MAX = 60;
const HEADER_MAX = 60;
const BUTTON_MAX = 25;
const BUTTON_KINDS = { QUICK_REPLY: 'Quick reply', URL: 'Website', PHONE_NUMBER: 'Call', FLOW: 'Form (flow)' };
const BUTTON_CAPS = { QUICK_REPLY: 3, URL: 2, PHONE_NUMBER: 1, FLOW: 1 };

/** The {{n}} numbers in a piece of text, in the order they appear. */
function varsIn(text) {
  const out = [];
  const re = /\{\{\s*([0-9]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(String(text || '')))) out.push(Number(m[1]));
  return out;
}

/** Meta's name rule, applied as it is typed: lowercase, digits, underscores. */
const cleanName = (s) => String(s || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

const EMPTY = {
  id: '', name: '', category: 'UTILITY', language: 'en_US', headerType: 'NONE', headerText: '', headerExample: '',
  body: '', bodyExamples: [], footer: '', buttons: [], approveForAll: false,
};

/** The builder's form, out of a template's own components (for Edit). */
function formFrom(t) {
  const comps = (t.raw && Array.isArray(t.raw.components)) ? t.raw.components : [];
  const f = { ...EMPTY, id: t.id, name: t.name, language: t.language || 'en_US', category: ['MARKETING', 'UTILITY'].includes(String(t.category).toUpperCase()) ? String(t.category).toUpperCase() : 'UTILITY' };
  for (const c of comps) {
    const type = String((c && c.type) || '').toUpperCase();
    if (type === 'HEADER' && String(c.format || 'TEXT').toUpperCase() === 'TEXT') {
      f.headerType = 'TEXT';
      f.headerText = String(c.text || '');
      f.headerExample = c.example && Array.isArray(c.example.header_text) ? String(c.example.header_text[0] || '') : '';
    } else if (type === 'BODY') {
      f.body = String(c.text || '');
      f.bodyExamples = c.example && Array.isArray(c.example.body_text) && Array.isArray(c.example.body_text[0]) ? c.example.body_text[0].map(String) : [];
    } else if (type === 'FOOTER') {
      f.footer = String(c.text || '');
    } else if (type === 'BUTTONS' && Array.isArray(c.buttons)) {
      f.buttons = c.buttons.filter((b) => BUTTON_KINDS[String(b.type || '').toUpperCase()]).map((b) => ({
        type: String(b.type).toUpperCase(), text: String(b.text || ''), url: String(b.url || ''),
        phone: String(b.phone_number || ''), flowId: String(b.flow_id || ''),
      }));
    }
  }
  if (!f.body) f.body = t.bodyText || '';
  return f;
}

/** The rules Meta enforces, said before the request leaves. The server checks them again. */
function problemOf(f, editing) {
  if (!f.name) return 'Give the template a name.';
  if (!/^[a-z0-9_]+$/.test(f.name)) return 'The name may only hold lowercase letters, numbers and underscores.';
  if (!editing && !f.language) return 'Pick a language.';
  if (f.headerType === 'TEXT' && f.headerText.trim()) {
    if (f.headerText.trim().length > HEADER_MAX) return 'The header is limited to ' + HEADER_MAX + ' characters.';
    const hv = varsIn(f.headerText);
    if (hv.length > 1) return 'A header may hold one variable at most, written {{1}}.';
    if (hv.length && hv[0] !== 1) return 'The header’s variable must be written {{1}}.';
    if (hv.length && !f.headerExample.trim()) return 'Give the header’s {{1}} an example value.';
  }
  const body = f.body.trim();
  if (!body) return 'The body cannot be empty.';
  if (body.length > BODY_MAX) return 'The body is limited to ' + BODY_MAX + ' characters; this one is ' + body.length + '.';
  if (/\{\{\s*[^}]+\s*\}\}\s*$/.test(body)) return 'The body cannot end with a variable. Put a full stop or a few words after it.';
  const vars = varsIn(body);
  for (let i = 0; i < vars.length; i++) if (vars[i] !== i + 1) return 'Variables must run 1, 2, 3 with none skipped. This body jumps to {{' + vars[i] + '}}.';
  for (const n of vars) if (!String(f.bodyExamples[n - 1] || '').trim()) return 'Give {{' + n + '}} an example value — Meta rejects a template without one.';
  if (f.footer.trim().length > FOOTER_MAX) return 'The footer is limited to ' + FOOTER_MAX + ' characters.';
  if (varsIn(f.footer).length) return 'A footer cannot hold variables.';
  if (f.buttons.length > 10) return 'A template may carry 10 buttons at most.';
  const counts = {};
  for (const b of f.buttons) {
    counts[b.type] = (counts[b.type] || 0) + 1;
    if (!b.text.trim()) return 'Every button needs a label.';
    if (b.text.trim().length > BUTTON_MAX) return 'A button label is limited to ' + BUTTON_MAX + ' characters.';
    if (b.type === 'URL' && !/^https?:\/\//i.test(b.url.trim())) return 'A website button needs a full address starting http:// or https://.';
    if (b.type === 'PHONE_NUMBER' && b.phone.replace(/\D/g, '').length < 10) return 'A call button needs the full number with its country code, like +919876543210.';
    if (b.type === 'FLOW' && !/^[0-9]{5,25}$/.test(b.flowId)) return 'Pick which form the button should open.';
  }
  for (const [k, cap] of Object.entries(BUTTON_CAPS)) if ((counts[k] || 0) > cap) return 'At most ' + cap + ' ' + BUTTON_KINDS[k].toLowerCase() + ' button' + (cap > 1 ? 's' : '') + '.';
  return '';
}

/** A pretend template, so the builder's preview is drawn by the same renderer as View. */
function previewOf(f) {
  const vars = varsIn(f.body);
  return {
    name: f.name || 'new_template', language: f.language, category: f.category,
    headerFormat: f.headerType === 'TEXT' && f.headerText ? 'TEXT' : '', headerText: f.headerText,
    variableCount: vars.length ? Math.max(...vars) : 0,
    parts: { header: f.headerType === 'TEXT' ? f.headerText : '', body: f.body, footer: f.footer, buttons: f.buttons.map((b) => ({ type: b.type, text: b.text })) },
  };
}

// ── The builder ────────────────────────────────────────────────────────────

function Builder({ show, initial, onHide, onSaved }) {
  const editing = !!(initial && initial.id);
  const [f, setF] = useState(EMPTY);
  const [langs, setLangs] = useState([]);
  const [flows, setFlows] = useState([]);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    setF(initial ? { ...EMPTY, ...initial } : EMPTY);
    setMsg(null);
    sgGet('/template-languages').then((d) => setLangs(d.rows || [])).catch(() => setLangs([{ code: 'en_US', language: 'English (US)' }]));
    sgGet('/flows').then((d) => setFlows((d.rows || []).filter((x) => /PUBLISHED/i.test(x.status)))).catch(() => setFlows([]));
  }, [show, initial]);

  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const bodyVars = varsIn(f.body);
  const highest = bodyVars.length ? Math.max(...bodyVars) : 0;
  const headerHasVar = varsIn(f.headerText).length > 0;

  const addVar = () => {
    const n = highest + 1;
    set({ body: f.body.replace(/\s*$/, '') + (f.body.trim() ? ' ' : '') + '{{' + n + '}} ' });
  };
  const setExample = (i, v) => { const ex = f.bodyExamples.slice(); ex[i] = v; set({ bodyExamples: ex }); };
  const setButton = (i, patch) => { const bs = f.buttons.slice(); bs[i] = { ...bs[i], ...patch }; set({ buttons: bs }); };
  const addButton = (type) => set({ buttons: [...f.buttons, { type, text: '', url: '', phone: '', flowId: '' }] });

  const save = async () => {
    const p = problemOf(f, editing);
    if (p) { setMsg({ type: 'warning', text: p }); return; }
    setSaving(true); setMsg(null);
    try {
      const d = await sgPost('/templates/save', {
        id: editing ? f.id : undefined, name: f.name, category: f.category, language: f.language,
        headerType: f.headerType, headerText: f.headerText, headerExample: f.headerExample,
        body: f.body, bodyExamples: Array.from({ length: highest }, (_, i) => f.bodyExamples[i] || ''),
        footer: f.footer, buttons: f.buttons, approveForAll: !editing && f.approveForAll,
      });
      onSaved(d.message);
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static">
      <Modal.Header closeButton><Modal.Title as="h5">{editing ? '✏️ Edit template — sent back to Meta for approval' : '➕ New template'}</Modal.Title></Modal.Header>
      <Modal.Body>
        <Row className="g-3">
          <Col lg={7}>
            <h6 className="mb-1">Name, category and language</h6>
            <Form.Control size="sm" className="mb-1" placeholder="tenant_visit_reminder" maxLength={512} value={f.name} disabled={editing}
              onChange={(e) => set({ name: cleanName(e.target.value) })} />
            <div className="sg-mini mb-2">Lowercase letters, numbers and underscores. A template is referred to by its name for good — it cannot be renamed{editing ? ', and the language is fixed too' : ''}.</div>
            <Row className="g-2 mb-1">
              <Col sm={6}>
                <Form.Select size="sm" value={f.category} onChange={(e) => set({ category: e.target.value })}>
                  <option value="UTILITY">Utility — about something they already did</option>
                  <option value="MARKETING">Marketing — offers, news, anything promotional</option>
                </Form.Select>
              </Col>
              <Col sm={6}>
                <Form.Select size="sm" value={f.language} disabled={editing} onChange={(e) => set({ language: e.target.value })}>
                  {!langs.some((l) => l.code === f.language) && <option value={f.language}>{f.language}</option>}
                  {langs.map((l) => <option key={l.code} value={l.code}>{l.language} ({l.code})</option>)}
                </Form.Select>
              </Col>
            </Row>
            <div className="sg-mini mb-3">Meta charges Marketing and Utility differently — a promotion filed as Utility is rejected, or re-filed by Meta afterwards.</div>

            <h6 className="mb-1">Header <span className="sg-mini">optional, one line above the message</span></h6>
            <Form.Select size="sm" className="mb-1" style={{ maxWidth: 220 }} value={f.headerType} onChange={(e) => set({ headerType: e.target.value })}>
              <option value="NONE">No header</option>
              <option value="TEXT">Text header</option>
            </Form.Select>
            {f.headerType === 'TEXT' && (
              <>
                <Form.Control size="sm" className="mb-1" maxLength={HEADER_MAX} placeholder="Your listing is about to expire" value={f.headerText} onChange={(e) => set({ headerText: e.target.value })} />
                <div className="sg-mini mb-1">{f.headerText.length}/{HEADER_MAX}. One variable at most, written {'{{1}}'}.</div>
                {headerHasVar && <Form.Control size="sm" className="mb-1" placeholder="Example for {{1}}, e.g. Ramesh" value={f.headerExample} onChange={(e) => set({ headerExample: e.target.value })} />}
              </>
            )}
            <div className="sg-mini mb-3">A picture, video or PDF header needs an uploaded file handle, which this builder does not make — use SmartGrowth&apos;s own builder for those.</div>

            <h6 className="mb-1">Body <span className="sg-mini">required · {f.body.length}/{BODY_MAX}</span></h6>
            <Form.Control as="textarea" rows={5} size="sm" className="mb-1" maxLength={BODY_MAX + 50}
              placeholder="Hello {{1}}, your Rent Pondy listing {{2}} expires soon. Renew it to keep it visible to tenants."
              value={f.body} onChange={(e) => set({ body: e.target.value })} style={f.body.length > BODY_MAX ? { borderColor: '#c0392b' } : null} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <Button size="sm" variant="outline-secondary" onClick={addVar}>➕ Add a variable</Button>
              <span className="sg-mini">*bold*, _italic_ and ~strike~ work as in WhatsApp. A body cannot end on a variable.</span>
            </div>
            {highest > 0 && (
              <div className="mb-3 p-2" style={{ background: '#f7faf9', borderRadius: 8, border: '1px solid #e3ece9' }}>
                <div className="sg-mini mb-1">An example for each variable — Meta reads these to decide, and rejects a template without them.</div>
                {Array.from({ length: highest }, (_, i) => (
                  <Form.Control key={i} size="sm" className="mb-1" placeholder={'Example for {{' + (i + 1) + '}}'} value={f.bodyExamples[i] || ''} onChange={(e) => setExample(i, e.target.value)} />
                ))}
              </div>
            )}

            <h6 className="mb-1">Footer <span className="sg-mini">optional, small grey line · {f.footer.length}/{FOOTER_MAX}</span></h6>
            <Form.Control size="sm" className="mb-3" maxLength={FOOTER_MAX} placeholder="Rent Pondy" value={f.footer} onChange={(e) => set({ footer: e.target.value })} />

            <h6 className="mb-1">Buttons <span className="sg-mini">optional</span></h6>
            {f.buttons.map((b, i) => (
              <div key={i} className="d-flex gap-1 mb-1 align-items-center flex-wrap">
                <span className="sg-st other" style={{ minWidth: 86, textAlign: 'center' }}>{BUTTON_KINDS[b.type]}</span>
                <Form.Control size="sm" style={{ maxWidth: 190 }} maxLength={BUTTON_MAX} placeholder="Label" value={b.text} onChange={(e) => setButton(i, { text: e.target.value })} />
                {b.type === 'URL' && <Form.Control size="sm" style={{ maxWidth: 260 }} placeholder="https://pondyproperty.com/…" value={b.url} onChange={(e) => setButton(i, { url: e.target.value })} />}
                {b.type === 'PHONE_NUMBER' && <Form.Control size="sm" style={{ maxWidth: 200 }} placeholder="+919876543210" value={b.phone} onChange={(e) => setButton(i, { phone: e.target.value })} />}
                {b.type === 'FLOW' && (
                  <Form.Select size="sm" style={{ maxWidth: 260 }} value={b.flowId} onChange={(e) => setButton(i, { flowId: e.target.value })}>
                    <option value="">— a published form —</option>
                    {flows.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </Form.Select>
                )}
                <Button size="sm" variant="outline-danger" onClick={() => set({ buttons: f.buttons.filter((_, j) => j !== i) })}>✕</Button>
              </div>
            ))}
            <Dropdown as={ButtonGroup} size="sm" className="mb-1">
              <Dropdown.Toggle variant="outline-secondary" size="sm">➕ Add a button</Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.entries(BUTTON_KINDS).map(([k, l]) => <Dropdown.Item key={k} onClick={() => addButton(k)}>{l}</Dropdown.Item>)}
              </Dropdown.Menu>
            </Dropdown>
            <div className="sg-mini mb-3">
              Quick replies send their own label back as a message — which is what a Chatbot starter listens for. They may sit alongside
              website, call and form buttons. Meta&apos;s ceilings: 3 quick replies, 2 website, 1 call, 1 form, 10 in all.
            </div>

            {!editing && (
              <Form.Check className="mb-2" id="sgTbApproveAll" label="Approve this template for every WhatsApp number on the account"
                checked={f.approveForAll} onChange={(e) => set({ approveForAll: e.target.checked })} />
            )}
            <Msg msg={msg} />
          </Col>
          <Col lg={5}>
            <h6 className="mb-2">What they will see</h6>
            <TemplatePreview t={previewOf(f)} vars={f.bodyExamples} headerVar={f.headerExample} />
            <div className="sg-mini mt-2">The highlighted words are the variables, shown with the examples you gave — which is also what Meta reads when it decides.</div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="success" disabled={saving} onClick={save}>{saving ? 'Sending…' : '📨 Send for approval'}</Button>
      </Modal.Footer>
    </Modal>
  );
}

// ── The library ────────────────────────────────────────────────────────────

export default function SgTemplates() {
  const tpl = useTemplates();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState(null);
  const [view, setView] = useState(null);
  const [raw, setRaw] = useState(false);
  const [builder, setBuilder] = useState(null);     // null = closed, {} = new, form = edit
  const [auth, setAuth] = useState(null);           // null = closed, string = the name being typed
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState(null);
  const [del, setDel] = useState(null);
  const [delBusy, setDelBusy] = useState(false);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return tpl.templates
      .filter((t) => !status || String(t.status).toUpperCase().startsWith(status))
      .filter((t) => !ql || t.name.toLowerCase().includes(ql) || String(t.bodyText || '').toLowerCase().includes(ql))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tpl.templates, q, status]);

  const counts = useMemo(() => {
    const c = {};
    for (const t of tpl.templates) { const s = String(t.status || '').toUpperCase(); c[s] = (c[s] || 0) + 1; }
    return c;
  }, [tpl.templates]);

  const saved = (text) => { setBuilder(null); setMsg({ type: 'success', text }); tpl.reload(true); };

  const saveAuth = async () => {
    const name = cleanName(auth);
    if (!name) { setAuthMsg({ type: 'warning', text: 'Give the template a name.' }); return; }
    setAuthBusy(true); setAuthMsg(null);
    try {
      const d = await sgPost('/templates/auth', { name });
      setAuth(null);
      setMsg({ type: 'success', text: d.message });
      tpl.reload(true);
    } catch (e) { setAuthMsg({ type: 'danger', text: e.message }); }
    finally { setAuthBusy(false); }
  };

  const doDelete = async () => {
    setDelBusy(true);
    try {
      const d = await sgPost('/templates/delete', { id: del.id, name: del.name });
      setMsg({ type: 'success', text: d.message });
      tpl.reload(true);
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setDelBusy(false); setDel(null); }
  };

  const why = view && view.raw ? (view.raw.rejected_reason || view.raw.rejectedReason || view.raw.reason || '') : '';
  const exportParams = { q: q.trim(), status };

  return (
    <SgPage title="Templates" sub="The wording Meta has approved — and the builder that writes new ones">
      <div className="sg-card">
        <div className="sg-help">
          A template is a message Meta has read and approved in advance. It is the <b>only</b> thing that can be sent to somebody who has not written to us in the
          last 24 hours. Write one here and it goes straight to Meta: <b>PENDING</b> while they read it, then <b>APPROVED</b> and ready for Send Message, or
          <b> REJECTED</b> with their reason. <b>The name and the language cannot be changed afterwards</b> — everything else can be edited and sent back for approval.
        </div>
        <div className="sg-bar">
          <Form.Control size="sm" style={{ width: 240 }} placeholder="Search by name or wording" value={q} onChange={(e) => setQ(e.target.value)} />
          <Form.Select size="sm" style={{ width: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            <option value="APPROVED">Approved ({counts.APPROVED || 0})</option>
            <option value="PENDING">Pending ({counts.PENDING || 0})</option>
            <option value="REJECTED">Rejected ({counts.REJECTED || 0})</option>
          </Form.Select>
          <Button size="sm" variant="outline-success" onClick={() => tpl.reload(true)}>⟳ Refresh</Button>
          <span className="sg-grow" />
          <Dropdown as={ButtonGroup} size="sm">
            <Button size="sm" variant="outline-secondary" title="A printable list of what is below" onClick={() => window.open(sgUrl('/templates/print', exportParams), '_blank', 'noopener')}>📄 Export PDF</Button>
            <Dropdown.Toggle split variant="outline-secondary" size="sm" />
            <Dropdown.Menu align="end">
              <Dropdown.Item onClick={() => window.open(sgUrl('/templates/print', exportParams), '_blank', 'noopener')}>PDF — a printable list</Dropdown.Item>
              <Dropdown.Item onClick={() => downloadUrl(sgUrl('/templates/export', exportParams))}>CSV — opens in Excel</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button size="sm" variant="outline-secondary" title="Meta writes an OTP template itself — it only needs a name" onClick={() => { setAuth(''); setAuthMsg(null); }}>🔑 OTP template</Button>
          <Button size="sm" variant="success" onClick={() => setBuilder({})}>➕ New template</Button>
        </div>
        <Msg msg={msg} onClose={() => setMsg(null)} />
        {tpl.loading && <Busy text="Loading templates…" />}
        {tpl.error && <Msg msg={{ type: 'danger', text: tpl.error }} />}
        <div className="sg-wrap">
          <Table size="sm" hover className="sg-table">
            <thead>
              <tr><th>Name</th><th>Category</th><th>Status</th><th>Vars</th><th>Header</th><th>Body</th><th>Buttons</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id + t.language}>
                  <td className="sg-nowrap"><b>{t.name}</b><div className="sg-mini">{t.language}</div></td>
                  <td><CatBadge category={t.category} /></td>
                  <td><StatusPill status={t.status} /></td>
                  <td>{t.variableCount || ''}</td>
                  <td>{t.headerFormat ? t.headerFormat.toLowerCase() : ''}</td>
                  <td style={{ maxWidth: 440 }}><div style={{ maxHeight: 54, overflow: 'hidden', whiteSpace: 'pre-wrap' }}>{t.bodyText}</div></td>
                  <td>{t.parts && t.parts.buttons && t.parts.buttons.length ? t.parts.buttons.length : ''}</td>
                  <td className="sg-nowrap">
                    <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => { setView(t); setRaw(false); }}>View</Button>
                    {String(t.category).toUpperCase() !== 'AUTHENTICATION' && (
                      <Button size="sm" variant="outline-primary" className="me-1" onClick={() => setBuilder(formFrom(t))}>Edit</Button>
                    )}
                    <Button size="sm" variant="outline-danger" onClick={() => setDel(t)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {!tpl.loading && !rows.length && <tr><td colSpan={8} className="sg-mini text-center py-3">No template matches.</td></tr>}
            </tbody>
          </Table>
        </div>
        <div className="sg-mini">{rows.length} of {tpl.templates.length} template(s)</div>
      </div>

      <Builder show={!!builder} initial={builder && builder.id ? builder : null} onHide={() => setBuilder(null)} onSaved={saved} />

      <Modal show={!!view} onHide={() => setView(null)} size="lg">
        <Modal.Header closeButton><Modal.Title as="h5">{view && view.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          {view && (
            <>
              <div className="mb-2 d-flex gap-2 align-items-center flex-wrap">
                <CatBadge category={view.category} /> <StatusPill status={view.status} />
                <span className="sg-mini">{view.language} · id <span className="sg-mono">{view.id}</span> · {view.variableCount} variable(s)</span>
              </div>
              <TemplatePreview t={view} vars={view.examples} />
              {why && <Msg msg={{ type: 'danger', text: 'Meta’s reason: ' + why }} />}
              {view.parts && view.parts.metaFixed && <div className="sg-mini mt-2">Meta writes and fixes this wording itself — it cannot be edited.</div>}
              <Button size="sm" variant="link" className="px-0 mt-2" onClick={() => setRaw(!raw)}>{raw ? '▲ Hide' : '▼ All details from SmartGrowth'}</Button>
              {raw && <pre className="sg-mono" style={{ maxHeight: 360, overflow: 'auto', background: '#f7faf9', padding: 10, borderRadius: 6 }}>{JSON.stringify(view.raw, null, 2)}</pre>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setView(null)}>Close</Button></Modal.Footer>
      </Modal>

      <Modal show={auth !== null} onHide={() => setAuth(null)} centered>
        <Modal.Header closeButton><Modal.Title as="h5">🔑 One-time-password template</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Label className="mb-1">Name</Form.Label>
          <Form.Control maxLength={512} placeholder="login_otp" value={auth || ''} onChange={(e) => setAuth(cleanName(e.target.value))} />
          <div className="sg-mini mt-1 mb-2">Lowercase letters, numbers and underscores.</div>
          <div className="sg-help mb-2">
            Meta fixes everything about an authentication template — the wording, the <b>Copy code</b> button, the line about not sharing the code.
            There is nothing else to fill in, and nothing here can change it afterwards.
          </div>
          <Msg msg={authMsg} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAuth(null)}>Cancel</Button>
          <Button variant="success" disabled={authBusy} onClick={saveAuth}>📨 Send for approval</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!del} onHide={() => setDel(null)} centered>
        <Modal.Header closeButton><Modal.Title as="h5">Delete “{del && del.name}”?</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="mb-2">Meta deletes templates <b>by name</b>: every language of <span className="sg-mono">{del && del.name}</span> goes, not only this row.</p>
          <p className="sg-mini mb-0">It cannot be brought back, and the same name cannot be used again for a while. An unused template costs nothing — leaving it is always safe.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDel(null)}>Cancel</Button>
          <Button variant="danger" disabled={delBusy} onClick={doDelete}>{delBusy ? 'Deleting…' : '🗑 Delete'}</Button>
        </Modal.Footer>
      </Modal>
    </SgPage>
  );
}
