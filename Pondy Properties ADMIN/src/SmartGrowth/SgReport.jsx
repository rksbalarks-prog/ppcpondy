// Communication > WhatsApp > Campaign Report — ported from PM_Matri_Admin's
// whatsapp/report (the Power BI-style page).
//
// Every campaign SmartGrowth has sent for this account: delivered, read,
// failed and why. The numbers come from a local copy that is refreshed from
// SmartGrowth when the page opens (read-only calls — it sends nothing and
// costs nothing); the first copy of a big account goes in pieces, so the page
// keeps asking until nothing is left.
//
// Every visual cross-filters the rest: click a bar, a column, a tile or a row
// and the whole page narrows to it; the chips above say what is applied, and
// the filters live in the URL so a filtered report can be linked to.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Form, Row, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { sgGet, sgPost, sgUrl } from './sgApi';
import { SgPage, Msg, Busy, StatusPill, Tiles, Pager, fmtWhen, fmtNum, fmtPhone, downloadUrl } from './common';

const KEYS = ['from', 'to', 'src', 'cid', 'tpl', 'st', 'reason', 'aud', 'replied', 'q'];
const STATUSES = ['read', 'delivered', 'sent', 'queued', 'failed', 'cancelled'];   // bottom of a stack first
const ST_LABEL = { read: 'Read', delivered: 'Delivered', sent: 'Sent', queued: 'Queued', failed: 'Failed', cancelled: 'Cancelled' };
const AUD_LABEL = { member: 'Rent Pondy users', nonmember: 'Not on Rent Pondy', invalid: 'Not a phone number' };
const DAYS = [[2, 'Mon'], [3, 'Tue'], [4, 'Wed'], [5, 'Thu'], [6, 'Fri'], [7, 'Sat'], [1, 'Sun']];   // Mongo $dayOfWeek: 1 = Sunday

