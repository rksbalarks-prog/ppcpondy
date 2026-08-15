// ============================================================
// PointsPayU.jsx — Points PayU records (4 status tabs)
//
// API:
//   GET /payu/points-payments/all          → all
//   GET /payu/points-payments/success      → paid
//   GET /payu/points-payments/failure      → pay failed
//
// Tabs: Paid / PayNow (in-progress) / PayLater (intent) / PayFailed
// All tabs are filtered locally from /all so we hit the API once.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Card, Tabs, Tab, Table, Form, Badge, Button, Spinner } from 'react-bootstrap';
import { FaSync, FaPrint, FaFileCsv, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL;

const TAB_DEFS = [
  { key: 'paid',     label: '✅ Paid',     color: '#E6F4EA', payustatususer: 'paid' },
  { key: 'paynow',   label: '⏳ Pay Now',  color: '#FFF8E1', payustatususer: 'pay now' },
  { key: 'paylater', label: '🕒 Pay Later',color: '#FFF4D6', payustatususer: 'pay later' },
  { key: 'failed',   label: '❌ Failed',   color: '#FDE7E9', payustatususer: 'pay failed' },
];

const statusBadge = (s) => {
  switch (s) {
    case 'paid':       return <Badge bg="success">paid</Badge>;
    case 'pay now':    return <Badge bg="warning" text="dark">pay now</Badge>;
    case 'pay later':  return <Badge bg="info">pay later</Badge>;
    case 'pay failed': return <Badge bg="danger">failed</Badge>;
    default:           return <Badge bg="secondary">{s || '—'}</Badge>;
  }
};

const PointsPayU = () => {
  const [all, setAll] = useState([]);
  const [tab, setTab] = useState('paid');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ phone: '', txn: '', from: '', to: '' });

  // Inline remark editing — editingId is the _id of the row currently in edit mode.
  const [editingId, setEditingId] = useState(null);
  const [draftRemark, setDraftRemark] = useState('');
  const [savingId, setSavingId] = useState(null);

  const startEdit = (r) => { setEditingId(r._id); setDraftRemark(r.remark || ''); };
  const cancelEdit = () => { setEditingId(null); setDraftRemark(''); };

  const saveRemark = async (id) => {
    setSavingId(id);
    try {
      await axios.patch(`${API}/payu/points-payments/${id}/remark`, { remark: draftRemark });
      // Update locally so the change is reflected across all four tabs without a refetch.
      setAll((prev) => prev.map((r) => (r._id === id ? { ...r, remark: draftRemark } : r)));
      setEditingId(null);
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message);
    } finally {
      setSavingId(null);
    }
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/payu/points-payments/all`);
      setAll(res.data.payments || []);
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(); }, []);

  const rows = useMemo(() => {
    const tabDef = TAB_DEFS.find((t) => t.key === tab);
    return all
      .filter((r) => r.payustatususer === tabDef.payustatususer)
      .filter((r) => !filters.phone || (r.phone || '').includes(filters.phone))
      .filter((r) => !filters.txn || (r.txnid || '').includes(filters.txn) || (r.mihpayid || '').includes(filters.txn))
      .filter((r) => {
        if (!filters.from && !filters.to) return true;
        const d = new Date(r.createdAt).getTime();
        if (filters.from && d < new Date(filters.from).getTime()) return false;
        if (filters.to && d > (new Date(filters.to).getTime() + 86400000)) return false;
        return true;
      });
  }, [all, tab, filters]);

  const stats = useMemo(() => ({
    count: rows.length,
    amount: rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    points: rows.reduce((sum, r) => sum + (Number(r.points) || 0), 0),
  }), [rows]);

  const exportCSV = () => {
    const header = ['Date', 'TxnID', 'MihpayID', 'Name', 'Phone', 'Email', 'Plan', 'Points', 'Amount', 'Status', 'Remark'];
    const lines = rows.map((r) => [
      new Date(r.createdAt).toISOString(),
      r.txnid, r.mihpayid || '',
      (r.firstname || '').replace(/,/g, ' '),
      r.phone, r.email,
      (r.planName || '').replace(/,/g, ' '),
      r.points || 0, r.amount || 0,
      r.payustatususer,
      (r.remark || '').replace(/,/g, ' '),
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `points-payu-${tab}-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const printIt = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const tableHtml = document.querySelector('#points-payu-table')?.outerHTML || '';
    w.document.write(`<html><head><title>Points PayU — ${tab}</title>
      <style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px;font-size:12px}thead{background:#F0F2F5}</style>
      </head><body><h2>Points PayU — ${tab}</h2>${tableHtml}</body></html>`);
    w.document.close();
    w.print();
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';
  const tabDef = TAB_DEFS.find((t) => t.key === tab);

  return (
    <div className="p-3">
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Card.Header className="d-flex justify-content-between align-items-center" style={{ background: '#F0F2F5' }}>
          <h5 className="m-0">Points PayU Records</h5>
          <div>
            <Button size="sm" variant="outline-secondary" onClick={fetch} className="me-2"><FaSync /> Refresh</Button>
            <Button size="sm" variant="outline-secondary" onClick={exportCSV} className="me-2"><FaFileCsv /> Export CSV</Button>
            <Button size="sm" variant="outline-secondary" onClick={printIt}><FaPrint /> Print</Button>
          </div>
        </Card.Header>
        <Card.Body style={{ background: tabDef?.color || '#fff' }}>
          <Tabs activeKey={tab} onSelect={(k) => setTab(k)} className="mb-3">
            {TAB_DEFS.map((t) => <Tab key={t.key} eventKey={t.key} title={t.label} />)}
          </Tabs>

          {/* Stats strip */}
          <div className="d-flex justify-content-around mb-3 p-2" style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="text-center"><small className="text-muted d-block">Records</small><strong>{stats.count}</strong></div>
            <div className="text-center"><small className="text-muted d-block">Total Amount</small><strong>₹{stats.amount}</strong></div>
            <div className="text-center"><small className="text-muted d-block">Total Points</small><strong>{stats.points}</strong></div>
          </div>

          {/* Filters */}
          <Form className="mb-3">
            <div className="row g-2">
              <div className="col-md-3"><Form.Control size="sm" placeholder="Phone substring" value={filters.phone} onChange={(e) => setFilters((f) => ({ ...f, phone: e.target.value }))} /></div>
              <div className="col-md-3"><Form.Control size="sm" placeholder="txnid / mihpayid" value={filters.txn} onChange={(e) => setFilters((f) => ({ ...f, txn: e.target.value }))} /></div>
              <div className="col-md-3"><Form.Control type="date" size="sm" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} /></div>
              <div className="col-md-3"><Form.Control type="date" size="sm" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} /></div>
            </div>
          </Form>

          {loading ? (
            <div className="p-4 text-center"><Spinner animation="border" /></div>
          ) : (
            <div className="table-responsive" style={{ background: '#fff', borderRadius: 6 }}>
              <Table hover size="sm" id="points-payu-table" className="m-0">
                <thead style={{ background: '#F0F2F5' }}>
                  <tr>
                    <th>Date</th>
                    <th>TxnID</th>
                    <th>MihpayID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Points</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={11} className="text-center p-3 text-muted">No records.</td></tr>
                  ) : rows.map((r) => (
                    <tr key={r._id || r.txnid}>
                      <td>{fmtDate(r.createdAt)}</td>
                      <td><small>{r.txnid}</small></td>
                      <td><small>{r.mihpayid || '—'}</small></td>
                      <td>{r.firstname}</td>
                      <td>{r.phone}</td>
                      <td>{r.email}</td>
                      <td>{r.planName}</td>
                      <td>{r.points}</td>
                      <td>₹{r.amount}</td>
                      <td>{statusBadge(r.payustatususer)}</td>
                      <td style={{ minWidth: 190 }}>
                        {editingId === r._id ? (
                          <div className="d-flex align-items-center" style={{ gap: 4 }}>
                            <Form.Control
                              size="sm"
                              autoFocus
                              value={draftRemark}
                              placeholder="Add remark…"
                              onChange={(e) => setDraftRemark(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRemark(r._id);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                            <Button size="sm" variant="success" title="Save"
                              disabled={savingId === r._id} onClick={() => saveRemark(r._id)}>
                              {savingId === r._id ? <Spinner animation="border" size="sm" /> : <FaCheck />}
                            </Button>
                            <Button size="sm" variant="outline-secondary" title="Cancel" onClick={cancelEdit}>
                              <FaTimes />
                            </Button>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-between align-items-center"
                            style={{ cursor: 'pointer', gap: 6 }}
                            title="Click to edit remark"
                            onClick={() => startEdit(r)}>
                            <span className={r.remark ? '' : 'text-muted fst-italic'}>
                              {r.remark || 'Add remark…'}
                            </span>
                            <FaEdit className="text-muted flex-shrink-0" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          <small className="text-muted d-block mt-2">Source: <code>/payu/points-payments/all</code></small>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PointsPayU;
