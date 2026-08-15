






// controllers/payu.controller.js
const crypto = require('crypto');
const PaymentPayU = require('../PayU/PayUModel');
const PricingPlans = require('../plans/PricingPlanModel');
const AddModel = require('../AddModel');

const MERCHANT_KEY = 'Qmgxku';
const SALT = 'WUEzPab2A977ygBtkE6dSzsB65ebLsOc';

// ✅ Create or update payment (pay now)
exports.createPayment = async (req, res) => {
  const { txnid, amount, productinfo, firstname, email, phone, payustatususer, planName, ppcId } = req.body;

  if (payustatususer !== 'pay now') {
    return res.status(400).json({ error: 'Invalid payment status for this endpoint.' });
  }

  const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');

  const paymentData = {
    txnid, status: 'process', amount, productinfo, firstname,
    email, phone, payustatususer, planName, payUdate: new Date().toISOString(), ppcId,
  };

  await PaymentPayU.findOneAndUpdate(
    { ppcId },
    paymentData,
    { upsert: true, new: true }
  );

  return res.json({
    key: MERCHANT_KEY,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone,
    // surl: 'http://localhost:5000/PPC/payu/success', 
    // furl: 'http://localhost:5000/PPC/payu/failure',
    surl: 'https://ppcpondy.com/PPC/PPC/payu/success',
    furl: 'https://ppcpondy.com/PPC/PPC/payu/failure',
    service_provider: 'payu_paisa',
    hash
  });
};

// ✅ Pay Later
exports.savePayLater = async (req, res) => {
  const { txnid, amount, productinfo, firstname, email, phone, payustatususer, planName, ppcId } = req.body;

  if (payustatususer !== 'pay later') {
    return res.status(400).json({ error: 'Invalid pay status for pay later.' });
  }

  await PaymentPayU.findOneAndUpdate(
    { ppcId },
    {
      txnid, status: 'pending', amount, productinfo, firstname,
      email, phone, payustatususer, planName, payUdate: new Date().toISOString(), ppcId,
    },
    { upsert: true, new: true }
  );

  return res.json({ message: 'Pay later request saved successfully.' });
};

// ✅ PayU Success
// exports.handlePaymentSuccess = async (req, res) => {
//   let { txnid, status, amount, productinfo, firstname, email, phone, mihpayid, date, planName, ppcId } = req.body;

//   const payUdate = date || new Date().toISOString();

//   try {
//     const parsed = JSON.parse(planName);
//     planName = parsed.planName || planName;
//   } catch (e) {}

//   await PaymentPayU.findOneAndUpdate(
//     { ppcId },
//     {
//       status: 'success',
//       mihpayid,
//       payUdate,
//       payustatususer: 'paid',
//       planName,
//     },
//     { new: true }
//   );

//   const encodedDate = encodeURIComponent(payUdate);
//   res.redirect(`http://localhost:3000/payment-success?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`);
// };



// ✅ PayU Success
// exports.handlePaymentSuccess = async (req, res) => {
//   const {
//     txnid,
//     amount,
//     productinfo,
//     firstname,
//     email,
//     phone,
//     mihpayid,
//     planName,
//     ppcId
//   } = req.body;

//   const payUdate = new Date();

//   try {
//     if (!ppcId || !txnid || !mihpayid) {
//       return res.status(400).json({ message: 'Missing payment details.' });
//     }

//     // ✅ Step 1: Mark ALL existing records for this ppcId as paid
//     await PaymentPayU.updateMany(
//       { ppcId },
//       {
//         $set: {
//           status: 'success',
//           mihpayid,
//           payUdate,
//           payustatususer: 'paid',
//           planName
//         }
//       }
//     );

//     // ✅ Step 2: Also ensure AddModel is activated
//     await AddModel.updateOne({ ppcId }, { status: 'active' });

//     // ✅ Step 3: Get the latest updated payment to send back
//     const updatedPayment = await PaymentPayU.findOne({ ppcId }).sort({ updatedAt: -1 });

//     // ✅ Step 4: Redirect
//     const encodedDate = encodeURIComponent(payUdate.toISOString());
//     return res.redirect(
//       `https://ppcpondy.com/payment-success?txnid=${txnid}&firstname=${firstname}&status=success&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
//         //  `http://localhost:3000/payment-success?txnid=${txnid}&firstname=${firstname}&status=success&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`

//     );

//   } catch (err) {
//     console.error('Payment Success Error:', err);
//     return res.status(500).json({ message: 'Payment success processing failed.' });
//   }
// };

exports.handlePaymentSuccess = async (req, res) => {
  try {
    // PayU sends data as form-urlencoded, not JSON
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      mihpayid,
      planName,
      ppcId
    } = req.body;

    // Debug log to see what PayU is actually sending
    console.log('PayU Success Callback Data:', req.body);

    // Check for minimal required fields
    if (!txnid || !mihpayid) {
      console.error('Missing required payment details from PayU:', req.body);
      return res.status(400).json({ message: 'Missing payment details.' });
    }

    // Try to find payment by txnid first, then by ppcId
    let payment = await PaymentPayU.findOne({ txnid });
    if (!payment && ppcId) {
      payment = await PaymentPayU.findOne({ ppcId });
    }

    if (!payment) {
      console.error('Payment not found for txnid:', txnid, 'or ppcId:', ppcId);
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    // Update payment status
    const updatedPayment = await PaymentPayU.findOneAndUpdate(
      { _id: payment._id },
      {
        status: 'success',
        mihpayid,
        payUdate: new Date(),
        payustatususer: 'paid',
        planName: planName || payment.planName
      },
      { new: true }
    );

    // Update AddModel status if it exists
    if (payment.ppcId) {
      await AddModel.updateOne(
        { ppcId: payment.ppcId },
        { status: 'active' }
      );
    }

    // Redirect to success page
    const encodedDate = encodeURIComponent(new Date().toISOString());
    const redirectUrl = `https://ppcpondy.com/payment-success?txnid=${txnid}&firstname=${firstname || payment.firstname}&status=success&amount=${amount || payment.amount}&email=${email || payment.email}&phone=${phone || payment.phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName || payment.planName}`;
    
    console.log('Redirecting to:', redirectUrl);
    return res.redirect(redirectUrl);

  } catch (err) {
    console.error('Payment Success Processing Error:', err);
    return res.status(500).json({ 
      message: 'Payment success processing failed.',
      error: err.message 
    });
  }
};


// exports.handlePaymentSuccess = async (req, res) => {
//   const {
//     txnid,
//     amount,
//     productinfo,
//     firstname,
//     email,
//     phone,
//     mihpayid,
//     planName,
//     ppcId
//   } = req.body;

//   const payUdate = new Date().toISOString();

//   try {
//     // Ensure all values exist
//     if (!ppcId || !txnid || !mihpayid) {
//       return res.status(400).json({ message: 'Missing payment details.' });
//     }

//     // Update payment status
//     const updatedPayment = await PaymentPayU.findOneAndUpdate(
//       { ppcId },
//       {
//         status: 'success',
//         mihpayid,
//         payUdate,
//         payustatususer: 'paid',
//         planName
//       },
//       { new: true }
//     );

