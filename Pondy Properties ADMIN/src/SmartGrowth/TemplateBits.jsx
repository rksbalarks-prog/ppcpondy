// The template pieces shared by Send Message, Chats, Templates and the
// Autobot forms: a picker grouped by Meta category, a WhatsApp-style preview,
// the header's file / {{1}}, the body's values, and the blank -> field map
// the bots fill per person.

import React, { useRef, useState } from 'react';
import { Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { sgUpload } from './sgApi';
import { CatBadge } from './common';

export const MEDIA_FORMATS = ['IMAGE', 'VIDEO', 'DOCUMENT'];
export const isApproved = (t) => /^APPROVED/i.test(String(t && t.status));

const CAT_ORDER = ['UTILITY', 'MARKETING', 'AUTHENTICATION'];

/**
 * One select, grouped by category — UTILITY first, because MARKETING is
 * charged at the higher rate and the automated senders keep to UTILITY.
 */
export function TemplatePicker({ templates, value, onChange, approvedOnly = true, utilityOnly = false, placeholder = '— choose a template —', size }) {
  const list = (templates || []).filter((t) => (!approvedOnly || isApproved(t)) && (!utilityOnly || String(t.category).toUpperCase() === 'UTILITY'));
  const groups = {};
  for (const t of list) {
    const c = String(t.category || 'OTHER').toUpperCase();
    (groups[c] = groups[c] || []).push(t);
  }
  const order = [...CAT_ORDER.filter((c) => groups[c]), ...Object.keys(groups).filter((c) => !CAT_ORDER.includes(c))];
  return (
    <Form.Select size={size} value={value || ''} onChange={(e) => onChange(list.find((t) => t.id === e.target.value) || null)}>
      <option value="">{placeholder}</option>
      {order.map((c) => (
        <optgroup key={c} label={c + ' (' + groups[c].length + ')'}>
          {groups[c].sort((a, b) => a.name.localeCompare(b.name)).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.language}{t.variableCount ? ' · ' + t.variableCount + ' var' : ''}{t.headerFormat && t.headerFormat !== 'TEXT' ? ' · ' + t.headerFormat.toLowerCase() : ''}
            </option>
          ))}
        </optgroup>
      ))}
    </Form.Select>
  );
}

/** Text with {{n}} replaced by the values given (highlighted), or left visible when empty. */
function fillVars(text, vals) {
  const parts = String(text || '').split(/(\{\{\s*\d+\s*\}\})/g);
  return parts.map((p, i) => {
    const m = p.match(/^\{\{\s*(\d+)\s*\}\}$/);
    if (!m) return <React.Fragment key={i}>{p}</React.Fragment>;
    const v = vals && vals[Number(m[1]) - 1];
    return <span key={i} className="sg-var">{v ? v : p}</span>;
  });
}

