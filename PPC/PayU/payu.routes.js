




const express = require('express');
const router = express.Router();
const moment = require('moment');
const payuController = require('./payu.controller');
const PaymentPayU = require('./PayUModel');



// Generic route generator for status without phone number filter
const getAllPaymentsByStatus = (status) => async (req, res) => {
  try {
    const payments = await PaymentPayU.find({
      payustatususer: status,
    }).sort({ createdAt: -1 });

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No payments with status '${status}' found.`,
      });
    }

    return res.status(200).json({
      success: true,
      total: payments.length,
      payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error fetching payments with status '${status}'.`,
      error: error.message,
    });
  }
};


const getPaymentsWithPlanByStatus = (status) => async (req, res) => {
  try {
    // Fetch all payments with given status
    const payments = await PaymentPayU.find({ payustatususer: status }).sort({ createdAt: -1 });
    if (!payments.length) {
      return res.status(404).json({ success: false, message: `No payments found for status '${status}'.` });
    }

    // Fetch all pricing plans
    const allPlans = await PricingPlans.find();

    // Normalize and map plans with usage
    const plansWithUsage = await Promise.all(
      allPlans.map(async (plan) => {
        const rawPhone = Array.isArray(plan.phoneNumber) ? plan.phoneNumber[0] : plan.phoneNumber || '';
        const normalizedPhone = rawPhone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

        const usedCars = await AddModel.countDocuments({
          phoneNumber: new RegExp(normalizedPhone + '$'),
          isDeleted: false,
        });

        const remainingCars = (plan.numOfCars || 0) - usedCars;
        const createdAt = new Date(plan.createdAt);
        const expiryDate = new Date(createdAt);
        expiryDate.setDate(createdAt.getDate() + (plan.durationDays || 0));

        return {
          phone: normalizedPhone,
          planName: plan.name,
          details: {
            planName: plan.name,
            packageType: plan.packageType,
            durationDays: plan.durationDays || 0,
            numOfCars: plan.numOfCars || 0,
            usedCars,
            remainingCars: remainingCars < 0 ? 0 : remainingCars,
            price: plan.price || 0,
            featuredMaxCar: plan.featuredMaxCar || 0,
            featuredAds: plan.featuredAds || 0,
            createdAt: plan.createdAt,
            expiryDate: expiryDate.toISOString().split('T')[0],
          }
        };
      })
    );

    // Merge payments with corresponding plan details
    const merged = payments.map((payment) => {
      const normalizedPhone = (payment.phone || '').replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();
      const matchedPlan = plansWithUsage.find(
        (p) =>
          p.phone === normalizedPhone &&
          p.planName.toLowerCase() === (payment.planName || '').toLowerCase()
      );

      return {
        ...payment.toObject(),
        planDetails: matchedPlan ? matchedPlan.details : null
      };
    });

    return res.status(200).json({ success: true, total: merged.length, data: merged });

  } catch (error) {
    console.error(`Error fetching '${status}' payments with plan usage:`, error);
    return res.status(500).json({
      success: false,
      message: `Server error while fetching '${status}' payments with plan usage.`,
      error: error.message
    });
  }
};


// Define routes without phoneNumber parameter
router.get('/payments/pay-now', getAllPaymentsByStatus('pay now'));
router.get('/payments/pay-later', getAllPaymentsByStatus('pay later'));
router.get('/payments/paid', getAllPaymentsByStatus('paid'));
router.get('/payments/pay-failed', getAllPaymentsByStatus('pay failed'));



// 🔸 Route: Create Payment (Pay Now)
router.post('/payu/payment', payuController.createPayment);

// 🔸 Route: Save Pay Later
router.post('/payu/payment-later', payuController.savePayLater);

// 🔸 Route: Handle PayU Success/Failure (POST)
// router.post('/payu/success', payuController.handlePaymentSuccess);
router.post('/payu/failure', payuController.handlePaymentFailure);

router.get('/payu/success', payuController.handlePaymentSuccess);
router.get('/payu/failure', payuController.handlePaymentFailure);


// 🔸 Route: Handle PayU Success/Failure (GET fallback)
// router.get('/payu/success', (req, res) => {
//   res.send('PayU Success GET endpoint hit — use POST from PayU gateway.');
// });
// router.get('/payu/failure', (req, res) => {
//   res.send('PayU Failure GET endpoint hit — use POST from PayU gateway.');
// });

// Add this before your success route
router.post('/payu/success', (req, res, next) => {
  console.log('PayU Success POST received:', {
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  next();
}, payuController.handlePaymentSuccess);

// 🔸 Route: Get Successful / Failed Payments
router.get('/payu/payments/success', payuController.getSuccessfulPayments);
router.get('/payu/payments/failure', payuController.getFailedPayments);

// 🔸 Route: Get user plan usage by phone number
router.get('/user-plan-usage/:phone', payuController.getUserPlanUsage);

// 🔸 Route: Get used and remaining cars for user
router.get('/payu/car-usage', payuController.getUsedAndRemainingCars);

router.get('/payments-with-plan/pay-now', getPaymentsWithPlanByStatus('pay now'));
router.get('/payments-with-plan/pay-later', getPaymentsWithPlanByStatus('pay later'));
router.get('/payments-with-plan/paid', getPaymentsWithPlanByStatus('paid'));
router.get('/payments-with-plan/pay-failed', getPaymentsWithPlanByStatus('pay failed'));



// Combined API for all payment statuses
router.get("/payments/summary", async (req, res) => {
  try {
    const { day } = req.query;

    let startDate, endDate;

    if (day === "today") {
      startDate = moment().startOf("day").toDate();
      endDate = moment().endOf("day").toDate();
    } else if (day === "yesterday") {
      startDate = moment().subtract(1, "day").startOf("day").toDate();
      endDate = moment().subtract(1, "day").endOf("day").toDate();
    }

    const query = day
      ? { createdAt: { $gte: startDate, $lte: endDate } }
      : {};

    const statuses = ["pay now", "pay later", "paid", "pay failed"];

    const summary = {};

    for (const status of statuses) {
      const payments = await PaymentPayU.find({
        payustatususer: status,
        ...query,
      }).sort({ createdAt: -1 });

      summary[status] = {
        count: payments.length,
        data: payments,
      };
    }

    res.status(200).json({
      success: true,
      day: day || "all",
      total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payment summary.",
      error: error.message,
    });
  }
});

router.get("/payments/summary-data", async (req, res) => {
  try {
    let startDate, endDate;

    if (req.query.dates) {
      const parts = req.query.dates.split(",");
      if (parts.length !== 2) {
        return res.status(400).json({
          success: false,
          message: "Invalid format. Use ?dates=YYYY-MM-DD,YYYY-MM-DD",
        });
      }
      startDate = moment(parts[0], "YYYY-MM-DD").startOf("day").toDate();
      endDate = moment(parts[1], "YYYY-MM-DD").endOf("day").toDate();
    } else if (req.query.day) {
      if (req.query.day === "today") {
        startDate = moment().startOf("day").toDate();
        endDate = moment().endOf("day").toDate();
      } else if (req.query.day === "yesterday") {
        startDate = moment().subtract(1, "day").startOf("day").toDate();
        endDate = moment().subtract(1, "day").endOf("day").toDate();
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid day. Use 'today', 'yesterday', or dates param.",
        });
      }
    }

    // 🔹 Filter by payUdate instead of createdAt
    const dateFilter =
      startDate && endDate ? { payUdate: { $gte: startDate, $lte: endDate } } : {};

    const statuses = ["pay now", "pay later", "paid", "pay failed"];
    const summary = {};

    for (const status of statuses) {
      const payments = await PaymentPayU.find({
        payustatususer: status,
        ...dateFilter,
      }).sort({ payUdate: -1 }); // sort by payUdate

      summary[status] = {
        count: payments.length,
        data: payments,
      };
    }

    res.status(200).json({
      success: true,
      dateRange: startDate && endDate ? { startDate, endDate } : "all",
      total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payment summary.",
      error: error.message,
    });
  }
});



