// Communication > WhatsApp > Chatbots — ported from PM_Matri_Admin's
// whatsapp/chatbots.
//
// A chatbot flow answers on its own: it waits for its STARTER — a quick-reply
// button on one of the templates, or a word somebody writes — and replies with
// the steps drawn in SmartGrowth's builder. A DRAFT answers nobody; only a
// PUBLISHED flow is live. There is no delete: SmartGrowth's API has no call
// that removes a flow (and their own trash icon does nothing either).

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form, Modal, Table } from 'react-bootstrap';
import { sgGet, sgPost } from './sgApi';
import { SgPage, Msg, Busy, StatusPill, Pager, fmtWhen } from './common';

const NAME_RE = /^[A-Za-z0-9 _,-]+$/;

export default function SgChatbots() {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [add, setAdd] = useState(null);         // null = closed, { flowName, flowStarter }
  const [addMsg, setAddMsg] = useState(null);
  const [adding, setAdding] = useState(false);

  // Search waits for the typing to stop: every keystroke would be a call to SmartGrowth.
  useEffect(() => { const id = setTimeout(() => { setQuery(q.trim()); setPage(1); }, 400); return () => clearTimeout(id); }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await sgGet('/chatbots', { page, q: query })); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setLoading(false); }
  }, [page, query]);
  useEffect(() => { load(); }, [load]);

  const publish = async (row) => {
    if (!window.confirm('Publish "' + row.name + '"? It starts answering everybody who ' + (row.starter ? 'sends "' + row.starter + '"' : 'triggers it') + ' straight away.')) return;
    setBusyId(row.id); setMsg(null);
    try { const d = await sgPost('/chatbots/publish', { id: row.id }); setMsg({ type: 'success', text: d.message }); load(); }
    catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setBusyId(''); }
  };

  const saveAdd = async () => {
    const name = add.flowName.trim();
    const starter = add.flowStarter.trim();
    if (!name) return setAddMsg({ type: 'warning', text: 'Give the flow a name.' });
    if (!starter) return setAddMsg({ type: 'warning', text: 'Say what starts it.' });
    if (name.length > 100 || starter.length > 100) return setAddMsg({ type: 'warning', text: 'Name and starter are limited to 100 characters each.' });
    if (!NAME_RE.test(name) || !NAME_RE.test(starter)) return setAddMsg({ type: 'warning', text: 'Only letters, numbers, spaces, underscores, commas and dashes are allowed.' });
    setAdding(true); setAddMsg(null);
    try {
      const d = await sgPost('/chatbots', { flowName: name, flowStarter: starter });
      setAdd(null);
      setMsg({ type: 'success', text: d.message + ' It is a DRAFT with no steps yet — open Builder on its row to draw what it says, then Publish.' });
      setPage(1); load();
    } catch (e) { setAddMsg({ type: 'danger', text: e.message }); }
    finally { setAdding(false); }
  };

  const rows = (data && data.rows) || [];
  const builderUrl = data && data.builderUrl;

  return (
    <SgPage title="Chatbots" sub="Flows that answer without anybody typing">
      <div className="sg-card">
        <div className="sg-help">
          Each flow waits for its <b>starter</b> — a quick-reply button on one of your templates, or a word somebody writes — and answers on its own.
          A <b>draft</b> answers nobody; only a <b>published</b> flow is live. The steps themselves are drawn in SmartGrowth&apos;s builder (the Builder button).
          Removing a flow has to go through SmartGrowth — their API offers no way to delete one, and their own dashboard cannot either.
        </div>
        <div className="sg-bar">
          <Form.Control size="sm" style={{ width: 240 }} placeholder="Search by flow name" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button size="sm" variant="outline-success" onClick={load}>⟳ Refresh</Button>
          <span className="sg-grow" />
          {builderUrl && <a className="btn btn-sm btn-outline-secondary" href={builderUrl} target="_blank" rel="noopener noreferrer">Open SmartGrowth ↗</a>}
          <Button size="sm" variant="success" onClick={() => { setAdd({ flowName: '', flowStarter: '' }); setAddMsg(null); }}>➕ Add flow</Button>
        </div>
        <Msg msg={msg} onClose={() => setMsg(null)} />
        {loading && <Busy />}
        <div className="sg-wrap">
          <Table size="sm" hover className="sg-table">
            <thead><tr><th>Flow</th><th>Starter</th><th>Status</th><th>Created</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.name}</b></td>
                  <td>{r.starter ? <span className="sg-mono">{r.starter}</span> : <span className="sg-mini">—</span>}</td>
                  <td><StatusPill status={r.status} /></td>
                  <td className="sg-nowrap">{fmtWhen(r.when, true)}</td>
                  <td className="sg-nowrap">
                    {/^draft$/i.test(r.status) && (
                      <Button size="sm" variant="outline-success" className="me-1" disabled={busyId === r.id} onClick={() => publish(r)}>{busyId === r.id ? 'Publishing…' : 'Publish'}</Button>
                    )}
                    {builderUrl && <a className="btn btn-sm btn-outline-secondary" href={builderUrl} target="_blank" rel="noopener noreferrer">Builder ↗</a>}
                  </td>
                </tr>
              ))}
              {!loading && !rows.length && <tr><td colSpan={5} className="sg-mini text-center py-3">No chatbot flows{query ? ' match "' + query + '"' : ''}.</td></tr>}
            </tbody>
          </Table>
        </div>
        <Pager page={(data && data.page) || page} pages={data && data.pages} total={data && data.total} busy={loading} onPage={setPage} />
      </div>

      <Modal show={!!add} onHide={() => setAdd(null)} centered>
        <Modal.Header closeButton><Modal.Title as="h5">➕ Add a chatbot flow</Modal.Title></Modal.Header>
        <Modal.Body>
          {add && (
            <>
              <Form.Label className="mb-1">Flow name</Form.Label>
              <Form.Control className="mb-2" maxLength={100} placeholder="renew listing" value={add.flowName} onChange={(e) => setAdd({ ...add, flowName: e.target.value })} />
              <Form.Label className="mb-1">Starter <span className="sg-mini">a quick-reply button label, or the word somebody writes</span></Form.Label>
              <Form.Control className="mb-2" maxLength={100} placeholder="Renew Now" value={add.flowStarter} onChange={(e) => setAdd({ ...add, flowStarter: e.target.value })} />
              <div className="sg-mini mb-2">Letters, numbers, spaces, underscores, commas and dashes. The flow arrives as a DRAFT with no steps — it answers nobody until its steps are drawn in the Builder and it is published.</div>
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
