const express = require("express");
const Notification = require("../Notification/NotificationModel");
// City-base helpers: insertMany() bypasses the model's pre('save') hook, so we
// stamp `base` (PY/CH) manually from the request's active scope here.
const { resolveBaseForSave } = require("../utils/baseFilter");
const { getScopedBase } = require("../utils/baseScope");

const router = express.Router();



// // Function to normalize phone numbers
// const normalizePhoneNumber = (phoneNumber) => {
//     if (!phoneNumber) return "";

//     // Remove all non-numeric characters except '+'
//     phoneNumber = phoneNumber.replace(/[^\d+]/g, "");

//     // If number starts with country code without '+', add '+'
//     if (/^91\d{10}$/.test(phoneNumber)) {
//         phoneNumber = `+${phoneNumber}`;
//     }

//     // If number is 10 digits (local format), assume India (+91)
//     if (/^\d{10}$/.test(phoneNumber)) {
//         phoneNumber = `+91${phoneNumber}`;
//     }

//     return phoneNumber;
// };

// // Create a new notification
// router.post("/send-notification", async (req, res) => {
//     try {
//         let { userPhoneNumber, message, type, ppcId } = req.body;

//         userPhoneNumber = normalizePhoneNumber(userPhoneNumber);

//         // Validate required fields
//         if (!userPhoneNumber) {
//             return res.status(400).json({ error: "userPhoneNumber is required" });
//         }
//         if (!message) {
//             return res.status(400).json({ error: "message is required" });
//         }
//         if (!type || !["message", "favorite", "interest", "photo_request"].includes(type)) {
//             return res.status(400).json({ error: "Invalid notification type" });
//         }

//         // Create notification
//         const notification = new Notification({
//             userPhoneNumber,
//             message,
//             type,
//             ppcId
//         });

//         await notification.save();
//         return res.status(201).json({ success: true, notification });
//     } catch (error) {
//         return res.status(500).json({ error: "Error creating notification", details: error.message });
//     }
// });




// Utility: Normalize and strip country code (keep only last 10 digits)
function normalizePhoneNumber(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-10);
}

// router.post("/send-notification", async (req, res) => {
//   try {
//     let { userPhoneNumber, message, type, ppcId } = req.body;

//     // Convert single number to array for convenience (optional support)
//     if (!Array.isArray(userPhoneNumber)) {
//       userPhoneNumber = [userPhoneNumber];
//     }

//     // Validate phone count (1 to 20)
//     if (userPhoneNumber.length < 1 || userPhoneNumber.length > 20) {
//       return res.status(400).json({ error: "You must provide between 1 and 20 phone numbers" });
//     }

//     // Validate message
//     if (!message || typeof message !== "string" || message.trim() === "") {
//       return res.status(400).json({ error: "message is required" });
//     }

//     // Validate type
//     const validTypes = ["message", "warning"];
//     if (!type || !validTypes.includes(type)) {
//       return res.status(400).json({ error: "Invalid notification type" });
//     }

//     // Normalize numbers and validate
//     const normalizedNumbers = userPhoneNumber.map(normalizePhoneNumber);
//     const invalidNumbers = normalizedNumbers.filter(num => num.length !== 10);

//     if (invalidNumbers.length > 0) {
//       return res.status(400).json({
//         error: `Invalid phone numbers (must be 10 digits): ${invalidNumbers.join(', ')}`
//       });
//     }

//     // Prepare and save notifications
//     const notifications = normalizedNumbers.map(phone => ({
//       userPhoneNumber: phone,
//       message,
//       type,
//       ppcId
//     }));

//     const result = await Notification.insertMany(notifications);

//     return res.status(201).json({
//       success: true,
//       message: `${result.length} notifications sent successfully`,
//       notifications: result
//     });

//   } catch (error) {
//     return res.status(500).json({
//       error: "Error sending notifications",
//       details: error.message
//     });
//   }
// });



