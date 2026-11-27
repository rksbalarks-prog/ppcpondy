// AI & Automation > Autobot > New User Bot — ported from PM_Matri_Admin's
// autobot/newUserBot. An uploaded list of numbers — people who are not on
// Rent Pondy yet — is sent one template a few at a time, inside the sending
// hours, up to a daily limit. Numbers already on Rent Pondy, duplicates and
// numbers that asked us to stop are left out at upload. A list is saved
// paused; switching it on is a second decision.

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, Form, InputGroup, Modal, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { sgGet, sgPost, sgUpload, sgUrl } from './sgApi';
import { SgPage, Msg, Busy, StatusPill, Tiles, fmtWhen, fmtNum, useTemplates, downloadUrl, ReportLink } from './common';
import { TemplatePicker, TemplatePreview, HeaderMediaBox, MEDIA_FORMATS } from './TemplateBits';
import { RunnerBanners } from './SgBotRuns';

const HOURS = Array.from({ length: 25 }, (_, h) => h);
const hourLabel = (h) => (h === 0 || h === 24 ? '12am' : h === 12 ? '12pm' : h < 12 ? h + 'am' : (h - 12) + 'pm');

const blankForm = () => ({
  name: '', templateId: '', templateName: '', headerFormat: '', mediaUrl: '', varCount: 0, varMap: {},
  nameFallback: 'Friend', hourFrom: 9, hourTo: 20, sendDelay: 30, dailyQuota: 200,
});

/** Each {{n}}: the name from the list, or fixed text. */
function NameOrText({ count, value, onChange }) {
  if (!count) return null;
  const v = value || {};
  return (
    <div className="mb-2">
      <Form.Label className="mb-1 small">Fill the blanks</Form.Label>
      {Array.from({ length: count }, (_, i) => {
        const n = String(i + 1);
        const spec = String(v[n] || '');
        const isText = spec.startsWith('text:');
        return (
          <InputGroup size="sm" className="mb-1" key={n}>
            <InputGroup.Text style={{ minWidth: 54 }}>{'{{' + n + '}}'}</InputGroup.Text>
            <Form.Select style={{ maxWidth: 200 }} value={isText ? 'text' : spec} onChange={(e) => onChange({ ...v, [n]: e.target.value === 'text' ? 'text:' : e.target.value })}>
              <option value="">— choose —</option>
              <option value="name">Name from the list</option>
              <option value="text">Fixed text…</option>
            </Form.Select>
            {isText && <Form.Control placeholder="the same for everybody" value={spec.slice(5)} onChange={(e) => onChange({ ...v, [n]: 'text:' + e.target.value })} />}
          </InputGroup>
        );
      })}
    </div>
  );
}

