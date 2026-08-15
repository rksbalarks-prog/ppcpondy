// ============================================================
// PointsPlans.jsx — Admin Points Plans CRUD list + modal
//
// API:
//   GET    /points-plans?all=1                 → list all (active + hidden) plans
//   POST   /points-plans                       → create
//   PUT    /points-plans/:id                   → update
//   PATCH  /points-plans/:id/active            → toggle active
//   DELETE /points-plans/:id                   → soft-delete (server sets status:'hide')
//
// The user-facing GET /points-plans returns only active plans, so admin uses ?all=1.
// We translate `status: 'active'|'hide'` → `active: bool` locally for the table.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Card, Button, Table, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import { FaEdit } from 'react-icons/fa';
import { MdDeleteForever } from 'react-icons/md';

const API = process.env.REACT_APP_API_URL;

const blankForm = {
  _id: null,
  name: '',
  description: '',
  price: '',
  points: '',
  durationDays: 0,
  popular: false,
  active: true,
  sortOrder: 0,
};

const toBoolPlan = (p) => ({ ...p, active: p.active ?? p.status === 'active' });

const PointsPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!form._id;

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/points-plans?all=1`);
      const list = Array.isArray(res.data) ? res.data : (res.data.plans || []);
      setPlans(list.map(toBoolPlan));
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const onCreate = () => { setForm(blankForm); setShowModal(true); };
  const onEdit = (p) => {
    setForm({
      _id: p._id,
      name: p.name || '',
      description: p.description || '',
      price: p.price ?? '',
      points: p.points ?? '',
      durationDays: p.durationDays ?? 0,
      popular: !!p.popular,
      active: p.active ?? (p.status === 'active'),
      sortOrder: p.sortOrder ?? 0,
    });
    setShowModal(true);
  };

  const handleField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (!(Number(form.price) > 0)) return setError('Price must be > 0');
    if (!(Number(form.points) > 0)) return setError('Points must be > 0');

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || '',
        price: Number(form.price),
        points: Number(form.points),
        durationDays: Number(form.durationDays) || 0,
        popular: !!form.popular,
        active: !!form.active,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (isEdit) {
        await axios.put(`${API}/points-plans/${form._id}`, payload);
      } else {
        await axios.post(`${API}/points-plans`, payload);
      }
      setShowModal(false);
      fetchPlans();
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p) => {
    try {
      await axios.patch(`${API}/points-plans/${p._id}/active`, { active: !p.active });
      fetchPlans();
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message);
    }
  };

  const softDelete = async (p) => {
    if (!window.confirm(`Hide plan "${p.name}"? It won't show on storefront, but historic transactions stay intact.`)) return;
    try {
      await axios.delete(`${API}/points-plans/${p._id}`);
      fetchPlans();
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message);
    }
  };

  const previewLine = useMemo(() => {
    const reveals = Number(form.points) ? Math.floor(Number(form.points) / 10) : 0;
    return `${form.name || '<Name>'} — ₹${form.price || 0} for ${form.points || 0} points (≈ ${reveals} owner contact reveals), valid for ${form.durationDays || 0} days`;
  }, [form]);

  return (
    <div className="p-3">
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Card.Header className="d-flex justify-content-between align-items-center" style={{ background: '#F0F2F5' }}>
          <h5 className="m-0">Points Plans</h5>
          <Button onClick={onCreate} style={{ background: '#1a7c3e', border: 'none' }}>+ Create Plan</Button>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-4 text-center"><Spinner animation="border" /></div>
          ) : (
            <div className="table-responsive">
              <Table hover className="m-0">
                <thead style={{ background: '#F0F2F5' }}>
                  <tr>
                    <th>Sort</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Price (₹)</th>
                    <th>Points</th>
                    <th>Duration</th>
                    <th>Popular</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.length === 0 ? (
                    <tr><td colSpan={9} className="text-center p-4 text-muted">No plans yet — click Create Plan.</td></tr>
                  ) : plans.map((p) => (
                    <tr key={p._id}>
                      <td>{p.sortOrder ?? 0}</td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.description}</td>
                      <td>₹{p.price}</td>
                      <td>{p.points}</td>
                      <td>{p.durationDays ? `${p.durationDays} days` : 'No expiry'}</td>
                      <td>
                        {p.popular && <Badge bg="warning" text="dark">⭐ MOST POPULAR</Badge>}
                      </td>
                      <td>
                        <Form.Check type="switch" checked={!!p.active} onChange={() => toggleActive(p)} />
                      </td>
                      <td>
                        <Button size="sm" variant="outline-primary" className="me-2" onClick={() => onEdit(p)}>
                          <FaEdit />
                        </Button>
                        <Button size="sm" variant="outline-danger" onClick={() => softDelete(p)}>
                          <MdDeleteForever />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Edit Plan' : 'Create Plan'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control value={form.name} onChange={(e) => handleField('name', e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.description} onChange={(e) => handleField('description', e.target.value)} />
            </Form.Group>
            <div className="row">
              <Form.Group className="col-md-4 mb-3">
                <Form.Label>Price (₹) *</Form.Label>
                <Form.Control type="number" min={0} value={form.price} onChange={(e) => handleField('price', e.target.value)} />
              </Form.Group>
              <Form.Group className="col-md-4 mb-3">
                <Form.Label>Points *</Form.Label>
                <Form.Control type="number" min={0} value={form.points} onChange={(e) => handleField('points', e.target.value)} />
              </Form.Group>
              <Form.Group className="col-md-4 mb-3">
                <Form.Label>Duration (days, 0 = no expiry)</Form.Label>
                <Form.Control type="number" min={0} value={form.durationDays} onChange={(e) => handleField('durationDays', e.target.value)} />
              </Form.Group>
            </div>
            <div className="row">
              <Form.Group className="col-md-4 mb-3">
                <Form.Label>Sort order</Form.Label>
                <Form.Control type="number" value={form.sortOrder} onChange={(e) => handleField('sortOrder', e.target.value)} />
              </Form.Group>
              <Form.Group className="col-md-4 mb-3 d-flex align-items-end">
                <Form.Check type="switch" id="popular-switch" label="Popular (yellow ⭐ badge)" checked={form.popular} onChange={(e) => handleField('popular', e.target.checked)} />
              </Form.Group>
              <Form.Group className="col-md-4 mb-3 d-flex align-items-end">
                <Form.Check type="switch" id="active-switch" label="Active (visible on storefront)" checked={form.active} onChange={(e) => handleField('active', e.target.checked)} />
              </Form.Group>
            </div>
            <div className="alert alert-info py-2">
              <strong>Preview:</strong> {previewLine}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} style={{ background: '#1a7c3e', border: 'none' }}>
            {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Plan')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PointsPlans;
