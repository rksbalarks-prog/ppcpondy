const express = require('express');
const router = express.Router();
const PaymentPayUBuyer = require('../PayuBuyer/PayuBuyerModel');

/*
  Customer Direct PayU
  --------------------
  The user app's floating "Pay Now" button (User app: Components/PayNow.jsx)
  lets a customer pay any custom amount (> Rs.100). It reuses the existing
  PayU buyer endpoint, so these rows already live in the PaymentPayUBuyer
  collection. They are uniquely identifiable by:

      productinfo === 'Pondy Properties Payment'   (set only by PayNow.jsx)

  Real Buyer-Assistance payments use productinfo 'Subscription Plan', so this
  marker cleanly separates the two. `productinfo` is sent to PayU and echoed
  back in the success/failure callback, so it survives unchanged — making it a
  reliable discriminator.

  These read-only endpoints feed the admin "Customer direct PayU" menu
  (submenus: Paid, Failed). Nothing existing is modified.
*/
const DIRECT_MARKER = 'Pondy Properties Payment';

// Paid — successful direct customer payments (newest first)
router.get('/payu-direct/paid', async (req, res) => {
  try {
    const payments = await PaymentPayUBuyer.find({
      productinfo: DIRECT_MARKER,
      status: 'success',
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, total: payments.length, payments });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching direct paid payments.',
      error: error.message,
    });
  }
});

// Failed — failed direct customer payments (newest first)
router.get('/payu-direct/failed', async (req, res) => {
  try {
    const payments = await PaymentPayUBuyer.find({
      productinfo: DIRECT_MARKER,
      status: 'failure',
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, total: payments.length, payments });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching direct failed payments.',
      error: error.message,
    });
  }
});

module.exports = router;