// router.get("/payments/summary-data", async (req, res) => {
//   try {
//     let startDate, endDate;

//     // --- Handle date range query ---
//     if (req.query.dates) {
//       const parts = req.query.dates.split(",");
//       if (parts.length !== 2) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid format. Use ?dates=YYYY-MM-DD,YYYY-MM-DD"
//         });
//       }
//       startDate = moment(parts[0], "YYYY-MM-DD").startOf("day").toDate();
//       endDate = moment(parts[1], "YYYY-MM-DD").endOf("day").toDate();
//     }
//     // --- Handle single day query ---
//     else if (req.query.day) {
//       if (req.query.day === "today") {
//         startDate = moment().startOf("day").toDate();
//         endDate = moment().endOf("day").toDate();
//       } else if (req.query.day === "yesterday") {
//         startDate = moment().subtract(1, "day").startOf("day").toDate();
//         endDate = moment().subtract(1, "day").endOf("day").toDate();
//       } else {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid day. Use 'today', 'yesterday', or dates param."
//         });
//       }
//     }
//     // --- Default: all data ---
//     else {
//       startDate = null;
//       endDate = null;
//     }

//     const dateFilter = startDate && endDate
//       ? { createdAt: { $gte: startDate, $lte: endDate } }
//       : {};

//     const statuses = ["pay now", "pay later", "paid", "pay failed"];
//     const summary = {};

//     for (const status of statuses) {
//       const payments = await PaymentPayU.find({
//         payustatususer: status,
//         ...dateFilter
//       }).sort({ createdAt: -1 });

//       summary[status] = {
//         count: payments.length,
//         data: payments
//       };
//     }

//     res.status(200).json({
//       success: true,
//       dateRange: startDate && endDate ? { startDate, endDate } : "all",
//       total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
//       summary
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching payment summary.",
//       error: error.message
//     });
//   }
// });

// ✅ DONE — export the router
module.exports = router;























// const express = require('express');
// const router = express.Router();
// const moment = require('moment');
// const payuController = require('./payu.controller');
// const PaymentPayU = require('./PayUModel');



// // Generic route generator for status without phone number filter
// const getAllPaymentsByStatus = (status) => async (req, res) => {
//   try {
//     const payments = await PaymentPayU.find({
//       payustatususer: status,
//     }).sort({ createdAt: -1 });

//     if (payments.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `No payments with status '${status}' found.`,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       total: payments.length,
//       payments,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: `Error fetching payments with status '${status}'.`,
//       error: error.message,
//     });
//   }
// };


// const getPaymentsWithPlanByStatus = (status) => async (req, res) => {
//   try {
//     // Fetch all payments with given status
//     const payments = await PaymentPayU.find({ payustatususer: status }).sort({ createdAt: -1 });
//     if (!payments.length) {
//       return res.status(404).json({ success: false, message: `No payments found for status '${status}'.` });
//     }

//     // Fetch all pricing plans
//     const allPlans = await PricingPlans.find();

//     // Normalize and map plans with usage
//     const plansWithUsage = await Promise.all(
//       allPlans.map(async (plan) => {
//         const rawPhone = Array.isArray(plan.phoneNumber) ? plan.phoneNumber[0] : plan.phoneNumber || '';
//         const normalizedPhone = rawPhone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

//         const usedCars = await AddModel.countDocuments({
//           phoneNumber: new RegExp(normalizedPhone + '$'),
//           isDeleted: false,
//         });

//         const remainingCars = (plan.numOfCars || 0) - usedCars;
//         const createdAt = new Date(plan.createdAt);
//         const expiryDate = new Date(createdAt);
//         expiryDate.setDate(createdAt.getDate() + (plan.durationDays || 0));

//         return {
//           phone: normalizedPhone,
//           planName: plan.name,
//           details: {
//             planName: plan.name,
//             packageType: plan.packageType,
//             durationDays: plan.durationDays || 0,
//             numOfCars: plan.numOfCars || 0,
//             usedCars,
//             remainingCars: remainingCars < 0 ? 0 : remainingCars,
//             price: plan.price || 0,
//             featuredMaxCar: plan.featuredMaxCar || 0,
//             featuredAds: plan.featuredAds || 0,
//             createdAt: plan.createdAt,
//             expiryDate: expiryDate.toISOString().split('T')[0],
//           }
//         };
//       })
//     );

//     // Merge payments with corresponding plan details
//     const merged = payments.map((payment) => {
//       const normalizedPhone = (payment.phone || '').replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();
//       const matchedPlan = plansWithUsage.find(
//         (p) =>
//           p.phone === normalizedPhone &&
//           p.planName.toLowerCase() === (payment.planName || '').toLowerCase()
//       );

