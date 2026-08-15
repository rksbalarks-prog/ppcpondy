const express = require('express');
const router = express.Router();
const PricingPlans = require('../plans/PricingPlanModel');
const AddModel = require('../AddModel');
const NotificationUser = require('../Notification/NotificationDetailModel');
const moment = require("moment"); // if you're using moment.js (optional but helpful)
const PaymentPayU = require('../PayU/PayUModel'); // Include your PayU model
const UserPricingPlan = require('../plans/UserPlan')


// // 🧠 Utility to check if a date is expired
// const isExpired = (expireDate) => {
//   return new Date() > new Date(expireDate);
// };

// // ✅ GET expired plans
// router.get('/expired-plans', async (req, res) => {
//   try {
//     // Get all plans with 'paid' status
//     const paidPlans = await PaymentPayU.find({ payustatususer: 'paid' });

//     const expiredPlans = [];

//     for (const plan of paidPlans) {
//       const { ppcId } = plan;

//       // Get expireDate from your Plan collection using ppcId
//       const planDoc = await PricingPlans.findOne({ ppcId });

//       if (planDoc && isExpired(planDoc.expireDate)) {
//         // ✅ Update status if expired
//         plan.payustatususer = 'expiredPlan';
//         await plan.save();

//         expiredPlans.push({
//           ppcId,
//           phone: plan.phone,
//           planName: plan.planName,
//           expireDate: planDoc.expireDate,
//           status: plan.payustatususer
//         });
//       }
//     }

//     res.json({ message: 'Expired plans fetched successfully.', expiredPlans });
//   } catch (error) {
//     console.error('Error fetching expired plans:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// });







// -----------

// router.get('/plans-by-phone/:phoneNumber', async (req, res) => {
//   const phoneNumber = req.params.phoneNumber;

//   try {
//     // 1. Fetch all plans for this phone number
//     const plans = await PricingPlans.find({
//       'phoneNumbers.number': phoneNumber
//     });

//     if (plans.length === 0) {
//       return res.status(404).json({
//         status: "error",
//         message: "No plans found for this phone number"
//       });
//     }

//     // 2. Collect all ppcIds
//     const allPpcIds = plans.flatMap(plan =>
//       plan.phoneNumbers.map(pn => pn.ppcId)
//     );

//     // 3. Fetch all related payments
//     const payments = await PaymentPayU.find({
//       ppcId: { $in: allPpcIds }
//     });

//     // 4. Create a map: ppcId -> best payment (prefer paid, else latest)
//     const paymentMap = {};
//     payments.forEach(payment => {
//       const current = paymentMap[payment.ppcId];
//       if (!current) {
//         paymentMap[payment.ppcId] = payment;
//       } else {
//         if (
//           payment.payustatususer === 'paid' &&
//           current.payustatususer !== 'paid'
//         ) {
//           paymentMap[payment.ppcId] = payment;
//         } else if (
//           new Date(payment.createdAt) > new Date(current.createdAt)
//         ) {
//           paymentMap[payment.ppcId] = payment;
//         }
//       }
//     });

//     const now = new Date();
//     const expiredPpcIds = [];
//     const enhancedPlans = [];

//     // 5. Enhance each plan
//     for (const plan of plans) {
//       const planExpireDate = new Date(plan.expireDate);
//       const phoneNumbersWithPayments = [];

//       for (const pn of plan.phoneNumbers) {
//         const paymentRaw = paymentMap[pn.ppcId] || null;
//         const paymentData = paymentRaw ? paymentRaw.toObject() : null;

//         // Use phoneNumber-specific expire date if present
//         const expireDate = pn.expireDate
//           ? new Date(pn.expireDate)
//           : planExpireDate;

//         const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

//         let expiryMessage = '';
//         if (diffDays > 0 && diffDays <= 5) {
//           expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
//         } else if (diffDays <= 0) {
//           expiryMessage = 'Expired';
//           expiredPpcIds.push(pn.ppcId);

//           // Mark plan as expired if not already paid
//           await PaymentPayU.updateMany(
//             { ppcId: pn.ppcId, payustatususer: { $ne: 'paid' } },
//             { $set: { payustatususer: 'expiredPlan' } }
//           );
//         }

//         // Inject expiry info into paymentData
//         if (paymentData) {
//           paymentData.expireDate = expireDate.toISOString();
//           paymentData.expiryMessage = expiryMessage;
//         }

//         // Clean up outer object fields
//         const { expireDate: _ed, expiryMessage: _em, createdAt: _ca, ...cleanPN } =
//           pn.toObject?.() || pn;

//         phoneNumbersWithPayments.push({
//           ...cleanPN,
//           paymentData
//         });
//       }

//       // Plan-level expiry message
//       const planDiffDays = Math.ceil((planExpireDate - now) / (1000 * 60 * 60 * 24));
//       let planExpiryMessage = '';
//       if (planDiffDays > 0 && planDiffDays <= 5) {
//         planExpiryMessage = `Expires in ${planDiffDays} day${planDiffDays > 1 ? 's' : ''}`;
//       } else if (planDiffDays <= 0) {
//         planExpiryMessage = 'Expired';
//       }

//       enhancedPlans.push({
//         ...plan.toObject(),
//         // expiryMessage: planExpiryMessage,
//         phoneNumbers: phoneNumbersWithPayments
//       });
//     }

//     // 6. Mark expired PPCs in AddModel
//     if (expiredPpcIds.length > 0) {
//       await AddModel.updateMany(
//         {
//           ppcId: { $in: expiredPpcIds },
//           status: { $ne: 'expired' }
//         },
//         { $set: { status: 'expired' } }
//       );
//     }

//     // 7. Send response
//     return res.status(200).json({
//       status: "success",
//       phoneNumber,
//       plans: enhancedPlans
//     });

//   } catch (error) {
//     console.error('Error in /plans-by-phone:', error);
//     return res.status(500).json({
//       status: "error",
//       message: "Error fetching plans by phone number",
//       error: error.message
//     });
//   }
// });







// router.get('/plans-by-phone/:phoneNumber', async (req, res) => {
//   const phoneNumber = req.params.phoneNumber;

//   try {
//     // 1. Fetch all plans for this phone number
//     const plans = await PricingPlans.find({
//       'phoneNumbers.number': phoneNumber
//     });

//     if (plans.length === 0) {
//       return res.status(404).json({
//         status: "error",
//         message: "No plans found for this phone number"
//       });
//     }

//     // 2. Collect all PPC IDs
//     const allPpcIds = plans.flatMap(plan =>
//       plan.phoneNumbers.map(pn => pn.ppcId)
//     );

//     // 3. Fetch all related payments
//     const payments = await PaymentPayU.find({
//       ppcId: { $in: allPpcIds }
//     });

//     // 4. Create a map: ppcId -> best payment (prefer paid, else latest)
//     const paymentMap = {};
//     payments.forEach(payment => {
//       const current = paymentMap[payment.ppcId];
//       if (!current) {
//         paymentMap[payment.ppcId] = payment;
//       } else {
//         if (
//           payment.payustatususer === 'paid' &&
//           current.payustatususer !== 'paid'
//         ) {
//           paymentMap[payment.ppcId] = payment;
//         } else if (
//           new Date(payment.createdAt) > new Date(current.createdAt)
//         ) {
//           paymentMap[payment.ppcId] = payment;
//         }
//       }
//     });

//     const now = new Date();
//     const expiredPpcIds = [];
//     const enhancedPlans = [];

//     // 5. Enhance each plan
//     for (const plan of plans) {
//       const planExpireDate = new Date(plan.expireDate);
//       const phoneNumbersWithPayments = [];

//       for (const pn of plan.phoneNumbers) {
//         const paymentRaw = paymentMap[pn.ppcId] || null;
//         const paymentData = paymentRaw ? paymentRaw.toObject() : null;

//         let enrichedPaymentData = paymentData;

//         if (paymentData && paymentData.payustatususer === 'paid') {
//           const expireDate = pn.expireDate
//             ? new Date(pn.expireDate)
//             : planExpireDate;

//           const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

//           let expiryMessage = '';
//           if (diffDays > 0 && diffDays <= 5) {
//             expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
//           } else if (diffDays <= 0) {
//             expiryMessage = 'Expired';
//             expiredPpcIds.push(pn.ppcId);
//           }

//           enrichedPaymentData.expireDate = expireDate.toISOString();
//           enrichedPaymentData.expiryMessage = expiryMessage;
//         }

//         // Remove unwanted keys from outside
//         const { expireDate: _ed, expiryMessage: _em, createdAt: _ca, ...cleanPN } =
//           pn.toObject?.() || pn;

//         phoneNumbersWithPayments.push({
//           ...cleanPN,
//           paymentData: enrichedPaymentData
//         });
//       }

//       enhancedPlans.push({
//         ...plan.toObject(),
//         phoneNumbers: phoneNumbersWithPayments
//       });
//     }

//     // 6. Mark expired PPCs in AddModel
//     if (expiredPpcIds.length > 0) {
//       await AddModel.updateMany(
//         {
//           ppcId: { $in: expiredPpcIds },
//           status: { $ne: 'expired' }
//         },
//         { $set: { status: 'expired' } }
//       );
//     }

//     // 7. Send response
//     return res.status(200).json({
//       status: "success",
//       phoneNumber,
//       plans: enhancedPlans
//     });

//   } catch (error) {
//     console.error('Error in /plans-by-phone:', error);
//     return res.status(500).json({
//       status: "error",
//       message: "Error fetching plans by phone number",
//       error: error.message
//     });
//   }
// });



// router.get('/plans-by-phone/:phoneNumber', async (req, res) => {
//   const phoneNumber = req.params.phoneNumber;

//   try {
//     // 1. Fetch plans
//     const plans = await PricingPlans.find({
//       'phoneNumbers.number': phoneNumber
//     });

//     if (!plans.length) {
//       return res.status(404).json({ status: "error", message: "No plans found" });
//     }

//     // 2. Get all PPC IDs
//     const allPpcIds = plans.flatMap(plan => plan.phoneNumbers.map(pn => pn.ppcId));

//     // 3. Get all payment records for those PPCs
//     const payments = await PaymentPayU.find({ ppcId: { $in: allPpcIds } });

//     // 4. Best/latest payment per PPC ID
//     const paymentMap = {};
//     for (const payment of payments) {
//       const current = paymentMap[payment.ppcId];
//       if (!current || new Date(payment.createdAt) > new Date(current.createdAt)) {
//         paymentMap[payment.ppcId] = payment;
//       }
//     }

//     const now = new Date();
//     const today = new Date(now.toISOString().slice(0, 10)); // Remove time portion
//     const expiredPpcIds = [];
//     const enhancedPlans = [];

//     // 5. Enhance each plan
//     for (const plan of plans) {
//       const planExpireDate = new Date(plan.expireDate);
//       const phoneNumbersWithPayments = [];

//       for (const pn of plan.phoneNumbers) {
//         const paymentRaw = paymentMap[pn.ppcId] || null;
//         const paymentData = paymentRaw ? paymentRaw.toObject() : null;

//         let enrichedPaymentData = paymentData;

//         const expireDate = pn.expireDate
//           ? new Date(pn.expireDate)
//           : planExpireDate;


