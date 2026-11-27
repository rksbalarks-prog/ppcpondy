// Communication > WhatsApp > Recent Campaigns — ported from PM_Matri_Admin's
// whatsapp/recent.
//
// What THIS panel has sent (Send Message and templates from Chats), newest
// first: the record of who sent which template to how many numbers and what
// SmartGrowth answered. SmartGrowth's answer is only "accepted" — the Status
// link on each row is where to see what Meta actually did with it.

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { sgGet } from './sgApi';
import { SgPage, Msg, Busy, StatusPill, ReportLink, fmtWhen, fmtNum, fmtPhone } from './common';

export default function SgRecent() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [open, setOpen] = useState({});

  const load = useCallback(async (search) => {
    setBusy(true); setMsg(null);
    try { setRows((await sgGet('/logs', { limit: 200, q: search || undefined })).rows || []); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(''); }, [load]);

  const toggle = (id, what) => setOpen((o) => ({ ...o, [id + what]: !o[id + what] }));

  return (
    <SgPage title="Recent Campaigns" sub="What this panel has sent — newest first" right={<ReportLink query="src=send" />}>
      <div className="sg-card">
        <h4>🕘 Recent campaigns</h4>
        <div className="sg-help">
          One row per send from <b>Send Message</b> (a sheet send writes one row per chunk) and per template sent from <b>Chats</b>.
          “Success” only means SmartGrowth accepted it — open <b>Status</b> to see what Meta did with each message.
        </div>
        <form className="sg-bar" onSubmit={(e) => { e.preventDefault(); load(q.trim()); }}>
          <Form.Control size="sm" style={{ width: 280 }} placeholder="Campaign, template or a number…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button size="sm" type="submit" variant="outline-success">🔍 Search</Button>
          <Button size="sm" variant="outline-secondary" disabled={busy} onClick={() => { setQ(''); load(''); }}>⟳ Refresh</Button>
          <span className="sg-mini">{fmtNum(rows.length)} shown</span>
        </form>
        {busy && <Busy />}
        <Msg msg={msg} />
        <div className="sg-wrap">
          <Table size="sm" hover className="sg-table">
            <thead><tr><th>When</th><th>Campaign</th><th>Template</th><th>Numbers</th><th>Result</th><th>HTTP</th><th>By</th><th /></tr></thead>
            <tbody>
              {!busy && rows.length === 0 && <tr><td colSpan={8} className="sg-mini text-center py-3">Nothing sent from this panel yet.</td></tr>}
              {rows.map((r) => {
                const id = String(r._id);
                const nums = r.phoneNumbers || [];
                return (
                  <React.Fragment key={id}>
                    <tr>
                      <td className="sg-nowrap">{fmtWhen(r.createdAt, true)}</td>
                      <td><Link to={'/dashboard/sg-status?campaign=' + encodeURIComponent(r.campaignName || '')} className="sg-mono">{r.campaignName}</Link></td>
                      <td>{r.templateName}</td>
                      <td className="sg-nowrap">
                        <b>{fmtNum(r.phoneCount)}</b>{' '}
                        {nums.length > 0 && (
                          <Button size="sm" variant="link" className="p-0 align-baseline" title={nums.map(fmtPhone).join(', ')} onClick={() => toggle(id, 'n')}>
                            {open[id + 'n'] ? 'hide' : 'show'}
                          </Button>
                        )}
                      </td>
                      <td><StatusPill status={r.status} /></td>
                      <td>{r.httpCode || ''}</td>
                      <td>{r.createdByName}</td>
                      <td className="sg-nowrap">
                        <Link to={'/dashboard/sg-status?campaign=' + encodeURIComponent(r.campaignName || '')}>Status</Link>
                        {' · '}
                        <Link to={'/dashboard/sg-report?campaign=' + encodeURIComponent(r.campaignName || '')}>Report</Link>
                        {r.response && <>{' · '}<Button size="sm" variant="link" className="p-0 align-baseline" onClick={() => toggle(id, 'r')}>{open[id + 'r'] ? 'Hide response' : 'Response'}</Button></>}
                      </td>
                    </tr>
                    {(open[id + 'n'] || open[id + 'r']) && (
                      <tr>
                        <td colSpan={8} style={{ background: '#f7faf9' }}>
                          {open[id + 'n'] && (
                            <div className="sg-mini mb-1">
                              {nums.map(fmtPhone).join(', ')}{r.phoneCount > nums.length ? ` … and ${fmtNum(r.phoneCount - nums.length)} more` : ''}
                            </div>
                          )}
                          {open[id + 'r'] && <pre className="sg-mono mb-0" style={{ whiteSpace: 'pre-wrap', maxHeight: 220, overflow: 'auto' }}>{r.response}</pre>}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
        </div>
      </div>
    </SgPage>
  );
}