//     // ✅ Also update AddModel status if it was expired
//     await AddModel.updateOne(
//       { ppcId },
//       { status: 'active' }
//     );

//     // Redirect to success page
//     const encodedDate = encodeURIComponent(payUdate);
//     return res.redirect(`https://ppcpondy.com/payment-success?txnid=${txnid}&firstname=${firstname}&status=success&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`);
//   } catch (err) {
//     console.error('Payment Success Error:', err);
//     return res.status(500).json({ message: 'Payment success processing failed.' });
//   }
// };




// ✅ PayU Failure
exports.handlePaymentFailure = async (req, res) => {
  const { txnid, status, amount, firstname, email, phone, mihpayid, date, planName, ppcId } = req.body;

  const payUdate = date || new Date().toISOString();

  await PaymentPayU.findOneAndUpdate(
    { ppcId },
    {
      status: 'failure',
      mihpayid,
      payUdate,
      payustatususer: 'pay failed',
      planName,
    },
    { new: true }
  );

  const encodedDate = encodeURIComponent(payUdate);
  res.redirect(`https://ppcpondy.com/payment-failure?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`);
};

// ✅ Utility APIs
exports.getSuccessfulPayments = async (req, res) => {
  const payments = await PaymentPayU.find({ status: 'success' }).sort({ createdAt: -1 });
  res.json(payments);
};

exports.getFailedPayments = async (req, res) => {
  const payments = await PaymentPayU.find({ status: 'failure' }).sort({ createdAt: -1 });
  res.json(payments);
};




