



const crypto = require('crypto');
const PaymentPayUBuyer = require('./PayuBuyerModel');

const MERCHANT_KEY = 'Qmgxku';
const SALT = 'WUEzPab2A977ygBtkE6dSzsB65ebLsOc';

// Create Payment (Pay Now)
exports.createPaymentBuyer = async (req, res) => {
  try {
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      payustatususer,
      planName,
      ba_id,
    } = req.body;

    if (payustatususer !== 'pay now') {
      return res.status(400).json({ error: 'Invalid payment status for this endpoint.' });
    }

    // Generate hash for PayU
    const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Save payment in DB
    await PaymentPayUBuyer.create({
      txnid,
      status: 'process',
      amount,
      productinfo,
      firstname,
      email,
      phone,
      payustatususer,
      planName,
      payUdate: new Date().toISOString(),
      ba_id,
    });

    return res.json({
      key: MERCHANT_KEY,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      surl: 'https://ppcpondy.com/PPC/PPC/payu/success-buyer',
      furl: 'https://ppcpondy.com/PPC/PPC/payu/failure-buyer',
    //    surl: 'http://localhost:5000/PPC/payu/success',
    // furl: 'http://localhost:5000/PPC/payu/failure',
      service_provider: 'payu_paisa',
      hash,
    });
  } catch (error) {
    console.error("createPaymentBuyer error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Save Pay Later Request
exports.savePayLaterBuyer = async (req, res) => {
  try {
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      payustatususer,
      planName,
      ba_id,
    } = req.body;

    if (payustatususer !== 'pay later') {
      return res.status(400).json({ error: 'Invalid pay status for pay later.' });
    }

    await PaymentPayUBuyer.create({
      txnid,
      status: 'pending',
      amount,
      productinfo,
      firstname,
      email,
      phone,
      payustatususer,
      planName,
      payUdate: new Date().toISOString(),
      ba_id,
    });

    return res.json({ message: 'Pay later request saved successfully.' });
  } catch (error) {
    console.error("savePayLaterBuyer error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Handle PayU Success Callback
exports.handlePaymentSuccessBuyer = async (req, res) => {
  try {
    let {
      txnid,
      status,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      mihpayid,
      date,
      planName,
      ba_id,
    } = req.body;

    const payUdate = date || new Date().toISOString();

    // Sometimes planName is JSON stringified, parse it safely
    try {
      const parsedInfo = JSON.parse(planName);
      planName = parsedInfo.planName || planName;
    } catch {
      // if not JSON, use as is
    }

    await PaymentPayUBuyer.findOneAndUpdate(
      { txnid },
      {
        status: 'success',
        mihpayid,
        payUdate,
        payustatususer: 'paid',
        planName,
        ba_id,
      },
      { new: true }
    );

    const encodedDate = encodeURIComponent(payUdate);
    res.redirect(
      `https://ppcpondy.com/payment-success-buyer?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
    );
  } catch (error) {
    console.error("handlePaymentSuccessBuyer error:", error);
    res.status(500).send("Internal server error");
  }
};

// Handle PayU Failure Callback
exports.handlePaymentFailureBuyer = async (req, res) => {
  try {
    const {
      txnid,
      status,
      amount,
      firstname,
      email,
      phone,
      mihpayid,
      date,
      planName,
      ba_id,
    } = req.body;

    const payUdate = date || new Date().toISOString();

    await PaymentPayUBuyer.findOneAndUpdate(
      { txnid },
      {
        status: 'failure',
        mihpayid,
        payUdate,
        payustatususer: 'pay failed',
        planName,
        ba_id,
      },
      { new: true }
    );

    const encodedDate = encodeURIComponent(payUdate);
    res.redirect(
      `https://ppcpondy.com/payment-failure-buyer?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
    );
  } catch (error) {
    console.error("handlePaymentFailureBuyer error:", error);
    res.status(500).send("Internal server error");
  }
};

// Fetch Successful Payments
exports.getSuccessfulPaymentsBuyer = async (req, res) => {
  try {
    const payments = await PaymentPayUBuyer.find({ status: 'success' }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error("getSuccessfulPaymentsBuyer error:", error);
    res.status(500).send("Internal server error");
  }
};

// Fetch Failed Payments
exports.getFailedPaymentsBuyer = async (req, res) => {
  try {
    const payments = await PaymentPayUBuyer.find({ status: 'failure' }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error("getFailedPaymentsBuyer error:", error);
    res.status(500).send("Internal server error");
  }
};



















// // const crypto = require('crypto');
// // const PaymentPayUBuyer = require('./PayuBuyerModel');
// // const PricingPlans = require('../plans/PricingPlanModel');
// // const AddModel = require('../AddModel');

// // const MERCHANT_KEY = 'Qmgxku';
// // const SALT = 'WUEzPab2A977ygBtkE6dSzsB65ebLsOc';

// // // Step 1: Create payment and generate hash for Pay Now
// // exports.createPaymentBuyer = async (req, res) => {
// //   const {
// //     txnid,
// //     amount,
// //     productinfo,
// //     firstname,
// //     email,
// //     phone,
// //     payustatususer,
// //     planName,
// //     ba_id, // ✅ added
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
// //     surl: 'https://ppcpondy.com/PPC/payu/success',
// // furl: 'https://ppcpondy.com/PPC/payu/failure',

// //     service_provider: 'payu_paisa',
// //   };

// //   // Generate hash
// //   const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
// //   const hash = crypto.createHash('sha512').update(hashString).digest('hex');

// //   // Save payment
// //   await PaymentPayUBuyer.create({
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
// //     ba_id, // ✅ added
// //   });

// //   return res.json({ ...data, hash });
// // };

// // // Step 2: Save pay later request
// // exports.savePayLaterBuyer = async (req, res) => {
// //   const {
// //     txnid,
// //     amount,
// //     productinfo,
// //     firstname,
// //     email,
// //     phone,
// //     payustatususer,
// //     planName,
// //     ba_id, // ✅ added
// //   } = req.body;

// //   if (payustatususer !== 'pay later') {
// //     return res.status(400).json({ error: 'Invalid pay status for pay later.' });
// //   }

// //   await PaymentPayUBuyer.create({
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
// //     ba_id, // ✅ added
// //   });

  

// //   return res.json({ message: 'Pay later request saved successfully.' });
// // };

// // // Step 3: Handle PayU success callback
// // exports.handlePaymentSuccessBuyer = async (req, res) => {
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
// //     ba_id, // ✅ added
// //   } = req.body;

// //   const payUdate = date || new Date().toISOString();

// //   try {
// //     const parsedInfo = JSON.parse(planName);
// //     planName = parsedInfo.planName;
// //   } catch (err) {
// //     console.error("Invalid planName JSON:", err);
// //   }

// //   await PaymentPayUBuyer.findOneAndUpdate(
// //     { txnid },
// //     {
// //       status: 'success',
// //       mihpayid,
// //       payUdate,
// //       payustatususer: 'paid',
// //       planName,
// //       ba_id, // ✅ added
// //     },
// //     { new: true }
// //   );

// //   const encodedDate = encodeURIComponent(payUdate);
// //   res.redirect(
// //     `https://ppcpondy.com/payment-success-buyer?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
// //   );
// // };

// // // Step 4: Handle PayU failure callback
// // exports.handlePaymentFailureBuyer = async (req, res) => {
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
// //     ba_id, // ✅ added
// //   } = req.body;

// //   const payUdate = date || new Date().toISOString();

// //   await PaymentPayUBuyer.findOneAndUpdate(
// //     { txnid },
// //     {
// //       status: 'failure',
// //       mihpayid,
// //       payUdate,
// //       payustatususer: 'pay failed',
// //       planName,
// //       ba_id, // ✅ added
// //     },
// //     { new: true }
// //   );

// //   const encodedDate = encodeURIComponent(payUdate);
// //   res.redirect(
// //     `https://ppcpondy.com/payment-failure-buyer?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
// //   );
// // };


// // // Step 5: Fetch successful payments
// // exports.getSuccessfulPaymentsBuyer = async (req, res) => {
// //   const payments = await PaymentPayUBuyer.find({ status: 'success' }).sort({ createdAt: -1 });
// //   res.json(payments);
// // };

// // // Step 6: Fetch failed payments
// // exports.getFailedPaymentsBuyer = async (req, res) => {
// //   const payments = await PaymentPayUBuyer.find({ status: 'failure' }).sort({ createdAt: -1 });
// //   res.json(payments);
// // };














// const crypto = require('crypto');
// const PaymentPayUBuyer = require('./PayuBuyerModel');

// const MERCHANT_KEY = 'Qmgxku';
// const SALT = 'WUEzPab2A977ygBtkE6dSzsB65ebLsOc';

// // Create Payment (Pay Now)
// exports.createPaymentBuyer = async (req, res) => {
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
//       ba_id,
//     } = req.body;

//     if (payustatususer !== 'pay now') {
//       return res.status(400).json({ error: 'Invalid payment status for this endpoint.' });
//     }

//     // Generate hash for PayU
//     const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
//     const hash = crypto.createHash('sha512').update(hashString).digest('hex');

//     // Save payment in DB
//     await PaymentPayUBuyer.create({
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
//       ba_id,
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
//     //    surl: 'http://localhost:5000/PPC/payu/success',
//     // furl: 'http://localhost:5000/PPC/payu/failure',
//       service_provider: 'payu_paisa',
//       hash,
//     });
//   } catch (error) {
//     console.error("createPaymentBuyer error:", error);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

// // Save Pay Later Request
// exports.savePayLaterBuyer = async (req, res) => {
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
//       ba_id,
//     } = req.body;

//     if (payustatususer !== 'pay later') {
//       return res.status(400).json({ error: 'Invalid pay status for pay later.' });
//     }

//     await PaymentPayUBuyer.create({
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
//       ba_id,
//     });

//     return res.json({ message: 'Pay later request saved successfully.' });
//   } catch (error) {
//     console.error("savePayLaterBuyer error:", error);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

// // Handle PayU Success Callback
// exports.handlePaymentSuccessBuyer = async (req, res) => {
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
//       ba_id,
//     } = req.body;

//     const payUdate = date || new Date().toISOString();

//     // Sometimes planName is JSON stringified, parse it safely
//     try {
//       const parsedInfo = JSON.parse(planName);
//       planName = parsedInfo.planName || planName;
//     } catch {
//       // if not JSON, use as is
//     }

//     await PaymentPayUBuyer.findOneAndUpdate(
//       { txnid },
//       {
//         status: 'success',
//         mihpayid,
//         payUdate,
//         payustatususer: 'paid',
//         planName,
//         ba_id,
//       },
//       { new: true }
//     );

//     const encodedDate = encodeURIComponent(payUdate);
//     res.redirect(
//       `https://ppcpondy.com/payment-success-buyer?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
//     );
//   } catch (error) {
//     console.error("handlePaymentSuccessBuyer error:", error);
//     res.status(500).send("Internal server error");
//   }
// };

// // Handle PayU Failure Callback
// exports.handlePaymentFailureBuyer = async (req, res) => {
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
//       ba_id,
//     } = req.body;

//     const payUdate = date || new Date().toISOString();

//     await PaymentPayUBuyer.findOneAndUpdate(
//       { txnid },
//       {
//         status: 'failure',
//         mihpayid,
//         payUdate,
//         payustatususer: 'pay failed',
//         planName,
//         ba_id,
//       },
//       { new: true }
//     );

//     const encodedDate = encodeURIComponent(payUdate);
//     res.redirect(
//       `https://ppcpondy.com/payment-failure-buyer?txnid=${txnid}&firstname=${firstname}&status=${status}&amount=${amount}&email=${email}&phone=${phone}&mihpayid=${mihpayid}&payUdate=${encodedDate}&planName=${planName}`
//     );
//   } catch (error) {
//     console.error("handlePaymentFailureBuyer error:", error);
//     res.status(500).send("Internal server error");
//   }
// };

// // Fetch Successful Payments
// exports.getSuccessfulPaymentsBuyer = async (req, res) => {
//   try {
//     const payments = await PaymentPayUBuyer.find({ status: 'success' }).sort({ createdAt: -1 });
//     res.json(payments);
//   } catch (error) {
//     console.error("getSuccessfulPaymentsBuyer error:", error);
//     res.status(500).send("Internal server error");
//   }
// };

// // Fetch Failed Payments
// exports.getFailedPaymentsBuyer = async (req, res) => {
//   try {
//     const payments = await PaymentPayUBuyer.find({ status: 'failure' }).sort({ createdAt: -1 });
//     res.json(payments);
//   } catch (error) {
//     console.error("getFailedPaymentsBuyer error:", error);
//     res.status(500).send("Internal server error");
//   }
// };
