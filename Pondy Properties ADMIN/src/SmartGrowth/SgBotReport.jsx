// AI & Automation > Autobot > WhatsApp Bot Report — ported from
// PM_Matri_Admin's autobot/whatsappReport. What the bots have been doing:
// Autobot runs, the New User Bot, the reminders and the action messages.
// Campaigns a person sent (Send Message) and chat replies are reported where
// they were done, not here.

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import { sgGet, sgUrl } from './sgApi';
import { SgPage, Msg, Busy, StatusPill, Tiles, fmtWhen, fmtNum, fmtPhone, downloadUrl } from './common';

const istDay = (offsetDays = 0) => {
  const t = new Date(Date.now() + 330 * 60000 - offsetDays * 86400000);
  return t.toISOString().slice(0, 10);
};

function Bars({ rows, label, value, sub, color = '#25D366' }) {
  const max = Math.max(1, ...rows.map(value));
  if (!rows.length) return <div className="sg-mini">Nothing in this range.</div>;
  return (
    <div className="sg-bars">
      {rows.map((r, i) => (
        <div key={i} className="sg-barrow" style={{ cursor: 'default' }}>
          <div className="sg-bl" title={label(r)}>{label(r)}</div>
          <div className="sg-bt"><div style={{ width: (value(r) / max) * 100 + '%', background: color }} /></div>
          <div className="sg-bn">{fmtNum(value(r))}{sub ? <span className="sg-mini" style={{ fontWeight: 400 }}> {sub(r)}</span> : null}</div>
        </div>
      ))}
    </div>
  );
}

export default function SgBotReport() {
  const [f, setF] = useState({ from: istDay(), to: istDay(), kind: '', rstatus: '', q: '' });
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async (filters) => {
    setBusy(true); setMsg(null);
    try { setD(await sgGet('/bot-report', filters)); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setBusy(false); }
  }, []);
  // Dates and selects apply at once; the search box waits for Enter / Show.
  useEffect(() => { load(f); }, [f.from, f.to, f.kind, f.rstatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const quick = (days) => setF((x) => ({ ...x, from: istDay(days), to: istDay() }));
  const t = d && d.totals;

  return (
    <SgPage title="WhatsApp Bot Report" sub="What the bots have sent — runs, New User Bot, reminders and action messages" banner={false}>
      <div className="sg-card">
        <Row className="g-2 align-items-end">
          <Col sm={6} md={2}><Form.Label className="mb-1 small">From</Form.Label><Form.Control size="sm" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Col>
          <Col sm={6} md={2}><Form.Label className="mb-1 small">To</Form.Label><Form.Control size="sm" type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Col>
          <Col md="auto" className="d-flex gap-1">
            <Button size="sm" variant="outline-secondary" onClick={() => quick(0)}>Today</Button>
            <Button size="sm" variant="outline-secondary" onClick={() => quick(6)}>7 days</Button>
            <Button size="sm" variant="outline-secondary" onClick={() => quick(29)}>30 days</Button>
          </Col>
          <Col sm={6} md={2}>
            <Form.Label className="mb-1 small">What</Form.Label>
            <Form.Select size="sm" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
              <option value="">Everything</option>
              {d && Object.entries(d.kinds || {}).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Form.Select>
          </Col>
          <Col sm={6} md={2}>
            <Form.Label className="mb-1 small">Result</Form.Label>
            <Form.Select size="sm" value={f.rstatus} onChange={(e) => setF({ ...f, rstatus: e.target.value })}>
              <option value="">Any</option><option value="sent">Sent</option><option value="failed">Failed</option>
              <option value="blocked">Held back</option><option value="held">Waiting</option>
            </Form.Select>
          </Col>
          <Col md>
            <Form.Label className="mb-1 small">Search <span className="sg-mini">a number, template or run</span></Form.Label>
            <Form.Control size="sm" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') load(f); }} />
          </Col>
          <Col md="auto" className="d-flex gap-1">
            <Button size="sm" variant="success" disabled={busy} onClick={() => load(f)}>Show</Button>
            <Button size="sm" variant="outline-success" onClick={() => downloadUrl(sgUrl('/bot-report/export', f))}>⬇ CSV</Button>
          </Col>
        </Row>
      </div>

      <Msg msg={msg} />
      {busy && !d && <Busy />}
      {d && (
        <>
          <Tiles items={[
            { n: t.total, l: 'Messages' }, { n: t.sent, l: 'Sent', kind: 'good' }, { n: t.failed, l: 'Failed', kind: t.failed ? 'bad' : '' },
            { n: t.blocked, l: 'Held back (limit / blocked)', kind: t.blocked ? 'wait' : '' }, { n: t.held, l: 'Waiting (WhatsApp down)', kind: t.held ? 'wait' : '' },
            { n: t.people, l: 'People reached' }, { n: d.blockedNow, l: 'Numbers blocked now' },
          ]} />
          <Row className="g-3">
            <Col lg={4}>
              <div className="sg-card h-100">
                <h4>What was sent</h4>
                <Bars rows={d.byKind} label={(r) => r.label} value={(r) => r.n} sub={(r) => '(' + fmtNum(r.sent) + ' sent)'} />
              </div>
            </Col>
            <Col lg={4}>
              <div className="sg-card h-100">
                <h4>By template</h4>
                <Bars rows={d.byTemplate} label={(r) => r.name} value={(r) => r.n} sub={(r) => (r.failed ? '(' + fmtNum(r.failed) + ' failed)' : '')} color="#128C7E" />
              </div>
            </Col>
            <Col lg={4}>
              <div className="sg-card h-100">
                <h4>By day</h4>
                <Bars rows={d.byDay} label={(r) => r.d} value={(r) => r.n} sub={(r) => (r.failed ? '(' + fmtNum(r.failed) + ' failed)' : '')} color="#9be3b4" />
              </div>
            </Col>
          </Row>

          <div className="sg-card mt-3">
            <h4>Messages <span className="sg-mini">{d.from} to {d.to}</span></h4>
            {d.capped && <div className="sg-mini mb-2">Showing the latest {fmtNum(d.maxRows)} — narrow the dates or the filters to see the rest, or export the CSV.</div>}
            <div className="sg-wrap" style={{ maxHeight: 560 }}>
              <Table size="sm" className="sg-table">
                <thead><tr><th>When</th><th>Number</th><th>What</th><th>Template</th><th>Run / campaign</th><th>Result</th><th>HTTP</th><th>Detail</th><th>By</th></tr></thead>
                <tbody>
                  {d.rows.length === 0 && <tr><td colSpan={9} className="sg-mini">Nothing in this range.</td></tr>}
                  {d.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="sg-nowrap">{fmtWhen(r.at)}</td><td className="sg-nowrap">{fmtPhone(r.phone)}</td><td>{r.kindLabel}</td>
                      <td>{r.template}</td><td>{r.run}</td><td><StatusPill status={r.rstatus === 'blocked' ? 'blocked' : r.rstatus} /></td>
                      <td>{r.code || ''}</td><td className="sg-mini" style={{ maxWidth: 280 }}>{r.detail}</td><td>{r.by}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </>
      )}
    </SgPage>
  );
}
