// ============================================================
// PointsSettings.jsx — Singleton config (points per contact reveal)
//
// API:
//   GET /points-config
//   PUT /points-config  body: { pointsPerContactReveal, adminId }
//
// Heads-up: the user-facing app currently ships POINTS_PER_CONTACT_VIEW = 10
// hardcoded in Details.jsx. To honour this setting end-to-end, the user app
// should fetch /points-config on load and use that value.
// ============================================================

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Card, Form, Button, Spinner } from 'react-bootstrap';

const API = process.env.REACT_APP_API_URL;

const PointsSettings = () => {
  const adminName = useSelector((s) => s?.admin?.name) || localStorage.getItem('adminName') || 'admin';

  const [config, setConfig] = useState(null);
  const [pts, setPts] = useState(10);
  const [buyerPts, setBuyerPts] = useState(20);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const fetchCfg = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/points-config`);
      setConfig(res.data.config);
      setPts(res.data.config?.pointsPerContactReveal ?? 10);
      setBuyerPts(res.data.config?.pointsPerBuyerContactReveal ?? 20);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchCfg(); }, []);

  const save = async () => {
    setError(''); setOkMsg('');
    const n = Number(pts);
    const bn = Number(buyerPts);
    if (!Number.isFinite(n) || n < 1) return setError('Points per contact reveal for owner must be a positive integer ≥ 1');
    if (!Number.isFinite(bn) || bn < 1) return setError('Points per contact reveal for buyer must be a positive integer ≥ 1');
    setSaving(true);
    try {
      const res = await axios.put(`${API}/points-config`, {
        pointsPerContactReveal: n,
        pointsPerBuyerContactReveal: bn,
        adminId: adminName,
      });
      setConfig(res.data.config);
      setOkMsg('Saved.');
      setTimeout(() => setOkMsg(''), 2500);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';

  return (
    <div className="p-3">
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Card.Header style={{ background: '#F0F2F5' }}>
          <h5 className="m-0">Points Settings</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="p-4 text-center"><Spinner animation="border" /></div>
          ) : (
            <>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              {okMsg && <div className="alert alert-success py-2">{okMsg}</div>}

              <Form>
                <Form.Group className="mb-3" style={{ maxWidth: 360 }}>
                  <Form.Label>Points per contact reveal for owner</Form.Label>
                  <Form.Control type="number" min={1} value={pts} onChange={(e) => setPts(e.target.value)} />
                  <Form.Text className="text-muted">
                    Server value: <strong>{config?.pointsPerContactReveal ?? '—'}</strong>
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" style={{ maxWidth: 360 }}>
                  <Form.Label>Points per contact reveal for buyer</Form.Label>
                  <Form.Control type="number" min={1} value={buyerPts} onChange={(e) => setBuyerPts(e.target.value)} />
                  <Form.Text className="text-muted">
                    Server value: <strong>{config?.pointsPerBuyerContactReveal ?? '—'}</strong>
                  </Form.Text>
                </Form.Group>

                <div className="d-flex">
                  <Button onClick={save} disabled={saving} className="me-2" style={{ background: '#1a7c3e', border: 'none' }}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="outline-secondary" onClick={fetchCfg} disabled={saving}>Reload</Button>
                </div>

                <div className="mt-4 p-2" style={{ background: '#F0F2F5', borderRadius: 6 }}>
                  <small className="d-block">Last updated by: <strong>{config?.updatedBy || '—'}</strong></small>
                  <small className="d-block">Last updated at: <strong>{fmtDate(config?.updatedAt)}</strong></small>
                </div>
              </Form>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default PointsSettings;
