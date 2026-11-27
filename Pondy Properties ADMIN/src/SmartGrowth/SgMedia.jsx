// Communication > WhatsApp > Media Library — ported from PM_Matri_Admin's
// whatsapp/media.
//
// Every file this account has put on SmartGrowth. WhatsApp fetches a header
// picture from a public link, so each banner and chat photo was uploaded to
// SmartGrowth's server — and stays there, public, until someone deletes it.
// Their own page deletes one at a time; this deletes in bulk, in chunks, with
// a Stop button. A file a running or paused Autobot run / New User Bot list
// still sends is locked.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { sgGet, sgPost } from './sgApi';
import { SgPage, Msg, Busy, Tiles, fmtWhen, fmtNum } from './common';

const PER_PAGE = 60;
const KIND_LABEL = { image: 'Pictures', video: 'Videos', document: 'Documents', other: 'Other files' };
const KIND_ICON = { image: '🖼', video: '🎬', document: '📄', other: '📦' };

function niceBytes(n) {
  n = Number(n) || 0;
  if (n >= 1073741824) return (Math.round((n / 1073741824) * 10) / 10) + ' GB';
  if (n >= 1048576) return (Math.round((n / 1048576) * 10) / 10) + ' MB';
  if (n >= 1024) return Math.round(n / 1024) + ' KB';
  return n + ' B';
}