/** How the template will look on the handset. */
export function TemplatePreview({ t, vars, headerVar, mediaUrl }) {
  if (!t) return null;
  const parts = t.parts || { header: t.headerText, body: t.bodyText, footer: '', buttons: [] };
  const fmt = String(t.headerFormat || '').toUpperCase();
  return (
    <div className="sg-phone">
      <div className="sg-bubble">
        {MEDIA_FORMATS.includes(fmt) && (
          mediaUrl && fmt === 'IMAGE'
            ? <img src={mediaUrl} alt="" style={{ maxWidth: '100%', borderRadius: 6, marginBottom: 6 }} />
            : <div className="sg-b-media">{fmt === 'IMAGE' ? '🖼 Picture' : fmt === 'VIDEO' ? '🎬 Video' : '📄 Document'}{mediaUrl ? ' — attached' : ' — needs a file'}</div>
        )}
        {fmt === 'TEXT' && parts.header && <div className="sg-b-head">{fillVars(parts.header, headerVar ? [headerVar] : [])}</div>}
        <div>{fillVars(parts.body, vars)}</div>
        {parts.footer && <div className="sg-b-foot">{parts.footer}</div>}
        {parts.buttons && parts.buttons.length > 0 && (
          <div className="sg-b-btns">
            {parts.buttons.map((b, i) => (
              <div key={i} className="sg-b-btn">
                {b.type === 'URL' ? '🔗 ' : b.type === 'PHONE_NUMBER' ? '📞 ' : b.type === 'FLOW' ? '📝 ' : '↩ '}{b.text || b.type}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="sg-mini mt-2"><CatBadge category={t.category} /> <span className="ms-1">{t.name} · {t.language}{t.id ? ' · id ' + t.id : ''}</span></div>
    </div>
  );
}

/**
 * The header: a file for a picture / video / document header (Meta fetches
 * it from a public link, so it is uploaded to SmartGrowth's library or a
 * public link is pasted), or the value of a text header's {{1}}.
 * value = { mediaUrl, fileName, headerParams: [] }
 */
export function HeaderMediaBox({ t, value, onChange }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState('');
  if (!t) return null;
  const fmt = String(t.headerFormat || '').toUpperCase();
  const v = value || {};
  const set = (patch) => onChange({ ...v, ...patch });

  if (fmt === 'TEXT') {
    if (!/\{\{\s*1\s*\}\}/.test(t.headerText || '')) return null;
    return (
      <Form.Group className="mb-2">
        <Form.Label className="mb-1">Header value <span className="sg-mini">fills the {'{{1}}'} in “{t.headerText}”</span></Form.Label>
        <Form.Control size="sm" value={(v.headerParams || [])[0] || ''} onChange={(e) => set({ headerParams: [e.target.value] })} />
      </Form.Group>
    );
  }
  if (!MEDIA_FORMATS.includes(fmt)) return null;

  const accept = fmt === 'IMAGE' ? 'image/jpeg,image/png' : fmt === 'VIDEO' ? 'video/mp4' : 'application/pdf';
  const upload = async (file) => {
    if (!file) return;
    setErr('');
    setBusy(1);
    const fd = new FormData();
    fd.append('media', file);
    fd.append('headerFormat', fmt);
    try {
      const d = await sgUpload('/upload-media', fd, (p) => setBusy(Math.max(1, p)));
      set({ mediaUrl: d.url, fileName: fmt === 'DOCUMENT' ? (v.fileName || d.fileName) : '' });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="mb-2 p-2" style={{ background: '#f7faf9', borderRadius: 8, border: '1px solid #e3ece9' }}>
      <Form.Label className="mb-1">
        Header {fmt.toLowerCase()} <span className="sg-mini">this template opens with a {fmt.toLowerCase()} — every send names its own file</span>
      </Form.Label>
      <InputGroup size="sm" className="mb-1">
        <Form.Control placeholder="https://… a public link to the file" value={v.mediaUrl || ''} onChange={(e) => set({ mediaUrl: e.target.value.trim() })} />
        <Button variant="outline-success" disabled={!!busy} onClick={() => fileRef.current && fileRef.current.click()}>
          {busy ? <><Spinner size="sm" animation="border" /> {busy}%</> : '⬆ Upload'}
        </Button>
      </InputGroup>
      <input ref={fileRef} type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => upload(e.target.files[0])} />
      {fmt === 'DOCUMENT' && (
        <Form.Control size="sm" className="mb-1" placeholder="File name shown on the handset (optional)" value={v.fileName || ''} onChange={(e) => set({ fileName: e.target.value })} />
      )}
      <div className="sg-mini">
        {fmt === 'IMAGE' ? 'JPG or PNG, up to 5 MB.' : fmt === 'VIDEO' ? 'MP4, up to 16 MB.' : 'PDF, up to 100 MB.'} A Google Drive / Photos link will NOT work — it is a page, not the file.
      </div>
      {err && <div className="text-danger small mt-1">{err}</div>}
    </div>
  );
}

/** One box per body {{n}}, labelled with Meta's own example where there is one. */
export function VarInputs({ t, values, onChange }) {
  if (!t || !t.variableCount) return null;
  const vals = values || [];
  return (
    <div className="mb-2">
      {Array.from({ length: t.variableCount }, (_, i) => (
        <InputGroup size="sm" className="mb-1" key={i}>
          <InputGroup.Text style={{ minWidth: 54 }}>{'{{' + (i + 1) + '}}'}</InputGroup.Text>
          <Form.Control
            placeholder={(t.examples && t.examples[i]) ? 'e.g. ' + t.examples[i] : 'value for {{' + (i + 1) + '}}'}
            value={vals[i] || ''}
            onChange={(e) => { const next = vals.slice(); next[i] = e.target.value; onChange(next); }}
          />
        </InputGroup>
      ))}
    </div>
  );
}

/**
 * For the bots: what each blank is filled with, per person — a field
 * (name, Rent ID...) or fixed text. value = { "1": "first_name", "2": "text:Pondicherry" }
 */
export function VarMapEditor({ count, fields, value, onChange, examples }) {
  if (!count) return <div className="sg-mini mb-2">This template has no blanks to fill.</div>;
  const v = value || {};
  const set = (n, spec) => onChange({ ...v, [String(n)]: spec });
  return (
    <div className="mb-2">
      {Array.from({ length: count }, (_, i) => {
        const n = i + 1;
        const spec = String(v[String(n)] || '');
        const isText = spec.startsWith('text:');
        return (
          <InputGroup size="sm" className="mb-1" key={n}>
            <InputGroup.Text style={{ minWidth: 54 }}>{'{{' + n + '}}'}</InputGroup.Text>
            <Form.Select style={{ maxWidth: 230 }} value={isText ? '__text' : spec} onChange={(e) => set(n, e.target.value === '__text' ? 'text:' : e.target.value)}>
              <option value="">— choose —</option>
              {Object.entries(fields || {}).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              <option value="__text">Fixed text…</option>
            </Form.Select>
            {isText && <Form.Control placeholder={(examples && examples[i]) ? 'e.g. ' + examples[i] : 'the same for everybody'} value={spec.slice(5)} onChange={(e) => set(n, 'text:' + e.target.value)} />}
          </InputGroup>
        );
      })}
    </div>
  );
}
