import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Badge, Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { ErrorBox, Kpi, Loading, PermissionGate, errMsg, fmtDateTime, fmtNum } from './AssistantShared';

/*
 * WhatsApp Activity
 * -----------------
 * Every WhatsApp message the website / app sent through POST /send-message
 * (OneMsg): OTPs, login notices, owner/user alerts for calls, interest, contact
 * views, address & photo requests… with delivery failures. Data comes from
 * GET /whatsapp-activity; messages are logged from the day that backend is deployed.
 * OTP codes are masked by the server before they are stored.
 */

const API = process.env.REACT_APP_API_URL;
const PERIODS = [1, 7, 30, 90];
const PAGE = 100;
const AUDIENCE = {
  owner: { label: 'Owner', bg: 'primary' },
  user: { label: 'User', bg: 'success' },
  account: { label: 'Login', bg: 'secondary' },
};
const SOURCE = { app: 'App', website: 'Website', admin: 'Admin', other: '—' };

function DailyBars({ byDay }) {
  if (!byDay.length) return null;
  const max = Math.max(...byDay.map((d) => d.total), 1);
  return (
    <div className="d-flex align-items-end gap-1" style={{ height: 90 }} aria-label="Messages per day">
      {byDay.map((d) => (
        <div key={d.day} className="flex-fill d-flex flex-column justify-content-end" style={{ height: '100%', minWidth: 6 }}
          title={`${d.day}: ${d.total} sent${d.failed ? `, ${d.failed} failed` : ''}`}>
          {d.failed > 0 && <div style={{ height: `${(d.failed / max) * 100}%`, background: '#dc2626', borderRadius: '3px 3px 0 0' }} />}
          <div style={{ height: `${((d.total - d.failed) / max) * 100}%`, background: '#25D366',
            borderRadius: d.failed ? 0 : '3px 3px 0 0', minHeight: d.total ? 2 : 0 }} />
        </div>
      ))}
    </div>
  );
}

function MessageCell({ text }) {
  const [open, setOpen] = useState(false);
  const short = text.length > 110 ? `${text.slice(0, 110).replace(/\s+/g, ' ')}…` : text.replace(/\s+/g, ' ');
  if (text.length <= 110) return <span className="small">{short}</span>;
  return (
    <span className="small">
      {open ? <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span> : short}{' '}
      <Button variant="link" size="sm" className="p-0 align-baseline" onClick={() => setOpen(!open)}>{open ? 'less' : 'more'}</Button>
    </span>
  );
}