/** 'YYYY-MM-DD' in India, `daysAgo` days back. */
const istDay = (daysAgo = 0) => new Date(Date.now() + 330 * 60000 - daysAgo * 86400000).toISOString().slice(0, 10);
const lastOfMonth = (ym) => { const [y, m] = ym.split('-').map(Number); return ym + '-' + String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0'); };

function fromUrl(params) {
  const f = {};
  for (const k of KEYS) f[k] = params.get(k) || '';
  return f;
}

/** The filters as the API reads them — empties dropped, q only where asked. */
function apiParams(f, withQ) {
  const p = {};
  for (const k of KEYS) if (f[k] && (withQ || k !== 'q')) p[k] = f[k];
  return p;
}

/** "▲ 12% vs the period before". */
function Delta({ cur, prev }) {
  if (prev === undefined || prev === null) return null;
  cur = Number(cur) || 0; prev = Number(prev) || 0;
  if (!prev) return cur ? <span style={{ color: '#18703a' }}> ▲ new</span> : null;
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (!pct) return <span style={{ color: '#8a9a95' }}> ▬ same</span>;
  return <span style={{ color: pct > 0 ? '#18703a' : '#a12626' }}> {pct > 0 ? '▲' : '▼'} {Math.abs(pct)}%</span>;
}

/** Horizontal bars, stacked by status, click to filter. */
function StackBars({ rows, onPick, isOn, empty = 'Nothing for these filters.' }) {
  if (!rows || !rows.length) return <div className="sg-mini py-3 text-center">{empty}</div>;
  const max = Math.max(1, ...rows.map((r) => r.total || 0));
  return (
    <div className="sg-bars">
      {rows.map((r) => (
        <div key={r.k} className={'sg-barrow' + (isOn(r) ? ' on' : '')} onClick={() => onPick(r)}
          title={STATUSES.map((s) => ST_LABEL[s] + ': ' + fmtNum(r[s])).join('\n')}>
          <div className="sg-bl">{r.label || r.k}</div>
          <div className="sg-bt">
            {STATUSES.map((s) => (r[s] ? <div key={s} className={'sg-seg-' + s} style={{ width: (r[s] / max) * 100 + '%' }} /> : null))}
          </div>
          <div className="sg-bn">{fmtNum(r.total)}</div>
        </div>
      ))}
    </div>
  );
}

/** Plain single-colour bars. */
function PlainBars({ rows, onPick, isOn, color = '#e05c5c', empty }) {
  if (!rows || !rows.length) return <div className="sg-mini py-3 text-center">{empty || 'Nothing for these filters.'}</div>;
  const max = Math.max(1, ...rows.map((r) => r.n || 0));
  return (
    <div className="sg-bars">
      {rows.map((r) => (
        <div key={r.k} className={'sg-barrow' + (isOn(r) ? ' on' : '')} onClick={() => onPick(r)} title={r.title || r.label || r.k}>
          <div className="sg-bl" style={{ width: 210 }}>{r.label || r.k}</div>
          <div className="sg-bt"><div style={{ width: (r.n / max) * 100 + '%', background: color }} /></div>
          <div className="sg-bn">{fmtNum(r.n)}</div>
        </div>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="d-flex flex-wrap gap-3 sg-mini mb-2">
      {STATUSES.map((s) => <span key={s}><span className={'sg-seg-' + s} style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', marginRight: 4 }} />{ST_LABEL[s]}</span>)}
    </div>
  );
}

const Card = ({ title, sub, children }) => (
  <div className="sg-card h-100" style={{ marginBottom: 0 }}>
    <h4 style={{ fontSize: 14 }}>{title}{sub && <span className="sg-mini fw-normal">{sub}</span>}</h4>
    {children}
  </div>
);

export default function SgReport() {
  const [params, setParams] = useSearchParams();
  const [f, setF] = useState(() => fromUrl(params));
  const pendingName = useRef(params.get('campaign') || '');
  const [qBox, setQBox] = useState(f.q);
  const [sync, setSync] = useState({ busy: false, state: '', message: '', pending: 0, lastSync: 0 });
  const [version, setVersion] = useState(0);
  const [data, setData] = useState(null);
  const [choices, setChoices] = useState({ campaigns: [], templates: [] });
  const [sources, setSources] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [detail, setDetail] = useState(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: 'at', dir: 'desc' });
  const [detailBusy, setDetailBusy] = useState(false);
  const syncing = useRef(false);
  const needChoices = useRef(true);

  const set = useCallback((patch) => { setPage(1); setF((x) => ({ ...x, ...patch })); }, []);
  const toggle = useCallback((k, v) => { setPage(1); setF((x) => ({ ...x, [k]: x[k] === String(v) ? '' : String(v) })); }, []);

  // The filters live in the URL, so a filtered report can be linked to.
  useEffect(() => {
    const next = new URLSearchParams();
    KEYS.forEach((k) => { if (f[k]) next.set(k, f[k]); });
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [f, params, setParams]);

  // ── The copy: refreshed on open, round after round until nothing is left ──
  const runSync = useCallback(async (force) => {
    if (syncing.current) return;
    syncing.current = true;
    setSync((s) => ({ ...s, busy: true, message: 'Copying the latest numbers from SmartGrowth…' }));
    try {
      let first = true;
      for (let round = 0; round < 80; round++) {
        const d = await sgPost('/report/sync', { force: force && first ? '1' : '', cname: pendingName.current });
        first = false;
        if (pendingName.current && d.cid) { set({ cid: d.cid }); pendingName.current = ''; }
        const more = d.state === 'partial' || d.state === 'busy';
        setSync({
          busy: more, state: d.state, pending: d.pending, lastSync: d.lastSync,
          message: d.state === 'partial' ? 'Copying… ' + fmtNum(d.pending) + ' campaign(s) left' : d.state === 'busy' ? 'Another copy is running — waiting…' : d.message,
        });
        if (d.state !== 'fresh' && d.state !== 'busy') { needChoices.current = true; setVersion((v) => v + 1); }
        if (!more) break;
        if (d.state === 'busy') await new Promise((r) => setTimeout(r, 4000));
      }
    } catch (e) {
      setSync((s) => ({ ...s, busy: false, state: 'error', message: e.message }));
    } finally {
      syncing.current = false;
    }
  }, [set]);
  useEffect(() => { runSync(false); }, [runSync]);

  // ── The visuals ──
  const dataKey = JSON.stringify(apiParams(f, false));
  useEffect(() => {
    let alive = true;
    setBusy(true);
    const p = JSON.parse(dataKey);
    if (needChoices.current) p.choices = '1';
    sgGet('/report/data', p)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setSources(d.sources || {});
        if (d.choices) { setChoices(d.choices); needChoices.current = false; }
        setMsg(null);
      })
      .catch((e) => { if (alive) setMsg({ type: 'danger', text: e.message }); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [dataKey, version]);

  // A ?campaign=<name> the sync could not resolve (not copied yet, or the sync failed): try the slicer list.
  useEffect(() => {
    if (!pendingName.current || !choices.campaigns.length) return;
    const hit = choices.campaigns.find((c) => c.name === pendingName.current);
    if (hit) { set({ cid: hit.id }); pendingName.current = ''; }
  }, [choices, set]);

  // ── The detailed view ──
  const rowsKey = JSON.stringify(apiParams(f, true));
  useEffect(() => {
    let alive = true;
    setDetailBusy(true);
    sgGet('/report/rows', { ...JSON.parse(rowsKey), page, sort: sort.key, dir: sort.dir })
      .then((d) => { if (alive) setDetail(d); })
      .catch((e) => { if (alive) setMsg({ type: 'danger', text: e.message }); })
      .finally(() => { if (alive) setDetailBusy(false); });
    return () => { alive = false; };
  }, [rowsKey, page, sort, version]);

  const kpi = (data && data.kpi) || {};
  const prev = data && data.prev;
  const campaignName = useMemo(() => {
    const c = choices.campaigns.find((x) => x.id === f.cid);
    return c ? c.name : (f.cid ? 'campaign ' + f.cid.slice(-6) : '');
  }, [choices, f.cid]);
  const srcList = f.src ? f.src.split(',').filter(Boolean) : [];
  const toggleSrc = (k) => set({ src: (srcList.includes(k) ? srcList.filter((x) => x !== k) : [...srcList, k]).join(',') });

  const quick = (which) => {
    if (which === 'all') set({ from: '', to: '' });
    else if (which === 'today') set({ from: istDay(0), to: istDay(0) });
    else if (which === 'month') set({ from: istDay(0).slice(0, 8) + '01', to: istDay(0) });
    else set({ from: istDay(Number(which) - 1), to: istDay(0) });
  };
  const pickTime = (k) => {
    const day = k.slice(0, 10);
    if (k.length === 7) set({ from: k + '-01', to: lastOfMonth(k) });
    else if (k.length === 13) set({ from: k + ':00', to: k + ':59:59' });   // one hour, India time
    else set({ from: day, to: day });
  };

  // ── Chips: what is applied ──
  const chips = [];
  if (f.from || f.to) chips.push(['Period', (f.from || '…') + ' – ' + (f.to || '…'), { from: '', to: '' }]);
  srcList.forEach((s) => chips.push(['Sent from', sources[s] || s, { src: srcList.filter((x) => x !== s).join(',') }]));
  if (f.cid) chips.push(['Campaign', campaignName, { cid: '' }]);
  if (f.tpl) chips.push(['Template', f.tpl, { tpl: '' }]);
  if (f.st) chips.push(['Status', ST_LABEL[f.st] || f.st, { st: '' }]);
  if (f.reason) chips.push(['Reason', f.reason === '-' ? '(none given)' : f.reason, { reason: '' }]);
  if (f.aud) chips.push(['Audience', AUD_LABEL[f.aud] || f.aud, { aud: '' }]);
  if (f.replied) chips.push(['Only', 'numbers that replied', { replied: '' }]);
  if (f.q) chips.push(['Search', f.q, { q: '' }]);
  const clearAll = () => { setQBox(''); set(Object.fromEntries(KEYS.map((k) => [k, '']))); };

  // ── Time columns ──
  const time = (data && data.time) || [];
  const tMax = Math.max(1, ...time.map((t) => t.total || 0));
  const levelWord = data ? { month: 'by month', day: 'by day', hour: 'by hour' }[data.timeLevel] : '';

  // ── Heatmap ──
  const heat = (data && data.heat) || [];
  const hMax = Math.max(1, ...heat.map((h) => h.n));
  const heatAt = {};
  heat.forEach((h) => { heatAt[h.d + ':' + h.h] = h.n; });

  // ── The matrix, grouped by the page that sent it ──
  const groups = useMemo(() => {
    const g = [];
    for (const c of (data && data.campaigns) || []) {
      let last = g[g.length - 1];
      if (!last || last.source !== c.source) { last = { source: c.source, label: c.sourceLabel, rows: [] }; g.push(last); }
      last.rows.push(c);
    }
    return g;
  }, [data]);
  const [collapsed, setCollapsed] = useState({});

  const sortBy = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  const Th = ({ k, children }) => (
    <th style={{ cursor: 'pointer' }} onClick={() => sortBy(k)}>{children} {sort.key === k ? (sort.dir === 'desc' ? '↓' : '↑') : <span style={{ color: '#b3b0ad' }}>↕</span>}</th>
  );

  const okRead = (Number(kpi.delivered) || 0) + (Number(kpi.read) || 0);
  const bad = (Number(kpi.failed) || 0) + (Number(kpi.cancelled) || 0);
  const rate = (n) => (kpi.total ? Math.round((n / kpi.total) * 100) + '%' : '');

  return (
    <SgPage title="Campaign Report" sub="Every campaign SmartGrowth has sent for this account — delivered, read, failed and why"
      right={<>
        <span className="sg-mini align-self-center" style={{ color: sync.state === 'error' ? '#a12626' : undefined }}>
          {sync.busy ? '⏳ ' : ''}{sync.message}{!sync.busy && sync.lastSync ? ' · copied ' + fmtWhen(sync.lastSync) : ''}
        </span>
        <Button size="sm" variant="outline-success" disabled={sync.busy} onClick={() => runSync(true)}>⟳ Refresh from SmartGrowth</Button>
        <Button size="sm" variant="outline-secondary" onClick={clearAll}>Reset</Button>
        <Button size="sm" variant="outline-secondary" onClick={() => downloadUrl(sgUrl('/report/export', apiParams(f, true)))}>⬇ Export CSV</Button>
      </>}>

      {/* ── Slicers ── */}
      <div className="sg-card">
        <Row className="g-2 align-items-end">
          <Col xl={4} lg={6}>
            <Form.Label className="mb-1 small fw-semibold">Period</Form.Label>
            <div className="d-flex gap-1 flex-wrap mb-1">
              <ButtonGroup size="sm">
                {[['today', 'Today'], ['7', '7 days'], ['30', '30 days'], ['month', 'This month'], ['all', 'All time']].map(([k, l]) => (
                  <Button key={k} variant="outline-secondary" onClick={() => quick(k)}>{l}</Button>
                ))}
              </ButtonGroup>
            </div>
            <div className="d-flex gap-1">
              <Form.Control size="sm" type="date" value={(f.from || '').slice(0, 10)} onChange={(e) => set({ from: e.target.value })} />
              <Form.Control size="sm" type="date" value={(f.to || '').slice(0, 10)} onChange={(e) => set({ to: e.target.value })} />
            </div>
          </Col>
          <Col xl={4} lg={6}>
            <Form.Label className="mb-1 small fw-semibold">Sent from</Form.Label>
            <div className="d-flex flex-wrap gap-1">
              {Object.entries(sources).map(([k, l]) => (
                <Button key={k} size="sm" variant={srcList.includes(k) ? 'success' : 'outline-secondary'} style={{ borderRadius: 14, fontSize: 12 }} onClick={() => toggleSrc(k)}>{l}</Button>
              ))}
            </div>
          </Col>
          <Col xl={4} lg={12}>
            <Row className="g-1">
              <Col sm={6}>
                <Form.Label className="mb-1 small fw-semibold">Campaign</Form.Label>
                <Form.Select size="sm" value={f.cid} onChange={(e) => set({ cid: e.target.value })}>
                  <option value="">All campaigns ({fmtNum(choices.campaigns.length)})</option>
                  {choices.campaigns.map((c) => <option key={c.id} value={c.id}>{c.name} ({fmtNum(c.total)})</option>)}
                </Form.Select>
              </Col>
              <Col sm={6}>
                <Form.Label className="mb-1 small fw-semibold">Template</Form.Label>
                <Form.Select size="sm" value={f.tpl} onChange={(e) => set({ tpl: e.target.value })}>
                  <option value="">All templates</option>
                  {choices.templates.map((t) => <option key={t.name} value={t.name}>{t.name} ({fmtNum(t.n)})</option>)}
                </Form.Select>
              </Col>
              <Col sm={4}>
                <Form.Label className="mb-1 small fw-semibold">Status</Form.Label>
                <Form.Select size="sm" value={f.st} onChange={(e) => set({ st: e.target.value })}>
                  <option value="">All</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{ST_LABEL[s]}</option>)}
                </Form.Select>
              </Col>
              <Col sm={5}>
                <Form.Label className="mb-1 small fw-semibold">Audience</Form.Label>
                <Form.Select size="sm" value={f.aud} onChange={(e) => set({ aud: e.target.value })}>
                  <option value="">Everyone</option>
                  {Object.entries(AUD_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </Form.Select>
              </Col>
              <Col sm={3} className="d-flex align-items-end">
                <Form.Check type="checkbox" id="sg-rep-replied" label="Replied" checked={!!f.replied} onChange={(e) => set({ replied: e.target.checked ? '1' : '' })} />
              </Col>
            </Row>
          </Col>
        </Row>
        <div className="mt-2">
          {chips.length === 0
            ? <span className="sg-mini">No filters — every message in the copy. Click any bar, column, tile or row to narrow the page to it.</span>
            : <>
              {chips.map(([k, v, clear], i) => (
                <span key={i} className="sg-chip"><span><b>{k}:</b> {v}</span><button type="button" title="Remove" onClick={() => { if (clear.q !== undefined) setQBox(''); set(clear); }}>×</button></span>
              ))}
              <Button size="sm" variant="link" className="p-0 align-baseline" onClick={clearAll}>Clear all</Button>
            </>}
        </div>
      </div>

      <Msg msg={msg} />
      {sync.state === 'error' && <div className="sg-banner bad"><div><b>Could not refresh from SmartGrowth</b>{sync.message} The figures below are the last copy.</div></div>}
      {busy && !data && <Busy text="Reading the report…" />}

      {data && (
        <>
          {/* ── KPI cards ── */}
          <Tiles items={[
            { n: kpi.total, l: <>Messages<Delta cur={kpi.total} prev={prev && prev.total} /></> },
            { n: okRead, l: <>Delivered or read {rate(okRead)}<Delta cur={okRead} prev={prev && (prev.delivered || 0) + (prev.read || 0)} /></>, kind: 'good' },
            { n: kpi.read, l: <>Read {rate(kpi.read)}<Delta cur={kpi.read} prev={prev && prev.read} /></>, kind: 'good', onClick: () => toggle('st', 'read'), on: f.st === 'read' },
            { n: bad, l: <>Failed or cancelled {rate(bad)}<Delta cur={bad} prev={prev && (prev.failed || 0) + (prev.cancelled || 0)} /></>, kind: 'bad' },
            { n: kpi.people, l: <>People reached<Delta cur={kpi.people} prev={prev && prev.people} /></> },
            { n: kpi.members, l: 'Rent Pondy users', onClick: () => toggle('aud', 'member'), on: f.aud === 'member' },
            { n: kpi.replied, l: <>Wrote back<Delta cur={kpi.replied} prev={prev && prev.replied} /></>, onClick: () => toggle('replied', '1'), on: !!f.replied },
            { n: kpi.campaigns, l: 'Campaigns' },
          ]} />
          {prev && <div className="sg-mini mb-2">▲▼ compare with the same length of time just before ({prev.from.slice(0, 10)} – {prev.to.slice(0, 10)}).</div>}
          {/* ── Status strip ── */}
          <Tiles items={STATUSES.map((s) => ({
            n: kpi[s] || 0, l: ST_LABEL[s], kind: s === 'read' || s === 'delivered' ? 'good' : s === 'failed' || s === 'cancelled' ? 'bad' : s === 'queued' ? 'wait' : '',
            onClick: () => toggle('st', s), on: f.st === s,
          }))} />

          <Row className="g-3 mb-3">
            <Col lg={8}>
              <Card title="Over time" sub={' ' + (levelWord || '') + ' — click a column to narrow to it'}>
                <Legend />
                {time.length === 0 ? <div className="sg-mini py-4 text-center">No dated messages for these filters.</div> : (
                  <>
                    <div className="sg-cols">
                      {time.map((t) => (
                        <div key={t.k} className="sg-col" onClick={() => pickTime(t.k)}
                          title={t.k + '\n' + fmtNum(t.total) + ' messages\n' + STATUSES.map((s) => ST_LABEL[s] + ': ' + fmtNum(t[s])).join('\n') + '\nReplied: ' + fmtNum(t.replied)}>
                          {STATUSES.map((s) => (t[s] ? <div key={s} className={'sg-seg-' + s} style={{ height: (t[s] / tMax) * 150 }} /> : null))}
                        </div>
                      ))}
                    </div>
                    <div className="d-flex justify-content-between sg-mini mt-1">
                      <span>{time[0].k}</span>
                      {time.length > 2 && <span>{time[Math.floor(time.length / 2)].k}</span>}
                      <span>{time[time.length - 1].k}</span>
                    </div>
                  </>
                )}
              </Card>
            </Col>
            <Col lg={4}>
              <Card title="Who it reached">
                <PlainBars color="#25D366"
                  rows={['member', 'nonmember', 'invalid'].map((k) => ({ k, label: AUD_LABEL[k], n: (data.audience || {})[k] || 0 })).filter((r) => r.n)}
                  isOn={(r) => f.aud === r.k} onPick={(r) => toggle('aud', r.k)} />
                <div className="sg-mini mt-2">A Rent Pondy user is a number that has signed in, listed a property or posted a requirement.</div>
              </Card>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col lg={6}>
              <Card title={data.sourceLevel === 'campaign' ? 'Campaigns of ' + (sources[srcList[0]] || srcList[0]) : 'Sent from'} sub=" — click to filter">
                <StackBars rows={data.bySource}
                  isOn={(r) => (data.sourceLevel === 'campaign' ? f.cid === r.k : srcList.includes(r.k))}
                  onPick={(r) => (data.sourceLevel === 'campaign' ? toggle('cid', r.k) : toggleSrc(r.k))} />
              </Card>
            </Col>
            <Col lg={6}>
              <Card title="Templates" sub=" — the 12 used most">
                <StackBars rows={data.templates} isOn={(r) => f.tpl === r.k} onPick={(r) => toggle('tpl', r.k === '(unknown)' ? '' : r.k)} />
              </Card>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col lg={6}>
              <Card title="Why messages failed" sub=" — failed and cancelled only, in Meta's words">
                <PlainBars rows={(data.reasons || []).map((r) => ({ k: r.k, n: r.n, label: r.k === '-' ? '(no reason given)' : r.k, title: r.k + '\nFailed: ' + fmtNum(r.failed) + ' · Cancelled: ' + fmtNum(r.cancelled) }))}
                  isOn={(r) => f.reason === r.k} onPick={(r) => toggle('reason', r.k)} empty="No failures for these filters." />
              </Card>
            </Col>
            <Col lg={6}>
              <Card title={'When people ' + (data.heatStatus === 'read' ? 'read' : 'got ' + (ST_LABEL[data.heatStatus] || '').toLowerCase())} sub=" — weekday × hour, India time">
                <div className="sg-wrap">
                  <table className="sg-heat">
                    <thead><tr><td style={{ color: '#6b7d78' }} />{Array.from({ length: 24 }, (_, h) => <td key={h} style={{ color: '#6b7d78' }}>{h % 3 === 0 ? h : ''}</td>)}</tr></thead>
                    <tbody>
                      {DAYS.map(([d, name]) => (
                        <tr key={d}>
                          <td style={{ color: '#6b7d78', textAlign: 'right', paddingRight: 4 }}>{name}</td>
                          {Array.from({ length: 24 }, (_, h) => {
                            const n = heatAt[d + ':' + h] || 0;
                            return <td key={h} title={name + ' ' + h + ':00 — ' + fmtNum(n)} style={{ background: n ? `rgba(18,140,126,${0.12 + 0.88 * (n / hMax)})` : '#f0f4f2' }} />;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </Col>
          </Row>

          {/* ── The matrix ── */}
          <div className="sg-card">
            <h4 style={{ fontSize: 14 }}>Campaigns <span className="sg-mini fw-normal">grouped by the page that sent them — click a row to narrow to it</span></h4>
            <div className="sg-wrap" style={{ maxHeight: 420 }}>
              <Table size="sm" hover className="sg-table">
                <thead><tr><th>Campaign</th><th>Template</th><th>By</th><th>First</th><th>Last</th><th className="text-end">Total</th><th className="text-end">Delivered</th><th className="text-end">Read</th><th className="text-end">Failed</th><th className="text-end">Replied</th></tr></thead>
                <tbody>
                  {groups.length === 0 && <tr><td colSpan={10} className="sg-mini text-center py-3">No campaigns for these filters.</td></tr>}
                  {groups.map((g) => {
                    const sum = (k) => g.rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
                    return (
                      <React.Fragment key={g.source}>
                        <tr style={{ background: '#f0f5f3', cursor: 'pointer' }} onClick={() => setCollapsed((c) => ({ ...c, [g.source]: !c[g.source] }))}>
                          <td colSpan={5}><b>{collapsed[g.source] ? '⊞' : '⊟'} {g.label}</b> <span className="sg-mini">{g.rows.length} campaign(s)</span></td>
                          <td className="text-end"><b>{fmtNum(sum('total'))}</b></td><td className="text-end">{fmtNum(sum('delivered'))}</td>
                          <td className="text-end">{fmtNum(sum('read'))}</td><td className="text-end">{fmtNum(sum('failed') + sum('cancelled'))}</td><td className="text-end">{fmtNum(sum('replied'))}</td>
                        </tr>
                        {!collapsed[g.source] && g.rows.map((c) => (
                          <tr key={c.id} className="sg-click" style={f.cid === c.id ? { background: '#e8f8ee' } : null} onClick={() => toggle('cid', c.id)}>
                            <td className="sg-mono" style={{ paddingLeft: 22 }}>{c.name}</td><td>{c.tpl}</td><td>{c.byname}</td>
                            <td className="sg-nowrap">{fmtWhen(c.firstAt)}</td><td className="sg-nowrap">{fmtWhen(c.lastAt)}</td>
                            <td className="text-end">{fmtNum(c.total)}</td><td className="text-end">{fmtNum(c.delivered)}</td><td className="text-end">{fmtNum(c.read)}</td>
                            <td className="text-end" style={{ color: c.failed + c.cancelled ? '#a12626' : undefined }}>{fmtNum(c.failed + c.cancelled)}</td><td className="text-end">{fmtNum(c.replied)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* ── Detailed view ── */}
      <div className="sg-card">
        <h4 style={{ fontSize: 14 }}>Detailed view <span className="sg-mini fw-normal">every message behind the filters</span></h4>
        <form className="sg-bar" onSubmit={(e) => { e.preventDefault(); set({ q: qBox.trim() }); }}>
          <Form.Control size="sm" style={{ width: 300 }} placeholder="A number, or part of a campaign, template or error…" value={qBox} onChange={(e) => setQBox(e.target.value)} />
          <Button size="sm" type="submit" variant="outline-success">🔍 Search</Button>
          {detailBusy && <Busy text="" />}
        </form>
        <div className="sg-wrap">
          <Table size="sm" hover className="sg-table">
            <thead><tr><Th k="at">When</Th><Th k="phone">Number</Th><Th k="status">Status</Th><Th k="reason">Reason</Th><Th k="campaign">Campaign</Th><Th k="template">Template</Th><th>Sent from</th><th>Replied</th></tr></thead>
            <tbody>
              {detail && detail.rows.length === 0 && <tr><td colSpan={8} className="sg-mini text-center py-3">No messages for these filters.</td></tr>}
              {detail && detail.rows.map((r) => (
                <tr key={r.id}>
                  <td className="sg-nowrap">{fmtWhen(r.at)}</td>
                  <td className="sg-nowrap">{/^\d+$/.test(r.phone) ? fmtPhone(r.phone) : r.phone}{r.known ? <span className="sg-mini" title="A Rent Pondy user"> ★</span> : null}</td>
                  <td><StatusPill status={r.status} /></td>
                  <td style={{ maxWidth: 320, color: r.error ? '#a12626' : undefined }}>{r.error}</td>
                  <td className="sg-mono">{r.campaign}</td><td>{r.tpl}</td><td>{r.sourceLabel}</td><td>{r.replied ? '✓' : ''}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        {detail && <Pager page={detail.page} pages={detail.pages} total={detail.total} busy={detailBusy} onPage={setPage} />}
      </div>

      <div className="sg-mini" style={{ lineHeight: 1.6 }}>
        <b>How to read it.</b> <b>Sent</b> = WhatsApp accepted it; <b>Delivered</b> = it reached the phone; <b>Read</b> = it was opened.
        <b> Failed</b> = WhatsApp could not deliver it (not on WhatsApp, blocked, or Meta&apos;s limits). <b>Cancelled</b> = SmartGrowth never sent it
        (no balance, a template or parameter error, not a phone number). <b>Wrote back</b> = the number replied to that campaign.
        The numbers are a copy taken from SmartGrowth when this page opens — read-only, it sends nothing and costs nothing.
      </div>
    </SgPage>
  );
}