//         if (paymentData) {
//   if (
//     paymentData.status === "success" &&
//     (paymentData.payustatususer === "paid" || paymentData.payustatususer === "expiredPlan")
//   ) {
//     const isExpired = expireDate <= today;

//     if (isExpired) {
//       enrichedPaymentData.payustatususer = "expiredPlan";
//       enrichedPaymentData.expireDate = expireDate.toISOString();
//       enrichedPaymentData.expiryMessage = "Expired";
//       expiredPpcIds.push(pn.ppcId);
//     } else {
//       const diffDays = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
//       if (diffDays <= 5) {
//         enrichedPaymentData.expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
//         enrichedPaymentData.expireDate = expireDate.toISOString();
//       }

      
// // const diffTime = expireDate - now;
// // const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

// // if (expireDate.toDateString() === now.toDateString()) {
// //   enrichedPaymentData.expiryMessage = "Expired today";
// // } else if (diffDays <= 0) {
// //   enrichedPaymentData.expiryMessage = "Expired";
// //   enrichedPaymentData.payustatususer = "expiredPlan";
// //   expiredPpcIds.push(pn.ppcId);
// // } 
// else {
//   enrichedPaymentData.expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
// }

//     }
//   }
// }


//         const {
//           expireDate: _ed,
//           expiryMessage: _em,
//           createdAt: _ca,
//           ...cleanPN
//         } = pn.toObject?.() || pn;

//         phoneNumbersWithPayments.push({
//           ...cleanPN,
//           paymentData: enrichedPaymentData
//         });
//       }

//       enhancedPlans.push({
//         ...plan.toObject(),
//         phoneNumbers: phoneNumbersWithPayments
//       });
//     }

//     // 6. Update status in AddModel for expired PPCs
//     if (expiredPpcIds.length > 0) {
//       await AddModel.updateMany(
//         { ppcId: { $in: expiredPpcIds }, status: { $ne: "expired" } },
//         { $set: { status: "expired" } }
//       );
//     }

//     // 7. Return response
//     return res.status(200).json({
//       status: "success",
//       phoneNumber,
//       plans: enhancedPlans
//     });

//   } catch (error) {
//     console.error("Error in /plans-by-phone:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Error fetching plans",
//       error: error.message
//     });
//   }
// });

















// **********************


// router.get('/plans-by-phone/:phoneNumber', async (req, res) => {
//   const phoneNumber = req.params.phoneNumber;

//   try {
//     const plans = await PricingPlans.find({
//       'phoneNumbers.number': phoneNumber
//     });

//     if (!plans.length) {
//       return res.status(404).json({ status: "error", message: "No plans found" });
//     }

//     const allPpcIds = plans.flatMap(plan => plan.phoneNumbers.map(pn => pn.ppcId));

//     // Get payment data for all PPCs
//     const payments = await PaymentPayU.find({ ppcId: { $in: allPpcIds } });

//     // Get status from AddModel
//     const addModelStatuses = await AddModel.find(
//       { ppcId: { $in: allPpcIds } },
//       { ppcId: 1, status: 1 }
//     );
//     const statusMap = {};
//     for (let entry of addModelStatuses) {
//       statusMap[entry.ppcId] = entry.status;
//     }

//     // Best/latest payment per PPC
//     const paymentMap = {};
//     for (const payment of payments) {
//       const current = paymentMap[payment.ppcId];
//       if (!current || new Date(payment.createdAt) > new Date(current.createdAt)) {
//         paymentMap[payment.ppcId] = payment;
//       }
//     }

//     const now = new Date();
//     const today = new Date(now.toISOString().slice(0, 10));
//     const expiredPpcIds = [];
//     const enhancedPlans = [];

//     for (const plan of plans) {
//       const planExpireDate = new Date(plan.expireDate);
//       const phoneNumbersWithPayments = [];

//       for (const pn of plan.phoneNumbers) {
//         const paymentRaw = paymentMap[pn.ppcId] || null;
//         const paymentData = paymentRaw ? paymentRaw.toObject() : null;

//         const expireDate = pn.expireDate
//           ? new Date(pn.expireDate)
//           : planExpireDate;

//         let enrichedPaymentData = paymentData;
//         const ppcId = pn.ppcId;

//         if (paymentData) {
//           if (
//             paymentData.status === "success" &&
//             (paymentData.payustatususer === "paid" || paymentData.payustatususer === "expiredPlan")
//           ) {
//             const isExpired = expireDate <= today;

//             if (isExpired) {
//               enrichedPaymentData.payustatususer = "expiredPlan";
//               enrichedPaymentData.expireDate = expireDate.toISOString();
//               enrichedPaymentData.expiryMessage = "Expired";

//               expiredPpcIds.push(ppcId);

//               // Update AddModel to expired if not already
//               if (statusMap[ppcId] !== "expired") {
//                 await AddModel.updateOne(
//                   { ppcId },
//                   { $set: { status: "expired" } }
//                 );
//                 statusMap[ppcId] = "expired";
//               }

//               // Save updated payustatususer to DB
//               await PaymentPayU.updateOne(
//                 { _id: enrichedPaymentData._id },
//                 {
//                   $set: {
//                     payustatususer: "expiredPlan",
//                     updatedAt: new Date()
//                   }
//                 }
//               );
//             } else {
//               const diffDays = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
//               enrichedPaymentData.expireDate = expireDate.toISOString();

//               if (diffDays === 0) {
//                 enrichedPaymentData.expiryMessage = "Expires today";
//               } 
//               else if (diffDays < 0) {
//                 enrichedPaymentData.expiryMessage = "Expired";
//               }
//                else {
//                 enrichedPaymentData.expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
//               }
//             }
//           }
//         }

//         const {
//           expireDate: _ed,
//           expiryMessage: _em,
//           createdAt: _ca,
//           ...cleanPN
//         } = pn.toObject?.() || pn;

//         phoneNumbersWithPayments.push({
//           ...cleanPN,
//           status: statusMap[ppcId] || "unknown",
//           paymentData: enrichedPaymentData
//         });
//       }

//       enhancedPlans.push({
//         ...plan.toObject(),
//         phoneNumbers: phoneNumbersWithPayments
//       });
//     }

//     return res.status(200).json({
//       status: "success",
//       phoneNumber,
//       plans: enhancedPlans
//     });

//   } catch (error) {
//     console.error("Error in /plans-by-phone:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Error fetching plans",
//       error: error.message
//     });
//   }
// });

// ************


