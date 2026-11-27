// Communication > WhatsApp > Flows — ported from PM_Matri_Admin's
// whatsapp/flows.
//
// A flow is a FORM Meta draws inside the chat — text boxes, dropdowns, a
// Submit button — and the answers come back in one piece. Not a Chatbot:
// that is a conversation; this is a questionnaire. A DRAFT can be attached to
// nothing; only a PUBLISHED flow can sit behind a template's form button.
// The screens are drawn in SmartGrowth's builder; everything else is here.
// Publishing is ONE WAY — Meta will not delete a flow that has ever been
// published — so build it before you publish it.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Form, Modal, Table } from 'react-bootstrap';
import { sgGet, sgPost } from './sgApi';
import { SgPage, Msg, Busy, StatusPill } from './common';

const NAME_RE = /^[A-Za-z0-9 _-]+$/;

export default function SgFlows() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [add, setAdd] = useState(null);          // null = closed, { name, category }
  const [addMsg, setAddMsg] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await sgGet('/flows')); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return ((data && data.rows) || []).filter((r) => !ql || r.name.toLowerCase().includes(ql) || String(r.category).toLowerCase().includes(ql));
  }, [data, q]);

  const act = async (row, what) => {
    const sure = what === 'publish'
      ? 'Publish "' + row.name + '"?\n\nPublishing is one way: Meta will never delete a flow that has been published, and its screens can no longer be changed in place.'
      : 'Delete "' + row.name + '"? It cannot be brought back.';
    if (!window.confirm(sure)) return;
    setBusyId(row.id + what); setMsg(null);
    try { const d = await sgPost('/flows/' + what, { id: row.id }); setMsg({ type: 'success', text: d.message }); load(); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setBusyId(''); }
  };

  const saveAdd = async () => {
    const name = add.name.trim();
    if (!name) return setAddMsg({ type: 'warning', text: 'Give the form a name.' });
    if (name.length > 100) return setAddMsg({ type: 'warning', text: 'The name is limited to 100 characters.' });
    if (!NAME_RE.test(name)) return setAddMsg({ type: 'warning', text: 'Only letters, numbers, spaces, underscores and dashes are allowed.' });
    if (!add.category) return setAddMsg({ type: 'warning', text: 'Pick a category.' });
    setAdding(true); setAddMsg(null);
    try {
      const d = await sgPost('/flows', { name, category: add.category });
      setAdd(null);
      setMsg({ type: 'success', text: d.message + ' It is a DRAFT — draw its screens in the Builder, then publish it.' });
      load();
    } catch (e) { setAddMsg({ type: 'danger', text: e.message }); }
    finally { setAdding(false); }
  };

  const categories = (data && data.categories) || [];
  const builderUrl = data && data.builderUrl;

  return (
    <SgPage title="Flows" sub="Forms inside WhatsApp">
      <div className="sg-card">
        <div className="sg-help">
          A flow is a <b>form</b> Meta shows inside the chat — text boxes, dropdowns, a Submit button — and the answers come back in one piece.
          A <b>DRAFT</b> can be attached to nothing; only a <b>PUBLISHED</b> flow can be sent (from a template&apos;s form button).
          The screens themselves are drawn in SmartGrowth&apos;s builder; everything else is here.
          <b> Publishing is one way</b> — Meta will not delete a flow that has ever been published, so build it before you publish it.
        </div>
        <div className="sg-bar">
          <Form.Control size="sm" style={{ width: 240 }} placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button size="sm" variant="outline-success" onClick={load}>⟳ Refresh</Button>
          <span className="sg-grow" />
          {builderUrl && <a className="btn btn-sm btn-outline-secondary" href={builderUrl} target="_blank" rel="noopener noreferrer">Open SmartGrowth ↗</a>}
          <Button size="sm" variant="success" onClick={() => { setAdd({ name: '', category: categories[0] || '' }); setAddMsg(null); }}>➕ Add flow</Button>
        </div>
        <Msg msg={msg} onClose={() => setMsg(null)} />
        {loading && <Busy />}
        <div className="sg-wrap">
          <Table size="sm" hover className="sg-table">
            <thead><tr><th>Form</th><th>Category</th><th>Status</th><th>Why it cannot go live</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => {
                const draft = /^draft$/i.test(r.status);
                return (
                  <tr key={r.id}>
                    <td><b>{r.name}</b><div className="sg-mini sg-mono">{r.id}</div></td>
                    <td>{r.category}</td>
                    <td><StatusPill status={r.status} /></td>
                    <td style={{ maxWidth: 380 }}>
                      {r.errors && r.errors.length
                        ? <ul className="mb-0 ps-3 small text-danger">{r.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                        : <span className="sg-mini">—</span>}
                    </td>
                    <td className="sg-nowrap">
                      {draft && (
                        <Button size="sm" variant="outline-success" className="me-1" disabled={!!busyId} onClick={() => act(r, 'publish')}>{busyId === r.id + 'publish' ? 'Publishing…' : 'Publish'}</Button>
                      )}
                      {builderUrl && <a className="btn btn-sm btn-outline-secondary me-1" href={builderUrl} target="_blank" rel="noopener noreferrer">Builder ↗</a>}
                      {draft && (
                        <Button size="sm" variant="outline-danger" disabled={!!busyId} onClick={() => act(r, 'delete')}>{busyId === r.id + 'delete' ? 'Deleting…' : 'Delete'}</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && !rows.length && <tr><td colSpan={5} className="sg-mini text-center py-3">No flows{q ? ' match "' + q + '"' : ''}.</td></tr>}
            </tbody>
          </Table>
        </div>
        <div className="sg-mini">{rows.length} of {((data && data.rows) || []).length} flow(s)</div>
      </div>

      <Modal show={!!add} onHide={() => setAdd(null)} centered>
        <Modal.Header closeButton><Modal.Title as="h5">➕ Add a flow</Modal.Title></Modal.Header>
        <Modal.Body>
          {add && (
            <>
              <Form.Label className="mb-1">Name</Form.Label>
              <Form.Control className="mb-2" maxLength={100} placeholder="owner_listing_form" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} />
              <Form.Label className="mb-1">Category</Form.Label>
              <Form.Select className="mb-2" value={add.category} onChange={(e) => setAdd({ ...add, category: e.target.value })}>
                {categories.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ').toLowerCase()}</option>)}
              </Form.Select>
              <div className="sg-mini mb-2">Letters, numbers, spaces, underscores and dashes. It arrives as an empty DRAFT — its screens and fields are drawn in the Builder.</div>
              <Msg msg={addMsg} />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAdd(null)}>Cancel</Button>
          <Button variant="success" disabled={adding} onClick={saveAdd}>{adding ? 'Creating…' : 'Create flow'}</Button>
        </Modal.Footer>
      </Modal>
    </SgPage>
  );
}
