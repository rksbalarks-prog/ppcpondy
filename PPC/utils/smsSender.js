// // utils/smsSender.js
// const axios = require('axios');

// const SMS_BASE_URL = process.env.SMS_BASE_URL || 'https://www.smsidea.co.in';
// const SMS_USERNAME = process.env.SMS_USERNAME;
// const SMS_PASSWORD = process.env.SMS_PASSWORD;
// const SMS_SENDER_ID = process.env.SMS_SENDER_ID;

// async function sendOtpSms(mobile, otp) {
//         const message = `Your OTP is : ${otp} Thanks for using PPC Pondy`;

//   const smsUrl = `${SMS_BASE_URL}/smsstatuswithid.aspx`;
//  const params = {
//   mobile: SMS_USERNAME,
//   pass: SMS_PASSWORD,
//   senderid: SMS_SENDER_ID,
//   to: mobile.startsWith('91') ? mobile : `91${mobile}`,
//   msg: message,
//   route: 1,
//   msgtype: 'text',
//   format: 'json',
//   tempid: process.env.DLT_TEMPLATE_ID  // ✅ Add this line
// };

// console.log('Using template ID:', process.env.DLT_TEMPLATE_ID);

//   try {
//     const response = await axios.get(smsUrl, { params });
//     const data = response.data;

//     if (
//       typeof data === 'string' &&
//       data.includes('Message Id')
//     ) {
//       return { success: true, message: `OTP sent successfully. ${data}` };
//     }

//     // In case the API responds with JSON
//     if (data.status && data.status.toLowerCase() === 'success') {
//       return { success: true, message: `OTP sent successfully. Message ID: ${data.messageid}` };
//     }

//     return { success: false, message: `Failed to send OTP: ${JSON.stringify(data)}` };

//   } catch (error) {
//     return { success: false, message: `Error sending OTP: ${error.message}` };
//   }
// }

// module.exports = { sendOtpSms };


// *************************************************************************




























const axios = require('axios');

const SMS_BASE_URL = process.env.SMS_BASE_URL || 'https://www.smsidea.co.in';
const SMS_USERNAME = process.env.SMS_USERNAME;
const SMS_PASSWORD = process.env.SMS_PASSWORD;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID;

// ── DLT message bodies ────────────────────────────────────────────────────
// These must stay byte-identical to the wording registered against the DLT
// template IDs below. SMS IDEA does NOT check content at submit time — it
// answers "1 SMS Sent. Message Id: …" for literally any text — so a mismatch
// is invisible here and gets dropped later by the operator. Keep the copies
// down to one, and allow an env override so the wording can be re-aligned to
// the DLT portal without a code deploy.
const USER_OTP_TEMPLATE =
  process.env.OTP_SMS_TEMPLATE ||
  'Your OTP is : {otp} Thanks for using PPC Pondy';

const ADMIN_OTP_TEMPLATE =
  process.env.ADMIN_OTP_SMS_TEMPLATE ||
  'hi {name} your Pondicherry Matrimony Admin Login OTP {otp} for PPC';

const fillTemplate = (template, vars) =>
  template.replace(/\{(\w+)\}/g, (match, key) =>
    vars[key] === undefined ? match : vars[key]
  );

async function sendOtpSms(mobile, otp, adminName) {
  const message = fillTemplate(ADMIN_OTP_TEMPLATE, { name: adminName, otp });
  const smsUrl = `${SMS_BASE_URL}/smsstatuswithid.aspx`;

  const params = {
    mobile: SMS_USERNAME,
    pass: SMS_PASSWORD,
    senderid: SMS_SENDER_ID,
    to: mobile.startsWith('91') ? mobile : `91${mobile}`,
    msg: message,
    route: 1,
    msgtype: 'text',
    format: 'json',
    tempid: process.env.DLT_TEMPLATE_ID_Admin_Login  // ✅ Add this line
  };

  try {
    const response = await axios.get(smsUrl, { params });
    const data = response.data;

    if (typeof data === 'string' && data.includes('Message Id')) {
      return { success: true, message: `OTP sent successfully. ${data}` };
    }

    if (data.status && data.status.toLowerCase() === 'success') {
      return { success: true, message: `OTP sent successfully. Message ID: ${data.messageid}` };
    }

    return { success: false, message: `Failed to send OTP: ${JSON.stringify(data)}` };

  } catch (error) {
    return { success: false, message: `Error sending OTP: ${error.message}` };
  }
}

// ✅ User-side OTP sender (SMS IDEA) — used by /PPC/send-otp for the user login page.
// Kept separate from the admin sendOtpSms above so each uses its own DLT template/message.
async function sendUserOtpSms(mobile, otp) {
  const message = fillTemplate(USER_OTP_TEMPLATE, { otp });
  const smsUrl = `${SMS_BASE_URL}/smsstatuswithid.aspx`;

  const params = {
    mobile: SMS_USERNAME,
    pass: SMS_PASSWORD,
    senderid: SMS_SENDER_ID,
    to: mobile.startsWith('91') ? mobile : `91${mobile}`,
    msg: message,
    route: 1,
    msgtype: 'text',
    format: 'json',
    tempid: process.env.DLT_TEMPLATE_ID
  };

  try {
    const response = await axios.get(smsUrl, { params });
    const data = response.data;

    if (typeof data === 'string' && data.includes('Message Id')) {
      return { success: true, message: `OTP sent successfully. ${data}` };
    }

    if (data.status && data.status.toLowerCase() === 'success') {
      return { success: true, message: `OTP sent successfully. Message ID: ${data.messageid}` };
    }

    return { success: false, message: `Failed to send OTP: ${JSON.stringify(data)}` };

  } catch (error) {
    return { success: false, message: `Error sending OTP: ${error.message}` };
  }
}

module.exports = { sendOtpSms, sendUserOtpSms };





































































































































