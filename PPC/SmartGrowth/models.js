// SmartGrowth WhatsApp panel — every collection it owns.
//
// Ported from PM_Matri_Admin (pm_whatsapp_* tables). All new collections, all
// prefixed sg_, so nothing here can collide with the older WhatsApp code
// (PM, PMBulk, BulkWhatsapp, SingleSendWhatsapp) that is still in use.
//
//   sg_settings         one document: credentials, daily caps, action messages,
//                       "sending stopped" health state
//   sg_campaign_logs    every send made from Send Message / Chats
//   sg_chat_logs        every hand-typed reply, with who typed it
//   sg_chat_media       links to photos we sent into a chat (SmartGrowth keeps
//                       only the caption)
//   sg_send_logs        ONE row per message per number, every sender — what the
//                       daily caps count, and the claim (eventKey) that stops a
//                       bot sending the same thing twice
//   sg_blocks           numbers that asked us to stop
//   sg_cstats/sg_cmsgs  the local copy behind Campaign Report
//   sg_media_deletes    who deleted which file from SmartGrowth's library
//   sg_runs             Autobot > WhatsApp Bot runs (a filter left switched on)
//   sg_nu_lists/numbers Autobot > New User Bot uploaded lists
//   sg_reminders, sg_followup_settings, sg_followups, sg_reminder_logs
//                       Autobot > Reminder Bot

const mongoose = require('mongoose');

const { Schema } = mongoose;
const model = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

const SettingsSchema = new Schema({
  key:          { type: String, default: 'main', unique: true },
  baseUrl:      { type: String, default: '' },
  apiToken:     { type: String, default: '' },
  apiCode:      { type: String, default: '' },
  // Limits & Alerts
  capEnabled:   { type: Boolean, default: true },
  capCampaign:  { type: Number, default: 1 },
  capAction:    { type: Number, default: 2 },
  // Action Messages
  actionEnabled:   { type: Boolean, default: false },
  actionConfig:    { type: Schema.Types.Mixed, default: {} },
  actionCheckedAt: { type: Date, default: null },
  actionMarks:     { type: Schema.Types.Mixed, default: {} },
  // WhatsappHealth — sending stopped because the account itself is failing
  sendDownSince:  { type: Date, default: null },
  sendDownReason: { type: String, default: '' },
  sendProbeAt:    { type: Date, default: null },
  // Campaign Report — when the local copy was last refreshed
  reportSyncedAt: { type: Date, default: null },
  updatedBy:      { type: String, default: '' },
}, { timestamps: true });

const CampaignLogSchema = new Schema({
  templateId:    String,
  templateName:  String,
  campaignName:  { type: String, index: true },
  phoneNumbers:  [String],
  phoneCount:    Number,
  variables:     Schema.Types.Mixed,
  httpCode:      Number,
  status:        String,             // success | failed
  response:      String,
  createdByName: String,
}, { timestamps: true });

const ChatLogSchema = new Schema({
  phone:         { type: String, index: true },
  message:       String,
  httpCode:      Number,
  status:        String,
  response:      String,
  createdByName: String,
}, { timestamps: true });

const ChatMediaSchema = new Schema({
  wamid:         String,
  phone:         { type: String, index: true },
  url:           String,
  mime:          String,
  fileName:      String,
  caption:       String,
  sentAt:        Date,
  createdByName: String,
}, { timestamps: true });

const SendLogSchema = new Schema({
  phone:         { type: String, index: true },     // 91XXXXXXXXXX
  kind:          { type: String, index: true },     // campaign | action | chat | bcast | newuser | reminder
  eventKey:      { type: String },
  templateName:  String,
  campaignName:  String,
  refId:         String,                            // run / list / property id — whatever the sender works from
  status:        { type: String, index: true },     // sending | sent | failed | blocked | held
  httpCode:      Number,
  detail:        String,
  createdByName: String,
}, { timestamps: true });
SendLogSchema.index({ eventKey: 1 }, { unique: true, partialFilterExpression: { eventKey: { $type: 'string' } } });
SendLogSchema.index({ phone: 1, kind: 1, status: 1, createdAt: -1 });
SendLogSchema.index({ kind: 1, refId: 1, status: 1 });   // a run's / list's own rows, asked every minute
SendLogSchema.index({ createdAt: -1 });