//       return {
//         ...payment.toObject(),
//         planDetails: matchedPlan ? matchedPlan.details : null
//       };
//     });

//     return res.status(200).json({ success: true, total: merged.length, data: merged });

//   } catch (error) {
//     console.error(`Error fetching '${status}' payments with plan usage:`, error);
//     return res.status(500).json({
//       success: false,
//       message: `Server error while fetching '${status}' payments with plan usage.`,
//       error: error.message
//     });
//   }
// };


// // Define routes without phoneNumber parameter
// router.get('/payments/pay-now', getAllPaymentsByStatus('pay now'));
// router.get('/payments/pay-later', getAllPaymentsByStatus('pay later'));
// router.get('/payments/paid', getAllPaymentsByStatus('paid'));
// router.get('/payments/pay-failed', getAllPaymentsByStatus('pay failed'));



// // 🔸 Route: Create Payment (Pay Now)
// router.post('/payu/payment', payuController.createPayment);

// // 🔸 Route: Save Pay Later
// router.post('/payu/payment-later', payuController.savePayLater);

// // 🔸 Route: Handle PayU Success/Failure (POST)
// router.post('/payu/success', payuController.handlePaymentSuccess);
// router.post('/payu/failure', payuController.handlePaymentFailure);

// router.get('/payu/success', payuController.handlePaymentSuccess);
// router.get('/payu/failure', payuController.handlePaymentFailure);


// // 🔸 Route: Get Successful / Failed Payments
// router.get('/payu/payments/success', payuController.getSuccessfulPayments);
// router.get('/payu/payments/failure', payuController.getFailedPayments);

// // 🔸 Route: Get user plan usage by phone number
// router.get('/user-plan-usage/:phone', payuController.getUserPlanUsage);

// // 🔸 Route: Get used and remaining cars for user
// router.get('/payu/car-usage', payuController.getUsedAndRemainingCars);

// router.get('/payments-with-plan/pay-now', getPaymentsWithPlanByStatus('pay now'));
// router.get('/payments-with-plan/pay-later', getPaymentsWithPlanByStatus('pay later'));
// router.get('/payments-with-plan/paid', getPaymentsWithPlanByStatus('paid'));
// router.get('/payments-with-plan/pay-failed', getPaymentsWithPlanByStatus('pay failed'));



// // Combined API for all payment statuses
// router.get("/payments/summary", async (req, res) => {
//   try {
//     const { day } = req.query;

//     let startDate, endDate;

//     if (day === "today") {
//       startDate = moment().startOf("day").toDate();
//       endDate = moment().endOf("day").toDate();
//     } else if (day === "yesterday") {
//       startDate = moment().subtract(1, "day").startOf("day").toDate();
//       endDate = moment().subtract(1, "day").endOf("day").toDate();
//     }

//     const query = day
//       ? { createdAt: { $gte: startDate, $lte: endDate } }
//       : {};

//     const statuses = ["pay now", "pay later", "paid", "pay failed"];

//     const summary = {};

//     for (const status of statuses) {
//       const payments = await PaymentPayU.find({
//         payustatususer: status,
//         ...query,
//       }).sort({ createdAt: -1 });

//       summary[status] = {
//         count: payments.length,
//         data: payments,
//       };
//     }

//     res.status(200).json({
//       success: true,
//       day: day || "all",
//       total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
//       summary,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching payment summary.",
//       error: error.message,
//     });
//   }
// });

// router.get("/payments/summary-data", async (req, res) => {
//   try {
//     let startDate, endDate;

//     if (req.query.dates) {
//       const parts = req.query.dates.split(",");
//       if (parts.length !== 2) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid format. Use ?dates=YYYY-MM-DD,YYYY-MM-DD",
//         });
//       }
//       startDate = moment(parts[0], "YYYY-MM-DD").startOf("day").toDate();
//       endDate = moment(parts[1], "YYYY-MM-DD").endOf("day").toDate();
//     } else if (req.query.day) {
//       if (req.query.day === "today") {
//         startDate = moment().startOf("day").toDate();
//         endDate = moment().endOf("day").toDate();
//       } else if (req.query.day === "yesterday") {
//         startDate = moment().subtract(1, "day").startOf("day").toDate();
//         endDate = moment().subtract(1, "day").endOf("day").toDate();
//       } else {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid day. Use 'today', 'yesterday', or dates param.",
//         });
//       }
//     }

//     // 🔹 Filter by payUdate instead of createdAt
//     const dateFilter =
//       startDate && endDate ? { payUdate: { $gte: startDate, $lte: endDate } } : {};

//     const statuses = ["pay now", "pay later", "paid", "pay failed"];
//     const summary = {};

//     for (const status of statuses) {
//       const payments = await PaymentPayU.find({
//         payustatususer: status,
//         ...dateFilter,
//       }).sort({ payUdate: -1 }); // sort by payUdate

//       summary[status] = {
//         count: payments.length,
//         data: payments,
//       };
//     }

//     res.status(200).json({
//       success: true,
//       dateRange: startDate && endDate ? { startDate, endDate } : "all",
//       total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
//       summary,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching payment summary.",
//       error: error.message,
//     });
//   }
// });



// // router.get("/payments/summary-data", async (req, res) => {
// //   try {
// //     let startDate, endDate;

// //     // --- Handle date range query ---
// //     if (req.query.dates) {
// //       const parts = req.query.dates.split(",");
// //       if (parts.length !== 2) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Invalid format. Use ?dates=YYYY-MM-DD,YYYY-MM-DD"
// //         });
// //       }
// //       startDate = moment(parts[0], "YYYY-MM-DD").startOf("day").toDate();
// //       endDate = moment(parts[1], "YYYY-MM-DD").endOf("day").toDate();
// //     }
// //     // --- Handle single day query ---
// //     else if (req.query.day) {
// //       if (req.query.day === "today") {
// //         startDate = moment().startOf("day").toDate();
// //         endDate = moment().endOf("day").toDate();
// //       } else if (req.query.day === "yesterday") {
// //         startDate = moment().subtract(1, "day").startOf("day").toDate();
// //         endDate = moment().subtract(1, "day").endOf("day").toDate();
// //       } else {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Invalid day. Use 'today', 'yesterday', or dates param."
// //         });
// //       }
// //     }
// //     // --- Default: all data ---
// //     else {
// //       startDate = null;
// //       endDate = null;
// //     }

