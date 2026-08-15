import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as XLSX from 'xlsx';
import './RpWfhCallManagement.css';

const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
const LS_TOKEN = 'rcm_rpwfh_admin_token';
const STATUS_OPTIONS = ['Ring', 'Not Exist', 'Not Interested', 'Interested'];
const BHK_OPTIONS = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5+BHK'];
const POLL_MS = 30000;

/* ──────────────────────────────────────────────────────────────
   Helpers (mirrored from RpWfhCallManagement.jsx — kept self-contained)
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
  } catch (_) {
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

function todayYMD() {
  const d = new Date();
  return toISODateInput(d);
}
function yesterdayYMD() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISODateInput(d);
}
function toISODateInput(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function fmtDateTime(iso) {
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
function fmtDateOnly(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function hasDetails(c) {
  const d = c && c.interestedDetails;
  if (!d) return false;
  return !!(
    d.rent ||
    d.advance ||
    d.bhk ||
    d.floorNo ||
    d.carPark ||
    d.availableFrom
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function RpWfhAdmin() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const { push, node: toastNode } = useToast();

  useEffect(() => {
    document.title = 'Admin · Call Management | PPC';
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
        if (me.role !== 'ADMIN') {
          localStorage.removeItem(LS_TOKEN);
        } else {
          setSession({ token, username: me.username, role: me.role });
        }
      } catch (_) {
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
      } catch (_) {}
    }
    localStorage.removeItem(LS_TOKEN);
    setSession(null);
  }, [session]);

  if (checking) {
    return (
      <div className="rcm-root rcm-admin">
        <div className="rcm-login-wrap">
          <div className="rcm-login-card">
            <div className="rcm-logo">🛠 PPC</div>
            <div className="rcm-subtitle">Connecting…</div>
          </div>
        </div>
        {toastNode}
      </div>
    );
  }

  return (
    <div className="rcm-root rcm-admin">
      {session ? (
        <AdminDashboard
          session={session}
          onLogout={handleLogout}
          toast={push}
        />
      ) : (
        <AdminLogin onLogin={setSession} toast={push} />
      )}
      {toastNode}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ADMIN LOGIN
   ══════════════════════════════════════════════════════════════ */