exports.getUserPlanUsage = async (req, res) => {
  const { phone } = req.params;

  try {
    // 1. Get the latest successful payment for this user
    const payment = await PaymentPayU.findOne({
      phone,
      payustatususer: 'paid',
      status: 'success'
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({ message: 'No active paid plan found for this user.' });
    }

    const plan = await PricingPlans.findOne({ name: payment.planName });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found.' });
    }

    // 2. Get all active/completed properties for this user
    const properties = await AddModel.find({
      phoneNumber: phone,
      status: { $in: ['active', 'complete'] }
    });

    const usedCars = properties.length;
    const totalCars = plan.numOfCars || 0;
    const remainingCars = Math.max(totalCars - usedCars, 0);

    const ppcIds = properties.map(p => p.ppcId);

    res.json({
      phone,
      planName: plan.name,
      totalCars,
      usedCars,
      remainingCars,
      postedPpcIds: ppcIds
    });

  } catch (error) {
    console.error('Error in getUserPlanUsage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



exports.getUsedAndRemainingCars = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Find the latest successful payment for this user
    const latestPayment = await PaymentPayU.findOne({ phone, status: 'success', payustatususer: 'paid' })
      .sort({ createdAt: -1 });

    if (!latestPayment) {
      return res.status(404).json({ message: 'No successful payment found for this user' });
    }

    // Get plan details by planName
    const plan = await PricingPlans.findOne({ name: latestPayment.planName });

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found for this user' });
    }

    // Count how many properties this user has posted
    const usedCars = await AddProperty.countDocuments({ phoneNumber: phone });

    const numOfCars = plan.numOfCars || 0;
    const remainingCars = Math.max(numOfCars - usedCars, 0);

    return res.json({
      phone,
      planName: plan.name,
      totalCarsAllowed: numOfCars,
      usedCars,
      remainingCars,
    });

  } catch (err) {
    console.error('Error checking car usage:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
















































































// // controllers/payu.controller.js
// const crypto = require('crypto');
// const PaymentPayU = require('../PayU/PayUModel');
// const PricingPlans = require('../plans/PricingPlanModel');
// const AddModel = require('../AddModel');

// const MERCHANT_KEY = 'Qmgxku';
// const SALT = 'WUEzPab2A977ygBtkE6dSzsB65ebLsOc';

// // ✅ Create or update payment (pay now)
// exports.createPayment = async (req, res) => {
//   const { txnid, amount, productinfo, firstname, email, phone, payustatususer, planName, ppcId } = req.body;

//   if (payustatususer !== 'pay now') {
//     return res.status(400).json({ error: 'Invalid payment status for this endpoint.' });
//   }

//   const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
//   const hash = crypto.createHash('sha512').update(hashString).digest('hex');

//   const paymentData = {
//     txnid, status: 'process', amount, productinfo, firstname,
//     email, phone, payustatususer, planName, payUdate: new Date().toISOString(), ppcId,
//   };

//   await PaymentPayU.findOneAndUpdate(
//     { ppcId },
//     paymentData,
//     { upsert: true, new: true }
//   );

//   return res.json({
//     key: MERCHANT_KEY,
//     txnid,
//     amount,
//     productinfo,
//     firstname,
//     email,
//     phone,
//     // surl: 'http://localhost:5000/PPC/payu/success', 
//     // furl: 'http://localhost:5000/PPC/payu/failure',
//     surl: 'https://ppcpondy.com/PPC/PPC/payu/success',
//     furl: 'https://ppcpondy.com/PPC/PPC/payu/failure',
//     service_provider: 'payu_paisa',
//     hash
//   });
// };

// // ✅ Pay Later
// exports.savePayLater = async (req, res) => {
//   const { txnid, amount, productinfo, firstname, email, phone, payustatususer, planName, ppcId } = req.body;

//   if (payustatususer !== 'pay later') {
//     return res.status(400).json({ error: 'Invalid pay status for pay later.' });
//   }

//   await PaymentPayU.findOneAndUpdate(
//     { ppcId },
//     {
//       txnid, status: 'pending', amount, productinfo, firstname,
//       email, phone, payustatususer, planName, payUdate: new Date().toISOString(), ppcId,
//     },
//     { upsert: true, new: true }
//   );

//   return res.json({ message: 'Pay later request saved successfully.' });
// };

// // ✅ PayU Success
// // exports.handlePaymentSuccess = async (req, res) => {
// //   let { txnid, status, amount, productinfo, firstname, email, phone, mihpayid, date, planName, ppcId } = req.body;

// //   const payUdate = date || new Date().toISOString();

// //   try {
// //     const parsed = JSON.parse(planName);
// //     planName = parsed.planName || planName;
// //   } catch (e) {}

// //   await PaymentPayU.findOneAndUpdate(
// //     { ppcId },
// //     {
// //       status: 'success',
// //       mihpayid,
// //       payUdate,
// //       payustatususer: 'paid',
// //       planName,
// //     },
// //     { new: true }
// //   );

// //   const encodedDate = encodeURIComponent(payUdate);
// //   res.redirect(`http://localhost:3000/payment-success?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`);
// // };



// // ✅ PayU Success
// exports.handlePaymentSuccess = async (req, res) => {
//   const {
//     txnid,
//     amount,
//     productinfo,
//     firstname,
//     email,
//     phone,
//     mihpayid,
//     planName,
//     ppcId
//   } = req.body;

//   const payUdate = new Date();

//   try {
//     if (!ppcId || !txnid || !mihpayid) {
//       return res.status(400).json({ message: 'Missing payment details.' });
//     }

//     // ✅ Step 1: Mark ALL existing records for this ppcId as paid
//     await PaymentPayU.updateMany(
//       { ppcId },
//       {
//         $set: {
//           status: 'success',
//           mihpayid,
//           payUdate,
//           payustatususer: 'paid',
//           planName
//         }
//       }
//     );

//     // ✅ Step 2: Also ensure AddModel is activated
//     await AddModel.updateOne({ ppcId }, { status: 'active' });

//     // ✅ Step 3: Get the latest updated payment to send back
//     const updatedPayment = await PaymentPayU.findOne({ ppcId }).sort({ updatedAt: -1 });

//     // ✅ Step 4: Redirect
//     const encodedDate = encodeURIComponent(payUdate.toISOString());
//     return res.redirect(
//       `https://ppcpondy.com/payment-success?txnid=${txnid}&firstname=${firstname}&status=success&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
//         //  `http://localhost:3000/payment-success?txnid=${txnid}&firstname=${firstname}&status=success&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`

//     );

//   } catch (err) {
//     console.error('Payment Success Error:', err);
//     return res.status(500).json({ message: 'Payment success processing failed.' });
//   }
// };




// // exports.handlePaymentSuccess = async (req, res) => {
// //   const {
// //     txnid,
// //     amount,
// //     productinfo,
// //     firstname,
// //     email,
// //     phone,
// //     mihpayid,
// //     planName,
// //     ppcId
// //   } = req.body;

// //   const payUdate = new Date().toISOString();

// //   try {
// //     // Ensure all values exist
// //     if (!ppcId || !txnid || !mihpayid) {
// //       return res.status(400).json({ message: 'Missing payment details.' });
// //     }

// //     // Update payment status
// //     const updatedPayment = await PaymentPayU.findOneAndUpdate(
// //       { ppcId },
// //       {
// //         status: 'success',
// //         mihpayid,
// //         payUdate,
// //         payustatususer: 'paid',
// //         planName
// //       },
// //       { new: true }
// //     );

// //     // ✅ Also update AddModel status if it was expired
// //     await AddModel.updateOne(
// //       { ppcId },
// //       { status: 'active' }
// //     );

// //     // Redirect to success page
// //     const encodedDate = encodeURIComponent(payUdate);
// //     return res.redirect(`https://ppcpondy.com/payment-success?txnid=${txnid}&firstname=${firstname}&status=success&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`);
// //   } catch (err) {
// //     console.error('Payment Success Error:', err);
// //     return res.status(500).json({ message: 'Payment success processing failed.' });
// //   }
// // };




// // ✅ PayU Failure
// exports.handlePaymentFailure = async (req, res) => {
//   const { txnid, status, amount, firstname, email, phone, mihpayid, date, planName, ppcId } = req.body;

//   const payUdate = date || new Date().toISOString();

//   await PaymentPayU.findOneAndUpdate(
//     { ppcId },
//     {
//       status: 'failure',
//       mihpayid,
//       payUdate,
//       payustatususer: 'pay failed',
//       planName,
//     },
//     { new: true }
//   );

//   const encodedDate = encodeURIComponent(payUdate);
//   res.redirect(`https://ppcpondy.com/payment-failure?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`);
// };

// // ✅ Utility APIs
// exports.getSuccessfulPayments = async (req, res) => {
//   const payments = await PaymentPayU.find({ status: 'success' }).sort({ createdAt: -1 });
//   res.json(payments);
// };

// exports.getFailedPayments = async (req, res) => {
//   const payments = await PaymentPayU.find({ status: 'failure' }).sort({ createdAt: -1 });
//   res.json(payments);
// };




// exports.getUserPlanUsage = async (req, res) => {
//   const { phone } = req.params;

//   try {
//     // 1. Get the latest successful payment for this user
//     const payment = await PaymentPayU.findOne({
//       phone,
//       payustatususer: 'paid',
//       status: 'success'
//     }).sort({ createdAt: -1 });

//     if (!payment) {
//       return res.status(404).json({ message: 'No active paid plan found for this user.' });
//     }

//     const plan = await PricingPlans.findOne({ name: payment.planName });
//     if (!plan) {
//       return res.status(404).json({ message: 'Plan not found.' });
//     }

//     // 2. Get all active/completed properties for this user
//     const properties = await AddModel.find({
//       phoneNumber: phone,
//       status: { $in: ['active', 'complete'] }
//     });

//     const usedCars = properties.length;
//     const totalCars = plan.numOfCars || 0;
//     const remainingCars = Math.max(totalCars - usedCars, 0);

//     const ppcIds = properties.map(p => p.ppcId);

//     res.json({
//       phone,
//       planName: plan.name,
//       totalCars,
//       usedCars,
//       remainingCars,
//       postedPpcIds: ppcIds
//     });

//   } catch (error) {
//     console.error('Error in getUserPlanUsage:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };



// exports.getUsedAndRemainingCars = async (req, res) => {
//   try {
//     const { phone } = req.query;

//     if (!phone) {
//       return res.status(400).json({ message: 'Phone number is required' });
//     }

//     // Find the latest successful payment for this user
//     const latestPayment = await PaymentPayU.findOne({ phone, status: 'success', payustatususer: 'paid' })
//       .sort({ createdAt: -1 });

//     if (!latestPayment) {
//       return res.status(404).json({ message: 'No successful payment found for this user' });
//     }

//     // Get plan details by planName
//     const plan = await PricingPlans.findOne({ name: latestPayment.planName });

//     if (!plan) {
//       return res.status(404).json({ message: 'Plan not found for this user' });
//     }

//     // Count how many properties this user has posted
//     const usedCars = await AddProperty.countDocuments({ phoneNumber: phone });

//     const numOfCars = plan.numOfCars || 0;
//     const remainingCars = Math.max(numOfCars - usedCars, 0);

//     return res.json({
//       phone,
//       planName: plan.name,
//       totalCarsAllowed: numOfCars,
//       usedCars,
//       remainingCars,
//     });

//   } catch (err) {
//     console.error('Error checking car usage:', err);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };


















































// const crypto = require('crypto');
// const PaymentPayU = require('./PayUModel');
// const PricingPlans = require('../plans/PricingPlanModel');
// const AddModel = require('../AddModel');

// const MERCHANT_KEY = 'Qmgxku';
// const SALT = 'WUEzPab2A977ygBtkE6dSzsB65ebLsOc';

// // Create Payment (Pay Now)
// exports.createPayment = async (req, res) => {
//   try {
//     const {
//       txnid,
//       amount,
//       productinfo,
//       firstname,
//       email,
//       phone,
//       payustatususer,
//       planName,
//       ppcId,
//     } = req.body;

//     if (payustatususer !== 'pay now') {
//       return res.status(400).json({ error: 'Invalid payment status for this endpoint.' });
//     }

//     // Generate hash for PayU
//     const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
//     const hash = crypto.createHash('sha512').update(hashString).digest('hex');

//     // Save payment in DB
//     await PaymentPayU.create({
//       txnid,
//       status: 'process',
//       amount,
//       productinfo,
//       firstname,
//       email,
//       phone,
//       payustatususer,
//       planName,
//       payUdate: new Date().toISOString(),
//       ppcId,
//     });

//     return res.json({
//       key: MERCHANT_KEY,
//       txnid,
//       amount,
//       productinfo,
//       firstname,
//       email,
//       phone,
//       surl: 'https://ppcpondy.com/PPC/PPC/payu/success',
//       furl: 'https://ppcpondy.com/PPC/PPC/payu/failure',
//       service_provider: 'payu_paisa',
//       hash,
//     });
//   } catch (error) {
//     console.error("createPayment error:", error);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

// // Save Pay Later Request
// exports.savePayLater = async (req, res) => {
//   try {
//     const {
//       txnid,
//       amount,
//       productinfo,
//       firstname,
//       email,
//       phone,
//       payustatususer,
//       planName,
//       ppcId,
//     } = req.body;

//     if (payustatususer !== 'pay later') {
//       return res.status(400).json({ error: 'Invalid pay status for pay later.' });
//     }

//     await PaymentPayU.create({
//       txnid,
//       status: 'pending',
//       amount,
//       productinfo,
//       firstname,
//       email,
//       phone,
//       payustatususer,
//       planName,
//       payUdate: new Date().toISOString(),
//       ppcId,
//     });

//     return res.json({ message: 'Pay later request saved successfully.' });
//   } catch (error) {
//     console.error("savePayLater error:", error);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

// // Handle PayU Success Callback
// exports.handlePaymentSuccess = async (req, res) => {
//   try {
//     let {
//       txnid,
//       status,
//       amount,
//       productinfo,
//       firstname,
//       email,
//       phone,
//       mihpayid,
//       date,
//       planName,
//       ppcId,
//     } = req.body;

//     const payUdate = date || new Date().toISOString();

//     // Sometimes planName is JSON stringified, parse it safely
//     try {
//       const parsedInfo = JSON.parse(planName);
//       planName = parsedInfo.planName || planName;
//     } catch {}

//     await PaymentPayU.findOneAndUpdate(
//       { txnid },
//       {
//         status: 'success',
//         mihpayid,
//         payUdate,
//         payustatususer: 'paid',
//         planName,
//         ppcId,
//       },
//       { new: true }
//     );

//     const encodedDate = encodeURIComponent(payUdate);
//     res.redirect(
//       `https://ppcpondy.com/payment-success?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
//     );
//   } catch (error) {
//     console.error("handlePaymentSuccess error:", error);
//     res.status(500).send("Internal server error");
//   }
// };

// // Handle PayU Failure Callback
// exports.handlePaymentFailure = async (req, res) => {
//   try {
//     const {
//       txnid,
//       status,
//       amount,
//       firstname,
//       email,
//       phone,
//       mihpayid,
//       date,
//       planName,
//       ppcId,
//     } = req.body;

//     const payUdate = date || new Date().toISOString();

//     await PaymentPayU.findOneAndUpdate(
//       { txnid },
//       {
//         status: 'failure',
//         mihpayid,
//         payUdate,
//         payustatususer: 'pay failed',
//         planName,
//         ppcId,
//       },
//       { new: true }
//     );

//     const encodedDate = encodeURIComponent(payUdate);
//     res.redirect(
//       `https://ppcpondy.com/payment-failure?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
//     );
//   } catch (error) {
//     console.error("handlePaymentFailure error:", error);
//     res.status(500).send("Internal server error");
//   }
// };

// // Fetch Successful Payments
// exports.getSuccessfulPayments = async (req, res) => {
//   try {
//     const payments = await PaymentPayU.find({ status: 'success' }).sort({ createdAt: -1 });
//     res.json(payments);
//   } catch (error) {
//     console.error("getSuccessfulPayments error:", error);
//     res.status(500).send("Internal server error");
//   }
// };

// // Fetch Failed Payments
// exports.getFailedPayments = async (req, res) => {
//   try {
//     const payments = await PaymentPayU.find({ status: 'failure' }).sort({ createdAt: -1 });
//     res.json(payments);
//   } catch (error) {
//     console.error("getFailedPayments error:", error);
//     res.status(500).send("Internal server error");
//   }
// };








// // const crypto = require('crypto');
// // const PaymentPayU = require('./PayUModel');
// // const PricingPlans = require('../plans/PricingPlanModel');
// // const AddModel = require('../AddModel');

// // const MERCHANT_KEY = 'Qmgxku';
// // const SALT = 'WUEzPab2A977ygBtkE6dSzsB65ebLsOc';

// // // Step 1: Create payment and generate hash for Pay Now
// // exports.createPayment = async (req, res) => {
// //   const {
// //     txnid,
// //     amount,
// //     productinfo,
// //     firstname,
// //     email,
// //     phone,
// //     payustatususer,
// //     planName,
// //     ppcId, // ✅ added
// //   } = req.body;

// //   if (payustatususer !== 'pay now') {
// //     return res.status(400).json({ error: 'Invalid payment status for this endpoint.' });
// //   }

// //   const data = {
// //     key: MERCHANT_KEY,
// //     txnid,
// //     amount,
// //     productinfo,
// //     firstname,
// //     email,
// //     phone,
// //     // surl: 'http://localhost:5000/PPC/payu/success', 
// //     // furl: 'http://localhost:5000/PPC/payu/failure',


// //     surl: 'https://ppcpondy.com/PPC/PPC/payu/success',
// // furl: 'https://ppcpondy.com/PPC/PPC/payu/failure',

// //     service_provider: 'payu_paisa',
// //   };

// //   // Generate hash
// //   const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
// //   const hash = crypto.createHash('sha512').update(hashString).digest('hex');

// //   // Save payment
// //   await PaymentPayU.create({
// //     txnid,
// //     status: 'process',
// //     amount,
// //     productinfo,
// //     firstname,
// //     email,
// //     phone,
// //     payustatususer,
// //     planName,
// //     payUdate: new Date().toISOString(),
// //     ppcId, // ✅ added
// //   });

// //   return res.json({ ...data, hash });
// // };


// // // Step 2: Save pay later request
// // exports.savePayLater = async (req, res) => {
// //   const {
// //     txnid,
// //     amount,
// //     productinfo,
// //     firstname,
// //     email,
// //     phone,
// //     payustatususer,
// //     planName,
// //     ppcId, // ✅ added
// //   } = req.body;

// //   if (payustatususer !== 'pay later') {
// //     return res.status(400).json({ error: 'Invalid pay status for pay later.' });
// //   }

// //   await PaymentPayU.create({
// //     txnid,
// //     status: 'pending',
// //     amount,
// //     productinfo,
// //     firstname,
// //     email,
// //     phone,
// //     payustatususer,
// //     planName,
// //     payUdate: new Date().toISOString(),
// //     ppcId, // ✅ added
// //   });

// //   return res.json({ message: 'Pay later request saved successfully.' });
// // };

// // // Step 3: Handle PayU success callback
// // exports.handlePaymentSuccess = async (req, res) => {
// //   let {
// //     txnid,
// //     status,
// //     amount,
// //     productinfo,
// //     firstname,
// //     email,
// //     phone,
// //     mihpayid,
// //     date,
// //     planName,
// //     ppcId, // ✅ added
// //   } = req.body;

// //   const payUdate = date || new Date().toISOString();

// //   try {
// //     const parsedInfo = JSON.parse(planName);
// //     planName = parsedInfo.planName;
// //   } catch (err) {
// //     console.error("Invalid planName JSON:", err);
// //   }

// //   await PaymentPayU.findOneAndUpdate(
// //     { txnid },
// //     {
// //       status: 'success',
// //       mihpayid,
// //       payUdate,
// //       payustatususer: 'paid',
// //       planName,
// //       ppcId, // ✅ added
// //     },
// //     { new: true }
// //   );

// //   const encodedDate = encodeURIComponent(payUdate);
// //   res.redirect(
// //     `https://ppcpondy.com/payment-success?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
// //   );
// // };

// // // Step 4: Handle PayU failure callback
// // exports.handlePaymentFailure = async (req, res) => {
// //   const {
// //     txnid,
// //     status,
// //     amount,
// //     firstname,
// //     email,
// //     phone,
// //     mihpayid,
// //     date,
// //     planName,
// //     ppcId, // ✅ added
// //   } = req.body;

// //   const payUdate = date || new Date().toISOString();

// //   await PaymentPayU.findOneAndUpdate(
// //     { txnid },
// //     {
// //       status: 'failure',
// //       mihpayid,
// //       payUdate,
// //       payustatususer: 'pay failed',
// //       planName,
// //       ppcId, // ✅ added
// //     },
// //     { new: true }
// //   );

// //   const encodedDate = encodeURIComponent(payUdate);
// //   res.redirect(
// //     `https://ppcpondy.com/payment-failure?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
// //   );
// // };


// // // Step 5: Fetch successful payments
// // exports.getSuccessfulPayments = async (req, res) => {
// //   const payments = await PaymentPayU.find({ status: 'success' }).sort({ createdAt: -1 });
// //   res.json(payments);
// // };

// // // Step 6: Fetch failed payments
// // exports.getFailedPayments = async (req, res) => {
// //   const payments = await PaymentPayU.find({ status: 'failure' }).sort({ createdAt: -1 });
// //   res.json(payments);
// // };



// // exports.getUserPlanUsage = async (req, res) => {
// //   const { phone } = req.params;

// //   try {
// //     // 1. Get the latest successful payment for this user
// //     const payment = await PaymentPayU.findOne({
// //       phone,
// //       payustatususer: 'paid',
// //       status: 'success'
// //     }).sort({ createdAt: -1 });

// //     if (!payment) {
// //       return res.status(404).json({ message: 'No active paid plan found for this user.' });
// //     }

// //     const plan = await PricingPlans.findOne({ name: payment.planName });
// //     if (!plan) {
// //       return res.status(404).json({ message: 'Plan not found.' });
// //     }

// //     // 2. Get all active/completed properties for this user
// //     const properties = await AddModel.find({
// //       phoneNumber: phone,
// //       status: { $in: ['active', 'complete'] }
// //     });

// //     const usedCars = properties.length;
// //     const totalCars = plan.numOfCars || 0;
// //     const remainingCars = Math.max(totalCars - usedCars, 0);

// //     const ppcIds = properties.map(p => p.ppcId);

// //     res.json({
// //       phone,
// //       planName: plan.name,
// //       totalCars,
// //       usedCars,
// //       remainingCars,
// //       postedPpcIds: ppcIds
// //     });

// //   } catch (error) {
// //     console.error('Error in getUserPlanUsage:', error);
// //     res.status(500).json({ message: 'Internal server error' });
// //   }
// // };



// // exports.getUsedAndRemainingCars = async (req, res) => {
// //   try {
// //     const { phone } = req.query;

// //     if (!phone) {
// //       return res.status(400).json({ message: 'Phone number is required' });
// //     }

// //     // Find the latest successful payment for this user
// //     const latestPayment = await PaymentPayU.findOne({ phone, status: 'success', payustatususer: 'paid' })
// //       .sort({ createdAt: -1 });

// //     if (!latestPayment) {
// //       return res.status(404).json({ message: 'No successful payment found for this user' });
// //     }

// //     // Get plan details by planName
// //     const plan = await PricingPlans.findOne({ name: latestPayment.planName });

// //     if (!plan) {
// //       return res.status(404).json({ message: 'Plan not found for this user' });
// //     }

// //     // Count how many properties this user has posted
// //     const usedCars = await AddProperty.countDocuments({ phoneNumber: phone });

// //     const numOfCars = plan.numOfCars || 0;
// //     const remainingCars = Math.max(numOfCars - usedCars, 0);

// //     return res.json({
// //       phone,
// //       planName: plan.name,
// //       totalCarsAllowed: numOfCars,
// //       usedCars,
// //       remainingCars,
// //     });

// //   } catch (err) {
// //     console.error('Error checking car usage:', err);
// //     return res.status(500).json({ message: 'Internal server error' });
// //   }
// // };
















// // // controllers/payu.controller.js
// // const crypto = require('crypto');
// // const PaymentPayU = require('../PayU/PayUModel');
// // const PricingPlans = require('../plans/PricingPlanModel');
// // const AddModel = require('../AddModel');

// // const MERCHANT_KEY = 'Qmgxku';
// // const SALT = 'WUEzPab2A977ygBtkE6dSzsB65ebLsOc';

// // // helper to safely extract fields from body or query and from common PayU custom fields (udf1..udf5)
// // function getField(req, ...keys) {
// //   // Check body first (POST request)
// //   if (req.body && typeof req.body === 'object') {
// //     for (const k of keys) {
// //       if (req.body[k] !== undefined && req.body[k] !== '') return req.body[k];
// //     }
// //   }
  
// //   // Then check query (GET request)
// //   if (req.query && typeof req.query === 'object') {
// //     for (const k of keys) {
// //       if (req.query[k] !== undefined && req.query[k] !== '') return req.query[k];
// //     }
// //   }
  
// //   return undefined;
// // }

// // // Create or update payment (pay now)
// // exports.createPayment = async (req, res) => {
// //   try {
// //     const { txnid, amount, productinfo, firstname, email, phone, payustatususer, planName } = req.body;
// //     let ppcId = getField(req, 'ppcId', 'udf1', 'udf2');

// //     if (payustatususer !== 'pay now') {
// //       return res.status(400).json({ error: 'Invalid payment status for this endpoint.' });
// //     }

// //     if (!ppcId) {
// //       return res.status(400).json({ error: 'ppcId is required.' });
// //     }

// //     const numericPpcId = Number(ppcId);

// //     const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
// //     const hash = crypto.createHash('sha512').update(hashString).digest('hex');

// //     const paymentData = {
// //       txnid,
// //       status: 'process',
// //       amount,
// //       productinfo,
// //       firstname,
// //       email,
// //       phone,
// //       payustatususer,
// //       planName,
// //       payUdate: new Date().toISOString(),
// //       ppcId: isNaN(numericPpcId) ? ppcId : numericPpcId,
// //     };

// //     await PaymentPayU.findOneAndUpdate(
// //       { ppcId: paymentData.ppcId },
// //       paymentData,
// //       { upsert: true, new: true }
// //     );

// //     return res.json({
// //       key: MERCHANT_KEY,
// //       txnid,
// //       amount,
// //       productinfo,
// //       firstname,
// //       email,
// //       phone,
// //       surl: 'https://ppcpondy.com/PPC/PPC/payu/success',
// //       furl: 'https://ppcpondy.com/PPC/PPC/payu/failure',
// //       service_provider: 'payu_paisa',
// //       hash
// //     });
// //   } catch (err) {
// //     console.error('createPayment error:', err);
// //     return res.status(500).json({ error: 'Server error' });
// //   }
// // };

// // // Pay Later
// // exports.savePayLater = async (req, res) => {
// //   try {
// //     const { txnid, amount, productinfo, firstname, email, phone, payustatususer, planName } = req.body;
// //     let ppcId = getField(req, 'ppcId', 'udf1', 'udf2');

// //     if (payustatususer !== 'pay later') {
// //       return res.status(400).json({ error: 'Invalid pay status for pay later.' });
// //     }

// //     if (!ppcId) {
// //       return res.status(400).json({ error: 'ppcId is required.' });
// //     }

// //     const numericPpcId = Number(ppcId);

// //     await PaymentPayU.findOneAndUpdate(
// //       { ppcId: isNaN(numericPpcId) ? ppcId : numericPpcId },
// //       {
// //         txnid,
// //         status: 'pending',
// //         amount,
// //         productinfo,
// //         firstname,
// //         email,
// //         phone,
// //         payustatususer,
// //         planName,
// //         payUdate: new Date().toISOString(),
// //         ppcId: isNaN(numericPpcId) ? ppcId : numericPpcId,
// //       },
// //       { upsert: true, new: true }
// //     );

// //     return res.json({ message: 'Pay later request saved successfully.' });
// //   } catch (err) {
// //     console.error('savePayLater error:', err);
// //     return res.status(500).json({ error: 'Server error' });
// //   }
// // };

// // // PayU success - handle both POST and GET
// // exports.handlePaymentSuccess = async (req, res) => {
// //   try {
// //     console.log('Payment success received - method:', req.method);
// //     console.log('Body:', req.body);
// //     console.log('Query:', req.query);

// //     // Extract data from both body (POST) and query (GET)
// //     let txnid = getField(req, 'txnid', 'transaction_id', 'mihpayid_txn');
// //     let amount = getField(req, 'amount', 'net_amount_debit', 'net_amount');
// //     let productinfo = getField(req, 'productinfo', 'product_info');
// //     let firstname = getField(req, 'firstname', 'name');
// //     let email = getField(req, 'email');
// //     let phone = getField(req, 'phone', 'mobile');
// //     let mihpayid = getField(req, 'mihpayid') || getField(req, 'payuMoneyId') || getField(req, 'payu_mihpayid');
// //     let planName = getField(req, 'planName', 'udf2', 'udf3') || '';
// //     let ppcId = getField(req, 'ppcId', 'udf1', 'udf4');

// //     // If still not found, try to parse planName if it's JSON
// //     if (!ppcId && planName) {
// //       try {
// //         const parsed = JSON.parse(planName);
// //         if (parsed && parsed.ppcId) ppcId = parsed.ppcId;
// //         if (parsed && parsed.planName) planName = parsed.planName;
// //       } catch (e) {
// //         // not JSON, ignore
// //       }
// //     }

// //     // coerce ppcId to Number when possible
// //     const numericPpcId = ppcId ? Number(ppcId) : undefined;

// //     // Validate required fields
// //     if (!ppcId || !txnid || !mihpayid) {
// //       console.warn('Payment success missing required fields');
// //       console.warn('ppcId:', ppcId, 'txnid:', txnid, 'mihpayid:', mihpayid);
      
// //       // For POST requests from PayU, we need to return a proper response
// //       if (req.method === 'POST') {
// //         return res.status(400).json({ 
// //           message: 'Missing payment details.',
// //           receivedData: { body: req.body, query: req.query }
// //         });
// //       } else {
// //         // For GET requests (direct browser access), redirect to failure page
// //         return res.redirect(`https://ppcpondy.com/payment-failure?error=missing_details`);
// //       }
// //     }

// //     const payUdate = new Date().toISOString();

// //     // Update PaymentPayU
// //     await PaymentPayU.findOneAndUpdate(
// //       { ppcId: isNaN(numericPpcId) ? ppcId : numericPpcId },
// //       {
// //         status: 'success',
// //         mihpayid,
// //         payUdate,
// //         payustatususer: 'paid',
// //         planName,
// //         txnid,
// //         amount,
// //         firstname,
// //         email,
// //         phone
// //       },
// //       { new: true, upsert: true }
// //     );

// //     // Also update AddModel (activate) if needed
// //     await AddModel.updateOne({ ppcId: isNaN(numericPpcId) ? ppcId : numericPpcId }, { status: 'active' });

// //     const encodedDate = encodeURIComponent(payUdate);
    
// //     // If it's a POST request from PayU, we need to show a success page that redirects
// //     if (req.method === 'POST') {
// //       // Return HTML that redirects to the frontend success page
// //       return res.send(`
// //         <!DOCTYPE html>
// //         <html>
// //         <head>
// //           <title>Payment Successful</title>
// //           <meta http-equiv="refresh" content="0; url=https://ppcpondy.com/payment-success?txnid=${encodeURIComponent(txnid)}&firstname=${encodeURIComponent(firstname || '')}&status=success&amount=${encodeURIComponent(amount || '')}&email=${encodeURIComponent(email || '')}&phone=${encodeURIComponent(phone || '')}&mihpayid=${encodeURIComponent(mihpayid)}&payUdate=${encodedDate}&planName=${encodeURIComponent(planName || '')}" />
// //         </head>
// //         <body>
// //           <p>Payment successful! Redirecting...</p>
// //           <script>
// //             window.location.href = "https://ppcpondy.com/payment-success?txnid=${encodeURIComponent(txnid)}&firstname=${encodeURIComponent(firstname || '')}&status=success&amount=${encodeURIComponent(amount || '')}&email=${encodeURIComponent(email || '')}&phone=${encodeURIComponent(phone || '')}&mihpayid=${encodeURIComponent(mihpayid)}&payUdate=${encodedDate}&planName=${encodeURIComponent(planName || '')}";
// //           </script>
// //         </body>
// //         </html>
// //       `);
// //     } else {
// //       // For GET requests, redirect directly
// //       return res.redirect(`https://ppcpondy.com/payment-success?txnid=${encodeURIComponent(txnid)}&firstname=${encodeURIComponent(firstname || '')}&status=success&amount=${encodeURIComponent(amount || '')}&email=${encodeURIComponent(email || '')}&phone=${encodeURIComponent(phone || '')}&mihpayid=${encodeURIComponent(mihpayid)}&payUdate=${encodedDate}&planName=${encodeURIComponent(planName || '')}`);
// //     }
// //   } catch (err) {
// //     console.error('handlePaymentSuccess error:', err);
    
// //     if (req.method === 'POST') {
// //       return res.status(500).json({ message: 'Payment success processing failed.', error: err.message });
// //     } else {
// //       return res.redirect(`https://ppcpondy.com/payment-failure?error=server_error`);
// //     }
// //   }
// // };

// // // PayU failure - handle both POST and GET
// // exports.handlePaymentFailure = async (req, res) => {
// //   try {
// //     console.log('Payment failure received - method:', req.method);
// //     console.log('Body:', req.body);
// //     console.log('Query:', req.query);

// //     let txnid = getField(req, 'txnid');
// //     let status = getField(req, 'status');
// //     let amount = getField(req, 'amount');
// //     let firstname = getField(req, 'firstname');
// //     let email = getField(req, 'email');
// //     let phone = getField(req, 'phone');
// //     let mihpayid = getField(req, 'mihpayid');
// //     let planName = getField(req, 'planName', 'udf2', 'udf3') || '';
// //     let ppcId = getField(req, 'ppcId', 'udf1', 'udf4');
// //     let error = getField(req, 'error');

// //     const numericPpcId = ppcId ? Number(ppcId) : undefined;
// //     const payUdate = new Date().toISOString();

// //     if (ppcId) {
// //       await PaymentPayU.findOneAndUpdate(
// //         { ppcId: isNaN(numericPpcId) ? ppcId : numericPpcId },
// //         {
// //           status: 'failure',
// //           mihpayid,
// //           payUdate,
// //           payustatususer: 'pay failed',
// //           planName,
// //           txnid,
// //           amount,
// //           firstname,
// //           email,
// //           phone
// //         },
// //         { new: true, upsert: true }
// //       );
// //     }

// //     const encodedDate = encodeURIComponent(payUdate);
    
// //     // If it's a POST request from PayU, return HTML that redirects
// //     if (req.method === 'POST') {
// //       return res.send(`
// //         <!DOCTYPE html>
// //         <html>
// //         <head>
// //           <title>Payment Failed</title>
// //           <meta http-equiv="refresh" content="0; url=https://ppcpondy.com/payment-failure?txnid=${encodeURIComponent(txnid || '')}&firstname=${encodeURIComponent(firstname || '')}&status=${encodeURIComponent(status || 'failure')}&amount=${encodeURIComponent(amount || '')}&email=${encodeURIComponent(email || '')}&phone=${encodeURIComponent(phone || '')}&mihpayid=${encodeURIComponent(mihpayid || '')}&payUdate=${encodedDate}&planName=${encodeURIComponent(planName || '')}&error=${encodeURIComponent(error || '')}" />
// //         </head>
// //         <body>
// //           <p>Payment failed! Redirecting...</p>
// //           <script>
// //             window.location.href = "https://ppcpondy.com/payment-failure?txnid=${encodeURIComponent(txnid || '')}&firstname=${encodeURIComponent(firstname || '')}&status=${encodeURIComponent(status || 'failure')}&amount=${encodeURIComponent(amount || '')}&email=${encodeURIComponent(email || '')}&phone=${encodeURIComponent(phone || '')}&mihpayid=${encodeURIComponent(mihpayid || '')}&payUdate=${encodedDate}&planName=${encodeURIComponent(planName || '')}&error=${encodeURIComponent(error || '')}";
// //           </script>
// //         </body>
// //         </html>
// //       `);
// //     } else {
// //       return res.redirect(`https://ppcpondy.com/payment-failure?txnid=${encodeURIComponent(txnid || '')}&firstname=${encodeURIComponent(firstname || '')}&status=${encodeURIComponent(status || 'failure')}&amount=${encodeURIComponent(amount || '')}&email=${encodeURIComponent(email || '')}&phone=${encodeURIComponent(phone || '')}&mihpayid=${encodeURIComponent(mihpayid || '')}&payUdate=${encodedDate}&planName=${encodeURIComponent(planName || '')}&error=${encodeURIComponent(error || '')}`);
// //     }
// //   } catch (err) {
// //     console.error('handlePaymentFailure error:', err);
    
// //     if (req.method === 'POST') {
// //       return res.status(500).json({ message: 'Payment failure processing failed.', error: err.message });
// //     } else {
// //       return res.redirect(`https://ppcpondy.com/payment-failure?error=server_error`);
// //     }
// //   }
// // };

// // // Utility APIs
// // exports.getSuccessfulPayments = async (req, res) => {
// //   try {
// //     const payments = await PaymentPayU.find({ status: 'success' }).sort({ createdAt: -1 });
// //     res.json(payments);
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: 'Server error' });
// //   }
// // };

// // exports.getFailedPayments = async (req, res) => {
// //   try {
// //     const payments = await PaymentPayU.find({ status: 'failure' }).sort({ createdAt: -1 });
// //     res.json(payments);
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: 'Server error' });
// //   }
// // };

