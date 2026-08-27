// Adexpress Import — read the Adexpress classified weekly and turn its
// "for rent" boxes into Rent Pondy leads.
//
// Three halves, really:
//   Issues  — find issues on adexpressonline.in, or upload a PDF you have, then
//             press Read to work through the pages.
//   Check   — every ad is shown as a picture of the printed box next to the
//             number the reader made of it. A number is only accepted once a
//             person has confirmed it against that picture. This is deliberate:
//             OCR on a newspaper scan is a guess, and a wrong contact number is
//             worse than no lead.
//   Import  — confirmed ads go through the app's normal bulk-upload path, so
//             they land in PreApproved / Pending like any other upload and the
//             batch can be reverted from the Bulk Upload screen.
//
// Pondy Properties sells, so this screen works the paper's FOR SALE boxes; the
// Rent Pondy copy of this screen works its rentals.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Alert, Badge, Button, Card, Col, Form, InputGroup, Modal, ProgressBar, Row,
  Spinner, Table,
} from 'react-bootstrap';
import { getAdminBase } from './utils/adminBase';

const API = `${(process.env.REACT_APP_API_URL || '').replace(/\/+$/, '')}/adexpress`;

const STATUS_VARIANT = {
  new: 'secondary',
  shortlisted: 'primary',
  ignored: 'dark',
  imported: 'success',
};
const DEAL_VARIANT = { rent: 'success', sale: 'info', wanted: 'warning', unknown: 'secondary' };

// How much the number can be trusted, in the reviewer's language.
const PHONE_BADGE = {
  confirmed: { bg: 'success', text: '✓ confirmed', help: 'A person checked this against the ad.' },
  verified: { bg: 'info', text: 'reads agreed', help: 'Every independent reading matched — still needs your eyes.' },
  disputed: { bg: 'danger', text: 'readings differ', help: 'The readings disagreed. Read it off the picture.' },
  unreadable: { bg: 'danger', text: 'unreadable', help: 'No number could be read from the ad.' },
  unverified: { bg: 'warning', text: 'not checked', help: 'Read once only, never double-checked.' },
};

const money = (n) => (n == null || n === '' ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);
const day = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};
const cropUrl = (id) => `${API}/ads/${id}/crop`;