router.get('/plans-by-phone/:phoneNumber', async (req, res) => {
  const phoneNumber = req.params.phoneNumber;

  try {
    // 1. Fetch plans containing the phone number
    const plans = await PricingPlans.find({ 'phoneNumbers.number': phoneNumber });

    if (!plans.length) {
      return res.status(404).json({ status: "error", message: "No plans found" });
    }

    // 2. Get all PPC IDs
    const allPpcIds = plans.flatMap(plan => plan.phoneNumbers.map(pn => pn.ppcId));

    // 3. Fetch latest payments for these PPC IDs
    const payments = await PaymentPayU.find({ ppcId: { $in: allPpcIds } });

    // 4. Fetch statuses from AddModel
    const addModelStatuses = await AddModel.find({ ppcId: { $in: allPpcIds } }, { ppcId: 1, status: 1 });
    const statusMap = {};
    for (const item of addModelStatuses) statusMap[item.ppcId] = item.status;

    // 5. Map latest payment per PPC ID
    const paymentMap = {};
    for (const payment of payments) {
      const current = paymentMap[payment.ppcId];
      if (!current || new Date(payment.createdAt) > new Date(current.createdAt)) {
        paymentMap[payment.ppcId] = payment;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize today to midnight
    const enhancedPlans = [];

    // 6. Loop through plans and enrich payment data
    for (const plan of plans) {
      const phoneNumbersWithPayments = [];

      for (const pn of plan.phoneNumbers) {
        const ppcId = pn.ppcId;
        const paymentRaw = paymentMap[ppcId] || null;
        const paymentData = paymentRaw ? paymentRaw.toObject() : null;

        let enrichedPaymentData = paymentData;

        if (paymentData && paymentData.status === "success") {
          // Calculate expireDate based on payUdate + durationDays
          const payDate = new Date(paymentData.payUdate);
          const expireDate = new Date(payDate);
          expireDate.setDate(payDate.getDate() + plan.durationDays);

          enrichedPaymentData.expireDate = expireDate.toISOString();

          // Normalize expireDate to midnight
          const expireMidnight = new Date(expireDate);
          expireMidnight.setHours(0, 0, 0, 0);

          const diffDays = Math.ceil((expireMidnight - today) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            enrichedPaymentData.payustatususer = "expiredPlan";
            enrichedPaymentData.expiryMessage = "Expired";

            // Update AddModel if not already expired
            if (statusMap[ppcId] !== "expired") {
              await AddModel.updateOne({ ppcId }, { $set: { status: "expired" } });
              statusMap[ppcId] = "expired";
            }

            // Update PaymentPayU
            await PaymentPayU.updateOne({ _id: enrichedPaymentData._id }, {
              $set: { payustatususer: "expiredPlan", updatedAt: new Date() }
            });

          } else if (diffDays === 0) {
            enrichedPaymentData.expiryMessage = "Expires today";
          } else {
            enrichedPaymentData.expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
          }
        }

        // Clean phoneNumber object
        const { expireDate: _ed, expiryMessage: _em, createdAt: _ca, ...cleanPN } = pn.toObject?.() || pn;

        phoneNumbersWithPayments.push({
          ...cleanPN,
          status: statusMap[ppcId] || "active",
          paymentData: enrichedPaymentData
        });
      }

      enhancedPlans.push({
        ...plan.toObject(),
        phoneNumbers: phoneNumbersWithPayments
      });
    }

    return res.status(200).json({
      status: "success",
      phoneNumber,
      plans: enhancedPlans
    });

  } catch (error) {
    console.error("Error in /plans-by-phone:", error);
    return res.status(500).json({ status: "error", message: "Error fetching plans", error: error.message });
  }
});




// router.get('/plans-by-phone/:phoneNumber', async (req, res) => {
//   const phoneNumber = req.params.phoneNumber;

//   try {
//     // 1. Fetch plans
//     const plans = await PricingPlans.find({
//       'phoneNumbers.number': phoneNumber
//     });

//     if (!plans.length) {
//       return res.status(404).json({ status: "error", message: "No plans found" });
//     }

//     // 2. Get all PPC IDs
//     const allPpcIds = plans.flatMap(plan => plan.phoneNumbers.map(pn => pn.ppcId));

//     // 3. Fetch all payments for these PPC IDs
//     const payments = await PaymentPayU.find({ ppcId: { $in: allPpcIds } });

//     // 4. Fetch statuses from AddModel
//     const addModelStatuses = await AddModel.find(
//       { ppcId: { $in: allPpcIds } },
//       { ppcId: 1, status: 1 }
//     );

//     const statusMap = {};
//     for (const item of addModelStatuses) {
//       statusMap[item.ppcId] = item.status;
//     }

//     // 5. Get latest payment for each PPC ID
//     const paymentMap = {};
//     for (const payment of payments) {
//       const current = paymentMap[payment.ppcId];
//       if (!current || new Date(payment.createdAt) > new Date(current.createdAt)) {
//         paymentMap[payment.ppcId] = payment;
//       }
//     }

//     const now = new Date();
//     const today = new Date(now.toISOString().slice(0, 10));
//     const expiredPpcIds = [];
//     const enhancedPlans = [];

//     // 6. Loop through all plans
//     for (const plan of plans) {
//       const planExpireDate = new Date(plan.expireDate);
//       const phoneNumbersWithPayments = [];

//       for (const pn of plan.phoneNumbers) {
//         const ppcId = pn.ppcId;
//         const paymentRaw = paymentMap[ppcId] || null;
//         const paymentData = paymentRaw ? paymentRaw.toObject() : null;

//         const expireDate = pn.expireDate
//           ? new Date(pn.expireDate)
//           : planExpireDate;

//         let enrichedPaymentData = paymentData;

//         if (paymentData) {
//           if (
//             paymentData.status === "success" &&
//             (paymentData.payustatususer === "paid" || paymentData.payustatususer === "expiredPlan")
//           ) {
//             enrichedPaymentData.expireDate = expireDate.toISOString();

//             const isExpired = expireDate < today;
//             const isToday = expireDate.toDateString() === today.toDateString();

//             if (isExpired) {
//               enrichedPaymentData.payustatususer = "expiredPlan";
//               enrichedPaymentData.expiryMessage = "Expired";
//               expiredPpcIds.push(ppcId);

//               // Update AddModel if not already marked expired
//               if (statusMap[ppcId] !== "expired") {
//                 await AddModel.updateOne({ ppcId }, { $set: { status: "expired" } });
//                 statusMap[ppcId] = "expired";
//               }

//               // Update PaymentPayU with expiredPlan
//               await PaymentPayU.updateOne(
//                 { _id: enrichedPaymentData._id },
//                 {
//                   $set: {
//                     payustatususer: "expiredPlan",
//                     updatedAt: new Date()
//                   }
//                 }
//               );
//             } else if (isToday) {
//               enrichedPaymentData.expiryMessage = "Expires today";
//             } else {
//               const diffDays = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
//               enrichedPaymentData.expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
//             }
//           }
//         }

//         // Remove redundant fields and include status
//         const {
//           expireDate: _ed,
//           expiryMessage: _em,
//           createdAt: _ca,
//           ...cleanPN
//         } = pn.toObject?.() || pn;

//         phoneNumbersWithPayments.push({
//           ...cleanPN,
//           status: statusMap[ppcId] || "unknown",
//           paymentData: enrichedPaymentData
//         });
//       }

//       enhancedPlans.push({
//         ...plan.toObject(),
//         phoneNumbers: phoneNumbersWithPayments
//       });
//     }

//     // 7. Return final response
//     return res.status(200).json({
//       status: "success",
//       phoneNumber,
//       plans: enhancedPlans
//     });

//   } catch (error) {
//     console.error("Error in /plans-by-phone:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Error fetching plans",
//       error: error.message
//     });
//   }
// });



router.post('/pay-now/:ppcId', async (req, res) => {
  const { ppcId } = req.params;

  try {
    // 1. Find the plan containing this ppcId
    const plan = await PricingPlans.findOne({ 'phoneNumbers.ppcId': ppcId });
    if (!plan) {
      return res.status(404).json({ status: "error", message: "Plan not found" });
    }

    // 2. Find the phoneNumber entry
    const phoneNumberEntry = plan.phoneNumbers.find(pn => pn.ppcId == ppcId);
    if (!phoneNumberEntry) {
      return res.status(404).json({ status: "error", message: "PPC ID not found in plan" });
    }

    // 3. Update or create payment record
    let payment = await PaymentPayU.findOne({ ppcId });

    const today = new Date(); // current date for payUdate
    const expireDate = new Date(today);
    expireDate.setDate(today.getDate() + plan.durationDays); // calculate expireDate

    if (!payment) {
      // create new payment record
      payment = await PaymentPayU.create({
        txnid: `txn_${Date.now()}`,
        status: "success",
        amount: plan.price,
        productinfo: "Subscription Plan",
        firstname: "Owner",
        email: "owner@example.com",
        phone: phoneNumberEntry.number,
        payUdate: today,
        payustatususer: "paid",
        planName: plan.name,
        ppcId: ppcId,
        expireDate: expireDate
      });
    } else {
      // update existing payment
      payment.payUdate = today;
      payment.payustatususer = "paid";
      payment.status = "success";
      payment.expireDate = expireDate;
      payment.updatedAt = new Date();
      await payment.save();
    }

    // 4. Update AddModel status to active if expired before
    const addModelEntry = await AddModel.findOne({ ppcId });
    if (addModelEntry && addModelEntry.status === "expired") {
      addModelEntry.status = "active";
      await addModelEntry.save();
    }

    return res.status(200).json({
      status: "success",
      message: "Payment updated successfully",
      data: {
        number: phoneNumberEntry.number,
        ppcId,
        status: "active",
        paymentData: payment
      }
    });

  } catch (error) {
    console.error("Error in /pay-now:", error);
    return res.status(500).json({ status: "error", message: "Error updating payment", error: error.message });
  }
});



// router.post('/pay-now/:ppcId', async (req, res) => {
//   const { ppcId } = req.params;

//   try {
//     // 1. Find the latest payment for this PPC ID
//     let payment = await PaymentPayU.findOne({ ppcId }).sort({ createdAt: -1 });

//     if (!payment) {
//       return res.status(404).json({ status: 'error', message: 'Payment record not found' });
//     }

//     // 2. Update the payustatususer to "paid"
//     payment.payustatususer = 'paid';
//     payment.updatedAt = new Date();

//     await payment.save();

//     // Optional: Update AddModel status if needed
//     await AddModel.updateOne({ ppcId }, { $set: { status: 'active' } });

//     // 3. Return updated payment data
//     return res.status(200).json({
//       status: 'success',
//       message: `Payment status updated to paid for PPC ID ${ppcId}`,
//       paymentData: payment
//     });

//   } catch (error) {
//     console.error('Error in /pay-now/:ppcId', error);
//     return res.status(500).json({
//       status: 'error',
//       message: 'Failed to update payment status',
//       error: error.message
//     });
//   }
// });



// GET expired plans and count by phone number


router.get('/expired-plans-by-phone', async (req, res) => {
  const { phoneNumber } = req.query; // 🔄 from req.params → req.query

  if (!phoneNumber) {
    return res.status(400).json({ status: 'error', message: 'Phone number is required' });
  }

  try {
    const expiredProperties = await AddModel.find({
      phoneNumber,
      status: 'expired',
    }).sort({ updatedAt: -1 });

    res.json({
      status: 'success',
      phoneNumber,
      expiredCount: expiredProperties.length,
      expiredPlans: expiredProperties,
    });
  } catch (error) {
    console.error('Error fetching expired properties:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
});



// // GET expired properties by phone number
// router.get('/expired-plans-by-phone', async (req, res) => {
//   const { phoneNumber } = req.query;

//   if (!phoneNumber) {
//     return res.status(400).json({ status: 'error', message: 'Phone number is required' });
//   }

//   try {
//     // Step 1: Find all expired properties from AddModel
//     const expiredProperties = await AddModel.find({
//       phoneNumber: phoneNumber,
//       status: 'expired'
//     }).sort({ updatedAt: -1 });

//     if (expiredProperties.length === 0) {
//       return res.json({
//         status: 'success',
//         phoneNumber,
//         expiredCount: 0,
//         expiredPlans: []
//       });
//     }

//     // Step 2: Get all ppcIds from expired AddModel entries
//     const expiredPpcIds = expiredProperties.map((item) => item.ppcId);

//     // Step 3: Fetch latest PaymentPayU record for each expired ppcId
//     const payments = await PaymentPayU.find({ ppcId: { $in: expiredPpcIds } }).sort({ createdAt: -1 });

//     const paymentMap = {};
//     for (const payment of payments) {
//       if (!paymentMap[payment.ppcId]) {
//         paymentMap[payment.ppcId] = payment; // keep only latest
//       }
//     }

//     // Step 4: Build response with proper expireDate and expiryMessage
//     const today = new Date().toISOString().split("T")[0];
//     const expiredPlans = expiredProperties.map((prop) => {
//       const payment = paymentMap[prop.ppcId];
//       let expireDate = null;
//       let expiryMessage = null;

//       if (payment?.expireDate) {
//         const expire = new Date(payment.expireDate);
//         const todayDate = new Date(today);
//         const diff = Math.ceil((expire - todayDate) / (1000 * 60 * 60 * 24));

//         if (expire.toISOString().split("T")[0] === today) {
//           expiryMessage = "Expires today";
//         } else if (expire < todayDate) {
//           expiryMessage = "Expired";
//         } else {
//           expiryMessage = `Expires in ${diff} day${diff > 1 ? "s" : ""}`;
//         }

//         expireDate = expire.toISOString();
//       }

//       return {
//         ppcId: prop.ppcId,
//         phoneNumber: prop.phoneNumber,
//         status: prop.status,
//         expireDate,
//         expiryMessage,
//         paymentData: payment || null
//       };
//     });

//     return res.json({
//       status: 'success',
//       phoneNumber,
//       expiredCount: expiredPlans.length,
//       expiredPlans
//     });

//   } catch (error) {
//     console.error('Error fetching expired properties:', error);
//     return res.status(500).json({
//       status: 'error',
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// });




// GET expired properties by phone number with full property and payment data
router.get("/expired-plans-by-phone", async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({
      status: "error",
      message: "Phone number is required",
    });
  }

  try {
    // 1. Get all expired properties by phoneNumber
    const expiredProperties = await AddModel.find({
      phoneNumber,
      status: "expired",
    }).sort({ updatedAt: -1 });

    const ppcIds = expiredProperties.map((prop) => prop.ppcId);

    // 2. Get latest payment data for all ppcIds
    const allPayments = await PaymentPayU.find({ ppcId: { $in: ppcIds } });

    const paymentMap = {};
    for (const payment of allPayments) {
      if (
        !paymentMap[payment.ppcId] ||
        new Date(payment.createdAt) > new Date(paymentMap[payment.ppcId].createdAt)
      ) {
        paymentMap[payment.ppcId] = payment;
      }
    }

    // 3. Build response with payment info + expire messages
    const todayDate = new Date(new Date().toISOString().split("T")[0]);

    const expiredPlans = expiredProperties.map((property) => {
      const payment = paymentMap[property.ppcId];
      let expireDate = null;
      let expiryMessage = null;

      if (payment?.expireDate) {
        const expire = new Date(payment.expireDate);
        expireDate = expire.toISOString();

        if (expire.toDateString() === todayDate.toDateString()) {
          expiryMessage = "Expires today";
        } else if (expire < todayDate) {
          expiryMessage = "Expired";
        } else {
          const diffDays = Math.ceil(
            (expire - todayDate) / (1000 * 60 * 60 * 24)
          );
          expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
        }
      }

      return {
        ppcId: property.ppcId,
        phoneNumber: property.phoneNumber,
        status: property.status,
        expireDate,
        expiryMessage,
        paymentData: payment || null,
        propertyData: property.toObject(),
      };
    });

    return res.status(200).json({
      status: "success",
      phoneNumber,
      expiredCount: expiredPlans.length,
      expiredPlans,
    });
  } catch (error) {
    console.error("Error fetching expired properties:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});



// router.get('/expired-plans-by-phone', async (req, res) => {
//   const { phoneNumber } = req.query;

//   if (!phoneNumber) {
//     return res.status(400).json({ message: 'Phone number is required.' });
//   }

//   try {
//     // Get all payments with ppcId linked to this phone number
//     const payments = await PaymentPayU.find({
//       phone: phoneNumber,
//       ppcId: { $exists: true, $ne: null },
//     });

//     let expiredCount = 0;
//     const expiredPlans = [];

//     const now = new Date();

//     for (const plan of payments) {
//       const { ppcId } = plan;

//       // Try to get expire date from PricingPlans (if stored there)
//       const planDoc = await PricingPlans.findOne({ 'phoneNumbers.ppcId': ppcId });

//       // Find matching phoneNumber entry with this ppcId
//       const phoneEntry = planDoc?.phoneNumbers?.find(pn => pn.ppcId === ppcId);

//       // Check expiry logic
//       const expireDate = phoneEntry?.expireDate || planDoc?.expireDate;
//       if (!expireDate) continue;

//       const expireDateObj = new Date(expireDate);

//       if (now >= expireDateObj) {
//         // Only mark as expired if not already marked
//         if (plan.payustatususer !== 'expiredPlan') {
//           plan.payustatususer = 'expiredPlan';
//           await plan.save();
//         }

//         expiredPlans.push({
//           ppcId,
//           phone: plan.phone,
//           planName: plan.planName,
//           expireDate: expireDateObj.toISOString(),
//           status: plan.payustatususer
//         });

//         expiredCount++;
//       }
//     }

//     res.json({
//       message: 'Expired plans fetched successfully.',
//       expiredCount,
//       expiredPlans
//     });

//   } catch (error) {
//     console.error('Error fetching expired plans:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// });


// router.get('/expired-plans-by-phone', async (req, res) => {
//   const { phoneNumber } = req.query;

//   if (!phoneNumber) {
//     return res.status(400).json({ message: 'Phone number is required.' });
//   }

//   try {
//     const paidPlans = await PaymentPayU.find({
//       phone: phoneNumber,
//       payustatususer: 'paid',
//       ppcId: { $exists: true, $ne: null }
//     });

//     let expiredCount = 0;
//     const expiredPlans = [];

//     for (const plan of paidPlans) {
//       const { ppcId } = plan;

//       const planDoc = await PricingPlans.findOne({ ppcId });

//       if (planDoc && new Date() > new Date(planDoc.expireDate)) {
//         plan.payustatususer = 'expiredPlan';
//         await plan.save();

//         expiredPlans.push({
//           ppcId,
//           phone: plan.phone,
//           planName: plan.planName,
//           expireDate: planDoc.expireDate,
//           status: plan.payustatususer
//         });

//         expiredCount++;
//       }
//     }

//     res.json({
//       message: 'Expired plans fetched successfully.',
//       expiredCount,
//       expiredPlans
//     });

//   } catch (error) {
//     console.error('Error fetching expired plans:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// });




// GET expired plans and attach AddModel property data


router.get('/expired-plans-by-phone-datas', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  try {
    const paidPlans = await PaymentPayU.find({
      phone: phoneNumber,
      payustatususer: 'paid',
      ppcId: { $exists: true, $ne: null }
    });

    let expiredCount = 0;
    const expiredPlans = [];

    for (const plan of paidPlans) {
      const { ppcId } = plan;

      const planDoc = await PricingPlans.findOne({ ppcId });

      if (planDoc && new Date() > new Date(planDoc.expireDate)) {
        plan.payustatususer = 'expiredPlan';
        await plan.save();

        // 🔍 Fetch corresponding property data from AddModel
        const propertyData = await AddModel.findOne({ ppcId });

        expiredPlans.push({
          ppcId,
          phone: plan.phone,
          planName: plan.planName,
          expireDate: planDoc.expireDate,
          status: plan.payustatususer,
          property: propertyData || null
        });

        expiredCount++;
      }
    }

    res.json({
      message: 'Expired plans fetched successfully.',
      expiredCount,
      expiredPlans
    });

  } catch (error) {
    console.error('Error fetching expired plans:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// Count expired plans using AddModel where status is "expired"
router.get('/expired-plan-count-by-phone', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  try {
    const count = await AddModel.countDocuments({
      phoneNumber,
      status: 'expired',
    });

    res.status(200).json({ expiredCount: count });
  } catch (error) {
    console.error('Error in expired-plan-count-by-phone:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});





// // GET expired plans and count by phone number
// router.get('/expired-plans-by-phone', async (req, res) => {
//   const { phoneNumber } = req.query;

//   if (!phoneNumber) {
//     return res.status(400).json({ message: 'Phone number is required.' });
//   }

//   try {
//     // Get all paid plans by phone number
//     const paidPlans = await PaymentPayU.find({
//       phone: phoneNumber,
//       payustatususer: 'paid',
//     });

//     let expiredCount = 0;
//     const expiredPlans = [];

//     for (const plan of paidPlans) {
//       const { ppcId } = plan;

//       // Get expireDate from pricing plan model
//       const planDoc = await PricingPlans.findOne({ ppcId });

//       if (planDoc && new Date() > new Date(planDoc.expireDate)) {
//         // Update status to expiredPlan
//         plan.payustatususer = 'expiredPlan';
//         await plan.save();

//         expiredPlans.push({
//           ppcId,
//           phone: plan.phone,
//           planName: plan.planName,
//           expireDate: planDoc.expireDate,
//           status: plan.payustatususer
//         });

//         expiredCount++;
//       }
//     }

//     res.json({
//       message: 'Expired plans fetched successfully.',
//       expiredCount,
//       expiredPlans
//     });

//   } catch (error) {
//     console.error('Error fetching expired plans:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// });


// // route: /expired-plan-count-by-phone
// router.get('/expired-plan-count-by-phone', async (req, res) => {
//   const { phoneNumber } = req.query;

//   if (!phoneNumber) {
//     return res.status(400).json({ message: 'Phone number is required.' });
//   }

//   try {
//     const paidPlans = await PaymentPayU.find({ payustatususer: 'paid', phone: phoneNumber });

//     let count = 0;

//     for (const plan of paidPlans) {
//       const planDoc = await PricingPlans.findOne({ ppcId: plan.ppcId });

//       if (planDoc && new Date() > new Date(planDoc.expireDate)) {
//         // ✅ Optionally update plan status
//         plan.payustatususer = 'expiredPlan';
//         await plan.save();

//         count++;
//       }
//     }

//     res.status(200).json({ expiredCount: count });
//   } catch (error) {
//     console.error('Error in expired-plan-count-by-phone:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// });

// ✅ GET all "paid" plans by phoneNumber with valid ppcId
router.get('/paid-plans-by-phone', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    const paidPlans = await PaymentPayU.find({
      phone: phoneNumber,
      payustatususer: 'paid',
      ppcId: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });

    res.status(200).json({ paidPlans });
  } catch (error) {
    console.error('Error fetching paid plans:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// ✅ GET count of expired plans
router.get('/expired-plans/count', async (req, res) => {
  try {
    const paidPlans = await PaymentPayU.find({ payustatususer: 'paid' });
    let expiredCount = 0;

    for (const plan of paidPlans) {
      const { ppcId } = plan;

      const planDoc = await PricingPlans.findOne({ ppcId });

      if (planDoc && new Date() > new Date(planDoc.expireDate)) {
        // Optional: update status in DB if needed
        plan.payustatususer = 'expiredPlan';
        await plan.save();

        expiredCount++;
      }
    }

    res.json({ message: 'Expired plans count fetched successfully.', expiredCount });
  } catch (error) {
    console.error('Error fetching expired plans count:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ✅ GET latest PayU status per PPC ID
router.get('/payustatus-users', async (req, res) => {
  try {
    // Get all payments sorted by latest
    const payments = await PaymentPayU.find().sort({ createdAt: -1 });

    // Map latest status by ppcId
    const statusMap = {};
    for (let payment of payments) {
      if (!statusMap[payment.ppcId]) {
        statusMap[payment.ppcId] = payment.payustatususer.toLowerCase(); // Normalize to lowercase
      }
    }

    // Convert map to array
    const result = Object.entries(statusMap).map(([ppcId, status]) => ({
      ppcId: parseInt(ppcId),
      status
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching PayU statuses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/plans-by-phone-with-datas/:phoneNumber', async (req, res) => {
  const phoneNumber = req.params.phoneNumber;
  try {
    // Find plans that contain this phone number
    const plans = await PricingPlans.find({
      'phoneNumbers.number': phoneNumber
    });

    if (!plans.length) {
      return res.status(404).json({
        status: "error",
        message: "No plans found for this phone number"
      });
    }

    // Get all PPC IDs from plans
    const allPpcIds = plans.flatMap(plan => plan.phoneNumbers.map(pn => pn.ppcId));

    // Get latest payment per PPC ID
    const payments = await PaymentPayU.find({
      ppcId: { $in: allPpcIds }
    });

    const paymentMap = {};
    payments.forEach(payment => {
      if (!paymentMap[payment.ppcId] || new Date(payment.createdAt) > new Date(paymentMap[payment.ppcId].createdAt)) {
        paymentMap[payment.ppcId] = payment;
      }
    });

    const now = new Date();

    const enhancedPlans = plans.map(plan => {
      const planExpireDate = new Date(plan.expireDate);

      const phoneNumbersWithPayments = plan.phoneNumbers.map(pn => {
        const paymentData = paymentMap[pn.ppcId] || null;

        // PPC expireDate fallback to plan expireDate
        const expireDate = pn.expireDate ? new Date(pn.expireDate) : planExpireDate;
        const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

        let expiryMessage = '';
        if (diffDays > 0 && diffDays <= 5) {
          expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        } else if (diffDays <= 0) {
          expiryMessage = 'Expired';
        }

        // Only show payment info if status success and payustatususer paid
        const showPaymentInfo = paymentData && paymentData.status === 'success' && paymentData.payustatususer === 'paid';

        // createdAt preference
        const createdAt = paymentData?.createdAt || pn.createdAt || null;

        return {
          ...pn.toObject ? pn.toObject() : pn,
          paymentData: showPaymentInfo ? paymentData : null,
          expireDate: expireDate.toISOString(),
          expiryMessage,
          createdAt: createdAt ? new Date(createdAt).toISOString() : null,
        };
      });

      // Plan level expiry message
      const planDiffDays = Math.ceil((planExpireDate - now) / (1000 * 60 * 60 * 24));
      let planExpiryMessage = '';
      if (planDiffDays > 0 && planDiffDays <= 5) {
        planExpiryMessage = `Expires in ${planDiffDays} day${planDiffDays > 1 ? 's' : ''}`;
      } else if (planDiffDays <= 0) {
        planExpiryMessage = 'Expired';
      }

      return {
        ...plan.toObject(),
        expiryMessage: planExpiryMessage,
        phoneNumbers: phoneNumbersWithPayments
      };
    });

    return res.status(200).json({
      status: "success",
      phoneNumber,
      plans: enhancedPlans
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error fetching plans by phone number",
      error: error.message
    });
  }
});



// router.get('/plans-by-phone/:phoneNumber', async (req, res) => {
//   const phoneNumber = req.params.phoneNumber;

//   try {
//     // 1. Find plans matching phone number
//     const plans = await PricingPlans.find({
//       'phoneNumbers.number': phoneNumber
//     });

//     if (plans.length === 0) {
//       return res.status(404).json({
//         status: "error",
//         message: "No plans found for this phone number"
//       });
//     }

//     // 2. Collect all ppcIds from all plans (all phoneNumbers)
//     const allPpcIds = plans.flatMap(plan => plan.phoneNumbers.map(pn => pn.ppcId));

//     // 3. Fetch payments by ppcId (all payments for these PPC IDs)
//     const payments = await PaymentPayU.find({
//       ppcId: { $in: allPpcIds }
//     });

//     // 4. Map payments by ppcId for quick lookup (take latest payment per ppcId by createdAt)
//     const paymentMap = {};
//     payments.forEach(payment => {
//       const existing = paymentMap[payment.ppcId];
//       if (!existing || new Date(payment.createdAt) > new Date(existing.createdAt)) {
//         paymentMap[payment.ppcId] = payment;
//       }
//     });

//     // 5. Add expiry message and payment info to each phoneNumber in plans
//     const now = new Date();

//     const enhancedPlans = plans.map(plan => {
//       // plan level expireDate (if PPC expiry not available)
//       const planExpireDate = new Date(plan.expireDate);

//       const phoneNumbersWithPayments = plan.phoneNumbers.map(pn => {
//         const paymentData = paymentMap[pn.ppcId] || null;

//         // Assume expireDate per PPC if stored; else fallback to plan expireDate
//         const expireDate = pn.expireDate ? new Date(pn.expireDate) : planExpireDate;
//         const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

//         let expiryMessage = '';
//         if (diffDays > 0 && diffDays <= 5) {
//           expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
//         } else if (diffDays <= 0) {
//           expiryMessage = 'Expired';
//         }

//         // createdAt: prefer paymentData.createdAt if available else pn.createdAt else null
//         const createdAt = paymentData?.createdAt || pn.createdAt || null;

//         return {
//           ...pn.toObject ? pn.toObject() : pn,
//           paymentData,
//           expireDate: expireDate.toISOString(),
//           expiryMessage,
//           createdAt: createdAt ? new Date(createdAt).toISOString() : null,
//         };
//       });

//       // Plan-level expiry message
//       const planDiffDays = Math.ceil((planExpireDate - now) / (1000 * 60 * 60 * 24));
//       let planExpiryMessage = '';
//       if (planDiffDays > 0 && planDiffDays <= 5) {
//         planExpiryMessage = `Expires in ${planDiffDays} day${planDiffDays > 1 ? 's' : ''}`;
//       } else if (planDiffDays <= 0) {
//         planExpiryMessage = 'Expired';
//       }

//       return {
//         ...plan.toObject(),
//         expiryMessage: planExpiryMessage,
//         phoneNumbers: phoneNumbersWithPayments
//       };
//     });

//     // Return enhanced plans with all info
//     return res.status(200).json({
//       status: "success",
//       phoneNumber,
//       plans: enhancedPlans
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "Error fetching plans by phone number",
//       error: error.message
//     });
//   }
// });


// router.get('/plans-by-phone/:phoneNumber', async (req, res) => {
//   const phoneNumber = req.params.phoneNumber;

//   try {
//     const plans = await PricingPlans.find({
//       'phoneNumbers.number': phoneNumber
//     });

//     if (plans.length === 0) {
//       return res.status(404).json({
//         status: "error",
//         message: "No plans found for this phone number"
//       });
//     }

//     // Get all PPC IDs from all phoneNumbers
//     const allPpcIds = plans.flatMap(plan => plan.phoneNumbers.map(pn => pn.ppcId));

//     const payments = await PaymentPayU.find({
//       ppcId: { $in: allPpcIds }
//     });

//     // Build payment map
//     const paymentMap = {};
//     payments.forEach(payment => {
//       const existing = paymentMap[payment.ppcId];
//       if (!existing || new Date(payment.createdAt) > new Date(existing.createdAt)) {
//         paymentMap[payment.ppcId] = payment;
//       }
//     });

//     const now = new Date();
//     const expiredPpcIds = [];

//     const enhancedPlans = plans.map(plan => {
//       const planExpireDate = new Date(plan.expireDate);

//       const phoneNumbersWithPayments = plan.phoneNumbers.map(pn => {
//         const paymentData = paymentMap[pn.ppcId] || null;

//         const expireDate = pn.expireDate ? new Date(pn.expireDate) : planExpireDate;
//         const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

//         let expiryMessage = '';
//         if (diffDays > 0 && diffDays <= 5) {
//           expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
//         } else if (diffDays <= 0) {
//           expiryMessage = 'Expired';
//           expiredPpcIds.push(pn.ppcId);
//         }

//         const createdAt = paymentData?.createdAt || pn.createdAt || null;

//         return {
//           ...pn.toObject ? pn.toObject() : pn,
//           paymentData,
//           expireDate: expireDate.toISOString(),
//           expiryMessage,
//           createdAt: createdAt ? new Date(createdAt).toISOString() : null,
//         };
//       });

//       const planDiffDays = Math.ceil((planExpireDate - now) / (1000 * 60 * 60 * 24));
//       let planExpiryMessage = '';
//       if (planDiffDays > 0 && planDiffDays <= 5) {
//         planExpiryMessage = `Expires in ${planDiffDays} day${planDiffDays > 1 ? 's' : ''}`;
//       } else if (planDiffDays <= 0) {
//         planExpiryMessage = 'Expired';
//       }

//       return {
//         ...plan.toObject(),
//         expiryMessage: planExpiryMessage,
//         phoneNumbers: phoneNumbersWithPayments
//       };
//     });

//     // ✅ Automatically update AddModel status for expired PPCs
//     if (expiredPpcIds.length > 0) {
//       await AddModel.updateMany(
//         {
//           ppcId: { $in: expiredPpcIds },
//           status: { $ne: 'expired' }  // Only update non-expired
//         },
//         { $set: { status: 'expired' } }
//       );
//     }

//     return res.status(200).json({
//       status: "success",
//       phoneNumber,
//       plans: enhancedPlans
//     });

//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "Error fetching plans by phone number",
//       error: error.message
//     });
//   }
// });


router.get('/plans-by-phone-only-paid/:phoneNumber', async (req, res) => {
  const phoneNumber = req.params.phoneNumber;

  try {
    // 1. Find plans matching phone number
    const plans = await PricingPlans.find({
      'phoneNumbers.number': phoneNumber
    });

    if (plans.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No plans found for this phone number"
      });
    }

    // 2. Collect all ppcIds from all plans
    const allPpcIds = plans.flatMap(plan => plan.phoneNumbers.map(pn => pn.ppcId));

    // 3. Fetch ONLY 'paid' payments for those ppcIds
    const payments = await PaymentPayU.find({
      ppcId: { $in: allPpcIds },
      payustatususer: 'paid'
    });

    // 4. Build map of latest payment by ppcId
    const paymentMap = {};
    payments.forEach(payment => {
      const existing = paymentMap[payment.ppcId];
      if (!existing || new Date(payment.createdAt) > new Date(existing.createdAt)) {
        paymentMap[payment.ppcId] = payment;
      }
    });

    const now = new Date();

    const enhancedPlans = plans.map(plan => {
      const planExpireDate = new Date(plan.expireDate);

      // 5. Filter phoneNumbers that have a corresponding PAID payment
      const phoneNumbersWithPayments = plan.phoneNumbers
        .filter(pn => paymentMap[pn.ppcId]) // ✅ Only keep those with 'paid' status
        .map(pn => {
          const paymentData = paymentMap[pn.ppcId];
          const expireDate = pn.expireDate ? new Date(pn.expireDate) : planExpireDate;
          const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

          let expiryMessage = '';
          if (diffDays > 0 && diffDays <= 5) {
            expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
          } else if (diffDays <= 0) {
            expiryMessage = 'Expired';
          }

          const createdAt = paymentData?.createdAt || pn.createdAt || null;

          return {
            ...pn.toObject ? pn.toObject() : pn,
            paymentData,
            expireDate: expireDate.toISOString(),
            expiryMessage,
            createdAt: createdAt ? new Date(createdAt).toISOString() : null,
          };
        });

      // Skip plan if no paid phoneNumbers
      if (phoneNumbersWithPayments.length === 0) return null;

      const planDiffDays = Math.ceil((planExpireDate - now) / (1000 * 60 * 60 * 24));
      let planExpiryMessage = '';
      if (planDiffDays > 0 && planDiffDays <= 5) {
        planExpiryMessage = `Expires in ${planDiffDays} day${planDiffDays > 1 ? 's' : ''}`;
      } else if (planDiffDays <= 0) {
        planExpiryMessage = 'Expired';
      }

      return {
        ...plan.toObject(),
        expiryMessage: planExpiryMessage,
        phoneNumbers: phoneNumbersWithPayments
      };
    }).filter(Boolean); // 🔍 Remove nulls (plans with no paid phoneNumbers)

    return res.status(200).json({
      status: "success",
      phoneNumber,
      plans: enhancedPlans
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error fetching plans by phone number",
      error: error.message
    });
  }
});



// router.get('/plans-by-phones/:phoneNumber', async (req, res) => {
//   const phoneNumber = req.params.phoneNumber;

//   try {
//     // 1. Fetch all user's posted properties
//     const userProperties = await AddModel.find({ phoneNumber }).sort({ createdAt: -1 });

//     // 2. Fetch all pricing plans associated with phone number
//     const plans = await PricingPlans.find({ 'phoneNumbers.number': phoneNumber });

//     // 3. Get all PPC IDs from plans
//     const allPpcIdsFromPlans = plans.flatMap(plan => plan.phoneNumbers.map(pn => pn.ppcId));

//     // 4. Get all PPC IDs from properties (in case no plan exists)
//     const allPpcIdsFromProperties = userProperties.map(p => p.ppcId);

//     // 5. Merge unique PPC IDs
//     const allPpcIds = [...new Set([...allPpcIdsFromPlans, ...allPpcIdsFromProperties])];

//     // 6. Fetch latest payment for each PPC ID
//     const payments = await PaymentPayU.find({ ppcId: { $in: allPpcIds } });

//     // 7. Map PPC ID to latest payment
//     const paymentMap = {};
//     payments.forEach(payment => {
//       const existing = paymentMap[payment.ppcId];
//       if (!existing || new Date(payment.createdAt) > new Date(existing.createdAt)) {
//         paymentMap[payment.ppcId] = payment;
//       }
//     });

//     // 8. Enhance properties with payment data
//     const enhancedProperties = userProperties.map(prop => ({
//       ...prop.toObject(),
//       paymentData: paymentMap[prop.ppcId] || null
//     }));

//     // 9. Enhance plans with payment info per PPC
//     const now = new Date();
//     const enhancedPlans = plans.map(plan => {
//       const planExpireDate = new Date(plan.expireDate);

//       const phoneNumbersWithPayments = plan.phoneNumbers.map(pn => {
//         const paymentData = paymentMap[pn.ppcId] || null;
//         const expireDate = pn.expireDate ? new Date(pn.expireDate) : planExpireDate;
//         const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

//         let expiryMessage = '';
//         if (diffDays > 0 && diffDays <= 5) {
//           expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
//         } else if (diffDays <= 0) {
//           expiryMessage = 'Expired';
//         }

//         const createdAt = paymentData?.createdAt || pn.createdAt || null;

//         return {
//           ...pn.toObject?.() || pn,
//           paymentData,
//           expireDate: expireDate.toISOString(),
//           expiryMessage,
//           createdAt: createdAt ? new Date(createdAt).toISOString() : null
//         };
//       });

//       const planDiffDays = Math.ceil((planExpireDate - now) / (1000 * 60 * 60 * 24));
//       let planExpiryMessage = '';
//       if (planDiffDays > 0 && planDiffDays <= 5) {
//         planExpiryMessage = `Expires in ${planDiffDays} day${planDiffDays > 1 ? 's' : ''}`;
//       } else if (planDiffDays <= 0) {
//         planExpiryMessage = 'Expired';
//       }

//       return {
//         ...plan.toObject(),
//         expiryMessage: planExpiryMessage,
//         phoneNumbers: phoneNumbersWithPayments
//       };
//     });

//     // 10. Return everything
//     return res.status(200).json({
//       status: "success",
//       phoneNumber,
//       plans: enhancedPlans,
//       properties: enhancedProperties
//     });

//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "Error fetching plans and properties",
//       error: error.message
//     });
//   }
// });




router.get('/plans-by-phones/:phoneNumber', async (req, res) => {
  const phoneNumber = req.params.phoneNumber;

  try {
    // 1. Fetch all user's posted properties
    const userProperties = await AddModel.find({ phoneNumber }).sort({ createdAt: -1 });

    // 2. Fetch all pricing plans associated with phone number
    const plans = await PricingPlans.find({ 'phoneNumbers.number': phoneNumber });

    // 3. Get all PPC IDs from plans and properties
    const allPpcIdsFromPlans = plans.flatMap(plan => plan.phoneNumbers.map(pn => pn.ppcId));
    const allPpcIdsFromProperties = userProperties.map(p => p.ppcId);
    const allPpcIds = [...new Set([...allPpcIdsFromPlans, ...allPpcIdsFromProperties])];

    // 4. Fetch latest payment for each PPC ID
    const payments = await PaymentPayU.find({ ppcId: { $in: allPpcIds } });

    // 5. Map PPC ID to latest payment
    const paymentMap = {};
    payments.forEach(payment => {
      const existing = paymentMap[payment.ppcId];
      if (!existing || new Date(payment.createdAt) > new Date(existing.createdAt)) {
        paymentMap[payment.ppcId] = payment;
      }
    });

    // 6. Enhance properties with payment data
    const enhancedProperties = userProperties.map(prop => ({
      ...prop.toObject(),
      paymentData: paymentMap[prop.ppcId] || null
    }));

    // 7. Enhance plans with payment info per PPC
    const now = new Date();
    const enhancedPlans = plans.map(plan => {
      const planExpireDate = new Date(plan.expireDate);

      const phoneNumbersWithPayments = plan.phoneNumbers.map(pn => {
        const paymentData = paymentMap[pn.ppcId] || null;
        const relatedProperty = userProperties.find(p => p.ppcId === pn.ppcId);
        const createdAt = paymentData?.createdAt || pn.createdAt || null;

        let expireDate = '';
        let expiryMessage = 'Expired';

        const isPaidAndActive =
          paymentData &&
          paymentData.status === 'success' &&
          paymentData.payustatususer === 'paid' &&
          relatedProperty &&
          relatedProperty.status !== 'expired';

        if (isPaidAndActive) {
          const calculatedExpire = new Date(
            paymentData.expireDate || pn.expireDate || plan.expireDate
          );

          const diffDays = Math.ceil((calculatedExpire - now) / (1000 * 60 * 60 * 24));

          expireDate = calculatedExpire.toISOString();

          if (diffDays > 0 && diffDays <= 5) {
            expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
          } else if (diffDays > 5) {
            expiryMessage = `Expires in ${diffDays} days`;
          }
        }

        return {
          ...pn.toObject?.() || pn,
          paymentData,
          expireDate,
          expiryMessage,
          createdAt: createdAt ? new Date(createdAt).toISOString() : null
        };
      });

      // Optional: plan-level expiry
      const planDiffDays = Math.ceil((planExpireDate - now) / (1000 * 60 * 60 * 24));
      let planExpiryMessage = '';
      if (planDiffDays > 0 && planDiffDays <= 5) {
        planExpiryMessage = `Expires in ${planDiffDays} day${planDiffDays > 1 ? 's' : ''}`;
      } else if (planDiffDays <= 0) {
        planExpiryMessage = 'Expired';
      }

      return {
        ...plan.toObject(),
        expiryMessage: planExpiryMessage,
        phoneNumbers: phoneNumbersWithPayments
      };
    });

    // 8. Return full result
    return res.status(200).json({
      status: "success",
      phoneNumber,
      plans: enhancedPlans,
      properties: enhancedProperties
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error fetching plans and properties",
      error: error.message
    });
  }
});






router.post("/select-plan", async (req, res) => {
  const { phoneNumber, planId, ppcId } = req.body;

  if (!phoneNumber || !planId || !ppcId) {
    return res.status(400).json({
      status: "error",
      message: "phoneNumber, planId and ppcId are required",
    });
  }

  try {
    const selectedPlan = await PricingPlans.findById(planId);
    if (!selectedPlan) {
      return res.status(404).json({
        status: "error",
        message: "Plan not found",
      });
    }

    // Check if phoneNumber+ppcId already exists in plan
    const existingEntry = selectedPlan.phoneNumbers.find(
      (entry) => entry.number === phoneNumber && entry.ppcId === ppcId
    );

    if (existingEntry) {
      // Fetch the latest payment info for this ppcId
      const latestPayment = await PaymentPayU.findOne({ ppcId }).sort({ createdAt: -1 });
      const payStatus = latestPayment?.payustatususer;

      // ✅ Your condition block exactly as requested
      if (payStatus === "paid") {
        return res.status(400).json({
          status: "error",
          message: "This phone number is already associated with this PPC ID for this plan and payment is completed.",
        });
      } else if (
        payStatus === "expiredPlan" ||
        payStatus === "pay later" ||
        payStatus === "pay failed" ||
        payStatus === "pay now"
      ) {
        return res.status(200).json({
          status: "pending-payment",
          message: "Previous plan expired or unpaid. Please proceed to payment again.",
          selectedPlan,
        });
      }
    }

    // If no existing entry, push new phoneNumber + ppcId
    selectedPlan.phoneNumbers.push({ number: phoneNumber, ppcId });

    // Set createdAt and expireDate
    selectedPlan.createdAt = new Date();
    selectedPlan.expireDate = moment(selectedPlan.createdAt)
      .add(selectedPlan.durationDays, "days")
      .toDate();

    await selectedPlan.save();

    return res.status(200).json({
      status: "success",
      message: "Phone number added successfully with PPC ID",
      selectedPlan,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});





// router.post("/select-plan", async (req, res) => {
//   const { phoneNumber, planId, ppcId } = req.body;

//   if (!phoneNumber || !planId || !ppcId) {
//     return res.status(400).json({
//       status: "error",
//       message: "phoneNumber, planId and ppcId are required",
//     });
//   }

//   try {
//     const selectedPlan = await PricingPlans.findById(planId);
//     if (!selectedPlan) {
//       return res.status(404).json({
//         status: "error",
//         message: "Plan not found",
//       });
//     }

//     // Find the entry if it exists
//     const existingEntry = selectedPlan.phoneNumbers.find(
//       (entry) => entry.number === phoneNumber && entry.ppcId === ppcId
//     );

//     if (existingEntry) {
//       // Check payment status in existingEntry.paymentData
//       const payStatus = existingEntry.paymentData?.payustatususer;

//       if (payStatus === "paid") {
//         // Already paid, reject
//         return res.status(400).json({
//           status: "error",
//           message: "This phone number is already associated with this PPC ID for this plan and payment is completed.",
//         });
//       } else {
//         // Not paid (pay later, pay failed, pay now)
//         // Allow continue payment: return success but no duplicate add

//         return res.status(200).json({
//           status: "pending-payment",
//           message: "Existing unpaid payment found. Please complete the payment.",
//           selectedPlan,
//         });
//       }
//     }

//     // If not exists, add new phoneNumber + ppcId
//     selectedPlan.phoneNumbers.push({ number: phoneNumber, ppcId });

//     // Update dates
//     selectedPlan.createdAt = new Date();
//     selectedPlan.expireDate = moment(selectedPlan.createdAt).add(selectedPlan.durationDays, "days").toDate();

//     await selectedPlan.save();

//     return res.status(200).json({
//       status: "success",
//       message: "Phone number added successfully with PPC ID",
//       selectedPlan,
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: "error",
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// });





// ***********************************************************************





// // GET /plans-by-phone/:phoneNumber
// router.get('/plans-by-phone/:phoneNumber', async (req, res) => {
//   const phoneNumber = req.params.phoneNumber;

//   try {
//     const plans = await PricingPlans.find({
//       'phoneNumbers.number': phoneNumber
//     });

//     if (plans.length === 0) {
//       return res.status(404).json({
//         status: "error",
//         message: "No plans found for this phone number"
//       });
//     }

//     // Add expiry message
//     const enhancedPlans = plans.map(plan => {
//       const now = new Date();
//       const expireDate = new Date(plan.expireDate);
//       const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

//       let expiryMessage = '';
//       if (diffDays > 0 && diffDays <= 5) {
//         expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
//       } else if (diffDays <= 0) {
//         expiryMessage = `Expired`;
//       }

//       return {
//         ...plan.toObject(),
//         expiryMessage
//       };
//     });

//     return res.status(200).json({
//       status: "success",
//       phoneNumber,
//       plans: enhancedPlans
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "Error fetching plans by phone number",
//       error: error.message
//     });
//   }
// });


// // GET /plans-by-phone/:phoneNumber
// router.get('/plans-by-phone/:phoneNumber', async (req, res) => {
//   const phoneNumber = req.params.phoneNumber;

//   try {
//     // Find all plans that include this phoneNumber in phoneNumbers array
//     const plans = await PricingPlans.find({
//       'phoneNumbers.number': phoneNumber
//     });

//     if (plans.length === 0) {
//       return res.status(404).json({
//         status: "error",
//         message: "No plans found for this phone number"
//       });
//     }

//     // Optionally, you can filter or reshape response to send only relevant info

//     return res.status(200).json({
//       status: "success",
//       phoneNumber,
//       plans
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "Error fetching plans by phone number",
//       error: error.message
//     });
//   }
// });


// // Normalize phone number function
// const normalizePhoneNumber = (phoneNumber) => {
//     return phoneNumber.replace(/^\+?91/, ""); // Convert +91XXXXXX or 91XXXXXX to XXXXXX
// };

// // // ✅ Get all plans for a specific phone number


// router.get("/plans/:phoneNumber", async (req, res) => {
//     try {
//         let { phoneNumber } = req.params;
//         phoneNumber = normalizePhoneNumber(phoneNumber);

//         const plans = await PricingPlans.find({ phoneNumber });
//         if (plans.length === 0) {
//             return res.status(404).json({ message: "No plans found for this phone number." });
//         }

//         return res.status(200).json({ 
//             success: true, 
//             plans: plans.map(plan => ({
//                 ...plan.toObject(),
//                 createdDate: plan.createdAt ? moment(plan.createdAt).format('YYYY-MM-DD') : null,
//                 expireDate: plan.expireDate ? moment(plan.expireDate).format('YYYY-MM-DD') : null
//             }))
//         });
//     } catch (error) {
//         return res.status(500).json({ message: "Error fetching plans.", error: error.message });
//     }
// });



const normalizePhoneNumber = (phone) => {
  return phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();
};

router.get("/plans-with/:phoneNumber", async (req, res) => {
     try {
    let { phoneNumber } = req.params;
    phoneNumber = normalizePhoneNumber(phoneNumber);

    // Fetch all plans for the phone number
    const plans = await PricingPlans.find({ phoneNumber }).sort({ createdAt: -1 });

    if (plans.length === 0) {
      return res.status(404).json({ message: "No plans found for this phone number." });
    }

    // Use latest plan to compute usage
    const latestPlan = plans[0];

    // Fetch used car entries
    const usedProperties = await AddModel.find({
      phoneNumber: new RegExp(phoneNumber + '$'),
      isDeleted: false
    });

    const usedCars = usedProperties.length;
    const ppcIds = usedProperties.map(item => item.ppcId);

    const remainingCars = (latestPlan.numOfCars || 0) - usedCars;

    // Attach dates to each plan
    const formattedPlans = plans.map(plan => {
      const created = plan.createdAt ? moment(plan.createdAt) : null;
      const expiry = created ? created.clone().add(plan.durationDays || 0, 'days') : null;

      return {
        ...plan.toObject(),
        createdDate: created ? created.format('YYYY-MM-DD') : null,
        expireDate: expiry ? expiry.format('YYYY-MM-DD') : null
      };
    });

    return res.status(200).json({
      success: true,
      phoneNumber,
      usedCars,
      ppcIds,
      remainingCars: remainingCars < 0 ? 0 : remainingCars,
      plans: formattedPlans
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching plan usage details.",
      error: error.message
    });
  }
});



//   try {
//     let { phoneNumber } = req.params;
//     phoneNumber = normalizePhoneNumber(phoneNumber);

//     // Fetch all plans for the phone number
//     const plans = await PricingPlans.find({ phoneNumber }).sort({ createdAt: -1 });

//     if (plans.length === 0) {
//       return res.status(404).json({ message: "No plans found for this phone number." });
//     }

//     // Use latest plan to compute usage
//     const latestPlan = plans[0];

//     const usedCars = await AddModel.countDocuments({
//       phoneNumber: new RegExp(phoneNumber + '$'),
//       isDeleted: false
//     });

//     const remainingCars = (latestPlan.numOfCars || 0) - usedCars;

//     // Attach dates to each plan
//     const formattedPlans = plans.map(plan => {
//       const created = plan.createdAt ? moment(plan.createdAt) : null;
//       const expiry = created ? created.clone().add(plan.durationDays || 0, 'days') : null;

//       return {
//         ...plan.toObject(),
//         createdDate: created ? created.format('YYYY-MM-DD') : null,
//         expireDate: expiry ? expiry.format('YYYY-MM-DD') : null
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       phoneNumber,
//       usedCars,
//       remainingCars: remainingCars < 0 ? 0 : remainingCars,
//       plans: formattedPlans
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching plan usage details.",
//       error: error.message
//     });
//   }
// });



router.put("/plans/remove-phone/:phoneNumberToRemove", async (req, res) => {
  try {
    let { phoneNumberToRemove } = req.params;
    phoneNumberToRemove = normalizePhoneNumber(phoneNumberToRemove);

    // Update all plans where the phoneNumber exists in the array
    const result = await PricingPlans.updateMany(
      { phoneNumber: phoneNumberToRemove },
      { $pull: { phoneNumber: phoneNumberToRemove } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Phone number not found in any plan."
      });
    }

    return res.status(200).json({
      success: true,
      message: `Phone number ${phoneNumberToRemove} removed from all matching plans.`,
      result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error removing phone number from plans.",
      error: error.message
    });
  }
});


router.put("/plans/add-phone/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    let { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: "phoneNumber is required in body" });
    }

    phoneNumber = normalizePhoneNumber(phoneNumber);

    // Assuming phoneNumber field is an array — use $addToSet to avoid duplicates
    const result = await PricingPlans.findByIdAndUpdate(
      planId,
      { $addToSet: { phoneNumber: phoneNumber } },  // add without duplicates
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    res.status(200).json({
      success: true,
      message: `Phone number ${phoneNumber} added to plan ${planId}`,
      plan: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding phone number to plan",
      error: error.message
    });
  }
});


// ✅ Get plan count for a specific phone number
router.get("/plans/count/:phoneNumber", async (req, res) => {
    try {
        let { phoneNumber } = req.params;
        phoneNumber = normalizePhoneNumber(phoneNumber);

        const count = await PricingPlans.countDocuments({ phoneNumber });

        return res.status(200).json({ success: true, count });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching plan count.", error: error.message });
    }
});



router.get('/get-plan', async (req, res) => {
    try {
        const plans = await PricingPlans.find();  // Retrieve all plans
        return res.status(200).json(plans);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching plans.', error: error.message });
    }
});


router.get('/get-all-plan-count', async (req, res) => {
    try {
        const plans = await PricingPlans.find(); // Fetch all plans

        // Extract unique plan names
        const uniquePlanNames = new Set(plans.map(plan => plan.name));

        return res.status(200).json({ totalPlansCount: uniquePlanNames.size });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching plans count.', error: error.message });
    }
});


router.get('/get-all-plan', async (req, res) => {
    try {
        const plans = await PricingPlans.find(); // Fetch all plans

        // Filter unique plans based on 'name'
        const uniquePlans = [];
        const seenNames = new Set();

        plans.forEach(plan => {
            if (!seenNames.has(plan.name)) {
                seenNames.add(plan.name);
                uniquePlans.push(plan);
            }
        });

        return res.status(200).json(uniquePlans);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching plans.', error: error.message });
    }
});



router.post('/store-plan', async (req, res) => {
    const { name, packageType, unlimitedAds, price, durationDays, numOfCars, featuredAds, featuredMaxCar, description, status } = req.body;

    try {
        // Check if a plan with the same name already exists
        const existingPlan = await PricingPlans.findOne({ name });
        if (existingPlan) {
            return res.status(400).json({ message: 'Plan with this name already exists. Please use a different name.' });
        }

        const newPlan = new PricingPlans({
            name,
            packageType,
            unlimitedAds,
            price,
            durationDays,
            numOfCars,
            featuredAds,
            featuredMaxCar,
            description,
            status,
        });

        await newPlan.save();
        return res.status(201).json({ message: 'Plan added successfully!', newPlan });

    } catch (error) {
        return res.status(500).json({ message: 'Error storing plan details.', error: error.message });
    }
});

// ********************************************************************
// router.post("/select-plan", async (req, res) => {
//     const { phoneNumber, planId } = req.body;

//     try {
//         // Find the plan by ID
//         const selectedPlan = await PricingPlans.findById(planId);

//         if (!selectedPlan) {
//             return res.status(404).json({
//                 status: "error",
//                 message: "Plan not found!",
//             });
//         }

//         // Add phone number to the plan's phoneNumber array
//         if (!selectedPlan.phoneNumber.includes(phoneNumber)) {
//             selectedPlan.phoneNumber.push(phoneNumber);
//         } else {
//             return res.status(400).json({
//                 status: "error",
//                 message: "Phone number is already associated with this plan!",
//             });
//         }

//         // Update createdAt and expireDate
//         selectedPlan.createdAt = new Date();
//         selectedPlan.expireDate = moment(selectedPlan.createdAt)
//             .add(selectedPlan.durationDays, 'days')
//             .toDate();

//         await selectedPlan.save();

//         // Send notification
//         try {
//             await NotificationUser.create({
//                 recipientPhoneNumber: phoneNumber,
//                 senderPhoneNumber: phoneNumber,
//                 ppcId: "PLAN-" + planId,
//                 message: `A new plan has been selected by ${phoneNumber}.`,
//                 createdAt: new Date()
//             });
//         } catch (notifErr) {
//         }

//         return res.status(200).json({
//             status: "success",
//             message: "Phone number added successfully to the plan!",
//             selectedPlan,
//             createdDate: moment(selectedPlan.createdAt).format('YYYY-MM-DD'),
//             expireDate: moment(selectedPlan.expireDate).format('YYYY-MM-DD')
//         });

//     } catch (error) {
//         return res.status(500).json({
//             status: "error",
//             message: "Error selecting plan.",
//             error: error.message,
//         });
//     }
// });
// **********************************************************************************



// router.post("/select-plan", async (req, res) => {
//     const { phoneNumber, planId } = req.body;

//     try {
//         // Fetch the selected plan
//         const selectedPlan = await PricingPlans.findById(planId);
//         if (!selectedPlan) {
//             return res.status(404).json({ status: "error", message: "Plan not found!" });
//         }

//         // Check if this user has already paid for this plan
//         const existingPayment = await PaymentPayU.findOne({
//             phone: phoneNumber,
//             planName: selectedPlan.planName,
//             payustatususer: "paid",
//         });

//         if (existingPayment) {
//             const totalCars = existingPayment.numofcars || 0;

//             // Count how many properties the user already posted
//             const postedCars = await Property.countDocuments({ ownerPhoneNumber: phoneNumber });

//             const remainingCars = totalCars - postedCars;

//             if (remainingCars <= 0) {
//                 // No car posts remaining — must purchase again
//                 return res.status(403).json({
//                     status: "expired",
//                     message: `You have already used all your ${totalCars} car posts for the ${selectedPlan.planName} plan. Please purchase a new plan.`,
//                     redirectToPayment: true,
//                 });
//             } else {
//                 // Still has car posts left — allow posting
//                 return res.status(200).json({
//                     status: "active",
//                     message: `You have already paid for the ${selectedPlan.planName} plan. Remaining car posts: ${remainingCars}`,
//                     remainingCars,
//                     planName: selectedPlan.planName,
//                 });
//             }
//         }

//         // Check if user already exists in plan's phoneNumber list
//         if (selectedPlan.phoneNumber.includes(phoneNumber)) {
//             return res.status(400).json({
//                 status: "error",
//                 message: "You have already selected this plan. Please complete payment.",
//             });
//         }

//         // User is not paid — add to plan and allow payment
//         selectedPlan.phoneNumber.push(phoneNumber);
//         selectedPlan.createdAt = new Date();
//         selectedPlan.expireDate = moment(selectedPlan.createdAt).add(selectedPlan.durationDays, 'days').toDate();
//         await selectedPlan.save();

//         // Create notification
//         await NotificationUser.create({
//             recipientPhoneNumber: phoneNumber,
//             senderPhoneNumber: phoneNumber,
//             ppcId: "PLAN-" + planId,
//             message: `A new plan has been selected by ${phoneNumber}.`,
//             createdAt: new Date(),
//         });

//         return res.status(200).json({
//             status: "proceed",
//             message: "Plan selected. Please proceed to payment.",
//             selectedPlan,
//             createdDate: moment(selectedPlan.createdAt).format('YYYY-MM-DD'),
//             expireDate: moment(selectedPlan.expireDate).format('YYYY-MM-DD')
//         });

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             status: "error",
//             message: "Something went wrong while selecting the plan.",
//             error: error.message,
//         });
//     }
// });






router.get("/all-selected-plans", async (req, res) => {
    try {
        // Get all pricing plans with assigned phoneNumber (i.e., selected plans)
        const allPlans = await PricingPlans.find({ phoneNumber: { $exists: true } });

        const plansWithExpiry = allPlans.map(plan => {
            const createdAt = new Date(plan.createdAt);
            const duration = plan.durationDays || 0;

            // Calculate expiry date
            const expiryDate = new Date(createdAt);
            expiryDate.setDate(expiryDate.getDate() + duration);

            return {
                ...plan._doc,
                expiryDate: expiryDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
            };
        });

        return res.status(200).json({
            status: "success",
            data: plansWithExpiry
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch plans with expiry date.",
            error: error.message
        });
    }
});


router.get("/fetch-plan-by-phone", async (req, res) => {
    try {
        // Step 1: Extract phoneNumber from the request query
        const { phoneNumber } = req.query;

        // Step 2: Find the plan for the user with the given phone number
        const plan = await PricingPlans.findOne({ phoneNumber });

        // If the plan is not found
        if (!plan) {
            return res.status(404).json({ message: 'No plan found for this phone number.' });
        }

        // Step 3: Calculate the expiry date based on the createdAt and durationDays
        const createdAt = new Date(plan.createdAt);
        const duration = plan.durationDays || 0; // Default to 0 if durationDays is undefined

        const expiryDate = new Date(createdAt);
        expiryDate.setDate(expiryDate.getDate() + duration);

        // Step 4: Return plan details including expiry date
        return res.status(200).json({
            status: "success",
            phoneNumber: plan.phoneNumber,
            planName: plan.name,
            packageType: plan.packageType,
            durationDays: plan.durationDays,
  // Number of cars (new field)
    numOfCars: plan.numOfCars,
    usedCars:plan.usedCars,
     remainingCars:plan.remainingCars,          
       price: plan.price,
       featuredMaxCar:plan.featuredMaxCar,
       featuredAds:plan.featuredAds,
            createdAt: plan.createdAt,
            expiryDate: expiryDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
        });
    } catch (error) {
        // Error handling
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch plan by phone number.",
            error: error.message
        });
    }
});


router.get('/plans', async (req, res) => {
    try {
        const plans = await PricingPlans.find(); // Fetch all plans

        // Filter unique plans based on 'name'
        const uniquePlans = [];
        const seenNames = new Set();

        plans.forEach(plan => {
            if (!seenNames.has(plan.name)) {
                seenNames.add(plan.name);
                uniquePlans.push(plan);
            }
        });

        return res.status(200).json(uniquePlans);
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving plans.', error: error.message });
    }
});



router.get('/plan-names', async (req, res) => {
    try {
        const plans = await PricingPlans.find({}, 'name'); // Fetch only the 'name' field

        // Filter unique names
        const uniqueNames = [];
        const seenNames = new Set();

        plans.forEach(plan => {
            if (!seenNames.has(plan.name)) {
                seenNames.add(plan.name);
                uniqueNames.push(plan.name); // Push only the name
            }
        });

        return res.status(200).json(uniqueNames); // Return array of names
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving plan names.', error: error.message });
    }
});


// Get a specific plan by ID
router.get('/plans/:id', async (req, res) => {
    try {
        const plan = await PricingPlans.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found.' });
        }
        return res.status(200).json(plan);
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving plan.', error: error.message });
    }
});





router.get('/get-active-plans', async (req, res) => {
    try {
        const activePlans = await PricingPlans.find({ status: 'active' });
        return res.status(200).json(activePlans);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching active plans.', error: error.message });
    }
});


router.get('/get-latest-active-plan/:phoneNumber', async (req, res) => {
    const { phoneNumber } = req.params;

    try {
        const latestPlan = await PricingPlans.findOne({ phoneNumber, status: 'active' }).sort({ createdAt: -1 });

        if (!latestPlan) {
            return res.status(404).json({ message: 'No active plan found for this user.' });
        }

        return res.status(200).json(latestPlan);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching latest active plan.', error: error.message });
    }
});




router.put('/update-plan-data/:id', async (req, res) => {
    const { name, packageType, unlimitedAds, price, durationDays, numOfCars, featuredAds, featuredMaxCar, description, status } = req.body;

    try {
        // Check if another plan already has this name
        const existingPlan = await PricingPlans.findOne({ name, _id: { $ne: req.params.id } });
        if (existingPlan) {
            return res.status(400).json({ message: 'Another plan with this name already exists. Choose a different name.' });
        }

        const updatedPlan = await PricingPlans.findByIdAndUpdate(
            req.params.id,
            { name, packageType, unlimitedAds, price, durationDays, numOfCars, featuredAds, featuredMaxCar, description, status },
            { new: true }
        );

        if (!updatedPlan) {
            return res.status(404).json({ message: 'Plan not found.' });
        }

        return res.status(200).json({ message: 'Plan updated successfully!', updatedPlan });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating plan.', error: error.message });
    }
});


// Update a plan's status by ID
router.put('/update-plan/:id', async (req, res) => {
    const { status } = req.body;

    try {
        const updatedPlan = await PricingPlans.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!updatedPlan) {
            return res.status(404).json({ message: 'Plan not found.' });
        }
        return res.status(200).json({ message: 'Plan status updated successfully!', updatedPlan });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating plan status.', error: error.message });
    }
});

// Delete a plan by ID
router.delete('/delete-plan/:id', async (req, res) => {
    try {
        const deletedPlan = await PricingPlans.findByIdAndDelete(req.params.id);
        if (!deletedPlan) {
            return res.status(404).json({ message: 'Plan not found.' });
        }
        return res.status(200).json({ message: 'Plan deleted successfully!' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting plan.', error: error.message });
    }
});


// Get all active plans (excluding Free plan)
router.get('/active-plans', async (req, res) => {
  try {
    const activePlans = await PricingPlans.find({
      status: 'active',
      name: { $ne: 'Free' }, // ✅ Exclude plans named "Free"
    });

    return res.status(200).json(activePlans);
  } catch (error) {
    return res.status(500).json({
      message: 'Error retrieving active plans.',
      error: error.message,
    });
  }
});


// Get all active plans
router.get('/active-plans-include-free', async (req, res) => {
    try {
        const activePlans = await PricingPlans.find({ status: 'active' });
        return res.status(200).json(activePlans);
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving active plans.', error: error.message });
    }
});




router.get('/get-new-plan', async (req, res) => {
    let { phoneNumber } = req.query;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required.' });
    }

    try {
        // Normalize phone number format
        phoneNumber = phoneNumber.replace(/\D/g, ''); // Remove non-numeric characters

        if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
            phoneNumber = phoneNumber.slice(2); // Convert '917878789090' → '787878789090'
        }


        // Fetch plans with multiple matching formats
        const plans = await PricingPlans.find({
            $or: [
                { phoneNumber: phoneNumber },          // Matches "787878789090"
                { phoneNumber: `+91${phoneNumber}` },  // Matches "+917878789090"
                { phoneNumber: `91${phoneNumber}` },   // Matches "917878789090"
                { phoneNumber: Number(phoneNumber) }   // Matches if stored as a Number
            ]
        }).exec();


        if (!plans || plans.length === 0) {
            return res.status(404).json({ message: 'No plans found for this phone number' });
        }

        res.status(200).json({ plans });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching plan data', error: error.message });
    }
});



router.get('/expiring-soon', async (req, res) => {
    try {
        const currentDate = new Date();
        const expiringDate = new Date();
        expiringDate.setDate(currentDate.getDate() + 5); // Adjust this as needed (e.g., 5 days before expiry)

        const expiringPlans = await PricingPlans.find({
            status: 'active',
            $expr: {
                $lte: [
                    { $add: ["$createdAt", { $multiply: ["$durationDays", 86400000] }] },
                    expiringDate
                ]
            }
        });

        if (expiringPlans.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Some plans are expiring soon.",
                expiringPlans
            });
        } else {
            return res.status(200).json({
                success: true,
                message: "No plans are expiring soon."
            });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving expiring plans.', error: error.message });
    }
});


router.get('/expired-plans', async (req, res) => {
    try {
        const currentDate = new Date();

        const expiredPlans = await PricingPlans.find({
            status: 'active',
            $expr: {
                $lt: [
                    { $add: ["$createdAt", { $multiply: ["$durationDays", 86400000] }] },
                    currentDate
                ]
            }
        });

        if (expiredPlans.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Some plans have expired.",
                expiredPlans
            });
        } else {
            return res.status(200).json({
                success: true,
                message: "No plans have expired."
            });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving expired plans.', error: error.message });
    }
});



router.put('/update-expired-plans', async (req, res) => {
    try {
        const currentDate = new Date();

        const updatedPlans = await PricingPlans.updateMany(
            {
                status: 'active',
                $expr: {
                    $lt: [
                        { $add: ["$createdAt", { $multiply: ["$durationDays", 86400000] }] },
                        currentDate
                    ]
                }
            },
            { $set: { status: 'expired' } }
        );

        return res.status(200).json({ message: 'Expired plans updated successfully!', updatedPlans });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating expired plans.', error: error.message });
    }
});


router.get('/all-properties-by-phone-plan/:phoneNumber', async (req, res) => {
  const phoneNumber = req.params.phoneNumber;

  try {
    // 1. Get all properties by phone number
    const properties = await AddModel.find({ phoneNumber, isDeleted: false });

    if (properties.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No properties found for this phone number'
      });
    }

    // 2. Collect all PPC IDs from properties
    const ppcIds = properties.map(p => p.ppcId);

    // 3. Get matching Pricing Plans
    const pricingPlans = await PricingPlans.find({ 'phoneNumbers.number': phoneNumber });

    // 4. Get all PaymentPayU by PPC IDs
    const payments = await PaymentPayU.find({ ppcId: { $in: ppcIds } });

    // 5. Map payment by PPC for quick lookup
    const paymentMap = {};
    payments.forEach(p => {
      if (
        !paymentMap[p.ppcId] ||
        new Date(p.createdAt) > new Date(paymentMap[p.ppcId].createdAt)
      ) {
        paymentMap[p.ppcId] = p;
      }
    });

    // 6. Enhance each property with payment info, plan info, and expiry logic
    const now = new Date();

    const enrichedProperties = properties.map(property => {
      const payment = paymentMap[property.ppcId] || null;

      // Find corresponding plan data
      let matchedPlanEntry = null;
      for (let plan of pricingPlans) {
        matchedPlanEntry = plan.phoneNumbers.find(pn => pn.ppcId === property.ppcId);
        if (matchedPlanEntry) break;
      }

      // Get expiry date from plan or use null
      const expireDate = matchedPlanEntry?.expireDate
        ? new Date(matchedPlanEntry.expireDate)
        : null;

      let expiryMessage = '';
      if (expireDate) {
        const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) {
          expiryMessage = 'Expired';
        } else if (diffDays <= 5) {
          expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        }
      }

      return {
        ...property.toObject(),
        paymentInfo: payment || null,
        planInfo: matchedPlanEntry || null,
        expireDate: expireDate ? expireDate.toISOString() : null,
        expiryMessage
      };
    });

    return res.status(200).json({
      status: 'success',
      phoneNumber,
      total: enrichedProperties.length,
      properties: enrichedProperties
    });

  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Error fetching properties',
      error: err.message
    });
  }
});


module.exports = router;
