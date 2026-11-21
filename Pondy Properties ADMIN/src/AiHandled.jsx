import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Badge, Button, Col, Form, Row, Table } from 'react-bootstrap';
import {
  ASSISTANT_API, ErrorBox, Kpi, Loading, PermissionGate, TranscriptModal, errMsg, fmtDateTime, fmtNum,
} from './AssistantShared';

/*
 * AI Handled
 * ----------
 * Every chat the AI assistant handled, what it offered, and whether the user
 * actually followed through (checked against real points / buyer-assistance /
 * owner-lead records by GET /assistant/admin/ai-handled). "Needs follow-up" rows
 * are the ones staff should call: the AI offered a next step and the user didn't
 * take it.
 */

const OUTCOMES = {
  converted: { label: 'Converted', bg: 'success', color: '#16a34a' },
  needs_followup: { label: 'Needs follow-up', bg: 'warning', color: '#d97706' },
  answered: { label: 'Answered', bg: 'secondary', color: '#6c757d' },
};
const PERIODS = [7, 30, 90, 365];
const OFFER_LABEL = {
  offer_points_purchase: 'Offered: buy points',
  offer_buyer_assistance: 'Offered: buyer assistance',
  offer_add_property: 'Offered: post property',
  request_contact_owner: 'Owner contact',
  send_interest: 'Sent interest',
  report_property: 'Reported property',
};

