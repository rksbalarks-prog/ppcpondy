// AI & Automation > Autobot > WhatsApp Bot — ported from PM_Matri_Admin's
// autobot/whatsapp (the "runs" half; the match bot that answers members is
// matrimony-only and was not ported).
//
// A RUN is a segment + an approved template + a daily allowance. It is created
// PAUSED; Start lets the scheduler work through the matching people a few at a
// time, and once caught up it keeps watching for new people. Send now does the
// next batch immediately — the same code path, the same quota, the same claim.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { sgGet, sgPost } from './sgApi';
import { SgPage, Msg, Busy, StatusPill, Tiles, fmtWhen, fmtNum, fmtPhone, useTemplates, ReportLink } from './common';
import { TemplatePicker, TemplatePreview, HeaderMediaBox, VarMapEditor, MEDIA_FORMATS } from './TemplateBits';

const HOURS = Array.from({ length: 25 }, (_, h) => h);
const hourLabel = (h) => (h === 0 || h === 24 ? '12am' : h === 12 ? '12pm' : h < 12 ? h + 'am' : (h - 12) + 'pm');

/** The two banners every Autobot page carries: is anything sending by itself, and is WhatsApp working. */
export function RunnerBanners({ runner, health }) {
  return (
    <>
      {runner === false && (
        <div className="sg-banner warn">
          <div><b>Automatic sending is off on this server</b>SMARTGROWTH_RUNNER is not 1 — runs only move when you press <b>Send now</b>. Set it on exactly one server to let them send by themselves.</div>
        </div>
      )}
      {health && health.down && (
        <div className="sg-banner bad">
          <div>
            <b>WhatsApp sending has stopped by itself</b>
            Since {fmtWhen(health.since)}: {health.reason}. {fmtNum(health.waiting)} message(s) are waiting and go out first once it works again.
            One waiting message is retried around {fmtWhen(health.nextCheck)}.
          </div>
        </div>
      )}
    </>
  );
}