const BlockSchema = new Schema({
  phone:         { type: String, unique: true },     // last ten digits
  source:        String,
  note:          String,
  createdByName: String,
}, { timestamps: true });

const CStatSchema = new Schema({
  campaignName:  { type: String, unique: true },
  source:        { type: String, default: 'site', index: true },
  templateName:  String,
  createdByName: String,
  firstAt:       Date,
  lastAt:        Date,
  queued:        { type: Number, default: 0 },
  sent:          { type: Number, default: 0 },
  delivered:     { type: Number, default: 0 },
  read:          { type: Number, default: 0 },
  failed:        { type: Number, default: 0 },
  cancelled:     { type: Number, default: 0 },
  total:         { type: Number, default: 0 },
  replied:       { type: Number, default: 0 },
  statsKey:      String,
  msgKey:        String,
  statsAt:       Date,
  msgsAt:        Date,
}, { timestamps: true });

const CMsgSchema = new Schema({
  campaignId:   { type: Schema.Types.ObjectId, index: true },
  // Copied from the campaign so the report can filter without a join.
  campaignName: String,
  source:       { type: String, index: true },
  phone:        String,
  last10:       { type: String, index: true },
  status:       { type: String, index: true },
  templateName: String,
  error:        String,
  reason:       String,
  at:           { type: Date, index: true },
  replied:      { type: Boolean, default: false },
  known:        { type: Boolean, default: false },  // the number is a Rent Pondy user
});
CMsgSchema.index({ campaignId: 1, status: 1 });

const MediaDeleteSchema = new Schema({
  mediaId:       String,
  fileName:      String,
  url:           String,
  result:        String,
  deletedByName: String,
}, { timestamps: true });

const RunSchema = new Schema({
  name:          String,
  segment:       { type: String, default: 'all' },
  plan:          { type: String, default: '' },     // '' | free | paid
  onlyPhone:     { type: String, default: '' },     // a test run to one number
  templateId:    String,
  templateName:  String,
  varMap:        { type: Schema.Types.Mixed, default: {} },
  mediaUrl:      { type: String, default: '' },
  fileName:      { type: String, default: '' },
  headerParams:  [String],
  dailyQuota:    { type: Number, default: 50 },
  sendDelay:     { type: Number, default: 0 },
  hourFrom:      { type: Number, default: 9 },
  hourTo:        { type: Number, default: 20 },
  status:        { type: String, default: 'paused', index: true },   // running | paused
  sentToday:     { type: Number, default: 0 },
  quotaDate:     { type: String, default: '' },
  sentCount:     { type: Number, default: 0 },
  failedCount:   { type: Number, default: 0 },
  skippedCount:  { type: Number, default: 0 },
  lastSentAt:    Date,
  lastRunAt:     Date,
  lastDetail:    String,
  createdByName: String,
}, { timestamps: true });

const NuListSchema = new Schema({
  name:          String,
  fileName:      String,
  templateId:    String,
  templateName:  String,
  headerFormat:  String,
  mediaUrl:      { type: String, default: '' },
  varCount:      { type: Number, default: 0 },
  varMap:        { type: Schema.Types.Mixed, default: {} },
  nameFallback:  { type: String, default: '' },
  hourFrom:      { type: Number, default: 9 },
  hourTo:        { type: Number, default: 20 },
  sendDelay:     { type: Number, default: 0 },
  dailyQuota:    { type: Number, default: 200 },
  status:        { type: String, default: 'draft', index: true },    // draft | paused | running | done
  totalRows:     { type: Number, default: 0 },
  validCount:    { type: Number, default: 0 },
  dupCount:      { type: Number, default: 0 },
  invalidCount:  { type: Number, default: 0 },
  memberCount:   { type: Number, default: 0 },
  blockedCount:  { type: Number, default: 0 },
  sentToday:     { type: Number, default: 0 },
  quotaDate:     { type: String, default: '' },
  lastSentAt:    Date,
  lastRunAt:     Date,
  lastDetail:    String,
  createdByName: String,
}, { timestamps: true });