function AdminLogin({ onLogin, toast }) {
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
      if (data.role !== 'ADMIN') {
        setErr('This account is not an admin. Use a staff account on /ppc.wfh.');
        return;
      }
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
        <div className="rcm-logo">🛠 PPC</div>
        <div className="rcm-subtitle">Call Management — Admin Console</div>

        <label className="rcm-label" htmlFor="rcm-admin-username">Username</label>
        <input
          id="rcm-admin-username"
          className="rcm-field"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={busy}
        />

        <label className="rcm-label" htmlFor="rcm-admin-password">Password</label>
        <input
          id="rcm-admin-password"
          className="rcm-field"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />

        {err ? <div className="rcm-login-error">{err}</div> : null}

        <button
          className="rcm-btn rcm-btn-primary"
          type="submit"
          disabled={busy}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="rcm-hint">
          Default seed: <strong>admin / admin</strong>
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ══════════════════════════════════════════════════════════════ */
function AdminDashboard({ session, onLogout, toast }) {
  const [activeView, setActiveView] = useState('stats');

  // Date range state (committed via applied)
  const initial = useMemo(() => ({ from: todayYMD(), to: todayYMD() }), []);
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const [applied, setApplied] = useState(initial);

  // Data
  const [stats, setStats] = useState(null);
  const [calls, setCalls] = useState([]);
  const [agentCalls, setAgentCalls] = useState([]);
  const [queue, setQueue] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [detailsViewer, setDetailsViewer] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});

  // Queue inputs
  const [queueDraft, setQueueDraft] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Staff form
  const [newStaff, setNewStaff] = useState({
    username: '',
    password: '',
    role: 'STAFF',
  });

  // Filters
  const [allCallsFilters, setAllCallsFilters] = useState({
    agent: '',
    number: '',
    mode: '',
    status: '',
  });
  const [interestFilters, setInterestFilters] = useState({
    agent: '',
    number: '',
    bhk: '',
    rent: '',
    advance: '',
    floorNo: '',
    carPark: '',
    availableFrom: '',
  });

  const handle401 = useCallback(
    (err) => {
      if (err && err.status === 401) {
        toast('Session expired, please log in again.', 'error');
        localStorage.removeItem(LS_TOKEN);
        onLogout();
        return true;
      }
      return false;
    },
    [onLogout, toast]
  );

  const loadStats = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ from: applied.from, to: applied.to });
      if (selectedAgent) qs.set('agent', selectedAgent);
      const data = await apiRequest(`/rcm/stats?${qs.toString()}`, {
        token: session.token,
      });
      setStats(data);
    } catch (e) {
      if (handle401(e)) return;
      toast(e.message || 'Failed to load stats', 'error');
    }
  }, [applied, selectedAgent, session.token, toast, handle401]);

  const loadCalls = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ from: applied.from, to: applied.to });
      const data = await apiRequest(`/rcm/calls?${qs.toString()}`, {
        token: session.token,
      });
      setCalls(Array.isArray(data.calls) ? data.calls : []);
    } catch (e) {
      if (handle401(e)) return;
      toast(e.message || 'Failed to load calls', 'error');
    }
  }, [applied, session.token, toast, handle401]);

  const loadAgentCalls = useCallback(async () => {
    if (!selectedAgent) {
      setAgentCalls([]);
      return;
    }
    try {
      const qs = new URLSearchParams({
        from: applied.from,
        to: applied.to,
        agent: selectedAgent,
      });
      const data = await apiRequest(`/rcm/calls?${qs.toString()}`, {
        token: session.token,
      });
      setAgentCalls(Array.isArray(data.calls) ? data.calls : []);
    } catch (e) {
      if (handle401(e)) return;
      toast(e.message || "Failed to load agent calls", 'error');
    }
  }, [applied, selectedAgent, session.token, toast, handle401]);

  const loadQueue = useCallback(async () => {
    try {
      const data = await apiRequest('/rcm/auto-queue', {
        token: session.token,
      });
      setQueue(Array.isArray(data.queue) ? data.queue : []);
    } catch (e) {
      if (handle401(e)) return;
      toast(e.message || 'Failed to load queue', 'error');
    }
  }, [session.token, toast, handle401]);

  const loadStaff = useCallback(async () => {
    try {
      const data = await apiRequest('/rcm/staff', {
        token: session.token,
      });
      setStaff(Array.isArray(data.staff) ? data.staff : []);
    } catch (e) {
      if (handle401(e)) return;
      toast(e.message || 'Failed to load staff', 'error');
    }
  }, [session.token, toast, handle401]);

  // Initial + range / agent driven loads
  useEffect(() => {
    loadStats();
    loadCalls();
    loadQueue();
    loadStaff();
  }, [loadStats, loadCalls, loadQueue, loadStaff]);

  useEffect(() => {
    loadAgentCalls();
  }, [loadAgentCalls]);

  // Polling
  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      loadStats();
      loadCalls();
      loadAgentCalls();
      loadQueue();
      loadStaff();
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [loadStats, loadCalls, loadAgentCalls, loadQueue, loadStaff]);

  /* ── Date controls ── */
  const setTab = (which) => {
    const day = which === 'today' ? todayYMD() : yesterdayYMD();
    setFromDate(day);
    setToDate(day);
    setApplied({ from: day, to: day });
  };
  const isToday = fromDate === todayYMD() && toDate === todayYMD();
  const isYesterday = fromDate === yesterdayYMD() && toDate === yesterdayYMD();

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

  /* ── Agent option list ── */
  const agentOptions = useMemo(() => {
    const set = new Set();
    staff.forEach((s) => set.add(s.username));
    calls.forEach((c) => c.agentUsername && set.add(c.agentUsername));
    return Array.from(set).sort();
  }, [staff, calls]);

  /* ── Queue: file upload handlers ── */
  const onFilePick = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const collected = new Set();
      wb.SheetNames.forEach((name) => {
        const ws = wb.Sheets[name];
        Object.keys(ws).forEach((k) => {
          if (k.startsWith('!')) return;
          const cell = ws[k];
          if (!cell || cell.v == null) return;
          let raw = String(cell.v).replace(/\D/g, '');
          if (raw.length === 11 && raw.startsWith('0')) raw = raw.slice(1);
          if (raw.length === 12 && raw.startsWith('91')) raw = raw.slice(2);
          if (/^[6-9]\d{9}$/.test(raw)) collected.add(raw);
        });
      });
      const numbers = Array.from(collected);
      setFilePreview({ fileName: file.name, numbers });
      if (numbers.length === 0) {
        toast('No valid 10-digit numbers found in the file.', 'error');
      } else {
        toast(`Detected ${numbers.length} numbers.`, 'success');
      }
    } catch (err) {
      toast(err.message || 'Failed to read file', 'error');
    }
  };

  const resetFileInput = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadPreview = async () => {
    if (!filePreview || filePreview.numbers.length === 0) return;
    try {
      const data = await apiRequest('/rcm/auto-queue', {
        method: 'POST',
        token: session.token,
        body: { numbers: filePreview.numbers },
      });
      toast(`Added ${data.added} numbers to the queue.`, 'success');
      resetFileInput();
      loadQueue();
    } catch (e) {
      if (handle401(e)) return;
      toast(e.message || 'Failed to upload numbers', 'error');
    }
  };

  /* ── Queue: manual paste ── */
  const addPastedNumbers = async () => {
    const cleaned = Array.from(
      new Set(
        queueDraft
          .split(/[\s,;\n]+/)
          .map((s) => s.replace(/\D/g, ''))
          .filter((s) => /^\d{10}$/.test(s))
      )
    );
    if (cleaned.length === 0) {
      toast('No valid 10-digit numbers in the input.', 'error');
      return;
    }
    try {
      const data = await apiRequest('/rcm/auto-queue', {
        method: 'POST',
        token: session.token,
        body: { numbers: cleaned },
      });
      toast(`Added ${data.added} numbers to the queue.`, 'success');
      setQueueDraft('');
      loadQueue();
    } catch (e) {
      if (handle401(e)) return;
      toast(e.message || 'Failed to add numbers', 'error');
    }
  };

  /* ── Queue: remove ── */
  const removeQueueEntry = async (entry) => {
    const ok = window.confirm(`Remove ${entry.number} from the queue?`);
    if (!ok) return;
    const prev = queue;
    setQueue((p) => p.filter((q) => q._id !== entry._id));
    try {
      await apiRequest(`/rcm/auto-queue/${entry._id}`, {
        method: 'DELETE',
        token: session.token,
      });
      toast('Queue entry removed.', 'success');
    } catch (e) {
      setQueue(prev);
      if (handle401(e)) return;
      toast(e.message || 'Failed to remove entry', 'error');
    }
  };

  /* ── Staff create ── */
  const createStaff = async () => {
    if (!newStaff.username.trim() || !newStaff.password) {
      toast('Username and password are required.', 'error');
      return;
    }
    try {
      await apiRequest('/rcm/staff', {
        method: 'POST',
        token: session.token,
        body: {
          username: newStaff.username.trim(),
          password: newStaff.password,
          role: newStaff.role,
        },
      });
      toast(`Created ${newStaff.username}.`, 'success');
      setNewStaff({ username: '', password: '', role: 'STAFF' });
      loadStaff();
    } catch (e) {
      if (handle401(e)) return;
      toast(e.message || 'Failed to create staff', 'error');
    }
  };

  /* ── Staff toggle active ── */
  const toggleActive = async (s) => {
    if (s.username === session.username) {
      toast("You can't deactivate your own account.", 'error');
      return;
    }
    try {
      await apiRequest(`/rcm/staff/${s._id}`, {
        method: 'PATCH',
        token: session.token,
        body: { active: !s.active },
      });
      toast(`${s.username} ${!s.active ? 'activated' : 'deactivated'}.`, 'success');
      loadStaff();
    } catch (e) {
      if (handle401(e)) return;
      toast(e.message || 'Failed to toggle', 'error');
    }
  };

  const resetPassword = async (s) => {
    const next = window.prompt(`Enter new password for ${s.username} (min 4 chars)`);
    if (next === null) return;
    if (next.length < 4) {
      toast('Password must be at least 4 characters.', 'error');
      return;
    }
    try {
      await apiRequest(`/rcm/staff/${s._id}`, {
        method: 'PATCH',
        token: session.token,
        body: { password: next },
      });
      toast(`Password reset for ${s.username}.`, 'success');
      loadStaff();
    } catch (e) {
      if (handle401(e)) return;
      toast(e.message || 'Failed to reset password', 'error');
    }
  };

  /* ── All calls: status edit (optimistic) ── */
  const onCallStatusEdit = async (call, nextStatus) => {
    if (!STATUS_OPTIONS.includes(nextStatus)) return;
    if (nextStatus === 'Interested') {
      toast('Interested status requires details — finalize during a live call.', 'error');
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
      loadStats();
    } catch (e) {
      setCalls(prev);
      if (handle401(e)) return;
      toast(e.message || 'Failed to update status', 'error');
    }
  };

  /* ── Sidebar counts ── */
  const interestedCount = useMemo(
    () => calls.filter((c) => c.status === 'Interested').length,
    [calls]
  );

  const navItems = [
    { key: 'stats', icon: '📊', label: 'Overall Stats', badge: null },
    { key: 'queue', icon: '📥', label: 'Auto-Call Queue', badge: queue.length },
    { key: 'staff', icon: '👥', label: 'Staff Accounts', badge: staff.length },
    { key: 'calls', icon: '📋', label: 'All Calls', badge: calls.length },
    { key: 'interested', icon: '✅', label: 'Interest List', badge: interestedCount },
  ];

  /* ── Filtered datasets ── */
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      if (allCallsFilters.agent && c.agentUsername !== allCallsFilters.agent) return false;
      if (allCallsFilters.number && !String(c.number || '').includes(allCallsFilters.number)) return false;
      if (allCallsFilters.mode && c.mode !== allCallsFilters.mode) return false;
      if (allCallsFilters.status && c.status !== allCallsFilters.status) return false;
      return true;
    });
  }, [calls, allCallsFilters]);

  const interestedCalls = useMemo(
    () => calls.filter((c) => c.status === 'Interested'),
    [calls]
  );

  const filteredInterested = useMemo(() => {
    return interestedCalls.filter((c) => {
      const d = c.interestedDetails || {};
      if (interestFilters.agent && c.agentUsername !== interestFilters.agent) return false;
      if (interestFilters.number && !String(c.number || '').includes(interestFilters.number)) return false;
      if (interestFilters.bhk && d.bhk !== interestFilters.bhk) return false;
      if (interestFilters.rent && !String(d.rent || '').includes(interestFilters.rent)) return false;
      if (interestFilters.advance && !String(d.advance || '').includes(interestFilters.advance)) return false;
      if (
        interestFilters.floorNo &&
        !String(d.floorNo || '').toLowerCase().includes(interestFilters.floorNo.toLowerCase())
      )
        return false;
      if (interestFilters.carPark && d.carPark !== interestFilters.carPark) return false;
      if (interestFilters.availableFrom && d.availableFrom !== interestFilters.availableFrom) return false;
      return true;
    });
  }, [interestedCalls, interestFilters]);

  const allCallsHasFilter = Object.values(allCallsFilters).some((v) => v);
  const interestHasFilter = Object.values(interestFilters).some((v) => v);

  /* ── Date controls block reused across views ── */
  const dateControls = (
    <>
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
        <div>
          <label className="rcm-label">Staff</label>
          <select
            className="rcm-field"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
          >
            <option value="">All staff (overall)</option>
            {agentOptions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="rcm-btn rcm-btn-primary rcm-btn-sm"
          onClick={applyRange}
        >
          Apply
        </button>
      </div>
    </>
  );

  return (
    <div className="rcm-page">
      {/* Header */}
      <div className="rcm-header">
        <div className="rcm-header-left">
          🛠 Admin <span className="rcm-light">· Call Management</span>
        </div>
        <div className="rcm-header-right">
          <span className="rcm-role-badge admin">{session.role}</span>
          <span className="rcm-user">👤 {session.username}</span>
          <button className="rcm-logout" type="button" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="rcm-admin-shell">
        {/* Sidebar */}
        <aside className="rcm-sidebar">
          <div className="rcm-sidebar-section">Call Management</div>
          <nav className="rcm-sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`rcm-sidebar-item ${activeView === item.key ? 'active' : ''}`}
                onClick={() => setActiveView(item.key)}
              >
                <span className="rcm-sidebar-icon">{item.icon}</span>
                <span className="rcm-sidebar-label">{item.label}</span>
                {item.badge != null ? (
                  <span className="rcm-side-badge">{item.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="rcm-content">
          {activeView === 'stats' && (
            <StatsView
              stats={stats}
              selectedAgent={selectedAgent}
              setSelectedAgent={setSelectedAgent}
              dateControls={dateControls}
              agentCalls={agentCalls}
              applied={applied}
              setDetailsViewer={setDetailsViewer}
            />
          )}

          {activeView === 'queue' && (
            <QueueView
              queue={queue}
              filePreview={filePreview}
              fileInputRef={fileInputRef}
              onFilePick={onFilePick}
              uploadPreview={uploadPreview}
              resetFileInput={resetFileInput}
              queueDraft={queueDraft}
              setQueueDraft={setQueueDraft}
              addPastedNumbers={addPastedNumbers}
              removeQueueEntry={removeQueueEntry}
            />
          )}

          {activeView === 'staff' && (
            <StaffView
              staff={staff}
              session={session}
              newStaff={newStaff}
              setNewStaff={setNewStaff}
              createStaff={createStaff}
              toggleActive={toggleActive}
              resetPassword={resetPassword}
              revealedPasswords={revealedPasswords}
              setRevealedPasswords={setRevealedPasswords}
            />
          )}

          {activeView === 'calls' && (
            <AllCallsView
              calls={calls}
              filteredCalls={filteredCalls}
              hasFilter={allCallsHasFilter}
              filters={allCallsFilters}
              setFilters={setAllCallsFilters}
              agentOptions={agentOptions}
              onStatusEdit={onCallStatusEdit}
              setDetailsViewer={setDetailsViewer}
              applied={applied}
              dateControls={dateControls}
            />
          )}

          {activeView === 'interested' && (
            <InterestedView
              interested={interestedCalls}
              filtered={filteredInterested}
              hasFilter={interestHasFilter}
              filters={interestFilters}
              setFilters={setInterestFilters}
              agentOptions={agentOptions}
              setDetailsViewer={setDetailsViewer}
              applied={applied}
              dateControls={dateControls}
            />
          )}
        </main>
      </div>

      {detailsViewer ? (
        <DetailsViewerModal
          call={detailsViewer}
          onClose={() => setDetailsViewer(null)}
        />
      ) : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VIEW: STATS
   ══════════════════════════════════════════════════════════════ */
function StatsView({
  stats,
  selectedAgent,
  setSelectedAgent,
  dateControls,
  agentCalls,
  applied,
  setDetailsViewer,
}) {
  const total = stats?.totalCalls ?? 0;
  const ring = stats?.ringCount ?? 0;
  const interested = stats?.interestedCount ?? 0;

  return (
    <>
      <div className="rcm-card">
        <div className="rcm-card-head">
          <div className="rcm-card-title">
            {selectedAgent ? (
              <>
                📊 Report — <span className="rcm-primary">{selectedAgent}</span>{' '}
                <button
                  type="button"
                  className="rcm-btn rcm-btn-sm"
                  onClick={() => setSelectedAgent('')}
                  style={{ marginLeft: 8 }}
                >
                  ← Back to overall
                </button>
              </>
            ) : (
              <>📊 Overall Stats</>
            )}
          </div>
          <div className="rcm-right-date">
            {applied.from === applied.to
              ? fmtDateOnly(`${applied.from}T00:00:00`)
              : `${fmtDateOnly(`${applied.from}T00:00:00`)} — ${fmtDateOnly(`${applied.to}T00:00:00`)}`}
          </div>
        </div>

        {dateControls}

        <div className="rcm-stats-grid">
          <div className="rcm-stat rcm-total">
            <div className="rcm-label">TOTAL CALLS</div>
            <div className="rcm-count">{total}</div>
          </div>
          <div className="rcm-stat rcm-active">
            <div className="rcm-label">ACTIVE (RING)</div>
            <div className="rcm-count">{ring}</div>
          </div>
          <div className="rcm-stat rcm-interested">
            <div className="rcm-label">INTERESTED</div>
            <div className="rcm-count">{interested}</div>
          </div>
        </div>

        <div className="rcm-status-breakdown">
          <div className="rcm-bk-item">
            <div className="rcm-label">RING</div>
            <div className="rcm-bk-val">{stats?.ringCount ?? 0}</div>
          </div>
          <div className="rcm-bk-item">
            <div className="rcm-label">NOT EXIST</div>
            <div className="rcm-bk-val">{stats?.notExistCount ?? 0}</div>
          </div>
          <div className="rcm-bk-item">
            <div className="rcm-label">NOT INT.</div>
            <div className="rcm-bk-val">{stats?.notInterestedCount ?? 0}</div>
          </div>
          <div className="rcm-bk-item">
            <div className="rcm-label">INTERESTED</div>
            <div className="rcm-bk-val">{stats?.interestedCount ?? 0}</div>
          </div>
        </div>

        {!selectedAgent && stats && stats.byAgent && stats.byAgent.length > 0 && (
          <>
            <div className="rcm-section-title">
              By agent <span className="rcm-muted">(click a row to view that staff's report)</span>
            </div>
            <div className="rcm-table-wrap">
              <table className="rcm-report-table">
                <thead>
                  <tr>
                    <th>AGENT</th>
                    <th>TOTAL</th>
                    <th>RING</th>
                    <th>NOT EXIST</th>
                    <th>NOT INT.</th>
                    <th>INTERESTED</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byAgent.map((r) => (
                    <tr
                      key={r.agentUsername}
                      role="button"
                      tabIndex={0}
                      className="rcm-clickable-row"
                      onClick={() => setSelectedAgent(r.agentUsername)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedAgent(r.agentUsername);
                        }
                      }}
                    >
                      <td data-label="AGENT"><strong>{r.agentUsername}</strong></td>
                      <td data-label="TOTAL">{r.total}</td>
                      <td data-label="RING">{r.Ring}</td>
                      <td data-label="NOT EXIST">{r['Not Exist']}</td>
                      <td data-label="NOT INT.">{r['Not Interested']}</td>
                      <td data-label="INTERESTED">{r.Interested}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedAgent && (
        <div className="rcm-card">
          <div className="rcm-card-head">
            <div className="rcm-card-title">
              📋 {selectedAgent}'s calls ({agentCalls.length})
            </div>
            <div className="rcm-right-date">
              {applied.from === applied.to
                ? fmtDateOnly(`${applied.from}T00:00:00`)
                : `${fmtDateOnly(`${applied.from}T00:00:00`)} — ${fmtDateOnly(`${applied.to}T00:00:00`)}`}
            </div>
          </div>

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
                {agentCalls.length === 0 ? (
                  <tr>
                    <td className="rcm-empty-row" colSpan={4} data-label="">
                      No calls for {selectedAgent} in this range.
                    </td>
                  </tr>
                ) : (
                  agentCalls.map((c) => (
                    <tr key={c._id}>
                      <td data-label="DATE & TIME">{fmtDateTime(c.createdAt)}</td>
                      <td data-label="NUMBER">{c.number}</td>
                      <td data-label="MODE">
                        <span className={`rcm-mode-pill ${c.mode === 'Automatic' ? 'rcm-automatic' : 'rcm-manual'}`}>
                          {c.mode}
                        </span>
                      </td>
                      <td data-label="STATUS">
                        <span className={`rcm-status-pill rcm-pill-${statusSlug(c.status)}`}>{c.status}</span>
                        {hasDetails(c) ? (
                          <button
                            type="button"
                            className="rcm-detail-link"
                            onClick={() => setDetailsViewer(c)}
                            style={{ marginLeft: 8 }}
                          >
                            View details
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function statusSlug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z]+/g, '-');
}

/* ══════════════════════════════════════════════════════════════
   VIEW: QUEUE
   ══════════════════════════════════════════════════════════════ */
function QueueView({
  queue,
  filePreview,
  fileInputRef,
  onFilePick,
  uploadPreview,
  resetFileInput,
  queueDraft,
  setQueueDraft,
  addPastedNumbers,
  removeQueueEntry,
}) {
  return (
    <div className="rcm-card">
      <div className="rcm-card-title">📥 Auto-Call Queue ({queue.length})</div>
      <div className="rcm-muted" style={{ marginBottom: 14 }}>
        Numbers staff will dial in Automatic mode (round-robin server-side).
      </div>

      {/* Upload */}
      <div className="rcm-form-row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label className="rcm-label">Upload Excel / CSV</label>
          <input
            ref={fileInputRef}
            className="rcm-field"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFilePick}
          />
        </div>
      </div>

      {filePreview ? (
        <div
          className="rcm-file-preview"
          style={{
            background: filePreview.numbers.length > 0 ? '#f0fdf4' : '#fffbeb',
            borderColor: filePreview.numbers.length > 0 ? '#bbf7d0' : '#fde68a',
          }}
        >
          <div style={{ flex: 1 }}>
            <div><strong>{filePreview.fileName}</strong></div>
            <div className="rcm-muted">
              Detected <strong>{filePreview.numbers.length}</strong> valid 10-digit numbers.
              {filePreview.numbers.length > 0 ? (
                <> Preview: {filePreview.numbers.slice(0, 5).join(', ')}
                  {filePreview.numbers.length > 5 ? '…' : ''}
                </>
              ) : null}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="rcm-btn rcm-btn-primary rcm-btn-sm"
              disabled={filePreview.numbers.length === 0}
              onClick={uploadPreview}
            >
              Upload {filePreview.numbers.length}
            </button>
            <button
              type="button"
              className="rcm-btn rcm-btn-sm"
              onClick={resetFileInput}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* Manual paste */}
      <div style={{ marginTop: 16 }}>
        <label className="rcm-label">
          Or paste 10-digit numbers (one per line, comma, or space)
        </label>
        <textarea
          className="rcm-field"
          rows={4}
          value={queueDraft}
          onChange={(e) => setQueueDraft(e.target.value)}
          placeholder="9876543210, 9123456780&#10;8888888888"
          style={{ fontFamily: 'inherit', resize: 'vertical' }}
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="rcm-btn rcm-btn-primary rcm-btn-sm"
            onClick={addPastedNumbers}
          >
            Add to Queue
          </button>
          <button
            type="button"
            className="rcm-btn rcm-btn-sm"
            onClick={() => setQueueDraft('')}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Queue table */}
      <div className="rcm-section-title" style={{ marginTop: 18 }}>
        Current queue
      </div>
      <div className="rcm-table-wrap">
        <table className="rcm-report-table">
          <thead>
            <tr>
              <th>NUMBER</th>
              <th>ASSIGNED</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td className="rcm-empty-row" colSpan={3} data-label="">
                  Queue is empty. Upload a file or paste numbers above.
                </td>
              </tr>
            ) : (
              queue.map((q) => (
                <tr key={q._id} className={q.active ? '' : 'rcm-row-inactive'}>
                  <td data-label="NUMBER">
                    <div><strong>{q.number}</strong></div>
                    <div className="rcm-muted">
                      added by {q.addedBy || 'system'}{!q.active ? ' · retired' : ''}
                    </div>
                  </td>
                  <td data-label="ASSIGNED">{q.assignCount || 0}×</td>
                  <td data-label="ACTION">
                    <button
                      type="button"
                      className="rcm-btn rcm-btn-sm rcm-danger"
                      onClick={() => removeQueueEntry(q)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VIEW: STAFF
   ══════════════════════════════════════════════════════════════ */
function StaffView({
  staff,
  session,
  newStaff,
  setNewStaff,
  createStaff,
  toggleActive,
  resetPassword,
  revealedPasswords,
  setRevealedPasswords,
}) {
  const toggleReveal = (id) =>
    setRevealedPasswords((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="rcm-card">
      <div className="rcm-card-title">👥 Staff Accounts ({staff.length})</div>

      {/* Create form */}
      <div className="rcm-form-row">
        <div>
          <label className="rcm-label">New username</label>
          <input
            className="rcm-field"
            type="text"
            value={newStaff.username}
            onChange={(e) =>
              setNewStaff((p) => ({
                ...p,
                username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''),
              }))
            }
          />
        </div>
        <div>
          <label className="rcm-label">Role</label>
          <select
            className="rcm-field"
            value={newStaff.role}
            onChange={(e) => setNewStaff((p) => ({ ...p, role: e.target.value }))}
          >
            <option value="STAFF">STAFF</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div>
          <label className="rcm-label">Initial password</label>
          <input
            className="rcm-field"
            type="text"
            value={newStaff.password}
            onChange={(e) => setNewStaff((p) => ({ ...p, password: e.target.value }))}
            placeholder="min 4 chars"
          />
        </div>
        <button
          type="button"
          className="rcm-btn rcm-btn-primary rcm-btn-sm"
          onClick={createStaff}
        >
          Create
        </button>
      </div>

      {/* Staff table */}
      <div className="rcm-table-wrap" style={{ marginTop: 14 }}>
        <table className="rcm-report-table">
          <thead>
            <tr>
              <th>USERNAME</th>
              <th>PASSWORD</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>RESET PW</th>
              <th>TOGGLE</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td className="rcm-empty-row" colSpan={6} data-label="">
                  No staff accounts yet.
                </td>
              </tr>
            ) : (
              staff.map((s) => {
                const isSelf = s.username === session.username;
                const revealed = !!revealedPasswords[s._id];
                return (
                  <tr key={s._id}>
                    <td data-label="USERNAME">
                      <div><strong>{s.username}</strong>{isSelf ? ' (you)' : ''}</div>
                      {s.lastLogin ? (
                        <div className="rcm-muted">last: {fmtDateTime(s.lastLogin)}</div>
                      ) : (
                        <div className="rcm-muted">never logged in</div>
                      )}
                    </td>
                    <td data-label="PASSWORD">
                      {s.plainPassword ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <code className="rcm-pw-pill">
                            {revealed ? s.plainPassword : '•'.repeat(Math.min(10, s.plainPassword.length))}
                          </code>
                          <button
                            type="button"
                            className="rcm-btn rcm-btn-sm"
                            onClick={() => toggleReveal(s._id)}
                          >
                            {revealed ? '🙈 Hide' : '👁 Show'}
                          </button>
                        </div>
                      ) : (
                        <span className="rcm-muted">— (reset to view)</span>
                      )}
                    </td>
                    <td data-label="ROLE">
                      <span className={s.role === 'ADMIN' ? 'rcm-pill-admin' : 'rcm-pill-staff'}>
                        {s.role}
                      </span>
                    </td>
                    <td data-label="STATUS">
                      <span className={s.active ? 'rcm-pill-active' : 'rcm-pill-inactive'}>
                        {s.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td data-label="RESET PW">
                      <button
                        type="button"
                        className="rcm-btn rcm-btn-sm"
                        onClick={() => resetPassword(s)}
                      >
                        Reset
                      </button>
                    </td>
                    <td data-label="TOGGLE">
                      <button
                        type="button"
                        className={`rcm-btn rcm-btn-sm ${s.active ? 'rcm-danger' : 'rcm-btn-primary'}`}
                        onClick={() => toggleActive(s)}
                        disabled={isSelf}
                        title={isSelf ? "You can't change your own active state." : ''}
                      >
                        {s.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VIEW: ALL CALLS
   ══════════════════════════════════════════════════════════════ */
function AllCallsView({
  calls,
  filteredCalls,
  hasFilter,
  filters,
  setFilters,
  agentOptions,
  onStatusEdit,
  setDetailsViewer,
  applied,
  dateControls,
}) {
  return (
    <div className="rcm-card">
      <div className="rcm-card-head">
        <div className="rcm-card-title">
          📋 All Calls ({filteredCalls.length}/{calls.length})
          {hasFilter ? (
            <button
              type="button"
              className="rcm-btn rcm-btn-sm"
              style={{ marginLeft: 10 }}
              onClick={() =>
                setFilters({ agent: '', number: '', mode: '', status: '' })
              }
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="rcm-right-date">
          {applied.from === applied.to
            ? fmtDateOnly(`${applied.from}T00:00:00`)
            : `${fmtDateOnly(`${applied.from}T00:00:00`)} — ${fmtDateOnly(`${applied.to}T00:00:00`)}`}
        </div>
      </div>

      {dateControls}

      <div className="rcm-table-wrap">
        <table className="rcm-report-table">
          <thead>
            <tr>
              <th>DATE &amp; TIME</th>
              <th>AGENT</th>
              <th>NUMBER</th>
              <th>MODE</th>
              <th>STATUS</th>
            </tr>
            <tr className="rcm-filter-row">
              <th>
                <span className="rcm-muted" style={{ fontSize: 11 }}>
                  uses Overall Stats range
                </span>
              </th>
              <th>
                <select
                  className="rcm-field"
                  value={filters.agent}
                  onChange={(e) => setFilters((p) => ({ ...p, agent: e.target.value }))}
                >
                  <option value="">All</option>
                  {agentOptions.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </th>
              <th>
                <input
                  className="rcm-field"
                  type="text"
                  inputMode="numeric"
                  value={filters.number}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      number: e.target.value.replace(/\D/g, ''),
                    }))
                  }
                  placeholder="digits"
                />
              </th>
              <th>
                <select
                  className="rcm-field"
                  value={filters.mode}
                  onChange={(e) => setFilters((p) => ({ ...p, mode: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </th>
              <th>
                <select
                  className="rcm-field"
                  value={filters.status}
                  onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="">All</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCalls.length === 0 ? (
              <tr>
                <td className="rcm-empty-row" colSpan={5} data-label="">
                  {calls.length === 0
                    ? 'No calls in this date range.'
                    : 'No calls match the current filters.'}
                </td>
              </tr>
            ) : (
              filteredCalls.map((c) => (
                <tr key={c._id}>
                  <td data-label="DATE & TIME">{fmtDateTime(c.createdAt)}</td>
                  <td data-label="AGENT"><strong>{c.agentUsername}</strong></td>
                  <td data-label="NUMBER">{c.number}</td>
                  <td data-label="MODE">
                    <span className={`rcm-mode-pill ${c.mode === 'Automatic' ? 'rcm-automatic' : 'rcm-manual'}`}>
                      {c.mode}
                    </span>
                  </td>
                  <td data-label="STATUS">
                    <select
                      className="rcm-status-select"
                      value={c.status}
                      onChange={(e) => onStatusEdit(c, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {hasDetails(c) ? (
                      <button
                        type="button"
                        className="rcm-detail-link"
                        onClick={() => setDetailsViewer(c)}
                      >
                        View details
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VIEW: INTERESTED LIST
   ══════════════════════════════════════════════════════════════ */
function InterestedView({
  interested,
  filtered,
  hasFilter,
  filters,
  setFilters,
  agentOptions,
  setDetailsViewer,
  applied,
  dateControls,
}) {
  return (
    <div className="rcm-card">
      <div className="rcm-card-head">
        <div className="rcm-card-title">
          ✅ Interest List ({filtered.length}/{interested.length})
          {hasFilter ? (
            <button
              type="button"
              className="rcm-btn rcm-btn-sm"
              style={{ marginLeft: 10 }}
              onClick={() =>
                setFilters({
                  agent: '',
                  number: '',
                  bhk: '',
                  rent: '',
                  advance: '',
                  floorNo: '',
                  carPark: '',
                  availableFrom: '',
                })
              }
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="rcm-right-date">
          {applied.from === applied.to
            ? fmtDateOnly(`${applied.from}T00:00:00`)
            : `${fmtDateOnly(`${applied.from}T00:00:00`)} — ${fmtDateOnly(`${applied.to}T00:00:00`)}`}
        </div>
      </div>

      {dateControls}

      <div className="rcm-table-wrap">
        <table className="rcm-report-table">
          <thead>
            <tr>
              <th>DATE &amp; TIME</th>
              <th>AGENT</th>
              <th>NUMBER</th>
              <th>BHK</th>
              <th>RENT</th>
              <th>ADVANCE</th>
              <th>FLOOR</th>
              <th>CAR PARK</th>
              <th>AVAILABLE FROM</th>
              <th>ACTION</th>
            </tr>
            <tr className="rcm-filter-row">
              <th>
                <span className="rcm-muted" style={{ fontSize: 11 }}>
                  uses range
                </span>
              </th>
              <th>
                <select
                  className="rcm-field"
                  value={filters.agent}
                  onChange={(e) => setFilters((p) => ({ ...p, agent: e.target.value }))}
                >
                  <option value="">All</option>
                  {agentOptions.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </th>
              <th>
                <input
                  className="rcm-field"
                  type="text"
                  inputMode="numeric"
                  value={filters.number}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      number: e.target.value.replace(/\D/g, ''),
                    }))
                  }
                  placeholder="digits"
                />
              </th>
              <th>
                <select
                  className="rcm-field"
                  value={filters.bhk}
                  onChange={(e) => setFilters((p) => ({ ...p, bhk: e.target.value }))}
                >
                  <option value="">All</option>
                  {BHK_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </th>
              <th>
                <input
                  className="rcm-field"
                  type="text"
                  inputMode="numeric"
                  value={filters.rent}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      rent: e.target.value.replace(/\D/g, ''),
                    }))
                  }
                />
              </th>
              <th>
                <input
                  className="rcm-field"
                  type="text"
                  inputMode="numeric"
                  value={filters.advance}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      advance: e.target.value.replace(/\D/g, ''),
                    }))
                  }
                />
              </th>
              <th>
                <input
                  className="rcm-field"
                  type="text"
                  value={filters.floorNo}
                  onChange={(e) => setFilters((p) => ({ ...p, floorNo: e.target.value }))}
                />
              </th>
              <th>
                <select
                  className="rcm-field"
                  value={filters.carPark}
                  onChange={(e) => setFilters((p) => ({ ...p, carPark: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </th>
              <th>
                <input
                  className="rcm-field"
                  type="date"
                  value={filters.availableFrom}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, availableFrom: e.target.value }))
                  }
                />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="rcm-empty-row" colSpan={10} data-label="">
                  {interested.length === 0
                    ? 'No interested calls in this date range.'
                    : 'No interested calls match the current filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const d = c.interestedDetails || {};
                return (
                  <tr key={c._id}>
                    <td data-label="DATE & TIME">{fmtDateTime(c.createdAt)}</td>
                    <td data-label="AGENT"><strong>{c.agentUsername}</strong></td>
                    <td data-label="NUMBER">{c.number}</td>
                    <td data-label="BHK">{d.bhk || '—'}</td>
                    <td data-label="RENT">{d.rent ? `₹ ${d.rent}` : '—'}</td>
                    <td data-label="ADVANCE">{d.advance ? `₹ ${d.advance}` : '—'}</td>
                    <td data-label="FLOOR">{d.floorNo || '—'}</td>
                    <td data-label="CAR PARK">{d.carPark || '—'}</td>
                    <td data-label="AVAILABLE FROM">{d.availableFrom || '—'}</td>
                    <td data-label="ACTION">
                      <button
                        type="button"
                        className="rcm-btn rcm-btn-sm"
                        onClick={() => setDetailsViewer(c)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DETAILS VIEWER MODAL
   ══════════════════════════════════════════════════════════════ */
function DetailsViewerModal({ call, onClose }) {
  const d = call.interestedDetails || {};
  const fmt = (v) => (v ? String(v) : '—');
  const money = (v) => (v ? `₹ ${v}` : '—');
  return (
    <div className="rcm-modal-overlay" onClick={onClose}>
      <div className="rcm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rcm-modal-title">📋 Interested Property Details</div>
        <div className="rcm-modal-sub">
          Number <strong>{call.number}</strong> · Agent{' '}
          <strong>{call.agentUsername}</strong> · {fmtDateTime(call.createdAt)}
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