function NewRunCard({ meta, tpl, onCreated }) {
  const [segment, setSegment] = useState('owners');
  const [plan, setPlan] = useState('');
  const [only, setOnly] = useState('');
  const [aud, setAud] = useState(null);
  const [t, setT] = useState(null);
  const [head, setHead] = useState({ mediaUrl: '', fileName: '', headerParams: [] });
  const [varMap, setVarMap] = useState({});
  const [quota, setQuota] = useState(50);
  const [delay, setDelay] = useState(0);
  const [hourFrom, setHourFrom] = useState(9);
  const [hourTo, setHourTo] = useState(20);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  // How many people the form reaches — the one number that stops a run against
  // thirty thousand people when three thousand was meant. Debounced.
  useEffect(() => {
    setAud(null);
    const id = setTimeout(async () => {
      try {
        const d = await sgGet('/autobot/audience', only.trim() ? { only: only.trim() } : { segment, plan });
        setAud(d);
      } catch (e) { setAud({ count: 0, who: e.message }); }
    }, 450);
    return () => clearTimeout(id);
  }, [segment, plan, only]);

  const pick = (x) => {
    setT(x);
    setHead({ mediaUrl: '', fileName: '', headerParams: [] });
    setVarMap(x && x.variableCount ? Object.fromEntries(Array.from({ length: x.variableCount }, (_, i) => [String(i + 1), i === 0 ? 'first_name' : ''])) : {});
  };

  const create = async () => {
    setMsg(null);
    if (!t) { setMsg({ type: 'warning', text: 'Choose a template first.' }); return; }
    const fmt = String(t.headerFormat || '').toUpperCase();
    if (MEDIA_FORMATS.includes(fmt) && !head.mediaUrl) { setMsg({ type: 'warning', text: 'This template opens with a ' + fmt.toLowerCase() + '. Upload the file or paste its public link.' }); return; }
    const filled = Object.values(varMap).filter((v) => v && v !== 'text:').length;
    if (t.variableCount && filled < t.variableCount) { setMsg({ type: 'warning', text: 'Fill every blank — WhatsApp refuses a template with a value missing, so the whole run would fail.' }); return; }
    setSaving(true);
    try {
      const d = await sgPost('/autobot/runs', {
        templateId: t.id, templateName: t.name, segment, plan, only: only.trim(),
        dailyQuota: quota, sendDelay: delay, hourFrom, hourTo,
        mediaUrl: head.mediaUrl, fileName: head.fileName, headerParams: head.headerParams,
        varMap, varCount: t.variableCount, name: name.trim(),
      });
      setMsg({ type: 'success', text: d.message });
      setName('');
      onCreated();
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const marketing = t && String(t.category).toUpperCase() === 'MARKETING';
  return (
    <div className="sg-card">
      <h4>🎯 Start a run</h4>
      <div className="sg-help">
        A run reaches everybody in a segment <b>a few at a time</b>, up to the daily allowance, inside the sending hours — and keeps
        watching, so somebody who matches next week is reached too. Nobody gets the same run twice. It is created <b>paused</b>.
      </div>
      <Row className="g-3">
        <Col lg={6}>
          <Row className="g-2">
            <Col sm={8}>
              <Form.Label className="mb-1">Who</Form.Label>
              <Form.Select size="sm" value={segment} disabled={!!only.trim()} onChange={(e) => setSegment(e.target.value)}>
                {Object.entries(meta.segments || {}).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Form.Select>
            </Col>
            <Col sm={4}>
              <Form.Label className="mb-1">Plan</Form.Label>
              <Form.Select size="sm" value={plan} disabled={!!only.trim()} onChange={(e) => setPlan(e.target.value)}>
                <option value="">Either</option><option value="free">Never paid</option><option value="paid">Has paid</option>
              </Form.Select>
            </Col>
            <Col sm={12}>
              <Form.Label className="mb-1">Or send to one number only <span className="sg-mini">a test — the filter above is ignored</span></Form.Label>
              <Form.Control size="sm" placeholder="9876543210" value={only} onChange={(e) => setOnly(e.target.value)} />
            </Col>
          </Row>
          <div className="mt-2 p-2" style={{ background: '#f3faf6', borderRadius: 6, fontSize: 13 }}>
            {aud === null ? <Busy text="Counting…" /> : aud.only
              ? <span>{aud.who}</span>
              : <span><b>{fmtNum(aud.count)}</b> {aud.count === 1 ? 'person matches' : 'people match'} right now <span className="sg-mini">(numbers that asked us to stop are already left out)</span></span>}
          </div>

          <Row className="g-2 mt-1">
            <Col sm={4}>
              <Form.Label className="mb-1">Messages per day</Form.Label>
              <Form.Control size="sm" type="number" min={1} max={meta.maxQuota || 5000} value={quota} onChange={(e) => setQuota(Number(e.target.value))} />
            </Col>
            <Col sm={4}>
              <Form.Label className="mb-1">Delay <span className="sg-mini">seconds between</span></Form.Label>
              <Form.Control size="sm" type="number" min={0} max={meta.maxDelay || 3600} value={delay} onChange={(e) => setDelay(Number(e.target.value))} />
            </Col>
            <Col sm={4}>
              <Form.Label className="mb-1">Sending hours <span className="sg-mini">India</span></Form.Label>
              <div className="d-flex gap-1">
                <Form.Select size="sm" value={hourFrom} onChange={(e) => setHourFrom(Number(e.target.value))}>{HOURS.slice(0, 24).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Form.Select>
                <Form.Select size="sm" value={hourTo} onChange={(e) => setHourTo(Number(e.target.value))}>{HOURS.slice(1).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Form.Select>
              </div>
            </Col>
            <Col sm={12}>
              <Form.Label className="mb-1">Run name <span className="sg-mini">optional — made from the template, segment and time when blank</span></Form.Label>
              <Form.Control size="sm" value={name} onChange={(e) => setName(e.target.value)} />
            </Col>
          </Row>
        </Col>
        <Col lg={6}>
          <Form.Label className="mb-1">Template</Form.Label>
          {tpl.loading && <Busy text="Loading templates…" />}
          {tpl.error && <Msg msg={{ type: 'danger', text: tpl.error }} />}
          <TemplatePicker templates={tpl.templates} value={t && t.id} onChange={pick} />
          {marketing && <div className="text-warning small mt-1">⚠ Meta files this template MARKETING — every message of the run is charged at the higher rate.</div>}
          {t && <div className="mt-2"><TemplatePreview t={t} headerVar={(head.headerParams || [])[0]} mediaUrl={head.mediaUrl} /></div>}
          <div className="mt-2"><HeaderMediaBox t={t} value={head} onChange={setHead} /></div>
          {t && t.variableCount > 0 && (
            <>
              <Form.Label className="mb-1">Fill the blanks <span className="sg-mini">per person, or the same text for everybody</span></Form.Label>
              <VarMapEditor count={t.variableCount} fields={meta.fields} value={varMap} onChange={setVarMap} examples={t.examples} />
            </>
          )}
        </Col>
      </Row>
      <Button variant="success" className="mt-2" disabled={saving} onClick={create}>➕ Create run (paused)</Button>
      <div className="mt-2"><Msg msg={msg} onClose={() => setMsg(null)} /></div>
    </div>
  );
}

function LiveCard() {
  const [rows, setRows] = useState([]);
  const [info, setInfo] = useState(null);
  const lastId = useRef('');

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const d = await sgGet('/autobot/activity', lastId.current ? { after: lastId.current } : undefined);
        if (!alive) return;
        setInfo(d);
        if (d.rows && d.rows.length) {
          lastId.current = d.rows[0].id;
          setRows((old) => [...d.rows, ...old].slice(0, 100));
        }
      } catch (_) { /* the next tick tries again */ }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="sg-card">
      <h4>⚡ Live <span className="sg-mini">refreshes every 5 seconds{info ? ' · server time ' + info.serverTime : ''}</span></h4>
      {info && (
        <Tiles items={[
          { n: info.today.sent, l: 'Sent today', kind: 'good' },
          { n: info.today.failed, l: 'Failed today', kind: info.today.failed ? 'bad' : '' },
          { n: info.today.waiting, l: 'Waiting (WhatsApp down)', kind: info.today.waiting ? 'wait' : '' },
          { n: info.running, l: 'Runs switched on' },
        ]} />
      )}
      <div className="sg-wrap" style={{ maxHeight: 300 }}>
        <Table size="sm" className="sg-table mb-0">
          <thead><tr><th>When</th><th>Number</th><th>Run</th><th>Template</th><th>Result</th><th>Detail</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="sg-mini">Nothing sent by a run yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="sg-nowrap">{fmtWhen(r.at)}</td><td className="sg-nowrap">{fmtPhone(r.phone)}</td>
                <td>{r.run}</td><td>{r.template}</td><td><StatusPill status={r.status} /></td><td className="sg-mini">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default function SgBotRuns() {
  const tpl = useTemplates();
  const [meta, setMeta] = useState(null);
  const [runs, setRuns] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState('');

  const loadMeta = useCallback(async () => {
    try { setMeta(await sgGet('/autobot/meta')); } catch (e) { setMsg({ type: 'danger', text: e.message }); }
  }, []);
  const loadRuns = useCallback(async () => {
    try { const d = await sgGet('/autobot/runs'); setRuns(d.rows || []); } catch (e) { setMsg({ type: 'danger', text: e.message }); }
  }, []);

  useEffect(() => {
    loadMeta();
    loadRuns();
    const id = setInterval(() => { if (document.visibilityState !== 'hidden') loadRuns(); }, 15000);
    return () => clearInterval(id);
  }, [loadMeta, loadRuns]);

  const act = async (r, a) => {
    if (a === 'delete' && !window.confirm('Delete the run "' + r.name + '"? What it already sent stays in the send log.')) return;
    setBusy(r.id + a); setMsg(null);
    try {
      const d = a === 'now' ? await sgPost('/autobot/runs/now', { id: r.id }) : await sgPost('/autobot/runs/act', { id: r.id, act: a });
      setMsg({ type: 'success', text: d.message || 'Done.' });
      loadRuns();
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
    } finally {
      setBusy('');
    }
  };

  return (
    <SgPage title="WhatsApp Bot" sub="Autobot runs — a segment, a template and a daily allowance, left switched on" right={<ReportLink query="src=run" />}>
      {meta && <RunnerBanners runner={meta.runner} health={meta.health} />}
      {!meta ? <Busy /> : <NewRunCard meta={meta} tpl={tpl} onCreated={loadRuns} />}

      <div className="sg-card">
        <h4>📋 Runs <Button size="sm" variant="outline-secondary" className="ms-auto" onClick={loadRuns}>⟳ Refresh</Button></h4>
        <Msg msg={msg} onClose={() => setMsg(null)} />
        {runs === null ? <Busy /> : runs.length === 0 ? <div className="sg-mini">No runs yet — start one above.</div> : (
          <div className="sg-wrap">
            <Table size="sm" className="sg-table">
              <thead>
                <tr><th>Run</th><th>Who</th><th>Template</th><th>Today</th><th>Sent / failed / skipped</th><th>Left</th><th>Timing</th><th>Status</th><th>Last</th><th /></tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.name}</b><div className="sg-mini">by {r.by || '—'} · {fmtWhen(r.createdAt)}</div></td>
                    <td>{r.onlyPhone ? <>Test: {fmtPhone(r.onlyPhone)}</> : <>{r.segmentLabel}{r.plan ? <div className="sg-mini">{r.plan === 'paid' ? 'has paid' : 'never paid'}</div> : null}</>}</td>
                    <td>{r.template}{r.hasMedia ? <div className="sg-mini">+ header file</div> : null}</td>
                    <td className="sg-nowrap">{fmtNum(r.sentToday)} / {fmtNum(r.quota)}</td>
                    <td className="sg-nowrap">{fmtNum(r.sent)} / <span className={r.failed ? 'text-danger' : ''}>{fmtNum(r.failed)}</span> / {fmtNum(r.skipped)}</td>
                    <td className="sg-nowrap">{fmtNum(r.remaining)}{r.waiting ? <div className="text-warning small">{fmtNum(r.waiting)} waiting</div> : null}</td>
                    <td className="sg-nowrap sg-mini">{r.hours}{r.delay ? <div>one every {r.delay}s</div> : null}</td>
                    <td><StatusPill status={r.status} /></td>
                    <td style={{ maxWidth: 260 }} className="sg-mini">{r.lastDetail}{r.lastRunAt ? <div>{fmtWhen(r.lastRunAt)}</div> : null}</td>
                    <td className="sg-nowrap">
                      {r.status === 'running'
                        ? <Button size="sm" variant="outline-warning" disabled={!!busy} onClick={() => act(r, 'pause')}>⏸ Pause</Button>
                        : <Button size="sm" variant="outline-success" disabled={!!busy} onClick={() => act(r, 'start')}>▶ Start</Button>}{' '}
                      <Button size="sm" variant="outline-primary" disabled={!!busy || r.status !== 'running'} onClick={() => act(r, 'now')} title="Send this run's next batch now">{busy === r.id + 'now' ? '…' : '⚡ Send now'}</Button>{' '}
                      <Link className="btn btn-sm btn-outline-secondary" to={'/dashboard/sg-report?campaign=' + encodeURIComponent(r.name)}>📊</Link>{' '}
                      <Button size="sm" variant="outline-danger" disabled={!!busy} onClick={() => act(r, 'delete')}>🗑</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      <LiveCard />
    </SgPage>
  );
}
