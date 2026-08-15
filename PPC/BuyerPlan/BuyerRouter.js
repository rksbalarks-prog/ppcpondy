

// const express = require('express');
// const BuyerPlan = require('../BuyerPlan/BuyerModel');
// const router = express.Router();
// const mongoose = require('mongoose');  // <-- Add this line

// const PaymentPayUBuyer =require('../PayuBuyer/PayuBuyerModel')


// router.post('/select-buyer-plan', async (req, res) => {
//   const { phoneNumber, planId, ba_id } = req.body;

//   // Validate required fields
//   if (!phoneNumber || !planId || !ba_id) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'phoneNumber, planId, and ba_id are required',
//     });
//   }

//   try {
//     // Optional: Validate MongoDB ObjectId format for planId and ba_id
//     if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(ba_id)) {
//       return res.status(400).json({ status: 'error', message: 'Invalid planId or ba_id format' });
//     }

//     // Step 1: Check if buyer plan exists
//     const buyerPlan = await BuyerPlan.findById(planId);
//     if (!buyerPlan) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Buyer plan not found',
//       });
//     }

//     // Step 2: Check for existing payment linked with ba_id
//     const existingPayment = await PaymentPayUBuyer.findOne({ ba_id });

//     if (existingPayment) {
//       if (existingPayment.payustatususer === 'paid') {
//         return res.status(400).json({
//           status: 'error',
//           message: 'Plan already selected and payment completed for this Buyer Assistance ID.',
//         });
//       } else {
//         return res.status(200).json({
//           status: 'pending-payment',
//           message: 'Payment is not completed. Please finish the transaction.',
//           payStatus: existingPayment.payustatususer,
//           paymentDetails: existingPayment,
//         });
//       }
//     }

//     // Step 3: No existing payment → calculate expiry date for plan
//     const now = new Date();
//     const duration = parseInt(buyerPlan.planValidity, 10); // validity in days
//     const expireDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

//     // Optional: Save the plan selection for this buyer assistance here if you want
//     // e.g., create a new payment record or update some collection before payment processing

//     // Step 4: Return success with buyer plan info and calculated expiry
//    return res.status(200).json({
//   status: 'success',
//   message: 'Plan selection is allowed. Proceed to payment.',
//   phoneNumber,    // echo back phoneNumber
//   ba_id,          // echo back ba_id
//   buyerPlan: {
//     _id: buyerPlan._id,
//     planName: buyerPlan.planName,
//     planAmount: buyerPlan.planAmount,
//     planValidity: buyerPlan.planValidity,
//     numberOfAssistants: buyerPlan.numberOfAssistants,
//     serviceType: buyerPlan.serviceType,
//     status: buyerPlan.status,
//     createDate: buyerPlan.createDate,
//     updateDate: now.toISOString(),
//     expireDate: expireDate.toISOString(),
//   }
// });


//   } catch (error) {
//     console.error('Error in /select-buyer-plan:', error);
//     return res.status(500).json({
//       status: 'error',
//       message: 'Internal server error',
//       error: error.message,
//     });
//   }
// });


// // router.post('/select-buyer-plan', async (req, res) => {
// //   const { phoneNumber, planId, ba_id } = req.body;

// //   if (!phoneNumber || !planId || !ba_id) {
// //     return res.status(400).json({
// //       status: 'error',
// //       message: 'phoneNumber, planId, and ba_id are required',
// //     });
// //   }

// //   try {
// //     // Step 1: Check if the plan exists
// //     const buyerPlan = await BuyerPlan.findById(planId);
// //     if (!buyerPlan) {
// //       return res.status(404).json({
// //         status: 'error',
// //         message: 'Buyer plan not found',
// //       });
// //     }

// //     // Step 2: Check for existing payment for this buyer assistance
// //     const existingPayment = await PaymentPayUBuyer.findOne({ ba_id });

// //     if (existingPayment) {
// //       const status = existingPayment.payustatususer;

