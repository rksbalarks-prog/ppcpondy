/**
 * Resolve the list of OTP recipient phone numbers for an office.
 *
 * Source of truth is the `OtpNumber` collection, editable from the admin
 * panel (OTP Numbers page). When an office has NO active rows configured in
 * the DB, we fall back to the legacy static list in `officeMobileMap.js` so
 * admin OTP login keeps working out-of-the-box and can never be fully locked
 * out by clearing the panel.
 */
const OtpNumber = require('../Otp/OtpNumberModel');
const officeMobileMap = require('./officeMobileMap');

async function getOfficeOtpNumbers(officeName) {
  const office = officeName || 'ADMIN';
  try {
    const docs = await OtpNumber.find({ officeName: office, active: true });
    if (docs.length > 0) {
      return docs.map((d) => d.mobile);
    }
  } catch (e) {
    // On any DB error, fall through to the static list below so login still works.
  }
  return Array.isArray(officeMobileMap[office]) ? officeMobileMap[office] : [];
}

module.exports = { getOfficeOtpNumbers };
