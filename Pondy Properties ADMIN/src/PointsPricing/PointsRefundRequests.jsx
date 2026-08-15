// ============================================================
// PointsRefundRequests.jsx — Admin queue of user refund requests
//
// API:
//   GET   /points-refund-requests?page&limit&status&phone
//   PATCH /points-refund-requests/:id   { status: 'approved'|'rejected', adminId, adminNote }
//
// On approve, the server credits the points back atomically and
// writes a credit row in PointsTransaction with note "REFUND | ...".
// ============================================================

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Card, Table, Form, Badge, Button, Modal, Spinner, InputGroup } from 'react-bootstrap';
import { FaSearch, FaCheck, FaTimes } from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL;
const PAGE_SIZE = 50;
const STATUSES = ['pending', 'approved', 'rejected'];

const statusBadge = (s) => {
  switch (s) {
    case 'pending':  return <Badge bg="warning" text="dark">pending</Badge>;
    case 'approved': return <Badge bg="success">approved</Badge>;
    case 'rejected': return <Badge bg="danger">rejected</Badge>;
    default:         return <Badge bg="secondary">{s || '—'}</Badge>;
  }
};

const PointsRefundRequests = () => {
  const adminName = useSelector((s) => s?.admin?.name) || localStorage.getItem('adminName') || 'admin';

  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  // Default to "all" so a request the admin just processed stays visible on
  // the same screen (with the admin name, timestamp and note shown next to it).
  const [statusFilter, setStatusFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [resolving, setResolving] = useState(null); // { req, action }
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/points-refund-requests`, {
        params: {
          page, limit: PAGE_SIZE,
          status: statusFilter || undefined,
          phone: phoneFilter || undefined,
        },
      });
      setRequests(res.data.requests || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(); /* eslint-disable-next-line */ }, [page, statusFilter, phoneFilter]);

  const onSearchPhone = (e) => { e.preventDefault(); setPage(1); setPhoneFilter(phoneInput.trim()); };

  const openResolve = (req, action) => {
    setResolving({ req, action });
    setAdminNote('');
    setSubmitError('');
  };
  const submitResolve = async () => {
    if (!resolving) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await axios.patch(`${API}/points-refund-requests/${resolving.req._id}`, {
        status: resolving.action,
        adminId: adminName,
        adminNote: adminNote.trim(),
      });
      setResolving(null);
      fetch();
    } catch (e) {
      setSubmitError(e?.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-3">
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ background: '#F0F2F5' }}>
          <h5 className="m-0">Points Refund Requests</h5>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <Form.Select size="sm" style={{ width: 140 }} value={statusFilter}
                         onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Form.Select>
            <Form onSubmit={onSearchPhone} className="d-flex">
              <InputGroup size="sm" style={{ width: 220 }}>
                <Form.Control placeholder="Search phone..." value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
                <Button type="submit" variant="outline-secondary"><FaSearch /></Button>
              </InputGroup>
            </Form>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="p-4 text-center"><Spinner animation="border" /></div>
          ) : (
            <div className="table-responsive">
              <Table hover size="sm">
                <thead style={{ background: '#F0F2F5' }}>
                  <tr>
                    <th>Date</th>
                    <th>Phone</th>
                    <th>Property</th>
                    <th>Points</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Processed By</th>
                    <th>Resolved At</th>
                    <th>Admin Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr><td colSpan={10} className="text-center p-4 text-muted">No refund requests match.</td></tr>
                  ) : requests.map((r) => (
                    <tr key={r._id}>
                      <td>{fmtDate(r.createdAt)}</td>
                      <td>{r.phoneNumber}</td>
                      <td>{r.rentId || '—'}</td>
                      <td><strong>{r.points}</strong></td>
                      <td><small>{r.reason || '—'}</small></td>
                      <td>{statusBadge(r.status)}</td>
                      <td>
                        {r.adminId ? (
                          <Badge bg={r.status === 'approved' ? 'success' : (r.status === 'rejected' ? 'danger' : 'secondary')}
                                 style={{ fontSize: 12 }}>
                            👤 {r.adminId}
                          </Badge>
                        ) : <small className="text-muted">—</small>}
                      </td>
                      <td><small>{fmtDate(r.resolvedAt)}</small></td>
                      <td><small>{r.adminNote || '—'}</small></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {r.status === 'pending' ? (
                          <>
                            <Button size="sm" variant="success" className="me-2"
                                    onClick={() => openResolve(r, 'approved')}>
                              <FaCheck /> Approve
                            </Button>
                            <Button size="sm" variant="outline-danger"
                                    onClick={() => openResolve(r, 'rejected')}>
                              <FaTimes /> Reject
                            </Button>
                          </>
                        ) : <small className="text-muted">—</small>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">Total: {total}</span>
            <div>
              <Button size="sm" variant="outline-secondary" disabled={page === 1} onClick={() => setPage(page - 1)} className="me-2">Prev</Button>
              <span>Page {page} / {totalPages}</span>
              <Button size="sm" variant="outline-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="ms-2">Next</Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Modal show={!!resolving} onHide={() => !submitting && setResolving(null)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {resolving?.action === 'approved' ? 'Approve refund' : 'Reject refund'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {submitError && <div className="alert alert-danger py-2">{submitError}</div>}
          {resolving && (
            <>
              <div className="mb-2"><strong>Phone:</strong> {resolving.req.phoneNumber}</div>
              <div className="mb-2"><strong>Property:</strong> {resolving.req.rentId || '—'}</div>
              <div className="mb-2"><strong>Points to refund:</strong> {resolving.req.points}</div>
              <div className="mb-3"><strong>User reason:</strong> <em>{resolving.req.reason || '—'}</em></div>
              {resolving.action === 'approved' ? (
                <div className="alert alert-success py-2">
                  Approving will credit <strong>{resolving.req.points}</strong> pts back to <code>{resolving.req.phoneNumber}</code> and write a refund row to the ledger.
                </div>
              ) : (
                <div className="alert alert-warning py-2">
                  Rejecting will close the request without crediting points.
                </div>
              )}
              <Form.Group>
                <Form.Label>Admin note (optional)</Form.Label>
                <Form.Control as="textarea" rows={3} value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              placeholder="Reason for the decision (visible in ledger)" />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setResolving(null)} disabled={submitting}>Cancel</Button>
          <Button onClick={submitResolve} disabled={submitting}
                  variant={resolving?.action === 'approved' ? 'success' : 'danger'}>
            {submitting ? 'Saving…' : (resolving?.action === 'approved' ? 'Approve & Refund' : 'Reject')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PointsRefundRequests;
