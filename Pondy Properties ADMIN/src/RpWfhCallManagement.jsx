import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './RpWfhCallManagement.css';

const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
const LS_TOKEN = 'rcm_rpwfh_token';
const STATUS_OPTIONS = ['Ring', 'Not Exist', 'Not Interested', 'Interested'];
const BHK_OPTIONS = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5+BHK'];
const EMPTY_INTERESTED = {
  rent: '',
  advance: '',
  bhk: '',
  floorNo: '',
  carPark: '',
  availableFrom: '',
};

/* ──────────────────────────────────────────────────────────────
   API helper
   ────────────────────────────────────────────────────────────── */
async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const url = `${API_URL}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (_netErr) {
    const err = new Error('Network error — check your connection and try again.');
    err.status = 0;
    throw err;
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch (_) {
    payload = null;
  }

  if (!res.ok) {
    const msg =
      (payload && (payload.error || payload.message)) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload || {};
}

/* ──────────────────────────────────────────────────────────────
   Toast
   ────────────────────────────────────────────────────────────── */
function useToast() {
  const [msg, setMsg] = useState('');
  const [type, setType] = useState('success');
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  const push = useCallback((message, kind = 'success') => {
    setMsg(String(message || ''));
    setType(kind === 'error' ? 'error' : 'success');
    setShow(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), 2600);
  }, []);

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  const node = (
    <div className={`rcm-toast ${show ? 'show' : ''} ${type}`} role="status">
      {msg}
    </div>
  );
  return { push, node };
}

/* ──────────────────────────────────────────────────────────────
   Date helpers
   ────────────────────────────────────────────────────────────── */
function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function yesterdayYMD() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function formatLongDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${dd}/${mm}/${yyyy}, ${String(h).padStart(2, '0')}:${m}:${s} ${ampm}`;
}

/* ══════════════════════════════════════════════════════════════
   ROOT COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function RpWfhCallManagement() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const { push, node: toastNode } = useToast();

  useEffect(() => {
    document.title = 'Call Management | PPC';
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(LS_TOKEN);
    if (!token) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const me = await apiRequest('/rcm/me', { token });
        setSession({ token, username: me.username, role: me.role });
      } catch (_err) {
        localStorage.removeItem(LS_TOKEN);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const handleLogout = useCallback(async () => {
    if (session?.token) {
      try {
        await apiRequest('/rcm/logout', {
          method: 'POST',
          token: session.token,
        });
      } catch (_) {
        // ignore
      }
    }
    localStorage.removeItem(LS_TOKEN);
    setSession(null);
  }, [session]);

  if (checking) {
    return (
      <div className="rcm-root">
        <div className="rcm-login-wrap">
          <div className="rcm-login-card">
            <div className="rcm-logo">📞 PPC</div>
            <div className="rcm-subtitle">Connecting…</div>
          </div>
        </div>
        {toastNode}
      </div>
    );
  }

  return (
    <div className="rcm-root">
      {session ? (
        <DashboardScreen
          session={session}
          onLogout={handleLogout}
          toast={push}
        />
      ) : (
        <LoginScreen onLogin={setSession} toast={push} />
      )}
      {toastNode}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LOGIN SCREEN
   ══════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin, toast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!username.trim() || !password) {
      setErr('Please enter username and password.');
      return;
    }
    setBusy(true);
    try {
      const data = await apiRequest('/rcm/login', {
        method: 'POST',
        body: { username: username.trim(), password },
      });
      localStorage.setItem(LS_TOKEN, data.token);
      onLogin({ token: data.token, username: data.username, role: data.role });
      toast(`Welcome, ${data.username}`, 'success');
    } catch (e2) {
      setErr(e2.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rcm-login-wrap">
      <form className="rcm-login-card" onSubmit={onSubmit}>
        <div className="rcm-logo">📞 PPC</div>
        <div className="rcm-subtitle">Call Management — Staff Login</div>

        <label className="rcm-label" htmlFor="rcm-username">Username</label>
        <input
          id="rcm-username"
          className="rcm-field"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={busy}
          placeholder="username"
        />

        <label className="rcm-label" htmlFor="rcm-password">Password</label>
        <input
          id="rcm-password"
          className="rcm-field"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          placeholder="••••"
        />

        {err ? <div className="rcm-login-error">{err}</div> : null}

        <button
          className="rcm-btn rcm-btn-primary"
          type="submit"
          disabled={busy}
        >
          {busy ? 'Logging in…' : 'Login'}
        </button>

        <div className="rcm-hint">
          Default seed: <strong>sandhoshi / 1234</strong> &nbsp;|&nbsp;{' '}
          <strong>admin / admin</strong>
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD SCREEN
   ══════════════════════════════════════════════════════════════ */
