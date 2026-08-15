// ============================================================
// PointsUsers.jsx — Admin Points Users + Balance + Adjust + Logs
//
// API:
//   GET  /points-users?page&limit&phone   → paginated balances
//   POST /points-adjust                   → manual credit/debit (signed points)
//   GET  /points-transactions?phone=&type=manual-adjust → admin logs for a user
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, Button, Table, Badge, Modal, Form, Spinner, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL;
const PAGE_SIZE = 25;

// Mirror of backend's normalizePhone — keep in lockstep.
const normalizeLocal = (raw = '') =>
  String(raw).replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

// Manual adjust note format on the server is:
//   MANUAL-ADJUST | <reason> | by <adminId>
const parseAdjustNote = (note = '') => {
  const parts = String(note).split(' | ');
  return {
    tag: parts[0] || '',
    reason: parts[1] || '',
    by: (parts[2] || '').replace(/^by\s+/i, ''),
  };
};

const PointsUsers = () => {
  const navigate = useNavigate();
  const adminName = useSelector((s) => s?.admin?.name) || localStorage.getItem('adminName') || 'admin';

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [idFilter, setIdFilter] = useState(''); // '' = all | 'with' | 'none'
  const [loading, setLoading] = useState(false);

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustUser, setAdjustUser] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ direction: 'credit', points: '', reason: '' });
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [addPhone, setAddPhone] = useState('');
  const [addError, setAddError] = useState('');

  const [showLogs, setShowLogs] = useState(false);
  const [logsUser, setLogsUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // No-ID bonus modal
  const [showBonus, setShowBonus] = useState(false);
  const [bonusSummary, setBonusSummary] = useState(null);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusError, setBonusError] = useState('');
  const [bonusSaving, setBonusSaving] = useState(false);
  const [bonusResult, setBonusResult] = useState(null);
  const [bonusNote, setBonusNote] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/points-users`, {
        params: { page, limit: PAGE_SIZE, phone: search || undefined, idStatus: idFilter || undefined },
      });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(); /* eslint-disable-next-line */ }, [page, idFilter]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); fetch(); };

  const openAdjust = (u) => {
    setAdjustUser(u);
    setAdjustForm({ direction: 'credit', points: '', reason: '' });
    setAdjustError('');
    setShowAdjust(true);
  };

  const submitAdjust = async () => {
    setAdjustError('');
    const n = Number(adjustForm.points);
    if (!Number.isFinite(n) || n <= 0) return setAdjustError('Points must be a positive number');
    if (!adjustForm.reason.trim()) return setAdjustError('Reason is required');

    setAdjustSaving(true);
    try {
      const signed = adjustForm.direction === 'credit' ? n : -n;
      await axios.post(`${API}/points-adjust`, {
        phoneNumber: adjustUser.phoneNumber,
        points: signed,
        reason: adjustForm.reason.trim(),
        adminId: adminName,
      });
      setShowAdjust(false);
      fetch();
    } catch (e) {
      setAdjustError(e?.response?.data?.message || e.message);
    } finally {
      setAdjustSaving(false);
    }
  };

  const submitAdd = async () => {
    setAddError('');
    const phone = normalizeLocal(addPhone);
    if (!/^\d{10}$/.test(phone)) return setAddError('Enter a valid 10-digit phone number');
    try {
      // Hitting the public balance endpoint creates the row if it does not exist.
      await axios.get(`${API}/points-balance/${phone}`);
      setShowAdd(false);
      setAddPhone('');
      setPage(1);
      fetch();
    } catch (e) {
      setAddError(e?.response?.data?.message || e.message);
    }
  };

  const openLogs = async (u) => {
    setLogsUser(u);
    setShowLogs(true);
    setLogs([]);
    setLogsLoading(true);
    try {
      const res = await axios.get(`${API}/points-transactions`, {
        params: { phone: u.phoneNumber, type: 'manual-adjust', limit: 200 },
      });
      setLogs(res.data.transactions || []);
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message);
    } finally {
      setLogsLoading(false);
    }
  };

  // ── No-ID bonus: preview how many users are eligible, then grant ──
  const openBonus = async () => {
    setShowBonus(true);
    setBonusError('');
    setBonusResult(null);
    setBonusSummary(null);
    setBonusNote('');
    setBonusLoading(true);
    try {
      const res = await axios.get(`${API}/points-no-id-summary`);
      setBonusSummary(res.data);
    } catch (e) {
      setBonusError(e?.response?.data?.message || e.message);
    } finally {
      setBonusLoading(false);
    }
  };

  const submitBonus = async () => {
    if (!bonusNote.trim()) return setBonusError('A note is required before granting points');
    setBonusSaving(true);
    setBonusError('');
    try {
      const res = await axios.post(`${API}/points-bonus-no-id`, {
        adminId: adminName,
        points: 100,
        reason: bonusNote.trim(),
      });
      setBonusResult(res.data);
      fetch();
    } catch (e) {
      setBonusError(e?.response?.data?.message || e.message);
    } finally {
      setBonusSaving(false);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-3">
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Card.Header className="d-flex justify-content-between align-items-center" style={{ background: '#F0F2F5' }}>
          <h5 className="m-0">Points Users &amp; Balances</h5>
          <div className="d-flex gap-2">
            <Button variant="outline-success" onClick={openBonus}>
              Give 100 pts to No-ID users
            </Button>
            <Button onClick={() => { setAddPhone(''); setAddError(''); setShowAdd(true); }}
                    style={{ background: '#1a7c3e', border: 'none' }}>+ Add User</Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
            <Form onSubmit={onSearch} className="flex-grow-1" style={{ minWidth: 220 }}>
              <InputGroup>
                <Form.Control placeholder="Search phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <Button type="submit" variant="outline-secondary"><FaSearch /></Button>
              </InputGroup>
            </Form>
            <Form.Select
              style={{ maxWidth: 220 }}
              value={idFilter}
              onChange={(e) => { setIdFilter(e.target.value); setPage(1); }}
              title="Filter by whether the phone has a PPC ID / Ba_Id"
            >
              <option value="">All users</option>
              <option value="with">With ID (PPC / BA)</option>
              <option value="none">No ID</option>
            </Form.Select>
          </div>

          {loading ? (
            <div className="p-4 text-center"><Spinner animation="border" /></div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead style={{ background: '#F0F2F5' }}>
                  <tr>
                    <th>Phone</th>
                    <th>ID</th>
                    <th>Balance</th>
                    <th>Earned</th>
                    <th>Spent</th>
                    <th>Paid (₹)</th>
                    <th>Last Activity</th>
                    <th>Logs</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={9} className="text-center p-4 text-muted">No users found.</td></tr>
                  ) : users.map((u) => (
                    <tr key={u._id || u.phoneNumber}>
                      <td>{u.phoneNumber}</td>
                      <td>
                        {u.hasPPC && <Badge bg="info" className="me-1">PPC</Badge>}
                        {u.hasBA && <Badge bg="warning" text="dark" className="me-1">BA</Badge>}
                        {!u.hasPPC && !u.hasBA && <Badge bg="secondary">No ID</Badge>}
                      </td>
                      <td><Badge bg="primary">{u.balance}</Badge></td>
                      <td>{u.totalEarned}</td>
                      <td>{u.totalSpent}</td>
                      <td>₹{u.totalPaid || 0}</td>
                      <td>{fmtDate(u.lastActivityAt)}</td>
                      <td>
                        <Button size="sm" variant="outline-secondary" onClick={() => openLogs(u)}>Admin Logs</Button>
                      </td>
                      <td>
                        <Button size="sm" variant="outline-info" className="me-2"
                                onClick={() => navigate(`/dashboard/points-transactions?phone=${encodeURIComponent(u.phoneNumber)}`)}>
                          Txns
                        </Button>
                        <Button size="sm" variant="outline-primary" onClick={() => openAdjust(u)}>Adjust</Button>
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

      {/* ─── Adjust modal ────────────────────────────── */}
      <Modal show={showAdjust} onHide={() => setShowAdjust(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Adjust Balance — {adjustUser?.phoneNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {adjustError && <div className="alert alert-danger py-2">{adjustError}</div>}
          <div className="mb-2 text-muted">Current balance: <strong>{adjustUser?.balance ?? 0}</strong></div>
          <Form>
            <div className="mb-3">
              <Form.Check inline type="radio" id="adj-credit" label="Credit (+)" name="adj-dir"
                checked={adjustForm.direction === 'credit'}
                onChange={() => setAdjustForm((f) => ({ ...f, direction: 'credit' }))} />
              <Form.Check inline type="radio" id="adj-debit" label="Debit (−)" name="adj-dir"
                checked={adjustForm.direction === 'debit'}
                onChange={() => setAdjustForm((f) => ({ ...f, direction: 'debit' }))} />
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Points</Form.Label>
              <Form.Control type="number" min={1} value={adjustForm.points}
                onChange={(e) => setAdjustForm((f) => ({ ...f, points: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control value={adjustForm.reason}
                onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. refund, goodwill, correction" />
              <Form.Text className="text-muted">Saved as: MANUAL-ADJUST | reason | by {adminName}</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdjust(false)} disabled={adjustSaving}>Cancel</Button>
          <Button onClick={submitAdjust} disabled={adjustSaving} style={{ background: '#1a7c3e', border: 'none' }}>
            {adjustSaving ? 'Saving…' : 'Save Adjustment'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ─── Add user modal ─────────────────────────── */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} backdrop="static">
        <Modal.Header closeButton><Modal.Title>Add User</Modal.Title></Modal.Header>
        <Modal.Body>
          {addError && <div className="alert alert-danger py-2">{addError}</div>}
          <Form>
            <Form.Group>
              <Form.Label>Phone (10 digits)</Form.Label>
              <Form.Control value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="9876543210" />
              <Form.Text className="text-muted">Will be normalized — drops +91/91/0 prefix and spaces.</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={submitAdd} style={{ background: '#1a7c3e', border: 'none' }}>Add User</Button>
        </Modal.Footer>
      </Modal>

      {/* ─── Logs modal ─────────────────────────────── */}
      <Modal show={showLogs} onHide={() => setShowLogs(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Admin Logs — {logsUser?.phoneNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {logsLoading ? (
            <div className="p-4 text-center"><Spinner animation="border" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center text-muted p-3">No manual adjustments for this user.</div>
          ) : (
            <Table size="sm" striped>
              <thead style={{ background: '#F0F2F5' }}>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Points</th>
                  <th>Balance After</th>
                  <th>Reason</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((t) => {
                  const meta = parseAdjustNote(t.note);
                  return (
                    <tr key={t._id}>
                      <td>{fmtDate(t.createdAt)}</td>
                      <td>
                        <Badge bg={t.type === 'credit' ? 'success' : 'danger'}>
                          {t.type === 'credit' ? '+ credit' : '− debit'}
                        </Badge>
                      </td>
                      <td>{t.points}</td>
                      <td>{t.balanceAfter}</td>
                      <td>{meta.reason}</td>
                      <td>{meta.by}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>

      {/* ─── No-ID bonus modal ──────────────────────── */}
      <Modal show={showBonus} onHide={() => setShowBonus(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Give 100 pts to No-ID users</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bonusError && <div className="alert alert-danger py-2">{bonusError}</div>}

          {bonusResult ? (
            <div className="alert alert-success">
              Done. Credited <strong>{bonusResult.credited}</strong> user(s) with 100 points.
              {bonusResult.skipped > 0 && (
                <> Skipped <strong>{bonusResult.skipped}</strong> who were already given this bonus.</>
              )}
            </div>
          ) : bonusLoading ? (
            <div className="p-4 text-center"><Spinner animation="border" /></div>
          ) : bonusSummary ? (
            <>
              <p>This will credit <strong>100 points</strong> to every points user whose phone has
                <strong> no PPC ID and no Ba_Id</strong>.</p>
              <ul className="mb-2">
                <li>No-ID users: <strong>{bonusSummary.noId}</strong></li>
                <li>Already given this bonus (will be skipped): <strong>{bonusSummary.alreadyBonused}</strong></li>
                <li>Will receive 100 pts now: <strong>{bonusSummary.eligible}</strong></li>
              </ul>
              <div className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                Safe to run more than once — users already bonused are skipped, so nobody is paid twice.
              </div>
              <Form.Group>
                <Form.Label>Note <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={bonusNote}
                  onChange={(e) => setBonusNote(e.target.value)}
                  placeholder="e.g. New-year goodwill bonus for users without any listing"
                />
                <Form.Text className="text-muted">
                  Saved with every credit and shown in Admin Logs.
                </Form.Text>
              </Form.Group>
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBonus(false)} disabled={bonusSaving}>
            {bonusResult ? 'Close' : 'Cancel'}
          </Button>
          {!bonusResult && (
            <Button
              onClick={submitBonus}
              disabled={bonusSaving || bonusLoading || !bonusSummary || bonusSummary.eligible === 0 || !bonusNote.trim()}
              style={{ background: '#1a7c3e', border: 'none' }}
            >
              {bonusSaving ? 'Granting…' : `Grant 100 pts to ${bonusSummary?.eligible ?? 0} user(s)`}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PointsUsers;