// //     const dateFilter = startDate && endDate
// //       ? { createdAt: { $gte: startDate, $lte: endDate } }
// //       : {};

// //     const statuses = ["pay now", "pay later", "paid", "pay failed"];
// //     const summary = {};

// //     for (const status of statuses) {
// //       const payments = await PaymentPayU.find({
// //         payustatususer: status,
// //         ...dateFilter
// //       }).sort({ createdAt: -1 });

// //       summary[status] = {
// //         count: payments.length,
// //         data: payments
// //       };
// //     }

// //     res.status(200).json({
// //       success: true,
// //       dateRange: startDate && endDate ? { startDate, endDate } : "all",
// //       total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
// //       summary
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: "Error fetching payment summary.",
// //       error: error.message
// //     });
// //   }
// // });

// // ✅ DONE — export the router
// module.exports = router;

























// // // const express = require('express');
// // // const router = express.Router();
// // // const payuController = require('./payu.controller');
// // // const PaymentPayU = require('./PayUModel');
// // // const PricingPlans = require('../plans/PricingPlanModel');
// // // const AddModel = require('../AddModel');


// // // // Generic route generator for status without phone number filter
// // // const getAllPaymentsByStatus = (status) => async (req, res) => {
// // //   try {
// // //     const payments = await PaymentPayU.find({
// // //       payustatususer: status,
// // //     }).sort({ createdAt: -1 });

// // //     if (payments.length === 0) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: `No payments with status '${status}' found.`,
// // //       });
// // //     }

// // //     return res.status(200).json({
// // //       success: true,
// // //       total: payments.length,
// // //       payments,
// // //     });
// // //   } catch (error) {
// // //     return res.status(500).json({
// // //       success: false,
// // //       message: `Error fetching payments with status '${status}'.`,
// // //       error: error.message,
// // //     });
// // //   }
// // // };


// // // const getPaymentsWithPlanByStatus = (status) => async (req, res) => {
// // //   try {
// // //     // Fetch all payments with given status
// // //     const payments = await PaymentPayU.find({ payustatususer: status }).sort({ createdAt: -1 });
// // //     if (!payments.length) {
// // //       return res.status(404).json({ success: false, message: `No payments found for status '${status}'.` });
// // //     }

// // //     // Fetch all pricing plans
// // //     const allPlans = await PricingPlans.find();

// // //     // Normalize and map plans with usage
// // //     const plansWithUsage = await Promise.all(
// // //       allPlans.map(async (plan) => {
// // //         const rawPhone = Array.isArray(plan.phoneNumber) ? plan.phoneNumber[0] : plan.phoneNumber || '';
// // //         const normalizedPhone = rawPhone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

// // //         const usedCars = await AddModel.countDocuments({
// // //           phoneNumber: new RegExp(normalizedPhone + '$'),
// // //           isDeleted: false,
// // //         });

// // //         const remainingCars = (plan.numOfCars || 0) - usedCars;
// // //         const createdAt = new Date(plan.createdAt);
// // //         const expiryDate = new Date(createdAt);
// // //         expiryDate.setDate(createdAt.getDate() + (plan.durationDays || 0));

// // //         return {
// // //           phone: normalizedPhone,
// // //           planName: plan.name,
// // //           details: {
// // //             planName: plan.name,
// // //             packageType: plan.packageType,
// // //             durationDays: plan.durationDays || 0,
// // //             numOfCars: plan.numOfCars || 0,
// // //             usedCars,
// // //             remainingCars: remainingCars < 0 ? 0 : remainingCars,
// // //             price: plan.price || 0,
// // //             featuredMaxCar: plan.featuredMaxCar || 0,
// // //             featuredAds: plan.featuredAds || 0,
// // //             createdAt: plan.createdAt,
// // //             expiryDate: expiryDate.toISOString().split('T')[0],
// // //           }
// // //         };
// // //       })
// // //     );

// // //     // Merge payments with corresponding plan details
// // //     const merged = payments.map((payment) => {
// // //       const normalizedPhone = (payment.phone || '').replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();
// // //       const matchedPlan = plansWithUsage.find(
// // //         (p) =>
// // //           p.phone === normalizedPhone &&
// // //           p.planName.toLowerCase() === (payment.planName || '').toLowerCase()
// // //       );

// // //       return {
// // //         ...payment.toObject(),
// // //         planDetails: matchedPlan ? matchedPlan.details : null
// // //       };
// // //     });

// // //     return res.status(200).json({ success: true, total: merged.length, data: merged });

// // //   } catch (error) {
// // //     console.error(`Error fetching '${status}' payments with plan usage:`, error);
// // //     return res.status(500).json({
// // //       success: false,
// // //       message: `Server error while fetching '${status}' payments with plan usage.`,
// // //       error: error.message
// // //     });
// // //   }
// // // };


// // // // Define routes without phoneNumber parameter
// // // router.get('/payments/pay-now', getAllPaymentsByStatus('pay now'));
// // // router.get('/payments/pay-later', getAllPaymentsByStatus('pay later'));
// // // router.get('/payments/paid', getAllPaymentsByStatus('paid'));
// // // router.get('/payments/pay-failed', getAllPaymentsByStatus('pay failed'));


// // // router.post('/payu/payment', payuController.createPayment);
// // // router.post('/payu/payment-later', payuController.savePayLater);
// // // router.post('/payu/success', payuController.handlePaymentSuccess);
// // // router.post('/payu/failure', payuController.handlePaymentFailure);

// // // router.get('/payu/success', payuController.handlePaymentSuccess);
// // // router.get('/payu/failure', payuController.handlePaymentFailure);

// // // router.get('/payu/payments/success', payuController.getSuccessfulPayments);
// // // router.get('/payu/payments/failure', payuController.getFailedPayments);


// // // router.get('/user-plan-usage/:phone', payuController.getUserPlanUsage);
// // // router.get('/payu/car-usage', payuController.getUsedAndRemainingCars);




// // // router.get('/payments-with-plan/pay-now', getPaymentsWithPlanByStatus('pay now'));
// // // router.get('/payments-with-plan/pay-later', getPaymentsWithPlanByStatus('pay later'));
// // // router.get('/payments-with-plan/paid', getPaymentsWithPlanByStatus('paid'));
// // // router.get('/payments-with-plan/pay-failed', getPaymentsWithPlanByStatus('pay failed'));


