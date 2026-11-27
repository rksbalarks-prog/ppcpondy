// Communication > WhatsApp > Message Status — ported from PM_Matri_Admin's
// whatsapp/status.
//
// What Meta actually did with each message of a campaign: delivered, read,
// queued or failed, with Meta's own reason. Covers every campaign on the
// account, including ones run on SmartGrowth's own site. Read-only — checking
// costs no credits and sends nothing. /send/campaign answers 200 to anything
// it accepts, so this page is the only honest answer to "did it arrive".
//
// Delivered -> Call queue: a campaign's delivered and read numbers are people
// who can be rung, so they can be put in the Call Management automatic queue
// (never twice — a number already queued is shown with its last calls).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { sgGet, sgPost } from './sgApi';
import { SgPage, Msg, Busy, StatusPill, Tiles, Pager, ReportLink, fmtWhen, fmtNum, fmtPhone } from './common';

const STATUSES = ['queued', 'sent', 'delivered', 'read', 'failed', 'cancelled'];

// Single statuses go to SmartGrowth (so paging stays true); the two groups
// are filtered on the page that came back.
const FILTERS = [
  { v: '', l: 'All statuses' },
  { v: 'good', l: 'Delivered / read', group: ['delivered', 'read'] },
  { v: 'read', l: 'Read' },
  { v: 'delivered', l: 'Delivered' },
  { v: 'sent', l: 'Sent' },
  { v: 'queued', l: 'Queued' },
  { v: 'bad', l: 'Failed / cancelled', group: ['failed', 'cancelled'] },
  { v: 'failed', l: 'Failed' },
  { v: 'cancelled', l: 'Cancelled' },
];

const PER_PAGE = 50;

