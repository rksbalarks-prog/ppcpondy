// Push Notifications — admin control panel to compose & send FCM pushes to the
// Pondy Property mobile app, and see how many devices are registered.
//
// Backend (additive, in PPC/fcm/FcmTokenRouter.js):
//   GET  /push-stats
//   POST /push-send { title, body, route?, ppcId?, audience }
//
// The `route` deep-links the tap to a screen in the app; a ppcId opens that
// property. Matches the app's message->route contract in
// PondyPropertiesFlutter/lib/services/push_service.dart.

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Form, Button, Row, Col, Card, Spinner, Alert, Badge } from 'react-bootstrap';

// .trim() matters — REACT_APP_API_URL in .env carries a trailing space, which
// would otherwise be baked into every request URL as %20.
const BASE = (process.env.REACT_APP_API_URL || '').trim().replace(/\/+$/, '');
// Shared secret for the protected push endpoints (must match PUSH_ADMIN_KEY on
// the backend). Set REACT_APP_PUSH_ADMIN_KEY in the admin app's .env.
const PUSH_KEY = process.env.REACT_APP_PUSH_ADMIN_KEY || '';
const AUTH = { headers: { 'x-push-key': PUSH_KEY } };

// Where a tapped notification should open in the app. Values are the route
// names in PondyPropertiesFlutter/lib/routes.dart.
const TARGETS = [
  { value: '/notification', label: 'Notifications list' },
  { value: '/mobileviews', label: 'Home' },
  { value: '/add-plan', label: 'Pricing Plans' },
  { value: '/points-plans', label: 'Points Plans' },
  { value: '/buyer-plan', label: 'Buyer Plans' },
  { value: '/my-property', label: 'My Property' },
  { value: '__ppcId__', label: 'A specific property (PPC ID)…' },
];

export default function PushNotifications() {
  const [stats, setStats] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('/notification');
  const [ppcId, setPpcId] = useState('');
  const [audType, setAudType] = useState('all'); // all | number | numbers
  const [number, setNumber] = useState('');
  const [numbers, setNumbers] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null); // { type, text }

  const loadStats = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/push-stats`, AUTH);
      setStats(res.data || null);
    } catch (_) {
      setStats(null);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      setMsg({ type: 'danger', text: 'Title and body are required.' });
      return;
    }
    const audience =
      audType === 'number'
        ? { type: 'number', number: number.trim() }
        : audType === 'numbers'
        ? { type: 'numbers', numbers: numbers.trim() }
        : { type: 'all' };

    if (audType === 'number' && !number.trim()) {
      setMsg({ type: 'danger', text: 'Enter a phone number.' });
      return;
    }
    if (audType === 'numbers' && !numbers.trim()) {
      setMsg({ type: 'danger', text: 'Enter at least one phone number.' });
      return;
    }

    const payload = { title: title.trim(), body: body.trim(), audience };
    if (target === '__ppcId__') {
      if (!ppcId.trim()) { setMsg({ type: 'danger', text: 'Enter a PPC ID.' }); return; }
      payload.ppcId = ppcId.trim();
    } else {
      payload.route = target;
    }

    // A broadcast is high-impact — confirm first.
    if (audType === 'all' && !window.confirm('Send this push to ALL registered devices?')) return;

    setSending(true);
    setMsg(null);
    try {
      const res = await axios.post(`${BASE}/push-send`, payload, AUTH);
      const r = res.data || {};
      setMsg({
        type: r.sent > 0 ? 'success' : 'warning',
        text: `Done — delivered to ${r.sent ?? 0} / ${r.tokens ?? 0} device(s), ${r.failed ?? 0} failed.`,
      });
      loadStats();
    } catch (e) {
      setMsg({ type: 'danger', text: `Send failed: ${e.response?.data?.message || e.message}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container py-3" style={{ maxWidth: 900 }}>
      <h4 className="mb-3">📣 Push Notifications</h4>

      {/* Stats */}
      <Row className="g-3 mb-3">
        <Col xs={4}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <div className="fs-3 fw-bold" style={{ color: '#8BC34A' }}>{stats?.totalTokens ?? '—'}</div>
              <div className="text-muted small">Registered devices</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={4}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <div className="fs-3 fw-bold" style={{ color: '#8BC34A' }}>{stats?.distinctUsers ?? '—'}</div>
              <div className="text-muted small">Users with push on</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={4}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <div className="small">
                {stats?.platforms
                  ? Object.entries(stats.platforms).map(([k, v]) => (
                      <Badge bg="secondary" key={k} className="me-1">{k}: {v}</Badge>
                    ))
                  : '—'}
              </div>
              <div className="text-muted small mt-1">By platform</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        {/* Compose */}
        <Col md={7}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="fs-6 mb-3">Compose</Card.Title>

              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control value={title} maxLength={65}
                  onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New properties in Pondicherry" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Message</Form.Label>
                <Form.Control as="textarea" rows={3} value={body} maxLength={240}
                  onChange={(e) => setBody(e.target.value)} placeholder="What do you want to tell users?" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Opens</Form.Label>
                <Form.Select value={target} onChange={(e) => setTarget(e.target.value)}>
                  {TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Form.Select>
                {target === '__ppcId__' && (
                  <Form.Control className="mt-2" value={ppcId}
                    onChange={(e) => setPpcId(e.target.value)} placeholder="PPC ID (e.g. 12345)" />
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Audience</Form.Label>
                <div>
                  <Form.Check inline type="radio" label="All users" name="aud"
                    checked={audType === 'all'} onChange={() => setAudType('all')} />
                  <Form.Check inline type="radio" label="Single number" name="aud"
                    checked={audType === 'number'} onChange={() => setAudType('number')} />
                  <Form.Check inline type="radio" label="Multiple numbers" name="aud"
                    checked={audType === 'numbers'} onChange={() => setAudType('numbers')} />
                </div>
                {audType === 'number' && (
                  <Form.Control className="mt-2" value={number}
                    onChange={(e) => setNumber(e.target.value)} placeholder="Phone number" />
                )}
                {audType === 'numbers' && (
                  <Form.Control as="textarea" rows={2} className="mt-2" value={numbers}
                    onChange={(e) => setNumbers(e.target.value)}
                    placeholder="Comma- or newline-separated phone numbers" />
                )}
              </Form.Group>

              {msg && <Alert variant={msg.type} className="py-2">{msg.text}</Alert>}

              <Button style={{ background: '#8BC34A', border: 'none' }} onClick={send} disabled={sending}>
                {sending ? <><Spinner size="sm" animation="border" /> Sending…</> : 'Send push'}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Live preview */}
        <Col md={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="fs-6 mb-3">Preview</Card.Title>
              <div style={{ background: '#ECECEC', borderRadius: 16, padding: 12 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: '10px 12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)', display: 'flex', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#8BC34A',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, flexShrink: 0 }}>PP</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{title || 'Pondy Property'}</div>
                    <div style={{ fontSize: 12, color: '#444', whiteSpace: 'pre-wrap' }}>
                      {body || 'Your message preview appears here.'}
                    </div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>Pondy Property • now</div>
                  </div>
                </div>
              </div>
              <div className="text-muted small mt-2">
                Tapping opens: <code>{target === '__ppcId__' ? `property ${ppcId || '…'}` : target}</code>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
