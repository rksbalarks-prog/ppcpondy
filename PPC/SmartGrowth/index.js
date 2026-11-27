// SmartGrowth WhatsApp panel — ported from PM_Matri_Admin's WhatsApp module
// (WhatsappController + AutobotController) to Rent Pondy.
//
// Everything is under /sg/*, mounted at /PPC like the rest of the admin API:
//
//   Communication > WhatsApp
//     Chats ............... routes/chats.js
//     Send Message ........ routes/send.js
//     Templates ........... routes/send.js (list/export) + routes/templateBuilder.js
//     Action Messages ..... routes/actions.js + engine/actions.js
//     Chatbots, Flows ..... routes/chatbots.js
//     Message Status,
//     Recent Campaigns .... routes/status.js
//     Campaign Report ..... routes/report.js + engine/campaignSync.js, engine/report.js
//     Limits & Alerts ..... routes/limits.js
//     Media Library ....... routes/media.js
//   AI & Automation > Autobot
//     WhatsApp Bot ........ routes/autobot.js + engine/broadcast.js
//     Reminder Bot ........ routes/reminder.js + engine/reminder.js
//     New User Bot ........ routes/newuser.js + engine/newUserBot.js
//     WhatsApp Bot Report . routes/botReport.js
//
// Strictly additive: own collections (sg_*), own routes; the older WhatsApp
// screens (Bulk / Single Message, services/whatsapp.js) are untouched.
//
// Wiring, in server.js:
//     import smartGrowth from './SmartGrowth/index.js';
//     app.use('/PPC', smartGrowth);
//     smartGrowth.scheduler.start();   // inside app.listen — asleep unless SMARTGROWTH_RUNNER=1

const express = require('express');
const scheduler = require('./scheduler');

const router = express.Router();

for (const r of ['send', 'chats', 'chatbots', 'templateBuilder', 'status', 'report', 'limits', 'media', 'actions', 'autobot', 'newuser', 'reminder', 'botReport'])
  router.use(require('./routes/' + r));

router.scheduler = scheduler;

module.exports = router;
