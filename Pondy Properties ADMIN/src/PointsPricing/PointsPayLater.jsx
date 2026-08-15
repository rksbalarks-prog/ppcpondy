// ============================================================
// PointsPayLater.jsx — Pay-later leads pipeline
//
// API:
//   GET   /points-paylater?page&limit&status   → merged PayU + lead rows
//   PATCH /points-paylater/:txnid              → update status / note (writes lead history)
// ============================================================

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Card, Table, Form, Badge, Button, Modal, Spinner } from 'react-bootstrap';
import { FaStickyNote } from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL;
const PAGE_SIZE = 50;
const STATUSES = ['new', 'contacted', 'converted', 'dropped'];

const statusBadge = (s) => {
  switch (s) {
    case 'new':       return <Badge bg="secondary">new</Badge>;
    case 'contacted': return <Badge bg="info">contacted</Badge>;
    case 'converted': return <Badge bg="success">converted</Badge>;
    case 'dropped':   return <Badge bg="danger">dropped</Badge>;
    default:          return <Badge bg="light" text="dark">{s || '—'}</Badge>;
  }
};

const PointsPayLater = () => {
  const adminName = useSelector((s) => s?.admin?.name) || localStorage.getItem('adminName') || 'admin';

  const [leads, setLeads] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [showNote, setShowNote] = useState(false);
  const [noteRow, setNoteRow] = useState(null);
  const [noteText, setNoteText] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/points-paylater`, {
        params: { page, limit: PAGE_SIZE, status: statusFilter || undefined },
      });
      setLeads(res.data.leads || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(); /* eslint-disable-next-line */ }, [page, statusFilter]);

  const updateStatus = async (row, status) => {
    try {
      await axios.patch(`${API}/points-paylater/${row.txnid}`, { status, adminId: adminName });
      fetch();
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message);
    }
  };

  const openNote = (row) => {
    setNoteRow(row);
    setNoteText(row.leadNote || '');
    setShowNote(true);
  };
  const saveNote = async () => {
    try {
      await axios.patch(`${API}/points-paylater/${noteRow.txnid}`, { note: noteText, adminId: adminName });
      setShowNote(false);
      fetch();
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';

  return (
    <div className="p-3">
      <div style={{ background: '#FFF4D6', border: '1px solid #F5C542', color: '#7A5B00', padding: '10px 14px', borderRadius: 6, marginBottom: 12 }}>
        <strong>Heads up:</strong> these are <em>leads only</em> — pay-later is intent. Nothing is revenue until the user converts via Pay Now or you mark it converted after collecting offline.
      </div>

      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Card.Header className="d-flex justify-content-between align-items-center" style={{ background: '#F0F2F5' }}>
          <h5 className="m-0">Points Pay Later Leads</h5>
          <Form.Select size="sm" style={{ maxWidth: 200 }} value={statusFilter}
                       onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Form.Select>
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
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Points</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Last Contact</th>
                    <th>By</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr><td colSpan={11} className="text-center p-4 text-muted">No pay-later leads.</td></tr>
                  ) : leads.map((row) => (
                    <tr key={row.txnid}>
                      <td>{fmtDate(row.createdAt)}</td>
                      <td>{row.firstname || '—'}</td>
                      <td>{row.phone}</td>
                      <td>{row.email || '—'}</td>
                      <td>{row.planName}</td>
                      <td>{row.points}</td>
                      <td>₹{row.amount}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {statusBadge(row.leadStatus)}
                          <Form.Select size="sm" value={row.leadStatus || 'new'}
                                       onChange={(e) => updateStatus(row, e.target.value)}
                                       className="ms-2" style={{ minWidth: 120 }}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Form.Select>
                        </div>
                      </td>
                      <td>{fmtDate(row.lastContactAt)}</td>
                      <td>{row.updatedBy || '—'}</td>
                      <td>
                        <Button size="sm" variant="outline-secondary" onClick={() => openNote(row)}>
                          <FaStickyNote /> {row.leadNote ? 'Edit' : 'Add'}
                        </Button>
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

      <Modal show={showNote} onHide={() => setShowNote(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Lead Note — {noteRow?.phone}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control as="textarea" rows={5} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
          <Form.Text className="text-muted">Saved with adminId = {adminName}. Appended to lead history.</Form.Text>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNote(false)}>Cancel</Button>
          <Button onClick={saveNote} style={{ background: '#1a7c3e', border: 'none' }}>Save Note</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PointsPayLater;