export default function AdExpressImport() {
  const adminName = localStorage.getItem('adminName') || 'Admin';
  const adminRole = localStorage.getItem('adminRole') || '';

  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [ads, setAds] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null); // { type, text }
  const [job, setJob] = useState(null);
  const [cron, setCron] = useState(null);

  const [filters, setFilters] = useState({
    dealType: 'sale',
    status: 'new,shortlisted',
    edition: '',
    issueId: '',
    phoneStatus: '',
    q: '',
    minRent: '',
    maxRent: '',
  });

  const [selected, setSelected] = useState(() => new Set());
  const [checkIndex, setCheckIndex] = useState(-1); // index into `ads` being confirmed
  const [editing, setEditing] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const pollRef = useRef(null);
  const limit = 100;
  // Which editions the backend actually reads (Pondicherry only, by default).
  const editions = status?.editions?.length ? status.editions : ['Pondicherry'];

  const note = (type, text) => setMsg({ type, text });

  // ── loaders ──────────────────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    try {
      const [st, sm, cr] = await Promise.all([
        axios.get(`${API}/status`),
        axios.get(`${API}/stats`).catch(() => ({ data: null })),
        axios.get(`${API}/cron/status`).catch(() => ({ data: null })),
      ]);
      setStatus(st.data);
      setStats(sm.data);
      setCron(cr.data);
      setJob(st.data?.activeJob || null);
    } catch (e) {
      setStatus({ enabled: false });
    }
  }, []);

  const loadIssues = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/issues`, { params: { limit: 40 } });
      setIssues(res.data?.issues || []);
    } catch (e) {
      /* non-fatal */
    }
  }, []);

  const loadAds = useCallback(
    async (toPage = 1) => {
      setLoading(true);
      try {
        const params = { ...filters, page: toPage, limit };
        Object.keys(params).forEach((k) => (params[k] === '' || params[k] == null) && delete params[k]);
        const res = await axios.get(`${API}/ads`, { params });
        setAds(res.data?.ads || []);
        setTotal(res.data?.total || 0);
        setPage(toPage);
        setSelected(new Set());
      } catch (e) {
        note('danger', e.response?.data?.message || 'Could not load the staged ads.');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    loadStatus();
    loadIssues();
  }, [loadStatus, loadIssues]);

  useEffect(() => {
    loadAds(1);
  }, [loadAds]);

  // While a read is running, poll it so the admin can watch progress.
  useEffect(() => {
    if (!job || job.status !== 'running') {
      if (pollRef.current) clearInterval(pollRef.current);
      return undefined;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/status`);
        const active = res.data?.activeJob;
        if (active) {
          setJob(active);
          return;
        }
        clearInterval(pollRef.current);
        let outcome = null;
        if (job.issueId) {
          outcome = await axios.get(`${API}/issues/${job.issueId}`).then((r) => r.data?.issue).catch(() => null);
        }
        setJob(null);
        if (outcome && outcome.status === 'failed') {
          note('danger', outcome.error || 'Reading this issue failed.');
        } else if (outcome) {
          note(
            'success',
            `Read ${outcome.issueLabel || outcome.issueKey}: ${outcome.rentAdsFound || 0} sale ads ` +
              `out of ${outcome.adsFound || 0} property ads. ${outcome.phonesVerified || 0} numbers ` +
              'read the same way every time — check them against the ad before importing.'
          );
        } else {
          note('success', 'Finished reading the issue.');
        }
        loadIssues();
        loadStatus();
        loadAds(1);
      } catch (e) {
        /* keep polling */
      }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [job, loadAds, loadIssues, loadStatus]);

  // ── issue actions ────────────────────────────────────────────────────────
  const discover = async (which) => {
    setBusy('discover');
    try {
      const res = await axios.post(`${API}/discover`, { editions: which, limit: 12 });
      note('success', res.data?.message || 'Issue list refreshed.');
      loadIssues();
    } catch (e) {
      note('danger', e.response?.data?.message || 'Could not reach the Adexpress site.');
    } finally {
      setBusy('');
    }
  };

  const readIssue = async (issue) => {
    setBusy(`read-${issue._id}`);
    try {
      const res = await axios.post(`${API}/issues/${issue._id}/process`, { by: adminName });
      note('info', res.data?.message || 'Reading started.');
      setJob({
        status: 'running',
        phase: 'starting',
        issueId: issue._id,
        issueLabel: issue.issueLabel,
        boxesRead: 0,
        boxesTotal: 0,
      });
    } catch (e) {
      note('danger', e.response?.data?.message || 'Could not start reading this issue.');
    } finally {
      setBusy('');
    }
  };

  const runCronNow = async () => {
    setBusy('cron');
    try {
      const res = await axios.post(`${API}/cron/run-now`, { by: adminName });
      note('info', res.data?.message || 'Started.');
      // The nightly job reads an issue exactly like the Read button does, so
      // the same progress bar picks it up.
      setJob({ status: 'running', phase: 'looking for the newest issue', boxesRead: 0, boxesTotal: 0 });
    } catch (e) {
      note('danger', e.response?.data?.message || 'Could not start the run.');
    } finally {
      setBusy('');
    }
  };

  const removeIssue = async (issue) => {
    if (!window.confirm(`Remove "${issue.issueLabel || issue.issueKey}" and its staged ads?`)) return;
    setBusy(`del-${issue._id}`);
    try {
      const res = await axios.delete(`${API}/issues/${issue._id}`);
      note('success', res.data?.message || 'Issue removed.');
      loadIssues();
      loadAds(1);
    } catch (e) {
      note('danger', e.response?.data?.message || 'Could not remove the issue.');
    } finally {
      setBusy('');
    }
  };

  const uploadIssue = async (form) => {
    setBusy('upload');
    try {
      const res = await axios.post(`${API}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      note('success', res.data?.message || 'Issue uploaded.');
      setShowUpload(false);
      loadIssues();
    } catch (e) {
      note('danger', e.response?.data?.message || 'Upload failed.');
    } finally {
      setBusy('');
    }
  };

  // ── ad actions ───────────────────────────────────────────────────────────
  const selectable = useMemo(() => ads.filter((a) => a.status !== 'imported'), [ads]);
  const readyCount = useMemo(
    () => [...selected].filter((id) => ads.find((a) => a._id === id)?.importable).length,
    [selected, ads]
  );
  const firstUnchecked = useMemo(
    () => ads.findIndex((a) => a.status !== 'imported' && a.phoneStatus !== 'confirmed'),
    [ads]
  );

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === selectable.length ? new Set() : new Set(selectable.map((a) => a._id))
    );

  const selectConfirmed = () =>
    setSelected(new Set(ads.filter((a) => a.importable).map((a) => a._id)));

  const setStatusFor = async (ids, next) => {
    if (!ids.length) return;
    setBusy('status');
    try {
      const res = await axios.post(`${API}/ads/status`, { ids, status: next });
      note('success', res.data?.message || 'Updated.');
      loadAds(page);
      loadStatus();
    } catch (e) {
      note('danger', e.response?.data?.message || 'Could not update those ads.');
    } finally {
      setBusy('');
    }
  };

  // The confirm step: the number the reviewer types is what gets stored.
  const confirmPhone = async (ad, phone, advance) => {
    setBusy('confirm');
    try {
      const res = await axios.post(`${API}/ads/${ad._id}/confirm`, { phone, by: adminName });
      setAds((prev) => prev.map((a) => (a._id === ad._id ? { ...a, ...res.data.ad } : a)));
      loadStatus();
      if (advance) {
        const next = ads.findIndex(
          (a, i) => i > checkIndex && a.status !== 'imported' && a.phoneStatus !== 'confirmed'
        );
        if (next >= 0) setCheckIndex(next);
        else {
          setCheckIndex(-1);
          note('success', 'Every ad on this page has a confirmed number.');
        }
      } else {
        setCheckIndex(-1);
      }
    } catch (e) {
      note('danger', e.response?.data?.message || 'Could not confirm that number.');
    } finally {
      setBusy('');
    }
  };

  const saveEdit = async (values) => {
    setBusy('edit');
    try {
      await axios.patch(`${API}/ads/${editing._id}`, { ...values, by: adminName });
      note('success', 'Ad updated.');
      setEditing(null);
      loadAds(page);
    } catch (e) {
      note('danger', e.response?.data?.message || 'Could not save the change.');
    } finally {
      setBusy('');
    }
  };

  const runImport = async (options) => {
    setBusy('import');
    try {
      const res = await axios.post(`${API}/import`, {
        ids: [...selected],
        base: options.base,
        defaults: options.defaults,
        skipUnconfirmed: options.skipUnconfirmed,
        addedBy: adminName,
        addedByRole: adminRole,
      });
      note('success', res.data?.message || 'Imported.');
      setShowImport(false);
      loadAds(page);
      loadStatus();
    } catch (e) {
      note('danger', e.response?.data?.message || 'Import failed.');
    } finally {
      setBusy('');
    }
  };

  const exportUrl = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v != null) params.append(k, v);
    });
    return `${API}/export?${params.toString()}`;
  };

  const pages = Math.max(1, Math.ceil(total / limit));
  const unchecked = ads.filter((a) => a.status !== 'imported' && a.phoneStatus !== 'confirmed').length;

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 className="mb-0">📰 Adexpress Import</h4>
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-secondary" onClick={() => { loadStatus(); loadIssues(); loadAds(page); }}>
            Reload
          </Button>
          <Button size="sm" variant="outline-success" href={exportUrl()}>
            Export Excel
          </Button>
        </div>
      </div>

      {msg && (
        <Alert variant={msg.type} dismissible onClose={() => setMsg(null)} className="py-2">
          {msg.text}
        </Alert>
      )}

      {status && !status.enabled && (
        <Alert variant="warning" className="py-2">
          The importer is switched off on the server (ADEXPRESS_ENABLED).
        </Alert>
      )}
      {status && status.enabled && !status.apiKeyConfigured && (
        <Alert variant="warning" className="py-2">
          OPENAI_API_KEY is not set on the server, so scanned pages cannot be read yet.
        </Alert>
      )}

      <Row className="g-2 mb-3">
        <Col xs={6} md={3}>
          <Card body className="text-center">
            <div className="h4 mb-0">{stats?.issues ?? 0}</div>
            <small className="text-muted">Issues staged</small>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card body className="text-center">
            <div className="h4 mb-0">{stats?.dealAds?.new ?? 0}</div>
            <small className="text-muted">Sale ads to check</small>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card body className="text-center">
            <div className="h4 mb-0 text-primary">{stats?.readyToImport ?? 0}</div>
            <small className="text-muted">Confirmed, ready</small>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card body className="text-center">
            <div className="h4 mb-0 text-success">{stats?.ads?.imported ?? 0}</div>
            <small className="text-muted">Imported</small>
          </Card>
        </Col>
      </Row>

      {job && job.status === 'running' && (
        <Card className="mb-3 border-primary">
          <Card.Body className="py-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <strong>
                <Spinner animation="border" size="sm" className="me-2" />
                Reading {job.issueLabel || job.issueKey} — {job.phase}
              </strong>
              <small className="text-muted">
                {job.boxesTotal
                  ? `${job.boxesRead}/${job.boxesTotal} ads`
                  : `${job.tilesDone}/${job.tilesTotal || '…'} crops`}
                {' · '}page {job.pageNo || 0}/{job.pageCount || '?'}
              </small>
            </div>
            <ProgressBar
              now={job.boxesTotal ? (job.boxesRead / job.boxesTotal) * 100
                : job.tilesTotal ? (job.tilesDone / job.tilesTotal) * 100 : 5}
              animated
              style={{ height: 8 }}
            />
          </Card.Body>
        </Card>
      )}

      {/* nightly job */}
      {cron && (
        <Card className="mb-3">
          <Card.Body className="py-2">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="small">
                <strong>Nightly pickup</strong>{' '}
                {cron.armed ? (
                  <Badge bg="success">on</Badge>
                ) : (
                  <Badge bg="secondary">{cron.enabled ? 'not armed' : 'off'}</Badge>
                )}{' '}
                <span className="text-muted">
                  {cron.cron} ({cron.timezone}) · newest issue → sale ads →{' '}
                  {cron.autoPublish
                    ? `PreApproved (numbers ${cron.minPhoneStatus === 'confirmed' ? 'confirmed by a person' : 'every reading agreed on'})`
                    : 'staged only, nothing published'}
                </span>
              </div>
              <Button size="sm" variant="outline-primary" disabled={!!job || busy === 'cron'}
                onClick={runCronNow}>
                {busy === 'cron' ? 'Starting…' : 'Run now'}
              </Button>
            </div>
            {(cron.lastRuns || []).length > 0 && (
              <div className="small text-muted mt-1">
                Last runs:{' '}
                {cron.lastRuns.slice(0, 3).map((r, i) => (
                  <span key={i} className="me-3">
                    {day(r.at)}{' '}
                    {r.skipped
                      ? `— ${r.skipped}`
                      : r.ok
                        ? `— ${r.issueLabel || r.issueKey || 'issue'}: ${r.published || 0} published, ${r.heldForReview || 0} held`
                        : `— failed: ${r.error}`}
                  </span>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* issues */}
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span>Issues</span>
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-primary" disabled={busy === 'discover'}
              onClick={() => discover(editions)}>
              {busy === 'discover' ? 'Checking…' : `Check ${editions.join(' & ')}`}
            </Button>
            <Button size="sm" variant="primary" onClick={() => setShowUpload(true)}>
              Upload PDF
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0" style={{ maxHeight: 300, overflowY: 'auto' }}>
          <Table hover responsive size="sm" className="mb-0 align-middle">
            <thead>
              <tr>
                <th>Issue</th>{editions.length > 1 && <th>Edition</th>}<th>Date</th><th>Status</th>
                <th className="text-end">Sale ads</th><th className="text-end">Agreed</th><th>Source</th><th />
              </tr>
            </thead>
            <tbody>
              {issues.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted py-3">
                  No issues yet — press “Check {editions.join(' & ')}” or upload a PDF.
                </td></tr>
              )}
              {issues.map((i) => (
                <tr key={i._id}>
                  <td>
                    {i.postLink ? (
                      <a href={i.postLink} target="_blank" rel="noreferrer">{i.issueLabel || i.issueKey}</a>
                    ) : (i.issueLabel || i.issueKey)}
                    {i.error && <div className="small text-warning">{i.error}</div>}
                  </td>
                  {editions.length > 1 && <td>{i.edition}</td>}
                  <td>{day(i.issueDate)}</td>
                  <td>
                    <Badge bg={i.status === 'processed' ? 'success' : i.status === 'failed' ? 'danger' : 'secondary'}>
                      {i.status}
                    </Badge>
                  </td>
                  <td className="text-end">{i.rentAdsFound || 0}</td>
                  <td className="text-end" title="Numbers every reading agreed on">
                    {i.phonesVerified || 0}
                    {i.phonesDisputed > 0 && <span className="text-danger"> / {i.phonesDisputed} differ</span>}
                  </td>
                  <td>
                    {i.source === 'upload'
                      ? <Badge bg="info">uploaded</Badge>
                      : i.pdfUrl
                        ? <Badge bg="light" text="dark">public PDF</Badge>
                        : <Badge bg="warning" text="dark">subscriber only</Badge>}
                  </td>
                  <td className="text-end text-nowrap">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-1"
                      disabled={!!job || busy.startsWith('read') || (!i.pdfUrl && !i.pdfAvailable)}
                      onClick={() => readIssue(i)}
                      title={!i.pdfUrl && !i.pdfAvailable
                        ? 'This issue is subscriber-only — upload the PDF to read it.'
                        : 'Read this issue'}
                    >
                      {i.status === 'processed' ? 'Re-read' : 'Read'}
                    </Button>
                    <Button size="sm" variant="outline-danger" disabled={busy === `del-${i._id}`}
                      onClick={() => removeIssue(i)}>
                      ✕
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* filters */}
      <Card className="mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-end">
            <Col xs={6} md={2}>
              <Form.Label className="small mb-1">Deal</Form.Label>
              <Form.Select size="sm" value={filters.dealType}
                onChange={(e) => setFilters({ ...filters, dealType: e.target.value })}>
                <option value="sale">For sale</option>
                <option value="rent">For rent</option>
                <option value="wanted">Wanted</option>
                <option value="">All</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Label className="small mb-1">Status</Form.Label>
              <Form.Select size="sm" value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="new,shortlisted">To review</option>
                <option value="new">New</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="ignored">Ignored</option>
                <option value="imported">Imported</option>
                <option value="">All</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Label className="small mb-1">Number</Form.Label>
              <Form.Select size="sm" value={filters.phoneStatus}
                onChange={(e) => setFilters({ ...filters, phoneStatus: e.target.value })}>
                <option value="">Any</option>
                <option value="confirmed">Confirmed</option>
                <option value="verified">Reads agreed</option>
                <option value="disputed,unreadable">Needs a person</option>
                <option value="unverified">Not double-checked</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Label className="small mb-1">Issue</Form.Label>
              <Form.Select size="sm" value={filters.issueId}
                onChange={(e) => setFilters({ ...filters, issueId: e.target.value })}>
                <option value="">All issues</option>
                {issues.map((i) => (
                  <option key={i._id} value={i._id}>{i.issueLabel || i.issueKey}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Label className="small mb-1">Price between</Form.Label>
              <InputGroup size="sm">
                <Form.Control placeholder="min" value={filters.minRent}
                  onChange={(e) => setFilters({ ...filters, minRent: e.target.value })} />
                <Form.Control placeholder="max" value={filters.maxRent}
                  onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })} />
              </InputGroup>
            </Col>
            <Col xs={12} md={2}>
              <Form.Label className="small mb-1">Search</Form.Label>
              <Form.Control size="sm" placeholder="phone, area, text…" value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* bulk bar */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <div className="small text-muted">
          {total} ads
          {unchecked > 0 && <> · <strong className="text-warning">{unchecked} still need their number checked</strong></>}
          {selected.size > 0 && <> · {selected.size} selected, {readyCount} confirmed</>}
        </div>
        <div className="d-flex gap-2">
          <Button size="sm" variant="warning" disabled={firstUnchecked < 0}
            onClick={() => setCheckIndex(firstUnchecked)}>
            Check numbers{unchecked ? ` (${unchecked})` : ''}
          </Button>
          <Button size="sm" variant="outline-primary" disabled={!selected.size || busy === 'status'}
            onClick={() => setStatusFor([...selected], 'shortlisted')}>
            Shortlist
          </Button>
          <Button size="sm" variant="outline-dark" disabled={!selected.size || busy === 'status'}
            onClick={() => setStatusFor([...selected], 'ignored')}>
            Ignore
          </Button>
          <Button size="sm" variant="outline-success" onClick={selectConfirmed}>
            Select confirmed
          </Button>
          <Button size="sm" variant="success" disabled={!readyCount}
            onClick={() => setShowImport(true)}>
            Import {readyCount ? `(${readyCount})` : ''}
          </Button>
        </div>
      </div>

      {/* ads */}
      <Card>
        <Card.Body className="p-0">
          {loading && <div className="text-center p-4"><Spinner animation="border" /></div>}
          {!loading && (
            <Table hover responsive size="sm" className="mb-0 align-middle">
              <thead>
                <tr>
                  <th style={{ width: 34 }}>
                    <Form.Check
                      type="checkbox"
                      checked={selectable.length > 0 && selected.size === selectable.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>The printed ad</th><th>Number</th><th>What it says</th><th>Type</th>
                  <th className="text-end">Price</th><th>Area</th><th>Issue</th><th />
                </tr>
              </thead>
              <tbody>
                {ads.length === 0 && (
                  <tr><td colSpan={9} className="text-center text-muted py-4">
                    Nothing staged for these filters yet.
                  </td></tr>
                )}
                {ads.map((a, i) => {
                  const badge = PHONE_BADGE[a.phoneStatus] || PHONE_BADGE.unverified;
                  return (
                    <tr key={a._id} className={a.phoneStatus === 'confirmed' ? undefined : 'table-warning'}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          disabled={a.status === 'imported'}
                          checked={selected.has(a._id)}
                          onChange={() => toggle(a._id)}
                        />
                      </td>
                      <td style={{ width: 190 }}>
                        {a.hasCrop ? (
                          <img
                            src={cropUrl(a._id)}
                            alt="the printed ad"
                            title="Click to check the number against the ad"
                            onClick={() => setCheckIndex(i)}
                            style={{ width: 180, cursor: 'zoom-in', border: '1px solid #ddd', borderRadius: 3 }}
                          />
                        ) : (
                          <span className="small text-muted">no picture</span>
                        )}
                      </td>
                      <td className="text-nowrap">
                        <strong style={{ fontSize: '1.05rem' }}>
                          {a.primaryPhone || <span className="text-danger">not read</span>}
                        </strong>
                        <div><Badge bg={badge.bg} title={badge.help}>{badge.text}</Badge></div>
                        {a.phoneStatus === 'disputed' && (
                          <div className="small text-danger">
                            {(a.phoneCandidates || []).map((c) => `${c.digits} (${c.votes}/${c.of})`).join(', ')}
                          </div>
                        )}
                        {a.existsInApp && <div><Badge bg="secondary">already in app</Badge></div>}
                      </td>
                      <td style={{ minWidth: 220, maxWidth: 340 }}>
                        <div className="fw-semibold">{a.headline || '—'}</div>
                        <div className="small text-muted text-truncate" title={a.rawText}>{a.rawText}</div>
                      </td>
                      <td className="text-nowrap">
                        <Badge bg={DEAL_VARIANT[a.dealType] || 'secondary'}>{a.dealType}</Badge>
                        <div className="small">{a.propertyType || '—'}</div>
                        <div className="small text-muted">{a.bedrooms ? `${a.bedrooms} BHK` : ''}</div>
                      </td>
                      <td className="text-end text-nowrap">
                        {money(a.rentAmount)}
                        {a.deposit != null && <div className="small text-muted">dep {money(a.deposit)}</div>}
                      </td>
                      <td>
                        {a.locality || '—'}
                        {a.floorNo && <div className="small text-muted">floor {a.floorNo}</div>}
                      </td>
                      <td className="small text-nowrap">
                        {a.issueLabel || '—'}
                        <div className="text-muted">p{a.pageNo} · {day(a.issueDate)}</div>
                      </td>
                      <td className="text-end text-nowrap">
                        <Button size="sm" variant={a.phoneStatus === 'confirmed' ? 'outline-secondary' : 'warning'}
                          className="mb-1" disabled={a.status === 'imported'} onClick={() => setCheckIndex(i)}>
                          {a.phoneStatus === 'confirmed' ? 'Re-check' : 'Check'}
                        </Button>
                        <br />
                        <Button size="sm" variant="outline-secondary"
                          disabled={a.status === 'imported'} onClick={() => setEditing(a)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {pages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <Button size="sm" variant="outline-secondary" disabled={page <= 1} onClick={() => loadAds(page - 1)}>
            Previous
          </Button>
          <span className="small align-self-center">Page {page} of {pages}</span>
          <Button size="sm" variant="outline-secondary" disabled={page >= pages} onClick={() => loadAds(page + 1)}>
            Next
          </Button>
        </div>
      )}

      <CheckModal
        ad={checkIndex >= 0 ? ads[checkIndex] : null}
        position={checkIndex >= 0 ? `${checkIndex + 1} of ${ads.length}` : ''}
        busy={busy === 'confirm'}
        onClose={() => setCheckIndex(-1)}
        onConfirm={confirmPhone}
        onSkip={() => {
          const next = ads.findIndex((a, i) => i > checkIndex && a.phoneStatus !== 'confirmed');
          setCheckIndex(next >= 0 ? next : -1);
        }}
      />
      <UploadModal show={showUpload} editions={editions} busy={busy === 'upload'}
        onClose={() => setShowUpload(false)} onSubmit={uploadIssue} />
      <EditModal ad={editing} busy={busy === 'edit'} onClose={() => setEditing(null)} onSave={saveEdit} />
      <ImportModal
        show={showImport}
        count={readyCount}
        blocked={selected.size - readyCount}
        busy={busy === 'import'}
        onClose={() => setShowImport(false)}
        onSubmit={runImport}
      />
    </div>
  );
}

/* ── check a number against the printed ad ───────────────────────────────── */
function CheckModal({ ad, position, busy, onClose, onConfirm, onSkip }) {
  const [phone, setPhone] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!ad) return;
    setPhone(ad.primaryPhone || '');
    // Let the reviewer type straight away — this screen gets used in runs.
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [ad]);

  if (!ad) return null;

  const digits = phone.replace(/\D/g, '').slice(-10);
  const valid = /^[6-9]\d{9}$/.test(digits);
  const badge = PHONE_BADGE[ad.phoneStatus] || PHONE_BADGE.unverified;

  return (
    <Modal show onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          Check the number against the ad <small className="text-muted">· {position}</small>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted">
          Read the phone number off the picture and type it below. What you type is what gets saved —
          the reader’s attempt is only a suggestion.
        </p>

        <div className="text-center mb-3" style={{ background: '#f6f6f6', padding: 8, borderRadius: 4 }}>
          {ad.hasCrop ? (
            <img
              src={cropUrl(ad._id)}
              alt="the printed advertisement"
              style={{ maxWidth: '100%', maxHeight: 420, border: '1px solid #ccc', background: '#fff' }}
            />
          ) : (
            <div className="text-muted py-4">
              No picture was saved for this ad — re-read the issue to make one.
              <div className="small">Text read: {ad.rawText}</div>
            </div>
          )}
        </div>

        <Row className="g-2 align-items-end">
          <Col md={5}>
            <Form.Label className="small mb-1">Number as printed</Form.Label>
            <Form.Control
              ref={inputRef}
              value={phone}
              maxLength={14}
              inputMode="numeric"
              isInvalid={!!phone && !valid}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && valid && !busy) onConfirm(ad, digits, true);
              }}
              style={{ fontSize: '1.3rem', letterSpacing: '0.06em' }}
            />
            <Form.Control.Feedback type="invalid">
              A mobile number is 10 digits starting 6, 7, 8 or 9.
            </Form.Control.Feedback>
          </Col>
          <Col md={7}>
            <div className="small text-muted mb-1">
              What the reader made of it — <Badge bg={badge.bg}>{badge.text}</Badge>
            </div>
            <div className="d-flex flex-wrap gap-1">
              {(ad.phoneCandidates || []).length === 0 && (
                <span className="small text-muted">nothing legible</span>
              )}
              {(ad.phoneCandidates || []).map((c) => (
                <Button
                  key={c.digits}
                  size="sm"
                  variant={c.digits === digits ? 'primary' : 'outline-secondary'}
                  onClick={() => setPhone(c.digits)}
                  title={`${c.votes} of ${c.of} readings said this`}
                >
                  {c.digits} <span className="opacity-75">({c.votes}/{c.of})</span>
                </Button>
              ))}
              {(ad.otherNumbers || []).map((n) => (
                <Button key={n} size="sm" variant="outline-secondary" onClick={() => setPhone(n)}>
                  {n} <span className="opacity-75">(landline?)</span>
                </Button>
              ))}
            </div>
          </Col>
        </Row>

        <hr />
        <div className="small">
          <strong>{ad.headline}</strong>
          <div className="text-muted">{ad.rawText}</div>
          <div className="text-muted mt-1">
            {ad.edition} · {ad.issueLabel} · page {ad.pageNo}
            {ad.existsInApp && <> · <Badge bg="secondary">this number is already in the app</Badge></>}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={onSkip}>Skip</Button>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" disabled={!valid || busy} onClick={() => onConfirm(ad, digits, false)}>
            Confirm
          </Button>
          <Button variant="success" disabled={!valid || busy} onClick={() => onConfirm(ad, digits, true)}>
            {busy ? 'Saving…' : 'Confirm & next'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

/* ── upload an issue PDF ─────────────────────────────────────────────────── */
function UploadModal({ show, editions = ['Pondicherry'], busy, onClose, onSubmit }) {
  const [edition, setEdition] = useState(editions[0]);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [issueLabel, setIssueLabel] = useState('');
  const [file, setFile] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append('pdf', file);
    form.append('edition', edition);
    form.append('issueDate', issueDate);
    form.append('issueLabel', issueLabel);
    onSubmit(form);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title>Upload an issue PDF</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="small text-muted">
            Use this for issues the publisher keeps for subscribers — upload the PDF you already have
            and the reader will work through it the same way.
          </p>
          <Form.Group className="mb-2">
            <Form.Label className="small">Edition</Form.Label>
            <Form.Select value={edition} onChange={(e) => setEdition(e.target.value)}
              disabled={editions.length < 2}>
              {editions.map((e) => <option key={e}>{e}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small">Issue date</Form.Label>
            <Form.Control type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small">Issue name (optional)</Form.Label>
            <Form.Control placeholder="Volume 41, Issue 19" value={issueLabel}
              onChange={(e) => setIssueLabel(e.target.value)} />
          </Form.Group>
          <Form.Group>
            <Form.Label className="small">PDF file</Form.Label>
            <Form.Control type="file" accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!file || busy}>
            {busy ? 'Uploading…' : 'Upload'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

/* ── correct the rest of one staged ad ───────────────────────────────────── */
function EditModal({ ad, busy, onClose, onSave }) {
  const [values, setValues] = useState({});
  useEffect(() => {
    if (!ad) return;
    setValues({
      dealType: ad.dealType || 'rent',
      rentAmount: ad.rentAmount ?? '',
      deposit: ad.deposit ?? '',
      bedrooms: ad.bedrooms || '',
      propertyMode: ad.propertyMode || 'Residential',
      propertyType: ad.propertyType || '',
      locality: ad.locality || '',
      address: ad.address || '',
      floorNo: ad.floorNo || '',
      areaSqft: ad.areaSqft ?? '',
      note: ad.note || '',
    });
  }, [ad]);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  return (
    <Modal show={!!ad} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton><Modal.Title>Correct this ad</Modal.Title></Modal.Header>
      <Modal.Body>
        {ad && (
          <>
            <div className="d-flex gap-3 mb-3">
              {ad.hasCrop && (
                <img src={cropUrl(ad._id)} alt="the printed ad"
                  style={{ width: 260, border: '1px solid #ddd', alignSelf: 'flex-start' }} />
              )}
              <div className="small">
                <div className="fw-semibold">{ad.headline}</div>
                <div className="text-muted">{ad.rawText}</div>
                <div className="text-muted mt-1">{ad.edition} · {ad.issueLabel} · page {ad.pageNo}</div>
                <div className="mt-2">
                  Number: <strong>{ad.primaryPhone || '—'}</strong>{' '}
                  <Badge bg={(PHONE_BADGE[ad.phoneStatus] || PHONE_BADGE.unverified).bg}>
                    {(PHONE_BADGE[ad.phoneStatus] || PHONE_BADGE.unverified).text}
                  </Badge>
                  <div className="text-muted">Use “Check” on the row to change the number.</div>
                </div>
              </div>
            </div>
            <Row className="g-2">
              <Col md={4}>
                <Form.Label className="small mb-1">Deal</Form.Label>
                <Form.Select value={values.dealType} onChange={set('dealType')}>
                  <option value="rent">rent</option>
                  <option value="sale">sale</option>
                  <option value="wanted">wanted</option>
                  <option value="unknown">unknown</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small mb-1">Bedrooms</Form.Label>
                <Form.Control value={values.bedrooms} onChange={set('bedrooms')} placeholder="2" />
              </Col>
              <Col md={4}>
                <Form.Label className="small mb-1">Price</Form.Label>
                <Form.Control value={values.rentAmount} onChange={set('rentAmount')} placeholder="18000" />
              </Col>
              <Col md={4}>
                <Form.Label className="small mb-1">Deposit</Form.Label>
                <Form.Control value={values.deposit} onChange={set('deposit')} />
              </Col>
              <Col md={4}>
                <Form.Label className="small mb-1">Area (sq.ft)</Form.Label>
                <Form.Control value={values.areaSqft} onChange={set('areaSqft')} />
              </Col>
              <Col md={4}>
                <Form.Label className="small mb-1">Floor</Form.Label>
                <Form.Control value={values.floorNo} onChange={set('floorNo')} />
              </Col>
              <Col md={4}>
                <Form.Label className="small mb-1">Mode</Form.Label>
                <Form.Select value={values.propertyMode} onChange={set('propertyMode')}>
                  <option>Residential</option>
                  <option>Commercial</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small mb-1">Property type</Form.Label>
                <Form.Control value={values.propertyType} onChange={set('propertyType')} />
              </Col>
              <Col md={4}>
                <Form.Label className="small mb-1">Area / nagar</Form.Label>
                <Form.Control value={values.locality} onChange={set('locality')} />
              </Col>
              <Col md={8}>
                <Form.Label className="small mb-1">Address</Form.Label>
                <Form.Control value={values.address} onChange={set('address')} />
              </Col>
              <Col md={4}>
                <Form.Label className="small mb-1">Note</Form.Label>
                <Form.Control value={values.note} onChange={set('note')} placeholder="called, no answer…" />
              </Col>
            </Row>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={busy} onClick={() => onSave(values)}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/* ── import into the live app ────────────────────────────────────────────── */
function ImportModal({ show, count, blocked, busy, onClose, onSubmit }) {
  const [base, setBase] = useState(() => (getAdminBase() === 'CH' ? 'CH' : 'PY'));
  const [salesType, setSalesType] = useState('');
  const [postedBy, setPostedBy] = useState('');

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title>Import {count} ads</Modal.Title></Modal.Header>
      <Modal.Body>
        {blocked > 0 && (
          <Alert variant="warning" className="py-2 small">
            {blocked} selected {blocked === 1 ? 'ad has' : 'ads have'} no confirmed number and will be
            left behind. Check them first if you want them.
          </Alert>
        )}
        <p className="small text-muted">
          These rows go through the app’s normal bulk-upload path. Rows with every mandatory field
          land in <strong>PreApproved</strong>; the rest drop to <strong>Pending</strong> for staff to
          finish. The whole batch can be reverted from the Bulk Upload screen.
        </p>
        <Form.Group className="mb-2">
          <Form.Label className="small">City section</Form.Label>
          <Form.Select value={base} onChange={(e) => setBase(e.target.value)}>
            <option value="PY">Pondicherry (PY)</option>
            <option value="CH">Chennai (CH)</option>
          </Form.Select>
        </Form.Group>
        <hr />
        <p className="small text-muted mb-2">
          A newspaper ad never states these, so fill them in only if you want the rows to count as
          complete. Leave blank to send them to Pending.
        </p>
        <Row className="g-2">
          <Col md={6}>
            <Form.Label className="small mb-1">Sales type</Form.Label>
            <Form.Control value={salesType} onChange={(e) => setSalesType(e.target.value)} placeholder="Direct / Through agent" />
          </Col>
          <Col md={6}>
            <Form.Label className="small mb-1">Posted by</Form.Label>
            <Form.Control value={postedBy} onChange={(e) => setPostedBy(e.target.value)} placeholder="Owner / Broker" />
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="success"
          disabled={busy || !count}
          onClick={() =>
            onSubmit({ base, skipUnconfirmed: true, defaults: { salesType, postedBy } })
          }
        >
          {busy ? 'Importing…' : `Import ${count}`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
