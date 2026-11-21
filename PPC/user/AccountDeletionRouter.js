// Self-service account deletion (Google Play User Data policy — Account
// Deletion Requirement). Called by the public /delete-account page on the
// website for the logged-in user.
//
//   POST /PPC/user/self-delete   { phone, reason? }
//
// What it does, in order (every step is idempotent, so a failed run can simply
// be retried; the login is closed LAST so a partial failure never leaves a
// "deleted" user whose data is still live):
//   1. Hard-deletes data that only describes this person: profile, assistant
//      conversations/messages, notifications, push tokens, viewing history.
//   2. Removes their own listings and buyer requests, using the same soft-delete
//      flags the app/admin already use (AddModel status 'delete',
//      BuyerAssistance isDeleted) so they vanish from the site and admin can
//      purge them with the existing permanent-delete tools.
//   3. Pulls their number out of other people's listings (interest, contact,
//      favourite, help, report lists).
//   4. Marks every UserLogin record for the number status 'deleted'; /send-otp
//      then refuses the number with "Account deleted".
// Bills, payments and points records are deliberately kept (tax/accounting),
// as stated on the /delete-account page.

const express = require('express');
const router = express.Router();

const UserLogin = require('./UserModel');
const AddModel = require('../AddModel');
const BuyerAssistance = require('../BuyerAssistance/BuyerAssistanceModel');
const ProfileData = require('../MyProfile/ProfileModel');
const Notification = require('../Notification/NotificationModel');
const NotificationUser = require('../Notification/NotificationDetailModel');
const FcmToken = require('../fcm/FcmTokenModel');
const AiConversation = require('../assistant/store/ConversationModel');
const AiMessage = require('../assistant/store/MessageModel');
const UserViews = require('../ViewsModel');

// Phone numbers are stored inconsistently across collections ("9876543210",
// "+919876543210", "919876543210", "09876543210"). Match all of those, and
// nothing longer.
const phoneRegex = (digits) => new RegExp(`^(\\+?91|0)?${digits}$`);

// Arrays on AddModel whose entries carry another user's phoneNumber.
const LISTING_PHONE_ARRAYS = [
  'interestRequests',
  'soldOutReport',
  'helpRequests',
  'reportProperty',
  'contactRequests',
  'alreadySaved',
  'favoriteRemoved',
  'favoriteRequests',
];

router.post('/user/self-delete', async (req, res) => {
  const digits = String(req.body.phone || '').replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    return res.status(400).json({ message: 'A valid 10-digit phone number is required.' });
  }
  const reason = String(req.body.reason || '').trim().slice(0, 500) || 'Deleted by user';
  const re = phoneRegex(digits);
  const now = new Date();

  const user = await UserLogin.findOne({ phone: digits }).catch(() => null);
  if (!user) {
    return res.status(404).json({ message: 'No account found for this number.' });
  }

  const summary = {};
  const step = async (name, fn) => {
    const r = await fn();
    summary[name] = r?.deletedCount ?? r?.modifiedCount ?? 0;
  };

  try {
    // 1. Personal-only data — hard delete.
    await step('profile', () => ProfileData.deleteMany({ mobile: re }));
    await step('assistantMessages', () => AiMessage.deleteMany({ phone: re }));
    await step('assistantConversations', () => AiConversation.deleteMany({ phone: re }));
    await step('notifications', () => Notification.deleteMany({ userPhoneNumber: re }));
    await step('notificationDetails', () => NotificationUser.deleteMany({
      $or: [{ userPhoneNumber: re }, { recipientPhoneNumber: re }],
    }));
    await step('pushTokens', () => FcmToken.deleteMany({ phoneNumber: re }));
    // One UserViews doc per user, keyed by their own phoneNumber (view/contact
    // history + daily limits).
    await step('viewHistory', () => UserViews.deleteMany({ phoneNumber: re }));

    // 2. Their own listings and buyer requests — existing soft-delete flags.
    await step('listings', () => AddModel.updateMany(
      { phoneNumber: re, status: { $ne: 'delete' } },
      { $set: { status: 'delete', deletionReason: 'Account deleted by owner', deletionDate: now } },
    ));
    await step('buyerRequests', () => BuyerAssistance.updateMany(
      { phoneNumber: re, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: now } },
    ));

    // 3. Their number inside other people's listings.
    const pull = {};
    const anyMatch = [];
    for (const field of LISTING_PHONE_ARRAYS) {
      pull[field] = { phoneNumber: re };
      anyMatch.push({ [`${field}.phoneNumber`]: re });
    }
    await step('removedFromOtherListings', () => AddModel.updateMany({ $or: anyMatch }, { $pull: pull }));

    // 4. Close the login — last.
    await step('loginRecords', () => UserLogin.updateMany(
      { phone: digits },
      { $set: { status: 'deleted', deletedDate: now, deleteReason: reason, deletedBy: 'Self (account deletion)' } },
    ));

    return res.status(200).json({ message: 'Account deleted successfully.', summary });
  } catch (error) {
    return res.status(500).json({
      message: 'Account deletion did not finish. Please try again.',
      completed: summary,
      error: error.message,
    });
  }
});

module.exports = router;