// //       if (status === 'paid') {
// //         return res.status(400).json({
// //           status: 'error',
// //           message: 'Plan already selected and payment completed for this Buyer Assistance ID.',
// //         });
// //       } else {
// //         return res.status(200).json({
// //           status: 'pending-payment',
// //           message: 'Payment is not completed. Please finish the transaction.',
// //           payStatus: status,
// //           paymentDetails: existingPayment,
// //         });
// //       }
// //     }

// //     // Step 3: No existing record → prepare plan details with selection & expiry
// //     const now = new Date(); // selection time
// //     const duration = parseInt(buyerPlan.planValidity); // planValidity in days
// //     const expireDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000); // add validity days

// //     return res.status(200).json({
// //       status: 'success',
// //       message: 'Plan selection is allowed. Proceed to payment.',
// //       buyerPlan: {
// //         ...buyerPlan._doc,
// //         updateDate: now,
// //         expireDate: expireDate
// //       }
// //     });

// //   } catch (error) {
// //     console.error(error);
// //     return res.status(500).json({
// //       status: 'error',
// //       message: 'Internal server error',
// //       error: error.message,
// //     });
// //   }
// // });


// router.get('/selected-buyer-plan-by-phone', async (req, res) => {
//   const { phoneNumber } = req.query;

//   if (!phoneNumber) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'phoneNumber is required',
//     });
//   }

//   try {
//     const selectedPlans = await PaymentPayUBuyer.find({ phone: phoneNumber }).sort({ createdAt: -1 });

//     if (selectedPlans.length === 0) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'No plans found for this phone number',
//       });
//     }

//     res.status(200).json({
//       status: 'success',
//       total: selectedPlans.length,
//       selectedPlans,
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Internal server error',
//       error: error.message,
//     });
//   }
// });


// // Create a new plan
// router.post('/buyer-plan-create', async (req, res) => {
//   try {
//     const plan = new BuyerPlan(req.body);
//     await plan.save();
//     res.status(201).send(plan);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // Get all plans
// router.get('/buyer-plans-all', async (req, res) => {
//   try {
//     const plans = await BuyerPlan.find();
//     res.status(200).send(plans);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// // Update a plan
// router.put('/buyer-update-plans/:id', async (req, res) => {
//   try {
//     const plan = await BuyerPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
//     if (!plan) {
//       return res.status(404).send();
//     }
//     res.send(plan);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // Delete a plan
// router.delete('/buyer-plans/:id', async (req, res) => {
//   try {
//     const plan = await BuyerPlan.findByIdAndDelete(req.params.id);
//     if (!plan) {
//       return res.status(404).send();
//     }
//     res.send(plan);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// // Toggle plan status
// router.put('/buyer-plans/:id/status', async (req, res) => {
//   try {
//     const plan = await BuyerPlan.findById(req.params.id);
//     if (!plan) {
//       return res.status(404).send();
//     }
//     plan.status = plan.status === 'active' ? 'hide' : 'active';
//     await plan.save();
//     res.send(plan);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });


// // Get only active buyer plans
// router.get('/buyer-plans-active', async (req, res) => {
//   try {
//     const activePlans = await BuyerPlan.find({ status: 'active' }).sort({ createDate: -1 });
//     res.status(200).json({
//       status: 'success',
//       total: activePlans.length,
//       plans: activePlans,
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: 'Failed to fetch active plans',
//       error: error.message,
//     });
//   }
// });


// module.exports = router;
























const express = require('express');
const BuyerPlan = require('../BuyerPlan/BuyerModel');
const router = express.Router();
const mongoose = require('mongoose');  // <-- Add this line

const PaymentPayUBuyer =require('../PayuBuyer/PayuBuyerModel')
const moment = require('moment');