// // // module.exports = router;











// // const express = require('express');
// // const router = express.Router();
// // const moment = require('moment');
// // const payuController = require('./payu.controller');
// // const PaymentPayU = require('./PayUModel');



// // // Generic route generator for status without phone number filter
// // const getAllPaymentsByStatus = (status) => async (req, res) => {
// //   try {
// //     const payments = await PaymentPayU.find({
// //       payustatususer: status,
// //     }).sort({ createdAt: -1 });

// //     if (payments.length === 0) {
// //       return res.status(404).json({
// //         success: false,
// //         message: `No payments with status '${status}' found.`,
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       total: payments.length,
// //       payments,
// //     });
// //   } catch (error) {
// //     return res.status(500).json({
// //       success: false,
// //       message: `Error fetching payments with status '${status}'.`,
// //       error: error.message,
// //     });
// //   }
// // };


// // const getPaymentsWithPlanByStatus = (status) => async (req, res) => {
// //   try {
// //     // Fetch all payments with given status
// //     const payments = await PaymentPayU.find({ payustatususer: status }).sort({ createdAt: -1 });
// //     if (!payments.length) {
// //       return res.status(404).json({ success: false, message: `No payments found for status '${status}'.` });
// //     }

// //     // Fetch all pricing plans
// //     const allPlans = await PricingPlans.find();

// //     // Normalize and map plans with usage
// //     const plansWithUsage = await Promise.all(
// //       allPlans.map(async (plan) => {
// //         const rawPhone = Array.isArray(plan.phoneNumber) ? plan.phoneNumber[0] : plan.phoneNumber || '';
// //         const normalizedPhone = rawPhone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

// //         const usedCars = await AddModel.countDocuments({
// //           phoneNumber: new RegExp(normalizedPhone + '$'),
// //           isDeleted: false,
// //         });

// //         const remainingCars = (plan.numOfCars || 0) - usedCars;
// //         const createdAt = new Date(plan.createdAt);
// //         const expiryDate = new Date(createdAt);
// //         expiryDate.setDate(createdAt.getDate() + (plan.durationDays || 0));

// //         return {
// //           phone: normalizedPhone,
// //           planName: plan.name,
// //           details: {
// //             planName: plan.name,
// //             packageType: plan.packageType,
// //             durationDays: plan.durationDays || 0,
// //             numOfCars: plan.numOfCars || 0,
// //             usedCars,
// //             remainingCars: remainingCars < 0 ? 0 : remainingCars,
// //             price: plan.price || 0,
// //             featuredMaxCar: plan.featuredMaxCar || 0,
// //             featuredAds: plan.featuredAds || 0,
// //             createdAt: plan.createdAt,
// //             expiryDate: expiryDate.toISOString().split('T')[0],
// //           }
// //         };
// //       })
// //     );

// //     // Merge payments with corresponding plan details
// //     const merged = payments.map((payment) => {
// //       const normalizedPhone = (payment.phone || '').replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();
// //       const matchedPlan = plansWithUsage.find(
// //         (p) =>
// //           p.phone === normalizedPhone &&
// //           p.planName.toLowerCase() === (payment.planName || '').toLowerCase()
// //       );

// //       return {
// //         ...payment.toObject(),
// //         planDetails: matchedPlan ? matchedPlan.details : null
// //       };
// //     });

// //     return res.status(200).json({ success: true, total: merged.length, data: merged });

// //   } catch (error) {
// //     console.error(`Error fetching '${status}' payments with plan usage:`, error);
// //     return res.status(500).json({
// //       success: false,
// //       message: `Server error while fetching '${status}' payments with plan usage.`,
// //       error: error.message
// //     });
// //   }
// // };


// // // Define routes without phoneNumber parameter
// // router.get('/payments/pay-now', getAllPaymentsByStatus('pay now'));
// // router.get('/payments/pay-later', getAllPaymentsByStatus('pay later'));
// // router.get('/payments/paid', getAllPaymentsByStatus('paid'));
// // router.get('/payments/pay-failed', getAllPaymentsByStatus('pay failed'));



// // // 🔸 Route: Create Payment (Pay Now)
// // router.post('/payu/payment', payuController.createPayment);

// // // 🔸 Route: Save Pay Later
// // router.post('/payu/payment-later', payuController.savePayLater);

// // // 🔸 Route: Handle PayU Success/Failure (POST)
// // router.post('/payu/success', payuController.handlePaymentSuccess);
// // router.post('/payu/failure', payuController.handlePaymentFailure);


// // // 🔸 Route: Handle PayU Success/Failure (POST)
// // // router.post('/payu/success', payuController.handlePaymentSuccess);
// // // router.post('/payu/failure', payuController.handlePaymentFailure);

// // // 🔸 Route: Handle PayU Success/Failure (GET fallback)
// // router.get('/payu/success', (req, res) => {
// //   res.send('PayU Success GET endpoint hit — use POST from PayU gateway.');
// // });
// // router.get('/payu/failure', (req, res) => {
// //   res.send('PayU Failure GET endpoint hit — use POST from PayU gateway.');
// // });

// // // router.post('/payu/success', payuController.handlePaymentSuccess);
// // // router.get('/payu/success', payuController.handlePaymentSuccess);

// // // router.post('/payu/failure', payuController.handlePaymentFailure);
// // // router.get('/payu/failure', payuController.handlePaymentFailure);

// // // 🔸 Route: Get Successful / Failed Payments
// // router.get('/payu/payments/success', payuController.getSuccessfulPayments);
// // router.get('/payu/payments/failure', payuController.getFailedPayments);

// // // 🔸 Route: Get user plan usage by phone number
// // router.get('/user-plan-usage/:phone', payuController.getUserPlanUsage);

// // // 🔸 Route: Get used and remaining cars for user
// // router.get('/payu/car-usage', payuController.getUsedAndRemainingCars);

// // router.get('/payments-with-plan/pay-now', getPaymentsWithPlanByStatus('pay now'));
// // router.get('/payments-with-plan/pay-later', getPaymentsWithPlanByStatus('pay later'));
// // router.get('/payments-with-plan/paid', getPaymentsWithPlanByStatus('paid'));
// // router.get('/payments-with-plan/pay-failed', getPaymentsWithPlanByStatus('pay failed'));



