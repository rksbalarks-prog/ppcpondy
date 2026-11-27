// Communication > WhatsApp > Limits & Alerts — ported from PM_Matri_Admin's
// whatsapp/limits.
//
// How many messages one number may receive in a day, who the limit held
// back, and the numbers that asked us to stop. Two allowances, because they
// answer different questions: a campaign is something we decided to send, an
// action message tells someone something happened on their own listing.
// Replies are never capped — but they are still counted, so the totals here
// are the truth.

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { sgGet, sgPost } from './sgApi';
import { SgPage, Msg, Busy, StatusPill, Tiles, fmtWhen, fmtNum, fmtPhone } from './common';

const KINDS = [
  ['campaign', 'Campaigns'],
  ['action', 'Action messages'],
  ['chat', 'Chat replies'],
  ['bcast', 'Autobot runs'],
  ['newuser', 'New User Bot'],
  ['reminder', 'Reminders'],
];
const KIND_LABEL = Object.fromEntries(KINDS);

function HealthBanner({ health }) {
  if (!health || !health.down) return null;
  return (
    <div className="sg-banner bad">
      <div>
        <b>WhatsApp sending is stopped</b>
        Since {fmtWhen(health.since)}: {health.reason || 'the account is refusing messages'}.{' '}
        {fmtNum(health.waiting)} message(s) are waiting and go out by themselves once it works again.
        {health.nextCheck ? ' Next check ' + fmtWhen(health.nextCheck) + '.' : ''}
      </div>
    </div>
  );
}

