

// routes/planLimitRoutes.js
const express = require("express");
const router = express.Router();
const PlanLimit = require("../Limit/LimitModel");

// Create or update a plan limit
router.post("/set-plan-limit", async (req, res) => {
  const { planName, planViewLimitPerDay } = req.body;
  if (!planName || typeof planViewLimitPerDay !== "number") {
    return res.status(400).json({ success: false, message: "Invalid input." });
  }

  try {
    const updatedPlan = await PlanLimit.findOneAndUpdate(
      { planName },
      { planViewLimitPerDay, isDeleted: false }, // reset isDeleted on update
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Daily limit for plan "${planName}" set to ${planViewLimitPerDay}`,
      plan: updatedPlan,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Get all plans that are NOT soft deleted
router.get("/get-all-plan-limits", async (req, res) => {
  try {
    const plans = await PlanLimit.find({ isDeleted: { $ne: true } });
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Temporary soft delete (set isDeleted: true)
router.patch("/temp-delete-plan-limit/:planName", async (req, res) => {
  try {
    const updated = await PlanLimit.findOneAndUpdate(
      { planName: req.params.planName },
      { isDeleted: true },
      { new: true }
    );
    res.json({ success: true, message: "Plan temporarily deleted.", plan: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Undo soft delete (set isDeleted: false)
router.patch("/undo-delete-plan-limit/:planName", async (req, res) => {
  try {
    const updated = await PlanLimit.findOneAndUpdate(
      { planName: req.params.planName },
      { isDeleted: false },
      { new: true }
    );
    res.json({ success: true, message: "Plan restored.", plan: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Permanently delete a plan
router.delete("/delete-plan-limit/:planName", async (req, res) => {
  try {
    await PlanLimit.findOneAndDelete({ planName: req.params.planName });
    res.json({ success: true, message: "Plan permanently deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;


























// const express = require("express");
// const router = express.Router();
// const PlanLimit = require("../Limit/LimitModel");


// router.post("/set-plan-limit", async (req, res) => {
//   const { planName, planViewLimitPerDay } = req.body; // ✅ Match schema field name

//   if (!planName || typeof planViewLimitPerDay !== "number") {
//     return res.status(400).json({ success: false, message: "Invalid input." });
//   }

//   try {
//     const updatedPlan = await PlanLimit.findOneAndUpdate(
//       { planName },
//       { planViewLimitPerDay },
//       { upsert: true, new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: `Daily limit for plan "${planName}" set to ${planViewLimitPerDay}`,
//       plan: updatedPlan,
//     });
//   } catch (err) {
//     console.error("Error setting plan limit:", err);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// });

// module.exports = router;












// // POST /admin/set-plan-limit
// // router.post("/set-plan-limit", async (req, res) => {
// //   const { planName, viewLimitPerDay } = req.body;

// //   try {
// //     const updated = await PlanLimit.findOneAndUpdate(
// //       { planName },
// //       { viewLimitPerDay },
// //       { upsert: true, new: true }
// //     );

// //     res.status(200).json({ message: "Plan limit set successfully", plan: updated });
// //   } catch (err) {
// //     res.status(500).json({ message: "Failed to set plan limit", error: err.message });
// //   }
// // });