// // exports.getUserPlanUsage = async (req, res) => {
// //   try {
// //     const { phone } = req.params;
// //     const normalizedPhone = phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

// //     const payments = await PaymentPayU.find({ phone: new RegExp(normalizedPhone + '$') });
// //     const plans = await PricingPlans.find({ phoneNumber: new RegExp(normalizedPhone + '$') });

// //     res.json({ payments, plans });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: 'Server error' });
// //   }
// // };

// // exports.getUsedAndRemainingCars = async (req, res) => {
// //   try {
// //     const allPlans = await PricingPlans.find();

// //     const plansWithUsage = await Promise.all(
// //       allPlans.map(async (plan) => {
// //         const rawPhone = Array.isArray(plan.phoneNumber)
// //           ? plan.phoneNumber[0]
// //           : plan.phoneNumber || '';
// //         const normalizedPhone = rawPhone
// //           .replace(/[\s-]/g, '')
// //           .replace(/^(\+91|91|0)/, '')
// //           .trim();

// //         const usedCars = await AddModel.countDocuments({
// //           phoneNumber: new RegExp(normalizedPhone + '$'),
// //           isDeleted: false,
// //         });

// //         const remainingCars = (plan.numOfCars || 0) - usedCars;

// //         return {
// //           phone: normalizedPhone,
// //           planName: plan.name,
// //           usedCars,
// //           remainingCars: remainingCars < 0 ? 0 : remainingCars,
// //           totalCars: plan.numOfCars || 0,
// //         };
// //       })
// //     );

