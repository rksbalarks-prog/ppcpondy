// Tiny dependency-free request-body validator. The project ships no validation
// library (no zod/joi/yup), so rather than add a dependency we use this minimal
// schema checker. Spec per field: { type, required, min, max, maxLen, enum, default }.

function checkField(name, value, rule) {
  if (value === undefined || value === null || value === '') {
    if (rule.required) return { error: `${name} is required` };
    if ('default' in rule) return { value: rule.default };
    return { value: undefined };
  }
  let v = value;
  if (rule.type === 'number') {
    v = Number(v);
    if (!Number.isFinite(v)) return { error: `${name} must be a number` };
    if (rule.min != null && v < rule.min) return { error: `${name} must be >= ${rule.min}` };
    if (rule.max != null && v > rule.max) return { error: `${name} must be <= ${rule.max}` };
  } else if (rule.type === 'string') {
    v = String(v);
    if (rule.maxLen != null && v.length > rule.maxLen) return { error: `${name} too long (max ${rule.maxLen})` };
    if (rule.enum && !rule.enum.includes(v)) return { error: `${name} must be one of ${rule.enum.join(', ')}` };
  } else if (rule.type === 'boolean') {
    v = v === true || v === 'true';
  }
  return { value: v };
}

// Returns { ok, errors: [], value: {} }.
function validate(body = {}, spec = {}) {
  const errors = [];
  const value = {};
  for (const [name, rule] of Object.entries(spec)) {
    const r = checkField(name, body[name], rule);
    if (r.error) errors.push(r.error);
    else if (r.value !== undefined) value[name] = r.value;
  }
  return { ok: errors.length === 0, errors, value };
}

module.exports = { validate };