const NuNumberSchema = new Schema({
  listId:  { type: Schema.Types.ObjectId, index: true },
  phone:   String,
  name:    String,
  status:  { type: String, default: 'pending' },   // pending | sending | sent | failed | held | skipped
  detail:  String,
  sentAt:  Date,
});
NuNumberSchema.index({ listId: 1, phone: 1 }, { unique: true });
NuNumberSchema.index({ listId: 1, status: 1 });

const ReminderSchema = new Schema({
  kind:          { type: String, unique: true },
  name:          String,
  status:        { type: String, default: 'on' },  // on | off
  dailyCap:      { type: Number, default: 100 },
  templateName:  { type: String, default: '' },
  varMap:        { type: Schema.Types.Mixed, default: {} },
  sentToday:     { type: Number, default: 0 },
  quotaDate:     { type: String, default: '' },
  updatedByName: String,
}, { timestamps: true });

const FollowupSettingSchema = new Schema({
  key:           { type: String, default: 'main', unique: true },
  status:        { type: String, default: 'paused' },   // on | paused
  remindEvery:   { type: Number, default: 10 },
  startPerDay:   { type: Number, default: 50 },
  hourFrom:      { type: Number, default: 9 },
  hourTo:        { type: Number, default: 20 },
  sendDelay:     { type: Number, default: 0 },
  lastSentAt:    Date,
  launchedAt:    Date,
  startedToday:  { type: Number, default: 0 },
  startDate:     { type: String, default: '' },
  lastRunAt:     Date,
  lastDetail:    String,
  updatedByName: String,
}, { timestamps: true });

const FollowupSchema = new Schema({
  phone:      { type: String, unique: true },   // last ten digits
  day1:       String,                           // YYYY-MM-DD, India
  source:     String,                           // new | existing
  lastKind:   String,
  lastSentAt: Date,
  endedAt:    { type: Date, default: null },
  endReason:  String,
}, { timestamps: true });
FollowupSchema.index({ endedAt: 1, day1: 1 });

const ReminderLogSchema = new Schema({
  kind:    { type: String, index: true },
  phone:   String,
  step:    Number,               // follow-up day
  via:     { type: String, default: 'template' },
  status:  { type: String, default: 'sending' },
  detail:  String,
  sentAt:  Date,
  doneAt:  Date,
});
ReminderLogSchema.index({ phone: 1, step: 1 }, { unique: true });
ReminderLogSchema.index({ sentAt: -1 });

module.exports = {
  SgSettings:        model('SgSettings', SettingsSchema, 'sg_settings'),
  SgCampaignLog:     model('SgCampaignLog', CampaignLogSchema, 'sg_campaign_logs'),
  SgChatLog:         model('SgChatLog', ChatLogSchema, 'sg_chat_logs'),
  SgChatMedia:       model('SgChatMedia', ChatMediaSchema, 'sg_chat_media'),
  SgSendLog:         model('SgSendLog', SendLogSchema, 'sg_send_logs'),
  SgBlock:           model('SgBlock', BlockSchema, 'sg_blocks'),
  SgCStat:           model('SgCStat', CStatSchema, 'sg_cstats'),
  SgCMsg:            model('SgCMsg', CMsgSchema, 'sg_cmsgs'),
  SgMediaDelete:     model('SgMediaDelete', MediaDeleteSchema, 'sg_media_deletes'),
  SgRun:             model('SgRun', RunSchema, 'sg_runs'),
  SgNuList:          model('SgNuList', NuListSchema, 'sg_nu_lists'),
  SgNuNumber:        model('SgNuNumber', NuNumberSchema, 'sg_nu_numbers'),
  SgReminder:        model('SgReminder', ReminderSchema, 'sg_reminders'),
  SgFollowupSetting: model('SgFollowupSetting', FollowupSettingSchema, 'sg_followup_settings'),
  SgFollowup:        model('SgFollowup', FollowupSchema, 'sg_followups'),
  SgReminderLog:     model('SgReminderLog', ReminderLogSchema, 'sg_reminder_logs'),
};