// // // Combined API for all payment statuses
// // router.get("/payments/summary", async (req, res) => {
// //   try {
// //     const { day } = req.query;

// //     let startDate, endDate;

// //     if (day === "today") {
// //       startDate = moment().startOf("day").toDate();
// //       endDate = moment().endOf("day").toDate();
// //     } else if (day === "yesterday") {
// //       startDate = moment().subtract(1, "day").startOf("day").toDate();
// //       endDate = moment().subtract(1, "day").endOf("day").toDate();
// //     }

// //     const query = day
// //       ? { createdAt: { $gte: startDate, $lte: endDate } }
// //       : {};

// //     const statuses = ["pay now", "pay later", "paid", "pay failed"];

// //     const summary = {};

// //     for (const status of statuses) {
// //       const payments = await PaymentPayU.find({
// //         payustatususer: status,
// //         ...query,
// //       }).sort({ createdAt: -1 });

// //       summary[status] = {
// //         count: payments.length,
// //         data: payments,
// //       };
// //     }

// //     res.status(200).json({
// //       success: true,
// //       day: day || "all",
// //       total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
// //       summary,
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: "Error fetching payment summary.",
// //       error: error.message,
// //     });
// //   }
// // });

// // // 🔹 Summary API (by day)
// // router.get("/payments/summary", async (req, res) => {
// //   try {
// //     const { day } = req.query;

// //     let startDate, endDate;
// //     if (day === "today") {
// //       startDate = moment().startOf("day").toDate();
// //       endDate = moment().endOf("day").toDate();
// //     } else if (day === "yesterday") {
// //       startDate = moment().subtract(1, "day").startOf("day").toDate();
// //       endDate = moment().subtract(1, "day").endOf("day").toDate();
// //     }

// //     const query = day ? { createdAt: { $gte: startDate, $lte: endDate } } : {};

// //     const statuses = ["pay now", "pay later", "paid", "pay failed"];
// //     const summary = {};

// //     for (const status of statuses) {
// //       const payments = await PaymentPayU.find({
// //         payustatususer: status,
// //         ...query,
// //       }).sort({ createdAt: -1 });

// //       summary[status] = {
// //         count: payments.length,
// //         data: payments,
// //       };
// //     }

// //     res.status(200).json({
// //       success: true,
// //       day: day || "all",
// //       total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
// //       summary,
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: "Error fetching payment summary.",
// //       error: error.message,
// //     });
// //   }
// // });


// // router.get("/payments/summary-data", async (req, res) => {
// //   try {
// //     let startDate, endDate;

// //     if (req.query.dates) {
// //       const parts = req.query.dates.split(",");
// //       if (parts.length !== 2) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Invalid format. Use ?dates=YYYY-MM-DD,YYYY-MM-DD",
// //         });
// //       }
// //       startDate = moment(parts[0], "YYYY-MM-DD").startOf("day").toDate();
// //       endDate = moment(parts[1], "YYYY-MM-DD").endOf("day").toDate();
// //     } else if (req.query.day) {
// //       if (req.query.day === "today") {
// //         startDate = moment().startOf("day").toDate();
// //         endDate = moment().endOf("day").toDate();
// //       } else if (req.query.day === "yesterday") {
// //         startDate = moment().subtract(1, "day").startOf("day").toDate();
// //         endDate = moment().subtract(1, "day").endOf("day").toDate();
// //       } else {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Invalid day. Use 'today', 'yesterday', or dates param.",
// //         });
// //       }
// //     }

// //     // 🔹 Filter by payUdate instead of createdAt
// //     const dateFilter =
// //       startDate && endDate ? { payUdate: { $gte: startDate, $lte: endDate } } : {};

// //     const statuses = ["pay now", "pay later", "paid", "pay failed"];
// //     const summary = {};

// //     for (const status of statuses) {
// //       const payments = await PaymentPayU.find({
// //         payustatususer: status,
// //         ...dateFilter,
// //       }).sort({ payUdate: -1 }); // sort by payUdate

// //       summary[status] = {
// //         count: payments.length,
// //         data: payments,
// //       };
// //     }

// //     res.status(200).json({
// //       success: true,
// //       dateRange: startDate && endDate ? { startDate, endDate } : "all",
// //       total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
// //       summary,
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: "Error fetching payment summary.",
// //       error: error.message,
// //     });
// //   }
// // });


// // // router.get("/payments/summary-data", async (req, res) => {
// // //   try {
// // //     let startDate, endDate;

// // //     // --- Handle date range query ---
// // //     if (req.query.dates) {
// // //       const parts = req.query.dates.split(",");
// // //       if (parts.length !== 2) {
// // //         return res.status(400).json({
// // //           success: false,
// // //           message: "Invalid format. Use ?dates=YYYY-MM-DD,YYYY-MM-DD"
// // //         });
// // //       }
// // //       startDate = moment(parts[0], "YYYY-MM-DD").startOf("day").toDate();
// // //       endDate = moment(parts[1], "YYYY-MM-DD").endOf("day").toDate();
// // //     }
// // //     // --- Handle single day query ---
// // //     else if (req.query.day) {
// // //       if (req.query.day === "today") {
// // //         startDate = moment().startOf("day").toDate();
// // //         endDate = moment().endOf("day").toDate();
// // //       } else if (req.query.day === "yesterday") {
// // //         startDate = moment().subtract(1, "day").startOf("day").toDate();
// // //         endDate = moment().subtract(1, "day").endOf("day").toDate();
// // //       } else {
// // //         return res.status(400).json({
// // //           success: false,
// // //           message: "Invalid day. Use 'today', 'yesterday', or dates param."
// // //         });
// // //       }
// // //     }
// // //     // --- Default: all data ---
// // //     else {
// // //       startDate = null;
// // //       endDate = null;
// // //     }

// // //     const dateFilter = startDate && endDate
// // //       ? { createdAt: { $gte: startDate, $lte: endDate } }
// // //       : {};

// // //     const statuses = ["pay now", "pay later", "paid", "pay failed"];
// // //     const summary = {};

// // //     for (const status of statuses) {
// // //       const payments = await PaymentPayU.find({
// // //         payustatususer: status,
// // //         ...dateFilter
// // //       }).sort({ createdAt: -1 });

// // //       summary[status] = {
// // //         count: payments.length,
// // //         data: payments
// // //       };
// // //     }

