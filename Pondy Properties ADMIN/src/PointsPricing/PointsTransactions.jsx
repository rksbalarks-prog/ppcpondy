// ============================================================
// PointsTransactions.jsx — Filterable points ledger
//
// API: GET /points-transactions?page&limit&phone&planId&type&from&to
//
// Logical types: purchase | contact-reveal | manual-adjust | refund | credit | deduct
// URL query params are persisted so filters survive reload/share.
// ============================================================

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { Card, Table, Badge, Form, Button, Spinner } from 'react-bootstrap';
import { FaFilter, FaUndo } from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL;
const PAGE_SIZE = 50;

const TYPE_OPTIONS = [
  { value: '',                label: 'All types' },
  { value: 'purchase',        label: 'Purchase (paid)' },
  { value: 'contact-reveal',  label: 'Contact reveal' },
  { value: 'manual-adjust',   label: 'Manual adjust' },
  { value: 'refund',          label: 'Refund' },
  { value: 'credit',          label: 'Credit (raw)' },
  { value: 'deduct',          label: 'Deduct (raw)' },
];

// Same logic as the user-side history classifier.
const classify = (t) => {
  if ((t.note || '').startsWith('MANUAL-ADJUST')) return 'manual';
  if (t.type === 'credit' && t.txnId) return 'purchase';
  if (t.type === 'deduct' && t.reason === 'view-owner-contact') return 'reveal';
  return t.type;
};

const badgeFor = (t) => {
  const k = classify(t);
  switch (k) {
    case 'purchase': return <Badge bg="success">Purchase</Badge>;
    case 'reveal':   return <Badge bg="warning" text="dark">Reveal</Badge>;
    case 'manual':   return <Badge bg="info">Manual</Badge>;
    case 'credit':   return <Badge bg="success">Credit</Badge>;
    case 'deduct':   return <Badge bg="danger">Deduct</Badge>;
    default:         return <Badge bg="secondary">{k}</Badge>;
  }
};

const PointsTransactions = () => {
  const [params, setParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [data, setData] = useState({ transactions: [], total: 0 });
  const [loading, setLoading] = useState(false);

  // Filter state mirrored from URL search params.
  const [filters, setFilters] = useState({
    phone:  params.get('phone')  || '',
    type:   params.get('type')   || '',
    planId: params.get('planId') || '',
    from:   params.get('from')   || '',
    to:     params.get('to')     || '',
    page:   Number(params.get('page')) || 1,
  });

  useEffect(() => {
    axios.get(`${API}/points-plans?all=1`)
      .then((r) => setPlans(Array.isArray(r.data) ? r.data : (r.data.plans || [])))
      .catch(() => setPlans([]));
  }, []);

  const fetch = async (f = filters) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/points-transactions`, {
        params: {
          page: f.page || 1,
          limit: PAGE_SIZE,
          phone: f.phone || undefined,
          type: f.type || undefined,
          planId: f.planId || undefined,
          from: f.from || undefined,
          to: f.to || undefined,
        },
      });
      setData(res.data);
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); /* eslint-disable-next-line */ }, []);

  const applyFilters = () => {
    const next = { ...filters, page: 1 };
    setFilters(next);
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v && v !== 1).map(([k, v]) => [k, String(v)])));
    fetch(next);
  };
  const reset = () => {
    const blank = { phone: '', type: '', planId: '', from: '', to: '', page: 1 };
    setFilters(blank);
    setParams({});
    fetch(blank);
  };
  const goPage = (p) => {
    const next = { ...filters, page: p };
    setFilters(next);
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v && v !== 1).map(([k, v]) => [k, String(v)])));
    fetch(next);
  };

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE));
  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';

  return (
    <div className="p-3">
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Card.Header style={{ background: '#F0F2F5' }}>
          <h5 className="m-0">Points Transactions</h5>
        </Card.Header>
        <Card.Body>
          <Form className="mb-3">
            <div className="row g-2 align-items-end">
              <div className="col-md-2">
                <Form.Label className="small mb-1">Phone</Form.Label>
                <Form.Control size="sm" value={filters.phone} onChange={(e) => setFilters((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="col-md-2">
                <Form.Label className="small mb-1">Type</Form.Label>
                <Form.Select size="sm" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                  {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Form.Select>
              </div>
              <div className="col-md-2">
                <Form.Label className="small mb-1">Plan</Form.Label>
                <Form.Select size="sm" value={filters.planId} onChange={(e) => setFilters((f) => ({ ...f, planId: e.target.value }))}>
                  <option value="">All plans</option>
                  {plans.map((p) => <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>)}
                </Form.Select>
              </div>
              <div className="col-md-2">
                <Form.Label className="small mb-1">From</Form.Label>
                <Form.Control type="date" size="sm" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
              </div>
              <div className="col-md-2">
                <Form.Label className="small mb-1">To</Form.Label>
                <Form.Control type="date" size="sm" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
              </div>
              <div className="col-md-2 d-flex">
                <Button size="sm" onClick={applyFilters} className="me-2" style={{ background: '#1a7c3e', border: 'none' }}><FaFilter /> Filter</Button>
                <Button size="sm" variant="outline-secondary" onClick={reset}><FaUndo /> Reset</Button>
              </div>
            </div>
          </Form>

          {loading ? (
            <div className="p-4 text-center"><Spinner animation="border" /></div>
          ) : (
            <div className="table-responsive">
              <Table hover size="sm">
                <thead style={{ background: '#F0F2F5' }}>
                  <tr>
                    <th>Date</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>Points</th>
                    <th>Balance</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Ref</th>
                    <th>Note / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.transactions || []).length === 0 ? (
                    <tr><td colSpan={9} className="text-center p-4 text-muted">No transactions match.</td></tr>
                  ) : (data.transactions || []).map((t) => {
                    const sign = t.type === 'credit' ? '+' : '−';
                    const color = t.type === 'credit' ? '#1a7c3e' : '#c0392b';
                    return (
                      <tr key={t._id}>
                        <td>{fmtDate(t.createdAt)}</td>
                        <td>{t.phoneNumber}</td>
                        <td>{badgeFor(t)}</td>
                        <td style={{ color, fontWeight: 600 }}>{sign}{t.points}</td>
                        <td>{t.balanceAfter}</td>
                        <td>{t.planName || (t.planId ? t.planId.slice(-6) : '—')}</td>
                        <td>{t.amount ? `₹${t.amount}` : '—'}</td>
                        <td><small>{t.txnId || t.rentId || '—'}</small></td>
                        <td><small>{t.note || t.reason || '—'}</small></td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">Total: {data.total || 0}</span>
            <div>
              <Button size="sm" variant="outline-secondary" disabled={filters.page <= 1} onClick={() => goPage(filters.page - 1)} className="me-2">Prev</Button>
              <span>Page {filters.page} / {totalPages}</span>
              <Button size="sm" variant="outline-secondary" disabled={filters.page >= totalPages} onClick={() => goPage(filters.page + 1)} className="ms-2">Next</Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PointsTransactions;
