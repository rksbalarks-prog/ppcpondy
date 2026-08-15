const express = require('express');
const admin = require('firebase-admin');
const UserLogin = require('./UserModel'); 
const AddModel = require('../AddModel');
const UserLoginActivity = require('../UserActivity');

const router = express.Router();

// Initialize Firebase Admin SDK
const serviceAccount = require('../config/serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// OTP Generation Function (6-digit OTP)
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper function to format phone number with country code
const formatPhoneNumber = (phone, countryCode) => {
  if (phone.startsWith('+')) return phone; 
  return `${countryCode}${phone}`;
};

// ─── Helper: find and update user by phone (tries raw then normalized 10-digit) ─
const findAndUpdateByPhone = async (phone, update, options = { new: true, runValidators: true }) => {
  const raw = String(phone || '');
  const normalized = raw.replace(/\D/g, '').slice(-10);

  let updated = await UserLogin.findOneAndUpdate({ phone: raw }, update, options);
  if (!updated && normalized !== raw) {
    updated = await UserLogin.findOneAndUpdate({ phone: normalized }, update, options);
  }
  return updated;
};


// ─── App Open Logging ────────────────────────────────────────────────────────

router.post('/log-app-open', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const phoneDigits = phoneNumber.replace(/\D/g, '').slice(-10);

  try {
    await UserLoginActivity.create({ phone: phoneDigits });
    res.status(200).json({ message: 'App open logged successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log app open', details: error.message });
  }
});