// //     res.json(plansWithUsage);
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: 'Server error' });
// //   }
// // };








// // // controllers/payu.controller.js
// // const crypto = require('crypto');
// // const PaymentPayU = require('../PayU/PayUModel');
// // const PricingPlans = require('../plans/PricingPlanModel');
// // const AddModel = require('../AddModel');

// // const MERCHANT_KEY = 'Qmgxku';
// // const SALT = 'WUEzPab2A977ygBtkE6dSzsB65ebLsOc';

// // // ✅ Create or update payment (pay now)
// // exports.createPayment = async (req, res) => {
// //   const { txnid, amount, productinfo, firstname, email, phone, payustatususer, planName, ppcId } = req.body;

// //   if (payustatususer !== 'pay now') {
// //     return res.status(400).json({ error: 'Invalid payment status for this endpoint.' });
// //   }

// //   const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
// //   const hash = crypto.createHash('sha512').update(hashString).digest('hex');

// //   const paymentData = {
// //     txnid, status: 'process', amount, productinfo, firstname,
// //     email, phone, payustatususer, planName, payUdate: new Date().toISOString(), ppcId,
// //   };

// //   await PaymentPayU.findOneAndUpdate(
// //     { ppcId },
// //     paymentData,
// //     { upsert: true, new: true }
// //   );

