
const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    recipientPhoneNumber: { type: String, required: true }, // Property owner
    senderPhoneNumber: { type: String, required: true }, 
    userPhoneNumber: { type: String},      // Mainly used for filtering (can be same as recipient)
    ppcId: { type: String },
    message: { type: String, required: true },
    type: { type: String },                 // Notification type (interest, update, plan, etc.)

    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// ── Push on create (additive) ──────────────────────────────────────────
// Every event that creates one of these in-app notifications (interest,
// offer, favorite, contact/photo/address request, buyer assistance, report,
// property add/update, …) also fires an FCM push, so the user is told on
// their phone instead of only finding it in the Admin Notification list.
// `.create()` runs the 'save' hook, and all 22 creation sites in this
// backend use `.create()`, so this one place covers them without touching
// any router.
// Fire-and-forget: a push failure must never affect notification creation.
const NOTIF_TITLES = {
  interest: "New Interest",
  offer: "New Offer",
  contact: "Contact Shared",
  photo: "Photo Request",
  address: "Address Request",
  plan: "Plan Update",
  update: "Property Update",
  "property-Add": "Property Added",
  "property-view": "Property Viewed",
};

// Hide the last five digits of any 10-digit phone number in the pushed text,
// e.g. "User 8870579449 requested photos" -> "User 88705***** requested photos".
// Only the push body is masked — the stored notification and the admin
// "Admin Notification" screen keep the full number.
// The \b guards stop it from touching ppcIds or longer digit runs.
function maskLast5(text) {
  return String(text || "").replace(/\b(\d{5})\d{5}\b/g, "$1*****");
}

NotificationSchema.post("save", function (doc) {
  try {
    if (!doc || !doc.message) return;
    // Required lazily to avoid any load-order surprises.
    const {
      sendPushToUser,
      normalizePhoneNumber,
      DEFAULT_TITLE,
    } = require("../fcm/sendPush");

    // Push to the RECIPIENT ONLY.
    //
    // Every message in the system is written in the second person addressed
    // to the recipient ("your property"), so the sender is never a valid
    // audience for it — pushing to both would alert the person who acted
    // about their own action ("User 70944***** viewed your property" sent
    // back to the viewer).
    //
    // The stored document is unchanged — senderPhoneNumber still records who
    // acted, and the admin "Admin Notification" screen still shows both
    // columns.
    //
    // Numbers are stored in several shapes (+91…, 91…, bare) so normalize
    // first. Rows raised by the backend itself carry "admin" / "system"
    // instead of a number and normalize to "", which the length check drops.
    const recipient = normalizePhoneNumber(doc.recipientPhoneNumber);
    if (!recipient || recipient.length !== 10) return;

    // /user-view-property writes a self-receipt ("You viewed property (X)
    // successfully.") where the recipient IS the viewer. The Flutter app hits
    // that route on every property it opens, so pushing it would buzz the
    // user for their own browsing. It still lands in the in-app list.
    if (
      doc.type === "property-view" &&
      recipient === normalizePhoneNumber(doc.senderPhoneNumber)
    ) {
      return;
    }

    const title = NOTIF_TITLES[doc.type] || DEFAULT_TITLE;
    const body = maskLast5(doc.message);
    // `route` wins in the app's payload reader; ppcId rides along so a future
    // deep-link needs no backend change. Matches buildData() in
    // fcm/FcmTokenRouter.js and _routeFromData() in the Flutter push service.
    const data = { route: "/notification", ppcId: doc.ppcId || "" };

    sendPushToUser(recipient, { title, body }, data).catch(() => {});
  } catch (_) {
    /* never break the notification write */
  }
});

module.exports = mongoose.model("NotificationUser", NotificationSchema);