// Fetch notifications for a specific user using userPhoneNumber




router.post("/send-notification", async (req, res) => {
  try {
    let { userPhoneNumber, message, type, ppcId } = req.body;

    // Convert single number to array for convenience
    if (!Array.isArray(userPhoneNumber)) {
      userPhoneNumber = [userPhoneNumber];
    }

    // ✅ Updated limit: 1 to 100 phone numbers
    if (userPhoneNumber.length < 1 || userPhoneNumber.length > 100) {
      return res.status(400).json({ error: "You must provide between 1 and 100 phone numbers" });
    }

    // Validate message
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "message is required" });
    }

    // Validate type
    const validTypes = ["message", "warning"];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid notification type" });
    }

    // Normalize numbers and validate
    const normalizedNumbers = userPhoneNumber.map(normalizePhoneNumber);
    const invalidNumbers = normalizedNumbers.filter(num => num.length !== 10);

    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        error: `Invalid phone numbers (must be 10 digits): ${invalidNumbers.join(', ')}`
      });
    }

    // Stamp the active city base once (insertMany skips the pre('save') hook).
    const base = resolveBaseForSave(getScopedBase(), {});

    // Prepare and save notifications
    const notifications = normalizedNumbers.map(phone => ({
      userPhoneNumber: phone,
      message,
      type,
      ppcId,
      base
    }));

    const result = await Notification.insertMany(notifications);

    return res.status(201).json({
      success: true,
      message: `${result.length} notifications sent successfully`,
      notifications: result
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error sending notifications",
      details: error.message
    });
  }
});


router.get("/notifications/:userPhoneNumber", async (req, res) => {
    try {
        let { userPhoneNumber } = req.params;

        userPhoneNumber = normalizePhoneNumber(userPhoneNumber);

        const notifications = await Notification.find({ userPhoneNumber }).sort({ createdAt: -1 });

        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        return res.status(500).json({ error: "Error fetching notifications", details: error.message });
    }
});

// Get the count of notifications for a specific user
router.get("/notifications/count/:userPhoneNumber", async (req, res) => {
  try {
      let { userPhoneNumber } = req.params;

      userPhoneNumber = normalizePhoneNumber(userPhoneNumber);

      const count = await Notification.countDocuments({ userPhoneNumber });

      return res.status(200).json({ success: true, count });
  } catch (error) {
      return res.status(500).json({ error: "Error fetching notification count", details: error.message });
  }
});


// Fetch a single notification by _id
router.get("/notification/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        return res.status(200).json({ success: true, notification });
    } catch (error) {
        return res.status(500).json({ error: "Error fetching notification", details: error.message });
    }
});

// Update a notification by _id
router.put("/notification/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { message, type, isRead } = req.body;

        const notification = await Notification.findByIdAndUpdate(
            id,
            { message, type, isRead },
            { new: true, runValidators: true }
        );

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        return res.status(200).json({ success: true, notification });
    } catch (error) {
        return res.status(500).json({ error: "Error updating notification", details: error.message });
    }
});


// Delete a notification by _id
router.delete("/notification/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        return res.status(200).json({ success: true, message: "Notification deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Error deleting notification", details: error.message });
    }
});

// Delete all notifications for a user using userPhoneNumber
router.delete("/notifications/user/:userPhoneNumber", async (req, res) => {
    try {
        let { userPhoneNumber } = req.params;

        userPhoneNumber = normalizePhoneNumber(userPhoneNumber);

        const result = await Notification.deleteMany({ userPhoneNumber });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "No notifications found for this user" });
        }

        return res.status(200).json({ success: true, message: "All notifications deleted for user" });
    } catch (error) {
        return res.status(500).json({ error: "Error deleting notifications", details: error.message });
    }
});

// Fetch all notifications
router.get("/notifications", async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });

        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        return res.status(500).json({ error: "Error fetching notifications", details: error.message });
    }
});

module.exports = router;















