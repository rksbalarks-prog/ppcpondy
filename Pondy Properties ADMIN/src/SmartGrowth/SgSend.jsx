// Communication > WhatsApp > Send Message — ported from PM_Matri_Admin's
// whatsapp/index (tab 'send').
//
// Three ways to send an approved template: one number, a pasted list, or a
// sheet with a column per template variable (each row its own message, sent
// in chunks with progress). Settings and the template list sit folded under
// More Info — needed to set up, not to send — and open by themselves when the
// account is not connected yet.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { sgPost, sgUpload, sgUrl } from './sgApi';
import { SgPage, Msg, Busy, StatusPill, CatBadge, ReportLink, useSgConfig, useTemplates, downloadUrl, fmtNum } from './common';
import { TemplatePicker, TemplatePreview, HeaderMediaBox, VarInputs, MEDIA_FORMATS, isApproved } from './TemplateBits';

const DEFAULT_CC = '91';

/** The same rule the server applies: digits, no trunk zero, 91 in front of ten digits or fewer. */
function normalise(raw, cc = DEFAULT_CC) {
  let d = String(raw || '').replace(/\D+/g, '').replace(/^0+/, '');
  if (!d) return '';
  if (d.length <= 10) d = (String(cc || '').replace(/\D+/g, '') || DEFAULT_CC) + d;
  return d;
}

/** Newline / comma / semicolon separate numbers — never spaces ("+91 93615 46021" is one). */
function splitNumbers(raw) {
  const out = [];
  for (let c of String(raw || '').split(/[\r\n,;]+/)) {
    c = c.trim();
    if (!c) continue;
    if (c.replace(/\D+/g, '').length > 15) out.push(...c.split(/\s+/).filter(Boolean));
    else out.push(c);
  }
  return out;
}