// //   return res.json({
// //     key: MERCHANT_KEY,
// //     txnid,
// //     amount,
// //     productinfo,
// //     firstname,
// //     email,
// //     phone,
// //     // surl: 'http://localhost:5000/PPC/payu/success', 
// //     // furl: 'http://localhost:5000/PPC/payu/failure',
// //     surl: 'https://ppcpondy.com/PPC/PPC/payu/success',
// //     furl: 'https://ppcpondy.com/PPC/PPC/payu/failure',
// //     service_provider: 'payu_paisa',
// //     hash
// //   });
// // };

// // // ✅ Pay Later
// // exports.savePayLater = async (req, res) => {
// //   const { txnid, amount, productinfo, firstname, email, phone, payustatususer, planName, ppcId } = req.body;

// //   if (payustatususer !== 'pay later') {
// //     return res.status(400).json({ error: 'Invalid pay status for pay later.' });
// //   }

// //   await PaymentPayU.findOneAndUpdate(
// //     { ppcId },
// //     {
// //       txnid, status: 'pending', amount, productinfo, firstname,
// //       email, phone, payustatususer, planName, payUdate: new Date().toISOString(), ppcId,
// //     },
// //     { upsert: true, new: true }
// //   );

// //   return res.json({ message: 'Pay later request saved successfully.' });
// // };

