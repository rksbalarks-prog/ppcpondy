// Polls SmartGrowth every minute while the bot is switched on (admin page).
// Fail-soft: with no token or the switch off, each tick is a no-op.
//
// Wiring, in server.js (inside app.listen):
//     whatsAppBot.start();
//
// Set WA_BOT_CRON_ENABLED=false on any copy of the backend that must NOT
// answer (a local / staging copy pointed at the live database) - two copies
// polling the same number would still never double-answer (the wamid claim),
// but the local one would be answering live customers.

const cron = require('node-cron');
const { runOnce } = require('./bot');

let task = null;

function start() {
  if (task) return;
  if (String(process.env.WA_BOT_CRON_ENABLED || 'true').toLowerCase() === 'false') {
    console.log('[WhatsAppBot] cron disabled (WA_BOT_CRON_ENABLED=false)');
    return;
  }
  task = cron.schedule('* * * * *', () => {
    runOnce().catch((e) => console.error('[WhatsAppBot] tick failed:', e.message));
  }, { timezone: 'Asia/Kolkata' });
  console.log('[WhatsAppBot] polling every minute (answers only while switched on in the admin)');
}

module.exports = { start };