const rupees = (v) => {
  const n = Number(v);
  if (!n) return '';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 ? 2 : 0)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 ? 1 : 0)} L`;
  return `₹${fmtNum(n)}`;
};

function requirementText(r) {
  if (!r) return '';
  const budget = r.minPrice && r.maxPrice ? `${rupees(r.minPrice)}–${rupees(r.maxPrice)}`
    : r.maxPrice ? `up to ${rupees(r.maxPrice)}` : r.minPrice ? `from ${rupees(r.minPrice)}` : '';
  return [r.bedrooms && `${r.bedrooms} BHK`, r.propertyType, r.propertyMode,
    [r.area, r.city].filter(Boolean).join(', '), budget].filter(Boolean).join(' · ');
}

function Results({ results }) {
  const items = [];
  if (results.contactsUnlocked) items.push(`Unlocked ${results.contactsUnlocked} owner contact${results.contactsUnlocked > 1 ? 's' : ''}`);
  if (results.pointsBoughtCount) items.push(`Bought points${results.pointsBought ? ` (₹${fmtNum(results.pointsBought)})` : ''}`);
  if (results.buyerRequirement) items.push('Registered buyer requirement');
  if (results.ownerLead) items.push('Left property details (owner lead)');
  if (!items.length) return <span className="text-muted">—</span>;
  return items.map((t) => <div key={t} className="text-success small">✔ {t}</div>);
}

function AiHandledPage() {
  const [days, setDays] = useState(30);
  const [state, setState] = useState({ loading: true, error: '', sessions: [], followWindowDays: 7 });
  const [outcome, setOutcome] = useState('');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null); // { phone, sessionId }

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await axios.get(`${ASSISTANT_API}/ai-handled`, { params: { days } });
      setState({ loading: false, error: '', sessions: res.data.sessions || [], followWindowDays: res.data.followWindowDays || 7 });
    } catch (e) {
      setState({ loading: false, error: errMsg(e), sessions: [], followWindowDays: 7 });
    }
  }, [days]);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = { all: state.sessions.length, converted: 0, needs_followup: 0, answered: 0 };
    state.sessions.forEach((s) => { c[s.outcome] = (c[s.outcome] || 0) + 1; });
    return c;
  }, [state.sessions]);

  const shown = useMemo(() => {
    const q = search.replace(/\D/g, '');
    return state.sessions.filter((s) => (!outcome || s.outcome === outcome) && (!q || s.phone.includes(q)));
  }, [state.sessions, outcome, search]);

  const rate = counts.all ? Math.round((counts.converted / counts.all) * 100) : 0;
  const toggle = (o) => setOutcome(outcome === o ? '' : o);

  return (
    <div className="container-fluid p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h4 className="mb-0">AI Handled</h4>
          <div className="text-muted small">Chats the AI assistant handled, and whether the user followed through</div>
        </div>
        <div className="d-flex gap-1 align-items-center">
          {PERIODS.map((p) => (
            <Button key={p} size="sm" variant={days === p ? 'dark' : 'outline-dark'} onClick={() => setDays(p)}>
              {p === 365 ? '1 year' : `${p} days`}
            </Button>
          ))}
          <Button size="sm" variant="outline-primary" className="ms-2" onClick={load}>Refresh</Button>
        </div>
      </div>

      <Row className="g-3 mb-3">
        <Col xs={6} lg={3}>
          <Kpi label="Chats handled" value={fmtNum(counts.all)} hint={`${rate}% converted`}
            onClick={() => setOutcome('')} active={!outcome} />
        </Col>
        {Object.entries(OUTCOMES).map(([key, o]) => (
          <Col xs={6} lg={3} key={key}>
            <Kpi label={o.label} value={fmtNum(counts[key])} color={o.color} onClick={() => toggle(key)} active={outcome === key}
              hint={key === 'needs_followup' ? 'AI offered a next step — call them'
                : key === 'converted' ? 'Bought, unlocked, registered or listed' : 'Questions answered, nothing offered'} />
          </Col>
        ))}
      </Row>

      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2">
        <Form.Control style={{ maxWidth: 260 }} placeholder="Search phone number" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <div className="small text-muted">
          Showing {shown.length}{outcome ? ` · ${OUTCOMES[outcome].label}` : ''}
          {outcome && <Button size="sm" variant="link" onClick={() => setOutcome('')}>clear filter</Button>}
        </div>
      </div>

      <ErrorBox error={state.error} onRetry={load} />
      {state.loading ? <Loading /> : (
        <div className="table-responsive">
          <Table striped bordered hover size="sm" className="align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th><th>Chat date</th><th>Phone</th><th style={{ minWidth: 220 }}>What they asked</th>
                <th>AI did</th><th>Requirement</th><th>Result</th><th>Outcome</th><th>Chat</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={9} className="text-center text-muted p-3">No chats in this period.</td></tr>
              )}
              {shown.map((s, i) => (
                <tr key={s.sessionId}>
                  <td>{i + 1}</td>
                  <td className="text-nowrap">{fmtDateTime(s.startedAt)}</td>
                  <td className="text-nowrap"><a href={`tel:+91${s.phone}`}>{s.phone}</a></td>
                  <td>
                    <div>{s.firstQuestion || <span className="text-muted">—</span>}</div>
                    {s.lastQuestion && <div className="small text-muted">Last: {s.lastQuestion}</div>}
                    <div className="small text-muted">{s.userMessages} message{s.userMessages === 1 ? '' : 's'} from user</div>
                  </td>
                  <td>
                    {s.offered.length === 0
                      ? <span className="text-muted small">Answered</span>
                      : s.offered.map((o) => (
                        <Badge key={o.tool} bg="light" text="dark" className="border me-1 mb-1 fw-normal">
                          {OFFER_LABEL[o.tool] || o.label}
                        </Badge>
                      ))}
                  </td>
                  <td className="small">{requirementText(s.requirement) || <span className="text-muted">—</span>}</td>
                  <td><Results results={s.results} /></td>
                  <td><Badge bg={OUTCOMES[s.outcome]?.bg || 'secondary'}>{OUTCOMES[s.outcome]?.label || s.outcome}</Badge></td>
                  <td>
                    <Button size="sm" variant="primary" onClick={() => setViewing({ phone: s.phone, sessionId: s.sessionId })}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <div className="small text-muted">
        A result counts only if it happened during the chat or within {state.followWindowDays} days after it.
      </div>

      <TranscriptModal phone={viewing?.phone} sessionId={viewing?.sessionId} onHide={() => setViewing(null)} />
    </div>
  );
}

export default function AiHandled() {
  // 'AI Handled' = permission key in UserRolls.jsx
  return <PermissionGate fileName="AI Handled">{() => <AiHandledPage />}</PermissionGate>;
}