// // //     res.status(200).json({
// // //       success: true,
// // //       dateRange: startDate && endDate ? { startDate, endDate } : "all",
// // //       total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
// // //       summary
// // //     });
// // //   } catch (error) {
// // //     res.status(500).json({
// // //       success: false,
// // //       message: "Error fetching payment summary.",
// // //       error: error.message
// // //     });
// // //   }
// // // });


// // // ✅ DONE — export the router
// // module.exports = router;








// // // // PayU/payu.routes.js
// // // const express = require("express");
// // // const router = express.Router();
// // // const moment = require("moment");

// // // const payuController = require("./payu.controller");
// // // const PaymentPayU = require("./PayUModel");
// // // const PricingPlans = require("../plans/PricingPlanModel");
// // // const AddModel = require("../AddModel");

// // // // Add this middleware to parse form data
// // // router.use(express.urlencoded({ extended: true }));
// // // router.use(express.json());

// // // // 🔹 Utility: Get all payments by status
// // // const getAllPaymentsByStatus = (status) => async (req, res) => {
// // //   try {
// // //     const payments = await PaymentPayU.find({ payustatususer: status }).sort({
// // //       createdAt: -1,
// // //     });

// // //     if (payments.length === 0) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: `No payments with status '${status}' found.`,
// // //       });
// // //     }

// // //     return res.status(200).json({
// // //       success: true,
// // //       total: payments.length,
// // //       payments,
// // //     });
// // //   } catch (error) {
// // //     return res.status(500).json({
// // //       success: false,
// // //       message: `Error fetching payments with status '${status}'.`,
// // //       error: error.message,
// // //     });
// // //   }
// // // };

// // // // 🔹 Utility: Get payments + plan usage
// // // const getPaymentsWithPlanByStatus = (status) => async (req, res) => {
// // //   try {
// // //     const payments = await PaymentPayU.find({ payustatususer: status }).sort({
// // //       createdAt: -1,
// // //     });
// // //     if (!payments.length) {
// // //       return res
// // //         .status(404)
// // //         .json({ success: false, message: `No payments found for status '${status}'.` });
// // //     }

// // //     const allPlans = await PricingPlans.find();

// // //     const plansWithUsage = await Promise.all(
// // //       allPlans.map(async (plan) => {
// // //         const rawPhone = Array.isArray(plan.phoneNumber)
// // //           ? plan.phoneNumber[0]
// // //           : plan.phoneNumber || "";
// // //         const normalizedPhone = rawPhone
// // //           .replace(/[\s-]/g, "")
// // //           .replace(/^(\+91|91|0)/, "")
// // //           .trim();

// // //         const usedCars = await AddModel.countDocuments({
// // //           phoneNumber: new RegExp(normalizedPhone + "$"),
// // //           isDeleted: false,
// // //         });

// // //         const remainingCars = (plan.numOfCars || 0) - usedCars;
// // //         const createdAt = new Date(plan.createdAt);
// // //         const expiryDate = new Date(createdAt);
// // //         expiryDate.setDate(createdAt.getDate() + (plan.durationDays || 0));

// // //         return {
// // //           phone: normalizedPhone,
// // //           planName: plan.name,
// // //           details: {
// // //             planName: plan.name,
// // //             packageType: plan.packageType,
// // //             durationDays: plan.durationDays || 0,
// // //             numOfCars: plan.numOfCars || 0,
// // //             usedCars,
// // //             remainingCars: remainingCars < 0 ? 0 : remainingCars,
// // //             price: plan.price || 0,
// // //             featuredMaxCar: plan.featuredMaxCar || 0,
// // //             featuredAds: plan.featuredAds || 0,
// // //             createdAt: plan.createdAt,
// // //             expiryDate: expiryDate.toISOString().split("T")[0],
// // //           },
// // //         };
// // //       })
// // //     );

// // //     const merged = payments.map((payment) => {
// // //       const normalizedPhone = (payment.phone || "")
// // //         .replace(/[\s-]/g, "")
// // //         .replace(/^(\+91|91|0)/, "")
// // //         .trim();
// // //       const matchedPlan = plansWithUsage.find(
// // //         (p) =>
// // //           p.phone === normalizedPhone &&
// // //           p.planName.toLowerCase() === (payment.planName || "").toLowerCase()
// // //       );

// // //       return {
// // //         ...payment.toObject(),
// // //         planDetails: matchedPlan ? matchedPlan.details : null,
// // //       };
// // //     });

// // //     return res
// // //       .status(200)
// // //       .json({ success: true, total: merged.length, data: merged });
// // //   } catch ( error) {
// // //     console.error(`Error fetching '${status}' payments with plan usage:`, error);
// // //     return res.status(500).json({
// // //       success: false,
// // //       message: `Server error while fetching '${status}' payments with plan usage.`,
// // //       error: error.message,
// // //     });
// // //   }
// // // };

// // // // ---------------- Routes ----------------

// // // // 🔹 Status-based payments
// // // router.get("/payments/pay-now", getAllPaymentsByStatus("pay now"));
// // // router.get("/payments/pay-later", getAllPaymentsByStatus("pay later"));
// // // router.get("/payments/paid", getAllPaymentsByStatus("paid"));
// // // router.get("/payments/pay-failed", getAllPaymentsByStatus("pay failed"));

// // // // 🔹 PayU payment lifecycle
// // // router.post("/payu/payment", payuController.createPayment);
// // // router.post("/payu/payment-later", payuController.savePayLater);

// // // // 🔹 Handle both POST and GET for success/failure
// // // router.post("/payu/success", payuController.handlePaymentSuccess);
// // // router.get("/payu/success", payuController.handlePaymentSuccess);
// // // router.post("/payu/failure", payuController.handlePaymentFailure);
// // // router.get("/payu/failure", payuController.handlePaymentFailure);

// // // // 🔹 Utility APIs
// // // router.get("/payu/payments/success", payuController.getSuccessfulPayments);
// // // router.get("/payu/payments/failure", payuController.getFailedPayments);
// // // router.get("/user-plan-usage/:phone", payuController.getUserPlanUsage);
// // // router.get("/payu/car-usage", payuController.getUsedAndRemainingCars);