/** Template + pace, shared by the upload card and the Edit dialog. */
function NuFields({ f, setF, tpl }) {
  const t = tpl.templates.find((x) => x.id === f.templateId) || null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const pick = (x) => setF((o) => ({
    ...o, templateId: x ? x.id : '', templateName: x ? x.name : '', headerFormat: x ? String(x.headerFormat || '').toUpperCase() : '',
    mediaUrl: '', varCount: x ? x.variableCount : 0,
    varMap: x ? Object.fromEntries(Array.from({ length: x.variableCount }, (_, i) => [String(i + 1), i === 0 ? 'name' : ''])) : {},
  }));
  const usesName = Object.values(f.varMap || {}).includes('name');
  return (
    <Row className="g-3">
      <Col lg={6}>
        <Form.Label className="mb-1">Template</Form.Label>
        {tpl.loading && <Busy text="Loading templates…" />}
        <TemplatePicker templates={tpl.templates} value={f.templateId} onChange={pick} />
        {t && String(t.category).toUpperCase() === 'MARKETING' && <div className="text-warning small mt-1">⚠ Filed MARKETING by Meta — charged at the higher rate.</div>}
        {f.templateId && !t && <div className="sg-mini mt-1">Saved template: <span className="sg-mono">{f.templateName}</span> (no longer in the approved list)</div>}
        {t && <div className="mt-2"><TemplatePreview t={t} mediaUrl={f.mediaUrl} /></div>}
        <div className="mt-2">
          <HeaderMediaBox t={t && MEDIA_FORMATS.includes(String(t.headerFormat).toUpperCase()) ? t : null}
            value={{ mediaUrl: f.mediaUrl, fileName: '', headerParams: [] }} onChange={(v) => set('mediaUrl', v.mediaUrl || '')} />
        </div>
      </Col>
      <Col lg={6}>
        <NameOrText count={f.varCount} value={f.varMap} onChange={(m) => set('varMap', m)} />
        {usesName && (
          <Form.Group className="mb-2">
            <Form.Label className="mb-1 small">When the list has no name for a number, say</Form.Label>
            <Form.Control size="sm" value={f.nameFallback} onChange={(e) => set('nameFallback', e.target.value)} />
          </Form.Group>
        )}
        <Row className="g-2">
          <Col sm={6}>
            <Form.Label className="mb-1 small">Sending hours (India)</Form.Label>
            <div className="d-flex gap-1">
              <Form.Select size="sm" value={f.hourFrom} onChange={(e) => set('hourFrom', Number(e.target.value))}>{HOURS.slice(0, 24).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Form.Select>
              <Form.Select size="sm" value={f.hourTo} onChange={(e) => set('hourTo', Number(e.target.value))}>{HOURS.slice(1).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Form.Select>
            </div>
          </Col>
          <Col sm={3}>
            <Form.Label className="mb-1 small">Delay (s)</Form.Label>
            <Form.Control size="sm" type="number" min={0} max={3600} value={f.sendDelay} onChange={(e) => set('sendDelay', Number(e.target.value))} />
          </Col>
          <Col sm={3}>
            <Form.Label className="mb-1 small">Per day</Form.Label>
            <Form.Control size="sm" type="number" min={1} max={100000} value={f.dailyQuota} onChange={(e) => set('dailyQuota', Number(e.target.value))} />
          </Col>
        </Row>
      </Col>
    </Row>
  );
}

const asPost = (f) => ({
  name: f.name, templateId: f.templateId, templateName: f.templateName, headerFormat: f.headerFormat, mediaUrl: f.mediaUrl,
  varCount: f.varCount, varMap: f.varMap, nameFallback: f.nameFallback, hourFrom: f.hourFrom, hourTo: f.hourTo,
  sendDelay: f.sendDelay, dailyQuota: f.dailyQuota,
});

function UploadCard({ tpl, onDone }) {
  const [f, setF] = useState(blankForm());
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [msg, setMsg] = useState(null);
  const [counts, setCounts] = useState(null);
  const [pct, setPct] = useState(null);
  const upload = async () => {
    setMsg(null); setCounts(null);
    if (!file) { setMsg({ type: 'warning', text: 'Choose a .xlsx or .csv file.' }); return; }
    if (!f.templateId) { setMsg({ type: 'warning', text: 'Choose the template these numbers should get.' }); return; }
    const fd = new FormData();
    fd.append('file', file);
    const p = asPost(f);
    for (const [k, v] of Object.entries(p)) fd.append(k, k === 'varMap' ? JSON.stringify(v) : String(v));
    setPct(0);
    try {
      const d = await sgUpload('/newuser/upload', fd, setPct);
      setCounts(d.counts);
      setMsg({ type: 'success', text: `List "${d.name}" saved with ${fmtNum(d.counts.valid)} numbers to send — PAUSED. Press Switch on below when ready (${d.hours}, up to ${fmtNum(d.quota)} a day${d.delay ? ', one every ' + d.delay + 's' : ''}).` });
      setFile(null); setFileKey((k) => k + 1); setF((x) => ({ ...x, name: '' }));
      onDone();
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
      if (e.data && e.data.counts) setCounts(e.data.counts);
    } finally { setPct(null); }
  };
  return (
    <div className="sg-card">
      <h4>⬆ Upload a new list</h4>
      <div className="sg-help">
        A sheet (.xlsx or .csv) with a column of <b>phone numbers</b>, and optionally a column of <b>names</b> — both are found by themselves.
        Numbers that are already Rent Pondy users, duplicates and numbers that asked us to stop are left out and counted.
        The list is saved <b>paused</b>.
      </div>
      <Row className="g-2 mb-3">
        <Col md={5}><Form.Label className="mb-1 small">List name <span className="sg-mini">blank = the file name</span></Form.Label><Form.Control size="sm" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Col>
        <Col md={7}><Form.Label className="mb-1 small">File</Form.Label><Form.Control key={fileKey} size="sm" type="file" accept=".xlsx,.xls,.csv,.txt" onChange={(e) => setFile(e.target.files[0] || null)} /></Col>
      </Row>
      <NuFields f={f} setF={setF} tpl={tpl} />
      <Button variant="success" className="mt-2" disabled={pct !== null} onClick={upload}>{pct !== null ? 'Uploading… ' + pct + '%' : '⬆ Upload list'}</Button>
      <div className="mt-2"><Msg msg={msg} onClose={() => setMsg(null)} /></div>
      {counts && (
        <Tiles items={[
          { n: counts.total, l: 'Rows in the file' }, { n: counts.valid, l: 'To send', kind: 'good' },
          { n: counts.dup, l: 'Duplicates' }, { n: counts.invalid, l: 'Not a mobile number', kind: counts.invalid ? 'bad' : '' },
          { n: counts.member, l: 'Already on Rent Pondy' }, { n: counts.blocked, l: 'Asked us to stop' },
        ]} />
      )}
    </div>
  );
}

function EditModal({ list, tpl, onClose, onSaved }) {
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!list) { setF(null); return; }
    setF({
      ...blankForm(), name: list.name, templateId: list.templateId, templateName: list.templateName, headerFormat: list.headerFormat || '',
      mediaUrl: list.mediaUrl || '', varCount: list.varCount || 0, varMap: list.varMap || {}, nameFallback: list.nameFallback || 'Friend',
      hourFrom: list.hourFrom, hourTo: list.hourTo, sendDelay: list.sendDelay, dailyQuota: list.dailyQuota,
    });
    setMsg(null);
  }, [list]);
  const save = async () => {
    setSaving(true); setMsg(null);
    try { const d = await sgPost('/newuser/save', { id: list.id, ...asPost(f) }); onSaved(d.message); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setSaving(false); }
  };
  return (
    <Modal show={!!list} onHide={onClose} size="xl">
      <Modal.Header closeButton><Modal.Title as="h5">Edit list</Modal.Title></Modal.Header>
      <Modal.Body>
        {f && (
          <>
            <Form.Group className="mb-3"><Form.Label className="mb-1 small">List name</Form.Label><Form.Control size="sm" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Form.Group>
            <NuFields f={f} setF={setF} tpl={tpl} />
            <Msg msg={msg} />
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="success" disabled={saving} onClick={save}>💾 Save</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default function SgNewUserBot() {
  const tpl = useTemplates();
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState('');
  const [edit, setEdit] = useState(null);
  const [only, setOnly] = useState({});

  const load = useCallback(async () => {
    try { setD(await sgGet('/newuser/lists')); } catch (e) { setMsg({ type: 'danger', text: e.message }); }
  }, []);
  useEffect(() => {
    load();
    const id = setInterval(() => { if (document.visibilityState !== 'hidden') load(); }, 15000);
    return () => clearInterval(id);
  }, [load]);

  const act = async (l, a) => {
    if (a === 'delete' && !window.confirm('Delete the list "' + l.name + '" and its numbers? What was already sent stays in the send log.')) return;
    setBusy(l.id + a); setMsg(null);
    try {
      const x = a === 'now' ? await sgPost('/newuser/now', { id: l.id }) : await sgPost('/newuser/act', { id: l.id, act: a });
      setMsg({ type: 'success', text: x.message || 'Done.' });
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setBusy(''); }
  };

  return (
    <SgPage title="New User Bot" sub="Welcome people who are not on Rent Pondy yet — an uploaded list, a few at a time" right={<ReportLink query="src=newuser" />}>
      {d && <RunnerBanners runner={d.runner} health={d.health} />}
      <UploadCard tpl={tpl} onDone={load} />

      <div className="sg-card">
        <h4>📋 Lists <Button size="sm" variant="outline-secondary" className="ms-auto" onClick={load}>⟳ Refresh</Button></h4>
        <Msg msg={msg} onClose={() => setMsg(null)} />
        {!d ? <Busy /> : d.lists.length === 0 ? <div className="sg-mini">No lists yet — upload one above.</div> : (
          <div className="sg-wrap">
            <Table size="sm" className="sg-table">
              <thead><tr><th>List</th><th>Template</th><th>Progress</th><th>Today</th><th>Timing</th><th>Status</th><th>Last</th><th /></tr></thead>
              <tbody>
                {d.lists.map((l) => {
                  const pct = l.nTotal ? Math.round(((l.nSent + l.nFailed + l.nSkipped) / l.nTotal) * 100) : 0;
                  return (
                    <tr key={l.id}>
                      <td><b>{l.name}</b><div className="sg-mini">{l.fileName} · by {l.createdByName || '—'} · {fmtWhen(l.createdAt)}</div></td>
                      <td>{l.templateName}{l.mediaUrl ? <div className="sg-mini">+ header file</div> : null}</td>
                      <td style={{ minWidth: 190 }}>
                        <div className="sg-progress"><div style={{ width: pct + '%' }} /></div>
                        <div className="sg-mini mt-1">
                          {fmtNum(l.nSent)} sent · {fmtNum(l.nPending)} to go
                          {l.nFailed ? <> · <span className="text-danger">{fmtNum(l.nFailed)} failed</span></> : null}
                          {l.nHeld ? <> · <span className="text-warning">{fmtNum(l.nHeld)} waiting</span></> : null}
                          {l.nSkipped ? <> · {fmtNum(l.nSkipped)} blocked</> : null}
                          {' '}of {fmtNum(l.nTotal)}
                        </div>
                      </td>
                      <td className="sg-nowrap">{fmtNum(l.today)} / {fmtNum(l.dailyQuota)}</td>
                      <td className="sg-nowrap sg-mini">{l.hours}{l.sendDelay ? <div>one every {l.sendDelay}s</div> : null}</td>
                      <td><StatusPill status={l.status} /></td>
                      <td style={{ maxWidth: 240 }} className="sg-mini">{l.lastDetail}{l.lastRunAt ? <div>{fmtWhen(l.lastRunAt)}</div> : null}</td>
                      <td style={{ minWidth: 260 }}>
                        <div className="d-flex flex-wrap gap-1">
                          {l.status === 'running'
                            ? <Button size="sm" variant="outline-warning" disabled={!!busy} onClick={() => act(l, 'pause')}>⏸ Pause</Button>
                            : <Button size="sm" variant="outline-success" disabled={!!busy || l.status === 'done'} onClick={() => act(l, 'on')}>▶ Switch on</Button>}
                          <Button size="sm" variant="outline-primary" disabled={!!busy || l.status !== 'running'} onClick={() => act(l, 'now')}>{busy === l.id + 'now' ? '…' : '⚡ Send now'}</Button>
                          <Button size="sm" variant="outline-secondary" onClick={() => setEdit(l)}>✏ Edit</Button>
                          <Link className="btn btn-sm btn-outline-secondary" to={'/dashboard/sg-report?campaign=' + encodeURIComponent('New User Bot: ' + l.name)}>📊</Link>
                          <Button size="sm" variant="outline-danger" disabled={!!busy} onClick={() => act(l, 'delete')}>🗑</Button>
                        </div>
                        <InputGroup size="sm" className="mt-1">
                          <Form.Select value={only[l.id] || ''} onChange={(e) => setOnly({ ...only, [l.id]: e.target.value })}>
                            <option value="">Every number</option><option value="sent">Sent</option><option value="failed">Failed</option>
                            <option value="pending">Still to send</option><option value="held">Waiting</option>
                          </Form.Select>
                          <Button variant="outline-secondary" onClick={() => downloadUrl(sgUrl('/newuser/export', { id: l.id, only: only[l.id] || '' }))}>⬇ CSV</Button>
                        </InputGroup>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      <EditModal list={edit} tpl={tpl} onClose={() => setEdit(null)} onSaved={(m) => { setEdit(null); setMsg({ type: 'success', text: m }); load(); }} />
    </SgPage>
  );
}