function CallQueueModal({ campaign, show, onHide }) {
  const [prev, setPrev] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!show || !campaign) return;
    let alive = true;
    setPrev(null); setMsg(null); setDone(false); setBusy(true);
    sgGet('/delivered-preview', { campaignName: campaign })
      .then((d) => { if (alive) setPrev(d); })
      .catch((e) => { if (alive) setMsg({ type: 'danger', text: e.message }); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [show, campaign]);

  const go = async () => {
    setBusy(true); setMsg(null);
    try {
      const d = await sgPost('/delivered-to-calling', { campaignName: campaign });
      setMsg({ type: d.added ? 'success' : 'info', text: d.message });
      setDone(true);
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const dupes = (prev && prev.dupes) || [];
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton><Modal.Title as="h5">📞 Delivered numbers → Call queue</Modal.Title></Modal.Header>
      <Modal.Body>
        <div className="sg-help">
          Only <b>delivered</b> and <b>read</b> numbers of <span className="sg-mono">{campaign}</span> — queued has not finished,
          sent never reached the handset, failed never arrived. They go into the <b>Call Management automatic queue</b>{' '}
          {prev && prev.leadType ? <>under <span className="sg-mono">{prev.leadType}</span></> : null}.
          A number already anywhere in the queue is <b>never added twice</b>; it is listed below with its last calls instead.
        </div>
        {busy && !prev && <Busy text="Reading the campaign's delivered numbers from SmartGrowth…" />}
        {prev && (
          <>
            <Tiles items={[
              { n: prev.delivered, l: 'Delivered or read', kind: 'good' },
              { n: (prev.fresh || []).length, l: 'New — will be added' },
              { n: dupes.length, l: 'Already in the queue', kind: dupes.length ? 'wait' : '' },
            ]} />
            {dupes.length > 0 && (
              <div className="sg-wrap" style={{ maxHeight: '42vh' }}>
                <Table size="sm" className="sg-table">
                  <thead><tr><th>Number</th><th>Already queued as</th><th>Last calls</th></tr></thead>
                  <tbody>
                    {dupes.map((d) => (
                      <tr key={d.mobile}>
                        <td className="sg-nowrap">{fmtPhone(d.mobile)}</td>
                        <td>
                          {(d.batches || []).map((b, i) => (
                            <div key={i} className="sg-mini">
                              {b.leadType || '(manual)'} · {fmtWhen(b.when, true)} {b.active === false ? '· inactive' : ''}
                            </div>
                          ))}
                        </td>
                        <td>
                          {(d.calls || []).length === 0
                            ? <span className="sg-mini">Never called</span>
                            : d.calls.map((c, i) => (
                              <div key={i} className="sg-mini"><StatusPill status={c.status} /> {fmtWhen(c.when, true)} {c.who ? '· ' + c.who : ''}</div>
                            ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </>
        )}
        <div className="mt-2"><Msg msg={msg} /></div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button variant="success" disabled={busy || done || !prev || !(prev.fresh || []).length} onClick={go}>
          📞 Add {prev ? fmtNum((prev.fresh || []).length) : ''} to the call queue
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default function SgStatus() {
  const [params, setParams] = useSearchParams();
  const campaign = params.get('campaign') || '';
  const [list, setList] = useState([]);
  const [listBusy, setListBusy] = useState(false);
  const [listMsg, setListMsg] = useState(null);
  const [find, setFind] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [xfer, setXfer] = useState(false);

  const loadList = useCallback(async () => {
    setListBusy(true); setListMsg(null);
    try { setList((await sgGet('/campaigns')).rows || []); }
    catch (e) { setListMsg({ type: 'danger', text: e.message }); }
    finally { setListBusy(false); }
  }, []);
  useEffect(() => { loadList(); }, [loadList]);

  const group = FILTERS.find((f) => f.v === filter);
  const apiStatus = filter && group && !group.group ? filter : '';

  const load = useCallback(async () => {
    if (!campaign) { setData(null); return; }
    setBusy(true); setMsg(null);
    try {
      setData(await sgGet('/campaign-status', { campaignName: campaign, page, limit: PER_PAGE, status: apiStatus || undefined }));
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
      setData(null);
    } finally {
      setBusy(false);
    }
  }, [campaign, page, apiStatus]);
  useEffect(() => { load(); }, [load]);

  const pick = (name) => {
    setPage(1);
    const next = new URLSearchParams(params);
    if (name) next.set('campaign', name); else next.delete('campaign');
    setParams(next, { replace: true });
  };

  const options = useMemo(() => {
    const q = find.trim().toLowerCase();
    const rows = list.filter((r) => !q || r.name.toLowerCase().includes(q));
    // A deep link to a name the list does not carry (yet) still works.
    if (campaign && !rows.some((r) => r.name === campaign)) rows.unshift({ name: campaign, mine: false });
    return rows;
  }, [list, find, campaign]);

  const counts = (data && data.counts) || {};
  const total = STATUSES.reduce((a, s) => a + (Number(counts[s]) || 0), 0);
  const rows = ((data && data.rows) || []).filter((r) => !group || !group.group || group.group.includes(String(r.status).toLowerCase()));
  const setTileFilter = (v) => { setPage(1); setFilter(filter === v ? '' : v); };
  const mineCount = list.filter((r) => r.mine).length;

  return (
    <SgPage title="Message Status" sub="What Meta did with each message — every campaign on the account"
      right={<>
        {campaign && <Button size="sm" variant="outline-success" onClick={() => setXfer(true)}>📞 Delivered → Call queue</Button>}
        <ReportLink query={campaign ? 'campaign=' + encodeURIComponent(campaign) : ''} />
      </>}>
      <div className="sg-card">
        <h4>🚚 Message status</h4>
        <div className="sg-help">
          Delivered, read, queued or failed — and Meta&apos;s reason when it failed. Covers <b>every campaign on the account</b>,
          including ones run on the SmartGrowth site. Read-only: checking costs no credits and sends nothing.
        </div>
        <Row className="g-2 align-items-end">
          <Col md={3}>
            <Form.Label className="mb-1 small">Find a campaign</Form.Label>
            <Form.Control size="sm" placeholder="part of the name…" value={find} onChange={(e) => setFind(e.target.value)} />
          </Col>
          <Col md={5}>
            <Form.Label className="mb-1 small">
              Campaign <span className="sg-mini">{fmtNum(options.length)} shown · {fmtNum(list.length)} on the account · {fmtNum(mineCount)} sent from this panel</span>
            </Form.Label>
            <Form.Select size="sm" value={campaign} onChange={(e) => pick(e.target.value)}>
              <option value="">— choose a campaign —</option>
              {options.map((r) => <option key={r.name} value={r.name}>{r.name}{r.mine ? '  · sent from this panel' : ''}</option>)}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Label className="mb-1 small">Show</Form.Label>
            <Form.Select size="sm" value={filter} onChange={(e) => { setPage(1); setFilter(e.target.value); }}>
              {FILTERS.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
            </Form.Select>
          </Col>
          <Col md={2} className="d-flex gap-2">
            <Button size="sm" variant="outline-secondary" disabled={listBusy} onClick={loadList}>⟳ Reload list</Button>
            {campaign && <Button size="sm" variant="outline-secondary" disabled={busy} onClick={load}>⟳</Button>}
          </Col>
        </Row>
        {listBusy && <Busy text="Reading the campaign list from SmartGrowth…" />}
        <div className="mt-2"><Msg msg={listMsg} /></div>

        {!campaign && !listBusy && <div className="sg-mini mt-3">Pick a campaign to see what happened to each message.</div>}
        {campaign && (
          <>
            {data && (
              <Tiles items={[
                { n: total, l: 'Messages', onClick: () => setTileFilter(''), on: filter === '' },
                { n: Number(counts.read) || 0, l: 'Read', kind: 'good', onClick: () => setTileFilter('read'), on: filter === 'read' },
                { n: Number(counts.delivered) || 0, l: 'Delivered', kind: 'good', onClick: () => setTileFilter('delivered'), on: filter === 'delivered' },
                { n: Number(counts.sent) || 0, l: 'Sent (not confirmed)', onClick: () => setTileFilter('sent'), on: filter === 'sent' },
                { n: Number(counts.queued) || 0, l: 'Queued', kind: 'wait', onClick: () => setTileFilter('queued'), on: filter === 'queued' },
                { n: Number(counts.failed) || 0, l: 'Failed', kind: 'bad', onClick: () => setTileFilter('failed'), on: filter === 'failed' },
                { n: Number(counts.cancelled) || 0, l: 'Cancelled', kind: 'bad', onClick: () => setTileFilter('cancelled'), on: filter === 'cancelled' },
              ]} />
            )}
            {busy && <Busy text="Asking SmartGrowth…" />}
            <Msg msg={msg} />
            {group && group.group && <div className="sg-mini mb-1">“{group.l}” is filtered on this page of results only — pick a single status for exact paging.</div>}
            {data && (
              <div className="sg-wrap">
                <Table size="sm" hover className="sg-table">
                  <thead><tr><th>Number</th><th>Status</th><th>Template</th><th>Why (Meta&apos;s words)</th><th>Updated</th></tr></thead>
                  <tbody>
                    {rows.length === 0 && <tr><td colSpan={5} className="sg-mini text-center py-3">No messages {filter ? 'with this status ' : ''}on this page.</td></tr>}
                    {rows.map((r, i) => (
                      <tr key={r.to + '-' + i}>
                        <td className="sg-nowrap">{/^\d+$/.test(r.to) ? fmtPhone(r.to) : r.to}</td>
                        <td><StatusPill status={r.status} /></td>
                        <td>{r.template}</td>
                        <td style={{ maxWidth: 420, color: r.error ? '#a12626' : undefined }}>{r.error}</td>
                        <td className="sg-nowrap">{fmtWhen(r.when)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
            {data && <Pager page={data.page} pages={data.pages} total={data.total} busy={busy} onPage={setPage} />}
          </>
        )}
      </div>
      <CallQueueModal campaign={campaign} show={xfer} onHide={() => setXfer(false)} />
    </SgPage>
  );
}
