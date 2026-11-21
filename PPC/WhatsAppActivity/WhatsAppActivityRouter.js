// Admin "WhatsApp Activity": every message sent through POST /send-message.
// Read-only. Mounted under /PPC, BEFORE SingleSendRouter (its catch-all GET "/:id").
//
//   GET /PPC/whatsapp-activity?days=7&category=&status=&audience=&phone=&page=1&limit=100

const express = require('express');
const WhatsAppLog = require('./WhatsAppLogModel');
const { LABELS, last10 } = require('./classify');

const router = express.Router();
const DAY = 24 * 60 * 60 * 1000;
const TZ = 'Asia/Kolkata';

let SingleSendWhatsapp = null;
try { SingleSendWhatsapp = require('../SingleSendWhatsapp/Singlesendmsgmodel'); } catch (_) { /* optional */ }

router.get('/whatsapp-activity', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const since = new Date(Date.now() - days * DAY);

    const base = { createdAt: { $gte: since } };
    const filter = { ...base };
    if (req.query.category) filter.category = String(req.query.category);
    if (req.query.status === 'sent' || req.query.status === 'failed') filter.status = req.query.status;
    if (['owner', 'user', 'account'].includes(req.query.audience)) filter.audience = req.query.audience;
    const phone = last10(req.query.phone);
    if (phone) {
      const re = new RegExp(phone.replace(/\D/g, ''));
      filter.$or = [{ to: re }, { aboutPhone: re }];
    }

    const [logs, matching, totals, byCategory, byDay, recipients, bulkQueued] = await Promise.all([
      WhatsAppLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .select('-provider -__v -updatedAt').lean(),
      WhatsAppLog.countDocuments(filter),
      WhatsAppLog.aggregate([{ $match: base }, { $group: {
        _id: null, total: { $sum: 1 }, failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        recipients: { $addToSet: '$to' } } },
      { $project: { _id: 0, total: 1, failed: 1, uniqueRecipients: { $size: '$recipients' } } }]),
      WhatsAppLog.aggregate([{ $match: base }, { $group: {
        _id: '$category', total: { $sum: 1 }, failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } } } },
      { $sort: { total: -1 } }]),
      WhatsAppLog.aggregate([{ $match: base }, { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } },
        total: { $sum: 1 }, failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } } } },
      { $sort: { _id: 1 } }]),
      WhatsAppLog.aggregate([{ $match: { ...base, audience: { $ne: 'account' } } },
        { $group: { _id: { to: '$to', audience: '$audience' }, total: { $sum: 1 }, last: { $max: '$createdAt' } } },
        { $sort: { total: -1 } }, { $limit: 10 }]),
      SingleSendWhatsapp ? SingleSendWhatsapp.countDocuments({ createdAt: { $gte: since }, status: 'queued' }) : 0,
    ]);

    const t = totals[0] || { total: 0, failed: 0, uniqueRecipients: 0 };
    res.json({
      success: true,
      days,
      stats: {
        total: t.total,
        sent: t.total - t.failed,
        failed: t.failed,
        uniqueRecipients: t.uniqueRecipients,
        byCategory: byCategory.map((c) => ({ category: c._id || 'other', label: LABELS[c._id] || c._id, total: c.total, failed: c.failed })),
        byDay: byDay.map((d) => ({ day: d._id, total: d.total, failed: d.failed })),
        topRecipients: recipients.map((r) => ({ phone: r._id.to, audience: r._id.audience, total: r.total, last: r.last })),
        bulkQueued,
      },
      labels: LABELS,
      page,
      limit,
      matching,
      logs: logs.map((l) => ({ ...l, label: LABELS[l.category] || l.category })),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