function DashboardScreen({ session, onLogout, toast }) {
  // Date range state
  const initial = useMemo(() => ({ from: todayYMD(), to: todayYMD() }), []);
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const [applied, setApplied] = useState(initial);

  // Calls
  const [calls, setCalls] = useState([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  // Call section
  const [mode, setMode] = useState('Manual');
  const [mobile, setMobile] = useState('');
  const [autoNumberId, setAutoNumberId] = useState(null);
  const [autoQueueEmpty, setAutoQueueEmpty] = useState(false);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [callBusy, setCallBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [callExtension, setCallExtension] = useState(true);

  // Modal state
  const [interestedOpen, setInterestedOpen] = useState(false);
  const [interestedSaving, setInterestedSaving] = useState(false);
  const [interestedForm, setInterestedForm] = useState(EMPTY_INTERESTED);

  const [viewerCall, setViewerCall] = useState(null);

  const handleAuthFail = useCallback(() => {
    toast('Session expired, please log in again.', 'error');
    localStorage.removeItem(LS_TOKEN);
    onLogout();
  }, [onLogout, toast]);

  const loadCalls = useCallback(
    async (range = applied) => {
      setLoadingCalls(true);
      try {
        const qs = new URLSearchParams({
          from: range.from,
          to: range.to,
        }).toString();
        const data = await apiRequest(`/rcm/calls?${qs}`, {
          token: session.token,
        });
        setCalls(Array.isArray(data.calls) ? data.calls : []);
      } catch (e) {
        if (e.status === 401) return handleAuthFail();
        toast(e.message || 'Failed to load calls', 'error');
      } finally {
        setLoadingCalls(false);
      }
    },
    [applied, handleAuthFail, session.token, toast]
  );

  useEffect(() => {
    loadCalls(applied);
  }, [applied, loadCalls]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = calls.length;
    const active = calls.filter((c) => c.status === 'Ring').length;
    const interested = calls.filter((c) => c.status === 'Interested').length;
    return { total, active, interested };
  }, [calls]);

  /* ── Date range controls ── */
  const setTab = (which) => {
    const day = which === 'today' ? todayYMD() : yesterdayYMD();
    setFromDate(day);
    setToDate(day);
    setApplied({ from: day, to: day });
  };
  const isToday = fromDate === todayYMD() && toDate === todayYMD();
  const isYesterday =
    fromDate === yesterdayYMD() && toDate === yesterdayYMD();

  const applyRange = () => {
    if (!fromDate || !toDate) {
      toast('Please pick both dates.', 'error');
      return;
    }
    if (fromDate > toDate) {
      toast('"From" must be on or before "To".', 'error');
      return;
    }
    setApplied({ from: fromDate, to: toDate });
  };

  /* ── Auto-queue ── */
  const fetchNextAutoNumber = useCallback(async () => {
    try {
      const data = await apiRequest('/rcm/auto-queue/next', {
        token: session.token,
      });
      setMobile(data.number || '');
      setAutoNumberId(data.id || null);
      setAutoQueueEmpty(false);
      return data;
    } catch (e) {
      if (e.status === 401) {
        handleAuthFail();
        return null;
      }
      if (e.status === 404) {
        setAutoQueueEmpty(true);
        setMobile('');
        setAutoNumberId(null);
      } else {
        toast(e.message || 'Queue fetch failed', 'error');
      }
      return null;
    }
  }, [handleAuthFail, session.token, toast]);

  // Mode change handler
  const onModeChange = async (next) => {
    if (currentCallId || callBusy || statusBusy) return;
    setMode(next);
    setMobile('');
    setAutoNumberId(null);
    setAutoQueueEmpty(false);
    if (next === 'Automatic') {
      await fetchNextAutoNumber();
    }
  };

  /* ── Make call ── */
  const handleCallNow = async () => {
    if (callBusy) return;
    if (!/^[0-9]{10}$/.test(mobile)) {
      toast('Please enter a 10-digit number.', 'error');
      return;
    }

    // Client-side dup check
    const localDup = calls.find(
      (c) => c.number === mobile && c.status !== 'Ring'
    );
    if (localDup) {
      toast(
        `This number was already called (${localDup.status}). Try another.`,
        'error'
      );
      if (mode === 'Automatic') await fetchNextAutoNumber();
      return;
    }

    setCallBusy(true);
    try {
      const data = await apiRequest('/rcm/calls', {
        method: 'POST',
        token: session.token,
        body: { number: mobile, mode, autoNumberId: autoNumberId || null },
      });
      const call = data.call;
      setCalls((prev) => [call, ...prev]);
      setCurrentCallId(call._id);
      if (callExtension) {
        // Open device dialer
        window.location.href = `tel:${mobile}`;
      }
    } catch (e) {
      if (e.status === 401) return handleAuthFail();
      toast(e.message || 'Failed to start call', 'error');
      if (e.status === 409 && mode === 'Automatic') {
        await fetchNextAutoNumber();
      }
    } finally {
      setCallBusy(false);
    }
  };

  /* ── Save status (non-Interested or final Interested) ── */
  const saveStatus = useCallback(
    async (status, interestedDetails) => {
      if (!currentCallId) return;
      setStatusBusy(true);
      try {
        const body = { status };
        if (status === 'Interested' && interestedDetails) {
          body.interestedDetails = interestedDetails;
        }
        const data = await apiRequest(
          `/rcm/calls/${currentCallId}/status`,
          { method: 'PATCH', token: session.token, body }
        );
        const updated = data.call;
        setCalls((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c))
        );
        toast(`Marked as ${status}`, 'success');
        setCurrentCallId(null);
        setMobile('');
        setAutoNumberId(null);
        setInterestedOpen(false);
        setInterestedForm(EMPTY_INTERESTED);
        if (mode === 'Automatic') {
          await fetchNextAutoNumber();
        }
      } catch (e) {
        if (e.status === 401) {
          handleAuthFail();
          return;
        }
        toast(e.message || 'Failed to update status', 'error');
      } finally {
        setStatusBusy(false);
      }
    },
    [
      currentCallId,
      fetchNextAutoNumber,
      handleAuthFail,
      mode,
      session.token,
      toast,
    ]
  );

  const onStatusButton = (status) => {
    if (!currentCallId || statusBusy) return;
    if (status === 'Interested') {
      setInterestedForm(EMPTY_INTERESTED);
      setInterestedOpen(true);
      return;
    }
    saveStatus(status);
  };

  /* ── Report table status edit (optimistic) ── */
  const onReportStatusChange = async (call, nextStatus) => {
    if (!STATUS_OPTIONS.includes(nextStatus)) return;
    if (nextStatus === 'Interested') {
      // require collecting details first via a quick modal flow
      toast(
        'To mark "Interested" with details, finalize during a live call.',
        'error'
      );
      return;
    }
    const prev = calls;
    setCalls((p) =>
      p.map((c) => (c._id === call._id ? { ...c, status: nextStatus } : c))
    );
    try {
      const data = await apiRequest(`/rcm/calls/${call._id}/status`, {
        method: 'PATCH',
        token: session.token,
        body: { status: nextStatus },
      });
      const updated = data.call;
      setCalls((p) => p.map((c) => (c._id === updated._id ? updated : c)));
    } catch (e) {
      setCalls(prev);
      if (e.status === 401) return handleAuthFail();
      toast(e.message || 'Failed to update status', 'error');
    }
  };

  /* ── Today label ── */
  const todayLabel = useMemo(() => formatLongDate(todayYMD()), []);

  const todayDisabled = currentCallId || callBusy || statusBusy;

  return (
    <div className="rcm-page">
      {/* Header */}
      <div className="rcm-header">
        <div className="rcm-header-left">📞 Call Management <span className="rcm-light">System</span></div>
        <div className="rcm-header-right">
          <span className={`rcm-role-badge ${session.role === 'ADMIN' ? 'admin' : ''}`}>
            {session.role}
          </span>
          <span className="rcm-user">👤 {session.username}</span>
          <button className="rcm-logout" type="button" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Section 1 — My Dashboard */}
      <div className="rcm-card">
        <div className="rcm-card-head">
          <div className="rcm-card-title">📊 My Dashboard</div>
          <div className="rcm-right-date">{todayLabel}</div>
        </div>

        <div className="rcm-tabs">
          <button
            type="button"
            className={`rcm-tab-btn ${isToday ? 'active' : ''}`}
            onClick={() => setTab('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={`rcm-tab-btn ${isYesterday ? 'active' : ''}`}
            onClick={() => setTab('yesterday')}
          >
            Yesterday
          </button>
        </div>

        <div className="rcm-date-row">
          <div>
            <label className="rcm-label">From</label>
            <input
              className="rcm-field"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="rcm-label">To</label>
            <input
              className="rcm-field"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="rcm-btn rcm-btn-primary rcm-btn-sm"
            onClick={applyRange}
          >
            Apply
          </button>
        </div>

        <div className="rcm-stats-grid">
          <div className="rcm-stat rcm-total">
            <div className="rcm-label">TOTAL CALLS</div>
            <div className="rcm-count">{stats.total}</div>
          </div>
          <div className="rcm-stat rcm-active">
            <div className="rcm-label">ACTIVE CALLS</div>
            <div className="rcm-count">{stats.active}</div>
          </div>
          <div className="rcm-stat rcm-interested">
            <div className="rcm-label">INTERESTED</div>
            <div className="rcm-count">{stats.interested}</div>
          </div>
        </div>
      </div>

      {/* Section 2 — Call Section */}
      <div className="rcm-card">
        <div className="rcm-card-title">📞 Call Section</div>

        <div className="rcm-modes">
          <label className={`rcm-mode-option ${mode === 'Automatic' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="rcm-mode"
              value="Automatic"
              checked={mode === 'Automatic'}
              onChange={() => onModeChange('Automatic')}
              disabled={todayDisabled}
            />
            Automatic
          </label>
          <label className={`rcm-mode-option ${mode === 'Manual' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="rcm-mode"
              value="Manual"
              checked={mode === 'Manual'}
              onChange={() => onModeChange('Manual')}
              disabled={todayDisabled}
            />
            Manual
          </label>

          <label
            className="rcm-mode-option rcm-ext-toggle"
            title="When ON, pressing Call Now opens your device dialer (tel:). Turn OFF to only log the call without opening the dialer."
            style={{ marginLeft: 'auto' }}
          >
            <input
              type="checkbox"
              checked={callExtension}
              onChange={(e) => setCallExtension(e.target.checked)}
            />
            📞 Call Extension
          </label>
        </div>

        <div className="rcm-call-row">
          <div style={{ flex: 1 }}>
            <label className="rcm-label">Mobile Number</label>
            <input
              className="rcm-field"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              readOnly={mode === 'Automatic'}
              placeholder={mode === 'Automatic' ? 'Auto-assigned from queue' : 'Enter 10-digit number'}
              onChange={(e) => {
                if (mode === 'Manual') {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(v);
                }
              }}
            />
            {mode === 'Automatic' && autoQueueEmpty ? (
              <div className="rcm-login-error" style={{ marginTop: 6 }}>
                No numbers in the admin queue. Ask admin to push numbers, or switch to Manual.
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className={`rcm-call-now ${
              /^[0-9]{10}$/.test(mobile) && !callBusy && !currentCallId ? 'ready' : ''
            }`}
            disabled={!/^[0-9]{10}$/.test(mobile) || callBusy || !!currentCallId}
            onClick={handleCallNow}
          >
            📞 {callBusy ? 'Calling…' : 'Call Now'}
          </button>
        </div>

        <div className="rcm-status-grid">
          <button
            type="button"
            className="rcm-status-btn rcm-ring"
            disabled={!currentCallId || statusBusy}
            onClick={() => onStatusButton('Ring')}
          >
            🔔 Ring
          </button>
          <button
            type="button"
            className="rcm-status-btn rcm-not-exist"
            disabled={!currentCallId || statusBusy}
            onClick={() => onStatusButton('Not Exist')}
          >
            ❌ Not Exist
          </button>
          <button
            type="button"
            className="rcm-status-btn rcm-not-interested"
            disabled={!currentCallId || statusBusy}
            onClick={() => onStatusButton('Not Interested')}
          >
            👎 Not Interested
          </button>
          <button
            type="button"
            className="rcm-status-btn rcm-interested"
            disabled={!currentCallId || statusBusy}
            onClick={() => onStatusButton('Interested')}
          >
            ✅ Interested
          </button>
        </div>
      </div>

      {/* Section 3 — Call Report */}
      <div className="rcm-card">
        <div className="rcm-card-title">📋 Call Report</div>

        <div className="rcm-table-wrap">
          <table className="rcm-report-table">
            <thead>
              <tr>
                <th>DATE &amp; TIME</th>
                <th>NUMBER</th>
                <th>MODE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loadingCalls ? (
                <tr>
                  <td className="rcm-empty-row" colSpan={4} data-label="">
                    Loading…
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td className="rcm-empty-row" colSpan={4} data-label="">
                    No calls in this date range.
                  </td>
                </tr>
              ) : (
                calls.map((c) => {
                  const hasDetails =
                    c.interestedDetails &&
                    (c.interestedDetails.rent ||
                      c.interestedDetails.advance ||
                      c.interestedDetails.bhk ||
                      c.interestedDetails.floorNo ||
                      c.interestedDetails.carPark ||
                      c.interestedDetails.availableFrom);
                  return (
                    <tr key={c._id}>
                      <td data-label="DATE & TIME">{formatDateTime(c.createdAt)}</td>
                      <td data-label="NUMBER">{c.number}</td>
                      <td data-label="MODE">
                        <span
                          className={`rcm-mode-pill ${
                            c.mode === 'Automatic' ? 'rcm-automatic' : 'rcm-manual'
                          }`}
                        >
                          {c.mode}
                        </span>
                      </td>
                      <td data-label="STATUS">
                        <select
                          className="rcm-status-select"
                          value={c.status}
                          onChange={(e) => onReportStatusChange(c, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {hasDetails ? (
                          <button
                            type="button"
                            className="rcm-detail-link"
                            onClick={() => setViewerCall(c)}
                          >
                            View details
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interested capture modal */}
      {interestedOpen ? (
        <InterestedModal
          form={interestedForm}
          setForm={setInterestedForm}
          busy={interestedSaving}
          onCancel={() => {
            if (interestedSaving) return;
            setInterestedOpen(false);
            setInterestedForm(EMPTY_INTERESTED);
          }}
          onSave={async () => {
            // Validate
            const f = interestedForm;
            const missing =
              !f.rent.trim() ||
              !f.advance.trim() ||
              !f.bhk ||
              !f.floorNo.trim() ||
              !f.carPark ||
              !f.availableFrom;
            if (missing) {
              toast('All fields are required.', 'error');
              return;
            }
            setInterestedSaving(true);
            try {
              await saveStatus('Interested', {
                rent: f.rent.trim(),
                advance: f.advance.trim(),
                bhk: f.bhk,
                floorNo: f.floorNo.trim(),
                carPark: f.carPark,
                availableFrom: f.availableFrom,
              });
            } finally {
              setInterestedSaving(false);
            }
          }}
        />
      ) : null}

      {/* Read-only details viewer */}
      {viewerCall ? (
        <DetailsViewerModal
          call={viewerCall}
          onClose={() => setViewerCall(null)}
        />
      ) : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   INTERESTED MODAL (capture)
   ══════════════════════════════════════════════════════════════ */
function InterestedModal({ form, setForm, busy, onCancel, onSave }) {
  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div
      className="rcm-modal-overlay"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div className="rcm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rcm-modal-title">✅ Interested — Property Details</div>
        <div className="rcm-modal-sub">
          Captured for the current call. All fields are required.
        </div>

        <div className="rcm-modal-grid">
          <div>
            <label className="rcm-label">Rent (₹)</label>
            <input
              className="rcm-field"
              type="text"
              inputMode="numeric"
              value={form.rent}
              onChange={(e) => upd('rent', e.target.value.replace(/\D/g, ''))}
              disabled={busy}
            />
          </div>
          <div>
            <label className="rcm-label">Advance (₹)</label>
            <input
              className="rcm-field"
              type="text"
              inputMode="numeric"
              value={form.advance}
              onChange={(e) => upd('advance', e.target.value.replace(/\D/g, ''))}
              disabled={busy}
            />
          </div>
          <div>
            <label className="rcm-label">BHK</label>
            <select
              className="rcm-field"
              value={form.bhk}
              onChange={(e) => upd('bhk', e.target.value)}
              disabled={busy}
            >
              <option value="">Select BHK</option>
              {BHK_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="rcm-label">Floor No</label>
            <input
              className="rcm-field"
              type="text"
              value={form.floorNo}
              placeholder="Ground / 1 / 2"
              onChange={(e) => upd('floorNo', e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label className="rcm-label">Car Park</label>
            <select
              className="rcm-field"
              value={form.carPark}
              onChange={(e) => upd('carPark', e.target.value)}
              disabled={busy}
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label className="rcm-label">Available From</label>
            <input
              className="rcm-field"
              type="date"
              value={form.availableFrom}
              onChange={(e) => upd('availableFrom', e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        <div className="rcm-modal-actions">
          <button
            type="button"
            className="rcm-btn"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rcm-btn rcm-btn-primary"
            onClick={onSave}
            disabled={busy}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DETAILS VIEWER MODAL (read-only)
   ══════════════════════════════════════════════════════════════ */
function DetailsViewerModal({ call, onClose }) {
  const d = call.interestedDetails || {};
  const fmt = (v) => (v ? String(v) : '—');
  const money = (v) => (v ? `₹ ${v}` : '—');
  return (
    <div className="rcm-modal-overlay" onClick={onClose}>
      <div className="rcm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rcm-modal-title">📄 Interested Details</div>
        <div className="rcm-modal-sub">
          Number: <strong>{call.number}</strong> • {formatDateTime(call.createdAt)}
        </div>

        <div className="rcm-detail-grid">
          <div>
            <div className="rcm-detail-label">Rent</div>
            <div className="rcm-detail-value">{money(d.rent)}</div>
          </div>
          <div>
            <div className="rcm-detail-label">Advance</div>
            <div className="rcm-detail-value">{money(d.advance)}</div>
          </div>
          <div>
            <div className="rcm-detail-label">BHK</div>
            <div className="rcm-detail-value">{fmt(d.bhk)}</div>
          </div>
          <div>
            <div className="rcm-detail-label">Floor No</div>
            <div className="rcm-detail-value">{fmt(d.floorNo)}</div>
          </div>
          <div>
            <div className="rcm-detail-label">Car Park</div>
            <div className="rcm-detail-value">{fmt(d.carPark)}</div>
          </div>
          <div>
            <div className="rcm-detail-label">Available From</div>
            <div className="rcm-detail-value">{fmt(d.availableFrom)}</div>
          </div>
        </div>

        <div className="rcm-modal-actions">
          <button type="button" className="rcm-btn rcm-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
