// Three new, self-contained collections. Nothing here alters an existing schema.
//
//   auto_expire_settings  one document: the mode saved from POST /auto-expire/mode
//   auto_expire_runs      one document per run: counts + a sample of what was due
//   auto_expire_log       one document per record this job actually expired; also
//                         remembers when an admin restored it, so the job gives a
//                         restored record a fresh period instead of re-expiring it
//                         the next night

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'settings' },
    mode: { type: String, enum: ['off', 'dry-run', 'live'] },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true, collection: 'auto_expire_settings' }
);

const runSchema = new mongoose.Schema(
  {
    mode: String, // 'dry-run' | 'live'
    trigger: String, // 'cron' | 'manual' | 'cli' | 'preview'
    startedAt: Date,
    finishedAt: Date,
    ok: Boolean,
    error: String,
    rules: mongoose.Schema.Types.Mixed, // the day counts in force
    summary: mongoose.Schema.Types.Mixed, // per kind: counts
    sample: mongoose.Schema.Types.Mixed, // per kind: first N due items
  },
  { collection: 'auto_expire_runs' }
);
runSchema.index({ startedAt: -1 });

const logSchema = new mongoose.Schema(
  {
    kind: String, // 'property' | 'assistance'
    key: String, // ppcId / ba_id as a string
    recordId: mongoose.Schema.Types.ObjectId,
    rule: String, // 'general' | 'adex' | 'assistance'
    days: Number,
    previousStatus: String,
    clockStart: Date,
    dueAt: Date,
    expiredAt: Date,
    runId: mongoose.Schema.Types.ObjectId,
    restoredSeenAt: { type: Date, default: null },
  },
  { collection: 'auto_expire_log' }
);
logSchema.index({ kind: 1, key: 1, expiredAt: -1 });

module.exports = {
  AutoExpireSettings: mongoose.model('AutoExpireSettings', settingsSchema),
  AutoExpireRun: mongoose.model('AutoExpireRun', runSchema),
  AutoExpireLog: mongoose.model('AutoExpireLog', logSchema),
};