// // // ✅ PayU Success
// // // exports.handlePaymentSuccess = async (req, res) => {
// // //   let { txnid, status, amount, productinfo, firstname, email, phone, mihpayid, date, planName, ppcId } = req.body;

// // //   const payUdate = date || new Date().toISOString();

// // //   try {
// // //     const parsed = JSON.parse(planName);
// // //     planName = parsed.planName || planName;
// // //   } catch (e) {}

// // //   await PaymentPayU.findOneAndUpdate(
// // //     { ppcId },
// // //     {
// // //       status: 'success',
// // //       mihpayid,
// // //       payUdate,
// // //       payustatususer: 'paid',
// // //       planName,
// // //     },
// // //     { new: true }
// // //   );

// // //   const encodedDate = encodeURIComponent(payUdate);
// // //   res.redirect(`http://localhost:3000/payment-success?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`);
// // // };







// // exports.handlePaymentSuccess = async (req, res) => {
// //   const {
// //     txnid,
// //     amount,
// //     productinfo,
// //     firstname,
// //     email,
// //     phone,
// //     mihpayid,
// //     planName,
// //     ppcId
// //   } = req.body;

// //   const payUdate = new Date().toISOString();

// //   try {
// //     // Ensure all values exist
// //     if (!ppcId || !txnid || !mihpayid) {
// //       return res.status(400).json({ message: 'Missing payment details.' });
// //     }