function istStamp() {
  const t = new Date(Date.now() + 330 * 60000);
  const p = (n) => String(n).padStart(2, '0');
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}-${p(t.getUTCHours())}${p(t.getUTCMinutes())}${p(t.getUTCSeconds())}`;
}

// ── More Info: settings + the template list ────────────────────────────────

function SettingsCard({ cfgState }) {
  const { cfg, setCfg } = cfgState;
  const [f, setF] = useState({ baseUrl: '', apiCode: '', apiToken: '' });
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (cfg) setF({ baseUrl: cfg.baseUrl || '', apiCode: cfg.apiCode || '', apiToken: '' }); }, [cfg]);
  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const d = await sgPost('/settings', f);
      setMsg({ type: 'success', text: d.message });
      setCfg((c) => ({ ...c, configured: d.configured, tokenMask: d.tokenMask, tokenSet: !!d.tokenMask, apiCode: d.apiCode, baseUrl: d.baseUrl, tokenFromEnv: false }));
      setF((x) => ({ ...x, apiToken: '' }));
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setSaving(false); }
  };
  return (
    <div className="sg-card">
      <h4>⚙️ Settings</h4>
      <div className="sg-help">
        Stored on this server only; the token is never shown in full again. Get both from your SmartGrowth AI account.
        Left blank, the panel uses <span className="sg-mono">SMARTGROWTH_PANEL_TOKEN</span> / <span className="sg-mono">SMARTGROWTH_PANEL_API_CODE</span> from the server&apos;s .env — never any other account&apos;s key.
      </div>
      <Row className="g-2">
        <Col md={4}><Form.Label className="mb-1">API base URL</Form.Label><Form.Control size="sm" value={f.baseUrl} onChange={(e) => setF({ ...f, baseUrl: e.target.value })} /></Col>
        <Col md={4}><Form.Label className="mb-1">API code</Form.Label><Form.Control size="sm" value={f.apiCode} placeholder="your assigned API code" onChange={(e) => setF({ ...f, apiCode: e.target.value })} /></Col>
        <Col md={4}>
          <Form.Label className="mb-1">API token {cfg && cfg.tokenSet && <span className="sg-mini">(saved: {cfg.tokenMask} — blank keeps it)</span>}</Form.Label>
          <Form.Control size="sm" type="password" autoComplete="new-password" value={f.apiToken} placeholder={cfg && cfg.tokenSet ? 'leave blank to keep the saved one' : 'paste your Bearer token'} onChange={(e) => setF({ ...f, apiToken: e.target.value })} />
        </Col>
      </Row>
      <Button size="sm" className="mt-2" variant="success" disabled={saving} onClick={save}>💾 Save settings</Button>
      <div className="mt-2"><Msg msg={msg} /></div>
    </div>
  );
}

function TemplateListCard({ tpl, onPick }) {
  const [status, setStatus] = useState('APPROVED');
  const [q, setQ] = useState('');
  const rows = tpl.templates.filter((t) => (status === 'ALL' || String(t.status).toUpperCase().startsWith(status))
    && (!q || t.name.toLowerCase().includes(q.toLowerCase()) || t.bodyText.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="sg-card">
      <h4>📋 Templates in your SmartGrowth account</h4>
      <div className="sg-help">Live approval status (the same source as the SmartGrowth dashboard). Only <b>Approved</b> templates can be sent. Click a row to choose it below.</div>
      <div className="sg-bar">
        <Button size="sm" variant="outline-success" onClick={() => tpl.reload(true)}>⟳ Reload</Button>
        <Form.Select size="sm" style={{ width: 170 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="APPROVED">Approved only</option><option value="ALL">All statuses</option>
          <option value="PENDING">Pending only</option><option value="REJECTED">Rejected only</option>
        </Form.Select>
        <Form.Control size="sm" style={{ width: 220 }} placeholder="Filter templates…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="sg-mini">{rows.length} of {tpl.templates.length}</span>
      </div>
      {tpl.loading && <Busy text="Loading templates…" />}
      {tpl.error && <Msg msg={{ type: 'danger', text: tpl.error }} />}
      <div className="sg-wrap" style={{ maxHeight: 360 }}>
        <Table size="sm" hover className="sg-table">
          <thead><tr><th>Name</th><th>Category</th><th>Language</th><th>Status</th><th>Vars</th><th>Header</th><th>Body</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className={isApproved(t) ? 'sg-click' : ''} onClick={() => isApproved(t) && onPick(t)}>
                <td className="sg-nowrap"><b>{t.name}</b></td><td><CatBadge category={t.category} /></td><td>{t.language}</td>
                <td><StatusPill status={t.status} /></td><td>{t.variableCount}</td><td>{t.headerFormat ? t.headerFormat.toLowerCase() : ''}</td>
                <td style={{ maxWidth: 420 }}><div style={{ maxHeight: 54, overflow: 'hidden' }}>{t.bodyText}</div></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

// ── The send form ──────────────────────────────────────────────────────────

export default function SgSend() {
  const cfgState = useSgConfig();
  const { cfg } = cfgState;
  const tpl = useTemplates();
  const [moreInfo, setMoreInfo] = useState(null);         // null = follow "connected?"
  const [mode, setMode] = useState('single');
  const [t, setT] = useState(null);
  const [vars, setVars] = useState([]);
  const [head, setHead] = useState({ mediaUrl: '', fileName: '', headerParams: [] });
  const [single, setSingle] = useState('');
  const [bulk, setBulk] = useState('');
  const [msg, setMsg] = useState(null);
  const [sending, setSending] = useState(false);
  const [review, setReview] = useState(null);
  const [clock, setClock] = useState(istStamp());
  const sendCardRef = useRef(null);

  // Sheet state
  const [sheet, setSheet] = useState(null);               // parse-sheet answer
  const [headerRow, setHeaderRow] = useState(-1);
  const [phoneCol, setPhoneCol] = useState(0);
  const [varCols, setVarCols] = useState([]);             // per {{n}}: column index, or -1
  const [cc, setCc] = useState(DEFAULT_CC);
  const [progress, setProgress] = useState(null);         // { done, total }
  const [rowResults, setRowResults] = useState([]);
  const stopRef = useRef(false);

  // The name ticks so what is on screen is exactly what will be sent.
  useEffect(() => { const id = setInterval(() => setClock(istStamp()), 1000); return () => clearInterval(id); }, []);
  const campaignName = ((cfg && cfg.adminLogin) || 'admin') + '-' + clock;
  const showMore = moreInfo === null ? !!(cfg && !cfg.configured) : moreInfo;

  const pick = (x) => {
    setT(x);
    setVars([]);
    setHead({ mediaUrl: '', fileName: '', headerParams: [] });
    setVarCols(x ? Array.from({ length: x.variableCount }, () => -1) : []);
    if (sendCardRef.current) sendCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const singleNorm = normalise(single);
  const bulkList = useMemo(() => {
    const seen = new Set(); const bad = [];
    for (const p of splitNumbers(bulk)) { const d = normalise(p); if (d.length < 8 || d.length > 15) bad.push(p); else seen.add(d); }
    return { ok: [...seen], bad };
  }, [bulk]);

  // ── Sheet: parse, map, preview ──
  const split = (all, hi) => {
    const width = all.reduce((m, r) => Math.max(m, r.length), 0);
    const headers = Array.from({ length: width }, (_, c) => (hi >= 0 && String((all[hi] || [])[c] || '').trim()) || 'Column ' + (c + 1));
    const rows = all.slice(hi + 1).map((r) => headers.map((_, c) => String(r[c] === undefined ? '' : r[c]).trim())).filter((r) => r.some((x) => x));
    return { headers, rows };
  };
  const table = useMemo(() => (sheet ? split(sheet.allRows, headerRow) : { headers: [], rows: [] }), [sheet, headerRow]);
  const autoMap = (headers, x) => {
    const lower = headers.map((h) => h.toLowerCase());
    const ph = lower.findIndex((h) => /phone|mobile|number|whatsapp/.test(h));
    setPhoneCol(ph >= 0 ? ph : 0);
    if (x) {
      setVarCols(Array.from({ length: x.variableCount }, (_, i) => {
        const ex = String((x.examples || [])[i] || 'var' + (i + 1)).toLowerCase();
        const at = lower.findIndex((h) => h === ex);
        return at >= 0 ? at : (lower.length > i + 1 ? i + 1 : -1);
      }));
    }
  };
  const onSheet = async (file) => {
    if (!file) return;
    setMsg(null); setRowResults([]);
    const fd = new FormData(); fd.append('sheet', file);
    try {
      const d = await sgUpload('/parse-sheet', fd);
      setSheet(d); setHeaderRow(d.headerIndex);
      autoMap(split(d.allRows, d.headerIndex).headers, t);
    } catch (e) { setMsg({ type: 'danger', text: e.message }); setSheet(null); }
  };
  const sheetRows = useMemo(() => table.rows.map((r) => ({
    phone: r[phoneCol] || '',
    vars: (t ? Array.from({ length: t.variableCount }, (_, i) => (varCols[i] >= 0 ? r[varCols[i]] || '' : '')) : []),
  })), [table, phoneCol, varCols, t]);
  const sheetGood = sheetRows.filter((r) => { const d = normalise(r.phone, cc); return d.length >= 8 && d.length <= 15; });

  const sampleSheet = () => {
    if (!t) return;
    const cols = Array.from({ length: t.variableCount }, (_, i) => (t.examples && t.examples[i]) || 'var' + (i + 1));
    downloadUrl(sgUrl('/sample-sheet', { columns: JSON.stringify(cols.length ? cols : ['var1']), name: t.name }));
  };

  // ── Review, then send ──
  const problems = () => {
    if (!cfg || !cfg.configured) return 'Save the API token and API code under More Info first.';
    if (!t) return 'Choose a template first.';
    const fmt = String(t.headerFormat || '').toUpperCase();
    if (MEDIA_FORMATS.includes(fmt) && !head.mediaUrl) return 'This template opens with a ' + fmt.toLowerCase() + '. Upload the file or paste its public link.';
    if (mode !== 'sheet' && t.variableCount && vars.filter((v) => String(v || '').trim()).length < t.variableCount)
      return 'Fill every {{n}} value — WhatsApp refuses a template with a blank left empty.';
    if (mode === 'single' && singleNorm.length < 8) return 'Enter the phone number.';
    if (mode === 'bulk' && !bulkList.ok.length) return 'Paste at least one usable number.';
    if (mode === 'sheet') {
      if (!sheet) return 'Upload the sheet first.';
      if (!sheetGood.length) return 'No row in that sheet has a usable phone number in the chosen column.';
      if (t.variableCount && varCols.some((c) => c < 0)) return 'Choose a column for every {{n}}.';
    }
    return '';
  };
  const openReview = () => {
    const p = problems();
    if (p) { setMsg({ type: 'warning', text: p }); return; }
    const count = mode === 'single' ? 1 : mode === 'bulk' ? bulkList.ok.length : sheetGood.length;
    setReview({ count, name: campaignName });
  };

  const send = async () => {
    const name = review.name;
    setReview(null); setSending(true); setMsg(null); setRowResults([]);
    const common = { templateId: t.id, templateName: t.name, campaignName: name, mediaUrl: head.mediaUrl, fileName: head.fileName, headerParams: head.headerParams };
    try {
      if (mode !== 'sheet') {
        const d = await sgPost('/send', { ...common, phoneNumbers: mode === 'single' ? single : bulk, variables: vars });
        setMsg({ type: 'success', text: d.message });
      } else {
        const per = (cfg && cfg.rowsPerRequest) || 25;
        const all = sheetGood;
        let sent = 0; let failed = 0; const results = [];
        stopRef.current = false;
        setProgress({ done: 0, total: all.length });
        for (let i = 0; i < all.length; i += per) {
          if (stopRef.current) break;
          const d = await sgPost('/send-rows', { ...common, rows: all.slice(i, i + per), countryCode: cc });
          sent += d.sent; failed += d.failed; results.push(...d.results);
          setRowResults(results.slice());
          setProgress({ done: Math.min(all.length, i + per), total: all.length });
        }
        setMsg({ type: failed ? 'warning' : 'success', text: `${stopRef.current ? 'Stopped. ' : ''}${fmtNum(sent)} accepted, ${fmtNum(failed)} not sent — campaign ${name}. Check Message Status for what Meta did with each one.` });
      }
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
    } finally {
      setSending(false);
      setProgress(null);
    }
  };

  return (
    <SgPage title="Send Message" sub="WhatsApp templates through SmartGrowth — one number, a list, or a sheet" cfgState={cfgState}
      right={<ReportLink query="src=send" />}>
      <div className="mb-3">
        <Button size="sm" variant="outline-secondary" onClick={() => setMoreInfo(!showMore)}>{showMore ? '▲' : '▼'} More Info</Button>
        <span className="sg-mini ms-2">API settings and your template list</span>
      </div>
      {showMore && <><SettingsCard cfgState={cfgState} /><TemplateListCard tpl={tpl} onPick={pick} /></>}

      <div className="sg-card" ref={sendCardRef}>
        <h4>📤 Send WhatsApp message</h4>
        <ButtonGroup size="sm" className="mb-3">
          {[['single', '👤 Single send'], ['bulk', '👥 Bulk send'], ['sheet', '📗 Excel / CSV']].map(([k, l]) => (
            <Button key={k} variant={mode === k ? 'success' : 'outline-success'} onClick={() => setMode(k)}>{l}</Button>
          ))}
        </ButtonGroup>
        <Row className="g-3">
          <Col lg={6}>
            <Form.Label className="mb-1">Template</Form.Label>
            {tpl.loading && <Busy text="Loading templates…" />}
            {tpl.error && <Msg msg={{ type: 'danger', text: tpl.error }} />}
            <TemplatePicker templates={tpl.templates} value={t && t.id} onChange={pick} />
            <div className="sg-mini mt-1 mb-2">Only approved templates. <b>UTILITY</b> is charged at the lower rate; <b>MARKETING</b> at the higher.</div>
            {t && <TemplatePreview t={t} vars={mode === 'sheet' && sheetRows[0] ? sheetRows[0].vars : vars} headerVar={(head.headerParams || [])[0]} mediaUrl={head.mediaUrl} />}
            <div className="mt-2"><HeaderMediaBox t={t} value={head} onChange={setHead} /></div>
            {mode !== 'sheet' && <VarInputs t={t} values={vars} onChange={setVars} />}
          </Col>
          <Col lg={6}>
            <Form.Label className="mb-1">Campaign name <span className="sg-mini">created automatically — who sent it, and when</span></Form.Label>
            <div className="sg-mono mb-3 p-2" style={{ background: '#f3f6f5', borderRadius: 6 }}>{campaignName}</div>

            {mode === 'single' && (
              <Form.Group className="mb-3">
                <Form.Label className="mb-1">Phone number <span className="sg-mini">a 10-digit number gets +91 added</span></Form.Label>
                <Form.Control placeholder="9361546021" value={single} onChange={(e) => setSingle(e.target.value)} />
                {single && <div className="sg-mini mt-1">Will be sent to <b>{singleNorm.length >= 8 ? '+' + singleNorm : 'nothing usable yet'}</b></div>}
              </Form.Group>
            )}
            {mode === 'bulk' && (
              <Form.Group className="mb-3">
                <Form.Label className="mb-1">Phone numbers <span className="sg-mini">one per line, or comma separated</span></Form.Label>
                <Form.Control as="textarea" rows={6} placeholder={'919361546021\n9876543210'} value={bulk} onChange={(e) => setBulk(e.target.value)} />
                <div className="sg-mini mt-1">{fmtNum(bulkList.ok.length)} valid number(s){bulkList.bad.length ? ` · ${bulkList.bad.length} unreadable: ${bulkList.bad.slice(0, 3).join(', ')}` : ''}</div>
              </Form.Group>
            )}
            {mode === 'sheet' && (
              <Form.Group className="mb-3">
                <Form.Label className="mb-1">Recipient sheet <span className="sg-mini">.xlsx or .csv — one row per person</span></Form.Label>
                <div className="mb-2"><Button size="sm" variant="outline-secondary" disabled={!t} onClick={sampleSheet}>⬇ Download sample sheet</Button> <span className="sg-mini">columns for this template&apos;s variables</span></div>
                <Form.Control type="file" accept=".xlsx,.xls,.csv,.txt" onChange={(e) => onSheet(e.target.files[0])} />
                {sheet && <div className="sg-mini mt-1">{sheet.fileName}: {fmtNum(table.rows.length)} row(s), {fmtNum(sheetGood.length)} with a usable number.</div>}
              </Form.Group>
            )}

            <Button variant="success" size="lg" disabled={sending} onClick={openReview}>🟢 Review &amp; Send</Button>
            {progress && (
              <div className="mt-3">
                <div className="sg-progress"><div style={{ width: (progress.done / Math.max(1, progress.total)) * 100 + '%' }} /></div>
                <div className="sg-mini mt-1 d-flex align-items-center gap-2">
                  {fmtNum(progress.done)} of {fmtNum(progress.total)} rows
                  <Button size="sm" variant="outline-danger" onClick={() => { stopRef.current = true; }}>■ Stop after this chunk</Button>
                </div>
              </div>
            )}
            <div className="mt-3"><Msg msg={msg} onClose={() => setMsg(null)} /></div>
          </Col>
        </Row>

        {mode === 'sheet' && sheet && (
          <Row className="g-3 mt-2 pt-3" style={{ borderTop: '1px dashed #ddd' }}>
            <Col md={5}>
              <h6>Which column is which</h6>
              <Form.Label className="mb-1 small">Header row <span className="sg-mini">the row holding the column names</span></Form.Label>
              <Form.Select size="sm" className="mb-2" value={headerRow} onChange={(e) => { const hi = Number(e.target.value); setHeaderRow(hi); autoMap(split(sheet.allRows, hi).headers, t); }}>
                <option value={-1}>No header row — the first row is data</option>
                {sheet.allRows.slice(0, 10).map((r, i) => <option key={i} value={i}>Row {i + 1}: {r.slice(0, 4).join(' | ').slice(0, 60)}</option>)}
              </Form.Select>
              <Form.Label className="mb-1 small">Phone number column</Form.Label>
              <Form.Select size="sm" className="mb-2" value={phoneCol} onChange={(e) => setPhoneCol(Number(e.target.value))}>
                {table.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
              </Form.Select>
              {t && Array.from({ length: t.variableCount }, (_, i) => (
                <div key={i} className="mb-2">
                  <Form.Label className="mb-1 small">{'{{' + (i + 1) + '}}'}{t.examples && t.examples[i] ? <span className="sg-mini"> e.g. {t.examples[i]}</span> : null}</Form.Label>
                  <Form.Select size="sm" value={varCols[i] === undefined ? -1 : varCols[i]} onChange={(e) => { const n = varCols.slice(); n[i] = Number(e.target.value); setVarCols(n); }}>
                    <option value={-1}>— choose a column —</option>
                    {table.headers.map((h, j) => <option key={j} value={j}>{h}</option>)}
                  </Form.Select>
                </div>
              ))}
              <Form.Label className="mb-1 small">Country code <span className="sg-mini">added to numbers that have none</span></Form.Label>
              <Form.Control size="sm" style={{ width: 110 }} value={cc} onChange={(e) => setCc(e.target.value)} />
            </Col>
            <Col md={7}>
              <h6>Preview <span className="sg-mini">first 20 rows</span></h6>
              <div className="sg-wrap" style={{ maxHeight: 340 }}>
                <Table size="sm" className="sg-table">
                  <thead><tr><th>#</th><th>Sends to</th>{t && Array.from({ length: t.variableCount }, (_, i) => <th key={i}>{'{{' + (i + 1) + '}}'}</th>)}</tr></thead>
                  <tbody>
                    {sheetRows.slice(0, 20).map((r, i) => {
                      const d = normalise(r.phone, cc);
                      const ok = d.length >= 8 && d.length <= 15;
                      return (
                        <tr key={i} style={ok ? null : { color: '#a12626' }}>
                          <td>{i + 1}</td><td className="sg-nowrap">{ok ? '+' + d : (r.phone || '(empty)') + ' ✗'}</td>
                          {r.vars.map((v, j) => <td key={j}>{v}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Col>
          </Row>
        )}

        {rowResults.length > 0 && (
          <div className="mt-3">
            <h6>Result for each row</h6>
            <div className="sg-wrap" style={{ maxHeight: 360 }}>
              <Table size="sm" className="sg-table">
                <thead><tr><th>Number</th><th>Result</th><th>HTTP</th><th>SmartGrowth said</th></tr></thead>
                <tbody>
                  {rowResults.map((r, i) => (
                    <tr key={i}><td className="sg-nowrap">{r.phone ? '+' + r.phone : '—'}</td><td><StatusPill status={r.ok ? 'sent' : 'failed'} /></td><td>{r.code || ''}</td><td>{r.message}</td></tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <Modal show={!!review} onHide={() => setReview(null)} centered>
        <Modal.Header closeButton><Modal.Title as="h5">Send this WhatsApp campaign?</Modal.Title></Modal.Header>
        <Modal.Body>
          {review && t && (
            <>
              <p className="mb-2">
                <b>{t.name}</b> <CatBadge category={t.category} /> to <b>{fmtNum(review.count)}</b> number{review.count === 1 ? '' : 's'}
                {mode === 'sheet' ? ', one message per row' : ''}.
              </p>
              <p className="sg-mini mb-2">Campaign name: <span className="sg-mono">{review.name}</span></p>
              <p className="sg-mini mb-0">These are real WhatsApp messages and each one spends a credit. Numbers that asked us to stop, and numbers already at today&apos;s campaign limit, are left out and named in the result.</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setReview(null)}>Cancel</Button>
          <Button variant="success" onClick={send}>🟢 Send now</Button>
        </Modal.Footer>
      </Modal>
    </SgPage>
  );
}

// Re-exported for Chats' template dialog, so the two forms cannot drift.
export { normalise, splitNumbers };
