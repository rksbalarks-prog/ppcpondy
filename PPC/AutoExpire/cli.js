// Run the auto-expire job by hand, from the PPC directory:
//
//   node AutoExpire/cli.js                 dry run: print what would expire
//   node AutoExpire/cli.js --items         ... and list every due record
//   node AutoExpire/cli.js --live          really expire (same as the nightly live run)
//
// Uses MONGO_URI from .env, like the server.

require('dotenv').config();
const mongoose = require('mongoose');
const { run } = require('./runner');

const args = new Set(process.argv.slice(2));

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const report = await run({ mode: args.has('--live') ? 'live' : 'dry-run', trigger: 'cli', items: args.has('--items') });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await mongoose.disconnect();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
