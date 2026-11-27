// AI & Automation > Autobot > Reminder Bot — ported from PM_Matri_Admin's
// autobot/reminder. The bot follows up everybody who has something left to do
// until they do it, one reminder at a time, in turn. PM's reminders were
// matrimony ones; Rent Pondy's are post a property, add photos, complete the
// listing and renew an expired one.

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import { sgGet, sgPost } from './sgApi';
import { SgPage, Msg, Busy, StatusPill, Tiles, fmtWhen, fmtNum, fmtPhone, useTemplates, ReportLink } from './common';
import { TemplatePicker, VarMapEditor } from './TemplateBits';
import { RunnerBanners } from './SgBotRuns';

const HOURS = Array.from({ length: 25 }, (_, h) => h);
const hourLabel = (h) => (h === 0 || h === 24 ? '12am' : h === 12 ? '12pm' : h < 12 ? h + 'am' : (h - 12) + 'pm');

function FollowupCard({ f, meta, onSaved, setMsg }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setForm({ remindEvery: f.remindEvery, startPerDay: f.startPerDay, hourFrom: f.hourFrom, hourTo: f.hourTo, sendDelay: f.sendDelay || 0 });
  }, [f]);
  if (!form) return null;
  const set = (k, v) => setForm((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setSaving(true); setMsg(null);
    try { const d = await sgPost('/reminder/followup', form); setMsg({ type: 'success', text: d.message }); onSaved(); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setSaving(false); }
  };
  const act = async (a) => {
    setMsg(null);
    try { const d = await sgPost('/reminder/followup/act', { act: a }); setMsg({ type: 'success', text: d.message }); onSaved(); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
  };
  const on = f.status === 'on';
  return (
    <div className="sg-card">
      <h4>🔁 The follow-up <StatusPill status={on ? 'on' : 'paused'} />
        <span className="ms-auto">
          {on ? <Button size="sm" variant="outline-warning" onClick={() => act('pause')}>⏸ Pause</Button>
            : <Button size="sm" variant="success" onClick={() => act('on')}>▶ Switch on</Button>}
        </span>
      </h4>
      <div className="sg-help">
        Everybody with something left to do is followed up <b>until they do it</b> — one reminder at a time, in turn:
        <b> Post your property → Add photos → Complete your listing → Renew your listing</b>, skipping what they have already done.
        The first reminder goes on their day 1, the next one every <b>{f.remindEvery}</b> days after. People who sign up after the
        follow-up is first switched on start the day after they sign up; everybody before that starts <b>{f.startPerDay}</b> a day,
        newest first. Only <b>APPROVED UTILITY</b> templates are sent — a reminder whose template Meta filed MARKETING waits.
        When nothing is left, their follow-up ends.
      </div>
      <Tiles items={[
        { n: f.active, l: 'Being followed up', kind: 'good' },
        { n: f.ended, l: 'Finished — did everything' },
        { n: f.waitingToStart, l: 'Waiting to start', kind: f.waitingToStart ? 'wait' : '' },
        { n: f.startedToday, l: 'Started today' },
      ]} />
      <Row className="g-2">
        <Col sm={3}>
          <Form.Label className="mb-1 small">Remind again after (days)</Form.Label>
          <Form.Control size="sm" type="number" min={1} max={meta.maxEvery} value={form.remindEvery} onChange={(e) => set('remindEvery', Number(e.target.value))} />
        </Col>
        <Col sm={3}>
          <Form.Label className="mb-1 small">Existing people started per day</Form.Label>
          <Form.Control size="sm" type="number" min={0} max={5000} value={form.startPerDay} onChange={(e) => set('startPerDay', Number(e.target.value))} />
        </Col>
        <Col sm={3}>
          <Form.Label className="mb-1 small">Sending hours (India)</Form.Label>
          <div className="d-flex gap-1">
            <Form.Select size="sm" value={form.hourFrom} onChange={(e) => set('hourFrom', Number(e.target.value))}>{HOURS.slice(0, 24).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Form.Select>
            <Form.Select size="sm" value={form.hourTo} onChange={(e) => set('hourTo', Number(e.target.value))}>{HOURS.slice(1).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Form.Select>
          </div>
        </Col>
        <Col sm={3}>
          <Form.Label className="mb-1 small">Per message delay (seconds)</Form.Label>
          <Form.Control size="sm" type="number" min={0} max={meta.maxDelay} value={form.sendDelay} onChange={(e) => set('sendDelay', Number(e.target.value))} />
        </Col>
      </Row>
      <Button size="sm" className="mt-2" variant="success" disabled={saving} onClick={save}>💾 Save follow-up</Button>
      <div className="sg-mini mt-2">
        {f.launchedAt ? 'First switched on ' + fmtWhen(f.launchedAt, true) + '. ' : 'Never switched on yet. '}
        {f.lastRunAt ? 'Last turn ' + fmtWhen(f.lastRunAt) + ': ' + (f.lastDetail || '') : ''}
      </div>
    </div>
  );
}

function ReminderRow({ r, tpl, fields, onSaved, setMsg }) {
  const [templateName, setTemplateName] = useState(r.templateName || '');
  const [varMap, setVarMap] = useState(r.varMap || {});
  const [cap, setCap] = useState(r.dailyCap);
  const [saving, setSaving] = useState(false);
  const t = tpl.templates.find((x) => x.name === templateName && /^APPROVED/i.test(x.status)) || null;

  const save = async () => {
    setSaving(true); setMsg(null);
    try { const d = await sgPost('/reminder/save', { id: r.id, dailyCap: cap, templateName, varMap }); setMsg({ type: 'success', text: r.name + ': ' + d.message }); onSaved(); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setSaving(false); }
  };
  const toggle = async () => {
    setMsg(null);
    try { const d = await sgPost('/reminder/act', { id: r.id, act: r.status === 'on' ? 'off' : 'on' }); setMsg({ type: 'success', text: d.message }); onSaved(); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
  };

  return (
    <div className="p-3 mb-2" style={{ border: '1px solid #e3ece9', borderRadius: 8, opacity: r.status === 'on' ? 1 : 0.7 }}>
      <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
        <b style={{ fontSize: 15 }}>{r.name}</b> <StatusPill status={r.status === 'on' ? 'on' : 'off'} />
        <span className="sg-mini">{r.needs} — <b>{fmtNum(r.needNow)}</b> people need it now</span>
        <Button size="sm" className="ms-auto" variant={r.status === 'on' ? 'outline-secondary' : 'outline-success'} onClick={toggle}>
          {r.status === 'on' ? 'Leave out' : 'Include'}
        </Button>
      </div>
      <Row className="g-2">
        <Col md={5}>
          <Form.Label className="mb-1 small">UTILITY template</Form.Label>
          <TemplatePicker size="sm" templates={tpl.templates} utilityOnly value={t ? t.id : ''} onChange={(x) => {
            setTemplateName(x ? x.name : '');
            if (x) setVarMap((m) => Object.fromEntries(Array.from({ length: x.variableCount }, (_, i) => [String(i + 1), m[String(i + 1)] || (i === 0 ? 'first_name' : '')])));
          }} />
          {templateName && !t && <div className="sg-mini mt-1">Saved: <span className="sg-mono">{templateName}</span> (not in the approved UTILITY list)</div>}
          {!r.templateOk && <div className="text-danger small mt-1">{r.templateWhy}</div>}
          {t && t.bodyText && <div className="sg-mini mt-1" style={{ whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'hidden' }}>{t.bodyText}</div>}
        </Col>
        <Col md={5}>
          <Form.Label className="mb-1 small">Fill the blanks</Form.Label>
          <VarMapEditor count={t ? t.variableCount : 0} fields={fields} value={varMap} onChange={setVarMap} examples={t && t.examples} />
        </Col>
        <Col md={2}>
          <Form.Label className="mb-1 small">Messages a day</Form.Label>
          <Form.Control size="sm" type="number" min={0} max={5000} value={cap} onChange={(e) => setCap(Number(e.target.value))} />
          <Button size="sm" className="mt-2 w-100" variant="success" disabled={saving} onClick={save}>💾 Save</Button>
        </Col>
      </Row>
      <div className="sg-mini mt-2">
        Today {fmtNum(r.sentToday)} / {fmtNum(r.dailyCap)} · sent {fmtNum(r.sent)} · failed {fmtNum(r.failed)} ·
        <b> {fmtNum(r.worked)}</b> did it after the reminder
      </div>
    </div>
  );
}

export default function SgReminder() {
  const tpl = useTemplates();
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState(null);
  const [preview, setPreview] = useState(null);
  const [log, setLog] = useState([]);
  const [kind, setKind] = useState('');
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    try { setD(await sgGet('/reminder')); } catch (e) { setMsg({ type: 'danger', text: e.message }); }
  }, []);
  const loadLog = useCallback(async () => {
    try { const x = await sgGet('/reminder/log', kind ? { kind } : undefined); setLog(x.rows || []); } catch (_) { /* shown empty */ }
  }, [kind]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadLog(); }, [loadLog]);

  const doPreview = async () => {
    setPreview('loading');
    try { const x = await sgGet('/reminder/preview'); setPreview(x.people || []); }
    catch (e) { setPreview(null); setMsg({ type: 'danger', text: e.message }); }
  };
  const runNow = async () => {
    if (!window.confirm('Run one turn of the follow-up now? It sends real WhatsApp messages to whoever is due.')) return;
    setRunning(true); setMsg(null);
    try { const x = await sgPost('/reminder/now'); setMsg({ type: 'success', text: x.message || 'Done.' }); load(); loadLog(); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setRunning(false); }
  };

  return (
    <SgPage title="Reminder Bot" sub="Follow everybody up on WhatsApp until they finish what they started" right={<ReportLink query="src=reminder" />}>
      {d && <RunnerBanners runner={d.runner} health={d.health} />}
      <Msg msg={msg} onClose={() => setMsg(null)} />
      {!d ? <Busy /> : (
        <>
          <FollowupCard f={d.followup} meta={d} onSaved={load} setMsg={setMsg} />
          <div className="sg-card">
            <h4>🔔 The reminders <span className="sg-mini">in turn order</span></h4>
            {tpl.loading && <Busy text="Loading templates…" />}
            {tpl.error && <Msg msg={{ type: 'danger', text: tpl.error }} />}
            {d.reminders.map((r) => <ReminderRow key={r.id} r={r} tpl={tpl} fields={d.fields} onSaved={load} setMsg={setMsg} />)}
          </div>
        </>
      )}

      <div className="sg-card">
        <h4>👀 Due now
          <span className="ms-auto d-flex gap-2">
            <Button size="sm" variant="outline-secondary" onClick={doPreview}>Preview — who would be messaged</Button>
            <Button size="sm" variant="outline-primary" disabled={running} onClick={runNow}>{running ? 'Running…' : '⚡ Run now'}</Button>
          </span>
        </h4>
        <div className="sg-mini mb-2">The preview sends nothing. Run now does one turn immediately, inside the sending hours.</div>
        {preview === 'loading' && <Busy />}
        {Array.isArray(preview) && (preview.length === 0 ? <div className="sg-mini">Nobody is due right now.</div> : (
          <div className="sg-wrap" style={{ maxHeight: 320 }}>
            <Table size="sm" className="sg-table">
              <thead><tr><th>Number</th><th>Name</th><th>Reminder</th><th>Day</th><th>Still to do</th></tr></thead>
              <tbody>{preview.map((p) => <tr key={p.phone}><td className="sg-nowrap">{fmtPhone(p.phone)}</td><td>{p.name}</td><td>{p.label}</td><td>{p.day}</td><td className="sg-mini">{p.needs.join(', ')}</td></tr>)}</tbody>
            </Table>
          </div>
        ))}
      </div>

      <div className="sg-card">
        <h4>📜 Recent reminders sent
          <Form.Select size="sm" className="ms-auto" style={{ width: 220 }} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Every reminder</option>
            {d && Object.entries(d.kinds || {}).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Form.Select>
        </h4>
        <div className="sg-wrap" style={{ maxHeight: 420 }}>
          <Table size="sm" className="sg-table">
            <thead><tr><th>When</th><th>Number</th><th>Reminder</th><th>Day</th><th>Result</th><th>Detail</th><th>Worked</th></tr></thead>
            <tbody>
              {log.length === 0 && <tr><td colSpan={7} className="sg-mini">No reminders sent yet.</td></tr>}
              {log.map((g) => (
                <tr key={g._id}>
                  <td className="sg-nowrap">{fmtWhen(g.sentAt)}</td><td className="sg-nowrap">{fmtPhone(g.phone)}</td><td>{g.label}</td><td>{g.step}</td>
                  <td><StatusPill status={g.status} /></td><td className="sg-mini">{g.detail}</td>
                  <td className="sg-mini">{g.doneAt ? '✅ ' + fmtWhen(g.doneAt) : ''}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </SgPage>
  );
}
