// Communication > WhatsApp > Action Messages — ported from PM_Matri_Admin's
// whatsapp/actionMessages, with Rent Pondy's own events.
//
// What an owner or tenant is told on WhatsApp when something happens to their
// own listing or requirement — from the website and the app alike. The
// sending is the backend's scheduler (engine/actions.js); this page only
// decides which actions run, with which template, wording and allowance.

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { sgGet, sgPost } from './sgApi';
import { SgPage, Msg, Busy, fmtWhen, fmtNum, useTemplates } from './common';
import { TemplatePicker, TemplatePreview, VarMapEditor, isApproved } from './TemplateBits';

// What the preview fills in: one made-up event, so the wording can be read
// before anybody real receives it.
const SAMPLE = { toName: 'Ravi Kumar', rentId: 1234, by: '9812345621', price: 15000, area: 'Lawspet' };

const maskSample = (p) => p.slice(0, 2) + 'XXXXXX' + p.slice(8);

function ddmmyyyy() {
  const t = new Date(Date.now() + 330 * 60000);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(t.getUTCDate())}-${p(t.getUTCMonth() + 1)}-${t.getUTCFullYear()}`;
}

/** The same values engine/actions.js fill() gives, for the sample event. */
function sampleValue(spec, a) {
  spec = String(spec || '');
  if (spec.startsWith('text:')) return spec.slice(5);
  switch (spec) {
    case 'to_name': return SAMPLE.toName.split(' ')[0];
    case 'ref': return a.key === 'tenant_added' ? 'RA 56' : 'Rent ID ' + SAMPLE.rentId;
    case 'rent_id': return String(SAMPLE.rentId);
    case 'status': return String(a.status || '')
      .replace(/\{by\}/g, a.anonymous ? 'someone' : maskSample(SAMPLE.by))
      .replace(/\{price\}/g, String(SAMPLE.price))
      .replace(/\{rent_id\}/g, String(SAMPLE.rentId));
    case 'when_date': return ddmmyyyy();
    case 'by_masked': return a.anonymous ? '' : maskSample(SAMPLE.by);
    case 'price': return String(SAMPLE.price);
    case 'area': return SAMPLE.area;
    default: return '';
  }
}

function ActionCard({ a, set, templates, fields, utilityOnly, today }) {
  const t = templates.find((x) => isApproved(x) && x.name.toLowerCase() === String(a.template || '').toLowerCase()) || null;
  const missing = a.template && !t;
  const notUtility = t && utilityOnly && String(t.category).toUpperCase() !== 'UTILITY';
  const count = t ? t.variableCount : 0;
  const vals = Array.from({ length: count }, (_, i) => sampleValue((a.varMap || {})[String(i + 1)], a));
  const c = today || {};

  return (
    <div className="sg-card" style={{ borderLeft: '4px solid ' + (a.on ? '#25D366' : '#d6dedb') }}>
      <div className="d-flex align-items-start gap-3 flex-wrap">
        <Form.Check type="switch" id={'act_' + a.key} checked={!!a.on} onChange={(e) => set({ on: e.target.checked })}
          label={<b style={{ fontSize: 15 }}>{a.label}</b>} />
        <div className="sg-mini" style={{ flex: 1, minWidth: 220 }}>{a.help}</div>
        <div className="sg-mini sg-nowrap">
          Today: <b style={{ color: '#18703a' }}>{fmtNum(c.sent)}</b> sent
          {c.blocked ? <> · <b style={{ color: '#8a5a00' }}>{fmtNum(c.blocked)}</b> held back</> : null}
          {c.failed ? <> · <b style={{ color: '#a12626' }}>{fmtNum(c.failed)}</b> failed</> : null}
        </div>
      </div>
      <Row className="g-3 mt-1">
        <Col lg={6}>
          <Form.Label className="mb-1 small">Template</Form.Label>
          <TemplatePicker size="sm" templates={templates} value={t && t.id} utilityOnly={utilityOnly}
            onChange={(x) => set({ template: x ? x.name : '' })} placeholder="— no template: this action sends nothing —" />
          {missing && <div className="text-danger small mt-1">“{a.template}” is not an approved template on SmartGrowth — nothing is sent until another is chosen.</div>}
          {notUtility && <div className="text-danger small mt-1">“{t.name}” is filed {t.category} — only UTILITY templates are sent.</div>}
          <Row className="g-2 mt-1">
            <Col sm={4}>
              <Form.Label className="mb-1 small">Per day <span className="sg-mini">per person</span></Form.Label>
              <Form.Control size="sm" type="number" min={0} max={20} value={a.cap} onChange={(e) => set({ cap: e.target.value })} />
            </Col>
            <Col sm={8}>
              <Form.Label className="mb-1 small">Status line <span className="sg-mini">fills a blank set to “The Status line”</span></Form.Label>
              <Form.Control size="sm" maxLength={120} value={a.status} onChange={(e) => set({ status: e.target.value })} />
            </Col>
          </Row>
          {a.anonymous && <div className="sg-mini mt-1">This action never says who did it — {'{by}'} is left out even if the wording has it.</div>}
          {t && (
            <div className="mt-2">
              <Form.Label className="mb-1 small">What fills each blank</Form.Label>
              <VarMapEditor count={count} fields={fields} value={a.varMap} onChange={(m) => set({ varMap: m })} examples={t.examples} />
            </div>
          )}
        </Col>
        <Col lg={6}>
          {t ? (
            <>
              <div className="sg-mini mb-1">Preview with a made-up event (owner Ravi, Rent ID {SAMPLE.rentId}, tenant {maskSample(SAMPLE.by)}):</div>
              <TemplatePreview t={t} vars={vals} />
            </>
          ) : (
            <div className="sg-mini mt-4">Choose a template to see what the message will say.</div>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default function SgActionMessages() {
  const tpl = useTemplates();
  const [data, setData] = useState(null);
  const [actions, setActions] = useState([]);
  const [on, setOn] = useState(false);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await sgGet('/actions');
      setData(d);
      setActions(d.actions || []);
      setOn(!!(d.settings && d.settings.actionOn));
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setOne = (key, patch) => setActions((list) => list.map((a) => (a.key === key ? { ...a, ...patch } : a)));

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const body = { actionOn: on, actions: {} };
      for (const a of actions) {
        body.actions[a.key] = { on: !!a.on, template: a.template || '', cap: Number(a.cap) || 0, status: a.status || '', varMap: a.varMap || {} };
      }
      const d = await sgPost('/actions', body);
      setMsg({ type: 'success', text: d.message });
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setSaving(false); }
  };

  const checkNow = async () => {
    setRunning(true); setMsg(null);
    try {
      const d = await sgPost('/actions/run', {});
      setMsg({ type: 'info', text: d.message });
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    finally { setRunning(false); }
  };

  const s = (data && data.settings) || {};

  return (
    <SgPage title="Action Messages" sub="What an owner or tenant is told when something happens on their listing — website and app alike">
      {data && !s.runner && (
        <div className="sg-banner warn">
          <div>
            <b>Automatic sending is off on this server</b>
            Set <span className="sg-mono">SMARTGROWTH_RUNNER=1</span> in the backend .env (on one server only) for these to go out by
            themselves every few minutes. <b>Check now</b> below still works.
          </div>
        </div>
      )}
      <div className="sg-card">
        <h4>🔔 Action messages</h4>
        <Msg msg={msg} onClose={() => setMsg(null)} />
        {!data ? <Busy /> : (
          <Row className="g-3">
            <Col md={6}>
              <Form.Check type="switch" id="sgActOn" checked={on} onChange={(e) => setOn(e.target.checked)} label={<b>Send action messages</b>} />
              <div className="sg-mini">The master switch. Off means none of the actions below run, whatever they are set to.</div>
              <div className="sg-mini mt-2">{s.actionRan ? 'Last checked for new events ' + fmtWhen(s.actionRan) + '.' : 'Not checked yet.'}</div>
            </Col>
            <Col md={6}>
              <div className="sg-mini">
                {s.capEnabled
                  ? <>Nobody gets more than <b>{s.capAction}</b> action message(s) a day from all of these together — set on </>
                  : <>The overall daily limit is switched <b>off</b> on </>}
                <Link to="/dashboard/sg-limits">Limits &amp; Alerts</Link>. A per-action allowance above it is starved by it.
              </div>
            </Col>
          </Row>
        )}
        <div className="sg-help mt-3 mb-0">
          <b>Per day</b> is this action&apos;s own allowance per person (0 = only the overall limit applies). In a
          {' '}<b>Status</b> line, <code>{'{by}'}</code> becomes the other person&apos;s number masked (98XXXXXX21),
          {' '}<code>{'{price}'}</code> the offered rent, <code>{'{rent_id}'}</code> the Rent ID.
          {data && data.utilityOnly ? <> Only templates Meta filed as <b>UTILITY</b> are sent — MARKETING is charged at the higher rate.</> : null}
          {' '}Each event is told once: a second view by the same tenant sends nothing.{' '}
          <b>Switching an action on for the first time sends nothing for what already happened</b> — only events from
          then on, and never anything older than 48 hours.
        </div>
      </div>

      {tpl.error && <Msg msg={{ type: 'danger', text: 'Templates: ' + tpl.error }} />}
      {tpl.loading && <Busy text="Loading templates…" />}
      {data && actions.map((a) => (
        <ActionCard key={a.key} a={a} set={(p) => setOne(a.key, p)} templates={tpl.templates} fields={data.fields}
          utilityOnly={!!data.utilityOnly} today={(data.actionToday || {})[a.key]} />
      ))}

      {data && (
        <div className="d-flex gap-2 flex-wrap mb-4">
          <Button variant="success" disabled={saving} onClick={save}>💾 Save action messages</Button>
          <Button variant="outline-secondary" onClick={load}>⟳ Refresh</Button>
          <Button variant="outline-success" disabled={running || !s.actionOn} onClick={checkNow}
            title={s.actionOn ? 'Look for new events now and send them' : 'Switch on and save first'}>
            {running ? 'Checking…' : '▶ Check now'}
          </Button>
        </div>
      )}
    </SgPage>
  );
}