router.get('/payustatus-by-buyer', async (req, res) => {
  try {
    // Step 1: Get all payments sorted by latest
    const payments = await PaymentPayUBuyer.find().sort({ createdAt: -1 });

    // Step 2: Create a map of latest payustatususer by ppcId
    const latestStatusByPpcId = {};
    for (let payment of payments) {
      if (!latestStatusByPpcId[payment.ppcId]) {
        latestStatusByPpcId[payment.ppcId] = payment.payustatususer.toLowerCase();
      }
    }

    // Step 3: Find all buyer plans
    const allPlans = await BuyerPlan.find();

    // Step 4: Map ppcId to ba_id using phoneNumbers array
    const result = [];

    for (let plan of allPlans) {
      for (let phone of plan.phoneNumbers) {
        const ppcId = parseInt(phone.ba_id); // assuming ba_id matches ppcId
        if (latestStatusByPpcId[ppcId]) {
          result.push({
            ba_id: ppcId,
            status: latestStatusByPpcId[ppcId]
          });
        }
      }
    }

    // Remove duplicates (in case multiple entries with same ba_id)
    const uniqueByBaId = {};
    for (let item of result) {
      if (!uniqueByBaId[item.ba_id]) {
        uniqueByBaId[item.ba_id] = item.status;
      }
    }

    const finalResult = Object.entries(uniqueByBaId).map(([ba_id, status]) => ({
      ba_id: parseInt(ba_id),
      status
    }));

    res.json(finalResult);
  } catch (error) {
    console.error('Error fetching PayU statuses by ba_id:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/plans-buyer', async (req, res) => {
    try {
        const plans = await BuyerPlan.find(); // Fetch all plans

        // // Filter unique plans based on 'name'
        // const uniquePlans = [];
        // const seenNames = new Set();

        // plans.forEach(plan => {
        //     if (!seenNames.has(plan.name)) {
        //         seenNames.add(plan.name);
        //         uniquePlans.push(plan);
        //     }
        // });
const uniquePlans = [];
const seenNames = new Set();

plans.forEach(plan => {
  if (!seenNames.has(plan.planName)) {
    seenNames.add(plan.planName);
    uniquePlans.push({
      planName: plan.planName,
      planAmount: plan.planAmount,
      planValidity: plan.planValidity,
      serviceType: plan.serviceType
    });
  }
});

        return res.status(200).json(uniquePlans);
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving plans.', error: error.message });
    }
});



// router.get('/get-buyer-plan-by-phone-buyer', async (req, res) => {
//   const { phoneNumber } = req.query;

//   if (!phoneNumber) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'phoneNumber query parameter is required',
//     });
//   }

//   try {
//     // Find BuyerPlans containing this phone number in phoneNumbers array
//     const plans = await BuyerPlan.find({
//       'phoneNumbers.number': phoneNumber,
//     });

//     if (!plans.length) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'No buyer plans found for this phone number',
//       });
//     }

//     // For each plan, gather payment status for the ba_ids linked to this phone number
//     const plansWithPayments = await Promise.all(
//       plans.map(async (plan) => {
//         // Filter phoneNumbers matching phoneNumber to get all ba_ids for this phone
//         const baIdsForPhone = plan.phoneNumbers
//           .filter((entry) => entry.number === phoneNumber)
//           .map((entry) => entry.ba_id);

//         // For each ba_id, get latest payment
//         const payments = await Promise.all(
//           baIdsForPhone.map(async (ba_id) => {
//             return await PaymentPayUBuyer.findOne({ ba_id }).sort({ createdAt: -1 }).lean();
//           })
//         );

//         return {
//           plan,
//           payments,
//         };
//       })
//     );

//     return res.status(200).json({
//       status: 'success',
//       phoneNumber,
//       data: plansWithPayments,
//     });
//   } catch (error) {
//     console.error('Error in /get-buyer-plan-by-phone:', error);
//     return res.status(500).json({
//       status: 'error',
//       message: 'Internal server error',
//       error: error.message,
//     });
//   }
// });


// ****************

// router.get('/get-buyer-plan-by-phone-buyer', async (req, res) => {
//   const { phoneNumber } = req.query;

//   if (!phoneNumber) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'phoneNumber query parameter is required',
//     });
//   }

//   try {
//     const plans = await BuyerPlan.find({
//       'phoneNumbers.number': phoneNumber,
//     });

//     if (!plans.length) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'No buyer plans found for this phone number',
//       });
//     }

//     const now = new Date();
//     const result = [];

//     for (const plan of plans) {
//       for (const entry of plan.phoneNumbers) {
//         if (entry.number !== phoneNumber) continue;

//         const ba_id = entry.ba_id;

//         // Get latest payment for this ba_id
//         const payment = await PaymentPayUBuyer.findOne({ ba_id })
//           .sort({ createdAt: -1 })
//           .lean();

//         let paymentData = payment ? { ...payment } : null;

//         // Only attach expireDate and expiryMessage if status is paid
//         if (paymentData && paymentData.payustatususer === 'paid') {
//           const expireDate = entry.expireDate
//             ? new Date(entry.expireDate)
//             : plan.expireDate
//               ? new Date(plan.expireDate)
//               : null;

//           if (expireDate) {
//             const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
//             let expiryMessage = '';

//             if (diffDays > 0 && diffDays <= 5) {
//               expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
//             } else if (diffDays <= 0) {
//               expiryMessage = 'Expired';
//             }

//             paymentData.expireDate = expireDate.toISOString();
//             paymentData.expiryMessage = expiryMessage;
//           }
//         }

//         // Remove unwanted fields from outside
//         const {
//           expireDate: _ed,
//           expiryMessage: _em,
//           createdAt: _ca,
//           ...cleanEntry
//         } = entry.toObject?.() || entry;

//         result.push({
//           ...cleanEntry,
//           paymentData,
//         });
//       }
//     }

//     return res.status(200).json({
//       status: 'success',
//       phoneNumber,
//       data: result,
//     });
//   } catch (error) {
//     console.error('Error in /get-buyer-plan-by-phone-buyer:', error);
//     return res.status(500).json({
//       status: 'error',
//       message: 'Internal server error',
//       error: error.message,
//     });
//   }
// });

// ***********




router.get('/get-buyer-plan-by-phone-buyer/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;

  if (!phoneNumber) {
    return res.status(400).json({
      status: 'error',
      message: 'phoneNumber param is required',
    });
  }

  try {
    const plans = await BuyerPlan.find({ 'phoneNumbers.number': phoneNumber });

    if (!plans.length) {
      return res.status(404).json({
        status: 'error',
        message: 'No buyer plans found for this phone number',
      });
    }

    const now = new Date();
    const result = [];

    for (const plan of plans) {
      for (const entry of plan.phoneNumbers) {
        if (entry.number !== phoneNumber) continue;

        const ba_id = entry.ba_id;

        // Get latest payment for ba_id
        const payment = await PaymentPayUBuyer.findOne({ ba_id })
          .sort({ createdAt: -1 })
          .lean();

        if (!payment) continue;

        // Calculate expiry details
        let expireDate = null;
        let expiryMessage = '';
        let diffDays = null;

        if (payment.payUdate) {
          expireDate = new Date(
            new Date(payment.payUdate).getTime() + 90 * 24 * 60 * 60 * 1000
          );

          diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
          expiryMessage = diffDays <= 0
            ? 'Expired'
            : `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;

          // Add to paymentData
          payment.expireDate = expireDate.toISOString();
          payment.expiryMessage = expiryMessage;
        }

        // Add entry to result
        result.push({
          ba_id,
          phoneNumber: entry.number,
          ba_status: entry.ba_status,
          planInfo: {
            planId: plan._id,
            planName: plan.planName,
            planAmount: plan.planAmount,
            planValidity: plan.planValidity,
            numberOfAssistants: plan.numberOfAssistants,
            serviceType: plan.serviceType,
            status: plan.status,
            createDate: plan.createDate,
            expireDate: plan.expireDate?.toISOString() || null,
          },
          paymentData: payment,
        });
      }
    }

    return res.status(200).json({
      status: 'success',
      phoneNumber,
      total: result.length,
      data: result,
    });

  } catch (error) {
    console.error('Error in /get-buyer-plan-by-phone-buyer:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
});


router.post('/pay-now/:ba_id', async (req, res) => {
  const { ba_id } = req.params;

  try {
    // 1️⃣ Find the plan containing this ba_id
    const plan = await PricingPlans.findOne({ 'phoneNumbers.ba_id': ba_id });
    if (!plan) {
      return res.status(404).json({ status: "error", message: "Plan not found" });
    }

    // 2️⃣ Find the phoneNumber entry
    const phoneNumberEntry = plan.phoneNumbers.find(pn => pn.ba_id == ba_id);
    if (!phoneNumberEntry) {
      return res.status(404).json({ status: "error", message: "ba_id not found in plan" });
    }

    // 3️⃣ Update or create payment record
    let payment = await PaymentPayUBuyer.findOne({ ba_id });

    const today = new Date(); 
    const expireDate = new Date(today);
    expireDate.setDate(today.getDate() + plan.durationDays); // plan validity

    if (!payment) {
      // create new payment
      payment = await PaymentPayUBuyer.create({
        txnid: `txn_${Date.now()}`,
        status: "success",
        amount: plan.planAmount,
        productinfo: "Subscription Plan",
        firstname: "Buyer",
        email: "buyer@example.com",
        phone: phoneNumberEntry.number,
        payUdate: today,
        payustatususer: "paid",
        planName: plan.planName,
        ba_id: ba_id,
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

    // 4️⃣ Update AddModel status to active if expired
    const addModelEntry = await AddModel.findOne({ ba_id });
    if (addModelEntry && addModelEntry.status === "expired") {
      addModelEntry.status = "active";
      await addModelEntry.save();
    }

    // 5️⃣ Return formatted response
    return res.status(200).json({
      status: "success",
      message: "Payment marked as paid",
      data: {
        _id: payment._id,
        txnid: payment.txnid,
        status: payment.status,
        amount: payment.amount,
        productinfo: payment.productinfo,
        firstname: payment.firstname,
        email: payment.email,
        phone: payment.phone,
        payUdate: payment.payUdate,
        payustatususer: payment.payustatususer,
        planName: payment.planName,
        ba_id: payment.ba_id,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        expireDate: payment.expireDate,
        mihpayid: payment.mihpayid || null
      }
    });

  } catch (error) {
    console.error("Error in /pay-now:", error);
    return res.status(500).json({ status: "error", message: "Error updating payment", error: error.message });
  }
});




// router.get('/get-buyer-plan-by-phone-buyer/:phoneNumber', async (req, res) => {
//   const { phoneNumber } = req.params;

//   if (!phoneNumber) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'phoneNumber param is required',
//     });
//   }

//   try {
//     const plans = await BuyerPlan.find({ 'phoneNumbers.number': phoneNumber });

//     if (!plans.length) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'No buyer plans found for this phone number',
//       });
//     }

//     const now = new Date();
//     const result = [];

//     for (const plan of plans) {
//       for (const entry of plan.phoneNumbers) {
//         if (entry.number !== phoneNumber) continue;

//         const ba_id = entry.ba_id;

//         // Get latest payment
//         const payment = await PaymentPayUBuyer.findOne({ ba_id }).sort({ createdAt: -1 }).lean();

//         if (!payment) continue;

//         // ✅ Calculate expireDate from payUdate + 90 days
//         let expireDate = null;
//         let expiryMessage = '';
//         let diffDays = null;

//         if (payment.payUdate) {
//           expireDate = new Date(new Date(payment.payUdate).getTime() + 90 * 24 * 60 * 60 * 1000);

//           diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
//           if (diffDays <= 0) {
//             expiryMessage = 'Expired';
//           } else {
//             expiryMessage = `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
//           }

//           // Attach to paymentData
//           payment.expireDate = expireDate.toISOString();
//           payment.expiryMessage = expiryMessage;
//         }

//         result.push({
//           ba_id,
//           phoneNumber: entry.number,
//           ba_status: entry.ba_status,
//           paymentData: payment,
//         });
//       }
//     }

//     return res.status(200).json({
//       status: 'success',
//       phoneNumber,
//       total: result.length,
//       data: result,
//     });
//   } catch (error) {
//     console.error('Error in /get-buyer-plan-by-phone-buyer:', error);
//     return res.status(500).json({
//       status: 'error',
//       message: 'Internal server error',
//       error: error.message,
//     });
//   }
// });




router.post('/select-buyer-plan', async (req, res) => {
  const { phoneNumber, planId, ba_id } = req.body;

  // Validate inputs
  if (!phoneNumber || !planId || !ba_id) {
    return res.status(400).json({
      status: 'error',
      message: 'phoneNumber, planId, and ba_id are required',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(planId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid planId format',
    });
  }

  try {
    // Find the BuyerPlan
    const buyerPlan = await BuyerPlan.findById(planId);
    if (!buyerPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Buyer plan not found',
      });
    }

    // Initialize phoneNumbers array if undefined
    if (!Array.isArray(buyerPlan.phoneNumbers)) {
      buyerPlan.phoneNumbers = [];
    }

    // Check if phoneNumber + ba_id already exists in phoneNumbers
    const existingEntry = buyerPlan.phoneNumbers.find(
      (entry) => entry.number === phoneNumber && entry.ba_id === ba_id
    );

    if (existingEntry) {
      // Check latest payment status for this ba_id
      const latestPayment = await PaymentPayUBuyer.findOne({ ba_id }).sort({ createdAt: -1 });
      const payStatus = latestPayment?.payustatususer;

      if (payStatus === 'paid') {
        return res.status(400).json({
          status: 'error',
          message: 'This phone number is already associated with this Buyer Assistance ID and payment is completed.',
        });
      } else if (
        payStatus === 'expiredPlan' ||
        payStatus === 'pay later' ||
        payStatus === 'pay failed' ||
        payStatus === 'pay now'
      ) {
        return res.status(200).json({
          status: 'pending-payment',
          message: 'Previous plan expired or payment pending. Please complete the payment.',
          selectedPlan: buyerPlan,
        });
      }
    } else {
      // Add new phoneNumber + ba_id to BuyerPlan
      buyerPlan.phoneNumbers.push({ number: phoneNumber, ba_id });

      // Update createdAt and expireDate
      buyerPlan.createdAt = new Date();
      buyerPlan.expireDate = moment(buyerPlan.createdAt)
        .add(parseInt(buyerPlan.planValidity, 10), 'days')
        .toDate();

      await buyerPlan.save();
    }

    // Create unique txnid
    const txnid = `Txn_${Date.now()}`;

    // Create new payment record
    const newPayment = new PaymentPayUBuyer({
      txnid,
      status: 'initiated',
      amount: buyerPlan.planAmount,
      productinfo: buyerPlan.serviceType || '',
      firstname: '',
      email: '',
      phone: phoneNumber,
      mihpayid: '',
      payUdate: '',
      payustatususer: 'pay now',
      planName: buyerPlan.planName,
      ba_id: parseInt(ba_id, 10),
    });

    await newPayment.save();

    return res.status(200).json({
      status: 'success',
      message: 'Plan selected successfully. Proceed to payment.',
      phoneNumber,
      ba_id,
      txnid,
      buyerPlan: {
        _id: buyerPlan._id,
        planName: buyerPlan.planName,
        planAmount: buyerPlan.planAmount,
        planValidity: buyerPlan.planValidity,
        numberOfAssistants: buyerPlan.numberOfAssistants,
        serviceType: buyerPlan.serviceType,
        status: buyerPlan.status,
        createDate: buyerPlan.createDate,
        updateDate: buyerPlan.createdAt.toISOString(),
        expireDate: buyerPlan.expireDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in /select-buyer-plan:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
});



// router.post('/select-buyer-plan', async (req, res) => {
//   const { phoneNumber, planId, ba_id } = req.body;

//   // Validate required fields
//   if (!phoneNumber || !planId || !ba_id) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'phoneNumber, planId, and ba_id are required',
//     });
//   }

//   try {
//     // Optional: Validate MongoDB ObjectId format for planId and ba_id
//     if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(ba_id)) {
//       return res.status(400).json({ status: 'error', message: 'Invalid planId or ba_id format' });
//     }

//     // Step 1: Check if buyer plan exists
//     const buyerPlan = await BuyerPlan.findById(planId);
//     if (!buyerPlan) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Buyer plan not found',
//       });
//     }

//     // Step 2: Check for existing payment linked with ba_id
//     const existingPayment = await PaymentPayUBuyer.findOne({ ba_id });

//     if (existingPayment) {
//       if (existingPayment.payustatususer === 'paid') {
//         return res.status(400).json({
//           status: 'error',
//           message: 'Plan already selected and payment completed for this Buyer Assistance ID.',
//         });
//       } else {
//         return res.status(200).json({
//           status: 'pending-payment',
//           message: 'Payment is not completed. Please finish the transaction.',
//           payStatus: existingPayment.payustatususer,
//           paymentDetails: existingPayment,
//         });
//       }
//     }

//     // Step 3: No existing payment → calculate expiry date for plan
//     const now = new Date();
//     const duration = parseInt(buyerPlan.planValidity, 10); // validity in days
//     const expireDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);


// // Step 4: Save payment record (or plan selection) in DB
// const newPayment = new PaymentPayUBuyer({
//   phoneNumber,
//   ba_id,
//   planId: buyerPlan._id,
//   planName: buyerPlan.planName,
//   planAmount: buyerPlan.planAmount,
//   planValidity: buyerPlan.planValidity,
//   numberOfAssistants: buyerPlan.numberOfAssistants,
//   serviceType: buyerPlan.serviceType,
//   payustatususer: 'pay now', // or whatever initial status you use
//   createDate: now,
//   updateDate: now,
//   expireDate: expireDate,
// });

// await newPayment.save();

// // Step 5: Return response
// return res.status(200).json({
//   status: 'success',
//   message: 'Plan selection is allowed. Proceed to payment.',
//   phoneNumber,    // echo back phoneNumber
//   ba_id,          // echo back ba_id
//   buyerPlan: {
//     _id: buyerPlan._id,
//     planName: buyerPlan.planName,
//     planAmount: buyerPlan.planAmount,
//     planValidity: buyerPlan.planValidity,
//     numberOfAssistants: buyerPlan.numberOfAssistants,
//     serviceType: buyerPlan.serviceType,
//     status: buyerPlan.status,
//     createDate: buyerPlan.createDate,
//     updateDate: now.toISOString(),
//     expireDate: expireDate.toISOString(),
//   }
// });


//   } catch (error) {
//     console.error('Error in /select-buyer-plan:', error);
//     return res.status(500).json({
//       status: 'error',
//       message: 'Internal server error',
//       error: error.message,
//     });
//   }
// });



// router.post('/select-buyer-plan', async (req, res) => {
//   const { phoneNumber, planId, ba_id } = req.body;

//   if (!phoneNumber || !planId || !ba_id) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'phoneNumber, planId, and ba_id are required',
//     });
//   }

//   try {
//     // Step 1: Check if the plan exists
//     const buyerPlan = await BuyerPlan.findById(planId);
//     if (!buyerPlan) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Buyer plan not found',
//       });
//     }

//     // Step 2: Check for existing payment for this buyer assistance
//     const existingPayment = await PaymentPayUBuyer.findOne({ ba_id });

//     if (existingPayment) {
//       const status = existingPayment.payustatususer;

//       if (status === 'paid') {
//         return res.status(400).json({
//           status: 'error',
//           message: 'Plan already selected and payment completed for this Buyer Assistance ID.',
//         });
//       } else {
//         return res.status(200).json({
//           status: 'pending-payment',
//           message: 'Payment is not completed. Please finish the transaction.',
//           payStatus: status,
//           paymentDetails: existingPayment,
//         });
//       }
//     }

//     // Step 3: No existing record → prepare plan details with selection & expiry
//     const now = new Date(); // selection time
//     const duration = parseInt(buyerPlan.planValidity); // planValidity in days
//     const expireDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000); // add validity days

//     return res.status(200).json({
//       status: 'success',
//       message: 'Plan selection is allowed. Proceed to payment.',
//       buyerPlan: {
//         ...buyerPlan._doc,
//         updateDate: now,
//         expireDate: expireDate
//       }
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: 'error',
//       message: 'Internal server error',
//       error: error.message,
//     });
//   }
// });


router.get('/selected-buyer-plan-by-phone', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({
      status: 'error',
      message: 'phoneNumber is required',
    });
  }

  try {
    const selectedPlans = await PaymentPayUBuyer.find({ phone: phoneNumber }).sort({ createdAt: -1 });

    if (selectedPlans.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No plans found for this phone number',
      });
    }

    res.status(200).json({
      status: 'success',
      total: selectedPlans.length,
      selectedPlans,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
});


// Create a new plan
router.post('/buyer-plan-create', async (req, res) => {
  try {
    const plan = new BuyerPlan(req.body);
    await plan.save();
    res.status(201).send(plan);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all plans
router.get('/buyer-plans-all', async (req, res) => {
  try {
    const plans = await BuyerPlan.find();
    res.status(200).send(plans);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a plan
router.put('/buyer-update-plans/:id', async (req, res) => {
  try {
    const plan = await BuyerPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) {
      return res.status(404).send();
    }
    res.send(plan);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a plan
router.delete('/buyer-plans/:id', async (req, res) => {
  try {
    const plan = await BuyerPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).send();
    }
    res.send(plan);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Toggle plan status
router.put('/buyer-plans/:id/status', async (req, res) => {
  try {
    const plan = await BuyerPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).send();
    }
    plan.status = plan.status === 'active' ? 'hide' : 'active';
    await plan.save();
    res.send(plan);
  } catch (error) {
    res.status(400).send(error);
  }
});

// GET all buyer plan payments for a given phoneNumber
router.get('/buyer-plans-by-phone', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({
      status: 'error',
      message: 'phoneNumber is required',
    });
  }

  try {
    // Find all payment records for this phoneNumber
    const payments = await PaymentPayUBuyer.find({ phoneNumber });

    if (payments.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No buyer plans found for this phone number',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Found ${payments.length} buyer plan(s) for this phone number`,
      payments,
    });
  } catch (error) {
    console.error('Error in /buyer-plans-by-phone:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
});



// // Get only active buyer plans
// router.get('/buyer-plans-active', async (req, res) => {
//   try {
//     const activePlans = await BuyerPlan.find({ status: 'active' }).sort({ createDate: -1 });
//     res.status(200).json({
//       status: 'success',
//       total: activePlans.length,
//       plans: activePlans,
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: 'Failed to fetch active plans',
//       error: error.message,
//     });
//   }
// });


// Get only active buyer plans excluding 'FREE'
router.get('/buyer-plans-active', async (req, res) => {
  try {
    const activePlans = await BuyerPlan.find({
      status: 'active',
      planName: { $ne: 'FREE' } // 👈 Exclude FREE plan
    }).sort({ createDate: -1 });

    res.status(200).json({
      status: 'success',
      total: activePlans.length,
      plans: activePlans,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch active plans',
      error: error.message,
    });
  }
});



module.exports = router;