function WhatsAppActivityPage() {
  const [days, setDays] = useState(7);
  const [filters, setFilters] = useState({ category: '', status: '', audience: '' });
  const [search, setSearch] = useState('');
  const [phone, setPhone] = useState(''); // debounced search
  const [state, setState] = useState({ loading: true, error: '', data: null, logs: [], page: 1 });

  useEffect(() => {
    const t = setTimeout(() => setPhone(search.replace(/\D/g, '')), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (page = 1) => {
    setState((s) => ({ ...s, loading: page === 1, loadingMore: page > 1, error: '' }));
    try {
      const res = await axios.get(`${API}/whatsapp-activity`, { params: { days, page, limit: PAGE, phone, ...filters } });
      setState((s) => ({ loading: false, loadingMore: false, error: '', data: res.data, page,
        logs: page === 1 ? res.data.logs : [...s.logs, ...res.data.logs] }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false, loadingMore: false, error: errMsg(e) }));
    }
  }, [days, phone, filters]);
  useEffect(() => { load(1); }, [load]);

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: f[k] === v ? '' : v }));
  const stats = state.data?.stats;
  const rate = stats?.total ? Math.round((stats.sent / stats.total) * 1000) / 10 : 0;
  const anyFilter = filters.category || filters.status || filters.audience || search;

  return (
    <div className="container-fluid p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h4 className="mb-0">WhatsApp Activity</h4>
          <div className="text-muted small">Every WhatsApp message the website and app sent — OTPs, login notices and owner / user alerts</div>
        </div>
        <div className="d-flex gap-1 align-items-center">
          {PERIODS.map((p) => (
            <Button key={p} size="sm" variant={days === p ? 'dark' : 'outline-dark'} onClick={() => setDays(p)}>
              {p === 1 ? 'Today' : `${p} days`}
            </Button>
          ))}
          <Button size="sm" variant="outline-primary" className="ms-2" onClick={() => load(1)}>Refresh</Button>
        </div>
      </div>

      <ErrorBox error={state.error} onRetry={() => load(1)} />
      {state.loading && !stats ? <Loading /> : stats && (
        <>
          {stats.bulkQueued > 0 && (
            <Alert variant="warning" className="py-2 small">
              {fmtNum(stats.bulkQueued)} bulk message{stats.bulkQueued > 1 ? 's' : ''} saved from “Send WhatsApp” in this period
              {stats.bulkQueued > 1 ? ' are' : ' is'} still <b>queued</b> — that screen only saves messages, it does not send them.
            </Alert>
          )}
          <Row className="g-3 mb-3">
            <Col xs={6} lg={3}>
              <Kpi label="Messages" value={fmtNum(stats.total)} hint="Click to show all"
                onClick={() => setFilters({ category: '', status: '', audience: '' })} active={!filters.status} />
            </Col>
            <Col xs={6} lg={3}>
              <Kpi label="Delivered to provider" value={`${rate}%`} color="#16a34a" hint={`${fmtNum(stats.sent)} accepted by OneMsg`}
                onClick={() => setFilter('status', 'sent')} active={filters.status === 'sent'} />
            </Col>
            <Col xs={6} lg={3}>
              <Kpi label="Failed" value={fmtNum(stats.failed)} color="#dc2626" hint="Rejected or provider error — click to see"
                onClick={() => setFilter('status', 'failed')} active={filters.status === 'failed'} />
            </Col>
            <Col xs={6} lg={3}>
              <Kpi label="People messaged" value={fmtNum(stats.uniqueRecipients)} color="#0D9488" hint="Unique phone numbers" />
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col lg={8}>
              <Card className="h-100"><Card.Body>
                <div className="d-flex justify-content-between small text-muted mb-2">
                  <span>Messages per day</span>
                  <span><span style={{ color: '#25D366' }}>■</span> sent <span style={{ color: '#dc2626' }} className="ms-2">■</span> failed</span>
                </div>
                {stats.byDay.length ? <DailyBars byDay={stats.byDay} /> : <div className="text-muted small">No messages yet in this period.</div>}
                {stats.byDay.length > 0 && (
                  <div className="d-flex justify-content-between small text-muted mt-1">
                    <span>{stats.byDay[0].day}</span><span>{stats.byDay[stats.byDay.length - 1].day}</span>
                  </div>
                )}
                <div className="d-flex flex-wrap gap-1 mt-3">
                  {stats.byCategory.map((c) => (
                    <Button key={c.category} size="sm" variant={filters.category === c.category ? 'success' : 'outline-secondary'}
                      onClick={() => setFilter('category', c.category)}>
                      {c.label} <b>{fmtNum(c.total)}</b>{c.failed > 0 && <span className="text-danger"> · {c.failed} failed</span>}
                    </Button>
                  ))}
                </div>
              </Card.Body></Card>
            </Col>
            <Col lg={4}>
              <Card className="h-100"><Card.Body>
                <div className="small text-muted mb-2">Most messaged (owners &amp; users)</div>
                {stats.topRecipients.length === 0 && <div className="text-muted small">—</div>}
                {stats.topRecipients.map((r) => (
                  <div key={`${r.phone}-${r.audience}`} className="d-flex justify-content-between small py-1 border-bottom">
                    <Button variant="link" size="sm" className="p-0" onClick={() => setSearch(r.phone)}>{r.phone}</Button>
                    <span><Badge bg={AUDIENCE[r.audience]?.bg || 'secondary'} className="me-2">{AUDIENCE[r.audience]?.label || r.audience}</Badge>{r.total}</span>
                  </div>
                ))}
              </Card.Body></Card>
            </Col>
          </Row>

          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2">
            <div className="d-flex gap-2 flex-wrap">
              <Form.Control style={{ width: 220 }} placeholder="Search phone number" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Form.Select style={{ width: 160 }} value={filters.audience} aria-label="Audience"
                onChange={(e) => setFilters((f) => ({ ...f, audience: e.target.value }))}>
                <option value="">Everyone</option>
                <option value="owner">To owners</option>
                <option value="user">To users</option>
                <option value="account">Login messages</option>
              </Form.Select>
            </div>
            <div className="small text-muted">
              Showing {state.logs.length} of {fmtNum(state.data.matching)}
              {anyFilter && (
                <Button size="sm" variant="link" onClick={() => { setFilters({ category: '', status: '', audience: '' }); setSearch(''); }}>
                  clear filters
                </Button>
              )}
            </div>
          </div>

          {state.loading ? <Loading /> : (
            <div className="table-responsive">
              <Table striped bordered hover size="sm" className="align-middle">
                <thead className="table-light">
                  <tr><th>Time</th><th>To</th><th>Type</th><th>About</th><th style={{ minWidth: 300 }}>Message</th><th>Status</th><th>From</th></tr>
                </thead>
                <tbody>
                  {state.logs.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-muted p-3">No messages match.</td></tr>
                  )}
                  {state.logs.map((l) => (
                    <tr key={l._id}>
                      <td className="text-nowrap small">{fmtDateTime(l.createdAt)}</td>
                      <td className="text-nowrap">
                        <a href={`tel:+91${l.to}`}>{l.to}</a>
                        <div><Badge bg={AUDIENCE[l.audience]?.bg || 'secondary'}>{AUDIENCE[l.audience]?.label || l.audience}</Badge></div>
                      </td>
                      <td className="small text-nowrap">{l.label}</td>
                      <td className="small text-nowrap">
                        {l.aboutPhone && <div><Button variant="link" size="sm" className="p-0" onClick={() => setSearch(l.aboutPhone)}>{l.aboutPhone}</Button></div>}
                        {l.ppcId && <div>ID #{l.ppcId}</div>}
                        {!l.aboutPhone && !l.ppcId && <span className="text-muted">—</span>}
                      </td>
                      <td><MessageCell text={l.message || ''} /></td>
                      <td>
                        {l.status === 'failed'
                          ? <><Badge bg="danger">Failed</Badge>{l.error && <div className="small text-danger">{l.error}</div>}</>
                          : <Badge bg="success">Sent</Badge>}
                      </td>
                      <td className="small">{SOURCE[l.source] || l.source}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          {state.logs.length < state.data.matching && (
            <div className="text-center">
              <Button variant="outline-dark" size="sm" disabled={state.loadingMore} onClick={() => load(state.page + 1)}>
                {state.loadingMore ? 'Loading…' : `Load ${Math.min(PAGE, state.data.matching - state.logs.length)} more`}
              </Button>
            </div>
          )}
          <div className="small text-muted mt-2">
            “Sent” means OneMsg accepted the message; it does not confirm the person read it. OTP codes are hidden.
          </div>
        </>
      )}
    </div>
  );
}

export default function WhatsAppActivity() {
  // 'WhatsApp Activity' = permission key in UserRolls.jsx
  return <PermissionGate fileName="WhatsApp Activity">{() => <WhatsAppActivityPage />}</PermissionGate>;
}
