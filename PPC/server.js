
require('dotenv').config();
const express = require('express');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { generateOTP, storeOTP, verifyOTP } = require('./otpUtils');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Per-request city-base (ALL/PY/CH) scope, carried via AsyncLocalStorage so the
// city-scope mongoose plugin can auto-filter list/count/aggregate queries.
const baseScope = require('./utils/baseScope');

// Import all your routers
const AddRouters = require('./AddRouters'); 
const AddRouter = require('./AddRouter'); 
const PricingPlanRouter = require('./plans/PricingPlanRouter');
const AdminRouter = require('./Admin/AdminRouter');
const OtpNumberRouter = require('./Otp/OtpNumberRouter');
const OfficeRouter = require('./Office/OfficeRouter');
const BuyerRouter = require('./BuyerPlan/BuyerRouter');
const AreaRouter = require('./Places/AreaRouter');
const CityRouter = require('./Places/CityRouter');
const StateRouter = require('./Places/StateRouter');
const DistrictRouter = require('./Places/DistrictRouter');
const RollRouter = require('./Roll/RollRouter');
const DetailRouter = require('./Details/DetailRouter');
const OfferRouter = require('./Offer/OfferRouter');
const DataRouter = require('./SendDataAdmin/DataRouter');
const UserRouter = require('./user/UserRouter');
const BuyerAssistanceRouter = require('./BuyerAssistance/BuyerAssistanceRouter');
const PhotoRequestRouter = require('./Photo/PhotoRequestRouter');
const ProfileRouter = require('./MyProfile/ProfileRouter');
const ContactUsRouter = require('./ContactUs/ContactUsRouter');
const TextRouter = require('./TextEdider/TextRouter');
const NotificationRouter = require('./Notification/NotificationRouter');
const VisitAdminRouter = require('./visit/VisitAdminRouter');
const AdminRollRouter = require('./AdminRolls/AdminRollRouter');
const PaymentTypeRouter = require('./Payment/PaymentTypeRouter');
const FollowUpRouter = require('./FollowUp/FollowUpRouter');
const BillRouter = require('./CreateBill/BillRouter');
const FollowUpBuyerRouter = require('./FollowUp/FollowUpBuyerRouter');
const VisitorFollowUpRouter = require('./FollowUp/VisitorFollowUpRouter');
const RingFollowUpRouter = require('./FollowUp/RingFollowUpRouter');
const LimitRouter = require('./Limit/LimitRouter');
const UploadImageRouter = require('./UploadImageRouter');
const BrideImageRouter = require('./BrideImageRouter');
const payuRoutes = require('./PayU/payu.routes'); 
const propertyRoutes = require('./controllers/propertyRoutes');
const payuBuyerRoutes = require('./PayuBuyer/payu.buyer.routes');
const payuDirectRoutes = require('./PayuDirect/payu.direct.routes');
const BuyerBillRouter = require('./CreateBuyerBill/BuyerBillRouter');
const PropertyMessageRouter = require ('./PropertyMessage/PropertyMessageRouter')
const AdsRouter = require('./Ads/AdsRouter')
const AdsDetailRouter = require('./AdsDetail/AdsDetailRouter')
const SingleSendRouter = require('./SingleSendWhatsapp/Singlesendmsgrouter'); // New router for single message sending
const PointsRouter = require('./Points/PointsRouter');
const PointsPricingRouter = require('./Points/PointsPricingRouter');
const RcmRouter = require('./Rcm/RcmRouter');
// XML sitemaps for the public site, generated live from the properties
// collection so new listings are crawlable without a frontend redeploy.
const SeoSitemapRouter = require('./seo/sitemapRouter');
// Server-rendered listing pages for link-preview bots (WhatsApp, Facebook,
// X, LinkedIn) that never execute the SPA's JavaScript.
const SeoPrerenderRouter = require('./seo/prerenderRouter');

const UserLogin = require('./user/UserModel'); // Import your UserLogin model
const EditBuyerBillRouter = require('./EditBuyerBill/EditBuyerBillRouter');
const messageRoutes = require('./messageRoutes'); // New router for message handling
const { sendUserOtpSms } = require('./utils/smsSender'); // SMS IDEA sender for user-side OTP
const DownloadHistoryRouter = require('./DownloadHistory/DownloadHistoryRouter'); // admin download audit log
const assistant = require('./assistant'); // AI voice + chat assistant (additive layer)
const FcmTokenRouter = require('./fcm/FcmTokenRouter'); // FCM push notifications (additive)
// Adexpress classified-weekly importer (additive: own collections + own routes)
const AdExpressRouter = require('./AdExpress/AdExpressRouter');
const adExpressSchedule = require('./AdExpress/schedule');

