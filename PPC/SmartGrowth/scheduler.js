// The SmartGrowth senders that run on their own: Autobot runs, the New User
// Bot and the reminders every minute, the action messages every five.
//
// SENDS NOTHING unless SMARTGROWTH_RUNNER=1 is in PPC/.env. That is PM's
// "which copy is the WhatsApp runner" switch: a laptop pointed at a copy of
// the database, or a second server, must never message real people on its
// own. Exactly one server should carry it. The "Send now" / "Run now" buttons
// work either way — they are a person deciding.
//
// Each job is guarded so a slow minute is skipped rather than overlapped.

const cron = require('node-cron');
const { Broadcast } = require('./engine/broadcast');
const { NewUserBot } = require('./engine/newUserBot');
const { Reminder } = require('./engine/reminder');
const actions = require('./engine/actions');
const { runnerAllowed } = require('./engine/pace');

const LOG = '[SmartGrowth]';
const tasks = [];
const busy = {};

async function guarded(name, fn) {
  if (busy[name]) return;
  busy[name] = true;
  try {
    const out = await fn();
    // Only say something when something happened; an idle minute is not news.
    if (out && out.sent) console.log(LOG, name + ':', out.sent, 'sent.', (out.log || []).join(' ').slice(0, 400));
  } catch (e) {
    console.error(LOG, name, 'failed:', e.message);
  } finally {
    busy[name] = false;
  }
}

function start() {
  if (tasks.length) return;
  if (!runnerAllowed()) {
    console.log(LOG, 'scheduler asleep — SMARTGROWTH_RUNNER is not 1 on this server (manual Send now still works).');
    return;
  }
  const opts = { timezone: 'Asia/Kolkata' };
  tasks.push(cron.schedule('* * * * *', () => guarded('runs', async () => { const b = new Broadcast(); return { sent: await b.run(), log: b.log }; }), opts));
  tasks.push(cron.schedule('* * * * *', () => guarded('newuser', async () => { const b = new NewUserBot(); return { sent: await b.run(), log: b.log }; }), opts));
  tasks.push(cron.schedule('*/2 * * * *', () => guarded('reminder', async () => { const r = new Reminder(); return { sent: await r.run(), log: r.log }; }), opts));
  tasks.push(cron.schedule('*/5 * * * *', () => guarded('actions', () => actions.run()), opts));
  console.log(LOG, 'scheduler armed — runs/new-user every minute, reminders every 2, action messages every 5.');
}

function stop() {
  while (tasks.length) tasks.pop().stop();
}

module.exports = { start, stop };