function BlocksCard() {
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await sgGet('/blocks');
      setRows(d.rows || []);
      setTotal(d.total || 0);
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
      setRows([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!phone.trim()) { setMsg({ type: 'warning', text: 'Enter the number to block.' }); return; }
    setBusy(true); setMsg(null);
    try {
      const d = await sgPost('/blocks', { phone, note });
      setMsg({ type: 'success', text: d.message });
      setPhone(''); setNote('');
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setBusy(false); }
  };

  const unblock = async (p) => {
    if (!window.confirm('Unblock ' + fmtPhone(p) + '? Campaigns, bots and action messages may reach this number again.')) return;
    setBusy(true); setMsg(null);
    try {
      const d = await sgPost('/blocks', { phone: p, block: false });
      setMsg({ type: 'success', text: d.message });
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="sg-card">
      <h4>🚫 Numbers that asked us to stop <span className="sg-mini">({fmtNum(total)})</span></h4>
      <div className="sg-help">
        A block is absolute: no campaign, Autobot run, reminder or action message goes to a blocked number, whoever
        sends it. Somebody who asks to stop is asking this company to stop — not one sender. Chat replies to somebody
        who writes in are still possible. Block from a conversation in Chats, or type the number here.
      </div>
      <Row className="g-2 mb-2">
        <Col sm={4}><Form.Control size="sm" placeholder="Number, e.g. 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} /></Col>
        <Col sm={5}><Form.Control size="sm" placeholder="Note (optional) — why" value={note} onChange={(e) => setNote(e.target.value)} /></Col>
        <Col sm={3}><Button size="sm" variant="outline-danger" disabled={busy} onClick={add}>🚫 Block number</Button></Col>
      </Row>
      <Msg msg={msg} onClose={() => setMsg(null)} />
      {rows === null ? <Busy /> : rows.length === 0 ? <div className="sg-mini">Nobody has asked us to stop.</div> : (
        <div className="sg-wrap" style={{ maxHeight: 360 }}>
          <Table size="sm" className="sg-table">
            <thead><tr><th>Number</th><th>From</th><th>Note</th><th>By</th><th>When</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id || r.phone}>
                  <td className="sg-nowrap">{fmtPhone(r.phone)}</td>
                  <td>{r.source}</td>
                  <td>{r.note}</td>
                  <td>{r.createdByName}</td>
                  <td className="sg-nowrap">{fmtWhen(r.createdAt, true)}</td>
                  <td><Button size="sm" variant="outline-secondary" disabled={busy} onClick={() => unblock(r.phone)}>Unblock</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function SgLimits() {
  const [data, setData] = useState(null);
  const [f, setF] = useState({ capEnabled: true, capCampaign: 1, capAction: 2 });
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await sgGet('/limits');
      setData(d);
      setF({ capEnabled: !!d.settings.capEnabled, capCampaign: d.settings.capCampaign, capAction: d.settings.capAction });
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const d = await sgPost('/limits', f);
      setMsg({ type: 'success', text: d.message });
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setSaving(false); }
  };

  const today = (data && data.today) || {};
  const tiles = [];
  for (const [k, label] of KINDS) {
    const t = today[k];
    if (!t && k !== 'campaign' && k !== 'action') continue;
    const x = t || { sent: 0, blocked: 0, failed: 0, held: 0, people: 0 };
    tiles.push({
      n: x.sent, l: label + ' sent today', kind: 'good',
      title: `${fmtNum(x.sent)} sent · ${fmtNum(x.blocked)} held back · ${fmtNum(x.failed)} failed${x.held ? ' · ' + fmtNum(x.held) + ' waiting' : ''} · ${fmtNum(x.people)} people`,
    });
    if (x.blocked) tiles.push({ n: x.blocked, l: label + ' held back', kind: 'wait' });
    if (x.failed) tiles.push({ n: x.failed, l: label + ' failed', kind: 'bad' });
  }

  return (
    <SgPage title="Limits & Alerts" sub="How much one number hears from us in a day">
      <HealthBanner health={data && data.health} />
      <div className="sg-card">
        <h4>🛡️ Daily limits <span className="sg-mini">— how much one person hears from us</span></h4>
        <div className="sg-help">
          Two separate allowances, counted per number per day (India time). <b>Campaigns</b> are what you decide to
          send; <b>action messages</b> tell an owner or tenant something happened on their own listing or requirement.
          They do not share a budget, so a promotion can never use up the room a real notification needs.{' '}
          <b>Replies are never held back</b> — a chat answer always goes, because refusing to answer someone who has
          just written is a silence they cannot explain. Those are still counted, so the totals below are the truth.
        </div>
        {loading && <Busy />}
        <Msg msg={msg} onClose={() => setMsg(null)} />
        {data && (
          <>
            <Tiles items={tiles} />
            <div className="sg-mini mb-2">
              Hover a tile for its full breakdown.
              {KINDS.filter(([k]) => today[k]).map(([k, label]) => (
                <span key={k} className="ms-2">{label}: {fmtNum(today[k].people)} people</span>
              ))}
            </div>
          </>
        )}
        <Row className="g-3 mt-1">
          <Col md={6}>
            <Form.Check type="checkbox" id="sgLimEnabled" label={<b>Apply daily limits</b>}
              checked={!!f.capEnabled} onChange={(e) => setF({ ...f, capEnabled: e.target.checked })} />
            <div className="sg-mini mb-3">Turn this off and nothing is capped — everything is still recorded.</div>
            <Form.Group className="mb-2">
              <Form.Label className="mb-1">Campaign messages per number per day</Form.Label>
              <Form.Control size="sm" type="number" min={1} max={50} style={{ maxWidth: 120 }} value={f.capCampaign}
                onChange={(e) => setF({ ...f, capCampaign: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="mb-1">Action messages per number per day</Form.Label>
              <Form.Control size="sm" type="number" min={1} max={50} style={{ maxWidth: 120 }} value={f.capAction}
                onChange={(e) => setF({ ...f, capAction: e.target.value })} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <p className="sg-mini mt-1">
              Which action messages go out, with which template and wording, is set on{' '}
              <Link to="/dashboard/sg-action-messages"><b>Action Messages</b></Link>. The limit on the left is the most any
              one number can get from all of them together in a day; each action can also have a smaller allowance of its own.
            </p>
            <p className="sg-mini">
              The Autobot senders (runs, New User Bot, reminders) have their own daily quotas on their own pages and are
              not counted against these two.
            </p>
          </Col>
        </Row>
        <div className="d-flex gap-2 mt-2">
          <Button size="sm" variant="success" disabled={saving} onClick={save}>💾 Save limits</Button>
          <Button size="sm" variant="outline-secondary" onClick={load}>⟳ Refresh</Button>
        </div>
      </div>

      <div className="sg-card">
        <h4>⛔ Recently held back</h4>
        <div className="sg-help">
          Messages the limit — or a block — stopped. Kept on purpose: “why did this person not get the campaign” is
          the question this page exists to answer, and a number on its own cannot answer it.
        </div>
        {!data ? <Busy /> : (data.blocked || []).length === 0 ? <div className="sg-mini">Nothing has been held back.</div> : (
          <div className="sg-wrap" style={{ maxHeight: 380 }}>
            <Table size="sm" className="sg-table">
              <thead><tr><th>Number</th><th>What</th><th>Template</th><th>Campaign</th><th>Why</th><th>When</th></tr></thead>
              <tbody>
                {data.blocked.map((r) => (
                  <tr key={r._id}>
                    <td className="sg-nowrap">{fmtPhone(r.phone)}</td>
                    <td className="sg-nowrap"><StatusPill status="blocked" /> {KIND_LABEL[r.kind] || r.kind}</td>
                    <td>{r.templateName}</td>
                    <td>{r.campaignName}</td>
                    <td>{r.detail}</td>
                    <td className="sg-nowrap">{fmtWhen(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      <BlocksCard />
    </SgPage>
  );
}