// Scheduled e-mail reports (additive layers — each stays asleep without SMTP_*
// in .env). DataAddedMail owns the shared nodemailer transport that the other
// two, and BackupMail/backupEmail.js, all send through.
const dataAddedMail = require('./DataAddedMail');   // monthly Data Added summary
const adminReportMail = require('./AdminReportMail'); // daily Admin Report PDF
const adminExcelMail = require('./AdminExcelMail');   // daily Admin Detail xlsx

const app = express();
const PORT = process.env.PORT || 5006;
const mongoURI = process.env.MONGO_URI;

// Configure AWS SNS client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Database connection failed:", err));

// Middleware
app.use(cors());
// app.use(express.json());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));




app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit:'100mb'}));

// City-base scope: bind this request's ?base= (ALL/PY/CH, sent by the admin
// and user apps) to the async context so the city-scope mongoose plugin can
// filter every list/count/aggregate query automatically. No base or 'ALL'
// means no restriction, so this is backwards-compatible.
app.use((req, res, next) => {
  baseScope.runWithBase(req.query && req.query.base, next);
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));






// OTP Endpoints with full UserLogin integration
app.post('/PPC/send-otp', async (req, res) => {
  let { phoneNumber, loginMode = 'app', version, countryCode } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Normalize phone number
  phoneNumber = phoneNumber.replace(/\D/g, '');
  
  if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
    phoneNumber = `+${phoneNumber}`;
  } else if (phoneNumber.length === 10) {
    phoneNumber = `+91${phoneNumber}`;
  } else if (!phoneNumber.startsWith('+91')) {
    return res.status(400).json({ error: 'Invalid Indian phone number format' });
  }

  // Check if user is banned or deleted
  try {
    const phoneDigits = phoneNumber.replace(/\D/g, '').slice(-10);
    const existingUser = await UserLogin.findOne({ 
      phone: phoneDigits,
      status: { $in: ['banned', 'deleted'] }
    }).sort({ loginDate: -1 });

    if (existingUser) {
      if (existingUser.status === 'banned') {
        return res.status(403).json({ 
          error: 'Account banned',
          bannedDate: existingUser.bannedDate,
          bannedReason: existingUser.bannedReason,
          staffName: existingUser.staffName
        });
      }
      if (existingUser.status === 'deleted') {
        return res.status(403).json({ 
          error: 'Account deleted',
          deletedDate: existingUser.deletedDate
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error checking account status' });
  }

  // Generate new OTP. The SMS body itself lives in utils/smsSender.js — it has
  // to stay byte-identical to the DLT-registered template, so it gets exactly
  // one home rather than a copy per call site.
  const otp = generateOTP();

  try {
    // const params = {
    //   Message: message,
    //   PhoneNumber: phoneNumber,
    //   MessageAttributes: {
    //     'SMSType': {
    //       DataType: 'String',
    //       StringValue: 'Transactional'
    //     },
    //     'SenderID': {
    //       DataType: 'String',
    //       StringValue: process.env.SENDER_ID || 'PONDYY'
    //     },
    //     'EntityId': {
    //       DataType: 'String',
    //       StringValue: process.env.DLT_ENTITY_ID
    //     },
    //     'TemplateId': {
    //       DataType: 'String',
    //       StringValue: process.env.DLT_TEMPLATE_ID
    //     }
    //   }
    // };
    
    // ❌ AWS SNS OTP sending — not working, commented out.
    // const params = {
    //   Message: message,
    //   PhoneNumber: phoneNumber,
    //   MessageAttributes: {
    //     'AWS.SNS.SMS.SMSType': {
    //       DataType: 'String',
    //       StringValue: 'Transactional'
    //     },
    //     'AWS.SNS.SMS.SenderID': {
    //       DataType: 'String',
    //       StringValue: process.env.SENDER_ID || 'PONDYY'
    //     },
    //     'AWS.MM.SMS.EntityId': {
    //       DataType: 'String',
    //       StringValue: process.env.DLT_ENTITY_ID
    //     },
    //     'AWS.MM.SMS.TemplateId': {
    //       DataType: 'String',
    //       StringValue: process.env.DLT_TEMPLATE_ID
    //     }
    //   }
    // };
    //
    // const command = new PublishCommand(params);
    // const result = await snsClient.send(command);

    // ✅ SMS IDEA OTP sending (same mechanism as /send-otp-login) — working.
    const smsMobile = phoneNumber.replace(/\D/g, '').slice(-10);
    const smsResult = await sendUserOtpSms(smsMobile, otp);

    if (!smsResult.success) {
      return res.status(500).json({
        error: 'Failed to send OTP',
        details: smsResult.message
      });
    }

     await UserLogin.create({
      phone: phoneNumber.replace(/\D/g, '').slice(-10),
      otp,
      loginDate: new Date(),
      otpStatus: 'pending',
      countryCode: countryCode || '+91',
      loginMode, // Ensure loginMode is saved
      version,
      status: 'active'
    });
    
    res.status(200).json({
      message: 'OTP sent successfully',
      result: {
        // messageId: result.MessageId, // ❌ AWS SNS result — not working, commented out.
        messageId: smsResult.message, // ✅ SMS IDEA result
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to send OTP',
      details: error.message
    });
  }
});



app.post('/PPC/verify-otp', async (req, res) => {
  const { phoneNumber, otp } = req.body;
  
  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: 'Phone number and OTP are required' });
  }

  try {
    // Normalize phone number
    const phoneDigits = phoneNumber.replace(/\D/g, '').slice(-10);
    
    // Find the most recent OTP for this phone number
    const userLogin = await UserLogin.findOne({
      phone: phoneDigits,
      otpStatus: 'pending'
    }).sort({ loginDate: -1 });

    if (!userLogin) {
      return res.status(404).json({ error: 'No pending OTP found for this number' });
    }

    // Check if OTP matches and is not expired (5 minute expiry)
    const isOtpValid = userLogin.otp === otp;
    const isOtpExpired = new Date() - userLogin.loginDate > 5 * 60 * 1000;

    if (!isOtpValid) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    if (isOtpExpired) {
      return res.status(401).json({ error: 'OTP expired' });
    }

    // Update the record to mark as verified
    userLogin.otpStatus = 'verified';
    await userLogin.save();

    res.status(200).json({ 
      message: 'OTP verified successfully',
      user: {
        phone: userLogin.phone,
        countryCode: userLogin.countryCode,
        status: userLogin.status,
        loginDate: userLogin.loginDate,
        loginMode: userLogin.loginMode, // Added loginMode
        version: userLogin.version,
        otpStatus: userLogin.otpStatus // Added otpStatus
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error verifying OTP',
      details: error.message
    });
  }
});




// Admin endpoint to ban a user
app.post('/admin/ban-user', async (req, res) => {
  const { phoneNumber, reason, staffName } = req.body;
  
  if (!phoneNumber || !reason || !staffName) {
    return res.status(400).json({ error: 'Phone number, reason and staff name are required' });
  }

  try {
    const phoneDigits = phoneNumber.replace(/\D/g, '').slice(-10);
    const user = await UserLogin.findOneAndUpdate(
      { phone: phoneDigits },
      {
        status: 'banned',
        bannedDate: new Date(),
        bannedReason: reason,
        staffName,
        remarks: `Banned by ${staffName} for: ${reason}`,
        reportDate: new Date()
      },
      { new: true, sort: { loginDate: -1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      message: 'User banned successfully',
      user: {
        phone: user.phone,
        status: user.status,
        bannedDate: user.bannedDate,
        bannedReason: user.bannedReason,
        staffName: user.staffName
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error banning user' });
  }
});

// Endpoint to get user login history
app.get('/user-login-history/:phoneNumber', async (req, res) => {
  try {
    const phoneDigits = req.params.phoneNumber.replace(/\D/g, '').slice(-10);
    const history = await UserLogin.find({ phone: phoneDigits })
      .sort({ loginDate: -1 })
      .limit(10);

    res.status(200).json({
      count: history.length,
      history: history.map(record => ({
        loginDate: record.loginDate,
        loginMode: record.loginMode,
        status: record.status,
        version: record.version,
        otpStatus: record.otpStatus
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching login history' });
  }
});


// Mount all routers under /PPC prefix
// SEO sitemaps first: /PPC/sitemap*.xml must not be shadowed by any other
// router (SingleSendRouter's catch-all GET "/:id" in particular).
app.use('/PPC', SeoSitemapRouter);
app.use('/PPC', SeoPrerenderRouter);
app.use("/PPC", AddRouter);
app.use("/PPC", AddRouters);
app.use("/PPC", PricingPlanRouter);
app.use("/PPC", AdminRouter);
app.use("/PPC", OtpNumberRouter);
app.use("/PPC", OfficeRouter);
app.use("/PPC", BuyerRouter);
app.use("/PPC", CityRouter);
app.use("/PPC", AreaRouter);
app.use("/PPC", DistrictRouter);
app.use("/PPC", StateRouter);
app.use("/PPC", RollRouter);
app.use("/PPC", DetailRouter);
app.use("/PPC", OfferRouter);
app.use('/PPC', DataRouter);
app.use('/PPC', UserRouter);
app.use('/PPC', BuyerAssistanceRouter);
app.use('/PPC', PhotoRequestRouter);
app.use('/PPC', ProfileRouter);
app.use('/PPC', ContactUsRouter);
app.use('/PPC', TextRouter);
app.use('/PPC', NotificationRouter);
app.use('/PPC', VisitAdminRouter);
app.use('/PPC', AdminRollRouter);
app.use('/PPC', PaymentTypeRouter);
app.use('/PPC', FollowUpRouter);
app.use('/PPC', FollowUpBuyerRouter);
app.use('/PPC', VisitorFollowUpRouter);
app.use('/PPC', RingFollowUpRouter);
app.use('/PPC', BillRouter);
app.use('/PPC', LimitRouter);
app.use("/PPC", UploadImageRouter);
app.use("/PPC", BrideImageRouter);
app.use('/PPC', payuRoutes);
app.use('/PPC', propertyRoutes);
app.use('/PPC', payuBuyerRoutes);
app.use('/PPC', payuDirectRoutes);
app.use('/PPC', BuyerBillRouter);
app.use('/PPC', PropertyMessageRouter)
app.use('/PPC', AdsRouter)
app.use('/PPC', AdsDetailRouter)
// Points module: mount BEFORE SingleSendRouter — SingleSend has a catch-all
// GET "/:id" that would otherwise swallow GET /PPC/points-plans, /points-users,
// /points-transactions, /points-paylater, /points-config and try to cast the
// segment to a Mongo ObjectId.
app.use('/PPC', PointsRouter);
app.use('/PPC', PointsPricingRouter);
// Rent Pondy WFH Call Management — must be mounted BEFORE SingleSendRouter
// (its catch-all GET "/:id" would otherwise swallow GET /PPC/rcm/* paths).
app.use('/PPC', RcmRouter);
// Mount BEFORE SingleSendRouter — its catch-all GET "/:id" would otherwise
// swallow GET /PPC/get-download-history and 500 on the ObjectId cast.
app.use('/PPC', DownloadHistoryRouter);
// AI assistant (voice + chat). Self-contained additive layer — mounts
// /api/assistant/* plus its own /PPC/assistant/* search + admin routes. Mounted
// BEFORE SingleSendRouter for the same reason as the routers above (its catch-all
// GET "/:id" is greedy). No-ops entirely when ASSISTANT_ENABLED=false.
assistant.mount(app);
// FCM push notifications. Additive: own collection (fcm_tokens), own named
// Firebase app. Mounted BEFORE SingleSendRouter — its catch-all GET "/:id"
// would otherwise swallow GET /PPC/push-stats and 500 on the ObjectId cast.
app.use('/PPC', FcmTokenRouter);
// Scheduled report mails: status + send-now controls. Mounted BEFORE
// SingleSendRouter for the same reason as the routers above — its catch-all
// GET "/:id" is greedy.
app.use('/PPC', dataAddedMail.router);
app.use('/PPC', adminReportMail.router);
app.use('/PPC', adminExcelMail.router);
app.use('/PPC', SingleSendRouter)
app.use('/PPC', EditBuyerBillRouter);
app.use('/PPC', messageRoutes);
app.use('/PPC', AdExpressRouter); // Adexpress import: /adexpress/* (staging only)


// 404 Error Handling Middleware
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

// Start Server
app.listen(PORT, () => {
  // Arm the report schedules once the port is bound. Each start() is fail-soft:
  // with no SMTP credentials it logs one line and stays asleep.
  dataAddedMail.start();
  adminReportMail.start();
  adminExcelMail.start();
  // Nightly Adexpress pickup: newest issue -> sale ads -> PreApproved.
  adExpressSchedule.start();
});







// require('dotenv').config();
// const express = require('express');
// const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
// const { generateOTP, storeOTP, verifyOTP } = require('./otpUtils');
// const axios = require('axios');
// const bodyParser = require('body-parser');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');

// // Import all your routers
// const AddRouters = require('./AddRouters'); 
// const AddRouter = require('./AddRouter'); 
// const PricingPlanRouter = require('./plans/PricingPlanRouter');
// const AdminRouter = require('./Admin/AdminRouter');
// const OfficeRouter = require('./Office/OfficeRouter');
// const BuyerRouter = require('./BuyerPlan/BuyerRouter');
// const AreaRouter = require('./Places/AreaRouter');
// const CityRouter = require('./Places/CityRouter');
// const StateRouter = require('./Places/StateRouter');
// const DistrictRouter = require('./Places/DistrictRouter');
// const RollRouter = require('./Roll/RollRouter');
// const DetailRouter = require('./Details/DetailRouter');
// const OfferRouter = require('./Offer/OfferRouter');
// const DataRouter = require('./SendDataAdmin/DataRouter');
// const UserRouter = require('./user/UserRouter');
// const BuyerAssistanceRouter = require('./BuyerAssistance/BuyerAssistanceRouter');
// const PhotoRequestRouter = require('./Photo/PhotoRequestRouter');
// const ProfileRouter = require('./MyProfile/ProfileRouter');
// const ContactUsRouter = require('./ContactUs/ContactUsRouter');
// const TextRouter = require('./TextEdider/TextRouter');
// const NotificationRouter = require('./Notification/NotificationRouter');
// const VisitAdminRouter = require('./visit/VisitAdminRouter');
// const AdminRollRouter = require('./AdminRolls/AdminRollRouter');
// const PaymentTypeRouter = require('./Payment/PaymentTypeRouter');
// const FollowUpRouter = require('./FollowUp/FollowUpRouter');
// const BillRouter = require('./CreateBill/BillRouter');
// const FollowUpBuyerRouter = require('./FollowUp/FollowUpBuyerRouter');
// const LimitRouter = require('./Limit/LimitRouter');
// const UploadImageRouter = require('./UploadImageRouter');
// const BrideImageRouter = require('./BrideImageRouter');
// const payuRoutes = require('./PayU/payu.routes'); 
// const propertyRoutes = require('./controllers/propertyRoutes'); 
// const payuBuyerRoutes = require('./PayuBuyer/payu.buyer.routes'); 
// const BuyerBillRouter = require('./CreateBuyerBill/BuyerBillRouter');
// const PropertyMessageRouter = require ('./PropertyMessage/PropertyMessageRouter')
// const AdsRouter = require('./Ads/AdsRouter')
// const AdsDetailRouter = require('./AdsDetail/AdsDetailRouter')

// // const tokenRouter = require('./routess/tokenRouter');
// // const notificationRouter = require('./routess/notificationRouter');

// const UserLogin = require('./user/UserModel'); // Import your UserLogin model

// // Firebase Admin SDK for push notifications
// const admin = require("firebase-admin");
// const serviceAccount = require("./serviceAccountKey.json");
// const UserToken = require("./models/UserToken"); // Make sure this model exists

// const app = express();
// const PORT = process.env.PORT || 5006;
// const mongoURI = process.env.MONGO_URI;

// // Configure AWS SNS client
// const snsClient = new SNSClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// // Initialize Firebase Admin SDK
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// // Connect to MongoDB
// mongoose.connect(mongoURI)
//   .then(() => console.log("Database connected successfully"))
//   .catch((err) => console.error("Database connection failed:", err));

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: '100mb' }));
// app.use(express.urlencoded({ extended: true, limit: '100mb' }));
// app.use(bodyParser.json({ limit: '100mb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit:'100mb'}));

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Register FCM token endpoint


// // OTP Endpoints with full UserLogin integration and token registration



// // OTP Endpoints with full UserLogin integration






// // Add a simple token registration endpoint
// app.post('/PPC/register-token', async (req, res) => {
//   try {
//     const { phoneNumber, fcmToken } = req.body;
    
//     if (!phoneNumber || !fcmToken) {
//       return res.status(400).json({ error: 'Phone number and token required' });
//     }

//     // Normalize phone number
//     const phoneDigits = phoneNumber.replace(/\D/g, '').slice(-10);
    
//     const tokenSaved = await UserToken.findOneAndUpdate(
//       { phoneNumber: phoneDigits },
//       { fcmToken },
//       { upsert: true, new: true }
//     );
    
//     res.json({ success: true, message: "Token saved" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Add a simple notification sending endpoint
// app.post('/PPC/send-push-notification', async (req, res) => {
//   try {
//     const { userPhoneNumber, message, type = 'notification' } = req.body;
    
//     // Normalize phone number
//     const phoneDigits = userPhoneNumber.replace(/\D/g, '').slice(-10);
    
//     // Find user token
//     const user = await UserToken.findOne({ phoneNumber: phoneDigits });
    
//     if (!user || !user.fcmToken) {
//       return res.status(404).json({ error: "No FCM token found for this user" });
//     }
    
//     // Here you would typically send the notification using a different service
//     // For now, we'll just log it
//     console.log(`Would send notification to ${phoneDigits}: ${message}`);
    
//     res.json({ 
//       success: true, 
//       message: "Notification queued for sending",
//       notification: {
//         to: phoneDigits,
//         message: message,
//         type: type
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Mount all routers under /PPC prefix
// app.use("/PPC", AddRouter);
// app.use("/PPC", AddRouters);
// app.use("/PPC", PricingPlanRouter);
// app.use("/PPC", AdminRouter);
// app.use("/PPC", OfficeRouter);
// app.use("/PPC", BuyerRouter);
// app.use("/PPC", CityRouter);
// app.use("/PPC", AreaRouter);
// app.use("/PPC", DistrictRouter);
// app.use("/PPC", StateRouter);
// app.use("/PPC", RollRouter);
// app.use("/PPC", DetailRouter);
// app.use("/PPC", OfferRouter);
// app.use('/PPC', DataRouter);
// app.use('/PPC', UserRouter);
// app.use('/PPC', BuyerAssistanceRouter);
// app.use('/PPC', PhotoRequestRouter);
// app.use('/PPC', ProfileRouter);
// app.use('/PPC', ContactUsRouter);
// app.use('/PPC', TextRouter);
// app.use('/PPC', NotificationRouter);
// app.use('/PPC', VisitAdminRouter);
// app.use('/PPC', AdminRollRouter);
// app.use('/PPC', PaymentTypeRouter);
// app.use('/PPC', FollowUpRouter);
// app.use('/PPC', FollowUpBuyerRouter);
// app.use('/PPC', BillRouter);
// app.use('/PPC', LimitRouter);
// app.use("/PPC", UploadImageRouter);
// app.use("/PPC", BrideImageRouter);
// app.use('/PPC', payuRoutes);
// app.use('/PPC', propertyRoutes);
// app.use('/PPC', payuBuyerRoutes);
// app.use('/PPC', BuyerBillRouter);
// app.use('/PPC', PropertyMessageRouter)
// app.use('/PPC', AdsRouter)
// app.use('/PPC', AdsDetailRouter)
// // app.use('/PPC', tokenRouter);         // POST /PPC/user-tokens
// // app.use('/PPC', notificationRouter);  // POST /PPC/notifications


// app.post('/PPC/send-otp', async (req, res) => {
//   let { phoneNumber, loginMode = 'app', version, countryCode } = req.body;

//   if (!phoneNumber) {
//     return res.status(400).json({ error: 'Phone number is required' });
//   }

//   // Normalize phone number
//   phoneNumber = phoneNumber.replace(/\D/g, '');
  
//   if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
//     phoneNumber = `+${phoneNumber}`;
//   } else if (phoneNumber.length === 10) {
//     phoneNumber = `+91${phoneNumber}`;
//   } else if (!phoneNumber.startsWith('+91')) {
//     return res.status(400).json({ error: 'Invalid Indian phone number format' });
//   }

//   // Check if user is banned or deleted
//   try {
//     const phoneDigits = phoneNumber.replace(/\D/g, '').slice(-10);
//     const existingUser = await UserLogin.findOne({ 
//       phone: phoneDigits,
//       status: { $in: ['banned', 'deleted'] }
//     }).sort({ loginDate: -1 });

//     if (existingUser) {
//       if (existingUser.status === 'banned') {
//         return res.status(403).json({ 
//           error: 'Account banned',
//           bannedDate: existingUser.bannedDate,
//           bannedReason: existingUser.bannedReason,
//           staffName: existingUser.staffName
//         });
//       }
//       if (existingUser.status === 'deleted') {
//         return res.status(403).json({ 
//           error: 'Account deleted',
//           deletedDate: existingUser.deletedDate
//         });
//       }
//     }
//   } catch (error) {
//     return res.status(500).json({ error: 'Error checking account status' });
//   }

//   // Generate new OTP
//   const otp = generateOTP();
//   const message = `Your OTP is: ${otp}. Thanks for using PPC Pondy`;

//   try {
//     const params = {
//       Message: message,
//       PhoneNumber: phoneNumber,
//       MessageAttributes: {
//         'SMSType': {
//           DataType: 'String',
//           StringValue: 'Transactional'
//         },
//         'SenderID': {
//           DataType: 'String',
//           StringValue: process.env.SENDER_ID || 'PONDYY'
//         },
//         'EntityId': {
//           DataType: 'String',
//           StringValue: process.env.DLT_ENTITY_ID
//         },
//         'TemplateId': {
//           DataType: 'String',
//           StringValue: process.env.DLT_TEMPLATE_ID
//         }
//       }
//     };

//     const command = new PublishCommand(params);
//     const result = await snsClient.send(command);
    
//      await UserLogin.create({
//       phone: phoneNumber.replace(/\D/g, '').slice(-10),
//       otp,
//       loginDate: new Date(),
//       otpStatus: 'pending',
//       countryCode: countryCode || '+91',
//       loginMode, // Ensure loginMode is saved
//       version,
//       status: 'active'
//     });
    
//     res.status(200).json({ 
//       message: 'OTP sent successfully',
//       result: {
//         messageId: result.MessageId,
//         otp: process.env.NODE_ENV === 'development' ? otp : undefined
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       error: 'Failed to send OTP',
//       details: error.message
//     });
//   }
// });

// app.post('/PPC/verify-otp', async (req, res) => {
//   const { phoneNumber, otp } = req.body;
  
//   if (!phoneNumber || !otp) {
//     return res.status(400).json({ error: 'Phone number and OTP are required' });
//   }

//   try {
//     // Normalize phone number
//     const phoneDigits = phoneNumber.replace(/\D/g, '').slice(-10);
    
//     // Find the most recent OTP for this phone number
//     const userLogin = await UserLogin.findOne({
//       phone: phoneDigits,
//       otpStatus: 'pending'
//     }).sort({ loginDate: -1 });

//     if (!userLogin) {
//       return res.status(404).json({ error: 'No pending OTP found for this number' });
//     }

//     // Check if OTP matches and is not expired (5 minute expiry)
//     const isOtpValid = userLogin.otp === otp;
//     const isOtpExpired = new Date() - userLogin.loginDate > 5 * 60 * 1000;

//     if (!isOtpValid) {
//       return res.status(401).json({ error: 'Invalid OTP' });
//     }

//     if (isOtpExpired) {
//       return res.status(401).json({ error: 'OTP expired' });
//     }

//     // Update the record to mark as verified
//     userLogin.otpStatus = 'verified';
//     await userLogin.save();

//     res.status(200).json({ 
//       message: 'OTP verified successfully',
//       user: {
//         phone: userLogin.phone,
//         countryCode: userLogin.countryCode,
//         status: userLogin.status,
//         loginDate: userLogin.loginDate,
//         loginMode: userLogin.loginMode, // Added loginMode
//         version: userLogin.version,
//         otpStatus: userLogin.otpStatus // Added otpStatus
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       error: 'Error verifying OTP',
//       details: error.message
//     });
//   }
// });

// // 404 Error Handling Middleware
// app.use((req, res, next) => {
//   res.status(404).json({ message: "Route not found" });
// });

// // Global Error Handling Middleware
// app.use((err, req, res, next) => {
//   res.status(500).json({ message: "Internal Server Error", error: err.message });
// });

// // Start Server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });