const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const RcmStaff = require('./RcmStaffModel');
const RcmCall = require('./RcmCallModel');
const RcmAutoNumber = require('./RcmAutoNumberModel');

const router = express.Router();

const STATUS_OPTIONS = ['Ring', 'Not Exist', 'Not Interested', 'Interested'];
const MODE_OPTIONS = ['Manual', 'Automatic'];

const isTenDigit = (s) => typeof s === 'string' && /^[0-9]{10}$/.test(s);
const genToken = () => crypto.randomBytes(32).toString('hex');
const safeStaff = (s) => ({ username: s.username, role: s.role });

const startOfDayUTC = (ymd) => {
  if (typeof ymd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
};
const endOfDayUTC = (ymd) => {
  if (typeof ymd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T23:59:59.999Z`);
  return isNaN(d.getTime()) ? null : d;
};

const requireRcmAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }
    const token = match[1].trim();
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });

    const staff = await RcmStaff.findOne({
      active: true,
      'tokens.token': token,
    });
    if (!staff) return res.status(401).json({ error: 'Invalid or expired token' });

    req.staff = staff;
    req.staffToken = token;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Auth check failed', details: err.message });
  }
};

const requireRcmAdmin = (req, res, next) => {
  if (!req.staff || req.staff.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  next();
};

// Idempotent seed
const seedRcmStaff = async () => {
  try {
    const count = await RcmStaff.countDocuments({});
    if (count > 0) return;

    const seeds = [
      { username: 'sandhoshi', password: '1234', role: 'STAFF' },
      { username: 'admin', password: 'admin', role: 'ADMIN' },
    ];
    for (const s of seeds) {
      const exists = await RcmStaff.findOne({ username: s.username });
      if (!exists) {
        await RcmStaff.create({
          username: s.username,
          password: s.password,
          plainPassword: s.password,
          role: s.role,
          active: true,
        });
      }
    }
    console.log('[Rcm] Seed staff inserted');
  } catch (err) {
    console.error('[Rcm] Seed failed:', err.message);
  }
};

if (mongoose.connection.readyState === 1) {
  seedRcmStaff();
} else {
  mongoose.connection.once('open', seedRcmStaff);
}

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────

router.post('/rcm/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const staff = await RcmStaff.findOne({ username, active: true });
    if (!staff) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, staff.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = genToken();
    staff.tokens.push({ token, createdAt: new Date() });
    // Cap at 20 most recent tokens
    if (staff.tokens.length > 20) {
      staff.tokens = staff.tokens.slice(-20);
    }
    staff.lastLogin = new Date();
    await staff.save();

    res.json({ token, username: staff.username, role: staff.role });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

router.post('/rcm/logout', requireRcmAuth, async (req, res) => {
  try {
    req.staff.tokens = req.staff.tokens.filter((t) => t.token !== req.staffToken);
    await req.staff.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed', details: err.message });
  }
});

router.get('/rcm/me', requireRcmAuth, async (req, res) => {
  res.json(safeStaff(req.staff));
});

// ─────────────────────────────────────────────────────────────
// CALLS
// ─────────────────────────────────────────────────────────────

router.get('/rcm/calls', requireRcmAuth, async (req, res) => {
  try {
    const { from, to, agent } = req.query;
    const filter = {};

    if (req.staff.role !== 'ADMIN') {
      filter.agentUsername = req.staff.username;
    } else if (agent) {
      filter.agentUsername = String(agent).trim().toLowerCase();
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const d = startOfDayUTC(from);
        if (d) filter.createdAt.$gte = d;
      }
      if (to) {
        const d = endOfDayUTC(to);
        if (d) filter.createdAt.$lte = d;
      }
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    const calls = await RcmCall.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json({ calls });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load calls', details: err.message });
  }
});

router.post('/rcm/calls', requireRcmAuth, async (req, res) => {
  try {
    const number = String(req.body.number || '').trim();
    const mode = String(req.body.mode || '').trim();
    const autoNumberId = req.body.autoNumberId || null;

    if (!isTenDigit(number)) {
      return res.status(400).json({ error: 'Number must be exactly 10 digits' });
    }
    if (!MODE_OPTIONS.includes(mode)) {
      return res.status(400).json({ error: 'Mode must be Manual or Automatic' });
    }

    // Duplicate guard: any prior call with a final outcome blocks
    const prior = await RcmCall.findOne({
      number,
      status: { $ne: 'Ring' },
    }).sort({ createdAt: -1 });

    if (prior) {
      const when = new Date(prior.createdAt).toLocaleDateString('en-GB');
      return res.status(409).json({
        error: `This number was already called on ${when} by ${prior.agentUsername} (status: ${prior.status}). Please use a different number.`,
        duplicate: {
          agent: prior.agentUsername,
          status: prior.status,
          createdAt: prior.createdAt,
        },
      });
    }

    let autoId = null;
    if (autoNumberId && mongoose.Types.ObjectId.isValid(autoNumberId)) {
      autoId = autoNumberId;
    }

    const call = await RcmCall.create({
      agentUsername: req.staff.username,
      number,
      mode,
      status: 'Ring',
      autoNumberId: autoId,
    });

    res.status(201).json({ call });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create call', details: err.message });
  }
});

router.patch('/rcm/calls/:id/status', requireRcmAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid call id' });
    }

    const status = String(req.body.status || '').trim();
    if (!STATUS_OPTIONS.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const baseFilter = { _id: id };
    if (req.staff.role !== 'ADMIN') {
      baseFilter.agentUsername = req.staff.username;
    }

    const target = await RcmCall.findOne(baseFilter);
    if (!target) return res.status(404).json({ error: 'Call not found' });

    // Cross-record race guard
    if (status !== 'Ring') {
      const conflict = await RcmCall.findOne({
        _id: { $ne: target._id },
        number: target.number,
        status: { $ne: 'Ring' },
      }).sort({ createdAt: -1 });

      if (conflict) {
        const when = new Date(conflict.createdAt).toLocaleDateString('en-GB');
        return res.status(409).json({
          error: `Another agent already finalized this number on ${when} (${conflict.agentUsername}, status: ${conflict.status}). Status change rejected.`,
          duplicate: {
            agent: conflict.agentUsername,
            status: conflict.status,
            createdAt: conflict.createdAt,
          },
        });
      }
    }

    target.status = status;

    if (status === 'Interested' && req.body.interestedDetails && typeof req.body.interestedDetails === 'object') {
      const d = req.body.interestedDetails;
      target.interestedDetails = {
        rent: String(d.rent || '').trim(),
        advance: String(d.advance || '').trim(),
        bhk: String(d.bhk || '').trim(),
        floorNo: String(d.floorNo || '').trim(),
        carPark: String(d.carPark || '').trim(),
        availableFrom: String(d.availableFrom || '').trim(),
        capturedAt: new Date(),
      };
    }

    await target.save();

    // Deactivate the auto-queue entry on any final status
    if (status !== 'Ring' && target.autoNumberId) {
      try {
        await RcmAutoNumber.updateOne(
          { _id: target.autoNumberId },
          { $set: { active: false } }
        );
      } catch (_) {
        // non-fatal
      }
    }

    res.json({ call: target });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// AUTO QUEUE
// ─────────────────────────────────────────────────────────────

router.get('/rcm/auto-queue/next', requireRcmAuth, async (req, res) => {
  try {
    const doc = await RcmAutoNumber.findOneAndUpdate(
      { active: true },
      { $inc: { assignCount: 1 }, $set: { lastAssignedAt: new Date() } },
      { sort: { assignCount: 1, _id: 1 }, new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Queue is empty' });
    res.json({ id: doc._id, number: doc.number, assignCount: doc.assignCount });
  } catch (err) {
    res.status(500).json({ error: 'Queue fetch failed', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN — stats, queue management, staff management
// ─────────────────────────────────────────────────────────────

router.get('/rcm/stats', requireRcmAuth, requireRcmAdmin, async (req, res) => {
  try {
    const { from, to, agent } = req.query;
    const filter = {};

    if (agent) {
      filter.agentUsername = String(agent).trim().toLowerCase();
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const d = startOfDayUTC(from);
        if (d) filter.createdAt.$gte = d;
      }
      if (to) {
        const d = endOfDayUTC(to);
        if (d) filter.createdAt.$lte = d;
      }
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    const rows = await RcmCall.find(filter, { status: 1, agentUsername: 1 }).lean();

    let totalCalls = 0;
    let ringCount = 0;
    let notExistCount = 0;
    let notInterestedCount = 0;
    let interestedCount = 0;
    const perAgent = new Map();

    for (const r of rows) {
      totalCalls++;
      if (r.status === 'Ring') ringCount++;
      else if (r.status === 'Not Exist') notExistCount++;
      else if (r.status === 'Not Interested') notInterestedCount++;
      else if (r.status === 'Interested') interestedCount++;

      const a = r.agentUsername || '(unknown)';
      if (!perAgent.has(a)) {
        perAgent.set(a, {
          agentUsername: a,
          total: 0,
          Ring: 0,
          'Not Exist': 0,
          'Not Interested': 0,
          Interested: 0,
        });
      }
      const bucket = perAgent.get(a);
      bucket.total++;
      if (bucket[r.status] !== undefined) bucket[r.status]++;
    }

    const byAgent = Array.from(perAgent.values()).sort((a, b) => b.total - a.total);

    res.json({
      totalCalls,
      ringCount,
      notExistCount,
      notInterestedCount,
      interestedCount,
      byAgent,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute stats', details: err.message });
  }
});

router.get('/rcm/auto-queue', requireRcmAuth, requireRcmAdmin, async (req, res) => {
  try {
    const list = await RcmAutoNumber.find({}).sort({ assignCount: 1, _id: 1 });
    res.json({ queue: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list queue', details: err.message });
  }
});

router.post('/rcm/auto-queue', requireRcmAuth, requireRcmAdmin, async (req, res) => {
  try {
    const numbers = Array.isArray(req.body.numbers) ? req.body.numbers : [];
    const cleaned = Array.from(
      new Set(
        numbers
          .map((n) => String(n || '').replace(/\D/g, ''))
          .filter((n) => isTenDigit(n))
      )
    );

    if (!cleaned.length) {
      return res.status(400).json({ error: 'Provide an array of valid 10-digit numbers' });
    }

    const docs = [];
    for (const n of cleaned) {
      const doc = await RcmAutoNumber.findOneAndUpdate(
        { number: n },
        {
          $setOnInsert: {
            number: n,
            addedBy: req.staff.username,
            assignCount: 0,
          },
          $set: { active: true },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      docs.push(doc);
    }

    res.status(201).json({ added: docs.length, numbers: docs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add numbers', details: err.message });
  }
});

router.delete('/rcm/auto-queue/:id', requireRcmAuth, requireRcmAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid queue id' });
    }
    const removed = await RcmAutoNumber.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ error: 'Queue entry not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove queue entry', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN — staff management
// ─────────────────────────────────────────────────────────────

router.get('/rcm/staff', requireRcmAuth, requireRcmAdmin, async (req, res) => {
  try {
    const list = await RcmStaff.find(
      {},
      { _id: 1, username: 1, role: 1, active: 1, lastLogin: 1, createdAt: 1, plainPassword: 1 }
    ).sort({ createdAt: -1 });
    res.json({ staff: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list staff', details: err.message });
  }
});

router.post('/rcm/staff', requireRcmAuth, requireRcmAdmin, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = req.body.role === 'ADMIN' ? 'ADMIN' : 'STAFF';

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const exists = await RcmStaff.findOne({ username });
    if (exists) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const staff = await RcmStaff.create({
      username,
      password,
      plainPassword: password,
      role,
      active: true,
    });

    res.status(201).json({
      staff: {
        _id: staff._id,
        username: staff.username,
        role: staff.role,
        active: staff.active,
        lastLogin: staff.lastLogin,
        createdAt: staff.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create staff', details: err.message });
  }
});

router.patch('/rcm/staff/:id', requireRcmAuth, requireRcmAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid staff id' });
    }

    const staff = await RcmStaff.findById(id);
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    const isSelf = staff.username === req.staff.username;

    if (typeof req.body.active === 'boolean') {
      if (isSelf && req.body.active === false) {
        return res.status(400).json({ error: 'Cannot deactivate yourself' });
      }
      staff.active = req.body.active;
    }

    if (typeof req.body.role === 'string') {
      const nextRole = req.body.role === 'ADMIN' ? 'ADMIN' : 'STAFF';
      if (isSelf && staff.role === 'ADMIN' && nextRole !== 'ADMIN') {
        return res.status(400).json({ error: 'Cannot demote yourself' });
      }
      staff.role = nextRole;
    }

    if (typeof req.body.password === 'string' && req.body.password.length > 0) {
      if (req.body.password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
      }
      staff.password = req.body.password;
      staff.plainPassword = req.body.password;
      staff.tokens = []; // invalidate all sessions
    }

    await staff.save();

    res.json({
      staff: {
        _id: staff._id,
        username: staff.username,
        role: staff.role,
        active: staff.active,
        lastLogin: staff.lastLogin,
        createdAt: staff.createdAt,
        plainPassword: staff.plainPassword,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update staff', details: err.message });
  }
});

module.exports = router;