router.get('/user-app-opens-per-day', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const phoneDigits = phoneNumber.replace(/\D/g, '').slice(-10);
  const today = new Date();
  const start = new Date(today.setHours(0, 0, 0, 0));
  const end = new Date(today.setHours(23, 59, 59, 999));

  try {
    const opens = await UserLoginActivity.find({
      phone: phoneDigits,
      openedAt: { $gte: start, $lte: end }
    }).sort({ openedAt: 1 });

    res.status(200).json({
      phone: phoneDigits,
      date: start.toDateString(),
      count: opens.length,
      timesOpened: opens.map(o => o.openedAt),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch open activity', details: error.message });
  }
});


router.get('/user-app-opens-every-day', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const phoneDigits = phoneNumber.replace(/\D/g, '').slice(-10);

  try {
    const opensByDay = await UserLoginActivity.aggregate([
      { $match: { phone: phoneDigits } },
      {
        $group: {
          _id: {
            year: { $year: '$openedAt' },
            month: { $month: '$openedAt' },
            day: { $dayOfMonth: '$openedAt' }
          },
          count: { $sum: 1 },
          timesOpened: { $push: '$openedAt' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const result = opensByDay.map(entry => {
      const date = new Date(entry._id.year, entry._id.month - 1, entry._id.day);
      return { date: date.toDateString(), count: entry.count, timesOpened: entry.timesOpened };
    });

    res.status(200).json({ phone: phoneDigits, history: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch login activity', details: error.message });
  }
});


router.get('/all-app-opens', async (req, res) => {
  try {
    const logs = await UserLoginActivity.find().sort({ openedAt: -1 });

    const grouped = {};
    logs.forEach(entry => {
      const dateKey = entry.openedAt.toISOString().split('T')[0];
      const phone = entry.phone;
      if (!grouped[phone]) grouped[phone] = {};
      if (!grouped[phone][dateKey]) grouped[phone][dateKey] = [];
      grouped[phone][dateKey].push(entry.openedAt);
    });

    const result = Object.entries(grouped).map(([phone, dates]) => ({
      phone,
      activity: Object.entries(dates).map(([date, times]) => ({
        date,
        count: times.length,
        timesOpened: times
      }))
    }));

    res.status(200).json({ totalUsers: result.length, users: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch open logs', details: error.message });
  }
});


router.get('/user/all-users-with-app-opens', async (req, res) => {
  try {
    const users = await UserLogin.find();
    if (!users.length) return res.status(404).json({ message: 'No users found' });

    const activities = await UserLoginActivity.find().sort({ openedAt: 1 });

    const activityMap = {};
    activities.forEach(entry => {
      const phone = entry.phone;
      const dateKey = entry.openedAt.toISOString().split('T')[0];
      if (!activityMap[phone]) activityMap[phone] = {};
      if (!activityMap[phone][dateKey]) activityMap[phone][dateKey] = [];
      activityMap[phone][dateKey].push(entry.openedAt);
    });

    const enrichedUsers = users.map(user => {
      const rawPhone = user.phone || '';
      const phoneDigits = rawPhone.replace(/\D/g, '').slice(-10);
      const activityByDate = activityMap[phoneDigits] || {};
      const activity = Object.entries(activityByDate).map(([date, times]) => ({
        date, count: times.length, timesOpened: times
      }));

      return {
        ...user._doc,
        phone: phoneDigits || null,
        totalDaysActive: activity.length,
        activity
      };
    });

    const finalUsers = enrichedUsers.filter(user => !!user.phone);
    res.status(200).json({ totalUsers: finalUsers.length, users: finalUsers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users with open logs', error: error.message });
  }
});


// ─── Lead Stats ──────────────────────────────────────────────────────────────

router.get('/user-lead-stats', async (req, res) => {
  try {
    const users = await UserLogin.find();
    if (users.length === 0) return res.status(404).json({ message: 'No users found' });

    const stats = await Promise.all(
      users.map(async (user) => {
        const properties = await AddModel.find({ phoneNumber: user.phone });
        const totalInterestCount = properties.reduce((acc, prop) => acc + (prop.interestRequests?.length || 0), 0);
        const totalContactCount = properties.reduce((acc, prop) => acc + (prop.contactRequests?.length || 0), 0);
        const totalFavoriteCount = properties.reduce((acc, prop) => acc + (prop.favoriteRequests?.length || 0), 0);

        const propertyDetails = properties.map(prop => ({
          ppcId: prop.ppcId,
          propertyMode: prop.propertyMode,
          propertyType: prop.propertyType,
          city: prop.city,
          area: prop.area,
          createdAt: prop.createdAt,
          updatedAt: prop.updatedAt,
          interestCount: prop.interestRequests?.length || 0,
          contactCount: prop.contactRequests?.length || 0,
          favoriteCount: prop.favoriteRequests?.length || 0,
        }));

        return { phoneNumber: user.phone, totalInterestCount, totalContactCount, totalFavoriteCount, properties: propertyDetails };
      })
    );

    return res.status(200).json({ message: 'User stats fetched', data: stats });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


// ─── Direct Verify ───────────────────────────────────────────────────────────

router.post('/user/direct-verify', async (req, res) => {
  const { phone, adminName } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

  try {
    const phoneDigits = phone.replace(/\D/g, '').slice(-10);
    let user = await UserLogin.findOne({ phone: phoneDigits });

    if (!user) {
      user = new UserLogin({ phone: phoneDigits, directVerified: true, otpStatus: 'verified', verifiedBy: adminName || null });
    } else {
      user.directVerified = true;
      user.otpStatus = 'verified';
      user.verifiedBy = adminName || null;
    }

    await user.save();
    res.status(200).json({ message: 'User marked as directly verified', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});


router.get('/user/direct-verified-users', async (req, res) => {
  try {
    const users = await UserLogin.find({ directVerified: true });
    res.status(200).json({ message: 'Directly verified users fetched successfully', count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});


router.delete('/user/direct-verify', async (req, res) => {
  const { phone, adminName } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

  try {
    const phoneDigits = phone.replace(/\D/g, '').slice(-10);
    const user = await UserLogin.findOne({ phone: phoneDigits });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.directVerified = false;
    user.otpStatus = 'unverified';
    user.deletedDate = new Date();
    user.unverifiedBy = adminName || null;
    await user.save();

    res.status(200).json({ message: 'User unmarked as directly verified', deletedDate: user.deletedDate, user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});


router.get('/user/unverified-users', async (req, res) => {
  try {
    const users = await UserLogin.find({ directVerified: false, deletedDate: { $ne: null } })
      .select('phone deletedDate unverifiedBy');
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch unverified users.', error: error.message });
  }
});


// ─── Force Logout ────────────────────────────────────────────────────────────

router.post('/user/force-logout', async (req, res) => {
  const { phone, adminName } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

  try {
    const phoneDigits = phone.replace(/\D/g, '').slice(-10);
    const user = await UserLogin.findOne({ phone: phoneDigits });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.directLogout = true;
    user.logoutDate = new Date();
    user.loggedOutBy = adminName || null;
    user.unLoggedOutBy = null;
    await user.save();

    res.status(200).json({ message: 'User forcibly logged out', user });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out user', error: error.message });
  }
});


router.delete('/user/force-logout', async (req, res) => {
  const { phone, adminName } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

  try {
    const phoneDigits = phone.replace(/\D/g, '').slice(-10);
    const user = await UserLogin.findOne({ phone: phoneDigits });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.directLogout = false;
    user.logoutDate = null;
    user.unLoggedOutBy = adminName || null;
    user.loggedOutBy = null;
    user.revokedDate = new Date();
    await user.save();

    res.status(200).json({ message: 'User logout revoked', user });
  } catch (error) {
    res.status(500).json({ message: 'Error revoking logout', error: error.message });
  }
});


router.get('/user/force-logout-users', async (req, res) => {
  try {
    const users = await UserLogin.find({ directLogout: true }).select('phone logoutDate loggedOutBy');
    res.status(200).json({ message: 'Logged out users fetched successfully', count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logged out users', error: error.message });
  }
});


router.get('/user/revoked-logout-users', async (req, res) => {
  try {
    const users = await UserLogin.find({ directLogout: false, unLoggedOutBy: { $ne: null } })
      .select('phone unLoggedOutBy revokedDate');

    const result = users.map(user => ({
      phone: user.phone,
      unLoggedOutBy: user.unLoggedOutBy,
      revokedDate: user.revokedDate,
    }));

    res.status(200).json({ message: 'Logout revoked users fetched successfully', count: result.length, users: result });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching revoked logout users', error: error.message });
  }
});


router.get('/user/check-direct-logout', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

  try {
    const phoneDigits = phone.replace(/\D/g, '').slice(-10);
    const user = await UserLogin.findOne({ phone: phoneDigits });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json({ directLogout: user.directLogout });
  } catch (error) {
    res.status(500).json({ message: 'Error checking logout status', error: error.message });
  }
});


// ─── Register / OTP ──────────────────────────────────────────────────────────

router.post('/user/register', async (req, res) => {
  const { phone, countryCode, loginMode } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

  try {
    const otp = generateOtp();
    const now = new Date();
    let user = await UserLogin.findOne({ phone });

    if (user) {
      if (user.permanentlyLoggedOut) {
        return res.status(403).json({ message: 'This user has permanently logged out. Please contact admin for access.' });
      }
      if (user.status === 'banned') {
        return res.status(403).json({ message: 'Your account is banned. Contact support. 9150524409' });
      }
      if (user.status === 'deleted') {
        return res.status(403).json({ message: 'Your account is deleted. Please contact support. 9150524409' });
      }

      user.otp = otp;
      user.loginDate = now;
      user.otpStatus = 'pending';
      user.loginMode = loginMode;
      user.countryCode = countryCode;
      await user.save();
      await sendOtpToPhone(formatPhoneNumber(phone, countryCode), otp);

      return res.status(200).json({ message: 'OTP updated and sent.', data: user });
    } else {
      const newUser = new UserLogin({ phone, countryCode, otp, loginDate: now, otpStatus: 'pending', loginMode });
      await newUser.save();
      await sendOtpToPhone(formatPhoneNumber(phone, countryCode), otp);

      return res.status(201).json({
        message: 'User registered successfully; OTP sent.',
        data: { otp, phone: newUser.phone }
      });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


router.get('/user/login-mode-count', async (req, res) => {
  try {
    const webLoginCount = await UserLogin.countDocuments({ loginMode: { $regex: /^web$/, $options: 'i' } });
    const appLoginCount = await UserLogin.countDocuments({ loginMode: { $regex: /^app$/, $options: 'i' } });
    return res.status(200).json({ message: 'Login mode counts fetched successfully', webLoginCount, appLoginCount });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


router.get('/user/login-mode-counts', async (req, res) => {
  try {
    const [webLoginCount, appLoginCount] = await Promise.all([
      UserLogin.countDocuments({ loginMode: { $regex: /^web$/, $options: 'i' } }),
      UserLogin.countDocuments({ loginMode: { $regex: /^app$/, $options: 'i' } })
    ]);
    res.status(200).json({ message: 'Login mode counts fetched successfully', webLoginCount, appLoginCount });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


router.get('/user/login-count', async (req, res) => {
  try {
    const count = await UserLogin.countDocuments({
      loginDate: { $ne: null },
      status: { $nin: ['banned', 'deleted'] },
      permanentlyLoggedOut: { $ne: true }
    });
    res.status(200).json({ message: 'Login user count fetched successfully', count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching login user count', error: error.message });
  }
});


router.post('/user/permanent-logout', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

  try {
    const user = await UserLogin.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.permanentlyLoggedOut = true;
    await user.save();
    return res.status(200).json({ message: 'User permanently logged out.' });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong.', error: error.message });
  }
});


router.post('/user/revert-permanent-logout', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

  try {
    const user = await UserLogin.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.permanentlyLoggedOut = false;
    await user.save();
    return res.status(200).json({ message: 'Permanent logout reverted. User can now log in.' });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong.', error: error.message });
  }
});


router.post('/user/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const user = await UserLogin.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'Phone number not registered' });

    if (user.otp === otp) {
      user.otpStatus = 'verified';
      await user.updateOne({ $unset: { otp: 1 }, $set: { otpStatus: 'verified' } });

      const newOtp = generateOtp();
      await sendOtpToPhone(phone, newOtp);
      await user.updateOne({ $set: { otp: newOtp } });

      return res.status(200).json({ message: 'OTP verified successfully!' });
    } else {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message || error });
  }
});


// ─── User Data / Fetch ───────────────────────────────────────────────────────

router.get('/user/data/:phone', async (req, res) => {
  try {
    const user = await UserLogin.findOne({ phone: req.params.phone });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'User data fetched successfully', data: user });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


router.delete('/user/delete/:phone', async (req, res) => {
  try {
    const result = await UserLogin.findOneAndDelete({ phone: req.params.phone });
    if (!result) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


const buildUserDefaults = (userObj) => ({
  ...userObj,
  remarks: userObj.remarks || '',
  updatedBy: userObj.updatedBy || null,
  updateDate: userObj.updateDate || null,
  conversionStatus: userObj.conversionStatus || 'pending',
  conversion: userObj.conversion !== undefined ? userObj.conversion : false,
  conversionDate: userObj.conversionDate || null,
  conversionUpdatedBy: userObj.conversionUpdatedBy || null,
});


router.get('/user/all', async (req, res) => {
  try {
    const users = await UserLogin.find();
    if (users.length === 0) return res.status(404).json({ message: 'No users found' });

    const usersWithDefaults = users.map(user => buildUserDefaults(user.toObject ? user.toObject() : user));
    return res.status(200).json({ message: 'Users fetched successfully', data: usersWithDefaults });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


router.get('/user/alls', async (req, res) => {
  try {
    const users = await UserLogin.find().sort({ loginDate: -1 });
    const usersWithDefaults = users.map(user => buildUserDefaults(user.toObject ? user.toObject() : user));
    return res.status(200).json({ message: 'Users fetched successfully', data: usersWithDefaults });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
});


router.get('/user/phones-all', async (req, res) => {
  try {
    const users = await UserLogin.find({}, 'phone');
    if (users.length === 0) return res.status(404).json({ message: 'No users found' });

    const phoneNumbers = users.map(user => user.phone);
    return res.status(200).json({ message: 'Phone numbers fetched successfully', data: phoneNumbers });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


// ─── Status Actions ──────────────────────────────────────────────────────────

router.post('/user/report', async (req, res) => {
  const { phone, remarks } = req.body;
  await UserLogin.updateOne({ phone }, { remarks, reportDate: new Date() });
  res.json({ message: 'Remarks reported successfully' });
});


router.post('/user/deleteDate', async (req, res) => {
  const { phone, issueDetails } = req.body;
  try {
    const user = await UserLogin.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.deletedDate = new Date();
    if (issueDetails) user.issueDetails = issueDetails;
    user.status = 'deleted';
    await user.save();

    return res.status(200).json({ message: 'User marked as deleted successfully', data: user });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


router.post('/user/ban', async (req, res) => {
  const { phone, reason } = req.body;
  try {
    const user = await UserLogin.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.bannedDate = new Date();
    user.bannedReason = reason || 'No reason provided';
    user.status = 'banned';
    await user.save();

    return res.status(200).json({ message: 'User banned successfully', data: user });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


router.post('/user/toggleStatus', async (req, res) => {
  const { phone, action, reason } = req.body;
  try {
    const user = await UserLogin.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found' });

    switch (action) {
      case 'delete':
        if (user.status === 'deleted') {
          user.status = 'normal'; user.deletedDate = null; user.issueDetails = null;
        } else {
          user.status = 'deleted'; user.deletedDate = new Date(); user.issueDetails = reason || 'No details provided';
        }
        break;
      case 'ban':
        if (user.status === 'banned') {
          user.status = 'normal'; user.bannedDate = null; user.bannedReason = null;
        } else {
          user.status = 'banned'; user.bannedDate = new Date(); user.bannedReason = reason || 'No reason provided';
        }
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await user.save();
    return res.status(200).json({ message: `User status updated to ${user.status}`, data: user });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


// POST: Report User
router.post('/users/report', async (req, res) => {
  try {
    const { phone, remarks, adminName } = req.body;
    await UserLogin.updateMany(
      { phone },
      { remarks, reportDate: new Date(), reportedBy: adminName, status: 'reported' }
    );
    const updated = await UserLogin.findOne({ phone }).sort({ loginDate: -1 });
    res.json({ message: 'Remarks reported successfully', data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error reporting user', error: err.message });
  }
});


// POST: Ban User
// UserLogin stores one document per login attempt, so the same phone can have
// many records. Update them all so the Login Report's Unban button shows on
// every row for that phone (and not just the most-recently-touched one).
router.post('/users/ban', async (req, res) => {
  try {
    const { phone, reason, adminName } = req.body;
    await UserLogin.updateMany(
      { phone },
      { bannedReason: reason, bannedDate: new Date(), bannedBy: adminName, status: 'banned' }
    );
    const updated = await UserLogin.findOne({ phone }).sort({ loginDate: -1 });
    res.json({ message: 'User status updated to banned', data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error banning user', error: err.message });
  }
});


// POST: Delete User
router.post('/users/delete', async (req, res) => {
  try {
    const { phone, reason, adminName } = req.body;
    await UserLogin.updateMany(
      { phone },
      { deletedDate: new Date(), deleteReason: reason, deletedBy: adminName, status: 'deleted' }
    );
    const updated = await UserLogin.findOne({ phone }).sort({ loginDate: -1 });
    res.json({ message: 'User status updated to deleted', data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});


// POST: Unreport User
router.post('/users/unreport', async (req, res) => {
  try {
    const { phone, adminName } = req.body;
    await UserLogin.updateMany(
      { phone },
      {
        $unset: { reportDate: 1, remarks: 1 },
        $set: { status: 'unReported', unReportedBy: adminName, unReportedDate: new Date() }
      }
    );
    const updated = await UserLogin.findOne({ phone }).sort({ loginDate: -1 });
    res.json({ message: 'User unreported and set to active', data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error unreporting user', error: err.message });
  }
});


// POST: Unban User
router.post('/users/unban', async (req, res) => {
  try {
    const { phone, adminName } = req.body;
    await UserLogin.updateMany(
      { phone },
      {
        $unset: { bannedDate: 1, bannedReason: 1 },
        $set: { status: 'active', unBannedBy: adminName, unBannedDate: new Date() }
      }
    );
    const updated = await UserLogin.findOne({ phone }).sort({ loginDate: -1 });
    res.json({ message: 'User unbanned and set to active', data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error unbanning user', error: err.message });
  }
});


// POST: Undelete User
router.post('/users/undelete', async (req, res) => {
  try {
    const { phone, adminName } = req.body;
    await UserLogin.updateMany(
      { phone },
      {
        $unset: { deletedDate: 1, deleteReason: 1 },
        $set: { status: 'unDeleted', unDeletedBy: adminName, unDeletedDate: new Date() }
      }
    );
    const updated = await UserLogin.findOne({ phone }).sort({ loginDate: -1 });
    res.json({ message: 'User undeleted and set to active', data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error undeleting user', error: err.message });
  }
});


// PUT: Update user status to active by ID
router.put('/activate-user/:id', async (req, res) => {
  try {
    const updatedUser = await UserLogin.findByIdAndUpdate(
      req.params.id,
      { status: 'active', updateDate: new Date() },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User status updated to active', data: updatedUser });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// PUT: Set active status by phone
router.put('/set-active-status', async (req, res) => {
  try {
    const { phone, adminName } = req.body;
    if (!phone || !adminName) return res.status(400).json({ message: 'Phone and Admin name are required' });

    const updatedUser = await UserLogin.findOneAndUpdate(
      { phone },
      {
        status: 'active',
        updateDate: new Date(),
        updatedBy: adminName,
        bannedDate: null, reportDate: null, deletedDate: null,
        bannedBy: null, reportedBy: null, deletedBy: null,
        unBannedBy: null, unReportedBy: null, unDeletedBy: null,
        unBannedDate: null, unReportedDate: null, unDeletedDate: null
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: 'User not found with this phone number' });
    res.status(200).json({ message: 'User status changed to active successfully', data: updatedUser });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// ─── Remarks & Conversion (FIXED: phone lookup tries raw then normalized) ────

// POST: Update Remarks
router.post('/user/update-remarks', async (req, res) => {
  try {
    const { phone, remarks, adminName } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const updatedUser = await findAndUpdateByPhone(
      phone,
      {
        remarks,
        updatedBy: adminName || null,
        updateDate: new Date(),
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
    res.status(200).json({ message: 'Remarks updated successfully', data: buildUserDefaults(userObj) });
  } catch (error) {
    console.error('Error updating remarks:', error);
    res.status(500).json({ message: 'Failed to update remarks', error: error.message });
  }
});


// POST: Update Conversion Status
router.post('/user/update-conversion-status', async (req, res) => {
  try {
    const { phone, conversionStatus, adminName } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const updatePayload = {
      conversionStatus,
      conversionUpdatedBy: adminName || null,
      updateDate: new Date(),
      conversion: conversionStatus !== 'pending',
      conversionDate: conversionStatus !== 'pending' ? new Date() : null,
    };

    const updatedUser = await findAndUpdateByPhone(phone, updatePayload);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
    res.status(200).json({ message: 'Conversion status updated successfully', data: buildUserDefaults(userObj) });
  } catch (error) {
    console.error('Error updating conversion status:', error);
    res.status(500).json({ message: 'Failed to update conversion status', error: error.message });
  }
});


const sendOtpToPhone = async (phone, otp) => {
  return true;
};


module.exports = router;