export default function SgMedia() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [kind, setKind] = useState('');
  const [age, setAge] = useState(0);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState(() => new Set());
  const [confirm, setConfirm] = useState(false);
  const [prog, setProg] = useState(null);           // { done, total, ok, bad }
  const stopRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setMsg(null);
    try {
      const d = await sgGet('/media');
      setData(d);
      setSel(new Set());
      if (d.missed) setMsg({ type: 'warning', text: d.missed + ' page(s) of the library could not be read this time — some files may be missing from the list. Refresh to try again.' });
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => (data && data.rows) || [], [data]);
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  const matching = useMemo(() => {
    const cutoff = age > 0 ? Date.now() - age * 86400000 : 0;
    const s = q.trim().toLowerCase();
    return rows.filter((r) => (!kind || r.kind === kind)
      && (!cutoff || (r.at && new Date(r.at).getTime() < cutoff))
      && (!s || r.name.toLowerCase().includes(s)));
  }, [rows, kind, age, q]);

  useEffect(() => { setPage(1); }, [kind, age, q]);

  const pages = Math.max(1, Math.ceil(matching.length / PER_PAGE));
  const shown = matching.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const selectable = (r) => !r.use;

  const counts = useMemo(() => {
    const c = { image: 0, video: 0, document: 0, other: 0 };
    let size = 0;
    for (const r of rows) { c[r.kind] = (c[r.kind] || 0) + 1; size += r.size || 0; }
    return { c, size };
  }, [rows]);

  const toggle = (id) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const pageAll = shown.filter(selectable);
  const pageAllOn = pageAll.length > 0 && pageAll.every((r) => sel.has(r.id));
  const togglePage = () => setSel((s) => {
    const n = new Set(s);
    if (pageAllOn) pageAll.forEach((r) => n.delete(r.id)); else pageAll.forEach((r) => n.add(r.id));
    return n;
  });
  const selectMatching = () => setSel(new Set(matching.filter(selectable).map((r) => r.id)));

  const selected = [...sel].map((id) => byId.get(id)).filter(Boolean);
  const selCounts = selected.reduce((m, r) => { m[r.kind] = (m[r.kind] || 0) + 1; return m; }, {});
  const selSize = selected.reduce((a, r) => a + (r.size || 0), 0);

  const doDelete = async () => {
    setConfirm(false);
    const items = selected.map((r) => ({ id: r.id, url: r.url, name: r.name }));
    const per = (data && data.maxPerRequest) || 50;
    stopRef.current = false;
    let ok = 0; let bad = 0; const fails = [];
    setProg({ done: 0, total: items.length, ok, bad });
    try {
      for (let i = 0; i < items.length; i += per) {
        if (stopRef.current) break;
        const d = await sgPost('/media/delete', { items: items.slice(i, i + per) });
        ok += d.deleted; bad += d.failed;
        for (const r of d.results || []) if (!r.ok) fails.push((byId.get(r.id) || {}).name + ': ' + r.message);
        setProg({ done: Math.min(items.length, i + per), total: items.length, ok, bad });
      }
      setMsg({
        type: bad ? 'warning' : 'success',
        text: (stopRef.current ? 'Stopped. ' : '') + fmtNum(ok) + ' file(s) deleted' + (bad ? ', ' + fmtNum(bad) + ' not:\n' + fails.slice(0, 10).join('\n') : '.'),
      });
    } catch (e) {
      setMsg({ type: 'danger', text: e.message + (ok ? ' (' + fmtNum(ok) + ' were deleted before this.)' : '') });
    } finally {
      setProg(null);
      load();
    }
  };

  return (
    <SgPage title="Media Library" sub="Files this account has put on SmartGrowth — anyone with a file's link can open it">
      <div className="sg-card">
        <h4>🖼 On SmartGrowth now</h4>
        <div className="sg-help">
          WhatsApp fetches a header picture, video or PDF from a public link, so every banner and every photo sent from
          Chats was uploaded to SmartGrowth — and stays there, public, until it is deleted. Deleting here removes the
          <b> file itself</b>: its link stops working straight away, and it cannot be brought back. A file that a
          running or paused Autobot run or New User Bot list still sends is <b>🔒 locked</b> — stop or finish that first.
        </div>
        <Msg msg={msg} onClose={() => setMsg(null)} />
        {loading && <Busy text="Reading the whole library from SmartGrowth…" />}
        {data && (
          <>
            <Tiles items={[
              { n: data.total, l: 'Files in all · ' + niceBytes(counts.size), onClick: () => setKind(''), on: kind === '' },
              ...Object.keys(KIND_LABEL).filter((k) => counts.c[k]).map((k) => ({
                n: counts.c[k], l: KIND_ICON[k] + ' ' + KIND_LABEL[k], onClick: () => setKind(kind === k ? '' : k), on: kind === k,
              })),
            ]} />
            {data.deleted && (
              <div className="sg-mini">
                This panel has deleted {fmtNum(data.deleted.count)} file(s) so far — the latest {fmtWhen(data.deleted.at, true)}{data.deleted.by ? ' by ' + data.deleted.by : ''}.
              </div>
            )}
          </>
        )}
      </div>

      <div className="sg-card">
        <div className="sg-bar">
          <Form.Select size="sm" style={{ width: 200 }} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All files</option>
            {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Form.Select>
          <Form.Select size="sm" style={{ width: 200 }} value={age} onChange={(e) => setAge(Number(e.target.value))}>
            <option value={0}>Uploaded any time</option>
            <option value={1}>Older than 1 day</option>
            <option value={7}>Older than 7 days</option>
            <option value={30}>Older than 30 days</option>
          </Form.Select>
          <Form.Control size="sm" style={{ width: 220 }} placeholder="Search file name…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button size="sm" variant="outline-secondary" disabled={loading} onClick={load}>⟳ Refresh</Button>
          <span className="sg-mini">{fmtNum(matching.length)} matching</span>
        </div>

        <div className="sg-bar" style={{ borderTop: '1px solid #eef2f1', paddingTop: 8 }}>
          <Form.Check type="checkbox" id="sgMedPage" label="This page" checked={pageAllOn} disabled={!pageAll.length} onChange={togglePage} />
          <Button size="sm" variant="outline-secondary" disabled={!matching.length} onClick={selectMatching}>Select all matching</Button>
          <Button size="sm" variant="link" disabled={!sel.size} onClick={() => setSel(new Set())}>Clear selection</Button>
          <span className="sg-mini">{sel.size ? fmtNum(sel.size) + ' selected · ' + niceBytes(selSize) : 'Nothing selected'}</span>
          <span className="sg-grow" />
          <Button size="sm" variant="danger" disabled={!sel.size || !!prog} onClick={() => setConfirm(true)}>🗑 Delete selected</Button>
        </div>

        {prog && (
          <div className="mb-3">
            <div className="sg-progress"><div style={{ width: (prog.done / Math.max(1, prog.total)) * 100 + '%', background: '#e05c5c' }} /></div>
            <div className="sg-mini mt-1 d-flex align-items-center gap-2">
              {fmtNum(prog.done)} of {fmtNum(prog.total)} · {fmtNum(prog.ok)} deleted{prog.bad ? ' · ' + fmtNum(prog.bad) + ' not' : ''}
              <Button size="sm" variant="outline-secondary" onClick={() => { stopRef.current = true; }}>■ Stop</Button>
            </div>
          </div>
        )}

        {data && !matching.length && <div className="sg-mini">No file matches.</div>}
        <div className="sg-med-grid">
          {shown.map((r) => {
            const on = sel.has(r.id);
            return (
              <div key={r.id} className={'sg-med' + (on ? ' sel' : '')} title={r.use ? 'Locked: ' + r.use + ' still sends it.' : r.name}
                onClick={() => selectable(r) && toggle(r.id)} style={{ cursor: selectable(r) ? 'pointer' : 'not-allowed' }}>
                {selectable(r) && (
                  <Form.Check className="sg-med-check" type="checkbox" checked={on} onChange={() => toggle(r.id)} onClick={(e) => e.stopPropagation()} aria-label={'Select ' + r.name} />
                )}
                {r.use && <span className="sg-med-lock">🔒 in use</span>}
                <div className="sg-med-thumb">
                  {r.kind === 'image' && r.url
                    ? <img src={r.url} alt={r.name} loading="lazy" />
                    : <span style={{ fontSize: 34 }}>{KIND_ICON[r.kind] || '📦'}</span>}
                </div>
                <div className="sg-med-info">
                  <div className="sg-med-name">{r.name || '(no name)'}</div>
                  <div className="sg-mini">{niceBytes(r.size)} · {fmtWhen(r.at)}</div>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="sg-mini" onClick={(e) => e.stopPropagation()}>open ↗</a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {pages > 1 && (
          <div className="d-flex align-items-center gap-2 mt-3 sg-mini">
            <Button size="sm" variant="outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</Button>
            <span>Page {page} of {pages}</span>
            <Button size="sm" variant="outline-secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next ›</Button>
          </div>
        )}
      </div>

      <Modal show={confirm} onHide={() => setConfirm(false)} centered>
        <Modal.Header closeButton><Modal.Title as="h5">🗑 Delete from SmartGrowth?</Modal.Title></Modal.Header>
        <Modal.Body>
          <Tiles items={[
            { n: selected.length, l: 'Files · ' + niceBytes(selSize), kind: 'bad' },
            ...Object.entries(selCounts).map(([k, n]) => ({ n, l: KIND_ICON[k] + ' ' + (KIND_LABEL[k] || k) })),
          ]} />
          <p className="mb-2">
            These files are removed from SmartGrowth&apos;s server for good. Their links stop working at once and
            <b> this cannot be undone</b> — any message that still points at one shows an empty header.
          </p>
          <div className="sg-banner warn mb-0">
            <div>
              <b>Only delete what you know is Rent Pondy&apos;s</b>
              If this SmartGrowth account is shared with another business, their files are here too — and this panel
              cannot see which of theirs are still in use.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={doDelete}>🗑 Delete {fmtNum(selected.length)} file(s)</Button>
        </Modal.Footer>
      </Modal>
    </SgPage>
  );
}