// //     // Update payment status
// //     const updatedPayment = await PaymentPayU.findOneAndUpdate(
// //       { ppcId },
// //       {
// //         status: 'success',
// //         mihpayid,
// //         payUdate,
// //         payustatususer: 'paid',
// //         planName
// //       },
// //       { new: true }
// //     );

// //     // ✅ Also update AddModel status if it was expired
// //     await AddModel.updateOne(
// //       { ppcId },
// //       { status: 'active' }
// //     );

// //     // Redirect to success page
// //     const encodedDate = encodeURIComponent(payUdate);
// //     return res.redirect(`https://ppcpondy.com/payment-success?txnid=${txnid}&firstname=${firstname}&status=success&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`);
// //   } catch (err) {
// //     console.error('Payment Success Error:', err);
// //     return res.status(500).json({ message: 'Payment success processing failed.' });
// //   }
// // };




// // // ✅ PayU Failure
// // exports.handlePaymentFailure = async (req, res) => {
// //   const { txnid, status, amount, firstname, email, phone, mihpayid, date, planName, ppcId } = req.body;

// //   const payUdate = date || new Date().toISOString();

// //   await PaymentPayU.findOneAndUpdate(
// //     { ppcId },
// //     {
// //       status: 'failure',
// //       mihpayid,
// //       payUdate,
// //       payustatususer: 'pay failed',
// //       planName,
// //     },
// //     { new: true }
// //   );

// //   const encodedDate = encodeURIComponent(payUdate);
// //   res.redirect(`https://ppcpondy.com/payment-failure?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`);
// // };

// // // ✅ Utility APIs
// // exports.getSuccessfulPayments = async (req, res) => {
// //   const payments = await PaymentPayU.find({ status: 'success' }).sort({ createdAt: -1 });
// //   res.json(payments);
// // };

// // exports.getFailedPayments = async (req, res) => {
// //   const payments = await PaymentPayU.find({ status: 'failure' }).sort({ createdAt: -1 });
// //   res.json(payments);
// // };




// // exports.getUserPlanUsage = async (req, res) => {
// //   const { phone } = req.params;

// //   try {
// //     // 1. Get the latest successful payment for this user
// //     const payment = await PaymentPayU.findOne({
// //       phone,
// //       payustatususer: 'paid',
// //       status: 'success'
// //     }).sort({ createdAt: -1 });

// //     if (!payment) {
// //       return res.status(404).json({ message: 'No active paid plan found for this user.' });
// //     }

// //     const plan = await PricingPlans.findOne({ name: payment.planName });
// //     if (!plan) {
// //       return res.status(404).json({ message: 'Plan not found.' });
// //     }

// //     // 2. Get all active/completed properties for this user
// //     const properties = await AddModel.find({
// //       phoneNumber: phone,
// //       status: { $in: ['active', 'complete'] }
// //     });

// //     const usedCars = properties.length;
// //     const totalCars = plan.numOfCars || 0;
// //     const remainingCars = Math.max(totalCars - usedCars, 0);

// //     const ppcIds = properties.map(p => p.ppcId);

// //     res.json({
// //       phone,
// //       planName: plan.name,
// //       totalCars,
// //       usedCars,
// //       remainingCars,
// //       postedPpcIds: ppcIds
// //     });

// //   } catch (error) {
// //     console.error('Error in getUserPlanUsage:', error);
// //     res.status(500).json({ message: 'Internal server error' });
// //   }
// // };



// // exports.getUsedAndRemainingCars = async (req, res) => {
// //   try {
// //     const { phone } = req.query;

// //     if (!phone) {
// //       return res.status(400).json({ message: 'Phone number is required' });
// //     }

// //     // Find the latest successful payment for this user
// //     const latestPayment = await PaymentPayU.findOne({ phone, status: 'success', payustatususer: 'paid' })
// //       .sort({ createdAt: -1 });

// //     if (!latestPayment) {
// //       return res.status(404).json({ message: 'No successful payment found for this user' });
// //     }

// //     // Get plan details by planName
// //     const plan = await PricingPlans.findOne({ name: latestPayment.planName });

// //     if (!plan) {
// //       return res.status(404).json({ message: 'Plan not found for this user' });
// //     }

// //     // Count how many properties this user has posted
// //     const usedCars = await AddProperty.countDocuments({ phoneNumber: phone });

// //     const numOfCars = plan.numOfCars || 0;
// //     const remainingCars = Math.max(numOfCars - usedCars, 0);

// //     return res.json({
// //       phone,
// //       planName: plan.name,
// //       totalCarsAllowed: numOfCars,
// //       usedCars,
// //       remainingCars,
// //     });

// //   } catch (err) {
// //     console.error('Error checking car usage:', err);
// //     return res.status(500).json({ message: 'Internal server error' });
// //   }
// // };














