// // // // 🔹 Payments with plan usage
// // // router.get("/payments-with-plan/pay-now", getPaymentsWithPlanByStatus("pay now"));
// // // router.get("/payments-with-plan/pay-later", getPaymentsWithPlanByStatus("pay later"));
// // // router.get("/payments-with-plan/paid", getPaymentsWithPlanByStatus("paid"));
// // // router.get("/payments-with-plan/pay-failed", getPaymentsWithPlanByStatus("pay failed"));

// // // // 🔹 Summary API (by day)
// // // router.get("/payments/summary", async (req, res) => {
// // //   try {
// // //     const { day } = req.query;

// // //     let startDate, endDate;
// // //     if (day === "today") {
// // //       startDate = moment().startOf("day").toDate();
// // //       endDate = moment().endOf("day").toDate();
// // //     } else if (day === "yesterday") {
// // //       startDate = moment().subtract(1, "day").startOf("day").toDate();
// // //       endDate = moment().subtract(1, "day").endOf("day").toDate();
// // //     }

// // //     const query = day ? { createdAt: { $gte: startDate, $lte: endDate } } : {};

// // //     const statuses = ["pay now", "pay later", "paid", "pay failed"];
// // //     const summary = {};

// // //     for (const status of statuses) {
// // //       const payments = await PaymentPayU.find({
// // //         payustatususer: status,
// // //         ...query,
// // //       }).sort({ createdAt: -1 });

// // //       summary[status] = {
// // //         count: payments.length,
// // //         data: payments,
// // //       };
// // //     }

// // //     res.status(200).json({
// // //       success: true,
// // //       day: day || "all",
// // //       total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
// // //       summary,
// // //     });
// // //   } catch (error) {
// // //     res.status(500).json({
// // //       success: false,
// // //       message: "Error fetching payment summary.",
// // //       error: error.message,
// // //     });
// // //   }
// // // });

// // // router.get("/payments/summary-data", async (req, res) => {
// // //   try {
// // //     let startDate, endDate;

// // //     if (req.query.dates) {
// // //       const parts = req.query.dates.split(",");
// // //       if (parts.length !== 2) {
// // //         return res.status(400).json({
// // //           success: false,
// // //           message: "Invalid format. Use ?dates=YYYY-MM-DD,YYYY-MM-DD",
// // //         });
// // //       }
// // //       startDate = moment(parts[0], "YYYY-MM-DD").startOf("day").toDate();
// // //       endDate = moment(parts[1], "YYYY-MM-DD").endOf("day").toDate();
// // //     } else if (req.query.day) {
// // //       if (req.query.day === "today") {
// // //         startDate = moment().startOf("day").toDate();
// // //         endDate = moment().endOf("day").toDate();
// // //       } else if (req.query.day === "yesterday") {
// // //         startDate = moment().subtract(1, "day").startOf("day").toDate();
// // //         endDate = moment().subtract(1, "day").endOf("day").toDate();
// // //       } else {
// // //         return res.status(400).json({
// // //           success: false,
// // //           message: "Invalid day. Use 'today', 'yesterday', or dates param.",
// // //         });
// // //       }
// // //     }

// // //     // 🔹 Filter by payUdate instead of createdAt
// // //     const dateFilter =
// // //       startDate && endDate ? { payUdate: { $gte: startDate, $lte: endDate } } : {};

// // //     const statuses = ["pay now", "pay later", "paid", "pay failed"];
// // //     const summary = {};

// // //     for (const status of statuses) {
// // //       const payments = await PaymentPayU.find({
// // //         payustatususer: status,
// // //         ...dateFilter,
// // //       }).sort({ payUdate: -1 }); // sort by payUdate

// // //       summary[status] = {
// // //         count: payments.length,
// // //         data: payments,
// // //       };
// // //     }

// // //     res.status(200).json({
// // //       success: true,
// // //       dateRange: startDate && endDate ? { startDate, endDate } : "all",
// // //       total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
// // //       summary,
// // //     });
// // //   } catch (error) {
// // //     res.status(500).json({
// // //       success: false,
// // //       message: "Error fetching payment summary.",
// // //       error: error.message,
// // //     });
// // //   }
// // // });


// // // // // 🔹 Summary API (date range)
// // // // router.get("/payments/summary-data", async (req, res) => {
// // // //   try {
// // // //     let startDate, endDate;

// // // //     if (req.query.dates) {
// // // //       const parts = req.query.dates.split(",");
// // // //       if (parts.length !== 2) {
// // // //         return res.status(400).json({
// // // //           success: false,
// // // //           message: "Invalid format. Use ?dates=YYYY-MM-DD,YYYY-MM-DD",
// // // //         });
// // // //       }
// // // //       startDate = moment(parts[0], "YYYY-MM-DD").startOf("day").toDate();
// // // //       endDate = moment(parts[1], "YYYY-MM-DD").endOf("day").toDate();
// // // //     } else if (req.query.day) {
// // // //       if (req.query.day === "today") {
// // // //         startDate = moment().startOf("day").toDate();
// // // //         endDate = moment().endOf("day").toDate();
// // // //       } else if (req.query.day === "yesterday") {
// // // //         startDate = moment().subtract(1, "day").startOf("day").toDate();
// // // //         endDate = moment().subtract(1, "day").endOf("day").toDate();
// // // //       } else {
// // // //         return res.status(400).json({
// // // //           success: false,
// // // //           message: "Invalid day. Use 'today', 'yesterday', or dates param.",
// // // //         });
// // // //       }
// // // //     }

// // // //     const dateFilter =
// // // //       startDate && endDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {};

// // // //     const statuses = ["pay now", "pay later", "paid", "pay failed"];
// // // //     const summary = {};

// // // //     for (const status of statuses) {
// // // //       const payments = await PaymentPayU.find({
// // // //         payustatususer: status,
// // // //         ...dateFilter,
// // // //       }).sort({ createdAt: -1 });

// // // //       summary[status] = {
// // // //         count: payments.length,
// // // //         data: payments,
// // // //       };
// // // //     }

// // // //     res.status(200).json({
// // // //       success: true,
// // // //       dateRange: startDate && endDate ? { startDate, endDate } : "all",
// // // //       total: statuses.reduce((sum, s) => sum + summary[s].count, 0),
// // // //       summary,
// // // //     });
// // // //   } catch (error) {
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       message: "Error fetching payment summary.",
// // // //       error: error.message,
// // // //     });
// // // //   }// })
// // // // ✅ Export router
// // // module.exports = router;