
const express = require('express');
const router = express.Router();
const AddModel = require('./AddModel');
const UserViewsModel = require("./ViewsModel");
const BuyerAssistance = require("./BuyerAssistance/BuyerAssistanceModel");
const CallUserList = require('./CalledUserModel');
const NotificationUser = require('./Notification/NotificationDetailModel');
const DeletedAddModel = require ('./DeleteModel');
const UserLogin = require('./user/UserModel'); 
const PricingPlans = require('./plans/PricingPlanModel');
const Bill = require('./CreateBill/BillModel');
const FollowUp = require('./FollowUp/FollowUpModel'); // Import your model
const PhotoRequest = require("./Photo/PhotoRequestModel");
const Offer = require('./Offer/OfferModel'); 
const PlanLimit = require("./Limit/LimitModel");
const BuyerAssistView = require ('./BuyerAssistViewModel')
const AddressRequest = require ('./AddressRequest/AddressRequestModel')

// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
const UserModel = require('./user/UserModel');
const ViewsModel = require('./ViewsModel');
const PaymentPayU = require('./PayU/PayUModel'); // Include your PayU model
const PaymentPayUBuyer = require('./PayuBuyer/PayuBuyerModel'); // Include your PayU model



// // Set up multer storage configuration
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const uploadDirectory = 'uploads/';
//         if (!fs.existsSync(uploadDirectory)) {
//             fs.mkdirSync(uploadDirectory, { recursive: true });
//         }
//         cb(null, uploadDirectory);
//     },
//     filename: (req, file, cb) => {
//         const fileExtension = path.extname(file.originalname);
//         const fileName = Date.now() + fileExtension; // Unique filename
//         cb(null, fileName);
//     },
// });


// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file size limit
//   fileFilter: (req, file, cb) => {
//       const fileTypes = /jpeg|jpg|png|gif|mp4|avi|mov/; // Allowed file types
//       const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
//       const mimetype = fileTypes.test(file.mimetype);
//       if (extname && mimetype) {
//           return cb(null, true); // Accept the file
//       } else {
//           return cb(new Error('Only image and video files (JPEG, PNG, GIF, MP4, AVI, MOV) are allowed!'), false);
//       }
//   },
// });


const multer = require('multer');
const path = require('path');
const fs = require('fs');

// // Multer Storage Config
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDirectory = 'uploads/';
//     if (!fs.existsSync(uploadDirectory)) {
//       fs.mkdirSync(uploadDirectory, { recursive: true });
//     }
//     cb(null, uploadDirectory);
//   },
//   filename: (req, file, cb) => {
//     const { ppcId } = req.body;
//     if (!req.imageIndexMap) req.imageIndexMap = {};
//     if (!req.imageIndexMap[file.fieldname]) {
//       req.imageIndexMap[file.fieldname] = 1;
//     } else {
//       req.imageIndexMap[file.fieldname]++;
//     }

//     const index = req.imageIndexMap[file.fieldname];
//     const ext = path.extname(file.originalname);
//     const newName = `ppcId_${ppcId}_${index}${ext}`;
//     cb(null, newName);
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const fileTypes = /jpeg|jpg|png|gif|mp4|avi|mov/;
//     const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = fileTypes.test(file.mimetype);
//     if (extname && mimetype) cb(null, true);
//     else cb(new Error('Only image/video files allowed!'), false);
//   },
// });



// Multer Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDirectory = 'uploads/';
    if (!fs.existsSync(uploadDirectory)) {
      fs.mkdirSync(uploadDirectory, { recursive: true });
    }
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const { ppcId } = req.body;
    if (!req.imageIndexMap) req.imageIndexMap = {};
    if (!req.imageIndexMap[file.fieldname]) {
      req.imageIndexMap[file.fieldname] = 1;
    } else {
      req.imageIndexMap[file.fieldname]++;
    }

    const index = req.imageIndexMap[file.fieldname];
    const ext = path.extname(file.originalname);
    const newName = `ppcId_${ppcId}_${index}${ext}`;
    cb(null, newName);
  },
});

// Allowed MIME types for images and videos
const allowedImageMimes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff'
];

const allowedVideoMimes = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',      // .mov
  'video/x-msvideo',      // .avi
  'video/webm',
  'video/ogg',
  'video/x-matroska',     // .mkv
  'video/x-flv',
  'video/3gpp',
  'video/3gpp2'
];

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Strip encoding from MIME type (e.g., "image/jpeg; charset=utf-8" ? "image/jpeg")
    const baseMimetype = file.mimetype.split(';')[0].toLowerCase().trim();
    const ext = path.extname(file.originalname).toLowerCase();

    console.log('File validation:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      baseMimetype: baseMimetype,
      ext: ext
    });

    // Separate validation for photos vs videos
    if (file.fieldname === 'photos') {
      if (allowedImageMimes.includes(baseMimetype) ||
          ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid image format: ${file.originalname}. Allowed: JPG, PNG, GIF, WEBP, BMP, TIFF`), false);
      }
    } else if (file.fieldname === 'video') {
      if (allowedVideoMimes.includes(baseMimetype) ||
          ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.ogg', '.flv', '.3gp', '.3g2'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid video format: ${file.originalname}. Allowed: MP4, AVI, MOV, MKV, WEBM, OGG, FLV`), false);
      }
    } else {
      cb(null, true);
    }
  },
});

router.get("/get-property-details/:ppcId", async (req, res) => {
  const { ppcId } = req.params;
  const property = await AddModel.findOne({ ppcId });
  if (!property) return res.status(404).json({ error: "Not found" });

  const photos = (property.photos || []).map(filename => ({
    url: `${req.protocol}://${req.get("host")}/uploads/${filename}`,
    alt: `Property ${ppcId} � Photo ${filename.split("_").pop().split(".")[0]}`
  }));

  res.json({
    ppcId: property.ppcId,
    photos
  });
});



router.get('/bills/free-with-properties', async (req, res) => {
  try {
    // Step 1: Fetch all Free Plan bills
    const freeBills = await Bill.find({ planName: 'Free' }).sort({ createdAt: -1 });

    if (!freeBills.length) {
      return res.status(404).json({ message: 'No Free Plan bills found.' });
    }

    // Step 2: For each bill, fetch associated properties using `ppId`
    const result = await Promise.all(freeBills.map(async (bill) => {
      const {
        billNo,
        planName,
        billAmount,
        netAmount,
        paymentType,
        validity,
        ownerPhone,
        adminOffice,
        adminName,
        billCreatedBy,
        createdAt,
        ppId
      } = bill;

      // Assuming `AddModel` has a `ppcId` field that maps to `ppId` from the bill
      const properties = await AddModel.find({ ppcId: ppId });

      return {
        bill: {
          billNo,
          planName,
          billAmount,
          netAmount,
          paymentType,
          validity,
          ownerPhone,
          adminOffice,
          adminName,
          billCreatedBy,
          billCreatedAt: createdAt,
          ppId
        },
        properties
      };
    }));

    res.status(200).json({
      success: true,
      message: "Fetched Free Plan bills with associated properties using ppId successfully.",
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error while fetching Free Plan bills with properties.',
      error: error.message
    });
  }
});



// const normalizePhoneNumber = (phone) => {
//   return phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();
// };

// router.get("/can-plans-with-payment/:phoneNumber", async (req, res) => {
//   try {
//     let { phoneNumber } = req.params;
//     phoneNumber = normalizePhoneNumber(phoneNumber);

//     // Fetch all plans for the user
//     let plans = await PricingPlans.find({ phoneNumber }).sort({ createdAt: -1 });

//     if (plans.length === 0) {
//       return res.status(404).json({ message: "No plans found for this phone number." });
//     }

//     // Filter: Include 'free' or paid plans with success payment
//     const filteredPlans = [];
//     for (const plan of plans) {
//       if (plan.name.toLowerCase() === 'free') {
//         filteredPlans.push(plan);
//       } else {
//         const paymentSuccess = await PaymentPayU.findOne({
//           phone: { $regex: new RegExp(phoneNumber + '$') },
//           planName: plan.name,
//           status: 'success',
//           txnid: { $exists: true }
//         });
//         if (paymentSuccess) {
//           filteredPlans.push(plan);
//         }
//       }
//     }

//     if (filteredPlans.length === 0) {
//       return res.status(403).json({ message: "No valid active plan with successful payment." });
//     }

//     const latestPlan = filteredPlans[0];
//     const maxCars = latestPlan.numOfCars || 0;

//     // Count user's existing properties
//     const usedProperties = await AddModel.find({
//       phoneNumber: new RegExp(phoneNumber + '$'),
//       isDeleted: false
//     });

//     const usedCars = usedProperties.length;

//     if (usedCars >= maxCars) {
//       return res.status(403).json({
//         success: false,
//         message: `Your current plan allows only ${maxCars} properties. You have already added ${usedCars}. Please upgrade your plan to add more properties.`
//       });
//     }

//     // If limit not reached, allow property posting
//     return res.status(200).json({
//       success: true,
//       message: `You can add a new property. (${maxCars - usedCars} remaining)`,
//       remainingSlots: maxCars - usedCars
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Error checking plan eligibility.",
//       error: error.message
//     });
//   }
// });



// GET /properties/status-counts
router.get('/properties/status-counts', async (req, res) => {
  try {
    const allStatuses = ['complete', 'incomplete', 'active'];

    // Step 1: Count by individual statuses
    const statusCounts = await Promise.all(
      allStatuses.map(async (status) => {
        const count = await AddModel.countDocuments({ status });
        return { status, count };
      })
    );

    // Step 2: Count of all properties (regardless of status)
    const totalCount = await AddModel.countDocuments();

    // Step 3: Format response
    const response = {
      totalCount,
      counts: statusCounts.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {})
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching status counts:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



const normalizePhoneNumber = (phone) => {
  return phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();
};

router.get("/plans-with-payment/:phoneNumber", async (req, res) => {
  try {
    let { phoneNumber } = req.params;
    phoneNumber = normalizePhoneNumber(phoneNumber);

    // Fetch all plans linked to the phone number
    let plans = await PricingPlans.find({ phoneNumber }).sort({ createdAt: -1 });

    if (plans.length === 0) {
      return res.status(404).json({ message: "No plans found for this phone number." });
    }

    // Filter plans: 
    // Include free plans OR paid plans with successful payment only
    const filteredPlans = [];
    for (const plan of plans) {
      if (plan.name.toLowerCase() === 'free') {
        // Always include free plans
        filteredPlans.push(plan);
      } else {
        // Check if there is a successful payment record for this plan and phone number
        const paymentSuccess = await PaymentPayU.findOne({
          phone: { $regex: new RegExp(phoneNumber + '$') }, // ends with normalized phone
          planName: plan.name,
          status: 'success',
          txnid: { $exists: true }
        });
        if (paymentSuccess) {
          filteredPlans.push(plan);
        }
      }
    }

    if (filteredPlans.length === 0) {
      return res.status(404).json({ message: "No active paid plans with successful payment found." });
    }

    // Use latest plan (filtered) to compute usage
    const latestPlan = filteredPlans[0];

    // Fetch used car entries for this phone number
    const usedProperties = await AddModel.find({
      phoneNumber: new RegExp(phoneNumber + '$'),
      isDeleted: false
    });

    const usedCars = usedProperties.length;
    const ppcIds = usedProperties.map(item => item.ppcId);

    const remainingCars = (latestPlan.numOfCars || 0) - usedCars;

    // Attach createdDate and expireDate to each plan
    const formattedPlans = filteredPlans.map(plan => {
    const created = plan.createdAt ? new Date(plan.createdAt) : null;
const expiry = created && plan.durationDays
  ? new Date(created.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
  : null;

return {
  ...plan.toObject(),
  createdDate: created ? created.toISOString().split('T')[0] : null,
  expireDate: expiry ? expiry.toISOString().split('T')[0] : null
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



// router.get("/plans-with-payment-datas/:phoneNumber", async (req, res) => {
//   try {
//     let { phoneNumber } = req.params;
//     phoneNumber = normalizePhoneNumber(phoneNumber);

//     // Fetch all plans linked to the phone number
//     let plans = await PricingPlans.find({ phoneNumber }).sort({ createdAt: -1 });

//     if (plans.length === 0) {
//       return res.status(404).json({ message: "No plans found for this phone number." });
//     }

//     const filteredPlans = [];
//     for (const plan of plans) {
//       if (plan.name.toLowerCase() === 'free') {
//         filteredPlans.push(plan);
//       } else {
//         const paymentSuccess = await PaymentPayU.findOne({
//           phone: { $regex: new RegExp(phoneNumber + '$') },
//           planName: plan.name,
//           status: 'success',
//           txnid: { $exists: true }
//         });
//         if (paymentSuccess) {
//           filteredPlans.push(plan);
//         }
//       }
//     }

//     if (filteredPlans.length === 0) {
//       return res.status(404).json({ message: "No active paid plans with successful payment found." });
//     }

//     const latestPlan = filteredPlans[0];

//     // Fetch used car entries
//     const usedProperties = await AddModel.find({
//       phoneNumber: new RegExp(phoneNumber + '$'),
//       isDeleted: false
//     });

//     const usedCars = usedProperties.length;
//     const ppcIds = usedProperties.map(item => item.ppcId);
//     const remainingCars = (latestPlan.numOfCars || 0) - usedCars;

//     // Determine if plan limit reached
//     const planLimitReached = latestPlan.numOfCars && usedCars >= latestPlan.numOfCars;

//     // Format plans
//     const formattedPlans = filteredPlans.map(plan => {
//       const created = plan.createdAt ? new Date(plan.createdAt) : null;
//       const expiry = created && plan.durationDays
//         ? new Date(created.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
//         : null;

//       return {
//         ...plan.toObject(),
//         createdDate: created ? created.toISOString().split('T')[0] : null,
//         expireDate: expiry ? expiry.toISOString().split('T')[0] : null
//       };
//     });

//     // Build response
//     const response = {
//       success: true,
//       phoneNumber,
//       usedCars,
//       ppcIds,
//       remainingCars: remainingCars < 0 ? 0 : remainingCars,
//       plans: formattedPlans
//     };

//     if (planLimitReached) {
//       response.planLimitMessage = "Your plan limit for posting properties is complete. Please purchase a new plan to add more properties.";
//     }

//     return res.status(200).json(response);

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching plan usage details.",
//       error: error.message
//     });
//   }
// });


router.get("/plans-with-payment-datas-get/:phoneNumber", async (req, res) => {
  try {
    let { phoneNumber } = req.params;
    phoneNumber = normalizePhoneNumber(phoneNumber);

    // Fetch all plans linked to the phone number sorted by createdAt desc
    let plans = await PricingPlans.find({ phoneNumber }).sort({ createdAt: -1 });

    if (plans.length === 0) {
      return res.status(404).json({ success: false, message: "No plans found for this phone number." });
    }

    // Filter: include 'free' plans always; include paid plans only if payment success exists
    const filteredPlans = [];
    for (const plan of plans) {
      if (plan.name.toLowerCase() === "free") {
        filteredPlans.push(plan);
      } else {
        const paymentSuccess = await PaymentPayU.findOne({
          phone: { $regex: new RegExp(phoneNumber + "$") },
          planName: plan.name,
          status: "success",
          txnid: { $exists: true },
        });
        if (paymentSuccess) filteredPlans.push(plan);
      }
    }

    if (filteredPlans.length === 0) {
      return res.status(404).json({ success: false, message: "No active paid plans with successful payment found." });
    }

    const latestPlan = filteredPlans[0];
    const maxCars = latestPlan.numOfCars || 0;

    // Fetch all properties posted by this user, not deleted, sorted oldest first
    const userProperties = await AddModel.find({
      phoneNumber: new RegExp(phoneNumber + "$"),
      isDeleted: false,
    }).sort({ createdAt: 1 });

    // Assign planName to the first maxCars properties, rest are no plan
    const planAssignedProperties = userProperties.slice(0, maxCars);
    const noPlanProperties = userProperties.slice(maxCars);

    // Optionally update DB to mark planName (can be omitted if not needed)
    // Here just a batch update example for efficiency:
    await Promise.all(
      planAssignedProperties.map(async (prop) => {
        if (prop.planName !== latestPlan.name) {
          prop.planName = latestPlan.name;
          prop.planCreatedAt = latestPlan.createdAt;
          await prop.save();
        }
      })
    );

    await Promise.all(
      noPlanProperties.map(async (prop) => {
        if (prop.planName === latestPlan.name) {
          prop.planName = null;
          prop.planCreatedAt = null;
          await prop.save();
        }
      })
    );

    // Prepare response
    const response = {
      success: true,
      phoneNumber,
      totalProperties: userProperties.length,
      planLimit: maxCars,
      usedPropertiesCount: planAssignedProperties.length,
      noPlanPropertiesCount: noPlanProperties.length,
      planLimitMessage:
        planAssignedProperties.length >= maxCars
          ? "Your plan limit for posting properties is complete. Please purchase a new plan to add more properties."
          : null,
      plans: filteredPlans.map((p) => ({
        name: p.name,
        numOfCars: p.numOfCars,
        createdAt: p.createdAt,
        expireDate: p.expireDate,
      })),
      propertiesUnderPlan: planAssignedProperties.map((p) => ({
        ppcId: p.ppcId,
        planName: p.planName,
      })),
      propertiesWithoutPlan: noPlanProperties.map((p) => ({
        ppcId: p.ppcId,
        planName: p.planName || "No Plan",
      })),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in /plans-with-payment-datas:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching plan usage details.",
      error: error.message,
    });
  }
});



// // Get plans and property usage for a phone number
// router.get('/plans-with-payment-datas/:phoneNumber', async (req, res) => {
//   try {
//     let { phoneNumber } = req.params;
//     phoneNumber = normalizePhoneNumber(phoneNumber);

//     // Fetch all plans linked to the phone number (most recent first)
//     let plans = await PricingPlans.find({ phoneNumber }).sort({ createdAt: -1 });

//     if (plans.length === 0) {
//       return res.status(404).json({ success: false, message: "No plans found for this phone number." });
//     }

//     // Filter plans: free always included; paid only if payment success exists
//     const filteredPlans = [];
//     for (const plan of plans) {
//       if (plan.name.toLowerCase() === 'free') {
//         filteredPlans.push(plan);
//       } else {
//         const paymentSuccess = await PaymentPayU.findOne({
//           phone: { $regex: new RegExp(phoneNumber + '$') },
//           planName: plan.name,
//           status: 'success',
//           txnid: { $exists: true }
//         });
//         if (paymentSuccess) {
//           filteredPlans.push(plan);
//         }
//       }
//     }

//     if (filteredPlans.length === 0) {
//       return res.status(404).json({ success: false, message: "No active paid plans with successful payment found." });
//     }

//     const latestPlan = filteredPlans[0];

//     // Fetch all properties posted by user (not deleted)
//     const userProperties = await AddModel.find({ phoneNumber: new RegExp(phoneNumber + '$'), isDeleted: false })
//                                          .sort({ createdAt: 1 }); // Sort oldest first (for plan assignment)

//     // Assign plan name only to first N properties allowed by latest plan
//     const maxCars = latestPlan.numOfCars || 0;

//     const planAssignedProperties = userProperties.slice(0, maxCars);
//     const noPlanProperties = userProperties.slice(maxCars);

//     // Update properties in DB to mark planName accordingly
//     // (You can batch update or loop; Here simplified as example)
//     for (let prop of planAssignedProperties) {
//       if (prop.planName !== latestPlan.name) {
//         prop.planName = latestPlan.name;
//         prop.planCreatedAt = latestPlan.createdAt;
//         await prop.save();
//       }
//     }

//     for (let prop of noPlanProperties) {
//       if (prop.planName && prop.planName === latestPlan.name) {
//         prop.planName = null; // Or mark as 'no plan' or upgrade plan if you want
//         prop.planCreatedAt = null;
//         await prop.save();
//       }
//     }

//     const response = {
//       success: true,
//       phoneNumber,
//       plans: filteredPlans.map(p => ({
//         name: p.name,
//         numOfCars: p.numOfCars,
//         createdAt: p.createdAt,
//         expireDate: p.expireDate,
//       })),
//       propertiesUnderPlan: planAssignedProperties.map(p => ({
//         ppcId: p.ppcId,
//         planName: p.planName,
//       })),
//       propertiesWithoutPlan: noPlanProperties.map(p => ({
//         ppcId: p.ppcId,
//         planName: p.planName || 'No Plan',
//       })),
//       totalProperties: userProperties.length,
//       planLimit: maxCars,
//     };

//     return res.status(200).json(response);

//   } catch (error) {
//     console.error("Error in /plans-with-payment-datas:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching plan usage details.",
//       error: error.message
//     });
//   }
// });





router.get("/plans-with-payment-datas/:phoneNumber", async (req, res) => {
  try {
    let { phoneNumber } = req.params;
    phoneNumber = normalizePhoneNumber(phoneNumber);

    // Fetch all plans linked to the phone number
    let plans = await PricingPlans.find({ phoneNumber }).sort({ createdAt: -1 });

    if (plans.length === 0) {
      return res.status(404).json({ success: false, message: "No plans found for this phone number." });
    }

    const filteredPlans = [];

    for (const plan of plans) {
      if (plan.name.toLowerCase() === 'free') {
        filteredPlans.push(plan);
      } else {
        const paymentSuccess = await PaymentPayU.findOne({
          phone: { $regex: new RegExp(phoneNumber + '$') },
          planName: plan.name,
          status: 'success',
          txnid: { $exists: true }
        });
        if (paymentSuccess) {
          filteredPlans.push(plan);
        }
      }
    }

    if (filteredPlans.length === 0) {
      return res.status(404).json({ success: false, message: "No active paid plans with successful payment found." });
    }

    const latestPlan = filteredPlans[0];

    // Fetch actual posted property data
    const usedProperties = await AddModel.find({
      phoneNumber: new RegExp(phoneNumber + '$'),
      isDeleted: false
    });

    const usedCars = usedProperties.length;
    const ppcIds = usedProperties.map(item => item.ppcId);
    const remainingCars = (latestPlan.numOfCars || 0) - usedCars;
    const planLimitReached = latestPlan.numOfCars && usedCars >= latestPlan.numOfCars;

    // Format all plans and override usedCars and ppcIds
    const formattedPlans = filteredPlans.map(plan => {
      const created = plan.createdAt ? new Date(plan.createdAt) : null;
      const expiry = created && plan.durationDays
        ? new Date(created.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
        : null;

      return {
        ...plan.toObject(),
        usedCars,      // override to ensure correctness
        ppcIds,        // override from AddModel
        createdDate: created ? created.toISOString().split('T')[0] : null,
        expireDate: expiry ? expiry.toISOString().split('T')[0] : null
      };
    });

    const response = {
      success: true,
      phoneNumber,
      usedCars,
      ppcIds,
      remainingCars: remainingCars < 0 ? 0 : remainingCars,
      plans: formattedPlans
    };

    if (planLimitReached) {
      response.planLimitMessage = "Your plan limit for posting properties is complete. Please purchase a new plan to add more properties.";
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in /plans-with-payment-datas:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching plan usage details.",
      error: error.message
    });
  }
});



router.get("/selected-plans", async (req, res) => {
  try {
    // Fetch all plans that have phone numbers
    const allPlans = await PricingPlans.find({ phoneNumber: { $exists: true, $not: { $size: 0 } } });

    const finalPlans = [];

    for (const plan of allPlans) {
      const validPhoneNumbers = [];

      for (const phone of plan.phoneNumber) {
        const normalizedPhone = phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

        if (plan.name.toLowerCase() === "free") {
          validPhoneNumbers.push(normalizedPhone); // Always include Free plan users
        } else {
          const paymentSuccess = await PaymentPayU.findOne({
            phone: { $regex: new RegExp(normalizedPhone + '$') },
            planName: plan.name,
            status: 'success',
            txnid: { $exists: true }
          });

          if (paymentSuccess) {
            validPhoneNumbers.push(normalizedPhone);
          }
        }
      }

      if (validPhoneNumbers.length > 0) {
        // Update the plan to keep only valid phone numbers
        await PricingPlans.updateOne(
          { _id: plan._id },
          { $set: { phoneNumber: validPhoneNumbers } }
        );

        // Push updated plan to result
        const updatedPlan = await PricingPlans.findById(plan._id);
        finalPlans.push(updatedPlan);
      } else {
        // Optional: remove phone numbers if none are valid (clean up old junk)
        await PricingPlans.updateOne(
          { _id: plan._id },
          { $set: { phoneNumber: [] } }
        );
      }
    }

    return res.status(200).json({
      status: "success",
      total: finalPlans.length,
      data: finalPlans
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch filtered selected plans.",
      error: error.message
    });
  }
});


router.get("/failed-or-pending-payments/:phoneNumber", async (req, res) => {
  try {
    let { phoneNumber } = req.params;
    phoneNumber = normalizePhoneNumber(phoneNumber);

    // Fetch all payment entries with status 'pay failed' or 'pay later'
    const failedOrPendingPayments = await PaymentPayU.find({
      phone: { $regex: new RegExp(phoneNumber + '$') }, // match end of phone
      payustatususer: { $in: ['pay failed', 'pay later'] }
    }).sort({ createdAt: -1 });

    if (failedOrPendingPayments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No failed or pending payments found for this phone number."
      });
    }

    return res.status(200).json({
      success: true,
      phoneNumber,
      total: failedOrPendingPayments.length,
      payments: failedOrPendingPayments
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching failed or pending payments.",
      error: error.message
    });
  }
});


router.get('/fetch-plan-with-usage', async (req, res) => {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required.' });
    }

    try {
        // Normalize phone number (remove +91, spaces, dashes)
        const normalizedPhone = phoneNumber.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

        // Fetch pricing plan
        const plan = await PricingPlans.findOne({ phoneNumber: normalizedPhone });

        if (!plan) {
            return res.status(404).json({ message: 'No plan found for this phone number.' });
        }

        // Count how many properties the user has posted (usedCars)
        const usedCars = await AddModel.countDocuments({
            phoneNumber: new RegExp(normalizedPhone + '$'), // Match end of number
            isDeleted: false // Ensure not deleted
        });

        const remainingCars = (plan.numOfCars || 0) - usedCars;

        // Calculate expiry date
        const createdAt = new Date(plan.createdAt);
        const duration = plan.durationDays || 0;
        const expiryDate = new Date(createdAt);
        expiryDate.setDate(createdAt.getDate() + duration);

        // Final response
        return res.status(200).json({
            status: "success",
            phoneNumber: plan.phoneNumber,
            planName: plan.name,
            packageType: plan.packageType,
            durationDays: plan.durationDays,
            numOfCars: plan.numOfCars,
            usedCars: usedCars,
            remainingCars: remainingCars < 0 ? 0 : remainingCars,
            price: plan.price,
            featuredMaxCar: plan.featuredMaxCar,
            featuredAds: plan.featuredAds,
            createdAt: plan.createdAt,
            expiryDate: expiryDate.toISOString().split("T")[0]
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch plan and usage details.",
            error: error.message
        });
    }
});




router.get('/fetch-all-plans-with-usage', async (req, res) => {
  try {
    const allPlans = await PricingPlans.find();

    const plansWithUsage = await Promise.all(
      allPlans.map(async (plan) => {
        const rawPhone = typeof plan.phoneNumber === 'string' ? plan.phoneNumber : '';
        const normalizedPhone = rawPhone
          .replace(/[\s-]/g, '')
          .replace(/^(\+91|91|0)/, '')
          .trim();

        const usedCars = await AddModel.countDocuments({
          phoneNumber: new RegExp(normalizedPhone + '$'),
          isDeleted: false,
        });

        const remainingCars = (plan.numOfCars || 0) - usedCars;

        const createdAt = new Date(plan.createdAt);
        const duration = plan.durationDays || 0;
        const expiryDate = new Date(createdAt);
        expiryDate.setDate(createdAt.getDate() + duration);

        return {
          status: 'success',
          phoneNumber: plan.phoneNumber || '',
          planName: plan.name || '',
          packageType: plan.packageType || '',
          durationDays: plan.durationDays || 0,
          numOfCars: plan.numOfCars || 0,
          usedCars,
          remainingCars: remainingCars < 0 ? 0 : remainingCars,
          price: plan.price || 0,
          featuredMaxCar: plan.featuredMaxCar || 0,
          featuredAds: plan.featuredAds || 0,
          createdAt: plan.createdAt,
          expiryDate: expiryDate.toISOString().split('T')[0],
        };
      })
    );

    return res.status(200).json(plansWithUsage);
  } catch (error) {
    console.error('Fetch all plans error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch all plans with usage data.',
      error: error.message,
    });
  }
});



router.get('/fetch-plan-with-payments', async (req, res) => {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required.' });
    }

    try {
        // Normalize phone number
        const normalizedPhone = phoneNumber.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

        // Fetch plan
        const plan = await PricingPlans.findOne({ phoneNumber: normalizedPhone });

        if (!plan) {
            return res.status(404).json({ message: 'No plan found for this phone number.' });
        }

        // Count properties (usedCars)
        const usedCars = await AddModel.countDocuments({
            phoneNumber: new RegExp(normalizedPhone + '$'),
            isDeleted: false
        });

        const remainingCars = (plan.numOfCars || 0) - usedCars;

        // Calculate expiry
        const createdAt = new Date(plan.createdAt);
        const duration = plan.durationDays || 0;
        const expiryDate = new Date(createdAt);
        expiryDate.setDate(expiryDate.getDate() + duration);

        // Fetch successful payments
        const successfulPayments = await PaymentPayU.find({ status: 'success' }).sort({ createdAt: -1 });

        // Return combined data
        return res.status(200).json({
            status: "success",
            planDetails: {
                phoneNumber: plan.phoneNumber,
                planName: plan.name,
                packageType: plan.packageType,
                durationDays: plan.durationDays,
                numOfCars: plan.numOfCars,
                usedCars: usedCars,
                remainingCars: remainingCars < 0 ? 0 : remainingCars,
                price: plan.price,
                featuredMaxCar: plan.featuredMaxCar,
                featuredAds: plan.featuredAds,
                createdAt: plan.createdAt,
                expiryDate: expiryDate.toISOString().split("T")[0]
            },
            successfulPayments: successfulPayments
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch plan or payments data.",
            error: error.message
        });
    }
});



// GET /user-last-30-days-views/:phoneNumber
router.get("/user-last-30-days-views/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Normalize the phone number into different formats
    const digits = phoneNumber.replace(/\D/g, "").slice(-10);
    const variants = [`+91${digits}`, `91${digits}`, digits];

    // Find the user's viewed properties
    const userViews = await UserViewsModel.findOne({
      phoneNumber: { $in: variants },
    });

    if (!userViews || !Array.isArray(userViews.viewedProperties)) {
      return res.status(404).json({ message: "No viewed properties found" });
    }

    // Filter views within the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentViews = userViews.viewedProperties
      .filter((view) => {
        const viewedAt = new Date(view.viewedAt);
        return viewedAt >= thirtyDaysAgo && viewedAt <= now;
      })
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 30); // Return only the latest 30 views

    if (recentViews.length === 0) {
      return res
        .status(404)
        .json({ message: "No views in the last 30 days" });
    }

    // Fetch property details
    const properties = await Promise.all(
      recentViews.map(async (view) => {
        const prop = await AddModel.findOne({ ppcId: view.ppcId });
        return prop
          ? {
              ...prop.toObject(),
              viewedAt: view.viewedAt,
            }
          : null;
      })
    );

    const filteredProperties = properties.filter(Boolean);

    return res.status(200).json({
      message: "Viewed properties in the last 30 days (max 30 results)",
      properties: filteredProperties,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



// router.get("/user-most-viewed-properties/:phoneNumber", async (req, res) => {
//   try {
//     const { phoneNumber } = req.params;

//     if (!phoneNumber) {
//       return res.status(400).json({ message: "Phone number is required" });
//     }

//     const digits = phoneNumber.replace(/\D/g, "").slice(-10);
//     const variants = [`+91${digits}`, `91${digits}`, digits];

//     const userViews = await UserViewsModel.findOne({
//       phoneNumber: { $in: variants },
//     });

//     if (!userViews || !Array.isArray(userViews.viewedProperties)) {
//       return res.status(404).json({ message: "No viewed properties found" });
//     }

//     const now = new Date();
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(now.getDate() - 30);

//     const viewCounts = {}; // Stores 30-day views
//     const totalCounts = {}; // Stores all-time views

//     for (const view of userViews.viewedProperties) {
//       const id = view.ppcId;
//       const viewedAt = new Date(view.viewedAt);

//       // Track total views
//       if (totalCounts[id]) {
//         totalCounts[id].count += 1;
//       } else {
//         totalCounts[id] = { count: 1 };
//       }

//       // Track only recent (30-day) views
//       if (viewedAt >= thirtyDaysAgo && viewedAt <= now) {
//         if (viewCounts[id]) {
//           viewCounts[id].count += 1;
//           viewCounts[id].latestViewedAt =
//             viewedAt > new Date(viewCounts[id].latestViewedAt)
//               ? view.viewedAt
//               : viewCounts[id].latestViewedAt;
//         } else {
//           viewCounts[id] = { count: 1, latestViewedAt: view.viewedAt };
//         }
//       }
//     }

//     // Only keep those with 3+ views in the last 30 days
//     const filteredCounts = Object.entries(viewCounts).filter(
//       ([_, info]) => info.count >= 3
//     );

//     if (filteredCounts.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No properties with 3+ views in the last 30 days" });
//     }

//     const sortedPpcIds = filteredCounts
//       .sort((a, b) => b[1].count - a[1].count)
//       .map(([ppcId, info]) => ({
//         ppcId,
//         viewCount30Days: info.count,
//         latestViewedAt: info.latestViewedAt,
//         totalViewCount: totalCounts[ppcId]?.count || 0,
//       }));

//     const properties = await Promise.all(
//       sortedPpcIds.map(async ({ ppcId, viewCount30Days, latestViewedAt, totalViewCount }) => {
//         const property = await AddModel.findOne({ ppcId });
//         return property
//           ? {
//               ...property.toObject(),
//               viewCount30Days,
//               latestViewedAt,
//               totalViewCount,
//             }
//           : null;
//       })
//     );

//     const finalProperties = properties.filter(Boolean);

//     res.status(200).json({
//       message: "Most viewed properties (3+ views in last 30 days)",
//       properties: finalProperties,
//     });
//   } catch (error) {
//     console.error("Error fetching most viewed properties:", error);
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });


router.get("/user-most-viewed-properties/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const digits = phoneNumber.replace(/\D/g, "").slice(-10);
    const variants = [`+91${digits}`, `91${digits}`, digits];

    const userViews = await UserViewsModel.findOne({
      phoneNumber: { $in: variants },
    });

    if (!userViews || !Array.isArray(userViews.viewedProperties)) {
      return res.status(404).json({ message: "No viewed properties found" });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const viewCounts = {}; // Stores 30-day views
    const totalCounts = {}; // Stores all-time views

    for (const view of userViews.viewedProperties) {
      const id = view.ppcId;
      const viewedAt = new Date(view.viewedAt);

      // Track total views
      if (totalCounts[id]) {
        totalCounts[id].count += 1;
      } else {
        totalCounts[id] = { count: 1 };
      }

      // Track only recent (30-day) views
      if (viewedAt >= thirtyDaysAgo && viewedAt <= now) {
        if (viewCounts[id]) {
          viewCounts[id].count += 1;
          viewCounts[id].latestViewedAt =
            viewedAt > new Date(viewCounts[id].latestViewedAt)
              ? view.viewedAt
              : viewCounts[id].latestViewedAt;
        } else {
          viewCounts[id] = { count: 1, latestViewedAt: view.viewedAt };
        }
      }
    }

    // Only keep those with 3+ views in the last 30 days
    const filteredCounts = Object.entries(viewCounts).filter(
      ([_, info]) => info.count >= 3
    );

    if (filteredCounts.length === 0) {
      return res
        .status(404)
        .json({ message: "No properties with 3+ views in the last 30 days" });
    }

    const sortedPpcIds = filteredCounts
      .sort((a, b) => b[1].count - a[1].count)
      .map(([ppcId, info]) => ({
        ppcId,
        viewCount30Days: info.count,
        latestViewedAt: info.latestViewedAt,
        totalViewCount: totalCounts[ppcId]?.count || 0,
      }));

    // Fetch properties along with viewedAt date
    const properties = await Promise.all(
      sortedPpcIds.map(async ({ ppcId, viewCount30Days, latestViewedAt, totalViewCount }) => {
        const property = await AddModel.findOne({ ppcId });
        return property
          ? {
              ...property.toObject(),
              viewCount30Days,
              latestViewedAt, // Include the latest view date here
              totalViewCount,
              viewedAt: latestViewedAt, // Make sure to include this field as viewedAt
            }
          : null;
      })
    );

    const finalProperties = properties.filter(Boolean);

    res.status(200).json({
      message: "Most viewed properties (3+ views in last 30 days)",
      properties: finalProperties,
    });
  } catch (error) {
    console.error("Error fetching most viewed properties:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});




// GET /get-most-viewed-properties-count?phoneNumber=xxxxxx
router.get("/get-most-viewed-properties-count", async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Normalize phone
    const digits = phoneNumber.replace(/\D/g, "").slice(-10);
    const variants = [`+91${digits}`, `91${digits}`, digits];

    // Find user views
    const userViews = await UserViewsModel.findOne({
      phoneNumber: { $in: variants }
    });

    if (!userViews || !Array.isArray(userViews.viewedProperties)) {
      return res.status(404).json({ message: "No viewed properties found" });
    }

    // Last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Filter views in range
    const recentViews = userViews.viewedProperties.filter(view => {
      const viewedAt = new Date(view.viewedAt);
      return viewedAt >= thirtyDaysAgo && viewedAt <= now;
    });

    // Count by PPC ID
    const viewCounts = {};
    recentViews.forEach(view => {
      const id = view.ppcId;
      viewCounts[id] = (viewCounts[id] || 0) + 1;
    });

    // Filter only those with >= 3 views
    const mostViewedCount = Object.values(viewCounts).filter(count => count >= 3).length;

    res.status(200).json({
      message: "Most viewed properties count fetched successfully.",
      mostViewedPropertiesCount: mostViewedCount
    });
  } catch (error) {
    console.error("Error fetching most viewed count:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});






// GET /all-most-viewed-properties
router.get("/all-most-viewed-properties", async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Fetch all user view records
    const allUserViews = await UserViewsModel.find({});

    const viewCounts = {};

    // Process all viewedProperties across all users
    allUserViews.forEach((user) => {
      if (!Array.isArray(user.viewedProperties)) return;

      user.viewedProperties.forEach((view) => {
        const viewedAt = new Date(view.viewedAt);
        if (viewedAt >= thirtyDaysAgo && viewedAt <= now) {
          const ppcId = view.ppcId;

          if (viewCounts[ppcId]) {
            viewCounts[ppcId].count += 1;
            viewCounts[ppcId].latestViewedAt =
              new Date(viewedAt) > new Date(viewCounts[ppcId].latestViewedAt)
                ? view.viewedAt
                : viewCounts[ppcId].latestViewedAt;
          } else {
            viewCounts[ppcId] = { count: 1, latestViewedAt: view.viewedAt };
          }
        }
      });
    });

    // Sort by view count descending
    const sortedPpcIds = Object.entries(viewCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([ppcId, info]) => ({ ppcId, ...info }));

    // Fetch property details
    const properties = await Promise.all(
      sortedPpcIds.map(async ({ ppcId, count, latestViewedAt }) => {
        const property = await AddModel.findOne({ ppcId });
        return property
          ? {
              ...property.toObject(),
              viewCount: count,
              latestViewedAt,
            }
          : null;
      })
    );

    const filteredProperties = properties.filter(Boolean);

    res.status(200).json({
      message: "Most viewed properties by all users in the last 30 days",
      properties: filteredProperties,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



router.post('/assign-phone', async (req, res) => {
  try {
    const { ppcId, assignedPhoneNumber } = req.body;

    const property = await AddModel.findOneAndUpdate(
      { ppcId: ppcId.toString() },
      {
        assignedPhoneNumber,
        setPpcId: true,
        setPpcIdAssignedAt: new Date()  // ? Store date/time here
      },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.status(200).json({
      message: 'Phone number assigned successfully',
      property
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});



// GET /get-property-details/:ppcId
router.get('/get-property-details/:ppcId', async (req, res) => {
  try {
    const { ppcId } = req.params;

    if (!ppcId) {
      return res.status(400).json({ error: 'PPC ID is required' });
    }

    const property = await AddModel.findOne({ ppcId: ppcId.toString() });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.status(200).json({
      ppcId: property.ppcId,
      assignedPhoneNumber: property.assignedPhoneNumber || null,
      originalPhoneNumber: property.phoneNumber // assuming phoneNumber is original poster's number
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});



// GET /get-property-details
router.get('/get-property-details', async (req, res) => {
  try {
    const properties = await AddModel.find(
      { assignedPhoneNumber: { $exists: true, $ne: '' } },
      {
        ppcId: 1,
        assignedPhoneNumber: 1,
        phoneNumber: 1,
        setPpcId: 1,
        setPpcIdAssignedAt: 1, // Include timestamp
        _id: 0
      }
    );

    if (!properties || properties.length === 0) {
      return res.status(404).json({ error: 'No assigned phone numbers found' });
    }

    const formatted = properties.map(p => ({
      ppcId: p.ppcId,
      assignedPhoneNumber: p.assignedPhoneNumber,
      originalPhoneNumber: p.phoneNumber,
      setPpcId: p.setPpcId || false,
      setPpcIdAssignedAt: p.setPpcIdAssignedAt || null // Format optional
    }));

    res.status(200).json(formatted);

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT /unassign-phone
router.put('/unassign-phone', async (req, res) => {
  try {
    const { ppcId } = req.body;

    const property = await AddModel.findOne({ ppcId: ppcId.toString() });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const updated = await AddModel.findOneAndUpdate(
      { ppcId: ppcId.toString() },
      {
        previouslyAssignedPhoneNumber: property.assignedPhoneNumber,
        previouslyAssignedAt: property.setPpcIdAssignedAt,
        assignedPhoneNumber: null,
        setPpcIdAssignedAt: null,
        setPpcId: false
      },
      { new: true }
    );

    res.status(200).json({ message: 'Assignment temporarily removed', updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});



// PUT /undo-unassign-phone
router.put('/undo-unassign-phone', async (req, res) => {
  try {
    const { ppcId } = req.body;

    const property = await AddModel.findOne({ ppcId: ppcId.toString() });

    if (!property || !property.previouslyAssignedPhoneNumber) {
      return res.status(404).json({ error: 'No backup data found for undo' });
    }

    const updated = await AddModel.findOneAndUpdate(
      { ppcId: ppcId.toString() },
      {
        assignedPhoneNumber: property.previouslyAssignedPhoneNumber,
        setPpcIdAssignedAt: property.previouslyAssignedAt || new Date(),
        setPpcId: true,
        previouslyAssignedPhoneNumber: null,
        previouslyAssignedAt: null
      },
      { new: true }
    );

    res.status(200).json({ message: 'Assignment restored', updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete('/permanent-delete/:ppcId', async (req, res) => {
  const { ppcId } = req.params;
  try {
    const result = await AddModel.deleteOne({ ppcId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ message: 'Property permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// router.get('/fetch-recent-properties', async (req, res) => {
//   try {
//     // Calculate date 15 days ago from today
//     const fifteenDaysAgo = new Date();
//     fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

//     // Fetch properties added in the last 15 days, sorted from newest to oldest
//     const recentProperties = await AddModel.find({
//       createdAt: { $gte: fifteenDaysAgo }
//     }).sort({ createdAt: -1 }); // Sort descending

//     res.status(200).json({
//       message: 'Recent properties added within the last 15 days fetched successfully!',
//       properties: recentProperties
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error fetching recent properties.',
//       error
//     });
//   }
// });

router.get('/fetch-recent-properties', async (req, res) => {
  try {
    // Calculate date 30 days ago from today
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch and filter required fields, sorted by newest first
    const recentProperties = await AddModel.find(
      { createdAt: { $gte: thirtyDaysAgo } },
      { propertyMode: 1, propertyType: 1, price: 1, ppcId: 1, phoneNumber: 1, createdAt: 1 } // Only selected fields
    ).sort({ createdAt: -1 }); // Sort descending by date

    res.status(200).json({
      message: 'Recent properties added within the last 30 days fetched successfully!',
      properties: recentProperties
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching recent properties.',
      error
    });
  }
});



// router.get('/fetch-all-datas', async (req, res) => {
//   try {

//       // Fetch all users from the database
//       const users = await AddModel.find({});

//       // Return the fetched user data
//       res.status(200).json({ message: 'All user data fetched successfully!', users });
//   } catch (error) {
//       res.status(500).json({ message: 'Error fetching all user details.', error });
//   }
// });

router.get('/fetch-all-datas', async (req, res) => {
  try {
    const properties = await AddModel.find({});
    const plans = await PricingPlans.find();
    const payuData = await PaymentPayU.find();
    const bills = await Bill.find();
    const followups = await FollowUp.find();

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const processedProperties = [];

    for (const property of properties) {
      const isComplete = requiredFields.every(
        (field) => property[field] !== undefined && property[field] !== null && String(property[field]).trim() !== ''
      );

      const phoneNumber = property.phoneNumber || '';
      const escapedPhone = escapeRegExp(phoneNumber);

      const matchedPlans = plans.filter(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(phoneNumber)
          : plan.phoneNumber === phoneNumber
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const matchedPlan = matchedPlans.find(plan => {
        if (plan.name.toLowerCase() === 'free') return true;
        return payuData.some(pay =>
          pay.phone && new RegExp(escapedPhone + '$').test(pay.phone) &&
          pay.planName === plan.name && pay.status === 'success'
        );
      });

      const matchedPayU = payuData.find(
        pay => new RegExp(escapedPhone + '$').test(pay.phone)
      );

      const matchedBill = bills.find(
        bill => bill.ownerPhone === phoneNumber || bill.ppId === property.ppcId
      );

      let adminName = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminName = matchedBill.adminName || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate);
          const billExpiry = new Date(billStart.getTime() + (validity - 1) * 86400000);
          billExpiryDate = billExpiry.toLocaleDateString();
        }
      }

      const propertyFollowUps = followups
        .filter(fu => String(fu.ppcId) === String(property.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const followUpAdminName = propertyFollowUps.length > 0
        ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
        : 'N/A';

      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';
      let planDetails = null;

      if (matchedPlan) {
        if (matchedPlan.createdAt && matchedPlan.durationDays) {
          const planStart = new Date(matchedPlan.createdAt);
          const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 86400000);
          planCreatedAt = planStart.toLocaleDateString();
          planExpiryDate = planExpiry.toLocaleDateString();
        }

        const usedProps = await AddModel.find({
          phoneNumber: new RegExp(escapedPhone + '$'),
          isDeleted: false
        });

        const usedCars = usedProps.length;
        const ppcIds = usedProps.map(p => p.ppcId);

        planDetails = {
          name: matchedPlan.name || 'N/A',
          packageType: matchedPlan.packageType || 'N/A',
          price: matchedPlan.price || 0,
          durationDays: matchedPlan.durationDays || 0,
          description: matchedPlan.description || '',
          unlimitedAds: matchedPlan.unlimitedAds || false,
          numOfCars: matchedPlan.numOfCars || 0,
          featuredMaxCar: matchedPlan.featuredMaxCar || 0,
          expireDate: matchedPlan.expireDate || null,
          createdDate: matchedPlan.createdDate || null,
          usedCars,
          ppcIds,
          remainingCars: Math.max((matchedPlan.numOfCars || 0) - usedCars, 0)
        };
      }

      processedProperties.push({
        ...property._doc,
        required: isComplete ? 'yes' : 'no',
        planName: matchedPlan?.name || 'N/A',
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        planCreatedAt,
        planExpiryDate,
        adminName,
        billDate,
        validity,
        billExpiryDate,
        followUpAdminName,
        setPpcId: property.setPpcId || false,
        assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
        setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
        payUStatus: matchedPayU?.status || 'N/A',
        payustatususer: matchedPayU?.payustatususer || 'N/A',
        paymentId: matchedPayU?.mihpayid || 'N/A',
        transactionId: matchedPayU?.txnid || 'N/A',
        payUCreatedAt: matchedPayU?.createdAt || null,
        payUUpdatedAt: matchedPayU?.updatedAt || null,
        planDetails
      });
    }

    res.status(200).json({
      success: true,
      total: processedProperties.length,
      data: processedProperties
    });

  } catch (error) {
    console.error('Error fetching all user details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all user details.',
      error: error.message
    });
  }
});



router.get('/fetch-all-status-datas-addmodel', async (req, res) => {
  try {
    const properties = await AddModel.find({});
    const plans = await PricingPlans.find();
    const payuData = await PaymentPayU.find();
    const bills = await Bill.find();
    const followups = await FollowUp.find();

    const processedProperties = [];

    for (const property of properties) {
      const phoneNumber = property.phoneNumber || '';
      const escapedPhone = escapeRegExp(phoneNumber);

      const matchedPlans = plans.filter(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(phoneNumber)
          : plan.phoneNumber === phoneNumber
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const matchedPlan = matchedPlans.find(plan => {
        if (plan.name.toLowerCase() === 'free') return true;
        return payuData.some(pay =>
          pay.phone && new RegExp(escapedPhone + '$').test(pay.phone) &&
          pay.planName === plan.name && pay.status === 'success'
        );
      });

      const matchedPayU = payuData.find(
        pay => new RegExp(escapedPhone + '$').test(pay.phone)
      );

      const matchedBill = bills.find(
        bill => bill.ownerPhone === phoneNumber || bill.ppId === property.ppcId
      );

      const propertyFollowUps = followups
        .filter(fu => String(fu.ppcId) === String(property.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const followUpAdminName = propertyFollowUps.length > 0
        ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
        : 'N/A';

      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';
      let planDetails = null;

      if (matchedPlan) {
        if (matchedPlan.createdAt && matchedPlan.durationDays) {
          const planStart = new Date(matchedPlan.createdAt);
          const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 86400000);
          planCreatedAt = planStart.toLocaleDateString();
          planExpiryDate = planExpiry.toLocaleDateString();
        }

        const usedProps = await AddModel.find({
          phoneNumber: new RegExp(escapedPhone + '$'),
          isDeleted: false
        });

        const usedCars = usedProps.length;
        const ppcIds = usedProps.map(p => p.ppcId);

        planDetails = {
          name: matchedPlan.name || 'N/A',
          packageType: matchedPlan.packageType || 'N/A',
          price: matchedPlan.price || 0,
          durationDays: matchedPlan.durationDays || 0,
          description: matchedPlan.description || '',
          unlimitedAds: matchedPlan.unlimitedAds || false,
          numOfCars: matchedPlan.numOfCars || 0,
          featuredMaxCar: matchedPlan.featuredMaxCar || 0,
          expireDate: matchedPlan.expireDate || null,
          createdDate: matchedPlan.createdDate || null,
          usedCars,
          ppcIds,
          remainingCars: Math.max((matchedPlan.numOfCars || 0) - usedCars, 0)
        };
      }

      let adminName = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminName = matchedBill.adminName || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate);
          const billExpiry = new Date(billStart.getTime() + (validity - 1) * 86400000);
          billExpiryDate = billExpiry.toLocaleDateString();
        }
      }

      processedProperties.push({
        ...property._doc,
        planName: matchedPlan?.name || 'N/A',
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        planCreatedAt,
        planExpiryDate,
        adminName,
        billDate,
        validity,
        billExpiryDate,
        followUpAdminName,
        setPpcId: property.setPpcId || false,
        assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
        setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
        payUStatus: matchedPayU?.status || 'N/A',
        payustatususer: matchedPayU?.payustatususer || 'N/A',
        paymentId: matchedPayU?.mihpayid || 'N/A',
        transactionId: matchedPayU?.txnid || 'N/A',
        payUCreatedAt: matchedPayU?.createdAt || null,
        payUUpdatedAt: matchedPayU?.updatedAt || null,
        planDetails
      });
    }

    res.status(200).json({
      success: true,
      total: processedProperties.length,
      data: processedProperties
    });

  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all property data.',
      error: error.message
    });
  }
});



router.get('/fetch-all-phone-numbers', async (req, res) => {
  try {
    // Fetch only phoneNumber fields from the database
    const phoneNumbers = await AddModel.find({}, { phoneNumber: 1, _id: 0 });

    // Return the fetched phone numbers
    res.status(200).json({ message: 'All phone numbers fetched successfully!', phoneNumbers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching phone numbers.', error });
  }
});



// router.get('/fetch-address-datas', async (req, res) => {
//   try {
//     const selectedFields = {
//       phoneNumber: 1,
//       ppcId: 1,
//       assignedPhoneNumber: 1,
//       setPpcId: 1,
//       setPpcIdAssignedAt: 1,
//       propertyMode: 1,
//       propertyType: 1,
//       rentalPropertyAddress: 1,
//       price: 1,
//       country: 1,
//       city: 1,
//       state: 1,
//       district: 1,
//       pinCode: 1,
//       area: 1,
//       streetName: 1,
//       doorNumber: 1,
//       nagar: 1,
//       locationCoordinates: 1,
//       ownerName: 1,
//       email: 1
//     };

//     // Fetch only selected fields
//     const users = await AddModel.find({}, selectedFields);

//     res.status(200).json({
//       message: 'All selected user data fetched successfully!',
//       users
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error fetching user details.',
//       error: error.message
//     });
//   }
// });

router.get('/fetch-address-datas', async (req, res) => {
  try {
    const selectedFields = {
      phoneNumber: 1,
      ppcId: 1,
      assignedPhoneNumber: 1,
      setPpcId: 1,
      setPpcIdAssignedAt: 1,
      propertyMode: 1,
      propertyType: 1,
      rentalPropertyAddress: 1,
      price: 1,
      country: 1,
      city: 1,
      state: 1,
      district: 1,
      pinCode: 1,
      area: 1,
      streetName: 1,
      doorNumber: 1,
      nagar: 1,
      locationCoordinates: 1,
      ownerName: 1,
      email: 1,
      planName: 1,
      planCreatedAt: 1,
      createdAt: 1,
      updatedAt: 1
    };

    // Sort by latest created or updated
    const users = await AddModel.find({}, selectedFields)
      .sort({ updatedAt: -1, createdAt: -1 }); // Newest first

    res.status(200).json({
      message: 'All selected user data fetched successfully!',
      users
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user details.',
      error: error.message
    });
  }
});


// router.get("/fetch-featured-properties-on-demand", async (req, res) => {
//   try {
//     const featuredProperties = await AddModel.find({ featureStatus: "yes", isDeleted: { $ne: true } });

//     const finalData = await Promise.all(
//       featuredProperties.map(async (property) => {
//         const phone = property.phoneNumber;

//         // Check for verified users
//         const [otpUser, directUser] = await Promise.all([
//           UserLogin.findOne({ phone, otpStatus: "verified" }),
//           UserLogin.findOne({ phone, directVerified: true })
//         ]);

//         const isVerified = !!otpUser || !!directUser;
//         const otpStatus = otpUser ? "verified" : "not verified";
//         const createdBy = isVerified ? "User" : "Admin";
//         const price = createdBy === "Admin" ? "On Demand" : property.price;

//         return {
//           ...property.toObject(),
//           otpStatus,
//           isVerified,
//           createdBy,
//           price
//         };
//       })
//     );

//     res.status(200).json({
//       message: "Featured properties fetched successfully!",
//       properties: finalData,
//     });
//   } catch (error) {
//     console.error("Error fetching featured properties:", error);
//     res.status(500).json({ message: "Error fetching featured properties.", error });
//   }
// });



router.get("/fetch-featured-properties", async (req, res) => {
  try {
    const featuredProperties = await AddModel.find({ featureStatus: "yes" });

    res.status(200).json({
      message: "Featured properties fetched successfully!",
      properties: featuredProperties,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching featured properties.", error });
  }
});



router.get("/fetch-featured-properties-on-demand", async (req, res) => {
  try {
    const featuredPropertiesRaw = await AddModel.find({
      featureStatus: "yes",
      status: "active" // ? Only active properties
    }).lean();

    const featuredProperties = featuredPropertiesRaw.map((property) => {
      // ? Replace price with "On Demand" if flagged
      if (property.onDemand) {
        property.price = "On Demand";
      }
      return property;
    });

    res.status(200).json({
      message: "Featured active properties fetched successfully!",
      properties: featuredProperties,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching featured properties.", error });
  }
});

router.get("/fetch-featured-chennai-properties-on-demand", async (req, res) => {
  try {
    const regex = /^chennai$/i; // Match "chennai" in any case

    const featuredPropertiesRaw = await AddModel.find({
      featureStatus: "yes",
      status: "active",
      $or: [
        { city: { $regex: regex } },
        { district: { $regex: regex } },
        { area: { $regex: regex } },
        { nagar: { $regex: regex } }
      ]
    }).lean();

    const featuredProperties = featuredPropertiesRaw.map((property) => {
      if (property.onDemand) {
        property.price = "On Demand";
      }
      return property;
    });

    res.status(200).json({
      message: "Featured Chennai properties fetched successfully!",
      properties: featuredProperties,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching featured Chennai properties.",
      error,
    });
  }
});



// Route to get all property data
router.get('/properties', async (req, res) => {
  try {
    const properties = await AddModel.find(); // Get all properties
    res.status(200).json(properties); // Return the properties as JSON
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve properties', message: err.message });
  }
});




router.get('/uploads-count', async (req, res) => {
  const { ppcId } = req.query; // Use query params to pass ppcId

  // Ensure `ppcId` is provided
  if (!ppcId) {
    return res.status(400).json({ message: 'Property ID (ppcId) is required' });
  }

  try {
    // Find the property by `ppcId`
    const property = await AddModel.findOne({ ppcId });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Count the number of uploaded images
    const uploadedImagesCount = property.photos ? property.photos.length : 0;

    return res.status(200).json({
      message: 'Uploaded images count retrieved successfully',
      uploadedImagesCount,
      uploadedImages: property.photos || [], // Return the array of uploaded image filenames
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


router.get("/property/:ppcId", async (req, res) => {
  try {
    const { ppcId } = req.params;
    const property = await AddModel.findOne({ ppcId });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});




router.get('/fetch-data', async (req, res) => {
  const { phoneNumber, ppcId } = req.query;

  // Ensure at least one parameter is provided
  if (!phoneNumber && !ppcId) {
      return res.status(400).json({ message: 'Either phone number or PPC-ID is required.' });
  }

  try {

      // Normalize phone number (remove spaces, dashes, country code, and ensure consistency)
      const normalizedPhoneNumber = phoneNumber
          ? phoneNumber.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim() // Remove country code, spaces, dashes
          : null;

      // Build query dynamically based on the provided parameters
      const query = {};
      if (normalizedPhoneNumber) query.phoneNumber = new RegExp(normalizedPhoneNumber + '$'); // Match phone number ending with the query
      if (ppcId) query.ppcId = ppcId;


      // Fetch user from the database
      const user = await AddModel.findOne(query);

      // Check if user exists
      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }

      res.status(200).json({ message: 'User data fetched successfully!', user });
  } catch (error) {
      res.status(500).json({ message: 'Error fetching user details.', error });
  }
});




// router.get('/fetch-data-on-demand', async (req, res) => {
//   const { phoneNumber, ppcId } = req.query;

//   if (!phoneNumber && !ppcId) {
//     return res.status(400).json({ message: 'Either phone number or PPC-ID is required.' });
//   }

//   try {
//     const normalizedPhoneNumber = phoneNumber
//       ? phoneNumber.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim()
//       : null;

//     const query = {};
//     if (normalizedPhoneNumber) query.phoneNumber = new RegExp(normalizedPhoneNumber + '$');
//     if (ppcId) query.ppcId = Number(ppcId);

//     const property = await AddModel.findOne({
//       ...query,
//       isDeleted: { $ne: true }
//     }).sort({ updatedAt: -1 });

//     if (!property) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     const propertyData = property.toObject();
//     const phone = propertyData.phoneNumber;

//     // ?? Get OTP and direct verified users
//     const [otpUser, directUser] = await Promise.all([
//       UserLogin.findOne({ phone, otpStatus: 'verified' }),
//       UserLogin.findOne({ phone, directVerified: true })
//     ]);

//     const otpStatus = otpUser ? 'verified' : 'not verified';
//     const isVerifiedUser = !!otpUser || !!directUser;

//     // ?? Set createdBy and override price
//     const createdBy = (!isVerifiedUser && otpStatus === 'not verified') ? 'Admin' : 'User';
//     const displayPrice = createdBy === 'Admin' ? 'On Demand' : propertyData.price;

//     // ?? Optional: Include plan info (like `planCreatedAt`) from PricingPlans if needed
//     // const matchedPlan = await PricingPlans.findOne({ phoneNumber: phone });
//     // let planCreatedAt = matchedPlan?.createdAt?.toLocaleDateString() || 'N/A';

//     return res.status(200).json({
//       message: 'User data fetched successfully!',
//       user: {
//         ...propertyData,
//         price: displayPrice,
//         createdBy,
//         otpStatus,
//         isVerified: isVerifiedUser
//         // planCreatedAt, // if needed
//       }
//     });

//   } catch (error) {
//     console.error('Error in /fetch-data:', error);
//     return res.status(500).json({ message: 'Error fetching user details.', error: error.message });
//   }
// });


router.get('/fetch-data-on-demand', async (req, res) => {
  const { phoneNumber, ppcId } = req.query;

  if (!phoneNumber && !ppcId) {
    return res.status(400).json({ message: 'Either phoneNumber or ppcId is required.' });
  }

  try {
    const normalizedPhoneNumber = phoneNumber
      ? phoneNumber.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim()
      : null;

    const query = {};
    if (normalizedPhoneNumber) query.phoneNumber = new RegExp(normalizedPhoneNumber + '$');
    if (ppcId) query.ppcId = Number(ppcId);

    const property = await AddModel.findOne(query).lean(); // use .lean() for raw JSON

    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    // Replace price if onDemand is true
    if (property.onDemand) {
      property.price = "On Demand";
    }

    res.status(200).json({
      message: 'User data fetched successfully!',
      user: property
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});




router.get('/fetch-plan-with-usage', async (req, res) => {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required.' });
    }

    try {
        // Normalize phone number (remove +91, spaces, dashes)
        const normalizedPhone = phoneNumber.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

        // Fetch pricing plan
        const plan = await PricingPlans.findOne({ phoneNumber: normalizedPhone });

        if (!plan) {
            return res.status(404).json({ message: 'No plan found for this phone number.' });
        }

        // Count how many properties the user has posted (usedCars)
        const usedCars = await AddModel.countDocuments({
            phoneNumber: new RegExp(normalizedPhone + '$'), // Match end of number
            isDeleted: false // Ensure not deleted
        });

        const remainingCars = (plan.numOfCars || 0) - usedCars;

        // Calculate expiry date
        const createdAt = new Date(plan.createdAt);
        const duration = plan.durationDays || 0;
        const expiryDate = new Date(createdAt);
        expiryDate.setDate(createdAt.getDate() + duration);

        // Final response
        return res.status(200).json({
            status: "success",
            phoneNumber: plan.phoneNumber,
            planName: plan.name,
            packageType: plan.packageType,
            durationDays: plan.durationDays,
            numOfCars: plan.numOfCars,
            usedCars: usedCars,
            remainingCars: remainingCars < 0 ? 0 : remainingCars,
            price: plan.price,
            featuredMaxCar: plan.featuredMaxCar,
            featuredAds: plan.featuredAds,
            createdAt: plan.createdAt,
            expiryDate: expiryDate.toISOString().split("T")[0]
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch plan and usage details.",
            error: error.message
        });
    }
});






// // ? API to fetch viewed properties for a user
// router.get("/user-viewed-properties", async (req, res) => {
//   try {
//     const { phoneNumber } = req.query;

//     if (!phoneNumber) {
//       return res.status(400).json({ message: "phoneNumber is required" });
//     }

//     // Normalize phone number (remove spaces and '+')
//     const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

//     // Fetch the user's viewed properties
//     const userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

//     if (!userViews || userViews.viewedProperties.length === 0) {
//       return res.status(404).json({ message: "No viewed properties found" });
//     }

//     res.status(200).json({ viewedProperties: userViews.viewedProperties });
//   } catch (error) {
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });


// router.post("/user-viewed-property", async (req, res) => {
//   try {
//     const { phoneNumber, ppcId } = req.body;

//     if (!phoneNumber || !ppcId) {
//       return res.status(400).json({ message: "phoneNumber and ppcId are required" });
//     }

//     // Normalize phone number
//     const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

//     // Check if the property exists
//     const property = await AddModel.findOne({ ppcId });
//     if (!property) {
//       return res.status(404).json({ message: "Property not found" });
//     }

//     const propertyOwnerPhoneNumber = property.phoneNumber;

//     // ? Step 1: Record the view in UserViews
//     let userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

//     if (!userViews) {
//       userViews = new UserViewsModel({
//         phoneNumber: normalizedPhoneNumber,
//         viewedProperties: [
//           { ppcId, propertyOwnerPhoneNumber, viewedAt: new Date() },
//         ],
//       });
//     } else {
//       const alreadyViewed = userViews.viewedProperties.some((view) => view.ppcId === ppcId);
//       if (!alreadyViewed) {
//         userViews.viewedProperties.push({
//           ppcId,
//           propertyOwnerPhoneNumber,
//           viewedAt: new Date(),
//         });
//       }
//     }

//     await userViews.save();

//     // ? Step 2: Increment views in AddModel
//     await AddModel.updateOne({ ppcId }, { $inc: { views: 1 } });

//     // ? Step 3: Create a notification to the property owner
//     await NotificationUser.create({
//       recipientPhoneNumber: propertyOwnerPhoneNumber,
//       senderPhoneNumber: normalizedPhoneNumber,
//       message: `Your property (ID: ${ppcId}) was viewed by a user.`,
//       ppcId: ppcId,
//       createdAt: new Date(),
//     });

//     res.status(200).json({ message: "Property view recorded and notification sent" });
//   } catch (error) {
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });




// // Utility function to get last 10 digits of phone
// function getLast10Digits(phone) {
//   return phone ? phone.toString().slice(-10) : null;
// }

// // Utility to check if a date is within the last 30 days
// const THIRTY_DAYS_AGO = new Date();
// THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30);

// function isWithinLast30Days(date) {
//   return date && new Date(date) >= THIRTY_DAYS_AGO;
// }

// // Helper to fetch owner phones for multiple PPC IDs at once
// async function getOwnerPhonesForPpcIds(ppcIds) {
//   if (!ppcIds.length) return {};
//   const properties = await AddModel.find(
//     { ppcId: { $in: ppcIds } },
//     "ppcId phoneNumber"
//   );
//   const map = {};
//   properties.forEach((p) => {
//     map[p.ppcId] = p.phoneNumber ? getLast10Digits(p.phoneNumber) : null;
//   });
//   return map;
// }

// router.get("/get-users-without-posted-properties", async (req, res) => {
//   try {
//     // 1. Get all user logins with phone, loginDate, updatedAt in last 30 days
//     const logins = await UserLogin.find({
//       $or: [
//         { loginDate: { $gte: THIRTY_DAYS_AGO } },
//         { updatedAt: { $gte: THIRTY_DAYS_AGO } }
//       ]
//     }, "phone loginDate updatedAt");

//     // Map users with last 10 digit phones
//     const allUsers = logins.map((user) => ({
//       phoneNumber: getLast10Digits(user.phone),
//       loginDate: user.loginDate || null,
//       updateDate: user.updatedAt || null,
//     }));

//     // 2. Get phone numbers of users who have posted properties
//     const postedPhones = await AddModel.distinct("phoneNumber");
//     const postedPhoneSet = new Set(
//       postedPhones.filter(Boolean).map((p) => getLast10Digits(p))
//     );

//     // 3. Filter users who have NOT posted properties
//     const usersWithoutPosts = allUsers.filter(
//       (user) => user.phoneNumber && !postedPhoneSet.has(user.phoneNumber)
//     );

//     const userPhones = usersWithoutPosts.map((u) => u.phoneNumber);

//     // 4. Fetch views data from UserViewsModel for these users
//     const viewData = await UserViewsModel.find({
//       phoneNumber: { $in: userPhones },
//     });

//     // Build view map keyed by phoneNumber with view count and PPC IDs in last 30 days
//     const viewMap = new Map();

//     viewData.forEach((view) => {
//       const phone = getLast10Digits(view.phoneNumber);
//       if (!phone) return;

//       const recentViews = (view.viewedProperties || []).filter((vp) =>
//         isWithinLast30Days(vp.viewedAt)
//       );

//       viewMap.set(phone, {
//         dailyViewsCount: recentViews.length,
//         viewsRemaining: 30 - recentViews.length,
//         ppcIds: recentViews.map((vp) => vp.ppcId),
//       });
//     });

//     // 5. Fetch contactRequests from AddModel to count contacts per user in last 30 days
//     const contactData = await AddModel.find(
//       { "contactRequests.phoneNumber": { $exists: true, $ne: null } },
//       "ppcId contactRequests"
//     );

//     const contactMap = new Map();

//     for (const doc of contactData) {
//       const ppcId = doc.ppcId;
//       for (const req of doc.contactRequests) {
//         const phone = getLast10Digits(req.phoneNumber);
//         const reqDate = req.date || req.createdAt;
//         if (!phone || !isWithinLast30Days(reqDate)) continue;

//         if (!contactMap.has(phone)) {
//           contactMap.set(phone, { count: 1, ppcIds: [ppcId] });
//         } else {
//           const data = contactMap.get(phone);
//           if (!data.ppcIds.includes(ppcId)) data.ppcIds.push(ppcId);
//           data.count += 1;
//           contactMap.set(phone, data);
//         }
//       }
//     }

//     // 6. Collect all unique PPC IDs from views and contacts
//     const allPpcIdsSet = new Set();

//     viewMap.forEach((viewInfo) => {
//       viewInfo.ppcIds.forEach((ppcId) => allPpcIdsSet.add(ppcId));
//     });

//     contactMap.forEach((contactInfo) => {
//       contactInfo.ppcIds.forEach((ppcId) => allPpcIdsSet.add(ppcId));
//     });

//     const allPpcIds = Array.from(allPpcIdsSet);

//     // 7. Fetch owner phones for all relevant PPC IDs
//     const ppcIdToOwnerPhone = await getOwnerPhonesForPpcIds(allPpcIds);

//     // 8. Add owner phones to viewMap
//     for (const [phone, viewInfo] of viewMap) {
//       viewInfo.viewedPpcIds = viewInfo.ppcIds.map((ppcId) => ({
//         ppcId,
//         ownerPhone: ppcIdToOwnerPhone[ppcId] || null,
//       }));
//       delete viewInfo.ppcIds;
//     }

//     // 9. Add owner phones to contactMap
//     for (const [phone, contactInfo] of contactMap) {
//       contactInfo.contactedPpcIds = contactInfo.ppcIds.map((ppcId) => ({
//         ppcId,
//         ownerPhone: ppcIdToOwnerPhone[ppcId] || null,
//       }));
//       delete contactInfo.ppcIds;
//     }

//     // 10. Build final response array
//     const result = usersWithoutPosts.map((user) => {
//       const viewInfo = viewMap.get(user.phoneNumber) || {
//         dailyViewsCount: 0,
//         viewsRemaining: 30,
//         viewedPpcIds: [],
//       };

//       const contactInfo = contactMap.get(user.phoneNumber) || {
//         count: 0,
//         contactsRemaining: 30,
//         contactedPpcIds: [],
//       };

//       return {
//         phoneNumber: user.phoneNumber,
//         loginDate: user.loginDate,
//         updateDate: user.updateDate,
//         hasPostedProperty: false,
//         viewsInLast30Days: viewInfo.dailyViewsCount,
//         viewsRemaining: viewInfo.viewsRemaining,
//         viewedPpcIds: viewInfo.viewedPpcIds,
//         contactsInLast30Days: contactInfo.count,
//         contactsRemaining: 30 - contactInfo.count,
//         contactedPpcIds: contactInfo.contactedPpcIds,
//       };
//     });

//     res.status(200).json({
//       message: "Users without posted properties (last 30 days) fetched successfully",
//       usersWithoutPostedProperties: result,
//     });
//   } catch (error) {
//     console.error("API Error:", error);
//     res.status(500).json({
//       message: "Error fetching users without posted properties",
//       error: error.message,
//     });
//   }
// });






// // Helper function to get last 10 digits of phone
// function getLast10Digits(phone) {
//   if (!phone) return null;
//   const digits = phone.replace(/\D/g, ""); // Remove non-digit characters
//   return digits.length > 10 ? digits.slice(-10) : digits;
// }

// // Helper to check if a date is today (local time)
// function isToday(date) {
//   if (!date) return false;
//   const d = new Date(date);
//   const today = new Date();
//   return (
//     d.getDate() === today.getDate() &&
//     d.getMonth() === today.getMonth() &&
//     d.getFullYear() === today.getFullYear()
//   );
// }


// // Helper to fetch owner phones for multiple PPC IDs at once
// async function getOwnerPhonesForPpcIds(ppcIds) {
//   if (!ppcIds.length) return {};
//   const properties = await AddModel.find(
//     { ppcId: { $in: ppcIds } },
//     "ppcId phoneNumber"
//   );
//   const map = {};
//   properties.forEach((p) => {
//     map[p.ppcId] = p.phoneNumber ? getLast10Digits(p.phoneNumber) : null;
//   });
//   return map;
// }




// router.get("/get-users-without-posted-properties", async (req, res) => {
//   try {
//     // 1. Get all user logins with phone, loginDate, updatedAt
//     const logins = await UserLogin.find({}, "phone loginDate updatedAt");

//     // Map users with last 10 digit phones
//     const allUsers = logins.map((user) => ({
//       phoneNumber: getLast10Digits(user.phone),
//       loginDate: user.loginDate || null,
//       updateDate: user.updatedAt || null,
//     }));

//     // 2. Get phone numbers of users who have posted properties
//     const postedPhones = await AddModel.distinct("phoneNumber");
//     const postedPhoneSet = new Set(
//       postedPhones.filter(Boolean).map((p) => getLast10Digits(p))
//     );

//     // 3. Filter users who have NOT posted properties
//     const usersWithoutPosts = allUsers.filter(
//       (user) => user.phoneNumber && !postedPhoneSet.has(user.phoneNumber)
//     );

//     const userPhones = usersWithoutPosts.map((u) => u.phoneNumber);

//     // 4. Fetch views data from UserViewsModel for these users
//     const viewData = await UserViewsModel.find({
//       phoneNumber: { $in: userPhones },
//     });

//     // Build view map keyed by phoneNumber with daily view count and viewed PPC IDs today
//     const viewMap = new Map();

//     viewData.forEach((view) => {
//       const phone = getLast10Digits(view.phoneNumber);
//       if (!phone) return;

//       // Filter viewed properties only for today
//       const todayViews = (view.viewedProperties || []).filter((vp) =>
//         isToday(vp.viewedAt)
//       );

//       viewMap.set(phone, {
//         dailyViewsCount: todayViews.length,
//         viewsRemaining: 30 - todayViews.length,
//         ppcIds: todayViews.map((vp) => vp.ppcId),
//       });
//     });

//     // 5. Fetch contactRequests from AddModel to count contacts per user today with PPC IDs
//     const contactData = await AddModel.find(
//       { "contactRequests.phoneNumber": { $exists: true, $ne: null } },
//       "ppcId contactRequests"
//     );

//     // Build contact map keyed by phone with count and PPC IDs contacted today
//     const contactMap = new Map();

//     for (const doc of contactData) {
//       const ppcId = doc.ppcId;
//       for (const req of doc.contactRequests) {
//         const phone = getLast10Digits(req.phoneNumber);
//         // Use req.date or req.createdAt depending on your schema
//         const reqDate = req.date || req.createdAt;
//         if (!phone || !isToday(reqDate)) continue;

//         if (!contactMap.has(phone)) {
//           contactMap.set(phone, { count: 1, ppcIds: [ppcId] });
//         } else {
//           const data = contactMap.get(phone);
//           if (!data.ppcIds.includes(ppcId)) data.ppcIds.push(ppcId);
//           data.count += 1;
//           contactMap.set(phone, data);
//         }
//       }
//     }

//     // 6. Collect all unique PPC IDs from views and contacts to fetch owner phones once
//     const allPpcIdsSet = new Set();

//     viewMap.forEach((viewInfo) => {
//       viewInfo.ppcIds.forEach((ppcId) => allPpcIdsSet.add(ppcId));
//     });

//     contactMap.forEach((contactInfo) => {
//       contactInfo.ppcIds.forEach((ppcId) => allPpcIdsSet.add(ppcId));
//     });

//     const allPpcIds = Array.from(allPpcIdsSet);

//     // 7. Fetch owner phones for all relevant PPC IDs
//     const ppcIdToOwnerPhone = await getOwnerPhonesForPpcIds(allPpcIds);

//     // 8. Replace ppcIds arrays with objects including owner phone in viewMap
//     for (const [phone, viewInfo] of viewMap) {
//       viewInfo.viewedPpcIds = viewInfo.ppcIds.map((ppcId) => ({
//         ppcId,
//         ownerPhone: ppcIdToOwnerPhone[ppcId] || null,
//       }));
//       delete viewInfo.ppcIds; // remove old array
//     }

//     // 9. Replace ppcIds arrays with objects including owner phone in contactMap
//     for (const [phone, contactInfo] of contactMap) {
//       contactInfo.contactedPpcIds = contactInfo.ppcIds.map((ppcId) => ({
//         ppcId,
//         ownerPhone: ppcIdToOwnerPhone[ppcId] || null,
//       }));
//       delete contactInfo.ppcIds;
//     }

//     // 10. Build final response array
//     const result = usersWithoutPosts.map((user) => {
//       const viewInfo = viewMap.get(user.phoneNumber) || {
//         dailyViewsCount: 0,
//         viewsRemaining: 30,
//         viewedPpcIds: [],
//       };

//       const contactInfo = contactMap.get(user.phoneNumber) || {
//         count: 0,
//         contactsRemaining: 30,
//         contactedPpcIds: [],
//       };

//       return {
//         phoneNumber: user.phoneNumber,
//         loginDate: user.loginDate,
//         updateDate: user.updateDate,
//         hasPostedProperty: false,
//         viewsToday: viewInfo.dailyViewsCount,
//         viewsRemaining: viewInfo.viewsRemaining,
//         viewedPpcIds: viewInfo.viewedPpcIds,
//         contactsToday: contactInfo.count,
//         contactsRemaining: 30 - contactInfo.count,
//         contactedPpcIds: contactInfo.contactedPpcIds,
//       };
//     });

//     res.status(200).json({
//       message: "Users without posted properties fetched successfully",
//       usersWithoutPostedProperties: result,
//     });
//   } catch (error) {
//     console.error("API Error:", error);
//     res.status(500).json({
//       message: "Error fetching users without posted properties",
//       error: error.message,
//     });
//   }
// });










// Helper: get last 10 digits of phone
function getLast10Digits(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

// Helper: check if a date is within last N days
function isWithinLastNDays(date, n = 30) {
  const now = new Date();
  const target = new Date(date);
  const diffTime = now - target;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= n;
}

// router.get("/get-users-without-posted-properties-30days", async (req, res) => {
//   try {
//     // 1. Get all users
//     const logins = await UserLogin.find({}, "phone loginDate updatedAt");

//     const allUsers = logins.map((user) => ({
//       phoneNumber: getLast10Digits(user.phone),
//       loginDate: user.loginDate,
//       updateDate: user.updatedAt,
//     }));

//     // 2. Get phones of users who posted properties
//     const postedPhones = await AddModel.distinct("phoneNumber");
//     const postedPhoneSet = new Set(
//       postedPhones.filter(Boolean).map(getLast10Digits)
//     );

//     // 3. Filter users who haven�t posted properties
//     const usersWithoutPosts = allUsers.filter(
//       (u) => u.phoneNumber && !postedPhoneSet.has(u.phoneNumber)
//     );

//     const phoneList = usersWithoutPosts.map((u) => u.phoneNumber);

//     // 4. Fetch 30-day views from UserViewsModel
//     const viewsData = await UserViewsModel.find({
//       phoneNumber: { $in: phoneList },
//     });

//     const viewMap = new Map();

//     viewsData.forEach((user) => {
//       const phone = getLast10Digits(user.phoneNumber);
//       const viewsInLast30Days = (user.viewedProperties || []).filter((vp) =>
//         isWithinLastNDays(vp.viewedAt)
//       );
//       viewMap.set(phone, {
//         count: viewsInLast30Days.length,
//         ppcIds: viewsInLast30Days.map((vp) => vp.ppcId),
//       });
//     });

//     // 5. Fetch 30-day contact requests
//     const contactData = await AddModel.find(
//       { "contactRequests.phoneNumber": { $exists: true, $ne: null } },
//       "ppcId contactRequests"
//     );

//     const contactMap = new Map();

//     contactData.forEach((doc) => {
//       const ppcId = doc.ppcId;
//       (doc.contactRequests || []).forEach((req) => {
//         const phone = getLast10Digits(req.phoneNumber);
//         const date = req.date || req.createdAt;
//         if (!phone || !isWithinLastNDays(date)) return;

//         if (!contactMap.has(phone)) {
//           contactMap.set(phone, { count: 1, ppcIds: [ppcId] });
//         } else {
//           const info = contactMap.get(phone);
//           if (!info.ppcIds.includes(ppcId)) info.ppcIds.push(ppcId);
//           info.count += 1;
//           contactMap.set(phone, info);
//         }
//       });
//     });

//     // 6. Final Response
//     const result = usersWithoutPosts.map((user) => {
//       const views = viewMap.get(user.phoneNumber) || { count: 0, ppcIds: [] };
//       const contacts =
//         contactMap.get(user.phoneNumber) || { count: 0, ppcIds: [] };

//       return {
//         phoneNumber: user.phoneNumber,
//         loginDate: user.loginDate,
//         updateDate: user.updateDate,
//         viewsInLast30Days: views.count,
//         viewedPpcIds: views.ppcIds,
//         contactsInLast30Days: contacts.count,
//         contactedPpcIds: contacts.ppcIds,
//       };
//     });

//     res.status(200).json({
//       message: "Users without posted properties (last 30 days) fetched",
//       users: result,
//     });
//   } catch (error) {
//     console.error("Error in 30-day fetch:", error);
//     res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// });




router.get("/get-users-without-posted-properties-30days", async (req, res) => {
  try {
    // Utility function: Checks if a date is within last 30 days
    const isWithinLastNDays = (date, days = 30) => {
      const now = new Date();
      const d = new Date(date);
      return (
        !isNaN(d) &&
        now - d <= days * 24 * 60 * 60 * 1000 &&
        d <= now
      );
    };

    // 1. Get all users
    const logins = await UserLogin.find({}, "phone loginDate updatedAt");

    const allUsers = logins.map((user) => ({
      phoneNumber: getLast10Digits(user.phone),
      loginDate: user.loginDate,
      updateDate: user.updatedAt,
    }));

    // 2. Get phones of users who posted properties
    const postedPhones = await AddModel.distinct("phoneNumber");
    const postedPhoneSet = new Set(
      postedPhones.filter(Boolean).map(getLast10Digits)
    );

    // 3. Filter users who haven�t posted properties
    const usersWithoutPosts = allUsers.filter(
      (u) => u.phoneNumber && !postedPhoneSet.has(u.phoneNumber)
    );

    const phoneList = usersWithoutPosts.map((u) => u.phoneNumber);

    // 4. Fetch 30-day views
    const viewsData = await UserViewsModel.find({
      phoneNumber: { $in: phoneList },
    });

    const viewMap = new Map();

    viewsData.forEach((user) => {
      const phone = getLast10Digits(user.phoneNumber);
      const viewsInLast30Days = (user.viewedProperties || []).filter((vp) =>
        isWithinLastNDays(vp.viewedAt)
      ).map((vp) => ({
        ppcId: vp.ppcId,
        viewedAt: vp.viewedAt,
      }));
      viewMap.set(phone, viewsInLast30Days);
    });

    // 5. Fetch 30-day contact requests
    const contactData = await AddModel.find(
      { "contactRequests.phoneNumber": { $exists: true, $ne: null } },
      "ppcId contactRequests"
    );

    const contactMap = new Map();

    contactData.forEach((doc) => {
      const ppcId = doc.ppcId;
      (doc.contactRequests || []).forEach((req) => {
        const phone = getLast10Digits(req.phoneNumber);
        const date = req.date || req.createdAt;
        if (!phone || !isWithinLastNDays(date)) return;

        const contactEntry = {
          ppcId,
          contactedAt: date,
        };

        if (!contactMap.has(phone)) {
          contactMap.set(phone, [contactEntry]);
        } else {
          contactMap.get(phone).push(contactEntry);
        }
      });
    });

    // 6. Final Response
    const result = usersWithoutPosts.map((user) => {
      const views = viewMap.get(user.phoneNumber) || [];
      const contacts = contactMap.get(user.phoneNumber) || [];

      return {
        phoneNumber: user.phoneNumber,
        loginDate: user.loginDate,
        updateDate: user.updateDate,
        viewsInLast30Days: views.length,
        viewedPpcDetails: views, // Includes ppcId and viewedAt
        contactsInLast30Days: contacts.length,
        contactedPpcDetails: contacts, // Includes ppcId and contactedAt
      };
    });

    res.status(200).json({
      message: "Users without posted properties (last 30 days) fetched",
      users: result,
    });
  } catch (error) {
    console.error("Error in 30-day fetch:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});





// // Helper function to get last 10 digits of phone
// function getLast10Digits(phone) {
//   if (!phone) return null;
//   const digits = phone.replace(/\D/g, ""); // Remove non-digit characters
//   return digits.length > 10 ? digits.slice(-10) : digits;
// }

// Helper to check if a date is today (local time)
function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

// Helper to fetch owner phones for multiple PPC IDs at once
async function getOwnerPhonesForPpcIds(ppcIds) {
  if (!ppcIds.length) return {};
  const properties = await AddModel.find(
    { ppcId: { $in: ppcIds } },
    "ppcId phoneNumber"
  );
  const map = {};
  properties.forEach((p) => {
    map[p.ppcId] = p.phoneNumber ? getLast10Digits(p.phoneNumber) : null;
  });
  return map;
}

// Main API Route
router.get("/get-users-without-posted-properties", async (req, res) => {
  try {
    // 1. Get all user logins with phone, loginDate, updatedAt
    const logins = await UserLogin.find({}, "phone loginDate updatedAt");

    // Normalize phone numbers
    const allUsers = logins.map((user) => ({
      phoneNumber: getLast10Digits(user.phone),
      loginDate: user.loginDate || null,
      updateDate: user.updatedAt || null,
    }));

    // 2. Get all phone numbers of users who have posted properties
    const postedPhones = await AddModel.distinct("phoneNumber");
    const postedPhoneSet = new Set(
      postedPhones.filter(Boolean).map((p) => getLast10Digits(p))
    );

    // 3. Filter users who have NOT posted properties
    const usersWithoutPosts = allUsers.filter(
      (user) => user.phoneNumber && !postedPhoneSet.has(user.phoneNumber)
    );

    const userPhones = usersWithoutPosts.map((u) => u.phoneNumber);

    // 4. Fetch views data from UserViewsModel for these users
    const viewData = await UserViewsModel.find({
      phoneNumber: { $in: userPhones },
    });

    // 5. Build view map (phone ? { daily count, remaining, ppcIds })
    const viewMap = new Map();
    viewData.forEach((view) => {
      const phone = getLast10Digits(view.phoneNumber);
      if (!phone) return;

      const todayViews = (view.viewedProperties || []).filter((vp) =>
        isToday(vp.viewedAt)
      );

      viewMap.set(phone, {
        dailyViewsCount: todayViews.length,
        viewsRemaining: Math.max(0, 30 - todayViews.length), // ? capped at 0
        ppcIds: todayViews.map((vp) => vp.ppcId),
      });
    });

    // 6. Fetch contact requests from AddModel
    const contactData = await AddModel.find(
      { "contactRequests.phoneNumber": { $exists: true, $ne: null } },
      "ppcId contactRequests"
    );

    // Build contact map
    const contactMap = new Map();
    for (const doc of contactData) {
      const ppcId = doc.ppcId;
      for (const req of doc.contactRequests) {
        const phone = getLast10Digits(req.phoneNumber);
        const reqDate = req.date || req.createdAt;
        if (!phone || !isToday(reqDate)) continue;

        if (!contactMap.has(phone)) {
          contactMap.set(phone, { count: 1, ppcIds: [ppcId] });
        } else {
          const data = contactMap.get(phone);
          if (!data.ppcIds.includes(ppcId)) data.ppcIds.push(ppcId);
          data.count += 1;
          contactMap.set(phone, data);
        }
      }
    }

    // 7. Collect all unique PPC IDs from views and contacts
    const allPpcIdsSet = new Set();
    viewMap.forEach((v) => v.ppcIds.forEach((id) => allPpcIdsSet.add(id)));
    contactMap.forEach((c) => c.ppcIds.forEach((id) => allPpcIdsSet.add(id)));
    const allPpcIds = Array.from(allPpcIdsSet);

    // 8. Fetch owner phones for PPC IDs
    const ppcIdToOwnerPhone = await getOwnerPhonesForPpcIds(allPpcIds);

    // 9. Add ownerPhone mapping to viewMap
    for (const [phone, viewInfo] of viewMap) {
      viewInfo.viewedPpcIds = viewInfo.ppcIds.map((ppcId) => ({
        ppcId,
        ownerPhone: ppcIdToOwnerPhone[ppcId] || null,
      }));
      delete viewInfo.ppcIds;
    }

    // 10. Add ownerPhone mapping to contactMap
    for (const [phone, contactInfo] of contactMap) {
      contactInfo.contactedPpcIds = contactInfo.ppcIds.map((ppcId) => ({
        ppcId,
        ownerPhone: ppcIdToOwnerPhone[ppcId] || null,
      }));
      delete contactInfo.ppcIds;
    }

    // 11. Build final response
    const result = usersWithoutPosts.map((user) => {
      const viewInfo = viewMap.get(user.phoneNumber) || {
        dailyViewsCount: 0,
        viewsRemaining: 30,
        viewedPpcIds: [],
      };

      const contactInfo = contactMap.get(user.phoneNumber) || {
        count: 0,
        contactedPpcIds: [],
      };

      return {
        phoneNumber: user.phoneNumber,
        loginDate: user.loginDate,
        updateDate: user.updateDate,
        hasPostedProperty: false,
        viewsToday: viewInfo.dailyViewsCount,
        viewsRemaining: Math.max(0, viewInfo.viewsRemaining), // ? always non-negative
        viewedPpcIds: viewInfo.viewedPpcIds,
        contactsToday: contactInfo.count,
        contactsRemaining: Math.max(0, 30 - contactInfo.count), // ? always non-negative
        contactedPpcIds: contactInfo.contactedPpcIds,
      };
    });

    // 12. Respond with the data
    res.status(200).json({
      message: "Users without posted properties fetched successfully",
      usersWithoutPostedProperties: result,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Error fetching users without posted properties",
      error: error.message,
    });
  }
});






// Helper: Calculate expiry date from created date and duration
const calculateExpiryDate = (createdAt, durationDays) => {
  const created = new Date(createdAt);
  created.setDate(created.getDate() + durationDays);
  return created;
};



router.get("/get-users-without-posted-properties-plans", async (req, res) => {
  try {
    const logins = await UserLogin.find({}, "phone loginDate updatedAt");
    const allUsers = logins.map((user) => ({
      phoneNumber: getLast10Digits(user.phone),
      loginDate: user.loginDate || null,
      updateDate: user.updatedAt || null,
    }));

    const postedPhones = await AddModel.distinct("phoneNumber");
    const postedPhoneSet = new Set(postedPhones.map(p => getLast10Digits(p)));

    const usersWithoutPosts = allUsers.filter(
      (user) => user.phoneNumber && !postedPhoneSet.has(user.phoneNumber)
    );
    const userPhones = usersWithoutPosts.map((u) => u.phoneNumber);

    const viewData = await UserViewsModel.find({ phoneNumber: { $in: userPhones } });

    const viewMap = new Map();
    viewData.forEach((view) => {
      const phone = getLast10Digits(view.phoneNumber);
      const todayViews = (view.viewedProperties || []).filter((vp) => isToday(vp.viewedAt));
      viewMap.set(phone, {
        dailyViewsCount: todayViews.length,
        viewsRemaining: Math.max(0, 30 - todayViews.length),
        ppcIds: todayViews.map((vp) => vp.ppcId),
      });
    });

    const contactData = await AddModel.find(
      { "contactRequests.phoneNumber": { $exists: true, $ne: null } },
      "ppcId contactRequests"
    );

    const contactMap = new Map();
    for (const doc of contactData) {
      const ppcId = doc.ppcId;
      for (const req of doc.contactRequests) {
        const phone = getLast10Digits(req.phoneNumber);
        const reqDate = req.date || req.createdAt;
        if (!phone || !isToday(reqDate)) continue;

        if (!contactMap.has(phone)) {
          contactMap.set(phone, { count: 1, ppcIds: [ppcId] });
        } else {
          const data = contactMap.get(phone);
          if (!data.ppcIds.includes(ppcId)) data.ppcIds.push(ppcId);
          data.count += 1;
        }
      }
    }

    const allPpcIds = Array.from(new Set([
      ...Array.from(viewMap.values()).flatMap(v => v.ppcIds),
      ...Array.from(contactMap.values()).flatMap(c => c.ppcIds)
    ]));

    const ppcIdToOwnerPhone = await getOwnerPhonesForPpcIds(allPpcIds);

    for (const [phone, viewInfo] of viewMap) {
      viewInfo.viewedPpcIds = viewInfo.ppcIds.map(ppcId => ({
        ppcId,
        ownerPhone: ppcIdToOwnerPhone[ppcId] || null
      }));
      delete viewInfo.ppcIds;
    }

    for (const [phone, contactInfo] of contactMap) {
      contactInfo.contactedPpcIds = contactInfo.ppcIds.map(ppcId => ({
        ppcId,
        ownerPhone: ppcIdToOwnerPhone[ppcId] || null
      }));
      delete contactInfo.ppcIds;
    }

    const plans = await PricingPlans.find({ phoneNumber: { $in: userPhones } });

    const phoneToPlan = new Map();
   
plans.forEach(plan => {
  if (Array.isArray(plan.phoneNumber)) {
    plan.phoneNumber.forEach(phone => {
      const duration = plan.durationDays || 0;
      const expiry = calculateExpiryDate(plan.createdAt, duration);
      phoneToPlan.set(phone, {
        planName: plan.name,
        planCreatedDate: plan.createdAt,
        durationDays: duration,
        expiryDate: expiry,
      });
    });
  } else if (typeof plan.phoneNumber === 'string') {
    const phone = getLast10Digits(plan.phoneNumber);
    const duration = plan.durationDays || 0;
    const expiry = calculateExpiryDate(plan.createdAt, duration);
    phoneToPlan.set(phone, {
      planName: plan.name,
      planCreatedDate: plan.createdAt,
      durationDays: duration,
      expiryDate: expiry,
    });
  }
});

    const result = usersWithoutPosts.map(user => {
      const viewInfo = viewMap.get(user.phoneNumber) || {
        dailyViewsCount: 0,
        viewsRemaining: 30,
        viewedPpcIds: [],
      };

      const contactInfo = contactMap.get(user.phoneNumber) || {
        count: 0,
        contactedPpcIds: [],
      };

      const plan = phoneToPlan.get(user.phoneNumber) || null;

      return {
        phoneNumber: user.phoneNumber,
        loginDate: user.loginDate,
        updateDate: user.updateDate,
        hasPostedProperty: false,
        planName: plan ? plan.planName : null,
        planCreatedDate: plan ? plan.planCreatedDate : null,
        durationDays: plan ? plan.durationDays : null,
        expiryDate: plan ? plan.expiryDate : null,
        viewsToday: viewInfo.dailyViewsCount,
        viewsRemaining: viewInfo.viewsRemaining,
        viewedPpcIds: viewInfo.viewedPpcIds,
        contactsToday: contactInfo.count,
        contactsRemaining: Math.max(0, 30 - contactInfo.count),
        contactedPpcIds: contactInfo.contactedPpcIds,
      };
    });

    res.status(200).json({
      message: "Users without posted properties (with plan info) fetched successfully",
      usersWithoutPostedProperties: result,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});





// Main API Route
router.get("/get-users-viewall-contact-data", async (req, res) => {
  try {
    // 1. Get all user logins
    const logins = await UserLogin.find({}, "phone loginDate updatedAt");

    // Normalize phone numbers
    const allUsers = logins.map((user) => ({
      phoneNumber: getLast10Digits(user.phone),
      loginDate: user.loginDate || null,
      updateDate: user.updatedAt || null,
    }));

    // 2. Get phone numbers of users who posted properties
    const postedPhones = await AddModel.distinct("phoneNumber");
    const postedPhoneSet = new Set(
      postedPhones.filter(Boolean).map((p) => getLast10Digits(p))
    );

    // 3. Separate users into hasPostedProperty: true / false
    const categorizedUsers = allUsers.map((user) => ({
      ...user,
      hasPostedProperty: postedPhoneSet.has(user.phoneNumber),
    }));

    const allUserPhones = categorizedUsers.map((u) => u.phoneNumber);

    // 4. Get view data
    const viewData = await UserViewsModel.find({
      phoneNumber: { $in: allUserPhones },
    });

    const viewMap = new Map();
    viewData.forEach((view) => {
      const phone = getLast10Digits(view.phoneNumber);
      if (!phone) return;

      const views = (view.viewedProperties || []).map((vp) => ({
        ppcId: vp.ppcId,
        viewedAt: vp.viewedAt,
      }));

      viewMap.set(phone, {
        allViews: views,
        viewsRemaining: Math.max(0, 30 - views.length),
      });
    });

    // 5. Get contact requests from AddModel
    const contactData = await AddModel.find(
      { "contactRequests.phoneNumber": { $exists: true, $ne: null } },
      "ppcId contactRequests"
    );

    const contactMap = new Map();
    for (const doc of contactData) {
      const ppcId = doc.ppcId;
      for (const req of doc.contactRequests || []) {
        const phone = getLast10Digits(req.phoneNumber);
        const reqDate = req.date || req.createdAt;
        if (!phone || !ppcId || !reqDate) continue;

        if (!contactMap.has(phone)) {
          contactMap.set(phone, {
            contactedPpcIds: [{ ppcId, date: reqDate }],
          });
        } else {
          const data = contactMap.get(phone);
          data.contactedPpcIds.push({ ppcId, date: reqDate });
          contactMap.set(phone, data);
        }
      }
    }

    // 6. Collect all unique PPC IDs from both views and contacts
    const allPpcIdsSet = new Set();
    viewMap.forEach((v) => v.allViews.forEach((vp) => allPpcIdsSet.add(vp.ppcId)));
    contactMap.forEach((c) => c.contactedPpcIds.forEach((cp) => allPpcIdsSet.add(cp.ppcId)));
    const allPpcIds = Array.from(allPpcIdsSet);

    // 7. Fetch owner phone mapping for PPC IDs
    const ppcIdToOwnerPhone = await getOwnerPhonesForPpcIds(allPpcIds);

    // 8. Add ownerPhone mapping to viewMap
    for (const [phone, viewInfo] of viewMap) {
      viewInfo.viewedPpcIds = viewInfo.allViews.map((vp) => ({
        ppcId: vp.ppcId,
        viewedAt: vp.viewedAt,
        ownerPhone: ppcIdToOwnerPhone[vp.ppcId] || null,
      }));
      delete viewInfo.allViews;
    }

    // 9. Add ownerPhone mapping to contactMap
    for (const [phone, contactInfo] of contactMap) {
      contactInfo.contactedPpcIds = contactInfo.contactedPpcIds.map((cp) => ({
        ...cp,
        ownerPhone: ppcIdToOwnerPhone[cp.ppcId] || null,
      }));
    }

    // 10. Build response
    const result = categorizedUsers.map((user) => {
      const viewInfo = viewMap.get(user.phoneNumber) || {
        viewsRemaining: 30,
        viewedPpcIds: [],
      };

      const contactInfo = contactMap.get(user.phoneNumber) || {
        contactedPpcIds: [],
      };

      return {
        phoneNumber: user.phoneNumber,
        loginDate: user.loginDate,
        updateDate: user.updateDate,
        hasPostedProperty: user.hasPostedProperty,
        viewsToday: viewInfo.viewedPpcIds.length,
        viewsRemaining: viewInfo.viewsRemaining,
        viewedPpcIds: viewInfo.viewedPpcIds,
        contactsToday: contactInfo.contactedPpcIds.length,
        contactsRemaining: Math.max(0, 30 - contactInfo.contactedPpcIds.length),
        contactedPpcIds: contactInfo.contactedPpcIds,
      };
    });

    // 11. Send final response
    res.status(200).json({
      message: "User view and contact data fetched successfully",
      users: result,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Error fetching data",
      error: error.message,
    });
  }
});



router.get("/get-users-viewall-contact-data-30days", async (req, res) => {
  try {
    const THIRTY_DAYS_AGO = new Date();
    THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30);

    // 1. Get all user logins
    const logins = await UserLogin.find({}, "phone loginDate updatedAt");

    // Normalize phone numbers
    const allUsers = logins.map((user) => ({
      phoneNumber: getLast10Digits(user.phone),
      loginDate: user.loginDate || null,
      updateDate: user.updatedAt || null,
    }));

    // 2. Get phone numbers of users who posted properties
    const postedPhones = await AddModel.distinct("phoneNumber");
    const postedPhoneSet = new Set(
      postedPhones.filter(Boolean).map((p) => getLast10Digits(p))
    );

    // 3. Separate users into hasPostedProperty: true / false
    const categorizedUsers = allUsers.map((user) => ({
      ...user,
      hasPostedProperty: postedPhoneSet.has(user.phoneNumber),
    }));

    const allUserPhones = categorizedUsers.map((u) => u.phoneNumber);

    // 4. Get view data - filter views within last 30 days
    const viewData = await UserViewsModel.find({
      phoneNumber: { $in: allUserPhones },
    });

    const viewMap = new Map();
    viewData.forEach((view) => {
      const phone = getLast10Digits(view.phoneNumber);
      if (!phone) return;

      // Filter viewedProperties by last 30 days only
      const recentViews = (view.viewedProperties || []).filter(
        (vp) => vp.viewedAt && new Date(vp.viewedAt) >= THIRTY_DAYS_AGO
      );

      const views = recentViews.map((vp) => ({
        ppcId: vp.ppcId,
        viewedAt: vp.viewedAt,
      }));

      viewMap.set(phone, {
        allViews: views,
        viewsRemaining: Math.max(0, 30 - views.length),
      });
    });

    // 5. Get contact requests from AddModel, filter by last 30 days
    const contactData = await AddModel.find(
      { "contactRequests.phoneNumber": { $exists: true, $ne: null } },
      "ppcId contactRequests"
    );

    const contactMap = new Map();
    for (const doc of contactData) {
      const ppcId = doc.ppcId;
      for (const req of doc.contactRequests || []) {
        const phone = getLast10Digits(req.phoneNumber);
        const reqDate = req.date || req.createdAt;
        if (!phone || !ppcId || !reqDate) continue;

        if (new Date(reqDate) < THIRTY_DAYS_AGO) {
          // Skip requests older than 30 days
          continue;
        }

        if (!contactMap.has(phone)) {
          contactMap.set(phone, {
            contactedPpcIds: [{ ppcId, date: reqDate }],
          });
        } else {
          const data = contactMap.get(phone);
          data.contactedPpcIds.push({ ppcId, date: reqDate });
          contactMap.set(phone, data);
        }
      }
    }

    // 6. Collect all unique PPC IDs from both views and contacts
    const allPpcIdsSet = new Set();
    viewMap.forEach((v) => v.allViews.forEach((vp) => allPpcIdsSet.add(vp.ppcId)));
    contactMap.forEach((c) => c.contactedPpcIds.forEach((cp) => allPpcIdsSet.add(cp.ppcId)));
    const allPpcIds = Array.from(allPpcIdsSet);

    // 7. Fetch owner phone mapping for PPC IDs
    const ppcIdToOwnerPhone = await getOwnerPhonesForPpcIds(allPpcIds);

    // 8. Add ownerPhone mapping to viewMap
    for (const [phone, viewInfo] of viewMap) {
      viewInfo.viewedPpcIds = viewInfo.allViews.map((vp) => ({
        ppcId: vp.ppcId,
        viewedAt: vp.viewedAt,
        ownerPhone: ppcIdToOwnerPhone[vp.ppcId] || null,
      }));
      delete viewInfo.allViews;
    }

    // 9. Add ownerPhone mapping to contactMap
    for (const [phone, contactInfo] of contactMap) {
      contactInfo.contactedPpcIds = contactInfo.contactedPpcIds.map((cp) => ({
        ...cp,
        ownerPhone: ppcIdToOwnerPhone[cp.ppcId] || null,
      }));
    }

    // 10. Build response
    const result = categorizedUsers.map((user) => {
      const viewInfo = viewMap.get(user.phoneNumber) || {
        viewsRemaining: 30,
        viewedPpcIds: [],
      };

      const contactInfo = contactMap.get(user.phoneNumber) || {
        contactedPpcIds: [],
      };

      return {
        phoneNumber: user.phoneNumber,
        loginDate: user.loginDate,
        updateDate: user.updateDate,
        hasPostedProperty: user.hasPostedProperty,
        viewsToday: viewInfo.viewedPpcIds.length,
        viewsRemaining: viewInfo.viewsRemaining,
        viewedPpcIds: viewInfo.viewedPpcIds,
        contactsToday: contactInfo.contactedPpcIds.length,
        contactsRemaining: Math.max(0, 30 - contactInfo.contactedPpcIds.length),
        contactedPpcIds: contactInfo.contactedPpcIds,
      };
    });

    // 11. Send final response
    res.status(200).json({
      message: "User view and contact data fetched successfully",
      users: result,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Error fetching data",
      error: error.message,
    });
  }
});




// GET all users� viewed properties, with full AddModel details
router.get("/all-user-viewed-properties", async (req, res) => {
  try {
    // 1) fetch every user�s views record
    const allUserViews = await UserViewsModel.find({});

    if (allUserViews.length === 0) {
      return res.status(404).json({ message: "No viewed properties found." });
    }

    // 2) enrich each view entry with the AddModel record
    const enriched = await Promise.all(
      allUserViews.map(async (userView) => {
        const enrichedProps = await Promise.all(
          userView.viewedProperties.map(async (view) => {
            // ensure numeric matching
            const ppcIdNum = Number(view.ppcId);
            const property = await AddModel.findOne({ ppcId: ppcIdNum }).lean();
            return {
              ppcId: view.ppcId,
              viewedAt: view.viewedAt,
              viewerPhoneNumber: view.viewerPhoneNumber,
              propertyOwnerPhoneNumber: view.propertyOwnerPhoneNumber,
              photos: view.photos,
              propertyDetails: property || null
            };
          })
        );

        return {
          phoneNumber: userView.phoneNumber,
          dailyViewsCount: userView.dailyViewsCount,
          lastViewDate: userView.lastViewDate,
          viewedProperties: enrichedProps
        };
      })
    );

    res.status(200).json(enriched);
  } catch (err) {
    console.error("Error fetching all user views:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

  

// router.post("/user-viewed-property", async (req, res) => {
//   try {
//     const { phoneNumber, ppcId } = req.body;

//     if (!phoneNumber || !ppcId) {
//       return res.status(400).json({ message: "phoneNumber and ppcId are required" });
//     }

//     const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");
//     const property = await AddModel.findOne({ ppcId });

//     if (!property) {
//       return res.status(404).json({ message: "Property not found" });
//     }

//     const propertyOwnerPhoneNumber = property.phoneNumber;
//     const today = new Date();
//     const startOfToday = new Date(today.setHours(0, 0, 0, 0));

//     let userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

//     if (!userViews) {
//       userViews = new UserViewsModel({
//         phoneNumber: normalizedPhoneNumber,
//         dailyViewsCount: 1,
//         lastViewDate: new Date(),
//         viewedProperties: [
//           { ppcId, propertyOwnerPhoneNumber, viewerPhoneNumber: normalizedPhoneNumber },
//         ],
//       });
//     } else {
//       // Reset count if it's a new day
//       const lastViewDate = new Date(userViews.lastViewDate || 0);
//       if (lastViewDate < startOfToday) {
//         userViews.dailyViewsCount = 0;
//         userViews.lastViewDate = new Date();
//         userViews.viewedProperties = []; // optional: reset daily views
//       }

//       if (userViews.dailyViewsCount >= 30) {
//         return res.status(429).json({ message: "Daily view limit reached (30)." });
//       }

//       const alreadyViewed = userViews.viewedProperties.some((view) => view.ppcId === ppcId);
//       if (!alreadyViewed) {
//         userViews.viewedProperties.push({
//           ppcId,
//           propertyOwnerPhoneNumber,
//           viewerPhoneNumber: normalizedPhoneNumber,
//           viewedAt: new Date(),
//         });
//         userViews.dailyViewsCount += 1;
//         userViews.lastViewDate = new Date();
//       } else {
//         return res.status(409).json({ message: "Property already viewed today." });
//       }
//     }

//     await userViews.save();

//     // Increment property view count
//     await AddModel.updateOne({ ppcId }, { $inc: { views: 1 } });

//     // Notify property owner
//     await NotificationUser.create({
//       recipientPhoneNumber: propertyOwnerPhoneNumber,
//       senderPhoneNumber: normalizedPhoneNumber,
//       message: `Your property (ID: ${ppcId}) was viewed by a user.`,
//       ppcId,
//       createdAt: new Date(),
//     });

//     res.status(200).json({ message: "Property view recorded and notification sent." });
//   } catch (error) {
//     console.error("Error recording view:", error);
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });




// ------------------


router.post("/user-viewed-property", async (req, res) => {
  try {
    const { phoneNumber, ppcId } = req.body;

    if (!phoneNumber || !ppcId) {
      return res.status(400).json({ message: "phoneNumber and ppcId are required" });
    }

    const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

    const property = await AddModel.findOne({ ppcId });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const propertyOwnerPhoneNumber = property.phoneNumber;

    // Get start of today (00:00)
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));

    // Find or create user views record
    let userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

    // Use default limit 30 if user hasn't set any
    const DEFAULT_VIEW_LIMIT = 30;

    if (!userViews) {
      // Create new with default limit
      userViews = new UserViewsModel({
        phoneNumber: normalizedPhoneNumber,
        dailyViewsCount: 0,
        lastViewDate: new Date(0), // Epoch, so it triggers reset below
        viewedProperties: [],
        viewLimitPerDay: DEFAULT_VIEW_LIMIT,
      });
    }

    // Reset counts if last view date is before today
    const lastViewDate = userViews.lastViewDate ? new Date(userViews.lastViewDate) : new Date(0);
    if (lastViewDate < startOfToday) {
      userViews.dailyViewsCount = 0;
      userViews.lastViewDate = new Date();
      // Optional: clear daily viewed properties to only keep relevant data for the day
      userViews.viewedProperties = userViews.viewedProperties.filter((view) => {
        // Keep only views NOT from today, if you want to track all-time viewed, remove this filter
        const viewedDate = new Date(view.viewedAt);
        return viewedDate < startOfToday;
      });
    }

    // Use user's limit or default
    const limit = userViews.viewLimitPerDay || DEFAULT_VIEW_LIMIT;

    // Check if user exceeded their daily limit
    if (userViews.dailyViewsCount >= limit) {
      return res.status(429).json({
        message: `Daily view limit reached (${limit}). Try again tomorrow.`,
      });
    }

    // Check if already viewed this property today
    const alreadyViewedToday = userViews.viewedProperties.some((view) => {
      const viewedDate = new Date(view.viewedAt);
      return (
        view.ppcId === ppcId &&
        viewedDate >= startOfToday
      );
    });

    if (alreadyViewedToday) {
      return res.status(409).json({ message: "Property already viewed today." });
    }

    // Add new view
    userViews.viewedProperties.push({
      ppcId,
      propertyOwnerPhoneNumber,
      viewerPhoneNumber: normalizedPhoneNumber,
      viewedAt: new Date(),
    });

    userViews.dailyViewsCount += 1;
    userViews.lastViewDate = new Date();

    await userViews.save();

    // Increment property view count
    await AddModel.updateOne({ ppcId }, { $inc: { views: 1 } });

    // Notify property owner
    await NotificationUser.create({
      recipientPhoneNumber: propertyOwnerPhoneNumber,
      senderPhoneNumber: normalizedPhoneNumber,
      message: `Your property (ID: ${ppcId}) was viewed by a user.`,
      ppcId,
      createdAt: new Date(),
    });

    // res.status(200).json({ message: "Property view recorded and notification sent." });

    res.status(200).json({
  message: "Property view recorded and notification sent.",
  data: {
    phoneNumber: normalizedPhoneNumber,
    ppcId,
    propertyOwnerPhoneNumber,
    dailyViewsCount: userViews.dailyViewsCount,
    viewLimitPerDay: userViews.viewLimitPerDay,
    remainingViews: userViews.viewLimitPerDay - userViews.dailyViewsCount,
    viewedProperties: userViews.viewedProperties.filter(view => {
      const viewedDate = new Date(view.viewedAt);
      return viewedDate >= startOfToday;
    }),
  }
});

  } catch (error) {
    console.error("Error recording view:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



// -----------------



// router.post("/user-view-property", async (req, res) => {
//   try {
//     const { phoneNumber, ppcId } = req.body;

//     if (!phoneNumber || !ppcId) {
//       return res.status(400).json({ message: "phoneNumber and ppcId are required" });
//     }

//     const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

//     const property = await AddModel.findOne({ ppcId });
//     if (!property) {
//       return res.status(404).json({ message: "Property not found" });
//     }

//     const propertyOwnerPhoneNumber = property.phoneNumber;

//     const today = new Date();
//     const startOfToday = new Date(today.setHours(0, 0, 0, 0));

//     let userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

//     // ?? Step 1: Get user's planName from UserModel
//     const user = await UserModel.findOne({ phoneNumber: normalizedPhoneNumber });
//     const userPlanName = user?.planName || "FREE"; // default to FREE if not found

//     // ?? Step 2: Get plan limit for the plan
//     const plan = await PlanLimit.findOne({ planName: userPlanName });
//     const planViewLimitPerDay = plan?.planViewLimitPerDay || 30; // default to 10 if plan not found

//     if (!userViews) {
//       userViews = new UserViewsModel({
//         phoneNumber: normalizedPhoneNumber,
//         dailyViewsCount: 0,
//         lastViewDate: new Date(0),
//         viewedProperties: [],
//         viewLimitPerDay: planViewLimitPerDay,
//       });
//     }

//     // Reset daily count if date is before today
//     const lastViewDate = userViews.lastViewDate ? new Date(userViews.lastViewDate) : new Date(0);
//     if (lastViewDate < startOfToday) {
//       userViews.dailyViewsCount = 0;
//       userViews.lastViewDate = new Date();
//       userViews.viewedProperties = userViews.viewedProperties.filter((view) => {
//         const viewedDate = new Date(view.viewedAt);
//         return viewedDate < startOfToday;
//       });
//     }

//     // Set current plan limit
//     userViews.viewLimitPerDay = planViewLimitPerDay;

//     // Check limit
//     if (userViews.dailyViewsCount >= planViewLimitPerDay) {
//       return res.status(429).json({
//         message: `Daily view limit reached (${planViewLimitPerDay}). Try again tomorrow.`,
//       });
//     }

//     const alreadyViewedToday = userViews.viewedProperties.some((view) => {
//       const viewedDate = new Date(view.viewedAt);
//       return view.ppcId === ppcId && viewedDate >= startOfToday;
//     });

//     if (alreadyViewedToday) {
//       return res.status(409).json({ message: "Property already viewed today." });
//     }

//     // Record the view
//     userViews.viewedProperties.push({
//       ppcId,
//       propertyOwnerPhoneNumber,
//       viewerPhoneNumber: normalizedPhoneNumber,
//       viewedAt: new Date(),
//     });

//     userViews.dailyViewsCount += 1;
//     userViews.lastViewDate = new Date();

//     await userViews.save();

//     await AddModel.updateOne({ ppcId }, { $inc: { views: 1 } });

//     await NotificationUser.create({
//       recipientPhoneNumber: propertyOwnerPhoneNumber,
//       senderPhoneNumber: normalizedPhoneNumber,
//       message: `Your property (ID: ${ppcId}) was viewed by a user.`,
//       ppcId,
//       createdAt: new Date(),
//     });

//     res.status(200).json({
//       message: "Property view recorded and notification sent.",
//       data: {
//         phoneNumber: normalizedPhoneNumber,
//         ppcId,
//         propertyOwnerPhoneNumber,
//         dailyViewsCount: userViews.dailyViewsCount,
//         viewLimitPerDay: planViewLimitPerDay,
//         remainingViews: planViewLimitPerDay - userViews.dailyViewsCount,
//         viewedProperties: userViews.viewedProperties.filter((view) => {
//           const viewedDate = new Date(view.viewedAt);
//           return viewedDate >= startOfToday;
//         }),
//       },
//     });
//   } catch (error) {
//     console.error("Error recording view:", error);
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });


// ------------



// router.post("/user-view-property", async (req, res) => {
//   try {
//     const { phoneNumber, ppcId } = req.body;

//     if (!phoneNumber || !ppcId) {
//       return res.status(400).json({ message: "Phone number and property ID are required" });
//     }

//     const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

//     // Fetch user plan details
//     const userPlan = await PricingPlans.findOne({ phoneNumber: normalizedPhoneNumber });
//     const planName = userPlan?.name?.toUpperCase() || "FREE";
//     const expiryDate = userPlan?.expireDate || null;

//     // Get plan-specific view limit
//     const planLimit = await PlanLimit.findOne({ planName });
//     const planViewLimitPerDay = planLimit?.planViewLimitPerDay || 30; // Default fallback

//     // Get user's view history
//     let userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

//     // Determine correct view limit hierarchy
//     const DEFAULT_VIEW_LIMIT = 30;
//     const effectiveViewLimit = userViews?.viewLimitPerDay ?? planViewLimitPerDay ?? DEFAULT_VIEW_LIMIT;

//     const today = new Date();
//     const startOfToday = new Date(today.setHours(0, 0, 0, 0));

//     let dailyViewsCount = 0;
//     let lastViewDate = null;
//     let viewedProperties = [];
//     let remainingViews = effectiveViewLimit;
//     let canViewToday = true;

//     if (!userViews) {
//       userViews = new UserViewsModel({
//         phoneNumber: normalizedPhoneNumber,
//         dailyViewsCount: 0,
//         lastViewDate: new Date(0),
//         viewedProperties: [],
//         viewLimitPerDay: effectiveViewLimit,
//       });
//     } else {
//       lastViewDate = new Date(userViews.lastViewDate || 0);

//       // Reset views if the last view was on a previous day
//       if (lastViewDate < startOfToday) {
//         userViews.dailyViewsCount = 0;
//         userViews.lastViewDate = new Date();
//         userViews.viewedProperties = [];
//       }

//       dailyViewsCount = userViews.dailyViewsCount;
//       remainingViews = effectiveViewLimit - dailyViewsCount;
//       viewedProperties = userViews.viewedProperties;

//       // ? **Check if the user exceeded their plan limit**
//       if (dailyViewsCount >= planViewLimitPerDay) {
//         canViewToday = false;
//         return res.status(429).json({
//           message: `Your plan limit (${planViewLimitPerDay}) is complete for today. Try again tomorrow.`,
//           data: {
//             phoneNumber: normalizedPhoneNumber,
//             planName,
//             expiryDate,
//             planViewLimitPerDay,
//             viewLimitPerDay: effectiveViewLimit,
//             dailyViewsCount,
//             remainingViews,
//             lastViewDate,
//             viewedProperties,
//             canViewToday,
//           },
//         });
//       }

//       // Check if this property was already viewed today
//       const alreadyViewedToday = viewedProperties.some((view) => {
//         return view.ppcId === ppcId && new Date(view.viewedAt) >= startOfToday;
//       });

//       if (alreadyViewedToday) {
//         return res.status(409).json({ message: "You already viewed this property today." });
//       }
//     }

//     // Add the new view record
//     userViews.viewedProperties.push({
//       ppcId,
//       viewerPhoneNumber: normalizedPhoneNumber,
//       viewedAt: new Date(),
//     });

//     // Increment daily view count
//     userViews.dailyViewsCount += 1;
//     await userViews.save();

//     return res.status(200).json({
//       message: "Property view recorded successfully.",
//       data: {
//         phoneNumber: normalizedPhoneNumber,
//         planName,
//         expiryDate,
//         planViewLimitPerDay,
//         viewLimitPerDay: effectiveViewLimit,
//         dailyViewsCount: userViews.dailyViewsCount,
//         remainingViews: effectiveViewLimit - userViews.dailyViewsCount,
//         lastViewDate: userViews.lastViewDate,
//         viewedProperties: userViews.viewedProperties.filter((view) => {
//           return new Date(view.viewedAt) >= startOfToday;
//         }),
//         canViewToday,
//       },
//     });

//   } catch (error) {
//     console.error("Error processing user view limits:", error);
//     return res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });



router.get("/user-viewed-list", async (req, res) => {
  try {
    const allUserViews = await UserViewsModel.find({}, {
      phoneNumber: 1,
      dailyViewsCount: 1,
      lastViewDate: 1,
      viewLimitPerDay: 1,
      viewedProperties: 1,
    }).sort({ lastViewDate: -1 });

    res.status(200).json(allUserViews);
  } catch (error) {
    console.error("Error fetching user view list:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



router.post("/user-view-property", async (req, res) => {
  try {
    const { phoneNumber, ppcId } = req.body;

    if (!phoneNumber || !ppcId) {
      return res.status(400).json({ message: "Phone number and property ID are required" });
    }

    const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

    // Fetch user plan details
    const userPlan = await PricingPlans.findOne({ phoneNumber: normalizedPhoneNumber });
    const planName = userPlan?.name?.toUpperCase() || "FREE";
    const expiryDate = userPlan?.expireDate || null;

    // Get plan-specific view limit
    const planLimit = await PlanLimit.findOne({ planName });
    const planViewLimitPerDay = planLimit?.planViewLimitPerDay || 30; // Default fallback

    // Get user's view history
    let userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

    // Determine correct view limit
    const DEFAULT_VIEW_LIMIT = 30;
    const effectiveViewLimit = userViews?.viewLimitPerDay ?? planViewLimitPerDay ?? DEFAULT_VIEW_LIMIT;

    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));

    let dailyViewsCount = 0;
    let lastViewDate = null;
    let viewedProperties = [];
    let remainingViews = effectiveViewLimit;
    let canViewToday = true;

    if (!userViews) {
      userViews = new UserViewsModel({
        phoneNumber: normalizedPhoneNumber,
        dailyViewsCount: 0,
        lastViewDate: new Date(0),
        viewedProperties: [],
        viewLimitPerDay: effectiveViewLimit,
      });
    } else {
      lastViewDate = new Date(userViews.lastViewDate || 0);

      // Reset views if the last view was on a previous day
      if (lastViewDate < startOfToday) {
        userViews.dailyViewsCount = 0;
        userViews.lastViewDate = new Date();
        userViews.viewedProperties = [];
      }

      dailyViewsCount = userViews.dailyViewsCount;
      remainingViews = effectiveViewLimit - dailyViewsCount;
      viewedProperties = userViews.viewedProperties;

      // ? Exceeded daily limit
      if (dailyViewsCount >= planViewLimitPerDay) {
        canViewToday = false;
        return res.status(429).json({
          message: `Your plan limit (${planViewLimitPerDay}) is complete for today. Try again tomorrow.`,
          data: {
            phoneNumber: normalizedPhoneNumber,
            planName,
            expiryDate,
            planViewLimitPerDay,
            viewLimitPerDay: effectiveViewLimit,
            dailyViewsCount,
            remainingViews,
            lastViewDate,
            viewedProperties,
            canViewToday,
          },
        });
      }

      // Already viewed today
      const alreadyViewedToday = viewedProperties.some((view) => {
        return view.ppcId === ppcId && new Date(view.viewedAt) >= startOfToday;
      });

      if (alreadyViewedToday) {
        return res.status(409).json({ message: "You already viewed this property today." });
      }
    }

    // ? Record the new view
    userViews.viewedProperties.push({
      ppcId,
      viewerPhoneNumber: normalizedPhoneNumber,
      viewedAt: new Date(),
    });

    userViews.dailyViewsCount += 1;
    await userViews.save();

    // ? Send notification if property is valid and complete
    try {
      const property = await AddModel.findOne({ ppcId });

      if (
        property &&
        property.propertyMode &&
        property.propertyType &&
        property.price
      ) {
        await NotificationUser.create({
          recipientPhoneNumber: normalizedPhoneNumber,
          senderPhoneNumber: normalizedPhoneNumber,
          userPhoneNumber: normalizedPhoneNumber,
          ppcId: ppcId,
          type: "property-view",
          message: `You viewed property (${ppcId}) successfully.`,
          createdAt: new Date()
        });
      }
    } catch (notifErr) {
      console.error("Notification error:", notifErr.message);
    }

    return res.status(200).json({
      message: "Property view recorded successfully.",
      data: {
        phoneNumber: normalizedPhoneNumber,
        planName,
        expiryDate,
        planViewLimitPerDay,
        viewLimitPerDay: effectiveViewLimit,
        dailyViewsCount: userViews.dailyViewsCount,
        remainingViews: effectiveViewLimit - userViews.dailyViewsCount,
        lastViewDate: userViews.lastViewDate,
        viewedProperties: userViews.viewedProperties.filter((view) => {
          return new Date(view.viewedAt) >= startOfToday;
        }),
        canViewToday,
      },
    });

  } catch (error) {
    console.error("Error processing user view limits:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



router.get("/user-viewed-details/:phoneNumber", async (req, res) => {
  try {
    const rawPhone = req.params.phoneNumber;
    const normalizedPhone = rawPhone.replace(/\s+/g, "").replace(/\+/g, "");

    const userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhone });

    if (!userViews) {
      return res.status(404).json({ message: "No view data found for this phone number" });
    }

    const enrichedViews = await Promise.all(
      userViews.viewedProperties.map(async (view) => {
        const propertyDetails = await AddModel.findOne({ ppcId: view.ppcId });
        return {
          ...view.toObject(),
          propertyDetails,
        };
      })
    );

    res.status(200).json({
      phoneNumber: userViews.phoneNumber,
      dailyViewsCount: userViews.dailyViewsCount,
      viewLimitPerDay: userViews.viewLimitPerDay,
      lastViewDate: userViews.lastViewDate,
      viewedProperties: enrichedViews,
    });
  } catch (error) {
    console.error("Error fetching user view details:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// -------------------------------------------------

router.get("/get-users-/no-posted-properties", async (req, res) => {
  try {
    // 1. Get all user logins with phone, loginDate, updatedAt
    const logins = await UserLogin.find({}, "phone loginDate updatedAt");

    // Map users with last 10 digit phones
    const allUsers = logins.map((user) => ({
      phoneNumber: getLast10Digits(user.phone),
      loginDate: user.loginDate || null,
      updateDate: user.updatedAt || null,
    }));

    // 2. Get phone numbers of users who have posted properties
    const postedPhones = await AddModel.distinct("phoneNumber");
    const postedPhoneSet = new Set(
      postedPhones.filter(Boolean).map((p) => getLast10Digits(p))
    );

    // 3. Filter users who have NOT posted properties
    const usersWithoutPosts = allUsers.filter(
      (user) => user.phoneNumber && !postedPhoneSet.has(user.phoneNumber)
    );

    const userPhones = usersWithoutPosts.map((u) => u.phoneNumber);

    // 4. Fetch views data from UserViewsModel for these users
    const viewData = await UserViewsModel.find({
      phoneNumber: { $in: userPhones },
    });

    // Build view map keyed by phoneNumber with daily view count and viewed PPC IDs today
    const viewMap = new Map();

    viewData.forEach((view) => {
      const phone = getLast10Digits(view.phoneNumber);
      if (!phone) return;

      // Filter viewed properties only for today
      const todayViews = (view.viewedProperties || []).filter((vp) =>
        isToday(vp.viewedAt)
      );

      viewMap.set(phone, {
        dailyViewsCount: todayViews.length,
        viewsRemaining: 30 - todayViews.length,
        ppcIds: todayViews.map((vp) => vp.ppcId),
      });
    });

    // 5. Fetch contactRequests from AddModel to count contacts per user today with PPC IDs
    const contactData = await AddModel.find(
      { "contactRequests.phoneNumber": { $exists: true, $ne: null } },
      "ppcId contactRequests"
    );

    // Build contact map keyed by phone with count and PPC IDs contacted today
    const contactMap = new Map();

    for (const doc of contactData) {
      const ppcId = doc.ppcId;
      for (const req of doc.contactRequests) {
        const phone = getLast10Digits(req.phoneNumber);
        // Use req.date or req.createdAt depending on your schema
        const reqDate = req.date || req.createdAt;
        if (!phone || !isToday(reqDate)) continue;

        if (!contactMap.has(phone)) {
          contactMap.set(phone, { count: 1, ppcIds: [ppcId] });
        } else {
          const data = contactMap.get(phone);
          if (!data.ppcIds.includes(ppcId)) data.ppcIds.push(ppcId);
          data.count += 1;
          contactMap.set(phone, data);
        }
      }
    }

    // 6. Build final response array
    const result = usersWithoutPosts.map((user) => {
      const viewInfo = viewMap.get(user.phoneNumber) || {
        dailyViewsCount: 0,
        viewsRemaining: 30,
        ppcIds: [],
      };

      const contactInfo = contactMap.get(user.phoneNumber) || {
        count: 0,
        ppcIds: [],
      };

      return {
        phoneNumber: user.phoneNumber,
        loginDate: user.loginDate,
        updateDate: user.updateDate,
        hasPostedProperty: false,
        viewsToday: viewInfo.dailyViewsCount,
        viewsRemaining: viewInfo.viewsRemaining,
        viewedPpcIds: viewInfo.ppcIds,
        contactsToday: contactInfo.count,
        contactsRemaining: 30 - contactInfo.count,
        contactedPpcIds: contactInfo.ppcIds,
      };
    });

    res.status(200).json({
      message: "Users without posted properties fetched successfully",
      usersWithoutPostedProperties: result,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Error fetching users without posted properties",
      error: error.message,
    });
  }
});

// --------------

router.put('/activate-all-properties', async (req, res) => {
  try {
    await AddModel.updateMany({}, { $set: { status: "active" } });
    res.status(200).json({ message: "All properties activated successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Failed to activate all properties." });
  }
});


// ? PUT: Update a call entry by ID
router.put('/update-call/:id', async (req, res) => {
  try {
    const updatedCall = await CallUserList.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedCall);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ? DELETE: Delete a call entry by ID
router.delete('/delete-call/:id', async (req, res) => {
  try {
    await CallUserList.findByIdAndDelete(req.params.id);
    res.json({ message: 'Call entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ? FETCH (custom route): Query by either ppcId or phoneNumber via query params
router.get('/call-fetch', async (req, res) => {
  try {
    const { ppcId, phoneNumber } = req.query;
    const query = {};
    if (ppcId) query.ppcId = ppcId;
    if (phoneNumber) query.phoneNumber = phoneNumber;

    const results = await CallUserList.find(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ------------


router.post('/call-user', async (req, res) => {
  try {
    const { ppcId, phoneNumber } = req.body;

    if (!ppcId || !phoneNumber) {
      return res.status(400).json({ message: 'ppcId and phoneNumber are required' });
    }

    const property = await AddModel.findOne({ ppcId });
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const callEntry = new CallUserList({
      ppcId,
      phoneNumber,
      status: 'callRequestWaiting',
      propertyPhoneNumber: property.phoneNumber,
      propertyMode: property.propertyMode,
      propertyType: property.propertyType,
      postedBy: property.postedBy,
      area: property.area,
      city: property.city,
      district: property.district,
      state: property.state,
      bestTimeToCall: property.bestTimeToCall,
      areaUnit: property.areaUnit,
      totalArea: property.totalArea,
      bedrooms: property.bedrooms,
      facing: property.facing,
      ownership: property.ownership,
    });

    await callEntry.save();

    res.status(201).json({ message: 'Call entry saved', data: callEntry });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/call-user/:ppcId/:phoneNumber', async (req, res) => {
  try {
    const { ppcId, phoneNumber } = req.params;

    const callLogs = await CallUserList.find({ ppcId, phoneNumber }).sort({ createdAt: -1 });

    if (callLogs.length === 0) {
      return res.status(404).json({ message: 'No call records found' });
    }

    res.status(200).json({ message: 'Call logs fetched', data: callLogs });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



// PATCH: Update call status
router.patch('/call-user/status', async (req, res) => {
  const { ppcId, userPhone, status } = req.body;

  if (!ppcId || !userPhone || !status) {
    return res.status(400).json({ message: "ppcId, userPhone, and status are required." });
  }

  try {
    const property = await AddModel.findOne({ ppcId });

    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Update the status of the interested user
    const updatedUsers = property.interestedUsers.map(user => {
      if (typeof user === 'object' && user.phone === userPhone) {
        return { ...user, callStatus: status };
      } else if (typeof user === 'string' && user === userPhone) {
        return { phone: user, callStatus: status };
      }
      return user;
    });

    property.interestedUsers = updatedUsers;

    await property.save();

    res.status(200).json({ message: "Call status updated successfully." });

  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
});





















router.get("/fetch-matched-buyers", async (req, res) => {
  try {
    const { propertyId } = req.query;

    if (!propertyId) {
      return res.status(400).json({ message: "Property ID is required" });
    }

    // Fetch Property Details
    const property = await AddModel.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Match Buyer Assistance Requests
    const matchedBuyers = await BuyerAssistance.find({
      propertyMode: property.propertyMode,
      propertyType: property.propertyType,
      city: property.city,
      area: property.area,
      facing: property.facing,
      minPrice: { $lte: property.price },  // Min price should be <= property price
      maxPrice: { $gte: property.price },  // Max price should be >= property price
    });

    res.status(200).json({
      message: "Matched Buyer Assistance Requests fetched successfully!",
      matchedBuyers: matchedBuyers,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



router.get("/user-get-views/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    // Normalize phoneNumber
    const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

    // Find the user's viewed properties
    const userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

    if (!userViews || userViews.viewedProperties.length === 0) {
      return res.status(404).json({ message: "No viewed properties found" });
    }

    // Fetch full details for each ppcId
    const properties = await AddModel.find({ ppcId: { $in: userViews.viewedProperties } });

    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



router.get("/user-last-10-days-views/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const digits = phoneNumber.replace(/\D/g, "").slice(-10);
    const variants = [`+91${digits}`, `91${digits}`, digits];

    const userViews = await UserViewsModel.findOne({
      phoneNumber: { $in: variants },
    });

    if (!userViews || !Array.isArray(userViews.viewedProperties)) {
      return res.status(404).json({ message: "No viewed properties found" });
    }

    const now = new Date();
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(now.getDate() - 10);

    const recentViews = userViews.viewedProperties
      .filter((view) => {
        const viewedAt = new Date(view.viewedAt);
        return viewedAt >= tenDaysAgo && viewedAt <= now;
      })
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

    if (recentViews.length === 0) {
      return res
        .status(404)
        .json({ message: "No views in the last 10 days" });
    }

    const properties = await Promise.all(
      recentViews.map(async (view) => {
        const prop = await AddModel.findOne({ ppcId: view.ppcId });
        return prop
          ? {
              ...prop.toObject(),
              viewedAt: view.viewedAt,
            }
          : null;
      })
    );

    const filteredProperties = properties.filter(Boolean);

    return res.status(200).json({
      message: "Viewed properties in the last 10 days",
      properties: filteredProperties,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// Endpoint to count the views in the last 10 days
router.get("/user-view-count/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const digits = phoneNumber.replace(/\D/g, "").slice(-10);
    const variants = [`+91${digits}`, `91${digits}`, digits];

    // Fetch user views data
    const userViews = await UserViewsModel.findOne({
      phoneNumber: { $in: variants },
    });

    if (!userViews || !Array.isArray(userViews.viewedProperties)) {
      return res.status(404).json({ message: "No viewed properties found" });
    }

    const now = new Date();
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(now.getDate() - 10);

    // Filter views in the last 10 days
    const recentViews = userViews.viewedProperties.filter((view) => {
      const viewedAt = new Date(view.viewedAt);
      return viewedAt >= tenDaysAgo && viewedAt <= now;
    });

    return res.status(200).json({
      message: `View count in the last 10 days for ${phoneNumber}`,
      viewCount: recentViews.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



router.get("/user-get-all-last-views", async (req, res) => {
  try {
    const allUserViews = await UserViewsModel.find();

    if (!allUserViews || allUserViews.length === 0) {
      return res.status(404).json({ message: "No user views found" });
    }

    const result = [];

    for (const user of allUserViews) {
      if (user.viewedProperties.length === 0) continue;

      // Sort by viewedAt descending
      const sortedViews = user.viewedProperties.sort(
        (a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
      );

      const lastViewed = sortedViews[0];

      const property = await AddModel.findOne({ ppcId: lastViewed.ppcId });

      if (property) {
        result.push({
          phoneNumber: user.phoneNumber,
          property,
          viewedAt: lastViewed.viewedAt,
        });
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


router.get("/user-views-count", async (req, res) => {
  try {
    // Aggregate total number of views from all user documents
    const result = await UserViewsModel.aggregate([
      { $unwind: "$viewedProperties" },
      { $count: "totalViews" }
    ]);

    const totalViews = result[0]?.totalViews || 0;

    res.status(200).json({
      message: "Total user property views fetched successfully",
      count: totalViews,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user views count",
      error: error.message,
    });
  }
});




// router.get("/user-viewed-properties", async (req, res) => {
//   try {
//     const { phoneNumber } = req.query;

//     if (!phoneNumber) {
//       return res.status(400).json({ message: "phoneNumber is required" });
//     }

//     const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

//     const userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

//     if (!userViews || userViews.viewedProperties.length === 0) {
//       return res.status(404).json({ message: "No viewed properties found" });
//     }

//     const sortedViews = userViews.viewedProperties.sort(
//       (a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
//     );


//     res.status(200).json({
//       viewedProperties: sortedViews,
//       // notifications: relatedNotifications

//     });
//   } catch (error) {
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });


// -------------------------******************---------------------

// router.get("/user-viewed-properties", async (req, res) => {
//   try {
//     const { phoneNumber } = req.query;

//     if (!phoneNumber) {
//       return res.status(400).json({ message: "phoneNumber is required" });
//     }

//     const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

//     const userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

//     if (!userViews || userViews.viewedProperties.length === 0) {
//       return res.status(404).json({ message: "No viewed properties found" });
//     }

//     // Sort views by viewedAt descending
//     const sortedViews = userViews.viewedProperties.sort(
//       (a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
//     );

//     // Deduplicate by ppcId to keep latest views only
//     const seen = new Set();
//     const uniqueViews = sortedViews.filter((view) => {
//       if (!seen.has(view.ppcId)) {
//         seen.add(view.ppcId);
//         return true;
//       }
//       return false;
//     });

//     // Enrich views with property details
//     const enrichedViews = await Promise.all(
//       uniqueViews.map(async (view) => {
//         const property = await AddModel.findOne({ ppcId: view.ppcId }).lean();
//         return {
//           ...view.toObject(),
//           propertyDetails: property || null,
//         };
//       })
//     );

//     // Return enriched views plus dailyViewsCount and lastViewDate
//     res.status(200).json({
//       dailyViewsCount: userViews.dailyViewsCount || 0,
//       lastViewDate: userViews.lastViewDate || null,
//       viewedProperties: enrichedViews,
//     });
//   } catch (error) {
//     console.error("Error fetching viewed properties:", error);
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });

// -------------------------******************---------------------







router.get("/user-viewed-properties", async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "phoneNumber is required" });
    }

    const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

    const userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

    if (!userViews || userViews.viewedProperties.length === 0) {
      return res.status(404).json({ message: "No viewed properties found" });
    }

    // Sort views by viewedAt descending
    const sortedViews = userViews.viewedProperties.sort(
      (a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
    );

    // Deduplicate by ppcId to keep latest views only
    const seen = new Set();
    const uniqueViews = sortedViews.filter((view) => {
      if (!seen.has(view.ppcId)) {
        seen.add(view.ppcId);
        return true;
      }
      return false;
    });

    // Enrich views with property details
    const enrichedViews = await Promise.all(
      uniqueViews.map(async (view) => {
        const property = await AddModel.findOne({ ppcId: view.ppcId }).lean();
        return {
          ...view.toObject(),
          propertyDetails: property || null,
        };
      })
    );

    // Use default limit if none set
    const DEFAULT_VIEW_LIMIT = 30;
    const viewLimitPerDay = userViews.viewLimitPerDay || DEFAULT_VIEW_LIMIT;

    // Return enriched views plus dailyViewsCount, lastViewDate, and viewLimitPerDay
    res.status(200).json({
      dailyViewsCount: userViews.dailyViewsCount || 0,
      lastViewDate: userViews.lastViewDate || null,
      viewLimitPerDay,
      viewedProperties: enrichedViews,
    });
  } catch (error) {
    console.error("Error fetching viewed properties:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// router.get("/user-viewed-properties", async (req, res) => {
//   try {
//     const { phoneNumber } = req.query;

//     if (!phoneNumber) {
//       return res.status(400).json({ message: "phoneNumber is required" });
//     }

//     const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

//     // Find user's view history
//     const userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhoneNumber });

//     // Get plan limits
//     const planLimits = await PlanLimit.findOne({ planName: userViews?.planName || "FREE" });

//     // If no user history, return plan limits
//     if (!userViews || userViews.viewedProperties.length === 0) {
//       return res.status(200).json({
//         planName: planLimits?.planName || "FREE",
//         viewLimitPerDay: planLimits?.planViewLimitPerDay || 28,
//         dailyViewsCount: 0,
//         viewedProperties: []
//       });
//     }

//     // Process views (same as before)
//     const sortedViews = userViews.viewedProperties.sort(
//       (a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
//     );
    
//     const seen = new Set();
//     const uniqueViews = sortedViews.filter((view) => {
//       if (!seen.has(view.ppcId)) {
//         seen.add(view.ppcId);
//         return true;
//       }
//       return false;
//     });

//     const enrichedViews = await Promise.all(
//       uniqueViews.map(async (view) => {
//         const property = await AddModel.findOne({ ppcId: view.ppcId }).lean();
//         return { ...view.toObject(), propertyDetails: property || null };
//       })
//     );

//     // Use plan limit if available, otherwise fallback to user's custom limit
//     const viewLimit = planLimits?.planViewLimitPerDay || 
//                      userViews.viewLimitPerDay || 
//                      28;

//     res.status(200).json({
//       planName: userViews.planName || "FREE",
//       viewLimitPerDay: viewLimit,
//       dailyViewsCount: userViews.dailyViewsCount || 0,
//       lastViewDate: userViews.lastViewDate || null,
//       viewedProperties: enrichedViews,
//     });
//   } catch (error) {
//     console.error("Error fetching viewed properties:", error);
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });


// router.get("/merged-user-views-and-plan", async (req, res) => {
//   try {
//     const { phoneNumber } = req.query;

//     if (!phoneNumber) {
//       return res.status(400).json({ message: "phoneNumber is required" });
//     }

//     const normalizedPhone = phoneNumber.replace(/\s+/g, "").replace(/\+/g, "");

//     // Step 1: Fetch plan by phone number
//     const plan = await PricingPlans.findOne({ phoneNumber: normalizedPhone });

//     let planName = "FREE";
//     let viewLimitPerDay = 15; // Default to FREE plan
//     let expiryDate = null;

//     if (plan) {
//       planName = plan.name || "FREE";

//       // Determine viewLimitPerDay based on planName
//       switch (planName.toUpperCase()) {
//         case "BASIC":
//           viewLimitPerDay = 50;
//           break;
//         case "PREMIUM":
//           viewLimitPerDay = 100;
//           break;
//         default:
//           viewLimitPerDay = 15; // FREE
//       }

//       // Calculate expiry date
//       const createdAt = new Date(plan.createdAt);
//       const duration = plan.durationDays || 0;
//       expiryDate = new Date(createdAt);
//       expiryDate.setDate(expiryDate.getDate() + duration);
//     }

//     // Step 2: Fetch user's viewed properties
//     const userViews = await UserViewsModel.findOne({ phoneNumber: normalizedPhone });

//     if (!userViews || userViews.viewedProperties.length === 0) {
//       return res.status(200).json({
//         status: "success",
//         message: "No viewed properties found",
//         planName,
//         viewLimitPerDay,
//         dailyViewsCount: 0,
//         lastViewDate: null,
//         expiryDate,
//         viewedProperties: [],
//       });
//     }

//     // Sort by viewedAt descending
//     const sortedViews = userViews.viewedProperties.sort(
//       (a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
//     );

//     // Deduplicate by ppcId (only keep most recent)
//     const seen = new Set();
//     const uniqueViews = sortedViews.filter((view) => {
//       if (!seen.has(view.ppcId)) {
//         seen.add(view.ppcId);
//         return true;
//       }
//       return false;
//     });

//     // Enrich with property details
//     const enrichedViews = await Promise.all(
//       uniqueViews.map(async (view) => {
//         const property = await AddModel.findOne({ ppcId: view.ppcId }).lean();
//         return {
//           ...view.toObject(),
//           propertyDetails: property || null,
//         };
//       })
//     );

//     // Return enriched data with plan info and limits
//     res.status(200).json({
//       status: "success",
//       planName,
//       viewLimitPerDay,
//       dailyViewsCount: userViews.dailyViewsCount || 0,
//       lastViewDate: userViews.lastViewDate || null,
//       expiryDate: expiryDate ? expiryDate.toISOString().split("T")[0] : null,
//       viewedProperties: enrichedViews,
//     });
//   } catch (error) {
//     console.error("Error in merged-user-views-and-plan:", error);
//     res.status(500).json({
//       status: "error",
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// });




// router.post("/merged-user-views-and-plan", async (req, res) => {
//   try {
//     const { phoneNumber } = req.body;

//     if (!phoneNumber) {
//       return res.status(400).json({ status: "error", message: "Phone number is required" });
//     }

//     // Step 1: Find user's plan
//     const userPlan = await PricingPlans.findOne({ phoneNumber: phoneNumber });

//     const planName = userPlan ? userPlan.name.toUpperCase() : "FREE";
//     const expiryDate = userPlan ? userPlan.expireDate : null;

//     // Step 2: Find plan's daily limit from PlanLimit
//     const planLimit = await PlanLimit.findOne({ planName });

//     const planViewLimitPerDay = planLimit ? planLimit.planViewLimitPerDay : 15; // Default fallback

//     // Step 3: Find user's view data
//     const userViews = await UserViewsModel.findOne({ phoneNumber });

//     const response = {
//       status: "success",
//       planName,
//       planViewLimitPerDay,
//       viewLimitPerDay: userViews ? userViews.viewLimitPerDay : planViewLimitPerDay,
//       dailyViewsCount: userViews ? userViews.dailyViewsCount : 0,
//       lastViewDate: userViews ? userViews.lastViewDate : null,
//       expiryDate,
//       viewedProperties: userViews ? userViews.viewedProperties : [],
//     };

//     return res.status(200).json(response);

//   } catch (err) {
//     console.error("Error in merged-user-views-and-plan:", err);
//     return res.status(500).json({ status: "error", message: "Server error" });
//   }
// });


router.post("/merged-user-views-and-plan", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ status: "error", message: "Phone number is required" });
    }

    // 1. Get user plan
    const userPlan = await PricingPlans.findOne({ phoneNumber });
    const planName = userPlan ? userPlan.name.toUpperCase() : "FREE";
    const expiryDate = userPlan ? userPlan.expireDate : null;

    // 2. Get default plan limit
    const planLimit = await PlanLimit.findOne({ planName });
    const defaultPlanLimit = planLimit ? planLimit.planViewLimitPerDay : 10;

    // 3. Get user view info
    const userViews = await UserViewsModel.findOne({ phoneNumber });

    // 4. Determine actual daily limit
    const viewLimitPerDay = userViews?.viewLimitPerDay || defaultPlanLimit;

    // 5. Check today's view usage
    let dailyViewsCount = 0;
    let lastViewDate = null;
    let viewedProperties = [];
    let canViewToday = true;

    if (userViews) {
      const lastDate = new Date(userViews.lastViewDate);
      const today = new Date();

      if (
        lastDate.getDate() === today.getDate() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getFullYear() === today.getFullYear()
      ) {
        // Same day: use the count
        dailyViewsCount = userViews.dailyViewsCount || 0;
        if (dailyViewsCount >= viewLimitPerDay) {
          canViewToday = false;
        }
      } else {
        // New day: reset count
        dailyViewsCount = 0;
        canViewToday = true;
      }

      lastViewDate = userViews.lastViewDate || null;
      viewedProperties = userViews.viewedProperties || [];
    }

    return res.status(200).json({
      status: "success",
      planName,
      planViewLimitPerDay: defaultPlanLimit,
      viewLimitPerDay,
      dailyViewsCount,
      lastViewDate,
      expiryDate,
      viewedProperties,
      canViewToday, // ?? true or false
      message: canViewToday
        ? "You can view more properties today."
        : "Today's views completed. Please try again tomorrow.",
    });

  } catch (err) {
    console.error("Error in merged-user-views-and-plan:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});





router.get("/all-viewed-properties", async (req, res) => {
  try {
    // Fetch all user views data
    const allUserViews = await UserViewsModel.find();

    if (!allUserViews.length) {
      return res.status(404).json({ message: "No property views found" });
    }

    // Extract unique ppcIds from all user views
    const allPpcIds = [
      ...new Set(
        allUserViews.flatMap((user) =>
          user.viewedProperties.map((view) => view.ppcId)
        )
      ),
    ];

    if (!allPpcIds.length) {
      return res.status(404).json({ message: "No viewed properties found" });
    }

    // Fetch property details using the collected ppcIds
    const properties = await AddModel.find(
      { ppcId: { $in: allPpcIds } },
      "ppcId price propertyType propertyMode city area totalArea areaUnit ownership phoneNumber"
    );

    // Map properties with the users who viewed them
    const viewedPropertiesData = properties.map((property) => {
      const usersWhoViewed = allUserViews
        .filter((user) =>
          user.viewedProperties.some((view) => view.ppcId === property.ppcId)
        )
        .map((user) => ({
          phoneNumber: user.phoneNumber,
          viewedAt: user.viewedProperties.find(
            (view) => view.ppcId === property.ppcId
          )?.viewedAt,
        }));

      return {
        ...property.toObject(),
        viewers: usersWhoViewed,
      };
    });

    return res.status(200).json({
      message: "All viewed properties retrieved successfully",
      viewedProperties: viewedPropertiesData,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


router.get("/property/:ppcId", async (req, res) => {
  try {
    const { ppcId } = req.params;
    const property = await AddModel.findOne({ ppcId });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



router.get("/property-owner-viewed-users", async (req, res) => {
  let { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ message: "User phone number is required" });
  }

  phoneNumber = phoneNumber.replace(/\s+/g, "").replace("+", "");

  try {
    // Fetch user views
    const userViews = await UserViewsModel.findOne({ phoneNumber });

    if (!userViews || !userViews.viewedProperties?.length) {
      return res.status(404).json({ message: "No viewed properties found for this user" });
    }

    // Extract only ppcId values from viewedProperties
    const ppcIds = userViews.viewedProperties.map((property) => 
      typeof property === "object" && property !== null ? property.ppcId : property
    );

    // Ensure only valid numbers are passed
    const validPpcIds = ppcIds.filter((id) => typeof id === "number");

    if (validPpcIds.length === 0) {
      return res.status(404).json({ message: "No valid property IDs found" });
    }

    // Fetch property details
    const properties = await AddModel.find(
      { ppcId: { $in: validPpcIds } },  // ? Use only valid numeric IDs
      "ppcId price propertyType propertyMode city area postedBy totalArea areaUnit ownership phoneNumber"
    );

    return res.status(200).json({
      message: "Viewed properties retrieved successfully",
      phoneNumber,
      properties,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


router.put("/undo-delete-view", async (req, res) => {
  const { ppcId, phoneNumber } = req.body;

  if (!ppcId || !phoneNumber) {
    return res.status(400).json({ message: "ppcId and phoneNumber are required." });
  }

  try {
    const updatedUser = await UserViewsModel.findOneAndUpdate(
      { phoneNumber, "viewedProperties.ppcId": ppcId },
      { $set: { "viewedProperties.$.status": "active" } }, // Restore by changing status
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Property not found for this user." });
    }

    res.status(200).json({ message: "Property restored successfully!", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error restoring property.", error: error.message });
  }
});



// ? Soft Delete Property (Move to Removed Tab)
router.put("/delete-view-property", async (req, res) => {
  const { ppcId, phoneNumber } = req.body;

  if (!ppcId || !phoneNumber) {
    return res.status(400).json({ message: "ppcId and phoneNumber are required." });
  }

  try {
    const updatedUser = await UserViewsModel.findOneAndUpdate(
      { phoneNumber, "viewedProperties.ppcId": ppcId },
      { $set: { "viewedProperties.$.status": "delete" } }, // Soft delete by updating status
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Property not found for this user." });
    }

    res.status(200).json({ message: "Property removed successfully.", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error removing property.", error: error.message });
  }
});


router.get("/property-buyer-viewed", async (req, res) => {
  let { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ message: "Owner phone number is required" });
  }

  // Normalize phone number and check different possible formats
  const normalizedPhone = phoneNumber.replace(/\s+/g, "").replace("+", "");
  const possibleNumbers = [
    normalizedPhone,
    "+" + normalizedPhone,
    normalizedPhone.replace(/^91/, ""),
  ];


  try {
    // Fetch all properties posted by the owner
    const ownerProperties = await AddModel.find({ phoneNumber: { $in: possibleNumbers } });

    if (!ownerProperties.length) {
      return res.status(404).json({ message: "No properties found for this owner" });
    }

    // Extract all PPC IDs
    const ownerPpcIds = ownerProperties.map((property) => property.ppcId);

    // Fetch users who viewed these properties
    const viewedUsers = await UserViewsModel.find({ "viewedProperties.ppcId": { $in: ownerPpcIds } });

    if (!viewedUsers.length) {
      return res.status(404).json({ message: "No viewed users found for this owner" });
    }


    // Fetch full property details
    const propertyDetails = await AddModel.find({ ppcId: { $in: ownerPpcIds } });

    // Convert property details into a Map for quick lookup
    const propertyMap = new Map();
    propertyDetails.forEach((property) => {
      propertyMap.set(property.ppcId, property.toObject()); // Convert Mongoose doc to plain object
    });

    // Organizing response data
    const response = viewedUsers.map((user) => ({
      viewerPhoneNumber: user.phoneNumber,
      viewedProperties: user.viewedProperties
        .filter((vp) => ownerPpcIds.includes(vp.ppcId)) // Ensure only relevant properties are included
        .map((vp) => ({
          ppcId: vp.ppcId,
          propertyOwnerPhoneNumber: vp.propertyOwnerPhoneNumber,
          viewedAt: vp.viewedAt,
          _id: vp._id,
          propertyDetails: propertyMap.get(vp.ppcId) || null, // Attach full property details
        })),
    }));

    return res.status(200).json({
      message: "Viewed users retrieved successfully",
      ownerPhoneNumber: normalizedPhone,
      viewedUsers: response,
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});





// router.post(
//   '/update-property',
//   upload.fields([{ name: 'video', maxCount: 1 }, { name: 'photos', maxCount: 15 }]),
//   async (req, res) => {
//     if (req.fileValidationError) {
//       return res.status(400).json({ message: req.fileValidationError });
//     } 
//     if (req.files['video'] && req.files['video'][0].size > 50 * 1024 * 1024) {
//       return res.status(400).json({ message: 'Video file size exceeds 50MB.' });
//     }

//     const {
//       ppcId,
//       phoneNumber,
//       price,
//       rentalPropertyAddress,
//       state,
//       city,
//       district,
//       area,
//       streetName,
//       doorNumber,
//       nagar,
//       ownerName,
//       email,
//       alternatePhone,
//       countryCode,
//       alternateCountryCode,
//       propertyMode,
//       propertyType,
//       bankLoan,
//       negotiation,
//       ownership,
//       bedrooms,
//       kitchen,
//       kitchenType,
//       balconies,
//       floorNo,
//       areaUnit,
//       propertyApproved,
//       propertyAge,
//       postedBy,
//       facing,
//       salesMode,
//       salesType,
//       furnished,
//       lift,
//       attachedBathrooms,
//       western,
//       numberOfFloors,
//       carParking,
//       bestTimeToCall,
//       totalArea,
//       length,
//       breadth,
//       description,
//       pinCode,
//       locationCoordinates,
//     } = req.body;

//     if (!ppcId) {
//       return res.status(400).json({ message: 'PPC-ID is required.' });
//     }

//     try {
//       const user = await AddModel.findOne({ ppcId });
//       if (!user) {
//         return res.status(404).json({ message: 'User not found.' });
//       }

//       // Update user fields dynamically
//       const fieldsToUpdate = {
//         phoneNumber, price, rentalPropertyAddress, state, city, district, area, 
//         streetName, doorNumber, nagar, ownerName, email, alternatePhone, countryCode, 
//         alternateCountryCode, propertyMode, propertyType, bankLoan, negotiation, ownership, 
//         bedrooms, kitchen, kitchenType, balconies, floorNo, areaUnit, propertyApproved, 
//         propertyAge, postedBy, facing, salesMode, salesType, furnished, lift, 
//         attachedBathrooms, western, numberOfFloors, carParking, bestTimeToCall, totalArea,
//         length,description,
//         breadth,pinCode,locationCoordinates,
//       };

//       for (const key in fieldsToUpdate) {
//         if (fieldsToUpdate[key]) {
//           user[key] = fieldsToUpdate[key];
//         }
//       }

//       // Handle file uploads
//       if (req.files) {
//         if (req.files['video']) {
//           user.video = req.files['video'][0].path;
//         }
//         if (req.files['photos']) {
//           user.photos = req.files['photos'].map((file) => file.path);
//         }
//       }

//       // Check if all required fields are filled
//       const requiredFields = [
//         'ppcId','phoneNumber', 'price',     'propertyMode',
//         'propertyType',   'postedBy', 'areaUnit', 'salesType',
//        'totalArea',
//       ];



//       const isComplete = requiredFields.every((field) => user[field]);
//       user.status = isComplete ? "complete" : "incomplete"; 
      

//       await user.save();

//       // Save notification when property is updated
// try {
//   const notification = await NotificationUser.create({
//     recipientPhoneNumber: user.phoneNumber,
//     senderPhoneNumber: user.phoneNumber,
//     userPhoneNumber: user.phoneNumber,
//     ppcId: user.ppcId,
//     type: "property-Add",
//     message: `Your property (${user.ppcId}) has been Added successfully.`,
//     createdAt: new Date()
//   });

// } catch (notifErr) {
// }

//       res.status(200).json({
//         message: 'Property details updated successfully!',
//         ppcId: user.ppcId,
//         propertyStatus: user.propertyStatus,
//         user,
//       });
//     } catch (error) {
//       res.status(500).json({ message: 'Error updating property details.', error });
//     }
//   }
// );



router.post(
  '/update-property',
  upload.fields([{ name: 'video', maxCount: 5 }, { name: 'photos', maxCount: 15 }]),
  async (req, res) => {
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    if (req.files['video'] && req.files['video'][0].size > 50 * 1024 * 1024) {
      return res.status(400).json({ message: 'Video file size exceeds 50MB.' });
    }

    const {
      ppcId,
      phoneNumber,
      price,
      rentalPropertyAddress,
      state,
      city,
      district,
      area,
      streetName,
      doorNumber,
      nagar,
      ownerName,
      email,
      alternatePhone,
      countryCode,
      alternateCountryCode,
      propertyMode,
      propertyType,
      bankLoan,
      negotiation,
      ownership,
      bedrooms,
      kitchen,
      kitchenType,
      balconies,
      floorNo,
      areaUnit,
      propertyApproved,
      propertyAge,
      postedBy,
      facing,
      salesMode,
      salesType,
      furnished,
      lift,
      attachedBathrooms,
      western,
      numberOfFloors,
      carParking,
      bestTimeToCall,
      totalArea,
      length,
      breadth,
      description,
      pinCode,
      locationCoordinates,
      country,
      status,        // optional: client preserves the existing workflow bucket
      photoOrder,    // optional JSON: final desired order of photo identifiers
    } = req.body;

    if (!ppcId) {
      return res.status(400).json({ message: 'PPC-ID is required.' });
    }

    try {
      const user = await AddModel.findOne({ ppcId });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Fields to dynamically update
      const fieldsToUpdate = {
        phoneNumber, price, rentalPropertyAddress, state, city, district, area,
        streetName, doorNumber, nagar, ownerName, email, alternatePhone, countryCode,
        alternateCountryCode, propertyMode, propertyType, bankLoan, negotiation, ownership,
        bedrooms, kitchen, kitchenType, balconies, floorNo, areaUnit, propertyApproved,
        propertyAge, postedBy, facing, salesMode, salesType, furnished, lift,
        attachedBathrooms, western, numberOfFloors, carParking, bestTimeToCall, totalArea,
        length, breadth, description, pinCode, locationCoordinates,country
      };

      for (const key in fieldsToUpdate) {
        if (fieldsToUpdate[key] !== undefined && fieldsToUpdate[key] !== '') {
          user[key] = fieldsToUpdate[key];
        }
      }

      // Stamp the admin who added this property — only on the first save that
      // supplies it (AddProperty submission), so subsequent edits via
      // EditProperty don't overwrite the original adder.
      if (!user.addedBy && req.body.addedBy) {
        user.addedBy = req.body.addedBy;
        user.addedByRole = req.body.addedByRole || null;
        user.addedAt = req.body.addedAt ? new Date(req.body.addedAt) : new Date();
      }

//       // Handle file uploads
//       if (req.files) {
//         if (req.files['video']) {
//           user.video = req.files['video'][0].path;
//         }
//         // if (req.files['photos']) {
//         //   user.photos = req.files['photos'].map(file => file.path);
//         // }

//         if (req.files['photos']) {
//   user.photos = req.files['photos'].map(file => path.basename(file.filename));
// }

//       }


// ---- Video upload (unchanged) ----
if (req.files && req.files['video']) {
  user.video = req.files['video'].map(file => path.join('uploads', file.filename));
}

// ---- Photo handling ----
// Three inputs may arrive:
//   1. req.body.photos        — paths of existing photos the client kept (strings).
//                                When the user reorders / removes existing photos
//                                on the edit screen, this list reflects the new order.
//   2. req.files['photos']    — newly uploaded files (multer parses these out of
//                                multipart and they do NOT appear in req.body.photos).
//   3. req.body.photoOrder    — JSON array describing the final desired order,
//                                mixing existing photo paths with `__NEW__N`
//                                placeholders that reference req.files['photos'][N].
//                                When present, this fully controls the final array
//                                (including emptying it).
const newFiles = (req.files && req.files['photos']) || [];
const newPaths = newFiles.map(file => path.join('uploads', file.filename));

let existingKept = [];
if (req.body.photos !== undefined) {
  existingKept = Array.isArray(req.body.photos) ? req.body.photos : [req.body.photos];
  existingKept = existingKept.filter(p => typeof p === 'string' && p.length > 0);
}

if (photoOrder !== undefined) {
  // Client gave us an explicit final order — trust it completely.
  let parsedOrder = null;
  try {
    parsedOrder = JSON.parse(photoOrder);
  } catch (err) {
    parsedOrder = null;
  }
  if (Array.isArray(parsedOrder)) {
    user.photos = parsedOrder
      .map(id => {
        const match = typeof id === 'string' && id.match(/^__NEW__(\d+)$/);
        if (match) return newPaths[Number(match[1])];
        return id;
      })
      .filter(p => typeof p === 'string' && p.length > 0);
  }
} else if (existingKept.length > 0 || newPaths.length > 0) {
  // Legacy clients (e.g. AddProperty creating a brand-new record):
  // keep client-supplied existing photos in order, append new uploads at the end.
  user.photos = [...existingKept, ...newPaths];
}
// If neither photoOrder nor any photos field was sent, leave user.photos untouched.

      // Workflow status handling.
      //   - If the client explicitly sent `status`, respect it. The edit form
      //     uses this to keep a property in its current bucket (approved /
      //     complete / pending / delete / etc.) when an admin saves an edit.
      //   - Otherwise, only the very first save that fills in the required
      //     fields should graduate a property from "incomplete" to "complete".
      //     Don't otherwise overwrite the status — that's what `/update-property-status`
      //     is for.
      const requiredFields = [
        'ppcId', 'phoneNumber', 'price', 'propertyMode',
        'propertyType', 'postedBy', 'areaUnit', 'salesType', 'totalArea',
      ];

      if (typeof status === 'string' && status.length > 0) {
        user.status = status;
      } else if (!user.status || user.status === 'incomplete') {
        const isComplete = requiredFields.every(field => user[field]);
        user.status = isComplete ? 'complete' : 'incomplete';
      }

      await user.save();

      // Send notification only if these 3 fields are filled
      if (user.propertyMode && user.propertyType && user.price) {
        try {
          await NotificationUser.create({
            recipientPhoneNumber: user.phoneNumber,
            senderPhoneNumber: user.phoneNumber,
            userPhoneNumber: user.phoneNumber,
            ppcId: user.ppcId,
            type: "property-Add",
            message: `Your property (${user.ppcId}) has been added successfully.`,
            createdAt: new Date()
          });
        } catch (notifErr) {
          console.error('Notification error:', notifErr.message);
        }
      }

      res.status(200).json({
        message: 'Property details updated successfully!',
        ppcId: user.ppcId,
        propertyStatus: user.status,
        user,
      });

    } catch (error) {
      console.error('Update error:', error.message);
      res.status(500).json({ message: 'Error updating property details.', error });
    }
  }
);


router.get('/fetch-property-dropdowns', async (req, res) => {
  try {
    const [ propertyTypes] = await Promise.all([
      AddModel.distinct('propertyType', { propertyType: { $ne: null } })
    ]);

    res.status(200).json({
      message: 'Property dropdown values fetched successfully',
      propertyModes,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching dropdown values',
      error: error.message,
    });
  }
});





router.post('/add-property', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'photos', maxCount: 5 }]), async (req, res) => {
  try {
      // Access the uploaded files
      const video = req.files && req.files.video ? req.files.video[0].path : '';  // Handle video file
      const photos = req.files && req.files.photos ? req.files.photos.map(file => file.path) : [];  // Handle photo files

      // Create a new property object
      const newProperty = new AddModel({
          phoneNumber: req.body.phoneNumber,
          price:req.body.price,
          rentalPropertyAddress: req.body.rentalPropertyAddress,
          state: req.body.state,
          city: req.body.city,
          district: req.body.district,
          area: req.body.area,
          streetName: req.body.streetName,
          doorNumber: req.body.doorNumber,
          nagar: req.body.nagar,
          ownerName: req.body.ownerName,
          email: req.body.email,
          alternatePhone: req.body.alternatePhone,
          video: video,  // Save the video file path
          photos: photos,  // Save photo file paths
          countryCode: req.body.countryCode,
          alternateCountryCode:req.body.alternateCountryCode,
          propertyMode: req.body.propertyMode,
          propertyType: req.body.propertyType,
          bankLoan: req.body.bankLoan,
          negotiation: req.body.negotiation,
          ownership: req.body.ownership,
          bedrooms: req.body.bedrooms,
          kitchen: req.body.kitchen,
          kitchenType: req.body.kitchenType,
          balconies: req.body.balconies,
          floorNo: req.body.floorNo,
          areaUnit: req.body.areaUnit,
          propertyApproved: req.body.propertyApproved,
          propertyAge: req.body.propertyAge,
          postedBy: req.body.postedBy,
          facing: req.body.facing,
          salesMode: req.body.salesMode,
          salesType: req.body.salesType,
          furnished: req.body.furnished,
          lift: req.body.lift,
          attachedBathrooms: req.body.attachedBathrooms,
          western: req.body.western,
          numberOfFloors: req.body.numberOfFloors,
          // Stamp the admin who added this property (when posted from the admin app).
          addedBy: req.body.addedBy || null,
          addedByRole: req.body.addedByRole || null,
          addedAt: req.body.addedBy ? new Date() : null,
      });

      // Save the new property to the database
      await newProperty.save();
      res.status(200).json({ message: 'Property added successfully', property: newProperty });
  } catch (error) {
      res.status(500).json({ message: 'Error adding property', error: error.message });
  }
});


// -----------------

// Fetch all properties count
router.get('/all-properties-count', async (req, res) => {
  try {
      const count = await AddModel.countDocuments();
      res.json({ totalProperties: count });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


router.get('/deleted-properties-count', async (req, res) => {
  try {
    // Count the documents with status "delete"
    const count = await AddModel.countDocuments({ status: "delete" });

    // Check if the count is being returned as expected
    if (count >= 0) {
      res.json({ deletedProperties: count });
    } else {
      res.status(404).json({ message: "No deleted properties found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.get('/active-properties-count', async (req, res) => {
  try {
    // Count documents with status "active"
    const count = await AddModel.countDocuments({ status: "active" });

    if (count >= 0) {
      res.json({ activeProperties: count });
    } else {
      res.status(404).json({ message: "No active properties found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// GET: Count of pending properties
router.get("/pending-properties-count", async (req, res) => {
  try {
    // Count documents where status is 'pending' or 'incomplete'
    const count = await AddModel.countDocuments({
      status: { $in: ["pending","complete"] } // <-- Adjust this based on your business logic
    });

    res.status(200).json({ pendingProperties: count });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});




// ? Count of interested buyers for all properties posted by a user
router.get('/interest-buyers-count/:postedPhoneNumber', async (req, res) => {
  try {
    let { postedPhoneNumber } = req.params;

    if (!postedPhoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Normalize phone number
    postedPhoneNumber = postedPhoneNumber.replace(/\D/g, '');
    if (postedPhoneNumber.startsWith('91') && postedPhoneNumber.length === 12) {
      postedPhoneNumber = postedPhoneNumber.slice(2);
    }

    // Fetch properties posted by the owner
    const properties = await AddModel.find({
      $or: [
        { phoneNumber: postedPhoneNumber },
        { phoneNumber: `91${postedPhoneNumber}` },
        { phoneNumber: `+91${postedPhoneNumber}` }
      ]
    });

    if (!properties.length) {
      return res.status(404).json({ message: 'No properties found for this phone number.' });
    }

    // Count total interested buyers across all properties
    const interestBuyersCount = properties.reduce((total, property) => {
      return total + (property.interestRequests?.length || 0);
    }, 0);

    res.status(200).json({ interestBuyersCount });
  } catch (error) {
    console.error('Error fetching interest buyer count:', error);
    res.status(500).json({ error: error.message });
  }
});



router.get("/property-owner-viewed-users-count", async (req, res) => {
  let { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ message: "User phone number is required" });
  }

  phoneNumber = phoneNumber.replace(/\s+/g, "").replace("+", "");

  try {
    // Fetch user views
    const userViews = await UserViewsModel.findOne({ phoneNumber });

    if (!userViews || !userViews.viewedProperties?.length) {
      return res.status(200).json({ viewedPropertiesCount: 0 });
    }

    // Extract only valid ppcId values
    const validPpcIds = userViews.viewedProperties
      .map((property) => (typeof property === "object" && property !== null ? property.ppcId : property))
      .filter((id) => typeof id === "number");

    return res.status(200).json({ viewedPropertiesCount: validPpcIds.length });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// router.get("/property-buyer-viewed-count", async (req, res) => {
//   let { phoneNumber } = req.query;

//   if (!phoneNumber) {
//     return res.status(400).json({ message: "Owner phone number is required" });
//   }

//   const normalizedPhone = phoneNumber.replace(/\s+/g, "").replace("+", "");
//   const possibleNumbers = [
//     normalizedPhone,
//     "+" + normalizedPhone,
//     normalizedPhone.replace(/^91/, ""),
//   ];

//   try {
//     // Find properties owned by the user
//     const ownerProperties = await AddModel.find({ phoneNumber: { $in: possibleNumbers } });

//     if (!ownerProperties.length) {
//       return res.status(200).json({ buyerViewedCount: 0 });
//     }

//     const ownerPpcIds = ownerProperties.map((property) => property.ppcId);

//     // Find the number of distinct users who viewed any of these properties
//     const viewedUsersCount = await UserViewsModel.countDocuments({
//       "viewedProperties.ppcId": { $in: ownerPpcIds },
//     });

//     return res.status(200).json({ buyerViewedCount: viewedUsersCount });

//   } catch (error) {
//     return res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });



router.get("/property-buyer-viewed-count", async (req, res) => {
  let { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ message: "Owner phone number is required" });
  }

  const normalizedPhone = phoneNumber.replace(/\s+/g, "").replace("+", "");
  const possibleNumbers = [
    normalizedPhone,
    "+" + normalizedPhone,
    normalizedPhone.replace(/^91/, ""),
  ];

  try {
    const ownerProperties = await AddModel.find({ phoneNumber: { $in: possibleNumbers } });

    if (!ownerProperties.length) {
      return res.status(200).json({ buyerViewedCount: 0 });
    }

    const ownerPpcIds = ownerProperties.map((property) => property.ppcId);

    // Fetch all users who viewed the properties
    const viewedUsers = await UserViewsModel.find({
      "viewedProperties.ppcId": { $in: ownerPpcIds },
    });

    // Count total views across all users for owner's properties
    let totalViews = 0;
    viewedUsers.forEach((user) => {
      totalViews += user.viewedProperties.filter((vp) =>
        ownerPpcIds.includes(vp.ppcId)
      ).length;
    });

    return res.status(200).json({ buyerViewedCount: totalViews });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



router.get('/get-interest-sent-count', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  try {
    const normalizedPhone = phoneNumber.replace(/\s/g, "");

    // Find all properties where this number appears in interestRequests or interestedUserPhoneNumbers
    const properties = await AddModel.find({
      $or: [
        { 'interestRequests.phoneNumber': { $regex: normalizedPhone, $options: "i" } },
        { interestedUserPhoneNumbers: { $in: [normalizedPhone] } }
      ]
    });

    const ppcIds = properties.map(p => p.ppcId).filter(Boolean);
    const uniquePpcIds = [...new Set(ppcIds)];

    return res.status(200).json({
      success: true,
      interestSentCount: uniquePpcIds.length,
      interestedPpcIds: uniquePpcIds
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});


router.get('/get-help-as-buyer-count', async (req, res) => {
  try {
      let { postedPhoneNumber } = req.query;

      if (!postedPhoneNumber) {
          return res.status(400).json({ message: 'Posted user phone number is required.' });
      }

      // Normalize phone number format
      postedPhoneNumber = postedPhoneNumber.replace(/\D/g, '');
      if (postedPhoneNumber.startsWith('91') && postedPhoneNumber.length === 12) {
          postedPhoneNumber = postedPhoneNumber.slice(2);
      }

      // Find properties where help requests exist
      const properties = await AddModel.find({
          $or: [
              { phoneNumber: postedPhoneNumber },
              { phoneNumber: `+91${postedPhoneNumber}` },
              { phoneNumber: `91${postedPhoneNumber}` }
          ]
      });

      if (properties.length === 0) {
          return res.status(200).json({ helpRequestsCount: 0 });
      }

      // Count total number of help requests
      const helpRequestsCount = properties.reduce((total, property) => {
          return total + (property.helpRequests?.filter(req => req.phoneNumber).length || 0);
      }, 0);

      return res.status(200).json({ helpRequestsCount });

  } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


// router.get('/get-contact-buyer-count', async (req, res) => {
//   try {
//       let { postedPhoneNumber } = req.query;

//       if (!postedPhoneNumber) {
//           return res.status(400).json({ message: "Posted user phone number is required." });
//       }

//       // Normalize phone number format
//       postedPhoneNumber = postedPhoneNumber.replace(/\D/g, ""); // Remove non-numeric characters
//       if (postedPhoneNumber.startsWith("91") && postedPhoneNumber.length === 12) {
//           postedPhoneNumber = postedPhoneNumber.slice(2);
//       }

//       // Find properties where contact requests exist
//       const properties = await AddModel.find({
//           $or: [
//               { phoneNumber: postedPhoneNumber },
//               { phoneNumber: `+91${postedPhoneNumber}` },
//               { phoneNumber: `91${postedPhoneNumber}` }
//           ]
//       });

//       if (properties.length === 0) {
//           return res.status(200).json({ contactBuyerCount: 0 });
//       }

//       // Count total number of contact requests
//       const contactBuyerCount = properties.reduce((total, property) => {
//           return total + (property.contactRequests?.filter(req => req.phoneNumber).length || 0);
//       }, 0);

//       return res.status(200).json({ contactBuyerCount });

//   } catch (error) {
//       return res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });













router.get('/get-contact-buyer-count', async (req, res) => {
  try {
    let { postedPhoneNumber } = req.query;

    if (!postedPhoneNumber) {
      return res.status(400).json({ message: "Posted user phone number is required." });
    }

    // Normalize phone number
    postedPhoneNumber = postedPhoneNumber.replace(/\D/g, "");
    if (postedPhoneNumber.startsWith("91") && postedPhoneNumber.length === 12) {
      postedPhoneNumber = postedPhoneNumber.slice(2);
    }

    // Fetch all properties for the user (status not filtered)
    const properties = await AddModel.find({
      $or: [
        { phoneNumber: postedPhoneNumber },
        { phoneNumber: `+91${postedPhoneNumber}` },
        { phoneNumber: `91${postedPhoneNumber}` }
      ]
    });

    if (properties.length === 0) {
      return res.status(200).json({ contactBuyerCount: 0 });
    }

    // ? Count only properties with at least one valid contact request
    const contactBuyerCount = properties.filter(property =>
      (property.contactRequests || []).some(req => req.phoneNumber && req.phoneNumber !== "undefined" && req.phoneNumber !== "null")
    ).length;

    return res.status(200).json({ contactBuyerCount });

  } catch (error) {
    console.error("Error in /get-contact-buyer-count:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



// router.get('/get-contact-buyer-count', async (req, res) => {
//   try {
//     let { postedPhoneNumber } = req.query;

//     if (!postedPhoneNumber) {
//       return res.status(400).json({ message: "Posted user phone number is required." });
//     }

//     // Normalize phone number format
//     postedPhoneNumber = postedPhoneNumber.replace(/\D/g, "");
//     if (postedPhoneNumber.startsWith("91") && postedPhoneNumber.length === 12) {
//       postedPhoneNumber = postedPhoneNumber.slice(2);
//     }

//     // Fetch only 'contact' status properties
//     const properties = await AddModel.find({
//       status: "contact",
//       $or: [
//         { phoneNumber: postedPhoneNumber },
//         { phoneNumber: `+91${postedPhoneNumber}` },
//         { phoneNumber: `91${postedPhoneNumber}` }
//       ]
//     });

//     if (properties.length === 0) {
//       return res.status(200).json({ contactBuyerCount: 0 });
//     }

//     // Count total contact requests only from 'contact' status properties
//     const contactBuyerCount = properties.reduce((total, property) => {
//       return total + (property.contactRequests?.filter(req => req.phoneNumber).length || 0);
//     }, 0);

//     return res.status(200).json({ contactBuyerCount });

//   } catch (error) {
//     return res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });


router.get('/get-help-as-owner-count', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  try {
    const cleanPhone = phoneNumber.trim().replace(/[^+\d]/g, ''); // Normalize phone number

    // Find properties where helpRequests contain this phoneNumber
    const properties = await AddModel.find({
      'helpRequests.phoneNumber': {
        $regex: cleanPhone,
        $options: 'i'
      }
    });

    return res.status(200).json({
      success: true,
      helpPropertiesCount: properties.length,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});


router.get('/get-contact-owner-count', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  try {
    // Normalize the phone number (remove non-digits and symbols)
    const cleanPhone = phoneNumber.trim().replace(/[^+\d]/g, '');
    const regex = new RegExp(`${cleanPhone}$`, 'i'); // Match if phone number ends with these digits

    // Fetch properties where someone requested contact with this phone number
    const properties = await AddModel.find({
      'contactRequests.phoneNumber': { $regex: regex }
    });

    if (!properties.length) {
      return res.status(200).json({ success: true, contactOwnersCount: 0, owners: [] });
    }

    // Extract and count unique property owners who received requests
    const uniqueOwners = new Set(properties.map(p => p.phoneNumber));

    return res.status(200).json({
      success: true,
      contactOwnersCount: uniqueOwners.size,
      owners: Array.from(uniqueOwners)
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});


// ? Fetch Reported Property Requests Count
router.get('/get-reportproperty-buyer-count', async (req, res) => {
  try {
      let { postedPhoneNumber } = req.query;

      if (!postedPhoneNumber) {
          return res.status(400).json({ message: 'Posted user phone number is required.' });
      }

      // Normalize phone number format
      postedPhoneNumber = postedPhoneNumber.replace(/\D/g, '');
      if (postedPhoneNumber.startsWith('91') && postedPhoneNumber.length === 12) {
          postedPhoneNumber = postedPhoneNumber.slice(2);
      }

      // Find properties related to the posted phone number
      const properties = await AddModel.find({
          $or: [
              { phoneNumber: postedPhoneNumber },
              { phoneNumber: `+91${postedPhoneNumber}` },
              { phoneNumber: `91${postedPhoneNumber}` }
          ]
      });

      if (properties.length === 0) {
          return res.status(200).json({ reportRequestsCount: 0 });
      }

      // Count total number of report requests
      const reportRequestsCount = properties.reduce((total, property) => {
          return total + (property.reportProperty?.filter(req => req.phoneNumber).length || 0);
      }, 0);

      return res.status(200).json({ reportRequestsCount });

  } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


router.get('/get-reportproperty-owner-count', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  try {
    const cleanPhone = phoneNumber.trim().replace(/[^+\d]/g, '');
    const regex = new RegExp(`${cleanPhone}$`, 'i'); // Match end of number (handles 3 formats)

    // Find all properties where the user is in the reportProperty array
    const properties = await AddModel.find({
      'reportProperty.phoneNumber': { $regex: regex }
    });

    // ?? Count based on unique ppcIds
    const uniquePpcIds = new Set(properties.map(p => p.ppcId));

    return res.status(200).json({
      success: true,
      reportPropertyOwnersCount: uniquePpcIds.size,
      ppcIds: Array.from(uniquePpcIds) // optional debug info
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});


// ? Fetch Sold-Out Requests Count
router.get('/get-soldout-buyer-count', async (req, res) => {
  try {
      let { postedPhoneNumber } = req.query;

      if (!postedPhoneNumber) {
          return res.status(400).json({ message: 'Posted user phone number is required.' });
      }

      // Normalize phone number format
      postedPhoneNumber = postedPhoneNumber.replace(/\D/g, '');
      if (postedPhoneNumber.startsWith('91') && postedPhoneNumber.length === 12) {
          postedPhoneNumber = postedPhoneNumber.slice(2);
      }

      // Find properties related to the posted phone number
      const properties = await AddModel.find({
          $or: [
              { phoneNumber: postedPhoneNumber },
              { phoneNumber: `+91${postedPhoneNumber}` },
              { phoneNumber: `91${postedPhoneNumber}` }
          ]
      });

      if (properties.length === 0) {
          return res.status(200).json({ soldOutRequestsCount: 0 });
      }

      // Count total number of sold-out requests
      const soldOutRequestsCount = properties.reduce((total, property) => {
          return total + (property.soldOutReport?.filter(req => req.phoneNumber).length || 0);
      }, 0);

      return res.status(200).json({ soldOutRequestsCount });

  } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


router.get('/get-soldout-owner-count', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  try {
    const cleanPhone = phoneNumber.trim().replace(/[^+\d]/g, ''); // Normalize phone number

    // Fetch all properties where the user has reported sold-out
    const properties = await AddModel.find({
      'soldOutReport.phoneNumber': { $regex: cleanPhone, $options: 'i' }
    });

    // ?? Extract unique PPC IDs (safety against duplicates)
    const uniquePpcIds = new Set(properties.map(p => p.ppcId));

    return res.status(200).json({
      success: true,
      soldOutOwnersCount: uniquePpcIds.size,
      ppcIds: Array.from(uniquePpcIds) // Optional, for debug
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// ? Fetch Favorite Requests Count
router.get("/get-favorite-buyer-count", async (req, res) => {
  try {
      let { postedPhoneNumber } = req.query;

      if (!postedPhoneNumber) {
          return res.status(400).json({ message: "Posted user phone number is required." });
      }

      // Normalize phone number format
      postedPhoneNumber = postedPhoneNumber.replace(/\D/g, "");
      if (postedPhoneNumber.startsWith("91") && postedPhoneNumber.length === 12) {
          postedPhoneNumber = postedPhoneNumber.slice(2);
      }

      // Find properties related to the posted phone number
      const properties = await AddModel.find({
          $or: [
              { phoneNumber: postedPhoneNumber },
              { phoneNumber: `+91${postedPhoneNumber}` },
              { phoneNumber: `91${postedPhoneNumber}` }
          ]
      });

      if (properties.length === 0) {
          return res.status(200).json({ favoriteRequestsCount: 0 });
      }

      // Count total number of favorite requests
      const favoriteRequestsCount = properties.reduce((total, property) => {
          return total + (property.favoriteRequests?.filter(req => req.phoneNumber).length || 0);
      }, 0);

      return res.status(200).json({ favoriteRequestsCount });

  } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// GET /get-favorite-owner-count?phoneNumber=9080829754
router.get('/get-favorite-owner-count', async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const regex = new RegExp(`${cleanPhone}$`, 'i'); // Match last 10 digits

    // Count how many properties include this user in favoriteRequests
    const favoriteOwnerCount = await AddModel.countDocuments({
      favoriteRequests: {
        $elemMatch: {
          phoneNumber: { $regex: regex }
        }
      }
    });

    res.status(200).json({
      message: "Favorite owner count fetched successfully.",
      favoriteOwnerCount
    });

  } catch (error) {
    console.error("Error in favorite owner count API:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// router.get('/get-favorite-owner-count', async (req, res) => {
//   try {
//     let { phoneNumber } = req.query;

//     if (!phoneNumber) {
//       return res.status(400).json({ message: "Owner's phone number is required." });
//     }

//     // Normalize phone number (last 10 digits)
//     const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
//     const regex = new RegExp(`${cleanPhone}$`, 'i');

//     // Find properties owned by this user (any format)
//     const properties = await AddModel.find({
//       phoneNumber: { $regex: regex }
//     });

//     if (properties.length === 0) {
//       return res.status(200).json({ favoriteOwnerCount: 0 });
//     }

//     // Count total favorite requests (by unique ppcIds)
//     const uniquePpcIds = new Set();

//     properties.forEach(property => {
//       if (property.favoriteRequests?.some(req => req.phoneNumber)) {
//         uniquePpcIds.add(property.ppcId);
//       }
//     });

//     return res.status(200).json({
//       message: "Favorite owner count fetched successfully.",
//       favoriteOwnerCount: uniquePpcIds.size,
//       ppcIds: Array.from(uniquePpcIds) // optional
//     });

//   } catch (error) {
//     return res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });


router.get('/get-favorite-removed-owner-count', async (req, res) => {
  try {
    let { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Owner's phone number is required." });
    }

    // Normalize: extract last 10 digits from any format
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const regex = new RegExp(`${cleanPhone}$`, 'i'); // match end of string

    // Find all properties posted by this owner (in any of 3 phone formats)
    const properties = await AddModel.find({
      phoneNumber: { $regex: regex }
    });

    if (!properties.length) {
      return res.status(200).json({ favoriteRemovedOwnerCount: 0 });
    }

    // Count how many of these properties have favoriteRemoved entries
    const favoriteRemovedOwnerCount = properties.reduce((count, property) => {
      const hasRemoved = Array.isArray(property.favoriteRemoved) &&
                         property.favoriteRemoved.some(req => req.phoneNumber);
      return hasRemoved ? count + 1 : count;
    }, 0);

    return res.status(200).json({
      message: "Favorite removed owner count fetched successfully.",
      favoriteRemovedOwnerCount
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// ----------------

router.delete('/delete-viewed-property/:ppcId', async (req, res) => {
  const { ppcId } = req.params;

  if (!ppcId) {
    return res.status(400).json({ message: "Property ID is required" });
  }

  try {
    // Find all users who have viewed this property
    const users = await UserViewsModel.find({ "viewedProperties.ppcId": ppcId });

    if (!users.length) {
      return res.status(404).json({ message: "Viewed property not found" });
    }

    // Remove the viewed property from all users' viewedProperties array
    await UserViewsModel.updateMany(
      { "viewedProperties.ppcId": ppcId },
      { $pull: { viewedProperties: { ppcId } } }
    );

    // Optionally, decrement view count in AddModel
    await AddModel.updateOne({ ppcId }, { $inc: { views: -users.length } });

    return res.status(200).json({ message: "Viewed property deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



router.get('/latest-ppcid', async (req, res) => {
    try {
        const latestProperty = await AddModel.findOne().sort({ ppcId: -1 });
        res.json({ latestPpcId: latestProperty ? latestProperty.ppcId : null });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching latest ppcId', error });
    }
});




router.post("/store-id", async (req, res) => {
  try {
    // Get the latest property to calculate the next PPC-ID
    const latestProperty = await AddModel.findOne().sort({ ppcId: -1 });

    const nextPpcId = latestProperty ? latestProperty.ppcId + 1 : 1001;

    // Create new user with the next PPC-ID and set 'createdBy' to 'Admin'
    const newUser = new AddModel({
      ppcId: nextPpcId,
      createdBy: 'Admin',  // Override default 'User' with 'Admin'
    });

    // Save the new user to the database
    const savedUser = await newUser.save();

    // Respond with the created PPC-ID
    res.status(201).json({ message: "PPC-ID created and stored successfully!", ppcId: nextPpcId });
  } catch (error) {
    res.status(500).json({ message: "Error storing PPC-ID.", error });
  }
});



router.get('/get-latest-ppcid', async (req, res) => {
  try {
    const latestProperty = await AddModel.findOne().sort({ ppcId: -1 }); // Get latest PPC-ID

    if (latestProperty) {
      res.status(200).json({ ppcId: latestProperty.ppcId  });
    } else {
      res.status(404).json({ message: "No PPC-ID found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching PPC-ID", error });
  }
});



// router.put('/update-property-status', async (req, res) => {
//   const { ppcId, status } = req.body;

//   if (!ppcId || !status) {
//     return res.status(400).json({ message: 'PPC ID and status are required.' });
//   }

//   try {
//     const updatedProperty = await AddModel.findOneAndUpdate(
//       { ppcId },
//       { status },
//       { new: true }
//     );

//     if (!updatedProperty) {
//       return res.status(404).json({ message: 'Property not found.' });
//     }

//     res.status(200).json({ message: 'Status updated successfully.', updatedProperty });
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating property status.', error });
//   }
// });

router.put('/update-property-status', async (req, res) => {
  const { ppcId, status } = req.body;

  if (!ppcId || !status) {
    return res.status(400).json({ message: 'PPC ID and status are required.' });
  }

  const allowedToOverrideActive = ['delete', 'pending', 'expired','complete'];

  try {
    const property = await AddModel.findOne({ ppcId });

    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    // If trying to overwrite 'active' with other than allowed
    if (property.status === 'active' && !allowedToOverrideActive.includes(status)) {
      return res.status(400).json({
        message: `Cannot update status from 'active' to '${status}'. Only allowed: delete, pending, expired,complete`,
      });
    }

    // Update and save
    property.status = status;
    await property.save();

    res.status(200).json({
      message: 'Status updated successfully.',
      updatedProperty: property,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating property status.', error });
  }
});




router.get('/property-views/:ppcId', async (req, res) => {
  const { ppcId } = req.params;

  if (!ppcId) {
      return res.status(400).json({ message: 'Property ID is required' });
  }

  try {
      // Increment the views field and retrieve the updated document
      const property = await AddModel.findOneAndUpdate(
          { ppcId }, 
          { $inc: { views: 1 } }, // Increment the views by 1
          { new: true } // Return the updated document
      );

      if (!property) {
          return res.status(404).json({ message: 'Property not found' });
      }

      return res.status(200).json({
          message: 'Property view count incremented successfully',
          ppcId: property.ppcId,
          views: property.views, // Return the updated view count
      });
  } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


// router.get('/zero-view-properties-on-demand', async (req, res) => {
//   try {
//     const properties = await AddModel.find({ views: { $eq: 0 }, isDeleted: { $ne: true } });

//     if (properties.length === 0) {
//       return res.status(404).json({ message: 'No properties with zero views found' });
//     }

//     const enrichedProperties = await Promise.all(
//       properties.map(async (property) => {
//         const phone = property.phoneNumber;

//         const [otpUser, directUser] = await Promise.all([
//           UserLogin.findOne({ phone, otpStatus: "verified" }),
//           UserLogin.findOne({ phone, directVerified: true }),
//         ]);

//         const isVerified = !!otpUser || !!directUser;
//         const otpStatus = otpUser ? "verified" : "not verified";
//         const createdBy = isVerified ? "User" : "Admin";
//         const displayPrice = createdBy === "Admin" ? "On Demand" : property.price;

//         return {
//           ...property.toObject(),
//           otpStatus,
//           isVerified,
//           createdBy,
//           price: displayPrice
//         };
//       })
//     );

//     return res.status(200).json({
//       message: 'Properties with zero views retrieved successfully',
//       properties: enrichedProperties,
//     });
//   } catch (error) {
//     return res.status(500).json({ message: 'Internal Server Error', error: error.message });
//   }
// });


// router.get('/zero-view-properties-on-demand', async (req, res) => {
//   try {
//     const properties = await AddModel.find({
//       views: { $eq: 0 },
//       isDeleted: { $ne: true },
//       status: "active"
//     });

//     if (properties.length === 0) {
//       return res.status(404).json({ message: 'No active properties with zero views found' });
//     }

//     const enrichedProperties = await Promise.all(
//       properties.map(async (property) => {
//         const phone = property.phoneNumber;

//         const [otpUser, directUser] = await Promise.all([
//           UserLogin.findOne({ phone, otpStatus: "verified" }),
//           UserLogin.findOne({ phone, directVerified: true }),
//         ]);

//         const isVerified = !!otpUser || !!directUser;
//         const otpStatus = otpUser ? "verified" : "not verified";
//         const createdBy = isVerified ? "User" : "Admin";
//         const displayPrice = createdBy === "Admin" ? "On Demand" : property.price;

//         return {
//           ...property.toObject(),
//           otpStatus,
//           isVerified,
//           createdBy,
//           price: displayPrice
//         };
//       })
//     );

//     return res.status(200).json({
//       message: 'Active properties with zero views retrieved successfully',
//       properties: enrichedProperties,
//     });
//   } catch (error) {
//     return res.status(500).json({ message: 'Internal Server Error', error: error.message });
//   }
// });


router.get('/zero-view-properties-on-demand', async (req, res) => {
  try {
    // Fetch only active properties with 0 views
    const properties = await AddModel.find({
      views: 0,
      status: "active",
    }).lean(); // lean() improves read performance

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active properties with zero views found',
      });
    }

    // Replace price with "On Demand" if onDemand is true
    const processedProperties = properties.map((property) => ({
      ...property,
      price: property.onDemand ? "On Demand" : property.price,
    }));

    return res.status(200).json({
      success: true,
      message: 'Active properties with zero views retrieved successfully',
      properties: processedProperties,
    });
  } catch (error) {
    console.error("Error fetching zero-view properties:", error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
});



router.get('/zero-view-properties', async (req, res) => {
  try {
      const properties = await AddModel.find({ views: { $eq: 0 } });

      if (properties.length === 0) {
          return res.status(404).json({ message: 'No properties with zero views found' });
      }

      return res.status(200).json({
          message: 'Properties with zero views retrieved successfully',
          properties,
      });
  } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.get('/zero-view-properties-count', async (req, res) => {
  try {
    const count = await AddModel.countDocuments({ views: { $eq: 0 } });

    res.status(200).json({
      message: 'Zero viewed property count fetched successfully',
      count,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching zero viewed property count',
      error: error.message,
    });
  }
});


router.delete('/delete-viewed-property/:ppcId', async (req, res) => {
  const { ppcId } = req.params;

  try {
    const deletedProperty = await AddModel.findOneAndDelete({ ppcId, views: { $eq: 0 } });

    if (!deletedProperty) {
      return res.status(404).json({ message: "Property not found or has views" });
    }

    return res.status(200).json({ message: "Property deleted successfully", deletedProperty });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});





  router.post('/store-data', async (req, res) => {
    const { phoneNumber } = req.body;
  
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }
  
    try {
      // Check for an incomplete entry for this phone number
      const existingIncomplete = await AddModel.findOne({
        phoneNumber,
        $or: [
          { propertyMode: { $in: [null, ''] } },
          { propertyType: { $in: [null, ''] } },
          { price: { $in: [null, ''] } },
          { totalArea: { $in: [null, ''] } },
          { areaUnit: { $in: [null, ''] } },
          // { salesType: { $in: [null, ''] } },
          //           { postedBy: { $in: [null, ''] } }

        ]
      });
  
      if (existingIncomplete) {
        return res.status(200).json({
          message: 'Existing incomplete entry found.',
          ppcId: existingIncomplete.ppcId
        });
      }
  
      // Generate new PPC-ID
      const latestProperty = await AddModel.findOne().sort({ ppcId: -1 });
      const nextPpcId = latestProperty ? latestProperty.ppcId + 1 : 1001;
  
      // Create and save new user
      const newUser = new AddModel({ phoneNumber, ppcId: nextPpcId,createdBy: 'User' });
      await newUser.save();
  
      res.status(201).json({ message: 'New PPC-ID created.', ppcId: nextPpcId });
    } catch (error) {
      res.status(500).json({ message: 'Error storing user details.', error });
    }
  });


// --------------------------------------------------







// // POST /api/check-user-plan
// router.post('/check-user-plan', async (req, res) => {
//   try {
//     const { phoneNumber } = req.body;

//     if (!phoneNumber) {
//       return res.status(400).json({ message: 'Phone number is required' });
//     }

//     // Check for an active, non-expired plan
//     const existingPlan = await PricingPlans.findOne({
//       phoneNumber: phoneNumber,
//       status: 'active',
//       expireDate: { $gte: new Date() }
//     });

//     if (existingPlan) {
//       return res.status(200).json({
//         planStatus: 1,
//         message: 'User has an active plan',
//         planDetails: existingPlan
//       });
//     } else {
//       return res.status(200).json({
//         planStatus: 0,
//         message: 'User has no active plan'
//       });
//     }
//   } catch (error) {
//     console.error('Error checking plan:', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });



router.post('/check-user-plan', async (req, res) => {
  try {
    let { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    phoneNumber = normalizePhoneNumber(phoneNumber);

    // Find active, non-expired plans
    let plans = await PricingPlans.find({
      phoneNumber: phoneNumber,
      status: 'active',
      expireDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    const validPlans = [];

    for (const plan of plans) {
      if (plan.name.toLowerCase() === 'free') {
        validPlans.push(plan);
      } else {
        const payment = await PaymentPayU.findOne({
          phone: { $regex: new RegExp(phoneNumber + '$') },
          planName: plan.name,
          status: 'success',
          txnid: { $exists: true }
        });
        if (payment) {
          validPlans.push(plan);
        }
      }
    }

    if (validPlans.length === 0) {
      return res.status(200).json({
        planStatus: 0,
        message: 'User has no active plan'
      });
    }

    const latestPlan = validPlans[0];

    // ?? Count actual used cars from AddModel
    const usedCars = await AddModel.countDocuments({
      phoneNumber: new RegExp(phoneNumber + '$'),
      isDeleted: false
    });

    const planObject = latestPlan.toObject();
    planObject.usedCars = usedCars;

    return res.status(200).json({
      planStatus: 1,
      message: 'User has an active plan',
      planDetails: planObject
    });
  } catch (error) {
    return res.status(500).json({ message: '' });
  }
})


router.post('/store-phone', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  try {
    // Check for an incomplete entry for this phone number
    const existingIncomplete = await AddModel.findOne({
      phoneNumber,
      $or: [
        { propertyMode: { $in: [null, ''] } },
        { propertyType: { $in: [null, ''] } },
        { price: { $in: [null, ''] } }
      ]
    });

    if (existingIncomplete) {
      return res.status(200).json({
        message: 'Existing incomplete entry found.',
        ppcId: existingIncomplete.ppcId
      });
    }

    // Generate new PPC-ID
    const latestProperty = await AddModel.findOne().sort({ ppcId: -1 });
    const nextPpcId = latestProperty ? latestProperty.ppcId + 1 : 1001;

    // Create and save new user
    const newUser = new AddModel({ phoneNumber, ppcId: nextPpcId,createdBy: 'Admin' });
    await newUser.save();

    res.status(201).json({ message: 'New PPC-ID created.', ppcId: nextPpcId });
  } catch (error) {
    res.status(500).json({ message: 'Error storing user details.', error });
  }
});





  router.get('/fetch-datas', async (req, res) => {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required.' });
    }

    try {
        // Normalize phone number
        const normalizedPhoneNumber = phoneNumber
            .replace(/[\s-]/g, '')
            .replace(/^(\+91|91|0)/, '') // Remove country code if any
            .trim();

        // Query to fetch only users with ppcId
        const query = { 
            phoneNumber: new RegExp(normalizedPhoneNumber + '$'),
            ppcId: { $exists: true } // Ensure ppcId exists
        };

        // Fetch all required fields
        const users = await AddModel.find(query, {
            ppcId: 1,
            phoneNumber: 1,
            propertyMode: 1,
            propertyType: 1,
            price: 1,
            propertyAge: 1,
            bankLoan: 1,
            negotiation: 1,
            length: 1,
            breadth: 1,
            totalArea: 1,
            ownership: 1,
            bedrooms: 1,
            kitchen: 1,
            kitchenType: 1,
            balconies: 1,
            floorNo: 1,
            areaUnit: 1,
            propertyApproved: 1,
            postedBy: 1,
            facing: 1,
            salesMode: 1,
            salesType: 1,
            description: 1,
            furnished: 1,
            lift: 1,
            attachedBathrooms: 1,
            western: 1,
            numberOfFloors: 1,
            carParking: 1,
            rentalPropertyAddress: 1,
            country: 1,
            state: 1,
            city: 1,
            district: 1,
            area: 1,
            streetName: 1,
            doorNumber: 1,
            nagar: 1,
            ownerName: 1,
            email: 1,
            alternatePhone: 1,
            bestTimeToCall: 1,
            _id: 0  // Exclude MongoDB _id field from response
        });

        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'Users not found.' });
        }

        res.status(200).json({
            message: 'User data fetched successfully!',
            users
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user details.', error });
    }
});



router.get('/edit-property/:ppcId', async (req, res) => {
  const { ppcId } = req.params;  // ppcId from URL parameter

  try {
      // Find the property by PPC-ID
      const user = await AddModel.findOne({ ppcId });

      if (!user) {
          return res.status(404).json({ message: 'Property not found.' });
      }

      // Send the current property details to the client
      res.status(200).json({ user });
  } catch (error) {
      res.status(500).json({ message: 'Error fetching property details.', error });
  }
});





  router.post('/update-property-data', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'photos', maxCount: 15 }]), async (req, res) => {
    // Check for multer errors
    if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
    }
    if (req.files['video'] && req.files['video'][0].size > 50 * 1024 * 1024) {
        return res.status(400).json({ message: 'Video file size exceeds 50MB.' });
    }

    const {
        ppcId,
        phoneNumber,
        propertyMode,
        propertyType,
        price, 
    propertyAge,
    bankLoan,
    negotiation,
    length,
    breadth,
    totalArea,
    ownership,
    bedrooms,
    kitchen,
    kitchenType,
    balconies,
    floorNo,
    areaUnit,
    propertyApproved,
    postedBy,
    facing,
    salesMode,
    salesType,
    description,
    furnished,
    lift,
    attachedBathrooms,
    western,
    numberOfFloors,
    carParking,
    rentalPropertyAddress,
    country,
    state,
    city,
    district,
    area,
    streetName,
    doorNumber,
    nagar,
    ownerName,
    email,
    alternatePhone,
    bestTimeToCall
    } = req.body;

    if (!ppcId || !phoneNumber) {
        return res.status(400).json({ message: 'PPC-ID and phone number are required.' });
    }

    try {

        // Find the user by PPC-ID and phone number
        const user = await AddModel.findOne({ ppcId, phoneNumber });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update the property details only if provided in the request
        if (propertyMode) user.propertyMode = propertyMode;
        if (propertyType) user.propertyType = propertyType;
        if (price) user.price = price;
        if (propertyAge) user.propertyAge = propertyAge;
        if (bankLoan) user.bankLoan = bankLoan;
        if (negotiation) user.negotiation = negotiation;
        if (length) user.length = length;
        if (breadth) user.breadth = breadth;
        if (totalArea) user.totalArea = totalArea;
        if (ownership) user.ownership = ownership;
        if (bedrooms) user.bedrooms = bedrooms;
        if (kitchen) user.kitchen = kitchen;
        if (kitchenType) user.kitchenType = kitchenType;
        if (balconies) user.balconies = balconies;
        if (floorNo) user.floorNo = floorNo;
        if (areaUnit) user.areaUnit = areaUnit;
        if (propertyApproved) user.propertyApproved = propertyApproved;
        if (postedBy) user.postedBy = postedBy;
        if (facing) user.facing = facing;
        if (salesMode) user.salesMode = salesMode;
        if (salesType) user.salesType = salesType;
        if (description) user.description = description;
        if (furnished) user.furnished = furnished;
        if (lift) user.lift = lift;
        if (attachedBathrooms) user.attachedBathrooms = attachedBathrooms;
        if (western) user.western = western;
        if (numberOfFloors) user.numberOfFloors = numberOfFloors;
        if (carParking) user.carParking = carParking;
        if(alternatePhone) user.alternatePhone = alternatePhone;
        
        // Address fields
        if (rentalPropertyAddress) user.rentalPropertyAddress = rentalPropertyAddress;
        if (country) user.country = country;
        if (state) user.state = state;
        if (city) user.city = city;
        if (district) user.district = district;
        if (area) user.area = area;
        if (streetName) user.streetName = streetName;
        if (doorNumber) user.doorNumber = doorNumber;
        if (nagar) user.nagar = nagar;
        if (ownerName) user.ownerName = ownerName;
        if (email) user.email = email;
        if (bestTimeToCall) user.bestTimeToCall = bestTimeToCall;

        // Handle video and photo updates
        if (req.files) {
            if (req.files['video']) {
                user.video = req.files['video'][0].path; // Save video path
            }

            if (req.files['photos']) {
                user.photos = req.files['photos'].map(file => file.path); // Save photo paths
            }
        }

        // Check if all required fields are filled
        const isComplete = [
            propertyMode, propertyType, price,
             propertyAge,
            bankLoan,
            negotiation,
            length,
            breadth,
            totalArea,
            ownership,
            bedrooms,
            kitchen,
            kitchenType, balconies, floorNo,
            areaUnit, propertyApproved, postedBy, facing, salesMode, salesType,
            description, furnished, lift, attachedBathrooms, western, numberOfFloors,
            carParking, rentalPropertyAddress, country, state, city, district,
            area, streetName, doorNumber, nagar, ownerName, email,alternatePhone, bestTimeToCall,
            req.files['photos'], req.files['video'] // Ensure photos and video are present
        ].every(field => field !== undefined && field !== '' && (Array.isArray(field) ? field.length > 0 : true));

        // Set status based on whether all required fields are filled
        user.status = isComplete ? 'complete' : 'incomplete';

        // Save updated user data
        await user.save();

        res.status(200).json({ message: 'Property details updated successfully!', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating property details.', error });
    }
});





router.get('/fetch-all-property-details', async (req, res) => {
  try {
    const properties = await AddModel.find({});

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit',
      'salesType', 'postedBy'
    ];

    const adsCountByUser = properties.reduce((acc, property) => {
      const phone = property.phoneNumber;
      acc[phone] = (acc[phone] || 0) + 1;
      return acc;
    }, {});

    const filteredProperties = properties.filter(property => {
      const hasReports = Array.isArray(property.reportProperty) && property.reportProperty.length > 0;
      const hasHelps = Array.isArray(property.helpRequests) && property.helpRequests.length > 0;
      return hasReports || hasHelps;
    });

    const combinedData = filteredProperties.map((property, index) => {
      const isComplete = requiredFields.every(field =>
        property[field] !== undefined &&
        property[field] !== null &&
        String(property[field]).trim() !== ''
      );

      const helpDetails = (property.helpRequests || []).map(help => ({
        phoneNumber: help.phoneNumber,
        selectHelpReason: help.selectHelpReason,
        comment: help.comment,
        requestedAt: help.requestedAt
      }));

      const reportDetails = (property.reportProperty || []).map(report => ({
        phoneNumber: report.phoneNumber,
        reason: report.reason,
        selectReasons: report.selectReasons,
        date: report.date
      }));

      return {
        slNo: index + 1,
        ppcId: property.ppcId,
        image: property.photos && property.photos.length > 0 ? property.photos[0] : null,
        phoneNumber: property.phoneNumber,
        ownerName: property.ownerName,
        propertyMode: property.propertyMode,
        propertyType: property.propertyType,
        price: property.price,
        area: property.area,
        city: property.city,
        state: property.state,
        createdBy: property.postedBy,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
        required: isComplete ? "yes" : "no",
        adsCount: adsCountByUser[property.phoneNumber] || 0,
        planName: property.planName || "",
        status: property.status || "Active",
        reportDetails,
        totalReports: reportDetails.length,
        helpRequests: helpDetails,
        totalHelpRequests: helpDetails.length
      };
    });

    res.status(200).json({
      success: true,
      message: "Filtered property data fetched successfully!",
      data: combinedData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
});



// router.get('/fetch-alls-datas-all', async (req, res) => {
//   try {
//     const properties = await AddModel.find({});
//         // const properties = await AddModel.find({ status: 'active', featureStatus: 'yes' });

//     const plans = await PricingPlans.find();
//     const payuData = await PaymentPayU.find();
//     const bills = await Bill.find();
//     const followups = await FollowUp.find();

//     const requiredFields = [
//       'propertyMode', 'propertyType', 'price',
//       'totalArea', 'areaUnit',
//       'salesType', 'postedBy'
//     ];

//     const adsCountByUser = properties.reduce((acc, property) => {
//       const phone = property.phoneNumber;
//       acc[phone] = (acc[phone] || 0) + 1;
//       return acc;
//     }, {});

//     const completeProperties = properties.filter((property) =>
//       requiredFields.every(
//         (field) =>
//           property[field] !== undefined &&
//           property[field] !== null &&
//           String(property[field]).trim() !== ''
//       )
//     );

//     const processedProperties = completeProperties.map((property) => {
//       const escapedPhone = escapeRegExp(property.phoneNumber || '');

//       const matchedPlan = plans
//         .filter(plan =>
//           Array.isArray(plan.phoneNumber)
//             ? plan.phoneNumber.includes(property.phoneNumber)
//             : plan.phoneNumber === property.phoneNumber
//         )
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

//       const matchedPayU = payuData.find(
//         pay => new RegExp(escapedPhone + '$').test(pay.phone)
//       );

//       const matchedBill = bills.find(bill =>
//         bill.ownerPhone === property.phoneNumber || bill.ppId === property.ppcId
//       );

//       let adminOffice = 'N/A';
//       let adminName = 'N/A';
//       let billNo = 'N/A';
//       let billDate = 'N/A';
//       let validity = 'N/A';
//       let billExpiryDate = 'N/A';

//       if (matchedBill) {
//         adminOffice = matchedBill.adminOffice || 'N/A';
//         adminName = matchedBill.adminName || 'N/A';
//         billNo = matchedBill.billNo || 'N/A';
//         billDate = matchedBill.billDate || 'N/A';
//         validity = matchedBill.validity || 'N/A';

//         if (billDate !== 'N/A' && validity !== 'N/A') {
//           const billStart = new Date(billDate).getTime();
//           const billExpiry = billStart + (validity * 24 * 60 * 60 * 1000);
//           billExpiryDate = new Date(billExpiry).toLocaleDateString();
//         }
//       }

//       let planCreatedAt = 'N/A';
//       let planExpiryDate = 'N/A';

//       if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
//         const expiryDate = new Date(matchedPlan.createdAt).getTime() + matchedPlan.durationDays * 24 * 60 * 60 * 1000;
//         planCreatedAt = new Date(matchedPlan.createdAt).toLocaleDateString();
//         planExpiryDate = new Date(expiryDate).toLocaleDateString();
//       }

//       const propertyFollowUps = followups
//         .filter(fu => String(fu.ppcId) === String(property.ppcId))
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//       const followUpAdminName = propertyFollowUps.length > 0
//         ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
//         : 'N/A';

//       return {
//         ...property._doc,
//         required: "yes",
//         adsCount: adsCountByUser[property.phoneNumber] || 0,
//         planName: matchedPlan?.name || 'N/A',
//         planCreatedAt,
//         planExpiryDate,
//         packageType: matchedPlan?.packageType || 'N/A',
//         planDuration: matchedPlan?.durationDays || 'N/A',
//         adminOffice,
//         adminName,
//         billNo,
//         billDate,
//         validity,
//         billExpiryDate,
//         followUpAdminName,
//         payUStatus: matchedPayU?.status || 'N/A',
//         payustatususer: matchedPayU?.payustatususer || 'N/A',
//         paymentId: matchedPayU?.mihpayid || 'N/A',
//         transactionId: matchedPayU?.txnid || 'N/A',
//         payUCreatedAt: matchedPayU?.createdAt || null,
//         payUUpdatedAt: matchedPayU?.updatedAt || null
//       };
//     });

//     res.status(200).json({
//       message: "Only required=YES data fetched successfully with plan & payment info.",
//       users: processedProperties
//     });

//   } catch (error) {
//     console.error('Error in /fetch-alls-datas:', error);
//     res.status(500).json({
//       message: 'Error fetching all user details.',
//       error: error.message
//     });
//   }
// });



// router.get('/fetch-alls-datas', async (req, res) => {
//   try {
//     const properties = await AddModel.find({});
//     const plans = await PricingPlans.find();
//     const bills = await Bill.find();
//     const followups = await FollowUp.find(); // Ensure you're getting follow-ups

//     const requiredFields = [
//       'propertyMode', 'propertyType', 'price',
//       'totalArea', 'areaUnit',
//       'salesType', 'postedBy'
//     ];

//     const adsCountByUser = properties.reduce((acc, property) => {
//       const phone = property.phoneNumber;
//       acc[phone] = (acc[phone] || 0) + 1;
//       return acc;
//     }, {});

//     // ? Filter properties to only include those where all required fields are filled
//     const completeProperties = properties.filter((property) =>
//       requiredFields.every(
//         (field) =>
//           property[field] !== undefined &&
//           property[field] !== null &&
//           String(property[field]).trim() !== ''
//       )
//     );

//     const processedProperties = completeProperties.map((property) => {
//       const matchedPlan = plans.find(plan =>
//         Array.isArray(plan.phoneNumber)
//           ? plan.phoneNumber.includes(property.phoneNumber)
//           : plan.phoneNumber === property.phoneNumber
//       );

//       const matchedBill = bills.find(bill =>
//         bill.ownerPhone === property.phoneNumber || bill.ppId === property.ppcId
//       );

//       let adminOffice = 'N/A';
//       let adminName = 'N/A';
//       let billNo = 'N/A';
//       let billDate = 'N/A';
//       let validity = 'N/A';
//       let billExpiryDate = 'N/A';

//       if (matchedBill) {
//         adminOffice = matchedBill.adminOffice || 'N/A';
//         adminName = matchedBill.adminName || 'N/A';
//         billNo = matchedBill.billNo || 'N/A';
//         billDate = matchedBill.billDate || 'N/A';
//         validity = matchedBill.validity || 'N/A';

//         if (billDate !== 'N/A' && validity !== 'N/A') {
//           const billStart = new Date(billDate).getTime();
//           const billExpiry = billStart + (validity * 24 * 60 * 60 * 1000);
//           billExpiryDate = new Date(billExpiry).toLocaleDateString();
//         }
//       }

//       let planCreatedAt = 'N/A';
//       let planExpiryDate = 'N/A';

//       if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
//         const expiryDate = new Date(matchedPlan.createdAt).getTime() + matchedPlan.durationDays * 24 * 60 * 60 * 1000;
//         planCreatedAt = new Date(matchedPlan.createdAt).toLocaleDateString();
//         planExpiryDate = new Date(expiryDate).toLocaleDateString();
//       }


    
//       // Get the latest follow-up admin name for this ppcId
//       const propertyFollowUps = followups
//         .filter(fu => String(fu.ppcId) === String(property.ppcId)) // Ensure matching ppcId
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//    const followUpAdminName = propertyFollowUps.length > 0 
//    ? propertyFollowUps[0]?.adminName || 'Unknown Admin' 
//    : 'N/A';

//       return {
//         ...property._doc,
//         required: "yes", // Only "yes" ones are included now
//         adsCount: adsCountByUser[property.phoneNumber] || 0,
//         planName: matchedPlan?.name || 'N/A',
//         planCreatedAt,
//         planExpiryDate,
//         packageType: matchedPlan?.packageType || 'N/A',
//         planDuration: matchedPlan?.durationDays || 'N/A',
//         adminOffice,
//         adminName,
//         billNo,
//         billDate,
//         validity,
//         billExpiryDate,
//         followUpAdminName
//       };
//     });

//     res.status(200).json({
//       message: "Only required=YES data fetched successfully.",
//       users: processedProperties,
//     });

//   } catch (error) {
//     res.status(500).json({
//       message: 'Error fetching all user details.',
//       error: error.message
//     });
//   }
// });



// router.get('/fetch-alls-datas-all', async (req, res) => {
//   try {
//     const properties = await AddModel.find({});
//     const plans = await PricingPlans.find();
//     const bills = await Bill.find();
//     const followups = await FollowUp.find();
//     const payments = await PaymentPayU.find();
//     const otpVerifiedUsers = await UserLogin.find({ otpStatus: 'verified' });
//     const directVerifiedUsers = await UserLogin.find({ directVerified: true });

//     // Step 1: Map user phone status
//     const userStatusMap = new Map();
//     otpVerifiedUsers.forEach(user => userStatusMap.set(user.phone, 'verified'));
//     directVerifiedUsers.forEach(user => {
//       if (!userStatusMap.has(user.phone)) userStatusMap.set(user.phone, 'direct');
//     });
//     const verifiedPhones = new Set(userStatusMap.keys());

//     const requiredFields = [
//       'propertyMode', 'propertyType', 'price',
//       'totalArea', 'areaUnit', 'salesType', 'postedBy'
//     ];

//     // Step 2: Count total ads per user
//     const adsCountByUser = properties.reduce((acc, property) => {
//       const phone = property.phoneNumber;
//       acc[phone] = (acc[phone] || 0) + 1;
//       return acc;
//     }, {});

//     // Step 3: Filter complete property records
//     const completeProperties = properties.filter(property =>
//       requiredFields.every(field =>
//         property[field] !== undefined &&
//         property[field] !== null &&
//         String(property[field]).trim() !== ''
//       )
//     );

//     // Step 4: Map data for each property
//     const processedProperties = completeProperties.map(property => {
//       const phone = property.phoneNumber;
//       const escapedPhone = escapeRegExp(phone || '');

//       const matchedPlan = plans
//         .filter(plan =>
//           Array.isArray(plan.phoneNumber)
//             ? plan.phoneNumber.includes(phone)
//             : plan.phoneNumber === phone
//         )
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

//       const matchedBill = bills.find(bill =>
//         bill.ownerPhone === phone || String(bill.ppId) === String(property.ppcId)
//       );

//       const matchedPayment = payments.find(payment =>
//         new RegExp(escapedPhone + '$').test(payment.phone) &&
//         String(payment.ppcId) === String(property.ppcId)
//       );

//       const propertyFollowUps = followups
//         .filter(fu => String(fu.ppcId) === String(property.ppcId))
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//       const followUpAdminName = propertyFollowUps.length > 0
//         ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
//         : 'N/A';

//       // Plan details
//       let planCreatedAt = 'N/A';
//       let planExpiryDate = 'N/A';
//       if (matchedPlan?.createdAt && matchedPlan?.durationDays) {
//         const planStart = new Date(matchedPlan.createdAt);
//         const planEnd = new Date(planStart.getTime() + matchedPlan.durationDays * 24 * 60 * 60 * 1000);
//         planCreatedAt = planStart.toLocaleDateString();
//         planExpiryDate = planEnd.toLocaleDateString();
//       }

//       // Bill details
//       let adminOffice = 'N/A';
//       let adminName = 'N/A';
//       let billNo = 'N/A';
//       let billDate = 'N/A';
//       let validity = 'N/A';
//       let billExpiryDate = 'N/A';

//       if (matchedBill) {
//         adminOffice = matchedBill.adminOffice || 'N/A';
//         adminName = matchedBill.adminName || 'N/A';
//         billNo = matchedBill.billNo || 'N/A';
//         billDate = matchedBill.billDate || 'N/A';
//         validity = matchedBill.validity || 'N/A';

//         if (billDate !== 'N/A' && validity !== 'N/A') {
//           const start = new Date(billDate).getTime();
//           const end = start + validity * 24 * 60 * 60 * 1000;
//           billExpiryDate = new Date(end).toLocaleDateString();
//         }
//       }

//       return {
//         ...property._doc,
//         required: "yes",
//         adsCount: adsCountByUser[phone] || 0,
//         planName: matchedPlan?.name || 'N/A',
//         planCreatedAt,
//         planExpiryDate,
//         packageType: matchedPlan?.packageType || 'N/A',
//         planDuration: matchedPlan?.durationDays || 'N/A',
//         adminOffice,
//         adminName,
//         billNo,
//         billDate,
//         validity,
//         billExpiryDate,
//         followUpAdminName,
//         isPreApproved: !!matchedPayment,
//         paymentInfo: matchedPayment || null,
//         payUStatus: matchedPayment?.status || 'N/A',
//         payustatususer: matchedPayment?.payustatususer || 'N/A',
//         paymentId: matchedPayment?.mihpayid || 'N/A',
//         transactionId: matchedPayment?.txnid || 'N/A',
//         payUCreatedAt: matchedPayment?.createdAt || null,
//         payUUpdatedAt: matchedPayment?.updatedAt || null,
//         otpStatus: userStatusMap.get(phone) || 'not verified',
//         isVerifiedUser: verifiedPhones.has(phone),
//       };
//     });

//     res.status(200).json({
//       message: "All verified & complete data fetched successfully.",
//       users: processedProperties
//     });

//   } catch (error) {
//     console.error('Error in /fetch-alls-datas-all:', error);
//     res.status(500).json({
//       message: 'Error fetching all user details.',
//       error: error.message
//     });
//   }
// });










router.get('/fetch-alls-datas-all', async (req, res) => {
  try {
    const properties = await AddModel.find({});
    const plans = await PricingPlans.find();
    const bills = await Bill.find();
    const followups = await FollowUp.find();
    const payments = await PaymentPayU.find();

    // ?? Step 1: Get OTP verified and directly verified users
    const otpVerifiedUsers = await UserLogin.find({ otpStatus: 'verified' });
    const directVerifiedUsers = await UserLogin.find({ directVerified: true });

    // ?? Map phone => otpStatus
    const userStatusMap = new Map();

    otpVerifiedUsers.forEach(user => {
      userStatusMap.set(user.phone, 'verified');
    });

    directVerifiedUsers.forEach(user => {
      if (!userStatusMap.has(user.phone)) {
        userStatusMap.set(user.phone, 'direct');
      }
    });

    const verifiedPhones = new Set(userStatusMap.keys());

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    // Count ads posted by phone number
    const adsCountByUser = properties.reduce((acc, property) => {
      const phone = property.phoneNumber;
      acc[phone] = (acc[phone] || 0) + 1;
      return acc;
    }, {});

    const completeProperties = properties.filter((property) =>
      requiredFields.every(
        (field) =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
      )
    );

    const processedProperties = completeProperties.map((property) => {
      const matchedPlan = plans.find(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(property.phoneNumber)
          : plan.phoneNumber === property.phoneNumber
      );

      const matchedBill = bills.find(bill =>
        bill.ownerPhone === property.phoneNumber || bill.ppId === property.ppcId
      );

      const matchedPayment = payments.find(pay =>
        pay.phone === property.phoneNumber && pay.ppcId === property.ppcId
      );

      // Bill details
      let adminOffice = 'N/A';
      let adminName = 'N/A';
      let billNo = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminOffice = matchedBill.adminOffice || 'N/A';
        adminName = matchedBill.adminName || 'N/A';
        billNo = matchedBill.billNo || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate).getTime();
          const billExpiry = billStart + (validity * 24 * 60 * 60 * 1000);
          billExpiryDate = new Date(billExpiry).toLocaleDateString();
        }
      }

      // Plan details
      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';

      if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
        const expiryDate = new Date(matchedPlan.createdAt).getTime() + matchedPlan.durationDays * 24 * 60 * 60 * 1000;
        planCreatedAt = new Date(matchedPlan.createdAt).toLocaleDateString();
        planExpiryDate = new Date(expiryDate).toLocaleDateString();
      }

      // Follow-up admin
      const propertyFollowUps = followups
        .filter(fu => String(fu.ppcId) === String(property.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const followUpAdminName = propertyFollowUps.length > 0
        ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
        : 'N/A';

      // OTP Status and Verification Check
      const phone = property.phoneNumber;
      const otpStatus = userStatusMap.get(phone) || 'not verified';
      const isVerifiedUser = verifiedPhones.has(phone);

    //   return {
    //     ...property._doc,
    //     required: "yes",
    //     adsCount: adsCountByUser[property.phoneNumber] || 0,
    //     planName: matchedPlan?.name || 'N/A',
    //     planCreatedAt,
    //     planExpiryDate,
    //     packageType: matchedPlan?.packageType || 'N/A',
    //     planDuration: matchedPlan?.durationDays || 'N/A',
    //     adminOffice,
    //     adminName,
    //     billNo,
    //     billDate,
    //     validity,
    //     billExpiryDate,
    //     followUpAdminName,
    //     isPreApproved: !!matchedPayment,
    //     paymentInfo: matchedPayment || null,
    //     otpStatus,
    //     isVerifiedUser
    //   };

    return {
  ...property._doc,
  required: "yes",
  adsCount: adsCountByUser[property.phoneNumber] || 0,
  planName: matchedPlan?.name || 'N/A',
  planCreatedAt,
  planExpiryDate,
  packageType: matchedPlan?.packageType || 'N/A',
  planDuration: matchedPlan?.durationDays || 'N/A',
  adminOffice,
  adminName,
  billNo,
  billDate,
  validity,
  billExpiryDate,
  followUpAdminName,
  isPreApproved: !!matchedPayment,
  paymentInfo: matchedPayment || null,
  otpStatus,
  isVerifiedUser,
  createdBy: (otpStatus === 'not verified' && !isVerifiedUser) ? 'Admin' : 'User', // ? This line added
};

    });
    res.status(200).json({
      message: "Only required=YES data fetched successfully (includes pre-approved & approved plans).",
      users: processedProperties,
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error fetching all user details.',
      error: error.message
    });
  }
});



router.get('/fetch-alls-datas', async (req, res) => {
  try {
    const properties = await AddModel.find({});
    const plans = await PricingPlans.find();
    const bills = await Bill.find();
    const followups = await FollowUp.find();
    const payments = await PaymentPayU.find();

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    // Count number of ads posted by each phone number
    const adsCountByUser = properties.reduce((acc, property) => {
      const phone = property.phoneNumber;
      acc[phone] = (acc[phone] || 0) + 1;
      return acc;
    }, {});

    // Filter properties with all required fields filled
    const completeProperties = properties.filter((property) =>
      requiredFields.every(
        (field) =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
      )
    );

    const processedProperties = completeProperties.map((property) => {
      // Match plan by phone number
      const matchedPlan = plans.find(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(property.phoneNumber)
          : plan.phoneNumber === property.phoneNumber
      );

      // Match bill by phone or ppcId
      const matchedBill = bills.find(bill =>
        bill.ownerPhone === property.phoneNumber || bill.ppId === property.ppcId
      );

      // Match payment by phone and ppcId
      const matchedPayment = payments.find(pay =>
        pay.phone === property.phoneNumber && pay.ppcId === property.ppcId
      );

      // Bill details
      let adminOffice = 'N/A';
      let adminName = 'N/A';
      let billNo = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminOffice = matchedBill.adminOffice || 'N/A';
        adminName = matchedBill.adminName || 'N/A';
        billNo = matchedBill.billNo || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate).getTime();
          const billExpiry = billStart + (validity * 24 * 60 * 60 * 1000);
          billExpiryDate = new Date(billExpiry).toLocaleDateString();
        }
      }

      // Plan details
      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';

      if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
        const expiryDate = new Date(matchedPlan.createdAt).getTime() + matchedPlan.durationDays * 24 * 60 * 60 * 1000;
        planCreatedAt = new Date(matchedPlan.createdAt).toLocaleDateString();
        planExpiryDate = new Date(expiryDate).toLocaleDateString();
      }

      // Follow-up admin
      const propertyFollowUps = followups
        .filter(fu => String(fu.ppcId) === String(property.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const followUpAdminName = propertyFollowUps.length > 0
        ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
        : 'N/A';

      return {
        ...property._doc,
        required: "yes",
        adsCount: adsCountByUser[property.phoneNumber] || 0,
        planName: matchedPlan?.name || 'N/A',
        planCreatedAt,
        planExpiryDate,
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        adminOffice,
        adminName,
        billNo,
        billDate,
        validity,
        billExpiryDate,
        followUpAdminName,
        isPreApproved: !!matchedPayment, // ? if payment exists
        paymentInfo: matchedPayment || null
      };
    });

    res.status(200).json({
      message: "Only required=YES data fetched successfully (includes pre-approved & approved plans).",
      users: processedProperties,
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error fetching all user details.',
      error: error.message
    });
  }
});


router.get('/fetch-all-postby-properties', async (req, res) => {
  try {
    // Only fetch properties where postedBy exists and is not empty
    const properties = await AddModel.find({
      postedBy: { $exists: true, $ne: '' }
    });

    const plans = await PricingPlans.find();
    const bills = await Bill.find();

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit',
      'salesType', 'postedBy'
    ];

    const adsCountByUser = properties.reduce((acc, property) => {
      const phone = property.phoneNumber;
      acc[phone] = (acc[phone] || 0) + 1;
      return acc;
    }, {});

    const completeProperties = properties.filter((property) =>
      requiredFields.every(
        (field) =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
      )
    );

    const incompleteProperties = properties.filter((property) =>
      !requiredFields.every(
        (field) =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
      )
    );

    const processedProperties = [...completeProperties, ...incompleteProperties].map((property) => {
      const matchedPlan = plans.find(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(property.phoneNumber)
          : plan.phoneNumber === property.phoneNumber
      );

      const matchedBill = bills.find(bill =>
        bill.ownerPhone === property.phoneNumber || bill.ppId === property.ppcId
      );

      const isComplete = completeProperties.includes(property);

      return {
        ...property._doc,
        postedBy: property.postedBy,
        required: isComplete ? "yes" : "no",
        adsCount: adsCountByUser[property.phoneNumber] || 0,
        planName: matchedPlan?.name || 'N/A',
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        planCreatedAt: matchedPlan?.createdAt ? new Date(matchedPlan.createdAt).toLocaleDateString() : 'N/A',
        planExpiryDate: matchedPlan?.createdAt && matchedPlan?.durationDays
          ? new Date(new Date(matchedPlan.createdAt).getTime() + matchedPlan.durationDays * 24 * 60 * 60 * 1000).toLocaleDateString()
          : 'N/A',
        adminOffice: matchedBill?.adminOffice || 'N/A',
        adminName: matchedBill?.adminName || 'N/A',
        billNo: matchedBill?.billNo || 'N/A',
        billDate: matchedBill?.billDate || 'N/A',
        validity: matchedBill?.validity || 'N/A',
        billExpiryDate: matchedBill?.billDate && matchedBill?.validity
          ? new Date(new Date(matchedBill.billDate).getTime() + matchedBill.validity * 24 * 60 * 60 * 1000).toLocaleDateString()
          : 'N/A'
      };
    });

    res.status(200).json({
      message: "Filtered properties with postedBy fetched successfully.",
      users: processedProperties,
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error fetching all user details.',
      error: error.message
    });
  }
});



router.get('/fetch-all-expire-property', async (req, res) => {
  try {
    const users = await PricingPlans.find();
    const allProperties = await AddModel.find({});
    const allBills = await Bill.find();
    const followups = await FollowUp.find();

    if (!users.length) {
      return res.status(404).json({ message: 'No users found.' });
    }

    const adsCountByUser = allProperties.reduce((acc, property) => {
      const phone = property.phoneNumber;
      acc[phone] = (acc[phone] || 0) + 1;
      return acc;
    }, {});

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit',
      'salesType', 'postedBy'
    ];

    const now = Date.now();
    const tenDaysLater = now + 10 * 24 * 60 * 60 * 1000;

    const userPlansWithProperties = (await Promise.all(users.map(async (user) => {
      const { name: planName, phoneNumber, createdAt, durationDays, packageType } = user;

      const planExpiry = createdAt && durationDays
        ? new Date(new Date(createdAt).getTime() + durationDays * 24 * 60 * 60 * 1000)
        : null;

      if (!planExpiry || planExpiry.getTime() <= now || planExpiry.getTime() > tenDaysLater) {
        return null;
      }

      const daysLeft = Math.ceil((planExpiry.getTime() - now) / (1000 * 60 * 60 * 24));
      const expiresIn = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;

      const formattedCreatedAt = createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A';
      const formattedExpiryDate = planExpiry ? new Date(planExpiry).toLocaleDateString() : 'N/A';

      const properties = await AddModel.find({
        phoneNumber: { $in: phoneNumber },
        status: ['complete', 'incomplete', 'active', 'pending', 'delete'],
      });

      const enhancedProperties = properties.map((property) => {
        const hasAllFields = requiredFields.every(field =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
        );

        const required = hasAllFields ? 'yes' : 'no';
        const adsCount = adsCountByUser[property.phoneNumber] || 0;

        const matchedBill = allBills.find(
          bill => bill.ownerPhone === property.phoneNumber || bill.ppId === property.ppcId
        );

        const billNo = matchedBill?.billNo || 'N/A';

        const propertyFollowUps = followups
          .filter(fu => String(fu.ppcId) === String(property.ppcId))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const followUpAdminName = propertyFollowUps.length > 0
          ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
          : 'N/A';

        return {
          ...property.toObject(),
          required,
          adsCount,
          followUpAdminName,
          billNo,
          status: property.status,
          planName,
          planCreatedAt: formattedCreatedAt,
          durationDays,
          planExpiryDate: formattedExpiryDate,
          expiresIn,
          packageType: packageType || 'N/A',
          createdAt: property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'N/A',
          updatedAt: property.updatedAt ? new Date(property.updatedAt).toLocaleDateString() : 'N/A',
        };
      });

      if (enhancedProperties.length > 0) {
        return {
          user: {
            phoneNumber,
            planName,
            planCreatedAt: formattedCreatedAt,
            durationDays,
            planExpiryDate: formattedExpiryDate,
            expiresIn,
            packageType: packageType || 'N/A',
          },
          properties: enhancedProperties,
        };
      } else {
        return null;
      }
    }))).filter(item => item !== null);

    res.status(200).json({
      message: "Properties with plans expiring in the next 10 days fetched successfully!",
      data: userPlansWithProperties,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching expiring properties.',
      error: error.message,
    });
  }
});




// ?? Utility to check if a date is expired
const isExpired = (expireDate) => {
  return new Date() > new Date(expireDate);
};

// ? Combined API: fetch expiring properties + update expired plans
router.get('/fetch-all-expire-plan-property', async (req, res) => {
  try {
    // ?? STEP 1: Update all expired plans first
    const paidPlans = await PaymentPayU.find({ payustatususer: 'paid' });
    for (const plan of paidPlans) {
      const { ppcId } = plan;
      const planDoc = await PricingPlans.findOne({ ppcId });

      if (planDoc && isExpired(planDoc.expireDate)) {
        plan.payustatususer = 'expiredPlan';
        await plan.save();
      }
    }

    // ?? STEP 2: Proceed with fetching expiring properties
    const users = await PricingPlans.find();
    const allProperties = await AddModel.find({});
    const allBills = await Bill.find();
    const followups = await FollowUp.find();

    if (!users.length) {
      return res.status(404).json({ message: 'No users found.' });
    }

    const adsCountByUser = allProperties.reduce((acc, property) => {
      const phone = property.phoneNumber;
      acc[phone] = (acc[phone] || 0) + 1;
      return acc;
    }, {});

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const now = Date.now();
    const tenDaysLater = now + 10 * 24 * 60 * 60 * 1000;

    const userPlansWithProperties = (await Promise.all(users.map(async (user) => {
      const { name: planName, phoneNumber, createdAt, durationDays, packageType } = user;

      const planExpiry = createdAt && durationDays
        ? new Date(new Date(createdAt).getTime() + durationDays * 24 * 60 * 60 * 1000)
        : null;

      if (!planExpiry || planExpiry.getTime() <= now || planExpiry.getTime() > tenDaysLater) {
        return null;
      }

      const daysLeft = Math.ceil((planExpiry.getTime() - now) / (1000 * 60 * 60 * 24));
      const expiresIn = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;

      const formattedCreatedAt = createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A';
      const formattedExpiryDate = planExpiry ? new Date(planExpiry).toLocaleDateString() : 'N/A';

      const properties = await AddModel.find({
        phoneNumber: { $in: phoneNumber },
        status: ['complete', 'incomplete', 'active', 'pending', 'delete'],
      });

      const enhancedProperties = properties.map((property) => {
        const hasAllFields = requiredFields.every(field =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
        );

        const required = hasAllFields ? 'yes' : 'no';
        const adsCount = adsCountByUser[property.phoneNumber] || 0;

        const matchedBill = allBills.find(
          bill => bill.ownerPhone === property.phoneNumber || bill.ppId === property.ppcId
        );

        const billNo = matchedBill?.billNo || 'N/A';

        const propertyFollowUps = followups
          .filter(fu => String(fu.ppcId) === String(property.ppcId))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const followUpAdminName = propertyFollowUps.length > 0
          ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
          : 'N/A';

        return {
          ...property.toObject(),
          required,
          adsCount,
          followUpAdminName,
          billNo,
          status: property.status,
          planName,
          planCreatedAt: formattedCreatedAt,
          durationDays,
          planExpiryDate: formattedExpiryDate,
          expiresIn,
          packageType: packageType || 'N/A',
          createdAt: property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'N/A',
          updatedAt: property.updatedAt ? new Date(property.updatedAt).toLocaleDateString() : 'N/A',
        };
      });

      if (enhancedProperties.length > 0) {
        return {
          user: {
            phoneNumber,
            planName,
            planCreatedAt: formattedCreatedAt,
            durationDays,
            planExpiryDate: formattedExpiryDate,
            expiresIn,
            packageType: packageType || 'N/A',
          },
          properties: enhancedProperties,
        };
      } else {
        return null;
      }
    }))).filter(item => item !== null);

    res.status(200).json({
      message: "Properties with plans expiring in the next 10 days fetched successfully!",
      data: userPlansWithProperties,
    });
  } catch (error) {
    console.error('Error in combined expired plan and property fetch:', error);
    res.status(500).json({
      message: 'Error fetching expiring properties and updating expired plans.',
      error: error.message,
    });
  }
});




// ? GET /expired-plan-properties
router.get('/expired-plan-properties', async (req, res) => {
  try {
    const paidPlans = await PaymentPayU.find({ payustatususer: 'paid' });
    const expiredPlanDetails = [];

    for (const plan of paidPlans) {
      const { ppcId } = plan;

      // Fetch corresponding plan document
      const planDoc = await PricingPlans.findOne({ ppcId });

      if (planDoc && isExpired(planDoc.expireDate)) {
        // Mark as expired
        plan.payustatususer = 'expiredPlan';
        await plan.save();

        // Fetch all properties for the expired plan's ppcId
        const properties = await AddModel.find({ ppcId });

        const formattedProperties = properties.map(prop => ({
          ppcId: prop.ppcId,
          phoneNumber: prop.phoneNumber,
          propertyMode: prop.propertyMode,
          propertyType: prop.propertyType,
          price: prop.price,
          totalArea: prop.totalArea,
          areaUnit: prop.areaUnit,
          postedBy: prop.postedBy,
          salesType: prop.salesType,
          status: prop.status,
          createdAt: prop.createdAt ? new Date(prop.createdAt).toLocaleDateString() : 'N/A',
          updatedAt: prop.updatedAt ? new Date(prop.updatedAt).toLocaleDateString() : 'N/A',
        }));

        expiredPlanDetails.push({
          ppcId,
          phone: plan.phone,
          planName: plan.planName,
          expireDate: planDoc.expireDate,
          payustatususer: 'expiredPlan',
          properties: formattedProperties,
        });
      }
    }

    return res.status(200).json({
      message: 'Expired plans and their properties fetched successfully.',
      data: expiredPlanDetails,
    });
  } catch (error) {
    console.error('Error fetching expired plans:', error);
    res.status(500).json({
      message: 'Error fetching expired plans and properties.',
      error: error.message,
    });
  }
});



// GET /expired-buyer-plan-assitant
router.get('/expired-buyer-plan-assitant', async (req, res) => {
  try {
    const buyerPlans = await PaymentPayUBuyer.find({ payustatususer: 'paid' });
    const expiredBuyerPlanDetails = [];

    for (const plan of buyerPlans) {
      const { ba_id } = plan;

      const planDoc = await PricingPlans.findOne({ ppcId: ba_id });

      if (planDoc && isExpired(planDoc.expireDate)) {
        // Mark as expired
        plan.payustatususer = 'expiredPlan';
        await plan.save();

        // Fetch BuyerAssistance data related to this ba_id
        const assistanceList = await BuyerAssistance.find({ ba_id });

        const formattedAssistances = assistanceList.map(assist => ({
          ba_id: assist.ba_id,
          baName: assist.baName,
          phoneNumber: assist.phoneNumber,
          altPhoneNumber: assist.altPhoneNumber,
          city: assist.city,
          area: assist.area,
          loanInput: assist.loanInput,
          minPrice: assist.minPrice,
          maxPrice: assist.maxPrice,
          totalArea: assist.totalArea,
          areaUnit: assist.areaUnit,
          bedrooms: assist.bedrooms,
          propertyMode: assist.propertyMode,
          propertyType: assist.propertyType,
          propertyAge: assist.propertyAge,
          bankLoan: assist.bankLoan,
          propertyApproved: assist.propertyApproved,
          facing: assist.facing,
          state: assist.state,
          ba_status: assist.ba_status,
          ba_postBy: assist.ba_postBy,
          createdAt: assist.createdAt ? new Date(assist.createdAt).toLocaleDateString() : 'N/A',
          updatedAt: assist.updatedAt ? new Date(assist.updatedAt).toLocaleDateString() : 'N/A'
        }));

        expiredBuyerPlanDetails.push({
          ba_id,
          phone: plan.phone,
          planName: plan.planName,
          expireDate: planDoc.expireDate,
          payustatususer: 'expiredPlan',
          assistanceRequests: formattedAssistances
        });
      }
    }

    return res.status(200).json({
      message: 'Expired buyer plans and their assistance requests fetched successfully.',
      data: expiredBuyerPlanDetails,
    });
  } catch (error) {
    console.error('Error fetching expired buyer plans:', error);
    res.status(500).json({
      message: 'Error fetching expired buyer plans and assistance requests.',
      error: error.message,
    });
  }
});



router.get('/ads-count-by-user', async (req, res) => {
  try {
    const properties = await AddModel.find({});
    
    const adsCountByUser = properties.reduce((acc, property) => {
      const phone = property.phoneNumber;
      if (!acc[phone]) {
        acc[phone] = 1;
      } else {
        acc[phone]++;
      }
      return acc;
    }, {});

    const adsCountArray = Object.entries(adsCountByUser).map(([phoneNumber, adsCount]) => ({
      phoneNumber,
      adsCount,
    }));

    res.status(200).json({
      message: 'Ad count per user fetched successfully!',
      data: adsCountArray,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch ad counts',
      error: error.message,
    });
  }
});



// Common function to fetch active users by postedBy type
const fetchActiveUsersByType = async (req, res, type) => {
  try {
    const users = await AddModel.find({
      status: 'active',
      postedBy: type
    });

    res.status(200).json({
      message: `${type} users fetched successfully!`,
      users
    });

  } catch (error) {
    res.status(500).json({
      message: `Error fetching ${type} users.`,
      error: error.message || 'Unknown server error'
    });
  }
};

// API for Owner
router.get('/fetch-active-owner', (req, res) => {
  fetchActiveUsersByType(req, res, 'Owner');
});

// API for Agent
router.get('/fetch-active-agent', (req, res) => {
  fetchActiveUsersByType(req, res, 'Agent');
});

// API for Developer
router.get('/fetch-active-developer', (req, res) => {
  fetchActiveUsersByType(req, res, 'Developer');
});

// API for Promotor
router.get('/fetch-active-promotor', (req, res) => {
  fetchActiveUsersByType(req, res, 'Promotor');
});




router.get('/fetch-free-plan-properties', async (req, res) => {
  try {
    // 1. Find all users who have Free Plan
    const freePlanUsers = await PricingPlans.find({ name: "Free" });

    if (!freePlanUsers.length) {
      return res.status(404).json({ message: 'No users found with Free Plan.' });
    }

    // 2. Extract phoneNumbers from Free Plan users
    const phoneNumbers = freePlanUsers.flatMap(user => user.phoneNumber); // Flattening in case of an array

    // 3. Find properties posted by these phoneNumbers
    const properties = await AddModel.find({ phoneNumber: { $in: phoneNumbers } });

    // Map properties to include the additional fields for display
    const enhancedProperties = properties.map((property) => {
      // Ensure we have the plan-related fields in each property
      const freePlanUser = freePlanUsers.find(user => user.phoneNumber === property.phoneNumber);

      // Add extra plan details like plan created date, duration, and expiry
      const planCreatedAt = freePlanUser ? freePlanUser.planCreatedAt : null;
      const durationDays = freePlanUser ? freePlanUser.durationDays : null;
      const planExpiryDate = planCreatedAt && durationDays
        ? new Date(planCreatedAt).setDate(new Date(planCreatedAt).getDate() + durationDays)
        : null;

      return {
        ...property.toObject(),
        planCreatedAt,
        durationDays,
        planExpiryDate: planExpiryDate ? new Date(planExpiryDate).toLocaleDateString() : 'N/A',
        packageType: freePlanUser ? freePlanUser.packageType : 'N/A', // Add packageType if exists
        plan: 'Free', // Static, as it�s a Free Plan user
      };
    });

    res.status(200).json({
      message: "Properties posted by Free Plan users fetched successfully!",
      freePlanUsers: freePlanUsers, // plan user details
      properties: enhancedProperties, // properties with additional plan info
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Free Plan user properties.', error: error.message });
  }
});



router.get('/fetch-plan-by-phone-number', async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    // 1. Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }

    // 2. Fetch user's plan using phone number
    const userPlan = await PricingPlans.findOne({ phoneNumber });

    if (!userPlan) {
      return res.status(404).json({ message: 'No plan found for the given phone number.' });
    }

    const { name: planName, createdAt, durationDays, packageType } = userPlan;

    // 3. Calculate plan expiry date
    const planCreatedDate = createdAt ? new Date(createdAt) : null;
    const planExpiryDate = planCreatedDate && durationDays
      ? new Date(planCreatedDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    // 4. Calculate days remaining
    let warningMessage = '';
    if (planExpiryDate) {
      const today = new Date();
      const diffInTime = planExpiryDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffInTime / (1000 * 3600 * 24));

      if (daysRemaining > 0 && daysRemaining <= 10) {
        warningMessage = `Your plan will expire in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.`;
      } else if (daysRemaining <= 0) {
        warningMessage = `Your plan has expired.`;
      }
    }

    // 5. Format dates as dd-mm-yyyy
    const formatDate = (date) => {
      if (!date || isNaN(date.getTime())) return 'N/A';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const formattedCreatedAt = formatDate(planCreatedDate);
    const formattedExpiryDate = formatDate(planExpiryDate);

    // 6. Fetch properties associated with this user
    const properties = await AddModel.find({ phoneNumber });

    const enhancedProperties = properties.map((property) => ({
      ...property.toObject(),
      planName,
      planCreatedAt: formattedCreatedAt,
      durationDays,
      planExpiryDate: formattedExpiryDate,
      packageType: packageType || 'N/A',
    }));

    // 7. Send successful response
    return res.status(200).json({
      message: 'Plan details and associated properties fetched successfully!',
      user: {
        phoneNumber,
        planName,
        planCreatedAt: formattedCreatedAt,
        durationDays,
        planExpiryDate: formattedExpiryDate,
        packageType: packageType || 'N/A',
        warningMessage, // ? Include warning
      },
      properties: enhancedProperties,
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Error fetching plan details.',
      error: error.message,
    });
  }
});




router.get('/get-property-count-by-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }

    // Count properties for the given phone number
    const propertyCount = await AddModel.countDocuments({ phoneNumber });

    return res.status(200).json({
      message: 'Property count fetched successfully.',
      phoneNumber,
      propertyCount,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error fetching property count.',
      error: error.message,
    });
  }
});




router.get('/fetch-all-plans-and-properties', async (req, res) => {
  try {
    const users = await PricingPlans.find();

    if (!users.length) {
      return res.status(404).json({ message: 'No users found.' });
    }

    const userPlansWithProperties = await Promise.all(users.map(async (user) => {
      const { name: planName, phoneNumber, createdAt, durationDays, packageType } = user;

      const planExpiryDate = createdAt && durationDays
        ? new Date(new Date(createdAt).getTime() + durationDays * 24 * 60 * 60 * 1000)
        : null;

      const formattedCreatedAt = createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A';
      const formattedExpiryDate = planExpiryDate ? new Date(planExpiryDate).toLocaleDateString() : 'N/A';

      // Fetch only active properties associated with this user's phone number(s)
      const properties = await AddModel.find({
        phoneNumber: { $in: phoneNumber },
        status: 'active'
      });
      
      const enhancedProperties = properties.map((property) => ({
        ...property.toObject(),
        planName,
        planCreatedAt: formattedCreatedAt,
        durationDays,
        planExpiryDate: formattedExpiryDate,
        packageType: packageType || 'N/A',
      }));

      return {
        user: {
          phoneNumber,
          planName,
          planCreatedAt: formattedCreatedAt,
          durationDays,
          planExpiryDate: formattedExpiryDate,
          packageType,
        },
        properties: enhancedProperties,
      };
    }));

    res.status(200).json({
      message: "Active properties and user plans fetched successfully!",
      data: userPlansWithProperties,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching all plans and properties.',
      error: error.message,
    });
  }
});




// Fetch properties where Payment Type is "Free"
router.get('/fetch-all-free-plans', async (req, res) => {
  try {
    // Step 1: Fetch all Free bills (where paymentType === 'Free')
    const freeBills = await Bill.find({ paymentType: 'Free' }).sort({ createdAt: -1 });

    if (!freeBills.length) {
      return res.status(200).json({
        message: 'No Free Plan properties found.',
        data: []
      });
    }

    // Step 2: For each bill, fetch associated properties using `ppId`
    const result = await Promise.all(freeBills.map(async (bill) => {
      const {
        billNo,
        planName,
        billAmount,
        netAmount,
        paymentType,
        validity,
        ownerPhone,
        adminOffice,
        adminName,
        billCreatedBy,
        createdAt,
        ppId
      } = bill;

      // Fetch properties associated with this bill's ppId
      const properties = await AddModel.find({ ppcId: ppId });

      const requiredFields = ['propertyMode', 'propertyType', 'price', 'totalArea', 'areaUnit', 'salesType', 'postedBy'];

      const enhancedProperties = properties
        .map((property) => {
          const hasRequiredFields = requiredFields.every(field =>
            property[field] !== undefined &&
            property[field] !== null &&
            String(property[field]).trim() !== ''
          );

          return {
            ...property.toObject(),
            required: hasRequiredFields ? 'Yes' : 'No',
            featureStatus: property.featureStatus || 'N/A',
          };
        })
        .filter(prop => prop.required === 'Yes');

      // Calculate plan expiry date
      const planExpiryDate = validity
        ? new Date(new Date(createdAt).getTime() + validity * 24 * 60 * 60 * 1000)
        : null;

      return {
        user: {
          phoneNumber: ownerPhone,
          planName,
          planCreatedAt: createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A',
          planExpiryDate: planExpiryDate ? new Date(planExpiryDate).toLocaleDateString() : 'N/A',
          adminName: adminName || 'N/A',
          billNo: billNo || 'N/A',
          billCreatedBy: billCreatedBy || 'N/A',
          billCreatedAt: createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A',
          adsCount: enhancedProperties.length,
        },
        properties: enhancedProperties
      };
    }));

    res.status(200).json({
      message: "Free plan's properties and full user details fetched successfully!",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching Free plans and properties.',
      error: error.message,
    });
  }
});



router.get('/fetch-all-featured-properties', async (req, res) => {
  try {
    const featuredProperties = await AddModel.find({ featureStatus: 'yes' });

    if (!featuredProperties.length) {
      return res.status(404).json({ message: 'No featured properties found.' });
    }

    const requiredFields = ['propertyMode', 'propertyType', 'price', 'totalArea', 'areaUnit', 'salesType', 'postedBy'];

    const result = await Promise.all(featuredProperties.map(async (property) => {
      const hasRequiredFields = requiredFields.every(field =>
        property[field] !== undefined &&
        property[field] !== null &&
        String(property[field]).trim() !== ''
      );

      if (!hasRequiredFields) return null; // Skip if not required

      // Try to find plan for this property's phoneNumber
      const plan = await PricingPlans.findOne({ phoneNumber: property.phoneNumber });

      const planName = plan?.name || 'N/A';
      const createdAt = plan?.createdAt || null;
      const durationDays = plan?.durationDays || null;
      const planExpiryDate = createdAt && durationDays
        ? new Date(new Date(createdAt).getTime() + durationDays * 24 * 60 * 60 * 1000)
        : null;

      return {
        user: {
          phoneNumber: property.phoneNumber,
          planName,
          planCreatedAt: createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A',
          planExpiryDate: planExpiryDate ? new Date(planExpiryDate).toLocaleDateString() : 'N/A',
          durationDays: durationDays || 'N/A',
          packageType: plan?.packageType || 'N/A',
          adminName:plan?.adminName || 'N/A',
          billNo: plan?.billNo || 'N/A',
          billCreatedBy: plan?.createdBy || 'N/A',
          billCreatedAt: createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A',
          adsCount: 1,
        },
        properties: [{
          ...property.toObject(),
          required: 'Yes',
          planName,
        }]
      };
    }));

    const filteredResult = result.filter(item => item !== null);

    res.status(200).json({
      message: "Featured properties with user and plan info fetched successfully!",
      data: filteredResult,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching featured properties.',
      error: error.message,
    });
  }
});



router.get('/fetch-all-ppc-properties', async (req, res) => {
  try {
    const featuredProperties = await AddModel.find({ featureStatus: 'yes' });

    if (!featuredProperties.length) {
      return res.status(404).json({ message: 'No featured properties found.' });
    }

    const requiredFields = ['propertyMode', 'propertyType', 'price', 'totalArea', 'areaUnit', 'salesType', 'postedBy'];

    const result = await Promise.all(featuredProperties.map(async (property) => {
      const hasRequiredFields = requiredFields.every(field =>
        property[field] !== undefined &&
        property[field] !== null &&
        String(property[field]).trim() !== ''
      );

      if (!hasRequiredFields) return null; // Skip if not required

      // Try to find plan for this property's phoneNumber
      const plan = await PricingPlans.findOne({ phoneNumber: property.phoneNumber });

      const planName = plan?.name || 'N/A';
      const createdAt = plan?.createdAt || null;
      const durationDays = plan?.durationDays || null;
      const planExpiryDate = createdAt && durationDays
        ? new Date(new Date(createdAt).getTime() + durationDays * 24 * 60 * 60 * 1000)
        : null;

      return {
        user: {
          phoneNumber: property.phoneNumber,
          planName,
          planCreatedAt: createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A',
          planExpiryDate: planExpiryDate ? new Date(planExpiryDate).toLocaleDateString() : 'N/A',
          durationDays: durationDays || 'N/A',
          packageType: plan?.packageType || 'N/A',
          adminName:plan?.adminName || 'N/A',
          billNo: plan?.billNo || 'N/A',
          billCreatedBy: plan?.createdBy || 'N/A',
          billCreatedAt: createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A',
          adsCount: 1,
        },
        properties: [{
          ...property.toObject(),
          required: 'Yes',
          planName,
        }]
      };
    }));

    const filteredResult = result.filter(item => item !== null);

    res.status(200).json({
      message: "Featured properties with user and plan info fetched successfully!",
      data: filteredResult,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching featured properties.',
      error: error.message,
    });
  }
});


// Get all bills excluding planName: "Free" and attach property data using ppId
router.get('/bills/non-free-with-properties', async (req, res) => {
  try {
    // Step 1: Fetch all Paid Plan bills (i.e., plans not equal to 'Free')
    const paidBills = await Bill.find({ planName: { $ne: 'Free' } }).sort({ createdAt: -1 });

    if (!paidBills.length) {
      return res.status(404).json({ message: 'No Paid Plan bills found.' });
    }

    // Step 2: For each bill, fetch associated properties using `ppId`
    const result = await Promise.all(
      paidBills.map(async (bill) => {
        const {
          billNo,
          planName,
          billAmount,
          netAmount,
          paymentType,
          validity,
          ownerPhone,
          adminOffice,
          adminName,
          billCreatedBy,
          createdAt,
          ppId
        } = bill;

        // Fetch associated properties using `ppId`
        const properties = await AddModel.find({ ppcId: ppId });

        // Add additional info to each property
        const enhancedProperties = properties.map((property) => {
          return {
            ...property.toObject(),
            required: ['propertyMode', 'propertyType', 'price', 'totalArea', 'areaUnit', 'salesType', 'postedBy'].every(field =>
              property[field] !== undefined &&
              property[field] !== null &&
              String(property[field]).trim() !== ''
            ) ? 'Yes' : 'No',
            featureStatus: property.featureStatus || 'N/A',
          };
        }).filter(prop => prop.required === 'Yes'); // ? Keep only valid properties

        const planExpiryDate = validity
          ? new Date(new Date(createdAt).getTime() + validity * 24 * 60 * 60 * 1000)
          : null;

        return {
          bill: {
            billNo,
            planName,
            billAmount,
            netAmount,
            paymentType,
            validity,
            ownerPhone,
            adminOffice,
            adminName,
            billCreatedBy,
            billCreatedAt: createdAt,
            planExpiryDate,
            adsCount: enhancedProperties.length,
            ppId
          },
          properties: enhancedProperties
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Fetched Paid Plan bills with associated properties successfully.",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error while fetching Paid Plan bills.',
      error: error.message
    });
  }
});


router.get('/fetch-all-paid-plans', async (req, res) => {
  try {
    // Fetch all Paid bills (where paymentType !== 'Free')
    const paidBills = await Bill.find({ paymentType: { $ne: 'Free' } }).sort({ createdAt: -1 });

    if (!paidBills.length) {
      return res.status(200).json({
        message: 'No Paid Plan properties found.',
        data: []
      });
    }

    // Step 2: For each bill, fetch associated properties using `ppId`
    const result = await Promise.all(paidBills.map(async (bill) => {
      const {
        billNo,
        planName,
        billAmount,
        netAmount,
        paymentType,
        validity,
        ownerPhone,
        adminOffice,
        adminName,
        billCreatedBy,
        createdAt,
        ppId
      } = bill;

      // Fetch properties associated with this bill's ppId
      const properties = await AddModel.find({ ppcId: ppId });

      const requiredFields = ['propertyMode', 'propertyType', 'price', 'totalArea', 'areaUnit', 'salesType', 'postedBy'];

      const enhancedProperties = properties
        .map((property) => {
          const hasRequiredFields = requiredFields.every(field =>
            property[field] !== undefined &&
            property[field] !== null &&
            String(property[field]).trim() !== ''
          );

          return {
            ...property.toObject(),
            required: hasRequiredFields ? 'Yes' : 'No',
            featureStatus: property.featureStatus || 'N/A',
          };
        })
        .filter(prop => prop.required === 'Yes');

      // Calculate plan expiry date
      const planExpiryDate = validity
        ? new Date(new Date(createdAt).getTime() + validity * 24 * 60 * 60 * 1000)
        : null;

      return {
        user: {
          phoneNumber: ownerPhone,
          planName,
          planCreatedAt: createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A',
          planExpiryDate: planExpiryDate ? new Date(planExpiryDate).toLocaleDateString() : 'N/A',
          adminName: adminName || 'N/A',
          billNo: billNo || 'N/A',
          billCreatedBy: billCreatedBy || 'N/A',
          billCreatedAt: createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A',
          adsCount: enhancedProperties.length,
        },
        properties: enhancedProperties
      };
    }));

    res.status(200).json({
      message: "Paid plan properties and user details fetched successfully!",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching Paid plans and properties.',
      error: error.message,
    });
  }
});




// PUT /delete-free-property/:ppcId
router.put('/delete-free-property/:ppcId', async (req, res) => {
  try {
    const { ppcId } = req.params;
    const property = await AddModel.findOneAndUpdate(
      { ppcId },
      { isDeleted: true },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ message: 'Property not found with the given PPC ID' });
    }

    res.status(200).json({ message: 'Property marked as deleted successfully', property });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// DELETE /hard-delete-free-property/:ppcId  (permanent delete, used by Customer Care page)
router.delete('/hard-delete-free-property/:ppcId', async (req, res) => {
  try {
    const { ppcId } = req.params;
    const property = await AddModel.findOneAndDelete({ ppcId });

    if (!property) {
      return res.status(404).json({ message: 'Property not found with the given PPC ID' });
    }

    res.status(200).json({ message: 'Property permanently deleted successfully', property });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// PUT /undo-delete-free-property/:ppcId
router.put('/undo-delete-free-property/:ppcId', async (req, res) => {
  try {
    const { ppcId } = req.params;
    const property = await AddModel.findOneAndUpdate(
      { ppcId },
      { isDeleted: false },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ message: 'Property not found with the given PPC ID' });
    }

    res.status(200).json({ message: 'Property restored successfully', property });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// DELETE /delete-free-assistant/:ba_id
router.put('/delete-free-assistant/:ba_id', async (req, res) => {
  try {
    const { ba_id } = req.params;
    const result = await BuyerAssistance.findOneAndUpdate(
      { ba_id },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Buyer Assistance not found with the given BA ID' });
    }

    res.status(200).json({ message: 'Buyer Assistance marked as deleted successfully', result });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// PUT /undo-delete-free-assistant/:ba_id
router.put('/undo-delete-free-assistant/:ba_id', async (req, res) => {
  try {
    const { ba_id } = req.params;
    const result = await BuyerAssistance.findOneAndUpdate(
      { ba_id },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Buyer Assistance not found with the given BA ID' });
    }

    res.status(200).json({ message: 'Buyer Assistance restored successfully', result });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// PUT /delete-free-property/:ppcId/:phoneNumber
router.put('/delete-free-property/:ppcId/:phoneNumber', async (req, res) => {
  try {
    const { ppcId, phoneNumber } = req.params;

    const property = await AddModel.findOneAndUpdate(
      { ppcId, phoneNumber },
      { isDeleted: true },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ message: 'Property not found with the given PPC ID and phone number' });
    }

    res.status(200).json({ message: 'Property marked as deleted successfully', property });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// PUT /undo-delete-free-property/:ppcId/:phoneNumber
router.put('/undo-delete-free-property/:ppcId/:phoneNumber', async (req, res) => {
  try {
    const { ppcId, phoneNumber } = req.params;

    const property = await AddModel.findOneAndUpdate(
      { ppcId, phoneNumber },
      { isDeleted: false },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ message: 'Property not found with the given PPC ID and phone number' });
    }

    res.status(200).json({ message: 'Property restored successfully', property });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});




router.get('/fetch-all-datas', async (req, res) => {
    try {

        // Fetch all users from the database
        const users = await AddModel.find({});

        // Return the fetched user data
        res.status(200).json({ message: 'All user data fetched successfully!', users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all user details.', error });
    }
});






// API to fetch distinct states from AddModel
router.get("/fetch-states", async (req, res) => {
  try {
    const states = await AddModel.distinct("state"); // Fetch unique state values
    res.json({ success: true, states });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
});



// Fetch all properties
router.get("/fetch-all-properties", async (req, res) => {
  try {
    const properties = await AddModel.find();

    if (properties.length === 0) {
      return res.status(404).json({ success: false, message: "No properties found" });
    }

    res.json({ success: true, data: properties });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
});


router.get("/fetch-Pudhucherry-properties-on-demand", async (req, res) => {
  try {
    // Match state variants (case-insensitive) and filter by status = active
    const pondicherryData = await AddModel.find({
      status: "active",
      state: {
        $regex: /^(puducherry|pudhucherry|pondicherry|pondicherry town|pudhucherry town|pondi)$/i
      }
    }).lean(); // lean() for raw JSON performance

    if (pondicherryData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active data found for Puducherry",
      });
    }

    // Replace price with "On Demand" where applicable
    const processedData = pondicherryData.map((property) => ({
      ...property,
      price: property.onDemand ? "On Demand" : property.price,
    }));

    res.status(200).json({
      success: true,
      message: "Active Puducherry properties with on-demand pricing fetched successfully!",
      data: processedData,
    });
  } catch (error) {
    console.error("Error fetching Puducherry properties:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
});



router.get("/fetch-chennai-properties-on-demand", async (req, res) => {
  try {
    const regex = /^chennai$/i; // Case-insensitive match for "chennai"

    const chennaiProperties = await AddModel.find({
      status: "active",
      $or: [
        { city: { $regex: regex } },
        { district: { $regex: regex } },
        { area: { $regex: regex } },
        { nagar: { $regex: regex } }
      ]
    }).lean();

    if (chennaiProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active data found for Chennai",
      });
    }

    const processedData = chennaiProperties.map((property) => ({
      ...property,
      price: property.onDemand ? "On Demand" : property.price,
    }));

    res.status(200).json({
      success: true,
      message: "Active Chennai properties with on-demand pricing fetched successfully!",
      data: processedData,
    });

  } catch (error) {
    console.error("Error fetching Chennai properties:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
});



// router.get("/fetch-Pudhucherry-properties-on-demand", async (req, res) => {
//   try {
//     const pondicherryData = await AddModel.find({
//       state: {
//         $regex: /^(puducherry|pudhucherry|pondicherry|pondicherry town|pudhucherry town|pondi)$/i
//       },
//       isDeleted: { $ne: true }
//     });

//     if (pondicherryData.length === 0) {
//       return res.status(404).json({ success: false, message: "No data found for Puducherry" });
//     }

//     const updatedResults = await Promise.all(
//       pondicherryData.map(async (property) => {
//         const phone = property.phoneNumber;

//         const [otpUser, directUser] = await Promise.all([
//           UserLogin.findOne({ phone, otpStatus: "verified" }),
//           UserLogin.findOne({ phone, directVerified: true })
//         ]);

//         const isVerified = !!otpUser || !!directUser;
//         const otpStatus = otpUser ? "verified" : "not verified";
//         const createdBy = isVerified ? "User" : "Admin";
//         const price = createdBy === "Admin" ? "On Demand" : property.price;

//         return {
//           ...property.toObject(),
//           otpStatus,
//           isVerified,
//           createdBy,
//           price
//         };
//       })
//     );

//     return res.json({ success: true, data: updatedResults });

//   } catch (error) {
//     console.error("Error fetching Puducherry properties:", error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// });



// Fetch properties from all Puducherry variants (case-insensitive)
router.get("/fetch-Pudhucherry-properties", async (req, res) => {
  try {
    const pondicherryData = await AddModel.find({
      state: {
        $regex: /^(puducherry|pudhucherry|pondicherry|pondicherry town|pudhucherry town|pondi)$/i
      }
    });

    if (pondicherryData.length === 0) {
      return res.status(404).json({ success: false, message: "No data found for Puducherry" });
    }

    res.json({ success: true, data: pondicherryData });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
});


router.get('/fetch-active-users', async (req, res) => {
  try {
    const properties = await AddModel.find({ status: 'active' });
    const plans = await PricingPlans.find();
    const bills = await Bill.find();
    const followups = await FollowUp.find();
    const payments = await PaymentPayU.find();

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const processedProperties = properties.map((property) => {
      // Check if all required fields are filled
      const isComplete = requiredFields.every(
        (field) =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
      );

      // Find matching plan
      const matchedPlan = plans.find(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(property.phoneNumber)
          : plan.phoneNumber === property.phoneNumber
      );

      // Calculate plan created and expiry date
      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';

      if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
        const planStart = new Date(matchedPlan.createdAt);
        const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 24 * 60 * 60 * 1000);
        planCreatedAt = planStart.toLocaleDateString();
        planExpiryDate = planExpiry.toLocaleDateString();
      }

      // Find matching bill
      const matchedBill = bills.find(bill =>
        bill.ownerPhone === property.phoneNumber || String(bill.ppId) === String(property.ppcId)
      );

      // Extract bill info and calculate bill expiry
      let adminName = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminName = matchedBill.adminName || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate);
          const billExpiry = new Date(billStart.getTime() + (validity - 1) * 24 * 60 * 60 * 1000);
          billExpiryDate = billExpiry.toLocaleDateString();
        }
      }

      // Find latest follow-up admin for this property
      const propertyFollowUps = followups
        .filter(fu => String(fu.ppcId) === String(property.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const followUpAdminName = propertyFollowUps.length > 0
        ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
        : 'N/A';

      // Find matching payment
      const matchedPayment = payments.find(payment =>
        payment.phone === property.phoneNumber && String(payment.ppcId) === String(property.ppcId)
      );

      return {
        ...property._doc,
        required: isComplete ? 'yes' : 'no',
        planName: matchedPlan?.name || 'N/A',
        planCreatedAt,
        planExpiryDate,
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        adminName,
        billDate,
        validity,
        billExpiryDate,
        followUpAdminName,
        setPpcId: property.setPpcId || false,
        assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
        setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
        paymentData: matchedPayment || null
      };
    });

    // Filter only properties with all required fields
    const filteredProperties = processedProperties.filter(p => p.required === 'yes');

    res.status(200).json({
      message: 'Active properties with complete info fetched successfully!',
      users: filteredProperties
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching active user details.',
      error: error.message
    });
  }
});



router.get('/fetch-active-users-on-demand', async (req, res) => {
  try {
    const properties = await AddModel.find({ status: 'active' }).lean();
    const plans = await PricingPlans.find();
    const bills = await Bill.find();
    const followups = await FollowUp.find();
    const payments = await PaymentPayU.find();

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const processedProperties = properties.map((property) => {
      // ? Replace price with "On Demand" if onDemand is true
      if (property.onDemand) {
        property.price = "On Demand";
      }

      // Check if all required fields are filled
      const isComplete = requiredFields.every(
        (field) =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
      );

      // Find matching plan
      const matchedPlan = plans.find(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(property.phoneNumber)
          : plan.phoneNumber === property.phoneNumber
      );

      // Plan dates
      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';

      if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
        const planStart = new Date(matchedPlan.createdAt);
        const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 86400000); // days to ms
        planCreatedAt = planStart.toLocaleDateString();
        planExpiryDate = planExpiry.toLocaleDateString();
      }

      // Matching bill
      const matchedBill = bills.find(bill =>
        bill.ownerPhone === property.phoneNumber || String(bill.ppId) === String(property.ppcId)
      );

      let adminName = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminName = matchedBill.adminName || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate);
          const billExpiry = new Date(billStart.getTime() + (validity - 1) * 86400000);
          billExpiryDate = billExpiry.toLocaleDateString();
        }
      }

      // Latest follow-up
      const propertyFollowUps = followups
        .filter(fu => String(fu.ppcId) === String(property.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const followUpAdminName = propertyFollowUps.length > 0
        ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
        : 'N/A';

      // Payment info
      const matchedPayment = payments.find(payment =>
        payment.phone === property.phoneNumber &&
        String(payment.ppcId) === String(property.ppcId)
      );

      return {
        ...property,
        required: isComplete ? 'yes' : 'no',
        planName: matchedPlan?.name || 'N/A',
        planCreatedAt,
        planExpiryDate,
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        adminName,
        billDate,
        validity,
        billExpiryDate,
        followUpAdminName,
        setPpcId: property.setPpcId || false,
        assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
        setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
        paymentData: matchedPayment || null
      };
    });

    // Return only fully completed properties
    const filteredProperties = processedProperties.filter(p => p.required === 'yes');

    res.status(200).json({
      message: 'Active properties with complete info fetched successfully!',
      users: filteredProperties
    });
  } catch (error) {
    console.error("Error in /fetch-active-users:", error);
    res.status(500).json({
      message: 'Error fetching active user details.',
      error: error.message
    });
  }
});




// router.get('/fetch-active-users-on-demand', async (req, res) => {
//    try {
//     const properties = await AddModel.find({ status: 'active' });
//     const plans = await PricingPlans.find();
//     const bills = await Bill.find();
//     const followups = await FollowUp.find();
//     const payments = await PaymentPayU.find();
//     const otpVerifiedUsers = await UserLogin.find({ otpStatus: 'verified' });
//     const directVerifiedUsers = await UserLogin.find({ directVerified: true });

//     // Map phone => otp status
//     const userStatusMap = new Map();
//     otpVerifiedUsers.forEach(user => userStatusMap.set(user.phone, 'verified'));
//     directVerifiedUsers.forEach(user => {
//       if (!userStatusMap.has(user.phone)) {
//         userStatusMap.set(user.phone, 'direct');
//       }
//     });

//     const verifiedPhones = new Set(userStatusMap.keys());

//     const requiredFields = [
//       'propertyMode', 'propertyType', 'price',
//       'totalArea', 'areaUnit', 'salesType', 'postedBy'
//     ];

//     const processedProperties = properties.map((property) => {
//       const phone = property.phoneNumber;
//       const otpStatus = userStatusMap.get(phone) || 'not verified';
//       const isVerifiedUser = verifiedPhones.has(phone);
//       const createdBy = (otpStatus === 'not verified' && !isVerifiedUser) ? 'Admin' : 'User';

//       // Override price if created by Admin
//       const displayPrice = createdBy === 'Admin' ? 'On Demand' : property.price;

//       const isComplete = requiredFields.every(
//         (field) =>
//           property[field] !== undefined &&
//           property[field] !== null &&
//           String(property[field]).trim() !== ''
//       );

//       const matchedPlan = plans.find(plan =>
//         Array.isArray(plan.phoneNumber)
//           ? plan.phoneNumber.includes(property.phoneNumber)
//           : plan.phoneNumber === property.phoneNumber
//       );

//       let planCreatedAt = 'N/A';
//       let planExpiryDate = 'N/A';

//       if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
//         const planStart = new Date(matchedPlan.createdAt);
//         const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 24 * 60 * 60 * 1000);
//         planCreatedAt = planStart.toLocaleDateString();
//         planExpiryDate = planExpiry.toLocaleDateString();
//       }

//       const matchedBill = bills.find(bill =>
//         bill.ownerPhone === property.phoneNumber || String(bill.ppId) === String(property.ppcId)
//       );

//       let adminName = 'N/A';
//       let billDate = 'N/A';
//       let validity = 'N/A';
//       let billExpiryDate = 'N/A';

//       if (matchedBill) {
//         adminName = matchedBill.adminName || 'N/A';
//         billDate = matchedBill.billDate || 'N/A';
//         validity = matchedBill.validity || 'N/A';

//         if (billDate !== 'N/A' && validity !== 'N/A') {
//           const billStart = new Date(billDate);
//           const billExpiry = new Date(billStart.getTime() + (validity - 1) * 24 * 60 * 60 * 1000);
//           billExpiryDate = billExpiry.toLocaleDateString();
//         }
//       }

//       const propertyFollowUps = followups
//         .filter(fu => String(fu.ppcId) === String(property.ppcId))
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//       const followUpAdminName = propertyFollowUps.length > 0
//         ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
//         : 'N/A';

//       const matchedPayment = payments.find(payment =>
//         payment.phone === property.phoneNumber && String(payment.ppcId) === String(property.ppcId)
//       );

//       return {
//         ...property._doc,
//         price: displayPrice, // ? override price if createdBy is Admin
//         required: isComplete ? 'yes' : 'no',
//         planName: matchedPlan?.name || 'N/A',
//         planCreatedAt,
//         planExpiryDate,
//         packageType: matchedPlan?.packageType || 'N/A',
//         planDuration: matchedPlan?.durationDays || 'N/A',
//         adminName,
//         billDate,
//         validity,
//         billExpiryDate,
//         followUpAdminName,
//         setPpcId: property.setPpcId || false,
//         assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
//         setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
//         paymentData: matchedPayment || null,
//         createdBy,
//         otpStatus,
//         isVerifiedUser
//       };
//     });

//     const filteredProperties = processedProperties.filter(p => p.required === 'yes');

//     res.status(200).json({
//       message: 'Active properties with complete info fetched successfully!',
//       users: filteredProperties
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error fetching active user details.',
//       error: error.message
//     });
//   }
// });


// router.get('/fetch-active-users-datas', async (req, res) => {
//   try {
//     // Fetch all collections
//     const properties = await AddModel.find({ status: 'active' });
//     const plans = await PricingPlans.find();
//     const bills = await Bill.find();
//     const followups = await FollowUp.find();
//     const payments = await PaymentPayU.find();

//     // ?? Step 1: Get verified phone numbers
//     const otpVerifiedUsers = await UserLogin.find({ otpStatus: 'verified' });
//     const directVerifiedUsers = await UserLogin.find({ directVerified: true });

//     const verifiedPhones = new Set([
//       ...otpVerifiedUsers.map(u => u.phone),
//       ...directVerifiedUsers.map(u => u.phone)
//     ]);

//     const requiredFields = [
//       'propertyMode', 'propertyType', 'price',
//       'totalArea', 'areaUnit', 'salesType', 'postedBy'
//     ];

//     const processedProperties = properties.map((property) => {
//       const isComplete = requiredFields.every(
//         (field) =>
//           property[field] !== undefined &&
//           property[field] !== null &&
//           String(property[field]).trim() !== ''
//       );

//       const matchedPlan = plans.find(plan =>
//         Array.isArray(plan.phoneNumber)
//           ? plan.phoneNumber.includes(property.phoneNumber)
//           : plan.phoneNumber === property.phoneNumber
//       );

//       let planCreatedAt = 'N/A';
//       let planExpiryDate = 'N/A';
//       if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
//         const planStart = new Date(matchedPlan.createdAt);
//         const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 24 * 60 * 60 * 1000);
//         planCreatedAt = planStart.toLocaleDateString();
//         planExpiryDate = planExpiry.toLocaleDateString();
//       }

//       const matchedBill = bills.find(bill =>
//         bill.ownerPhone === property.phoneNumber || String(bill.ppId) === String(property.ppcId)
//       );

//       let adminName = 'N/A';
//       let billDate = 'N/A';
//       let validity = 'N/A';
//       let billExpiryDate = 'N/A';

//       if (matchedBill) {
//         adminName = matchedBill.adminName || 'N/A';
//         billDate = matchedBill.billDate || 'N/A';
//         validity = matchedBill.validity || 'N/A';

//         if (billDate !== 'N/A' && validity !== 'N/A') {
//           const billStart = new Date(billDate);
//           const billExpiry = new Date(billStart.getTime() + (validity - 1) * 24 * 60 * 60 * 1000);
//           billExpiryDate = billExpiry.toLocaleDateString();
//         }
//       }

//       const propertyFollowUps = followups
//         .filter(fu => String(fu.ppcId) === String(property.ppcId))
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//       const followUpAdminName = propertyFollowUps.length > 0
//         ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
//         : 'N/A';

//       const matchedPayment = payments.find(payment =>
//         payment.phone === property.phoneNumber && String(payment.ppcId) === String(property.ppcId)
//       );

//       // ?? Check verification status
//       const isVerifiedUser = verifiedPhones.has(property.phoneNumber);

//       return {
//         ...property._doc,
//         required: isComplete ? 'yes' : 'no',
//         isVerifiedUser,
//         planName: matchedPlan?.name || 'N/A',
//         planCreatedAt,
//         planExpiryDate,
//         packageType: matchedPlan?.packageType || 'N/A',
//         planDuration: matchedPlan?.durationDays || 'N/A',
//         adminName,
//         billDate,
//         validity,
//         billExpiryDate,
//         followUpAdminName,
//         setPpcId: property.setPpcId || false,
//         assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
//         setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
//         paymentData: matchedPayment || null
//       };
//     });

//     const filteredProperties = processedProperties.filter(p => p.required === 'yes');

//     res.status(200).json({
//       message: 'Active properties with complete info fetched successfully!',
//       users: filteredProperties
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error fetching active user details.',
//       error: error.message
//     });
//   }
// });



router.get('/fetch-active-users-datas', async (req, res) => {
  try {
    // Fetch all collections
    const properties = await AddModel.find({ status: 'active' });
    const plans = await PricingPlans.find();
    const bills = await Bill.find();
    const followups = await FollowUp.find();
    const payments = await PaymentPayU.find();

    // ?? Step 1: Get verified phone numbers
    const otpVerifiedUsers = await UserLogin.find({ otpStatus: 'verified' });
    const directVerifiedUsers = await UserLogin.find({ directVerified: true });

    // ?? Create a map of phone => otpStatus
    const userStatusMap = new Map();

    otpVerifiedUsers.forEach(user => {
      userStatusMap.set(user.phone, 'verified');
    });

    directVerifiedUsers.forEach(user => {
      if (!userStatusMap.has(user.phone)) {
        userStatusMap.set(user.phone, 'direct');
      }
    });

    const verifiedPhones = new Set(userStatusMap.keys());

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const processedProperties = properties.map((property) => {
      const isComplete = requiredFields.every(
        (field) =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
      );

      const matchedPlan = plans.find(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(property.phoneNumber)
          : plan.phoneNumber === property.phoneNumber
      );

      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';
      if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
        const planStart = new Date(matchedPlan.createdAt);
        const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 24 * 60 * 60 * 1000);
        planCreatedAt = planStart.toLocaleDateString();
        planExpiryDate = planExpiry.toLocaleDateString();
      }

      const matchedBill = bills.find(bill =>
        bill.ownerPhone === property.phoneNumber || String(bill.ppId) === String(property.ppcId)
      );

      let adminName = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminName = matchedBill.adminName || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate);
          const billExpiry = new Date(billStart.getTime() + (validity - 1) * 24 * 60 * 60 * 1000);
          billExpiryDate = billExpiry.toLocaleDateString();
        }
      }

      const propertyFollowUps = followups
        .filter(fu => String(fu.ppcId) === String(property.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const followUpAdminName = propertyFollowUps.length > 0
        ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
        : 'N/A';

      const matchedPayment = payments.find(payment =>
        payment.phone === property.phoneNumber && String(payment.ppcId) === String(property.ppcId)
      );

      const phone = property.phoneNumber;
      const otpStatus = userStatusMap.get(phone) || 'not verified';
      const isVerifiedUser = verifiedPhones.has(phone);

      return {
        ...property._doc,
        required: isComplete ? 'yes' : 'no',
        isVerifiedUser,
        otpStatus,
        planName: matchedPlan?.name || 'N/A',
        planCreatedAt,
        planExpiryDate,
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        adminName,
        billDate,
        validity,
        billExpiryDate,
        followUpAdminName,
        setPpcId: property.setPpcId || false,
        assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
        setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
        paymentData: matchedPayment || null
      };
    });

    const filteredProperties = processedProperties.filter(p => p.required === 'yes');

    res.status(200).json({
      message: 'Active properties with complete info fetched successfully!',
      users: filteredProperties
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching active user details.',
      error: error.message
    });
  }
});



router.get('/fetch-active-users-datas-all', async (req, res) => {
  try {
    // Fetch all necessary collections
    const properties = await AddModel.find({ status: 'active' });
    const plans = await PricingPlans.find();
    const bills = await Bill.find();
    const followups = await FollowUp.find();
    const payments = await PaymentPayU.find();

    // ?? Get verified users by OTP or direct verification
    const otpVerifiedUsers = await UserLogin.find({ otpStatus: 'verified' });
    const directVerifiedUsers = await UserLogin.find({ directVerified: true });

    // ?? Create phone => status mapping
    const userStatusMap = new Map();

    otpVerifiedUsers.forEach(user => {
      userStatusMap.set(user.phone, 'verified');
    });

    directVerifiedUsers.forEach(user => {
      if (!userStatusMap.has(user.phone)) {
        userStatusMap.set(user.phone, 'direct');
      }
    });

    const verifiedPhones = new Set(userStatusMap.keys());

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const processedProperties = properties.map((property) => {
      const isComplete = requiredFields.every(
        (field) =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
      );

      const matchedPlan = plans.find(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(property.phoneNumber)
          : plan.phoneNumber === property.phoneNumber
      );

      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';
      if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
        const planStart = new Date(matchedPlan.createdAt);
        const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 24 * 60 * 60 * 1000);
        planCreatedAt = planStart.toLocaleDateString();
        planExpiryDate = planExpiry.toLocaleDateString();
      }

      const matchedBill = bills.find(bill =>
        bill.ownerPhone === property.phoneNumber || String(bill.ppId) === String(property.ppcId)
      );

      let adminName = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminName = matchedBill.adminName || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate);
          const billExpiry = new Date(billStart.getTime() + (validity - 1) * 24 * 60 * 60 * 1000);
          billExpiryDate = billExpiry.toLocaleDateString();
        }
      }

      const propertyFollowUps = followups
        .filter(fu => String(fu.ppcId) === String(property.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const followUpAdminName = propertyFollowUps.length > 0
        ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
        : 'N/A';

      const matchedPayment = payments.find(payment =>
        payment.phone === property.phoneNumber && String(payment.ppcId) === String(property.ppcId)
      );

      const phone = property.phoneNumber;
      const otpStatus = userStatusMap.get(phone) || 'not verified';
      const isVerifiedUser = verifiedPhones.has(phone);
      const createdBy = !isVerifiedUser && otpStatus === 'not verified' ? 'Admin' : 'User';

      return {
        ...property._doc,
        required: isComplete ? 'yes' : 'no',
        isVerifiedUser,
        otpStatus,
        createdBy,
        planName: matchedPlan?.name || 'N/A',
        planCreatedAt,
        planExpiryDate,
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        adminName,
        billDate,
        validity,
        billExpiryDate,
        followUpAdminName,
        setPpcId: property.setPpcId || false,
        assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
        setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
        paymentData: matchedPayment || null
      };
    });

    // Return all active properties (including those from bulk upload that may be incomplete).
    // The 'required' flag is preserved for UI filtering if needed, but we don't filter here
    // to ensure bulk-uploaded properties are visible even if they have missing fields initially.
    
    res.status(200).json({
      message: 'Active properties with complete info fetched successfully!',
      users: processedProperties
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching active user details.',
      error: error.message
    });
  }
});



const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
};

router.get('/fetch-active-users-all', async (req, res) => {
  try {
    const properties = await AddModel.find({ status: 'active' });
    const plans = await PricingPlans.find();
    const payuData = await PaymentPayU.find({ status: 'success' });
    const bills = await Bill.find();
    const followups = await FollowUp.find();

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const processedProperties = [];

    for (const property of properties) {
      const isComplete = requiredFields.every(
        (field) =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
      );

      const phoneNumber = property.phoneNumber || '';
      const escapedPhone = escapeRegExp(phoneNumber);

      // Match plans (including arrays)
      const matchedPlans = plans.filter(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(phoneNumber)
          : plan.phoneNumber === phoneNumber
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const matchedPlan = matchedPlans.find(plan => {
        if (plan.name.toLowerCase() === 'free') return true;
        return payuData.some(
          pay =>
            pay.phone && new RegExp(escapedPhone + '$').test(pay.phone) &&
            pay.planName === plan.name &&
            pay.status === 'success'
        );
      });

      const matchedPayU = payuData.find(
        pay => new RegExp(escapedPhone + '$').test(pay.phone)
      );

      const matchedBill = bills.find(
        bill => bill.ownerPhone === phoneNumber || bill.ppId === property.ppcId
      );

      let adminName = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminName = matchedBill.adminName || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate);
          const billExpiry = new Date(billStart.getTime() + (validity - 1) * 86400000);
          billExpiryDate = billExpiry.toLocaleDateString();
        }
      }

      const propertyFollowUps = followups
        .filter(fu => String(fu.ppcId) === String(property.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const followUpAdminName = propertyFollowUps.length > 0
        ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
        : 'N/A';

      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';
      let planDetails = null;

      if (matchedPlan) {
        if (matchedPlan.createdAt && matchedPlan.durationDays) {
          const planStart = new Date(matchedPlan.createdAt);
          const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 86400000);
          planCreatedAt = planStart.toLocaleDateString();
          planExpiryDate = planExpiry.toLocaleDateString();
        }

        // Count used properties and collect PPC IDs
        const usedProps = await AddModel.find({
          phoneNumber: new RegExp(escapedPhone + '$'),
          isDeleted: false
        });

        const usedCars = usedProps.length;
        const ppcIds = usedProps.map(p => p.ppcId);

        planDetails = {
          name: matchedPlan.name || 'N/A',
          packageType: matchedPlan.packageType || 'N/A',
          price: matchedPlan.price || 0,
          durationDays: matchedPlan.durationDays || 0,
          description: matchedPlan.description || '',
          unlimitedAds: matchedPlan.unlimitedAds || false,
          numOfCars: matchedPlan.numOfCars || 0,
          featuredMaxCar: matchedPlan.featuredMaxCar || 0,
          expireDate: matchedPlan.expireDate || null,
          createdDate: matchedPlan.createdDate || null,
          usedCars: usedCars,
          ppcIds,
          remainingCars: Math.max((matchedPlan.numOfCars || 0) - usedCars, 0)
        };
      }

      processedProperties.push({
        ...property._doc,
        required: isComplete ? 'yes' : 'no',
        planName: matchedPlan?.name || 'N/A',
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        planCreatedAt,
        planExpiryDate,
        adminName,
        billDate,
        validity,
        billExpiryDate,
        followUpAdminName,
        setPpcId: property.setPpcId || false,
        assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
        setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
        payUStatus: matchedPayU?.status || 'N/A',
  payustatususer: matchedPayU?.payustatususer || 'N/A',  // ? this line ensures 'paid' is shown
        paymentId: matchedPayU?.mihpayid || 'N/A',
        transactionId: matchedPayU?.txnid || 'N/A',
        payUCreatedAt: matchedPayU?.createdAt || null,
        payUUpdatedAt: matchedPayU?.updatedAt || null,
        planDetails
      });
    }

    // Return all active properties (including those from bulk upload that may be incomplete).
    // The 'required' flag is preserved for UI filtering if needed.

    res.status(200).json({
      success: true,
      total: processedProperties.length,
      data: processedProperties
    });

  } catch (error) {
    console.error("Error fetching active user details:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active user details.',
      error: error.message
    });
  }
});


router.get('/fetch-complete-users-all', async (req, res) => {
  try {
    const properties = await AddModel.find({ status: 'complete' });
    const plans = await PricingPlans.find();
    const payuData = await PaymentPayU.find({ status: 'success' });
    const bills = await Bill.find();
    const followups = await FollowUp.find();

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const processedProperties = [];

    for (const property of properties) {
      const isComplete = requiredFields.every(
        (field) =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
      );

      const phoneNumber = property.phoneNumber || '';
      const escapedPhone = escapeRegExp(phoneNumber);

      // Match plans (including arrays)
      const matchedPlans = plans.filter(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(phoneNumber)
          : plan.phoneNumber === phoneNumber
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const matchedPlan = matchedPlans.find(plan => {
        if (plan.name.toLowerCase() === 'free') return true;
        return payuData.some(
          pay =>
            pay.phone && new RegExp(escapedPhone + '$').test(pay.phone) &&
            pay.planName === plan.name &&
            pay.status === 'success'
        );
      });

      const matchedPayU = payuData.find(
        pay => new RegExp(escapedPhone + '$').test(pay.phone)
      );

      const matchedBill = bills.find(
        bill => bill.ownerPhone === phoneNumber || bill.ppId === property.ppcId
      );

      let adminName = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminName = matchedBill.adminName || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate);
          const billExpiry = new Date(billStart.getTime() + (validity - 1) * 86400000);
          billExpiryDate = billExpiry.toLocaleDateString();
        }
      }

      const propertyFollowUps = followups
        .filter(fu => String(fu.ppcId) === String(property.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const followUpAdminName = propertyFollowUps.length > 0
        ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
        : 'N/A';

      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';
      let planDetails = null;

      if (matchedPlan) {
        if (matchedPlan.createdAt && matchedPlan.durationDays) {
          const planStart = new Date(matchedPlan.createdAt);
          const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 86400000);
          planCreatedAt = planStart.toLocaleDateString();
          planExpiryDate = planExpiry.toLocaleDateString();
        }

        // Count used properties and collect PPC IDs
        const usedProps = await AddModel.find({
          phoneNumber: new RegExp(escapedPhone + '$'),
          isDeleted: false
        });

        const usedCars = usedProps.length;
        const ppcIds = usedProps.map(p => p.ppcId);

        planDetails = {
          name: matchedPlan.name || 'N/A',
          packageType: matchedPlan.packageType || 'N/A',
          price: matchedPlan.price || 0,
          durationDays: matchedPlan.durationDays || 0,
          description: matchedPlan.description || '',
          unlimitedAds: matchedPlan.unlimitedAds || false,
          numOfCars: matchedPlan.numOfCars || 0,
          featuredMaxCar: matchedPlan.featuredMaxCar || 0,
          expireDate: matchedPlan.expireDate || null,
          createdDate: matchedPlan.createdDate || null,
          usedCars: usedCars,
          ppcIds,
          remainingCars: Math.max((matchedPlan.numOfCars || 0) - usedCars, 0)
        };
      }

      processedProperties.push({
        ...property._doc,
        required: isComplete ? 'yes' : 'no',
        planName: matchedPlan?.name || 'N/A',
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        planCreatedAt,
        planExpiryDate,
        adminName,
        billDate,
        validity,
        billExpiryDate,
        followUpAdminName,
        setPpcId: property.setPpcId || false,
        assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
        setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
        payUStatus: matchedPayU?.status || 'N/A',
  payustatususer: matchedPayU?.payustatususer || 'N/A',  // ? this line ensures 'paid' is shown
        paymentId: matchedPayU?.mihpayid || 'N/A',
        transactionId: matchedPayU?.txnid || 'N/A',
        payUCreatedAt: matchedPayU?.createdAt || null,
        payUUpdatedAt: matchedPayU?.updatedAt || null,
        planDetails
      });
    }

    const filteredProperties = processedProperties.filter(p => p.required === 'yes');

    res.status(200).json({
      success: true,
      total: filteredProperties.length,
      data: filteredProperties
    });

  } catch (error) {
    console.error("Error fetching active user details:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active user details.',
      error: error.message
    });
  }
});






router.get('/fetch-incomplete-users-all', async (req, res) => {
  try {
    const properties = await AddModel.find({ status: 'incomplete' });
    const plans = await PricingPlans.find();
    const payuData = await PaymentPayU.find({ status: 'success' });
    const bills = await Bill.find();
    const followups = await FollowUp.find();

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const processedProperties = [];

    for (const property of properties) {
      const isComplete = requiredFields.every(
        (field) =>
          property[field] !== undefined &&
          property[field] !== null &&
          String(property[field]).trim() !== ''
      );

      const phoneNumber = property.phoneNumber || '';
      const escapedPhone = escapeRegExp(phoneNumber);

      // Match plans (including arrays)
      const matchedPlans = plans.filter(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(phoneNumber)
          : plan.phoneNumber === phoneNumber
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const matchedPlan = matchedPlans.find(plan => {
        if (plan.name.toLowerCase() === 'free') return true;
        return payuData.some(
          pay =>
            pay.phone && new RegExp(escapedPhone + '$').test(pay.phone) &&
            pay.planName === plan.name &&
            pay.status === 'success'
        );
      });

      const matchedPayU = payuData.find(
        pay => new RegExp(escapedPhone + '$').test(pay.phone)
      );

      const matchedBill = bills.find(
        bill => bill.ownerPhone === phoneNumber || bill.ppId === property.ppcId
      );

      let adminName = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminName = matchedBill.adminName || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate);
          const billExpiry = new Date(billStart.getTime() + (validity - 1) * 86400000);
          billExpiryDate = billExpiry.toLocaleDateString();
        }
      }

      const propertyFollowUps = followups
        .filter(fu => String(fu.ppcId) === String(property.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const followUpAdminName = propertyFollowUps.length > 0
        ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
        : 'N/A';

      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';
      let planDetails = null;

      if (matchedPlan) {
        if (matchedPlan.createdAt && matchedPlan.durationDays) {
          const planStart = new Date(matchedPlan.createdAt);
          const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 86400000);
          planCreatedAt = planStart.toLocaleDateString();
          planExpiryDate = planExpiry.toLocaleDateString();
        }

        // Count used properties and collect PPC IDs
        const usedProps = await AddModel.find({
          phoneNumber: new RegExp(escapedPhone + '$'),
          isDeleted: false
        });

        const usedCars = usedProps.length;
        const ppcIds = usedProps.map(p => p.ppcId);

        planDetails = {
          name: matchedPlan.name || 'N/A',
          packageType: matchedPlan.packageType || 'N/A',
          price: matchedPlan.price || 0,
          durationDays: matchedPlan.durationDays || 0,
          description: matchedPlan.description || '',
          unlimitedAds: matchedPlan.unlimitedAds || false,
          numOfCars: matchedPlan.numOfCars || 0,
          featuredMaxCar: matchedPlan.featuredMaxCar || 0,
          expireDate: matchedPlan.expireDate || null,
          createdDate: matchedPlan.createdDate || null,
          usedCars: usedCars,
          ppcIds,
          remainingCars: Math.max((matchedPlan.numOfCars || 0) - usedCars, 0)
        };
      }

      processedProperties.push({
        ...property._doc,
        required: isComplete ? 'yes' : 'no',
        planName: matchedPlan?.name || 'N/A',
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        planCreatedAt,
        planExpiryDate,
        adminName,
        billDate,
        validity,
        billExpiryDate,
        followUpAdminName,
        setPpcId: property.setPpcId || false,
        assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
        setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
        payUStatus: matchedPayU?.status || 'N/A',
  payustatususer: matchedPayU?.payustatususer || 'N/A',  // ? this line ensures 'paid' is shown
        paymentId: matchedPayU?.mihpayid || 'N/A',
        transactionId: matchedPayU?.txnid || 'N/A',
        payUCreatedAt: matchedPayU?.createdAt || null,
        payUUpdatedAt: matchedPayU?.updatedAt || null,
        planDetails
      });
    }

    const filteredProperties = processedProperties.filter(p => p.required === 'yes');

    res.status(200).json({
      success: true,
      total: filteredProperties.length,
      data: filteredProperties
    });

  } catch (error) {
    console.error("Error fetching active user details:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active user details.',
      error: error.message
    });
  }
});










// router.get('/fetch-active-users-all', async (req, res) => {
//   try {
//     const properties = await AddModel.find({ status: 'active' });
//     const plans = await PricingPlans.find();
//     const payuData = await PaymentPayU.find({ status: 'success' }); // ? FIXED usage
//     const bills = await Bill.find();
//     const followups = await FollowUp.find();

//     const requiredFields = [
//       'propertyMode', 'propertyType', 'price',
//       'totalArea', 'areaUnit', 'salesType', 'postedBy'
//     ];

//     const processedProperties = properties.map((property) => {
//       const isComplete = requiredFields.every(
//         (field) =>
//           property[field] !== undefined &&
//           property[field] !== null &&
//           String(property[field]).trim() !== ''
//       );

//       const matchedPlan = plans.find(plan =>
//         Array.isArray(plan.phoneNumber)
//           ? plan.phoneNumber.includes(property.phoneNumber)
//           : plan.phoneNumber === property.phoneNumber
//       );

//       const matchedPayU = payuData.find(pay =>
//         pay.phone === property.phoneNumber
//       );

//       const matchedBill = bills.find(bill =>
//         bill.ownerPhone === property.phoneNumber || bill.ppId === property.ppcId
//       );

//       let adminName = 'N/A';
//       let billDate = 'N/A';
//       let validity = 'N/A';
//       let billExpiryDate = 'N/A';

//       if (matchedBill) {
//         adminName = matchedBill.adminName || 'N/A';
//         billDate = matchedBill.billDate || 'N/A';
//         validity = matchedBill.validity || 'N/A';

//         if (billDate !== 'N/A' && validity !== 'N/A') {
//           const billStart = new Date(billDate);
//           const billExpiry = new Date(billStart.getTime() + (validity - 1) * 86400000);
//           billExpiryDate = billExpiry.toLocaleDateString();
//         }
//       }

//       const propertyFollowUps = followups
//         .filter(fu => String(fu.ppcId) === String(property.ppcId))
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//       const followUpAdminName = propertyFollowUps.length > 0
//         ? propertyFollowUps[0]?.adminName || 'Unknown Admin'
//         : 'N/A';

//       let planCreatedAt = 'N/A';
//       let planExpiryDate = 'N/A';

//       if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
//         const planStart = new Date(matchedPlan.createdAt);
//         const planExpiry = new Date(planStart.getTime() + (matchedPlan.durationDays - 1) * 86400000);
//         planCreatedAt = planStart.toLocaleDateString();
//         planExpiryDate = planExpiry.toLocaleDateString();
//       }

//       return {
//         ...property._doc,
//         required: isComplete ? 'yes' : 'no',
//         planName: matchedPlan?.name || 'N/A',
//         packageType: matchedPlan?.packageType || 'N/A',
//         planDuration: matchedPlan?.durationDays || 'N/A',
//         planCreatedAt,
//         planExpiryDate,
//         adminName,
//         billDate,
//         validity,
//         billExpiryDate,
//         followUpAdminName,
//         setPpcId: property.setPpcId || false,
//         assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
//         setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
//       payUStatus: matchedPayU?.status || 'N/A',
// paymentId: matchedPayU?.mihpayid || 'N/A',
// transactionId: matchedPayU?.txnid || 'N/A',
// payUdate: matchedPayU?.payUdate || null,
// payUCreatedAt: matchedPayU?.createdAt || null,
// payUUpdatedAt: matchedPayU?.updatedAt || null,
// planDetails: matchedPlan
//   ? {
//       name: matchedPlan.name || 'N/A',
//       packageType: matchedPlan.packageType || 'N/A',
//       price: matchedPlan.price || 0,
//       durationDays: matchedPlan.durationDays || 0,
//       description: matchedPlan.description || '',
//       unlimitedAds: matchedPlan.unlimitedAds || false,
//       numOfCars: matchedPlan.numOfCars || 0,
//       featuredMaxCar: matchedPlan.featuredMaxCar || 0,
//       expireDate: matchedPlan.expireDate || null,
//       createdDate: matchedPlan.createdDate || null,
//       usedCars: matchedPlan.usedCars || 0,
//       ppcIds: Array.isArray(matchedPlan.ppcIds) ? matchedPlan.ppcIds : [],
//       remainingCars:
//         typeof matchedPlan.numOfCars === 'number' &&
//         typeof matchedPlan.usedCars === 'number'
//           ? matchedPlan.numOfCars - matchedPlan.usedCars
//           : 0,
//     }
//   : null


//       };
//     });

//     const filteredProperties = processedProperties.filter(p => p.required === 'yes');

//     res.status(200).json({
//       success: true,
//       total: filteredProperties.length,
//       data: filteredProperties
//     });
//   } catch (error) {
//     console.error("Error fetching active user details:", error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching active user details.',
//       error: error.message
//     });
//   }
// });



router.get('/fetch-all-complete-data', async (req, res) => {
  try {
      // Fetch all users with the status 'complete' from the database
      const users = await AddModel.find({ status: 'complete' });

      // Return the fetched user data
      res.status(200).json({ message: 'All complete user data fetched successfully!', users });
  } catch (error) {
      res.status(500).json({ message: 'Error fetching complete user details.', error });
  }
});




// Route: /get-deleted-properties
router.get('/get-deleted-properties-datas', async (req, res) => {
  try {
    const deletedData = await DeletedAddModel.find(); // or AddModel.find({ isDeleted: true })
    res.status(200).json({ deleted: deletedData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch deleted properties.', error });
  }
});


router.delete('/delete-permenent-data', async (req, res) => {
  const { ppcId } = req.query;

  if (!ppcId) {
      return res.status(400).json({ message: 'PPC-ID is required.' });
  }

  try {
      // Delete user based on ppcId only
      const deletedUser = await DeletedAddModel.findOneAndDelete({ ppcId });

      if (!deletedUser) {
          return res.status(404).json({ message: 'User not found.' });
      }

      res.status(200).json({ message: 'User Permenent deleted successfully!', deletedUser });
  } catch (error) {
      res.status(500).json({ message: 'Error deleting user.', error });
  }
});


// router.delete('/delete-ppcId-data', async (req, res) => {
//   const { ppcId } = req.query;

//   if (!ppcId) {
//     return res.status(400).json({ message: 'PPC-ID is required.' });
//   }

//   try {
//     // Find user first
//     const userToDelete = await AddModel.findOne({ ppcId });
//     if (!userToDelete) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     // Save the deleted data to DeletedAddModel
//     await DeletedAddModel.create({
//       ...userToDelete.toObject(),
//       deletedAt: new Date(),
//     });

//     // Then delete from the original collection
//     await AddModel.deleteOne({ ppcId });

//     res.status(200).json({ message: 'User Permenent deleted successfully!', deletedUser: userToDelete });
//   } catch (error) {
//     res.status(500).json({ message: 'Error deleting user.', error });
//   }
// });



router.delete('/delete-ppcId-data', async (req, res) => {
  const { ppcId } = req.query;
  const { deletedBy } = req.body; // Admin name from request body

  // Validation
  if (!ppcId) {
    return res.status(400).json({ message: 'PPC-ID is required.' });
  }

  if (!deletedBy) {
    return res.status(400).json({ message: 'Admin name (deletedBy) is required.' });
  }

  try {
    // Step 1: Find the document in AddModel
    const userToDelete = await AddModel.findOne({ ppcId });
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Step 2: Save the data to DeletedAddModel
    const deletedRecord = await DeletedAddModel.create({
      ...userToDelete.toObject(),
      deletedAt: new Date(),
      permanentDeletedBy: deletedBy // Add admin name here
    });

    // Step 3: Delete from AddModel
    await AddModel.deleteOne({ ppcId });

    // Step 4: Return response
    res.status(200).json({
      message: 'User permanently deleted successfully!',
      deletedUser: deletedRecord
    });

  } catch (error) {
    res.status(500).json({ message: 'Error deleting user.', error });
  }
});


// Bulk permanent-delete. Same archival semantics as /delete-ppcId-data, but
// accepts an array of ppcIds and processes them in a single request. Each
// property is copied to DeletedAddModel (with deletedAt + permanentDeletedBy)
// and then removed from AddModel. Missing ppcIds are reported back rather
// than failing the whole batch.
router.delete('/bulk-permanent-delete', async (req, res) => {
  const { ppcIds, deletedBy } = req.body;

  if (!Array.isArray(ppcIds) || ppcIds.length === 0) {
    return res.status(400).json({ message: 'ppcIds (non-empty array) is required.' });
  }
  if (!deletedBy) {
    return res.status(400).json({ message: 'Admin name (deletedBy) is required.' });
  }

  const deletedAt = new Date();
  const deleted = [];
  const notFound = [];
  const failed = [];

  for (const ppcId of ppcIds) {
    try {
      const userToDelete = await AddModel.findOne({ ppcId });
      if (!userToDelete) {
        notFound.push(ppcId);
        continue;
      }

      await DeletedAddModel.create({
        ...userToDelete.toObject(),
        deletedAt,
        permanentDeletedBy: deletedBy,
      });

      await AddModel.deleteOne({ ppcId });
      deleted.push(ppcId);
    } catch (err) {
      failed.push({ ppcId, error: err.message });
    }
  }

  res.status(200).json({
    message: `Bulk delete finished. ${deleted.length} deleted, ${notFound.length} not found, ${failed.length} failed.`,
    deleted,
    notFound,
    failed,
  });
});


router.delete('/delete-data', async (req, res) => {
    const { phoneNumber, ppcId } = req.query;

    // Ensure at least one parameter is provided
    if (!phoneNumber && !ppcId) {
        return res.status(400).json({ message: 'Either phone number or PPC-ID is required.' });
    }

    try {

        // Normalize phone number (remove spaces, dashes, country code, and ensure consistency)
        const normalizedPhoneNumber = phoneNumber
            ? phoneNumber.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim() // Remove country code, spaces, dashes
            : null;

        // Build query dynamically based on the provided parameters
        const query = {};
        if (normalizedPhoneNumber) query.phoneNumber = new RegExp(normalizedPhoneNumber + '$'); // Match phone number ending with the query
        if (ppcId) query.ppcId = ppcId;


        // Delete user from the database
        const deletedUser = await AddModel.findOneAndDelete(query);

        // Check if user was found and deleted
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Return success response
        res.status(200).json({ message: 'User deleted successfully!', deletedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user.', error });
    }
});








// router.put('/admin-delete', async (req, res) => {
//   const { ppcId } = req.query;
//   const { deletionReason } = req.body;

//   // Validate ppcId is provided
//   if (!ppcId) {
//     return res.status(400).json({ message: 'PPC-ID is required.' });
//   }

//   // Validate deletion reason is provided
//   if (!deletionReason || deletionReason.trim() === '') {
//     return res.status(400).json({ message: 'Deletion reason is required.' });
//   }

//   try {
//     // Update document with deletion information (soft delete)
//     const updatedItem = await AddModel.findOneAndUpdate(
//       { ppcId },
//       {
//         isDeleted: true,
//         deletionReason: deletionReason.trim(),
//         deletionDate: new Date()
//       },
//       { new: true } // Return the updated document
//     );

//     if (!updatedItem) {
//       return res.status(404).json({ message: 'Item not found with the provided PPC-ID.' });
//     }

//     res.status(200).json({ 
//       message: 'Item marked as deleted successfully!',
//       data: updatedItem
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       message: 'Error marking item as deleted.', 
//       error: error.message 
//     });
//   }
// });



router.put('/admin-delete', async (req, res) => {
  const { ppcId, id } = req.query;
  const { deletionReason } = req.body;

  // Force delete: a property may have no PPC-ID. Accept either the ppcId or
  // the Mongo _id so such records can still be removed.
  if (!ppcId && !id) {
    return res.status(400).json({ message: 'PPC-ID or record id is required.' });
  }

  // Validate deletion reason is provided
  if (!deletionReason || deletionReason.trim() === '') {
    return res.status(400).json({ message: 'Deletion reason is required.' });
  }

  // Prefer ppcId; fall back to _id when ppcId is missing/empty.
  const filter = ppcId ? { ppcId } : { _id: id };

  try {
    // Soft delete with status update
    const updatedItem = await AddModel.findOneAndUpdate(
      filter,
      {
        isDeleted: true,
        deletionReason: deletionReason.trim(),
        deletionDate: new Date(),
        status: 'delete' // ? status update added here
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found with the provided PPC-ID or record id.' });
    }

    res.status(200).json({
      message: 'Item marked as deleted successfully!',
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error marking item as deleted.',
      error: error.message
    });
  }
});


// Bulk soft-delete. Same semantics as /admin-delete (sets isDeleted + status='delete'
// so the property moves to the Removed Property bucket), but processes an array
// of ppcIds in a single request with one shared deletionReason.
router.put('/admin-bulk-delete', async (req, res) => {
  const { ppcIds, deletionReason } = req.body;

  if (!Array.isArray(ppcIds) || ppcIds.length === 0) {
    return res.status(400).json({ message: 'ppcIds (non-empty array) is required.' });
  }
  if (!deletionReason || deletionReason.trim() === '') {
    return res.status(400).json({ message: 'Deletion reason is required.' });
  }

  try {
    const result = await AddModel.updateMany(
      { ppcId: { $in: ppcIds } },
      {
        isDeleted: true,
        deletionReason: deletionReason.trim(),
        deletionDate: new Date(),
        status: 'delete',
      }
    );

    // updateMany doesn't return which docs matched; recompute by querying back.
    const matchedDocs = await AddModel.find(
      { ppcId: { $in: ppcIds }, isDeleted: true },
      { ppcId: 1, _id: 0 }
    );
    const matchedIds = matchedDocs.map((d) => d.ppcId);
    const notFound = ppcIds.filter((id) => !matchedIds.includes(id));

    res.status(200).json({
      message: `Bulk delete finished. ${matchedIds.length} marked as deleted, ${notFound.length} not found.`,
      deleted: matchedIds,
      notFound,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error marking items as deleted.',
      error: error.message,
    });
  }
});


// Undo Delete by ppcId
router.put('/admin-undo-delete', async (req, res) => {
  const { ppcId } = req.query;

  // Validate ppcId is provided
  if (!ppcId) {
    return res.status(400).json({ message: 'PPC-ID is required.' });
  }

  try {
    // Restore the document by clearing deletion fields
    const restoredItem = await AddModel.findOneAndUpdate(
      { ppcId },
      {
        isDeleted: false,
        deletionReason: null,
        deletionDate: null
      },
      { new: true } // Return the updated document
    );

    if (!restoredItem) {
      return res.status(404).json({ message: 'Item not found with the provided PPC-ID.' });
    }

    res.status(200).json({ 
      message: 'Item restored successfully!',
      data: restoredItem
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error restoring item.', 
      error: error.message 
    });
  }
});

// Get all non-deleted items
router.get('/dddd', async (req, res) => {
  try {
    const items = await AddModel.find({ isDeleted: false });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all items including deleted (for admin view)
router.get('/allss', async (req, res) => {
  try {
    const items = await AddModel.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/delete-datas', async (req, res) => {
  const { phoneNumber, ppcId } = req.query;
  const { deletionReason, deletionDate } = req.body;

  // Ensure at least one parameter is provided
  if (!phoneNumber && !ppcId) {
      return res.status(400).json({ message: 'Either phone number or PPC-ID is required.' });
  }

  // Validate deletion reason is provided
  if (!deletionReason || deletionReason.trim() === '') {
      return res.status(400).json({ message: 'Deletion reason is required.' });
  }

  try {
      // Normalize phone number (remove spaces, dashes, country code, and ensure consistency)
      const normalizedPhoneNumber = phoneNumber
          ? phoneNumber.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim()
          : null;

      // Build query dynamically based on the provided parameters
      const query = {};
      if (normalizedPhoneNumber) query.phoneNumber = new RegExp(normalizedPhoneNumber + '$');
      if (ppcId) query.ppcId = ppcId;

      // Update document with deletion information (soft delete)
      const updatedUser = await AddModel.findOneAndUpdate(
          query,
          {
              $set: {
                  status: 'delete',
                  deletionReason: deletionReason.trim(),
                  deletionDate: deletionDate || new Date()
              }
          },
          { new: true } // Return the updated document
      );

      // Check if user was found and updated
      if (!updatedUser) {
          return res.status(404).json({ message: 'User not found.' });
      }

      // Return success response
      res.status(200).json({ 
          message: 'User marked as deleted successfully!',
          updatedUser 
      });
  } catch (error) {
      res.status(500).json({ 
          message: 'Error marking user as deleted.', 
          error: error.message 
      });
  }
});


router.get('/fetch-deleted-data', async (req, res) => {
  try {
      const deletedUsers = await AddModel.find({ status: "delete" });

      if (deletedUsers.length === 0) {
          return res.status(404).json({ message: "No deleted users found." });
      }

      res.status(200).json({ deletedUsers });
  } catch (error) {
      res.status(500).json({ message: "Error fetching deleted users.", error });
  }
});




















// Temporary deletion
router.delete('/delete-temporary', async (req, res) => {
    const { phoneNumber, ppcId, reason } = req.query;

    // Ensure at least one parameter and reason are provided
    if (!phoneNumber && !ppcId) {
        return res.status(400).json({ message: 'Either phone number or PPC-ID is required.' });
    }

    if (!reason) {
        return res.status(400).json({ message: 'Reason for deletion is required.' });
    }

    try {

        // Normalize phone number (remove spaces, dashes, country code, and ensure consistency)
        const normalizedPhoneNumber = phoneNumber
            ? phoneNumber.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim() // Remove country code, spaces, dashes
            : null;

        // Build query dynamically based on the provided parameters
        const query = {};
        if (normalizedPhoneNumber) query.phoneNumber = new RegExp(normalizedPhoneNumber + '$'); // Match phone number ending with the query
        if (ppcId) query.ppcId = ppcId;


        // Find the user and update the deletion reason, time, and date
        const update = {
            isDeleted: true,
            deletionReason: reason,
            deletionDate: new Date(), // Store the current date and time
        };

        const updatedUser = await AddModel.findOneAndUpdate(query, update, { new: true });

        // Check if user was found and updated
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }


        // Return success response with additional details
        res.status(200).json({
            message: 'User marked as deleted successfully!',
            timestamp: new Date().toISOString(),
            reason,
            deletedUser: {
                id: updatedUser._id,
                phoneNumber: updatedUser.phoneNumber,
                ppcId: updatedUser.ppcId,
                deletionReason: updatedUser.deletionReason,
                deletionDate: updatedUser.deletionDate,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Error marking user as deleted.', error });
    }
});





// Undo delete property endpoint
router.post('/undo-delete', async (req, res) => {
    const { ppcId, phoneNumber } = req.body;
  
    try {
      // Find the property by its ppcId
      const property = await AddModel.findOne({ ppcId });
  
      if (!property) {
        return res.status(404).json({ message: 'Property not found.' });
      }
  
      property.status = 'incomplete'; 
      if (!property.interestRequests.some(request => request.phoneNumber === phoneNumber)) {
        property.interestRequests.push({ phoneNumber, date: new Date() });
      }
  
      await property.save();
  
      // Send the updated property as a response
      res.status(200).json({ message: 'Property status reverted successfully!', property });
    } catch (error) {
      res.status(500).json({ message: 'Error undoing property status.' });
    }
  });
  


// Delete property endpoint
router.post('/delete-property', async (req, res) => {
    const { ppcId, phoneNumber } = req.body;
  
    try {
      // Find the property by its ppcId and phoneNumber
      const property = await AddModel.findOne({ ppcId });
  
      if (!property) {
        return res.status(404).json({ message: 'Property not found.' });
      }
  
      // Check if the user's phone number is in the interestRequests array
      const userInterestIndex = property.interestRequests.findIndex(request => request.phoneNumber === phoneNumber);
      if (userInterestIndex !== -1) {
        // If the user is interested, remove their interest or handle as needed
        property.interestRequests.splice(userInterestIndex, 1);  // Remove the user's interest
      }
  
      // Change the property status to 'delete'
      property.status = 'delete';
      property.deletedBy = 'User'; 
      await property.save();
  
      // Send the updated property as a response
      res.status(200).json({ message: 'Property removed successfully.', property });
    } catch (error) {
      res.status(500).json({ message: 'Error removing property.' });
    }
  });
  

  // Delete all properties endpoint
router.delete('/delete-all-properties', async (req, res) => {
  try {
    const result = await AddModel.deleteMany({}); // Deletes all documents in the collection
    res.status(200).json({ message: 'All properties deleted successfully.', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting all properties.' });
  }
});


router.get('/fetch-status', async (req, res) => {
    const { phoneNumber } = req.query;
  
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required.' });
    } 
    try {
      const normalizedPhoneNumber = phoneNumber
        .replace(/[\s-]/g, '')
        .replace(/^(\+91|91|0)/, '') 
        .trim();
  
      const query = {
        phoneNumber: new RegExp(normalizedPhoneNumber + '$'),

                // status: { $in: ['incomplete','active','pending', 'complete','sendInterest', 'soldOut', 'reportProperties', 'needHelp', 'contact','favorite'] },

        status: { $in: ['incomplete', 'complete','pending','active','sendInterest', 'soldOut', 'reportProperties', 'needHelp', 'contact', 'favorite'] },
      };
  
      const users = await AddModel.find(query);
  
      if (!users || users.length === 0) {
        return res.status(404).json({ message: 'Users not found.' });
      }
      res.status(200).json({ message: 'User data fetched successfully!', users });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user details.', error });
    }
  });


  // GET /fetch-status-with-payment
router.get('/fetch-status-with-payment', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  try {
    // Normalize phone number
    const normalizedPhoneNumber = phoneNumber
      .replace(/[\s-]/g, '')
      .replace(/^(\+91|91|0)/, '')
      .trim();

    // Step 1: Get all properties for that phoneNumber
    const propertyQuery = {
      phoneNumber: new RegExp(normalizedPhoneNumber + '$'),
      status: {
        $in: [
          'incomplete',
          'complete',
          'pending',
          'active',
          'sendInterest',
          'soldOut',
          'reportProperties',
          'needHelp',
          'contact',
          'favorite'
        ]
      }
    };

    const properties = await AddModel.find(propertyQuery);

    if (!properties.length) {
      return res.status(404).json({ message: 'No properties found for this phone number.' });
    }

    // Step 2: Get latest PayU status map per ppcId
    const payments = await PaymentPayU.find().sort({ createdAt: -1 });

    const statusMap = {};
    for (let payment of payments) {
      if (!statusMap[payment.ppcId]) {
        statusMap[payment.ppcId] = payment.payustatususer.toLowerCase(); // first/latest one wins
      }
    }

    // Step 2b: A property is also "paid" if an admin-issued Bill exists
    // for that ppcId with paymentType !== 'Free' (PayLater / cash / etc.).
    // Bill.ppId is a STRING; AddModel.ppcId is a NUMBER. Coerce both sides
    // to string so the $in query and the Set lookup actually match.
    const ppcIdStrs = properties.map((p) => String(p.ppcId));
    const paidBills = await Bill.find({
      ppId: { $in: ppcIdStrs },
      paymentType: { $ne: 'Free' },
    }).select('ppId paymentType');
    const billPaidSet = new Set(paidBills.map((b) => String(b.ppId)));

    // Step 3: Merge PayU + Bill status with properties.
    const merged = properties.map((prop) => {
      let payustatususer = statusMap[prop.ppcId] || 'pay now';
      if (payustatususer !== 'paid' && billPaidSet.has(String(prop.ppcId))) {
        payustatususer = 'paid';
      }
      return {
        ...prop._doc, // includes all AddModel fields
        payustatususer,
      };
    });


    return res.status(200).json({
      message: 'Properties with PayU status fetched successfully!',
      data: merged,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});




  router.get('/property-count', async (req, res) => {
    const { phoneNumber } = req.query;
  
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }
  
    try {
      const normalizedPhoneNumber = phoneNumber
        .replace(/[\s-]/g, '')
        .replace(/^(\+91|91|0)/, '')
        .trim();
  
      const query = {
        phoneNumber: new RegExp(normalizedPhoneNumber + '$'),
        status: { $in: ['incomplete', 'complete','pending','active'] },
      };
  
      const count = await AddModel.countDocuments(query);
  
      res.status(200).json({
        message: 'Property count fetched successfully!',
        count,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching property count.',
        error,
      });
    }
  });
  


router.get('/fetch-status-count', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required.' });
  } 
  try {
    const normalizedPhoneNumber = phoneNumber
      .replace(/\s|-/g, '')
      .replace(/^\+91|91|0/, '')
      .trim();

    const query = {
      phoneNumber: new RegExp(normalizedPhoneNumber + '$'),
      status: { $in: ['incomplete', 'complete','pending','active'] },
    };

    const userCount = await AddModel.countDocuments(query);

    res.status(200).json({ message: 'User count fetched successfully!', count: userCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user count.', error });
  }
});


  


router.get('/fetch-delete-status', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required.' });
  }

  try {
      // Normalize phone number format
      const normalizedPhoneNumber = phoneNumber
          .replace(/[\s-]/g, '') // Remove spaces & hyphens
          .replace(/^(\+91|91|0)/, '') // Remove country code if exists
          .trim();


      const query = {
          phoneNumber: new RegExp(`^(\\+91)?${normalizedPhoneNumber}$`), 
          status: 'delete',
      };


      const users = await AddModel.find(query);

      if (!users || users.length === 0) {
          return res.status(404).json({ message: 'No deleted properties found.' });
      }

      // Process response (remove +91 if present)
      const updatedUsers = users.map(user => ({
          ...user._doc,
          phoneNumber: user.phoneNumber.replace(/^\+91/, '') // Remove +91 if present
      }));

      res.status(200).json({ 
          message: 'Deleted properties fetched successfully!', 
          users: updatedUsers 
      });

  } catch (error) {
      res.status(500).json({ 
          message: 'Error fetching deleted properties.', 
          error: error.message || error 
      });
  }
});
  

router.get('/fetch-delete-status-count', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required.' });
  }

  try {
      // Normalize phone number format
      const normalizedPhoneNumber = phoneNumber
          .replace(/[\s-]/g, '') // Remove spaces & hyphens
          .replace(/^(\+91|91|0)/, '') // Remove country code if exists
          .trim();

      const query = {
          phoneNumber: new RegExp(`^(\\+91)?${normalizedPhoneNumber}$`), 
          status: 'delete',
      };

      const userCount = await AddModel.countDocuments(query);

      res.status(200).json({ message: 'Deleted properties count fetched successfully!', count: userCount });

  } catch (error) {
      res.status(500).json({ 
          message: 'Error fetching deleted properties count.', 
          error: error.message || error 
      });
  }
});


  router.get('/fetch-removed-datas', async (req, res) => {
    const { ppcId } = req.query;
  
    if (!ppcId) {
      return res.status(400).json({ message: "PPC-ID is required." });
    }
  
    try {
      const query = { ppcId: ppcId, status: "delete" };
  
      const users = await AddModel.find(query);
      
  
      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No deleted properties found." });
      }
  
      res.status(200).json({ message: "Deleted properties fetched successfully!", users });
    } catch (error) {
      res.status(500).json({ message: "Error fetching deleted properties.", error });
    }
  });
  


  router.get('/fetch-complete-status', async (req, res) => {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required.' });
    }

    try {
        const normalizedPhoneNumber = phoneNumber
            .replace(/[\s-]/g, '')
            .replace(/^(\+91|91|0)/, '') 
            .trim();

        const query = {
            phoneNumber: new RegExp(normalizedPhoneNumber + '$'), 
            status: 'complete', 
        };

        const users = await AddModel.find(query);

        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users with complete status found.' });
        }

        // Send the user data in the response
        res.status(200).json({ message: 'Complete status user data fetched successfully!', users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching complete status user details.', error });
    }
});


router.get('/fetch-status-complete-all', async (req, res) => {
  try {
      const query = { status: 'complete' };

      const users = await AddModel.find(query);

      if (!users || users.length === 0) {
          return res.status(404).json({ message: 'No users with complete status found.' });
      }

      res.status(200).json({ message: 'Complete status user data fetched successfully!', users });
  } catch (error) {
      res.status(500).json({ message: 'Error fetching complete status user details.', error });
  }
});


router.put("/update-feature-status", async (req, res) => {
  try {
    const { ppcId, featureStatus } = req.body;

    await AddModel.updateOne({ ppcId }, { $set: { featureStatus } });

    res.status(200).json({ message: "Feature status updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error updating feature status.", error });
  }
});



router.get('/properties/deleted', async (req, res) => {
  try {
    const deletedProperties = await AddModel.find({ status: 'delete' });
    const plans = await PricingPlans.find();
    const bills = await Bill.find();

    const processedDeleted = await Promise.all(deletedProperties.map(async property => {
      const matchedPlan = plans.find(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(property.phoneNumber)
          : plan.phoneNumber === property.phoneNumber
      );

      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';

      if (matchedPlan?.createdAt && matchedPlan?.durationDays) {
        const expiry = new Date(matchedPlan.createdAt).getTime() + matchedPlan.durationDays * 24 * 60 * 60 * 1000;
        planCreatedAt = new Date(matchedPlan.createdAt).toLocaleDateString();
        planExpiryDate = new Date(expiry).toLocaleDateString();
      }

      const matchedBill = bills.find(bill =>
        bill.ownerPhone === property.phoneNumber || bill.ppId === property.ppcId
      );

      let adminOffice = 'N/A';
      let adminName = 'N/A';
      let billNo = 'N/A';
      let billDate = 'N/A';
      let validity = 'N/A';
      let billExpiryDate = 'N/A';

      if (matchedBill) {
        adminOffice = matchedBill.adminOffice || 'N/A';
        adminName = matchedBill.adminName || 'N/A';
        billNo = matchedBill.billNo || 'N/A';
        billDate = matchedBill.billDate || 'N/A';
        validity = matchedBill.validity || 'N/A';

        if (billDate !== 'N/A' && validity !== 'N/A') {
          const billStart = new Date(billDate).getTime();
          const billExp = billStart + validity * 24 * 60 * 60 * 1000;
          billExpiryDate = new Date(billExp).toLocaleDateString();
        }
      }

      // ? Calculate total number of ads posted by this phoneNumber
      const adsCount = await AddModel.countDocuments({
        phoneNumber: property.phoneNumber,
        status: { $ne: 'delete' }
      });

      // ? Check required fields
      const requiredFields = [
        'propertyMode', 'propertyType', 'price',
        'totalArea', 'areaUnit',
        'salesType', 'postedBy'
      ];

      const required = requiredFields.every(field => property[field] !== undefined && property[field] !== null && property[field] !== '')
        ? 'Yes'
        : 'No';

      return {
        ...property._doc,
        planName: matchedPlan?.name || 'N/A',
        planCreatedAt,
        planExpiryDate,
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        adminOffice,
        adminName,
        billNo,
        billDate,
        validity,
        billExpiryDate,
        adsCount,
        required, 
  //        deletedBy: property.deletedBy || 'User',
  // deletedAt: property.deletedAt ? new Date(property.deletedAt).toLocaleDateString() : 'N/A'
      };
    }));

    res.status(200).json({
      message: 'Deleted properties fetched successfully.',
      data: processedDeleted,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching deleted properties.',
      error: error.message,
    });
  }
});



// router.get('/properties/pending', async (req, res) => {
//   try {
//     const pendingProperties = await AddModel.find({ status: 'incomplete' });

//     res.status(200).json({
//       message: 'Pending properties fetched successfully.',
//       data: pendingProperties,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error fetching pending properties.',
//       error: error.message,
//     });
//   }
// });


router.get('/properties/pending', async (req, res) => {
  try {
    const users = await AddModel.find({ status: 'incomplete' });
    const plans = await PricingPlans.find();

    // ? Step 1: Calculate ads count per phone number across all properties
    const allProperties = await AddModel.find({});
    const adsCountByUser = allProperties.reduce((acc, property) => {
      const phone = property.phoneNumber;
      if (!acc[phone]) {
        acc[phone] = 1;
      } else {
        acc[phone]++;
      }
      return acc;
    }, {});

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit',
      'salesType', 'postedBy'
    ];

    const incompleteUsers = users.map((user) => {
      const isComplete = requiredFields.every(
        (field) =>
          user[field] !== undefined &&
          user[field] !== null &&
          String(user[field]).trim() !== ''
      );

      // Match plan
      const matchedPlan = plans.find(plan =>
        Array.isArray(plan.phoneNumber)
          ? plan.phoneNumber.includes(user.phoneNumber)
          : plan.phoneNumber === user.phoneNumber
      );

      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';

      if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
        const expiryDate = new Date(matchedPlan.createdAt).getTime() + matchedPlan.durationDays * 24 * 60 * 60 * 1000;
        planCreatedAt = new Date(matchedPlan.createdAt).toLocaleDateString();
        planExpiryDate = new Date(expiryDate).toLocaleDateString();
      }

      return {
        ...user._doc,
        required: isComplete ? "yes" : "no",
        planName: matchedPlan?.name || 'N/A',
        planCreatedAt,
        planExpiryDate,
        packageType: matchedPlan?.packageType || 'N/A',
        planDuration: matchedPlan?.durationDays || 'N/A',
        adsCount: adsCountByUser[user.phoneNumber] || 0, // ? Include ad count
      };
    }).filter(user => user.required === "no");

    res.status(200).json({
      message: "Pending properties with incomplete required fields and plan info fetched successfully!",
      users: incompleteUsers
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching pending properties.',
      error: error.message
    });
  }
});




// router.get('/properties/pending-all', async (req, res) => {
//   try {
//     const users = await AddModel.find({ status: 'incomplete' });
//     const allProperties = await AddModel.find({});
//     const plans = await PricingPlans.find();
//     const payuData = await PaymentPayU.find({ status: 'success' });

//     const requiredFields = [
//       'propertyMode', 'propertyType', 'price',
//       'totalArea', 'areaUnit', 'salesType', 'postedBy'
//     ];

//     // ? Count ads by phone number
//     const adsCountByUser = allProperties.reduce((acc, property) => {
//       const phone = property.phoneNumber;
//       acc[phone] = (acc[phone] || 0) + 1;
//       return acc;
//     }, {});

//     const incompleteUsers = [];

//     for (const user of users) {
//       const phone = user.phoneNumber || '';
//       const escapedPhone = escapeRegExp(phone);

//       // ? Required check
//       const isComplete = requiredFields.every(
//         (field) =>
//           user[field] !== undefined &&
//           user[field] !== null &&
//           String(user[field]).trim() !== ''
//       );

//       // ? Match latest plan for this phone number
//       const userPlans = plans.filter(p =>
//         Array.isArray(p.phoneNumber)
//           ? p.phoneNumber.includes(phone)
//           : p.phoneNumber === phone
//       ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//       const matchedPlan = userPlans.find(plan => {
//         if (plan.name.toLowerCase() === 'free') return true;
//         return payuData.some(p =>
//           new RegExp(escapedPhone + '$').test(p.phone) &&
//           p.planName === plan.name &&
//           p.status === 'success'
//         );
//       });

//       const matchedPayU = payuData.find(p =>
//         new RegExp(escapedPhone + '$').test(p.phone)
//       );

//       // ? Plan validity
//       let planCreatedAt = 'N/A';
//       let planExpiryDate = 'N/A';
//       let remainingDays = 'N/A';

//       if (matchedPlan?.createdAt && matchedPlan?.durationDays) {
//         const created = new Date(matchedPlan.createdAt);
//         const expiry = new Date(created.getTime() + matchedPlan.durationDays * 86400000);
//         const now = new Date();

//         planCreatedAt = created.toLocaleDateString();
//         planExpiryDate = expiry.toLocaleDateString();
//         remainingDays = Math.max(Math.ceil((expiry - now) / 86400000), 0);
//       }

//       // ? Follow-up info
//       const followup = await FollowUp.findOne({ phoneNumber: phone }).sort({ createdAt: -1 });
//       let followUpDate = null, adminName = null;
//       if (followup) {
//         followUpDate = followup.createdAt;
//         const admin = await AdminUser.findOne({ _id: followup.adminId });
//         adminName = admin?.name || null;
//       }

//       incompleteUsers.push({
//         ...user._doc,
//         required: isComplete ? 'yes' : 'no',
//         adsUsed: adsCountByUser[phone] || 0,
//         planName: matchedPlan?.name || 'N/A',
//         packageType: matchedPlan?.packageType || 'N/A',
//         planDuration: matchedPlan?.durationDays || 'N/A',
//         planCreatedAt,
//         planExpiryDate,
//         remainingDays,
//         transactionId: matchedPayU?.txnid || 'N/A',
//         paymentId: matchedPayU?.mihpayid || 'N/A',
//         payUStatus: matchedPayU?.status || 'N/A',
//         setPpcId: user.setPpcId || false,
//         assignedPhoneNumber: user.setPpcId ? user.assignedPhoneNumber || null : null,
//         setPpcIdAssignedAt: user.setPpcIdAssignedAt || null,
//         followUpDate,
//         adminName
//       });
//     }

//     const final = incompleteUsers.filter(user => user.required === 'no');

//     res.status(200).json({
//       success: true,
//       message: 'Pending properties (incomplete) fetched successfully with full plan details!',
//       total: final.length,
//       users: final
//     });
//   } catch (error) {
//     console.error('/properties/pending error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching pending properties.',
//       error: error.message
//     });
//   }
// });




router.get('/properties/pending-all', async (req, res) => {
  try {
    const users = await AddModel.find({ status: 'incomplete' });
    const allProperties = await AddModel.find({});
    const plans = await PricingPlans.find();
    const payuData = await PaymentPayU.find({ status: 'success' });

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const adsCountByUser = allProperties.reduce((acc, property) => {
      const phone = property.phoneNumber;
      acc[phone] = (acc[phone] || 0) + 1;
      return acc;
    }, {});

    const incompleteUsers = [];

    for (const user of users) {
      const phone = user.phoneNumber || '';
      const escapedPhone = escapeRegExp(phone);

      const isComplete = requiredFields.every(field =>
        user[field] !== undefined &&
        user[field] !== null &&
        String(user[field]).trim() !== ''
      );

      const userPlans = plans
        .filter(plan =>
          Array.isArray(plan.phoneNumber)
            ? plan.phoneNumber.includes(phone)
            : plan.phoneNumber === phone
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const matchedPlan = userPlans.find(plan => {
        if (plan.name?.toLowerCase() === 'free') return true;
        return payuData.some(p =>
          new RegExp(escapedPhone + '$').test(p.phone) &&
          p.planName === plan.name
        );
      });

      const matchedPayU = payuData.find(p =>
        new RegExp(escapedPhone + '$').test(p.phone)
      );

      let planCreatedAt = 'N/A';
      let planExpiryDate = 'N/A';
      let remainingDays = 'N/A';

      if (matchedPlan?.createdAt && matchedPlan?.durationDays) {
        const created = new Date(matchedPlan.createdAt);
        const expiry = new Date(created.getTime() + matchedPlan.durationDays * 86400000);
        const now = new Date();
        planCreatedAt = created.toLocaleDateString();
        planExpiryDate = expiry.toLocaleDateString();
        remainingDays = Math.max(Math.ceil((expiry - now) / 86400000), 0);
      }

      if (!isComplete) {
        incompleteUsers.push({
          ...user._doc,
          required: 'no',
          adsUsed: adsCountByUser[phone] || 0,
          planName: matchedPlan?.name || 'N/A',
          packageType: matchedPlan?.packageType || 'N/A',
          planDuration: matchedPlan?.durationDays || 'N/A',
          planCreatedAt,
          planExpiryDate,
          remainingDays,
          transactionId: matchedPayU?.txnid || 'N/A',
          paymentId: matchedPayU?.mihpayid || 'N/A',
          payUStatus: matchedPayU?.status || 'N/A',
          setPpcId: user.setPpcId || false,
          assignedPhoneNumber: user.setPpcId ? user.assignedPhoneNumber || null : null,
          setPpcIdAssignedAt: user.setPpcIdAssignedAt || null,
          followUpDate: null,
          adminName: null
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Pending properties with incomplete fields fetched successfully.',
      total: incompleteUsers.length,
      users: incompleteUsers
    });
  } catch (error) {
    console.error('/properties/pending error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending properties.',
      error: error.message
    });
  }
});

router.get('/properties/pre-approved-all', async (req, res) => {
  try {
    const properties = await AddModel.find({ status: 'complete' }).lean();
    const allPlans = await PricingPlans.find();
    const allPayments = await PaymentPayU.find();
    const allAds = await AddModel.find();
    const otpVerifiedUsers = await UserLogin.find({ otpStatus: 'verified' });
    const directVerifiedUsers = await UserLogin.find({ directVerified: true });

    // Create map of verified users
    const userStatusMap = new Map();

    otpVerifiedUsers.forEach(user => userStatusMap.set(user.phone, 'verified'));
    directVerifiedUsers.forEach(user => {
      if (!userStatusMap.has(user.phone)) {
        userStatusMap.set(user.phone, 'direct');
      }
    });

    const verifiedPhones = new Set(userStatusMap.keys());

    const adsCountByPhone = allAds.reduce((acc, ad) => {
      acc[ad.phoneNumber] = (acc[ad.phoneNumber] || 0) + 1;
      return acc;
    }, {});

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const enrichedProperties = await Promise.all(properties.map(async (property) => {
      const isComplete = requiredFields.every(field => {
        const value = property[field];
        return value !== undefined && value !== null && String(value).trim() !== '';
      });

      const phone = property.phoneNumber;
      const ppcId = property.ppcId;

      // Set verification info
      const otpStatus = userStatusMap.get(phone) || 'not verified';
      const isVerifiedUser = verifiedPhones.has(phone);
      const createdBy = !isVerifiedUser && otpStatus === 'not verified' ? 'Admin' : 'User';

      // Find matching plan
      let selectedPlan = null;
      for (const plan of allPlans) {
        if (!Array.isArray(plan.phoneNumbers)) continue;

        for (const pn of plan.phoneNumbers) {
          if (pn.number === phone && pn.ppcId === ppcId) {
            const createdDate = pn.createdAt || null;
            let expireDate = null;
            if (createdDate && plan.durationDays) {
              const created = new Date(createdDate);
              expireDate = new Date(created.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
            }

            selectedPlan = {
              planName: plan.name || 'N/A',
              planDuration: plan.durationDays || 'N/A',
              packageType: plan.packageType || 'N/A',
              planCreatedAt: createdDate ? new Date(createdDate).toLocaleDateString() : 'N/A',
              planExpiryDate: expireDate ? new Date(expireDate).toLocaleDateString() : 'N/A',
            };
            break;
          }
        }

        if (selectedPlan) break;
      }

      // Payment matching
      const matchedPayment = allPayments.find(payment =>
        payment.phone === phone && String(payment.ppcId) === String(ppcId)
      );

      const paymentInfo = matchedPayment
        ? {
            payUStatus: matchedPayment.payUStatus || 'N/A',
            payustatususer: matchedPayment.payustatususer || 'N/A',
            paymentId: matchedPayment.paymentId || 'N/A',
            transactionId: matchedPayment.transactionId || 'N/A',
            payUCreatedAt: matchedPayment.createdAt || null,
            payUUpdatedAt: matchedPayment.updatedAt || null
          }
        : {
            payUStatus: 'N/A',
            payustatususer: 'N/A',
            paymentId: 'N/A',
            transactionId: 'N/A',
            payUCreatedAt: null,
            payUUpdatedAt: null
          };

      return {
        ...property,
        required: isComplete ? 'yes' : 'no',
        otpStatus,
        isVerifiedUser,
        createdBy,
        adsCount: adsCountByPhone[phone] || 0,
        setPpcId: property.setPpcId || false,
        assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
        setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
        ...(selectedPlan || {
          planName: 'N/A',
          planDuration: 'N/A',
          packageType: 'N/A',
          planCreatedAt: 'N/A',
          planExpiryDate: 'N/A'
        }),
        ...paymentInfo
      };
    }));

    const preApproved = enrichedProperties.filter(p => p.required === 'yes');

    res.status(200).json({
      message: 'Pre-approved properties with full data fetched successfully!',
      users: preApproved
    });

  } catch (error) {
    console.error('Error in /properties/pre-approved:', error);
    res.status(500).json({
      message: 'Error fetching pre-approved properties.',
      error: error.message
    });
  }
});



// router.get('/properties/pre-approved', async (req, res) => {
//   try {
//     const users = await AddModel.find({ status: 'complete' });
//     const plans = await PricingPlans.find();

//     // ? Step 1: Get all properties and compute ad count per phoneNumber
//     const allProperties = await AddModel.find({});
//     const adsCountByUser = allProperties.reduce((acc, property) => {
//       const phone = property.phoneNumber;
//       acc[phone] = (acc[phone] || 0) + 1;
//       return acc;
//     }, {});

//     const requiredFields = [
//       'propertyMode', 'propertyType', 'price',
//       'totalArea', 'areaUnit',
//       'salesType', 'postedBy'
//     ];

//     const completeUsers = users.map((user) => {
//       const isComplete = requiredFields.every((field) => {
//         const value = user[field];
//         return value !== undefined && value !== null && String(value).trim() !== '';
//       });

//       const matchedPlan = plans.find(plan =>
//         Array.isArray(plan.phoneNumber)
//           ? plan.phoneNumber.includes(user.phoneNumber)
//           : plan.phoneNumber === user.phoneNumber
//       );

//       let planCreatedAt = 'N/A';
//       let planExpiryDate = 'N/A';

//       if (matchedPlan && matchedPlan.createdAt && matchedPlan.durationDays) {
//         const expiryDate = new Date(matchedPlan.createdAt).getTime() + matchedPlan.durationDays * 24 * 60 * 60 * 1000;
//         planCreatedAt = new Date(matchedPlan.createdAt).toLocaleDateString();
//         planExpiryDate = new Date(expiryDate).toLocaleDateString();
//       }

//       return {
//         ...user._doc,
//         required: isComplete ? "yes" : "no",
//         planName: matchedPlan?.name || 'N/A',
//         planCreatedAt,
//         planExpiryDate,
//         packageType: matchedPlan?.packageType || 'N/A',
//         planDuration: matchedPlan?.durationDays || 'N/A',
//         adsCount: adsCountByUser[user.phoneNumber] || 0,  // ? Total ads count by user
//         setPpcId: user.setPpcId || false,                 // ? Set PPC ID status
//         assignedPhoneNumber: user.setPpcId ? user.assignedPhoneNumber || null : null, // ? Assigned user
//         setPpcIdAssignedAt: user.setPpcIdAssignedAt || null // ? Assigned date
//       };
//     }).filter(user => user.required === "yes");

//     res.status(200).json({
//       message: "Pre-approved properties with complete required fields and plan info fetched successfully!",
//       users: completeUsers
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error fetching pre-approved properties.',
//       error: error.message
//     });
//   }
// });



router.get('/properties/pre-approved', async (req, res) => {
  try {
    const properties = await AddModel.find({ status: 'complete' });
    const allPlans = await PricingPlans.find();
    const allPayments = await PaymentPayU.find();
    const allAds = await AddModel.find();

    const adsCountByPhone = allAds.reduce((acc, prop) => {
      const phone = prop.phoneNumber;
      acc[phone] = (acc[phone] || 0) + 1;
      return acc;
    }, {});

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const enrichedProperties = await Promise.all(
      properties.map(async (property) => {
        const isComplete = requiredFields.every(field => {
          const value = property[field];
          return value !== undefined && value !== null && String(value).trim() !== '';
        });

        const userPhone = property.phoneNumber;
        const ppcId = property.ppcId;

        let selectedPlan = null;
        let matchedPayment = null;

        

    for (const plan of allPlans) {
  if (!Array.isArray(plan.phoneNumbers)) continue;

  for (const pn of plan.phoneNumbers) {
    if (pn.number === userPhone && pn.ppcId === ppcId) {
      // Determine expireDate based on createdAt and durationDays
      let expireDate = null;
      let createdDate = pn.createdAt || null;

      if (!expireDate && createdDate && plan.durationDays) {
        const created = new Date(createdDate);
        expireDate = new Date(created.getTime() + plan.durationDays * 24 * 60 * 60 * 1000); // add days
      }

      selectedPlan = {
        number: pn.number,
        ppcId: pn.ppcId,
        expireDate: pn.expireDate || expireDate || null,
        createdAt: createdDate,
        expiryMessage: pn.expiryMessage || '',
        planName: plan.name || '',
        planDuration: plan.durationDays || '',
        packageType: plan.packageType || ''
      };

      matchedPayment = allPayments.find(payment =>
        payment.phone === pn.number && payment.ppcId === pn.ppcId
      );

      if (matchedPayment) {
        selectedPlan.paymentData = matchedPayment;
      }

      break;
    }
  }

  if (selectedPlan) break;
}

        return {
          ...property._doc,
          required: isComplete ? "yes" : "no",
          adsCount: adsCountByPhone[userPhone] || 0,
          setPpcId: property.setPpcId || false,
          assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
          setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
          ...(selectedPlan ? selectedPlan : {})  // inject matched plan fields flat
        };
      })
    );

    const preApproved = enrichedProperties.filter(p => p.required === "yes");

    res.status(200).json({
      message: "Pre-approved properties with full plan and payment data fetched successfully!",
      users: preApproved
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error fetching pre-approved properties.',
      error: error.message
    });
  }
});
router.get('/properties/pre-approved', async (req, res) => {
  try {
    const properties = await AddModel.find({ status: 'complete' }).lean();
    const allPlans = await PricingPlans.find();
    const allPayments = await PaymentPayU.find();
    const allAds = await AddModel.find();
    const otpUsers = await UserLogin.find({ otpStatus: 'verified' });
    const directUsers = await UserLogin.find({ directVerified: true });

    // Build a map of verified phone numbers
    const userStatusMap = new Map();
    otpUsers.forEach(user => userStatusMap.set(user.phone, 'verified'));
    directUsers.forEach(user => {
      if (!userStatusMap.has(user.phone)) {
        userStatusMap.set(user.phone, 'direct');
      }
    });

    const verifiedPhones = new Set(userStatusMap.keys());

    // Count ads by phone number
    const adsCountByPhone = allAds.reduce((acc, ad) => {
      acc[ad.phoneNumber] = (acc[ad.phoneNumber] || 0) + 1;
      return acc;
    }, {});

    const requiredFields = [
      'propertyMode', 'propertyType', 'price',
      'totalArea', 'areaUnit', 'salesType', 'postedBy'
    ];

    const enrichedProperties = await Promise.all(properties.map(async (property) => {
      const isComplete = requiredFields.every(field => {
        const value = property[field];
        return value !== undefined && value !== null && String(value).trim() !== '';
      });

      const userPhone = property.phoneNumber;
      const ppcId = property.ppcId;

      let selectedPlan = null;
      let matchedPayment = null;

      for (const plan of allPlans) {
        if (!Array.isArray(plan.phoneNumbers)) continue;

        for (const pn of plan.phoneNumbers) {
          if (pn.number === userPhone && pn.ppcId === ppcId) {
            // Calculate expiry date
            let expireDate = null;
            let createdDate = pn.createdAt || null;

            if (!expireDate && createdDate && plan.durationDays) {
              const created = new Date(createdDate);
              expireDate = new Date(created.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
            }

            selectedPlan = {
              number: pn.number,
              ppcId: pn.ppcId,
              expireDate: pn.expireDate || expireDate || null,
              createdAt: createdDate,
              expiryMessage: pn.expiryMessage || '',
              planName: plan.name || '',
              planDuration: plan.durationDays || '',
              packageType: plan.packageType || ''
            };

            matchedPayment = allPayments.find(payment =>
              payment.phone === pn.number && payment.ppcId === pn.ppcId
            );

            if (matchedPayment) {
              selectedPlan.paymentData = matchedPayment;
            }

            break;
          }
        }

        if (selectedPlan) break;
      }

      // Determine verification status
      const otpStatus = userStatusMap.get(userPhone) === 'verified' ? 'verified' : 'not verified';
      const isVerifiedUser = verifiedPhones.has(userPhone);
      const createdBy = isVerifiedUser ? 'User' : 'Admin';

      // Prepare PayU data
      const paymentInfo = matchedPayment
        ? {
            payUStatus: matchedPayment.payUStatus || 'N/A',
            payustatususer: matchedPayment.payustatususer || 'N/A',
            paymentId: matchedPayment.paymentId || 'N/A',
            transactionId: matchedPayment.transactionId || 'N/A',
            payUCreatedAt: matchedPayment.createdAt || null,
            payUUpdatedAt: matchedPayment.updatedAt || null
          }
        : {
            payUStatus: 'N/A',
            payustatususer: 'N/A',
            paymentId: 'N/A',
            transactionId: 'N/A',
            payUCreatedAt: null,
            payUUpdatedAt: null
          };

      return {
        ...property,
        required: isComplete ? 'yes' : 'no',
        otpStatus,
        isVerifiedUser,
        createdBy,
        adsCount: adsCountByPhone[userPhone] || 0,
        setPpcId: property.setPpcId || false,
        assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
        setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
        planName: selectedPlan?.planName || 'N/A',
        planDuration: selectedPlan?.planDuration || 'N/A',
        packageType: selectedPlan?.packageType || 'N/A',
        planCreatedAt: selectedPlan?.createdAt
          ? new Date(selectedPlan.createdAt).toLocaleDateString()
          : 'N/A',
        planExpiryDate: selectedPlan?.expireDate
          ? new Date(selectedPlan.expireDate).toLocaleDateString()
          : 'N/A',
        ...paymentInfo
      };
    }));

    // Only include fully complete ones
    const preApproved = enrichedProperties.filter(p => p.required === 'yes');

    res.status(200).json({
      message: 'Pre-approved properties with full plan and payment data fetched successfully!',
      users: preApproved
    });

  } catch (error) {
    console.error('Error in /properties/pre-approved:', error);
    res.status(500).json({
      message: 'Error fetching pre-approved properties.',
      error: error.message
    });
  }
});













// router.get('/properties/pre-approved', async (req, res) => {
//   try {
//     // Fetch all complete properties
//     const properties = await AddModel.find({ status: 'complete' });

//     // Fetch all plans and all payments
//     const allPlans = await PricingPlans.find();
//     const allPayments = await PaymentPayU.find();

//     // Fetch all ads for count calculation
//     const allAds = await AddModel.find();

//     // Count how many ads per phone number
//     const adsCountByPhone = allAds.reduce((acc, prop) => {
//       const phone = prop.phoneNumber;
//       acc[phone] = (acc[phone] || 0) + 1;
//       return acc;
//     }, {});

//     // Required fields to consider property complete
//     const requiredFields = [
//       'propertyMode', 'propertyType', 'price',
//       'totalArea', 'areaUnit', 'salesType', 'postedBy'
//     ];

//     // Enrich properties with plan and payment data
//     const enrichedProperties = await Promise.all(
//       properties.map(async (property) => {
//         // Check if all required fields are present and non-empty
//         const isComplete = requiredFields.every(field => {
//           const value = property[field];
//           return value !== undefined && value !== null && String(value).trim() !== '';
//         });

//         const userPhone = property.phoneNumber;
//         const ppcId = property.ppcId;

//         let selectedPlan = null;
//         let matchedPayment = null;

//         // Find matching plan & payment for this property
//         for (const plan of allPlans) {
//           if (!Array.isArray(plan.phoneNumbers)) continue;

//           for (const pn of plan.phoneNumbers) {
//             if (pn.number === userPhone && pn.ppcId === ppcId) {
//               // Calculate expire date if not set
//               let expireDate = pn.expireDate || null;
//               let createdDate = pn.createdAt || null;
//               if (!expireDate && createdDate && plan.durationDays) {
//                 const created = new Date(createdDate);
//                 expireDate = new Date(created.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
//               }

//               selectedPlan = {
//                 number: pn.number,
//                 ppcId: pn.ppcId,
//                 expireDate: expireDate,
//                 createdAt: createdDate,
//                 expiryMessage: pn.expiryMessage || '',
//                 planName: plan.name || '',
//                 planDuration: plan.durationDays || '',
//                 packageType: plan.packageType || ''
//               };

//               // Find matching payment for phone and ppcId
//               // matchedPayment = allPayments.find(payment =>
//               //   payment.phone === pn.number && payment.ppcId === pn.ppcId
//               // );

//               if (matchedPayment) {
//                 selectedPlan.paymentData = matchedPayment;

//                 // Flatten payment fields at top level
//                 selectedPlan.mihpayid = matchedPayment.mihpayid || null;
//                 selectedPlan.txnid = matchedPayment.txnid || null;
//                 selectedPlan.paymentStatus = matchedPayment.status || null;
//                 selectedPlan.payustatususer = matchedPayment.payustatususer || null;
//                 selectedPlan.payUdate = matchedPayment.payUdate || null;
//                 selectedPlan.amount = matchedPayment.amount || null;
//                 selectedPlan.productinfo = matchedPayment.productinfo || null;
//                 selectedPlan.firstname = matchedPayment.firstname || null;
//                 selectedPlan.email = matchedPayment.email || null;
//               } else {
//                 console.log(`No payment found for phone ${pn.number} and ppcId ${pn.ppcId}`);
//               }

//               break; // Break inner loop once match found
//             }
//           }

//           if (selectedPlan) break; // Break outer loop once match found
//         }

//         return {
//           ...property._doc,
//           required: isComplete ? "yes" : "no",
//           adsCount: adsCountByPhone[userPhone] || 0,
//           setPpcId: property.setPpcId || false,
//           assignedPhoneNumber: property.setPpcId ? property.assignedPhoneNumber || null : null,
//           setPpcIdAssignedAt: property.setPpcIdAssignedAt || null,
//           ...(selectedPlan ? selectedPlan : {}) // Inject plan + payment fields
//         };
//       })
//     );

//     // Filter only complete properties
//     const preApproved = enrichedProperties.filter(p => p.required === "yes");

//     // Debug: Log enriched properties count
//     console.log(`Total properties: ${properties.length}, Pre-approved: ${preApproved.length}`);

//     // Send response
//     res.status(200).json({
//       message: "Pre-approved properties with full plan and payment data fetched successfully!",
//       users: preApproved
//     });

//   } catch (error) {
//     console.error("Error in /properties/pre-approved:", error);
//     res.status(500).json({
//       message: 'Error fetching pre-approved properties.',
//       error: error.message
//     });
//   }
// });







router.get('/approved-properties-count', async (req, res) => {
  try {
    // Count documents where propertyApproved is 'yes'
    const count = await AddModel.countDocuments({ propertyApproved: "yes" });

    res.status(200).json({ approvedProperties: count });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});





router.get('/get-user-activity-counts', async (req, res) => {
  try {
    const interestMap = new Map();
    const contactMap = new Map();
    const favoriteMap = new Map();
    const photoRequestMap = new Map();
    const offerMap = new Map();
    const calledMap = new Map();
    const viewedMap = new Map();

    // Normalize any phone number to its last 10 digits so every collection
    // (which may store +91 / 91 prefixes differently) maps to one key.
    // This also prevents the same user appearing as two separate rows.
    const cleanPhone = (p) =>
      typeof p === 'string' ? p.replace(/\D/g, '').slice(-10) : '';

    // Load interestRequests
    const interestProperties = await AddModel.find({ interestRequests: { $exists: true, $ne: [] } });
    interestProperties.forEach(property => {
      property.interestRequests.forEach(req => {
        const phone = cleanPhone(req.phoneNumber);
        if (phone.length === 10) {
          interestMap.set(phone, (interestMap.get(phone) || 0) + 1);
        }
      });
    });

    // Load contactRequests
    const contactProperties = await AddModel.find({ contactRequests: { $exists: true, $ne: [] } });
    contactProperties.forEach(property => {
      property.contactRequests.forEach(req => {
        const phone = cleanPhone(req.phoneNumber);
        if (phone.length === 10) {
          contactMap.set(phone, (contactMap.get(phone) || 0) + 1);
        }
      });
    });

    // Load favoriteRequests
    const favoriteProperties = await AddModel.find({ favoriteRequests: { $exists: true, $ne: [] } });
    favoriteProperties.forEach(property => {
      property.favoriteRequests.forEach(req => {
        const phone = cleanPhone(req.phoneNumber);
        if (phone.length === 10) {
          favoriteMap.set(phone, (favoriteMap.get(phone) || 0) + 1);
        }
      });
    });

    // Load photo requests
    const photoRequests = await PhotoRequest.find();
    photoRequests.forEach(req => {
      const phone = cleanPhone(req.phoneNumber);
      if (phone.length === 10) {
        photoRequestMap.set(phone, (photoRequestMap.get(phone) || 0) + 1);
      }
    });

    // Load offer requests
    const offers = await Offer.find();
    offers.forEach(req => {
      const phone = cleanPhone(req.phoneNumber);
      if (phone.length === 10) {
        offerMap.set(phone, (offerMap.get(phone) || 0) + 1);
      }
    });

    // Called list counts — each CallUserList doc is one "call" click by a user.
    const calledDocs = await CallUserList.find({ isDeleted: { $ne: true } }, 'phoneNumber');
    calledDocs.forEach(doc => {
      const phone = cleanPhone(doc.phoneNumber);
      if (phone.length === 10) calledMap.set(phone, (calledMap.get(phone) || 0) + 1);
    });

    // Viewed property counts — length of each user's viewedProperties list.
    const userViewsDocs = await UserViewsModel.find({}, 'phoneNumber viewedProperties');
    userViewsDocs.forEach(doc => {
      const phone = cleanPhone(doc.phoneNumber);
      if (phone.length === 10) viewedMap.set(phone, (doc.viewedProperties || []).length);
    });

    // Combine all unique phone numbers — now also includes users whose only
    // activity is calls (calledMap) or property views (viewedMap).
    const allPhoneNumbers = new Set([
      ...interestMap.keys(),
      ...contactMap.keys(),
      ...favoriteMap.keys(),
      ...photoRequestMap.keys(),
      ...offerMap.keys(),
      ...calledMap.keys(),
      ...viewedMap.keys()
    ]);

    // Every key is already a clean 10-digit number.
    const phoneArray = Array.from(allPhoneNumbers).filter(p => p && p.length === 10);
    const formattedPhones = phoneArray;

    // Fetch latest loginDate and updateDate from UserLogin
    const userLogins = await UserLogin.aggregate([
      {
        $match: {
          phone: { $in: formattedPhones }
        }
      },
      {
        $sort: { loginDate: -1, updatedAt: -1 }
      },
      {
        $group: {
          _id: "$phone",
          loginDate: { $first: "$loginDate" },
          updateDate: { $first: "$updatedAt" }
        }
      }
    ]);

    const loginMap = new Map();
    userLogins.forEach(u => {
      loginMap.set(cleanPhone(u._id), {
        loginDate: u.loginDate,
        updateDate: u.updateDate
      });
    });

    // Final result build
    const result = phoneArray.map(phone => {
      const loginInfo = loginMap.get(phone) || {};

      return {
        phoneNumber: phone,
        interestCount: interestMap.get(phone) || 0,
        contactCount: contactMap.get(phone) || 0,
        favoriteCount: favoriteMap.get(phone) || 0,
        photoRequestCount: photoRequestMap.get(phone) || 0,
        offerCount: offerMap.get(phone) || 0,
        calledListCount: calledMap.get(phone) || 0,
        viewedPropertyCount: viewedMap.get(phone) || 0,
        loginDate: loginInfo.loginDate || null,
        updateDate: loginInfo.updateDate || null
      };
    });

    return res.status(200).json({
      message: "Activity counts fetched successfully",
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error fetching activity counts",
      error: error.message
    });
  }
});


router.get('/get-user-activity-counts-no-user', async (req, res) => {
  try {
    const interestMap = new Map();
    const contactMap = new Map();
    const favoriteMap = new Map();
    const photoRequestMap = new Map();
    const offerMap = new Map();

    // Load interestRequests
    const interestProperties = await AddModel.find({ interestRequests: { $exists: true, $ne: [] } });
    interestProperties.forEach(property => {
      property.interestRequests.forEach(req => {
        const phone = req.phoneNumber;
        if (phone) {
          interestMap.set(phone, (interestMap.get(phone) || 0) + 1);
        }
      });
    });

    // Load contactRequests
    const contactProperties = await AddModel.find({ contactRequests: { $exists: true, $ne: [] } });
    contactProperties.forEach(property => {
      property.contactRequests.forEach(req => {
        const phone = req.phoneNumber;
        if (phone) {
          contactMap.set(phone, (contactMap.get(phone) || 0) + 1);
        }
      });
    });

    // Load favoriteRequests
    const favoriteProperties = await AddModel.find({ favoriteRequests: { $exists: true, $ne: [] } });
    favoriteProperties.forEach(property => {
      property.favoriteRequests.forEach(req => {
        const phone = req.phoneNumber;
        if (phone) {
          favoriteMap.set(phone, (favoriteMap.get(phone) || 0) + 1);
        }
      });
    });

    // Load photo requests
    const photoRequests = await PhotoRequest.find();
    photoRequests.forEach(req => {
      const phone = req.phoneNumber;
      if (phone) {
        photoRequestMap.set(phone, (photoRequestMap.get(phone) || 0) + 1);
      }
    });

    // Load offer requests
    const offers = await Offer.find();
    offers.forEach(req => {
      const phone = req.phoneNumber;
      if (phone) {
        offerMap.set(phone, (offerMap.get(phone) || 0) + 1);
      }
    });

    // Combine all unique phone numbers from actions
    const allPhoneNumbers = new Set([
      ...interestMap.keys(),
      ...contactMap.keys(),
      ...favoriteMap.keys(),
      ...photoRequestMap.keys(),
      ...offerMap.keys()
    ]);

    const phoneArray = Array.from(allPhoneNumbers).filter(Boolean);
    const formattedPhones = phoneArray
      .map(phone => (typeof phone === 'string' ? phone.replace(/\D/g, '').slice(-10) : ''))
      .filter(p => p.length === 10);

    // Fetch login info
    const userLogins = await UserLogin.aggregate([
      {
        $match: {}
      },
      {
        $sort: { loginDate: -1, updatedAt: -1 }
      },
      {
        $group: {
          _id: "$phone",
          loginDate: { $first: "$loginDate" },
          updateDate: { $first: "$updatedAt" }
        }
      }
    ]);

    const loginMap = new Map();
    userLogins.forEach(u => {
      const cleanPhone = typeof u._id === 'string' ? u._id.replace(/\D/g, '').slice(-10) : '';
      loginMap.set(cleanPhone, {
        loginDate: u.loginDate,
        updateDate: u.updateDate
      });
    });

    // Get posted property users
    const postedPhonesRaw = await AddModel.distinct("phoneNumber");
    const postedPhones = new Set(
      postedPhonesRaw.map(p => typeof p === 'string' ? p.replace(/\D/g, '').slice(-10) : '')
    );

    // Build final activity result (posted/interacted users)
    const activityResult = formattedPhones.map(phone => {
      const loginInfo = loginMap.get(phone) || {};
      return {
        phoneNumber: phone,
        interestCount: interestMap.get(phone) || 0,
        contactCount: contactMap.get(phone) || 0,
        favoriteCount: favoriteMap.get(phone) || 0,
        photoRequestCount: photoRequestMap.get(phone) || 0,
        offerCount: offerMap.get(phone) || 0,
        loginDate: loginInfo.loginDate || null,
        updateDate: loginInfo.updateDate || null,
        hasPostedProperty: postedPhones.has(phone)
      };
    });

    // ? Get users who logged in but never posted property
    const allLoginPhones = Array.from(loginMap.keys());
    const usersWithoutPost = allLoginPhones.filter(phone => !postedPhones.has(phone));

    const noPropertyUsers = usersWithoutPost.map(phone => {
      const loginInfo = loginMap.get(phone);
      return {
        phoneNumber: phone,
        loginDate: loginInfo?.loginDate || null,
        updateDate: loginInfo?.updateDate || null,
        hasPostedProperty: false
      };
    });

    return res.status(200).json({
      message: "Activity counts fetched successfully",
      postedAndInteractedUsers: activityResult,
      usersWithoutPostedProperties: noPropertyUsers
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error fetching activity counts",
      error: error.message
    });
  }
});


router.get('/get-users-no-posted-properties', async (req, res) => {
  try {
    // Fetch all login records
    const allLogins = await UserLogin.find({}, 'phone loginDate updatedAt');

    const allPhones = allLogins.map(user => ({
      phoneNumber: user.phone,
      loginDate: user.loginDate || null,
      updateDate: user.updatedAt || null
    }));

    // Fetch all phone numbers that have posted properties
    const postedUsers = await AddModel.distinct('phoneNumber');

    // Clean and create a Set for faster lookup
    const postedSet = new Set(
      postedUsers
        .filter(p => p)
        .map(p => p.toString().replace(/\D/g, '').slice(-10))
    );

    // Filter users who have not posted any property
    const usersWithoutPosts = allPhones.filter(user => {
      const phone = user.phoneNumber;
      if (!phone) return false;
      const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
      return !postedSet.has(cleanPhone);
    });

    // Prepare final result
    const result = usersWithoutPosts.map(user => ({
      phoneNumber: user.phoneNumber,
      loginDate: user.loginDate,
      updateDate: user.updateDate,
      hasPostedProperty: false
    }));

    return res.status(200).json({
      message: 'Users without posted properties fetched successfully',
      usersWithoutPostedProperties: result
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Error fetching users without posted properties',
      error: error.message
    });
  }
});


// const getLast10Digits = (phone) =>
//   phone ? phone.toString().replace(/\D/g, "").slice(-10) : null;

// // Utility to check if a date is today
// const isToday = (date) => {
//   const now = new Date();
//   return (
//     date.getDate() === now.getDate() &&
//     date.getMonth() === now.getMonth() &&
//     date.getFullYear() === now.getFullYear()
//   );
// };

// router.get("/get-users-without-posted-properties", async (req, res) => {
//   try {
//     const logins = await UserLogin.find({}, "phone loginDate updatedAt");

//     const allUsers = logins.map((user) => ({
//       phoneNumber: getLast10Digits(user.phone),
//       loginDate: user.loginDate || null,
//       updateDate: user.updatedAt || null,
//     }));

//     const postedPhones = await AddModel.distinct("phoneNumber");
//     const postedPhoneSet = new Set(
//       postedPhones.filter(Boolean).map((p) => getLast10Digits(p))
//     );

//     const usersWithoutPosts = allUsers.filter((user) => {
//       if (!user.phoneNumber) return false;
//       return !postedPhoneSet.has(user.phoneNumber);
//     });

//     // --- Step 4A: Fetch view data ---
//     const viewData = await UserModel.find({
//       phoneNumber: {
//         $in: usersWithoutPosts.map((u) => u.phoneNumber),
//       },
//     });

//     const viewMap = new Map();
//     viewData.forEach((view) => {
//       viewMap.set(getLast10Digits(view.phoneNumber), {
//         dailyViewsCount: view.dailyViewsCount || 0,
//         lastViewDate: view.lastViewDate,
//         viewsRemaining: 30 - (view.dailyViewsCount || 0),
//       });
//     });

//     // --- Step 4B: Fetch contactRequest data ---
//     const contactData = await AddModel.find(
//       {
//         "contactRequests.phoneNumber": { $exists: true, $ne: null },
//       },
//       "contactRequests"
//     );

//     // Build contact count map
//     const contactMap = new Map();

//     for (const doc of contactData) {
//       for (const req of doc.contactRequests) {
//         const phone = getLast10Digits(req.phoneNumber);
//         if (!phone || !isToday(req.date)) continue;

//         if (!contactMap.has(phone)) {
//           contactMap.set(phone, 1);
//         } else {
//           contactMap.set(phone, contactMap.get(phone) + 1);
//         }
//       }
//     }

//     // Step 5: Construct response
//     const result = usersWithoutPosts.map((user) => {
//       const viewInfo = viewMap.get(user.phoneNumber) || {};
//       const contactsToday = contactMap.get(user.phoneNumber) || 0;
//       const contactsRemaining = 30 - contactsToday;

//       return {
//         phoneNumber: user.phoneNumber,
//         loginDate: user.loginDate,
//         updateDate: user.updateDate,
//         hasPostedProperty: false,
//         viewsToday: viewInfo.dailyViewsCount || 0,
//         viewsRemaining: viewInfo.viewsRemaining || 30,
//         contactsToday,
//         contactsRemaining,
//       };
//     });

//     return res.status(200).json({
//       message: "Users without posted properties fetched successfully",
//       usersWithoutPostedProperties: result,
//     });
//   } catch (error) {
//     console.error("API Error:", error);
//     return res.status(500).json({
//       message: "Error fetching users without posted properties",
//       error: error.message,
//     });
//   }
// });


// router.post("/submit-contact-request", async (req, res) => {
//   try {
//     const { userPhone, ppcId } = req.body;

//     if (!userPhone || !ppcId) {
//       return res.status(400).json({ message: "Missing phone or PPC ID" });
//     }

//     const cleanedPhone = getLast10Digits(userPhone);
//     const today = new Date();

//     // --- Step 1: Check contact limit ---
//     let userView = await UserModel.findOne({ phoneNumber: cleanedPhone });

//     if (userView) {
//       if (!isToday(userView.lastViewDate)) {
//         userView.dailyViewsCount = 0; // Reset count if it's a new day
//         userView.lastViewDate = today;
//       }

//       if (userView.dailyViewsCount >= 30) {
//         return res.status(429).json({ message: "Daily contact limit reached" });
//       }

//       userView.dailyViewsCount += 1;
//     } else {
//       userView = new UserModel({
//         phoneNumber: cleanedPhone,
//         dailyViewsCount: 1,
//         lastViewDate: today,
//       });
//     }

//     await userView.save();

//     // --- Step 2: Log contact request in AddModel ---
//     const property = await AddModel.findOne({ ppcId });

//     if (!property) {
//       return res.status(404).json({ message: "Property not found" });
//     }

//     if (!Array.isArray(property.contactRequests)) {
//       property.contactRequests = [];
//     }

//     property.contactRequests.push({
//       phoneNumber: cleanedPhone,
//       date: today,
//     });

//     await property.save();

//     return res.status(200).json({ message: "Contact request submitted successfully" });
//   } catch (error) {
//     console.error("Submit Contact Error:", error);
//     return res.status(500).json({
//       message: "Error submitting contact request",
//       error: error.message,
//     });
//   }
// });



router.get('/get-user-activity-counts-all', async (req, res) => {
  try {
    const interestMap = new Map();
    const contactMap = new Map();
    const favoriteMap = new Map();
    const photoRequestMap = new Map();
    const offerMap = new Map();

    // Load and group from AddModel
    const allProperties = await AddModel.find();

    allProperties.forEach(property => {
      const ownerPhone = property.phoneNumber?.replace(/\D/g, '').slice(-10);
      if (!ownerPhone || ownerPhone.length !== 10) return;

      // Interest
      if (property.interestRequests?.length) {
        interestMap.set(ownerPhone, (interestMap.get(ownerPhone) || 0) + property.interestRequests.length);
      }

      // Contact
      if (property.contactRequests?.length) {
        contactMap.set(ownerPhone, (contactMap.get(ownerPhone) || 0) + property.contactRequests.length);
      }

      // Favorite
      if (property.favoriteRequests?.length) {
        favoriteMap.set(ownerPhone, (favoriteMap.get(ownerPhone) || 0) + property.favoriteRequests.length);
      }
    });

    // Photo Requests
    const photoRequests = await PhotoRequest.find();
    for (const req of photoRequests) {
      const property = await AddModel.findById(req.propertyId).select("phoneNumber");
      const ownerPhone = property?.phoneNumber?.replace(/\D/g, '').slice(-10);
      if (ownerPhone && ownerPhone.length === 10) {
        photoRequestMap.set(ownerPhone, (photoRequestMap.get(ownerPhone) || 0) + 1);
      }
    }

    // Offer Requests
    const offers = await Offer.find();
    for (const req of offers) {
      const property = await AddModel.findById(req.propertyId).select("phoneNumber");
      const ownerPhone = property?.phoneNumber?.replace(/\D/g, '').slice(-10);
      if (ownerPhone && ownerPhone.length === 10) {
        offerMap.set(ownerPhone, (offerMap.get(ownerPhone) || 0) + 1);
      }
    }

    // ? Get all AddModel owner phoneNumbers (even those with 0 activity)
    const allOwnerPhones = Array.from(new Set(
      allProperties.map(p => p.phoneNumber?.replace(/\D/g, '').slice(-10)).filter(p => p?.length === 10)
    ));

    // Fetch login info for all owners
    const userLogins = await UserLogin.aggregate([
      {
        $match: {
          phone: { $in: allOwnerPhones }
        }
      },
      {
        $sort: { loginDate: -1, updatedAt: -1 }
      },
      {
        $group: {
          _id: "$phone",
          loginDate: { $first: "$loginDate" },
          updateDate: { $first: "$updatedAt" }
        }
      }
    ]);

    const loginMap = new Map();
    userLogins.forEach(u => {
      loginMap.set(u._id, {
        loginDate: u.loginDate,
        updateDate: u.updateDate
      });
    });

    // Final result
    const result = allOwnerPhones.map(phone => {
      const loginInfo = loginMap.get(phone) || {};
      return {
        phoneNumber: phone,
        interestCount: interestMap.get(phone) || 0,
        contactCount: contactMap.get(phone) || 0,
        favoriteCount: favoriteMap.get(phone) || 0,
        photoRequestCount: photoRequestMap.get(phone) || 0,
        offerCount: offerMap.get(phone) || 0,
        loginDate: loginInfo.loginDate || null,
        updateDate: loginInfo.updateDate || null
      };
    });

    return res.status(200).json({
      message: "Activity counts fetched successfully",
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error fetching activity counts",
      error: error.message
    });
  }
});



// Combined API: Fetch user-related data by phoneNumber
router.get("/get-user-all-data", async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // INTEREST REQUESTS
    const interestedProperties = await AddModel.find({
      "interestRequests.phoneNumber": phoneNumber,
    });
    const interestData = interestedProperties.map((property) => ({
      ppcId: property.ppcId,
      ownerPhone: property.phoneNumber,
      price: property.price,
      area: property.area,
      propertyMode: property.propertyMode,
      propertyType: property.propertyType,
      createdAt: property.createdAt,
    }));

    // CONTACT REQUESTS
    const contactProperties = await AddModel.find({
      "contactRequests.phoneNumber": phoneNumber,
    });
    const contactData = contactProperties.map((property) => ({
      ppcId: property.ppcId,
      ownerPhone: property.phoneNumber,
      price: property.price,
      area: property.area,
      propertyMode: property.propertyMode,
      propertyType: property.propertyType,
      createdAt: property.createdAt,
    }));

    // FAVORITE REQUESTS
    const favoriteProperties = await AddModel.find({
      "favoriteRequests.phoneNumber": phoneNumber,
    });
    const favoriteData = favoriteProperties.map((property) => ({
      ppcId: property.ppcId,
      ownerPhone: property.phoneNumber,
      price: property.price,
      area: property.area,
      propertyMode: property.propertyMode,
      propertyType: property.propertyType,
      createdAt: property.createdAt,
    }));

    // OFFERS
    const offerData = await Offer.find({ phoneNumber });

    // PHOTO REQUESTS
    const photoRequestData = await PhotoRequest.find({ phoneNumber });

    return res.status(200).json({
      interestData,
      contactData,
      favoriteData,
      offerData,
      photoRequestData,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});



router.get("/fetch-user-all-datas", async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Sanitize phone number (get last 10 digits if needed)
    const cleanedPhone = phoneNumber.replace(/\D/g, "").slice(-10);

    // INTEREST REQUESTS
    const interestedProperties = await AddModel.find({
      "interestRequests.phoneNumber": cleanedPhone,
    });
    const interestData = interestedProperties.flatMap((property) =>
      property.interestRequests
        .filter((req) => req.phoneNumber === cleanedPhone)
        .map(() => ({
          ppcId: property.ppcId,
          ownerPhone: property.phoneNumber,
          price: property.price,
          area: property.area,
          city: property.city,
          propertyMode: property.propertyMode,
          propertyType: property.propertyType,
          createdAt: property.createdAt,
        }))
    );

    // CONTACT REQUESTS
    const contactProperties = await AddModel.find({
      "contactRequests.phoneNumber": cleanedPhone,
    });
    const contactData = contactProperties.flatMap((property) =>
      property.contactRequests
        .filter((req) => req.phoneNumber === cleanedPhone)
        .map(() => ({
          ppcId: property.ppcId,
          ownerPhone: property.phoneNumber,
          price: property.price,
          area: property.area,
          city: property.city,
          propertyMode: property.propertyMode,
          propertyType: property.propertyType,
          createdAt: property.createdAt,
        }))
    );

    // FAVORITE REQUESTS
    const favoriteProperties = await AddModel.find({
      "favoriteRequests.phoneNumber": cleanedPhone,
    });
    const favoriteData = favoriteProperties.flatMap((property) =>
      property.favoriteRequests
        .filter((req) => req.phoneNumber === cleanedPhone)
        .map(() => ({
          ppcId: property.ppcId,
          ownerPhone: property.phoneNumber,
          price: property.price,
          area: property.area,
          city: property.city,
          propertyMode: property.propertyMode,
          propertyType: property.propertyType,
          createdAt: property.createdAt,
        }))
    );

    // OFFERS
    const offerData = await Offer.find({ phoneNumber: cleanedPhone });

    // PHOTO REQUESTS
    const photoRequestData = await PhotoRequest.find({ phoneNumber: cleanedPhone });

    // HELP REQUESTS
    const helpProperties = await AddModel.find({
      "helpRequests.phoneNumber": cleanedPhone,
    });
    const helpRequestData = helpProperties.flatMap((property) =>
      property.helpRequests
        .filter((req) => req.phoneNumber === cleanedPhone)
        .map(() => ({
          ppcId: property.ppcId,
          ownerPhone: property.phoneNumber,
          price: property.price,
          area: property.area,
          city: property.city,
          propertyMode: property.propertyMode,
          propertyType: property.propertyType,
          createdAt: property.createdAt,
        }))
    );

    // REPORT PROPERTY
    const reportProperties = await AddModel.find({
      "reportProperty.phoneNumber": cleanedPhone,
    });
    const reportData = reportProperties.flatMap((property) =>
      property.reportProperty
        .filter((req) => req.phoneNumber === cleanedPhone)
        .map(() => ({
          ppcId: property.ppcId,
          ownerPhone: property.phoneNumber,
          price: property.price,
          area: property.area,
          city: property.city,
          propertyMode: property.propertyMode,
          propertyType: property.propertyType,
          createdAt: property.createdAt,
        }))
    );

    // VIEWED PROPERTIES
    const userViews = await UserViewsModel.findOne({ phoneNumber: cleanedPhone });
    const viewedPpcIds = userViews?.viewedProperties.map((v) => v.ppcId) || [];

    const viewedProperties = await AddModel.find(
      { ppcId: { $in: viewedPpcIds } },
      "ppcId phoneNumber price area city propertyType propertyMode createdAt"
    );

    const viewedData = viewedProperties.map((p) => ({
      ppcId: p.ppcId,
      ownerPhone: p.phoneNumber,
      price: p.price,
      area: p.area,
      city: p.city,
      propertyType: p.propertyType,
      propertyMode: p.propertyMode,
      createdAt: p.createdAt,
    }));

    return res.status(200).json({
      message: "User-related data fetched successfully",
      data: {
        interestData,
        contactData,
        favoriteData,
        offerData,
        photoRequestData,
        helpRequestData,
        reportData,
        viewedData,
      },
    });
  } catch (error) {
    console.error("Error in /get-user-all-data:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});




// router.get('/get-user-no-complete-activity', async (req, res) => {
//   try {
//     // Initialize activity maps
//     const interestMap = new Map();
//     const contactMap = new Map();
//     const favoriteMap = new Map();
//     const photoRequestMap = new Map();
//     const offerMap = new Map();
//     const helpRequestMap = new Map();
//     const reportMap = new Map();
//     const viewMap = new Map();

//     // ----------------------------- //
//     // Load Interests
//     const interestProps = await AddModel.find({ interestRequests: { $exists: true, $ne: [] } });
//     interestProps.forEach(p => {
//       p.interestRequests.forEach(r => {
//         const phone = r.phoneNumber;
//         if (phone) interestMap.set(phone, (interestMap.get(phone) || 0) + 1);
//       });
//     });

//     // Load Contact Requests
//     const contactProps = await AddModel.find({ contactRequests: { $exists: true, $ne: [] } });
//     contactProps.forEach(p => {
//       p.contactRequests.forEach(r => {
//         const phone = r.phoneNumber;
//         if (phone) contactMap.set(phone, (contactMap.get(phone) || 0) + 1);
//       });
//     });

//     // Load Favorite Requests
//     const favoriteProps = await AddModel.find({ favoriteRequests: { $exists: true, $ne: [] } });
//     favoriteProps.forEach(p => {
//       p.favoriteRequests.forEach(r => {
//         const phone = r.phoneNumber;
//         if (phone) favoriteMap.set(phone, (favoriteMap.get(phone) || 0) + 1);
//       });
//     });

//     // Load Photo Requests
//     const photoRequests = await PhotoRequest.find();
//     photoRequests.forEach(r => {
//       const phone = r.phoneNumber;
//       if (phone) photoRequestMap.set(phone, (photoRequestMap.get(phone) || 0) + 1);
//     });

//     // Load Offer Requests
//     const offers = await Offer.find();
//     offers.forEach(r => {
//       const phone = r.phoneNumber;
//       if (phone) offerMap.set(phone, (offerMap.get(phone) || 0) + 1);
//     });

//     // Load Help Requests
//     const helpProps = await AddModel.find({ "helpRequests.0": { $exists: true } });
//     helpProps.forEach(p => {
//       p.helpRequests.forEach(r => {
//         const phone = r.phoneNumber;
//         if (phone) helpRequestMap.set(phone, (helpRequestMap.get(phone) || 0) + 1);
//       });
//     });

//     // Load Property Reports
//     const reportProps = await AddModel.find({ reportProperty: { $exists: true, $ne: [] } });
//     reportProps.forEach(p => {
//       p.reportProperty.forEach(r => {
//         const phone = r.phoneNumber;
//         if (phone) reportMap.set(phone, (reportMap.get(phone) || 0) + 1);
//       });
//     });

//     // Load Views
//     const allUserViews = await UserViewsModel.find();
//     const allPpcIds = [...new Set(allUserViews.flatMap(u => u.viewedProperties.map(v => v.ppcId)))];

//     const properties = await AddModel.find(
//       { ppcId: { $in: allPpcIds } },
//       "ppcId price propertyType propertyMode city area totalArea areaUnit ownership phoneNumber"
//     );

//     allUserViews.forEach(user => {
//       const views = user.viewedProperties.map(v => {
//         const prop = properties.find(p => p.ppcId === v.ppcId);
//         return prop
//           ? {
//               ppcId: prop.ppcId,
//               city: prop.city,
//               area: prop.area,
//               viewedAt: v.viewedAt
//             }
//           : null;
//       }).filter(Boolean);

//       viewMap.set(user.phoneNumber, views);
//     });

//     // ----------------------------- //
//     // Combine all phone numbers across activities
//     const allPhones = new Set([
//       ...interestMap.keys(),
//       ...contactMap.keys(),
//       ...favoriteMap.keys(),
//       ...photoRequestMap.keys(),
//       ...offerMap.keys(),
//       ...helpRequestMap.keys(),
//       ...reportMap.keys(),
//       ...viewMap.keys()
//     ]);

//     const cleanPhones = Array.from(allPhones)
//       .map(p => (typeof p === 'string' ? p.replace(/\D/g, '').slice(-10) : ''))
//       .filter(p => p.length === 10);

//     // Fetch phone numbers of users who have posted properties
//     const postedUsers = await AddModel.distinct("phoneNumber");
//     const postedSet = new Set(
//       postedUsers
//         .map(p => (typeof p === 'string' ? p.replace(/\D/g, '').slice(-10) : ''))
//         .filter(p => p.length === 10)
//     );

//     // Identify users who haven't posted properties
//     const nonPostedPhones = cleanPhones.filter(p => !postedSet.has(p));

//     // ----------------------------- //
//     // Get latest login and update info
//     const userLogins = await UserLogin.aggregate([
//       {
//         $match: {
//           phone: { $in: nonPostedPhones }
//         }
//       },
//       {
//         $sort: { loginDate: -1, updatedAt: -1 }
//       },
//       {
//         $group: {
//           _id: "$phone",
//           loginDate: { $first: "$loginDate" },
//           updateDate: { $first: "$updatedAt" }
//         }
//       }
//     ]);

//     const loginMap = new Map();
//     userLogins.forEach(u => {
//       loginMap.set(u._id, {
//         loginDate: u.loginDate,
//         updateDate: u.updateDate
//       });
//     });

//     // ----------------------------- //
//     // Prepare final result
//     const result = nonPostedPhones.map(phone => {
//       const login = loginMap.get(phone) || {};
//       const views = viewMap.get(phone) || [];

//       return {
//         phoneNumber: phone,
//         interestCount: interestMap.get(phone) || 0,
//         contactCount: contactMap.get(phone) || 0,
//         favoriteCount: favoriteMap.get(phone) || 0,
//         photoRequestCount: photoRequestMap.get(phone) || 0,
//         offerCount: offerMap.get(phone) || 0,
//         helpRequestCount: helpRequestMap.get(phone) || 0,
//         reportCount: reportMap.get(phone) || 0,
//         loginDate: login.loginDate || null,
//         updateDate: login.updateDate || null,
//         viewedProperties: views,
//         viewsCount: views.length
//       };
//     });

//     // Final response
//     return res.status(200).json({
//       message: "User activity data fetched successfully",
//       data: result
//     });

//   } catch (error) {
//     console.error("Error fetching user activity:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// });

// Helper function: normalize phone number to last 10 digits
function normalizePhone(phone) {
  if (typeof phone === 'string') {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : null;
  }
  return null;
}

router.get('/get-user-no-complete-activity', async (req, res) => {
  try {
    // Initialize activity maps
    const interestMap = new Map();
    const contactMap = new Map();
    const favoriteMap = new Map();
    const photoRequestMap = new Map();
    const offerMap = new Map();
    const helpRequestMap = new Map();
    const reportMap = new Map();
    const viewMap = new Map();


    
    // Load Interests
    const interestProps = await AddModel.find({ interestRequests: { $exists: true, $ne: [] } });
    interestProps.forEach(p => {
      p.interestRequests.forEach(r => {
        const phone = normalizePhone(r.phoneNumber);
        if (phone) interestMap.set(phone, (interestMap.get(phone) || 0) + 1);
      });
    });

    // Load Contact Requests
    const contactProps = await AddModel.find({ contactRequests: { $exists: true, $ne: [] } });
    contactProps.forEach(p => {
      p.contactRequests.forEach(r => {
        const phone = normalizePhone(r.phoneNumber);
        if (phone) contactMap.set(phone, (contactMap.get(phone) || 0) + 1);
      });
    });

    // Load Favorite Requests
    const favoriteProps = await AddModel.find({ favoriteRequests: { $exists: true, $ne: [] } });
    favoriteProps.forEach(p => {
      p.favoriteRequests.forEach(r => {
        const phone = normalizePhone(r.phoneNumber);
        if (phone) favoriteMap.set(phone, (favoriteMap.get(phone) || 0) + 1);
      });
    });

    // Load Photo Requests
    const photoRequests = await PhotoRequest.find();
    photoRequests.forEach(r => {
      const phone = normalizePhone(r.phoneNumber);
      if (phone) photoRequestMap.set(phone, (photoRequestMap.get(phone) || 0) + 1);
    });

    // Load Offer Requests
    const offers = await Offer.find();
    offers.forEach(r => {
      const phone = normalizePhone(r.phoneNumber);
      if (phone) offerMap.set(phone, (offerMap.get(phone) || 0) + 1);
    });

    // Load Help Requests
    const helpProps = await AddModel.find({ "helpRequests.0": { $exists: true } });
    helpProps.forEach(p => {
      p.helpRequests.forEach(r => {
        const phone = normalizePhone(r.phoneNumber);
        if (phone) helpRequestMap.set(phone, (helpRequestMap.get(phone) || 0) + 1);
      });
    });

    // Load Property Reports
    const reportProps = await AddModel.find({ reportProperty: { $exists: true, $ne: [] } });
    reportProps.forEach(p => {
      p.reportProperty.forEach(r => {
        const phone = normalizePhone(r.phoneNumber);
        if (phone) reportMap.set(phone, (reportMap.get(phone) || 0) + 1);
      });
    });

    // Load Views
    const allUserViews = await UserViewsModel.find();
    const allPpcIds = [...new Set(allUserViews.flatMap(u => u.viewedProperties.map(v => v.ppcId)))];

    const properties = await AddModel.find(
      { ppcId: { $in: allPpcIds } },
      "ppcId price propertyType propertyMode city area totalArea areaUnit ownership phoneNumber"
    );

    allUserViews.forEach(user => {
      const normalizedPhone = normalizePhone(user.phoneNumber);
      if (!normalizedPhone) return;

      const views = user.viewedProperties.map(v => {
        const prop = properties.find(p => p.ppcId === v.ppcId);
        return prop
          ? {
              ppcId: prop.ppcId,
              city: prop.city,
              area: prop.area,
              viewedAt: v.viewedAt
            }
          : null;
      }).filter(Boolean);

      viewMap.set(normalizedPhone, views);
    });

    // ----------------------------- //
    // Combine all phone numbers across activities
    const allPhones = new Set([
      ...interestMap.keys(),
      ...contactMap.keys(),
      ...favoriteMap.keys(),
      ...photoRequestMap.keys(),
      ...offerMap.keys(),
      ...helpRequestMap.keys(),
      ...reportMap.keys(),
      ...viewMap.keys()
    ]);

    const cleanPhones = Array.from(allPhones).filter(p => p && p.length === 10);

    // Fetch phone numbers of users who have posted properties
    const postedUsers = await AddModel.distinct("phoneNumber");
    const postedSet = new Set(
      postedUsers
        .map(p => normalizePhone(p))
        .filter(p => p && p.length === 10)
    );

    // Identify users who haven't posted properties
    const nonPostedPhones = cleanPhones.filter(p => !postedSet.has(p));

    // ----------------------------- //
    // Get latest login and update info
    const userLogins = await UserLogin.aggregate([
      {
        $match: {
          phone: { $in: nonPostedPhones }
        }
      },
      {
        $sort: { loginDate: -1, updatedAt: -1 }
      },
      {
        $group: {
          _id: "$phone",
          loginDate: { $first: "$loginDate" },
          updateDate: { $first: "$updatedAt" }
        }
      }
    ]);

    const loginMap = new Map();
    userLogins.forEach(u => {
      loginMap.set(u._id, {
        loginDate: u.loginDate,
        updateDate: u.updateDate
      });
    });

    // ----------------------------- //
    // Prepare final result
    const result = nonPostedPhones.map(phone => {
      const login = loginMap.get(phone) || {};
      const views = viewMap.get(phone) || [];

      return {
        phoneNumber: phone,
        interestCount: interestMap.get(phone) || 0,
        contactCount: contactMap.get(phone) || 0,
        favoriteCount: favoriteMap.get(phone) || 0,
        photoRequestCount: photoRequestMap.get(phone) || 0,
        offerCount: offerMap.get(phone) || 0,
        helpRequestCount: helpRequestMap.get(phone) || 0,
        reportCount: reportMap.get(phone) || 0,
        loginDate: login.loginDate || null,
        updateDate: login.updateDate || null,
        viewedProperties: views,
        viewsCount: views.length
      };
    });

    // Final response
    return res.status(200).json({
      message: "User activity data fetched successfully",
      data: result
    });

  } catch (error) {
    console.error("Error fetching user activity:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
});



router.get('/get-user-complete-activity', async (req, res) => {
  try {
    const interestMap = new Map();
    const contactMap = new Map();
    const favoriteMap = new Map();
    const photoRequestMap = new Map();
    const offerMap = new Map();
    const helpRequestMap = new Map();
    const reportMap = new Map();
    const viewMap = new Map();

    // Load interests
    const interestProps = await AddModel.find({ interestRequests: { $exists: true, $ne: [] } });
    interestProps.forEach(p => {
      p.interestRequests.forEach(r => {
        const phone = r.phoneNumber;
        if (phone) interestMap.set(phone, (interestMap.get(phone) || 0) + 1);
      });
    });

    // Load contacts
    const contactProps = await AddModel.find({ contactRequests: { $exists: true, $ne: [] } });
    contactProps.forEach(p => {
      p.contactRequests.forEach(r => {
        const phone = r.phoneNumber;
        if (phone) contactMap.set(phone, (contactMap.get(phone) || 0) + 1);
      });
    });

    // Load favorites
    const favoriteProps = await AddModel.find({ favoriteRequests: { $exists: true, $ne: [] } });
    favoriteProps.forEach(p => {
      p.favoriteRequests.forEach(r => {
        const phone = r.phoneNumber;
        if (phone) favoriteMap.set(phone, (favoriteMap.get(phone) || 0) + 1);
      });
    });

    // Load photo requests
    const photoRequests = await PhotoRequest.find();
    photoRequests.forEach(r => {
      const phone = r.phoneNumber;
      if (phone) photoRequestMap.set(phone, (photoRequestMap.get(phone) || 0) + 1);
    });

    // Load offer requests
    const offers = await Offer.find();
    offers.forEach(r => {
      const phone = r.phoneNumber;
      if (phone) offerMap.set(phone, (offerMap.get(phone) || 0) + 1);
    });

    // Load help requests
    const helpProps = await AddModel.find({ "helpRequests.0": { $exists: true } });
    helpProps.forEach(p => {
      p.helpRequests.forEach(r => {
        const phone = r.phoneNumber;
        if (phone) helpRequestMap.set(phone, (helpRequestMap.get(phone) || 0) + 1);
      });
    });

    // Load reports
    const reportProps = await AddModel.find({ reportProperty: { $exists: true, $ne: [] } });
    reportProps.forEach(p => {
      p.reportProperty.forEach(r => {
        const phone = r.phoneNumber;
        if (phone) reportMap.set(phone, (reportMap.get(phone) || 0) + 1);
      });
    });

    // Load views
    const allUserViews = await UserViewsModel.find();
    const allPpcIds = [...new Set(allUserViews.flatMap(u => u.viewedProperties.map(v => v.ppcId)))];
    const properties = await AddModel.find(
      { ppcId: { $in: allPpcIds } },
      "ppcId price propertyType propertyMode city area totalArea areaUnit ownership phoneNumber"
    );

    allUserViews.forEach(user => {
      const views = user.viewedProperties.map(v => {
        const prop = properties.find(p => p.ppcId === v.ppcId);
        return prop
          ? {
              ppcId: prop.ppcId,
              city: prop.city,
              area: prop.area,
              viewedAt: v.viewedAt
            }
          : null;
      }).filter(Boolean);
      viewMap.set(user.phoneNumber, views);
    });

    // Combine phone numbers
    const allPhones = new Set([
      ...interestMap.keys(),
      ...contactMap.keys(),
      ...favoriteMap.keys(),
      ...photoRequestMap.keys(),
      ...offerMap.keys(),
      ...helpRequestMap.keys(),
      ...reportMap.keys(),
      ...viewMap.keys()
    ]);

    const phoneArray = Array.from(allPhones).filter(Boolean);
    const cleanPhones = phoneArray
      .map(p => (typeof p === 'string' ? p.replace(/\D/g, '').slice(-10) : ''))
      .filter(p => p.length === 10);

    const userLogins = await UserLogin.aggregate([
      {
        $match: {
          phone: { $in: cleanPhones }
        }
      },
      {
        $sort: { loginDate: -1, updatedAt: -1 }
      },
      {
        $group: {
          _id: "$phone",
          loginDate: { $first: "$loginDate" },
          updateDate: { $first: "$updatedAt" }
        }
      }
    ]);

    const loginMap = new Map();
    userLogins.forEach(u => {
      loginMap.set(u._id, {
        loginDate: u.loginDate,
        updateDate: u.updateDate
      });
    });

    const result = phoneArray.map(phone => {
      const clean = typeof phone === 'string' ? phone.replace(/\D/g, '').slice(-10) : '';
      const login = loginMap.get(clean) || {};
  const views = viewMap.get(phone) || []; 

      return {
        phoneNumber: phone,
        interestCount: interestMap.get(phone) || 0,
        contactCount: contactMap.get(phone) || 0,
        favoriteCount: favoriteMap.get(phone) || 0,
        photoRequestCount: photoRequestMap.get(phone) || 0,
        offerCount: offerMap.get(phone) || 0,
        helpRequestCount: helpRequestMap.get(phone) || 0,
        reportCount: reportMap.get(phone) || 0,
        loginDate: login.loginDate || null,
        updateDate: login.updateDate || null,
    viewedProperties: views,          // ? use the variable
    viewsCount: views.length  
      };
    });

    return res.status(200).json({
      message: "User activity data fetched successfully",
      data: result
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
});









router.get('/get-user-activity-count', async (req, res) => {
  try {
    const interestMap = new Map();
    const contactMap = new Map();
    const favoriteMap = new Map();
    const photoRequestMap = new Map();
    const offerMap = new Map();
    const helpRequestMap = new Map();
    const reportMap = new Map();

    // Load interestRequests
    const interestProperties = await AddModel.find({ interestRequests: { $exists: true, $ne: [] } });
    interestProperties.forEach(property => {
      property.interestRequests.forEach(req => {
        const phone = req.phoneNumber;
        if (phone) interestMap.set(phone, (interestMap.get(phone) || 0) + 1);
      });
    });

    // Load contactRequests
    const contactProperties = await AddModel.find({ contactRequests: { $exists: true, $ne: [] } });
    contactProperties.forEach(property => {
      property.contactRequests.forEach(req => {
        const phone = req.phoneNumber;
        if (phone) contactMap.set(phone, (contactMap.get(phone) || 0) + 1);
      });
    });

    // Load favoriteRequests
    const favoriteProperties = await AddModel.find({ favoriteRequests: { $exists: true, $ne: [] } });
    favoriteProperties.forEach(property => {
      property.favoriteRequests.forEach(req => {
        const phone = req.phoneNumber;
        if (phone) favoriteMap.set(phone, (favoriteMap.get(phone) || 0) + 1);
      });
    });

    // Load photo requests
    const photoRequests = await PhotoRequest.find();
    photoRequests.forEach(req => {
      const phone = req.phoneNumber;
      if (phone) photoRequestMap.set(phone, (photoRequestMap.get(phone) || 0) + 1);
    });

    // Load offer requests
    const offers = await Offer.find();
    offers.forEach(req => {
      const phone = req.phoneNumber;
      if (phone) offerMap.set(phone, (offerMap.get(phone) || 0) + 1);
    });

    // Load help requests
    const helpProperties = await AddModel.find({ "helpRequests.0": { $exists: true } });
    helpProperties.forEach(property => {
      property.helpRequests.forEach(req => {
        const phone = req.phoneNumber;
        if (phone) helpRequestMap.set(phone, (helpRequestMap.get(phone) || 0) + 1);
      });
    });

    // Load reported properties
    const reportedProperties = await AddModel.find({ reportProperty: { $exists: true, $ne: [] } });
    reportedProperties.forEach(property => {
      property.reportProperty.forEach(req => {
        const phone = req.phoneNumber;
        if (phone) reportMap.set(phone, (reportMap.get(phone) || 0) + 1);
      });
    });

    // Combine all unique phone numbers
    const allPhoneNumbers = new Set([
      ...interestMap.keys(),
      ...contactMap.keys(),
      ...favoriteMap.keys(),
      ...photoRequestMap.keys(),
      ...offerMap.keys(),
      ...helpRequestMap.keys(),
      ...reportMap.keys()
    ]);

    const phoneArray = Array.from(allPhoneNumbers).filter(Boolean);
    const formattedPhones = phoneArray
      .map(phone => (typeof phone === 'string' ? phone.replace(/\D/g, '').slice(-10) : ''))
      .filter(p => p.length === 10);

    // Fetch latest loginDate and updateDate from UserLogin
    const userLogins = await UserLogin.aggregate([
      {
        $match: {
          phone: { $in: formattedPhones }
        }
      },
      {
        $sort: { loginDate: -1, updatedAt: -1 }
      },
      {
        $group: {
          _id: "$phone",
          loginDate: { $first: "$loginDate" },
          updateDate: { $first: "$updatedAt" }
        }
      }
    ]);

    const loginMap = new Map();
    userLogins.forEach(u => {
      loginMap.set(u._id, {
        loginDate: u.loginDate,
        updateDate: u.updateDate
      });
    });

    // Final result build
    const result = phoneArray.map(phone => {
      const cleanPhone = typeof phone === 'string' ? phone.replace(/\D/g, '').slice(-10) : '';
      const loginInfo = loginMap.get(cleanPhone) || {};

      return {
        phoneNumber: phone,
        interestCount: interestMap.get(phone) || 0,
        contactCount: contactMap.get(phone) || 0,
        favoriteCount: favoriteMap.get(phone) || 0,
        photoRequestCount: photoRequestMap.get(phone) || 0,
        offerCount: offerMap.get(phone) || 0,
        helpRequestCount: helpRequestMap.get(phone) || 0,
        reportCount: reportMap.get(phone) || 0,
        loginDate: loginInfo.loginDate || null,
        updateDate: loginInfo.updateDate || null
      };
    });

    return res.status(200).json({
      message: "Activity counts fetched successfully",
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error fetching activity counts",
      error: error.message
    });
  }
});




// POST /api/user-views/set-limit
router.post("/set-limit", async (req, res) => {
  const { phoneNumber, viewLimitPerDay } = req.body;

  if (!phoneNumber || typeof viewLimitPerDay !== "number") {
    return res.status(400).json({ success: false, message: "Invalid input." });
  }

  try {
    const user = await UserViewsModel.findOneAndUpdate(
      { phoneNumber },
      { viewLimitPerDay },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Limit set to ${viewLimitPerDay} for ${phoneNumber}`,
      user,
    });
  } catch (err) {
    console.error("Error setting limit:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});


// Admin API to set contact limit for a user
router.post("/set-contact-limit", async (req, res) => {
  const { phoneNumber, contactLimitPerDay } = req.body;

  // Validate input
  if (!phoneNumber || typeof contactLimitPerDay !== "number") {
    return res.status(400).json({
      success: false,
      message: "Phone number and numeric contactLimitPerDay are required.",
    });
  }

  try {
    const cleanedPhone = phoneNumber.replace(/\D/g, "").slice(-10); // keep last 10 digits

    const user = await UserViewsModel.findOneAndUpdate(
      { phoneNumber: cleanedPhone },
      { contactLimitPerDay }, // Update this specific field
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Contact limit set to ${contactLimitPerDay} for ${cleanedPhone}`,
      user,
    });
  } catch (error) {
    console.error("Set contact limit error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while setting contact limit.",
      error: error.message,
    });
  }
});



// GET /api/user-views/get-user-stats/:phoneNumber
router.get("/get-user-stats/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const user = await UserViewsModel.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const today = new Date().toDateString();
    const lastViewDateStr = new Date(user.lastViewDate).toDateString();
    const dailyViewsCount = lastViewDateStr === today ? user.dailyViewsCount : 0;

    return res.json({
      success: true,
      user: {
        phoneNumber: user.phoneNumber,
        dailyViewsCount,
        viewLimitPerDay: user.viewLimitPerDay || 20,
      },
    });
  } catch (err) {
    console.error("Error getting user stats:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// POST /api/user-views/view
router.post("/view", async (req, res) => {
  try {
    const { phoneNumber, ppcId, propertyOwnerPhoneNumber, photos } = req.body;
    const today = new Date().toDateString();

    let user = await UserViewsModel.findOne({ phoneNumber });

    if (!user) {
      user = new UserViewsModel({
        phoneNumber,
        dailyViewsCount: 1,
        lastViewDate: new Date(),
        viewLimitPerDay: 20, // default if admin hasn't set
        viewedProperties: [
          { ppcId, viewerPhoneNumber: phoneNumber, propertyOwnerPhoneNumber, photos },
        ],
      });
      await user.save();
      return res.status(200).json({ success: true, message: "View recorded." });
    }

    const lastViewDateStr = new Date(user.lastViewDate).toDateString();
    if (lastViewDateStr !== today) {
      user.dailyViewsCount = 0;
      user.lastViewDate = new Date();
    }

    if (user.dailyViewsCount >= user.viewLimitPerDay) {
      return res
        .status(403)
        .json({ success: false, message: `Daily view limit (${user.viewLimitPerDay}) reached.` });
    }

    user.viewedProperties.push({
      ppcId,
      viewerPhoneNumber: phoneNumber,
      propertyOwnerPhoneNumber,
      photos,
    });

    user.dailyViewsCount += 1;
    await user.save();

    res.status(200).json({ success: true, message: "View recorded." });
  } catch (error) {
    console.error("Error recording view:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});



// PUT /api/user-views/update-limit
router.put("/update-limit", async (req, res) => {
  const { phoneNumber, viewLimitPerDay } = req.body;

  if (!phoneNumber || typeof viewLimitPerDay !== "number") {
    return res.status(400).json({ success: false, message: "Invalid input." });
  }

  try {
    const user = await UserViewsModel.findOneAndUpdate(
      { phoneNumber },
      { viewLimitPerDay },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: `View limit updated to ${viewLimitPerDay} for ${phoneNumber}`,
      user,
    });
  } catch (err) {
    console.error("Error updating limit:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});


// DELETE /api/user-views/delete-limit/:phoneNumber
router.delete("/delete-limit/:phoneNumber", async (req, res) => {
  const { phoneNumber } = req.params;

  try {
    const user = await UserViewsModel.findOneAndUpdate(
      { phoneNumber },
      { $unset: { viewLimitPerDay: 1 } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: `View limit removed for ${phoneNumber}`,
      user,
    });
  } catch (err) {
    console.error("Error deleting view limit:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/user-views/get-all-user-limits
// router.get("/get-all-user-limits", async (req, res) => {
//   try {
//     const users = await UserViewsModel.find({ viewLimitPerDay: { $exists: true } });
//     res.json({ success: true, users });
//   } catch (err) {
//     console.error("Error fetching user limits:", err);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// });


router.get("/get-all-user-limits", async (req, res) => {
  try {
    const formatDate = (date) => new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Get all users with view limit
    const viewUsers = await UserViewsModel.find({ viewLimitPerDay: { $exists: true } });
    const phoneList = viewUsers.map((u) => getLast10Digits(u.phoneNumber));

    // 2. Fetch all contact data (even beyond 30 days)
    const contactDocs = await AddModel.find(
      { "contactRequests.phoneNumber": { $exists: true, $ne: null } },
      "ppcId contactRequests"
    );

    // 3. Build per-day contact map
    const contactMap = new Map();

    contactDocs.forEach((doc) => {
      const ppcId = doc.ppcId;

      (doc.contactRequests || []).forEach((req) => {
        const phone = getLast10Digits(req.phoneNumber);
        const date = req.date || req.createdAt;
        if (!phone || !date) return;

        const dateKey = formatDate(date);

        if (!contactMap.has(phone)) contactMap.set(phone, {});

        const userDateMap = contactMap.get(phone);

        if (!userDateMap[dateKey]) {
          userDateMap[dateKey] = [{ ppcId, contactedAt: date }];
        } else {
          userDateMap[dateKey].push({ ppcId, contactedAt: date });
        }
      });
    });

    // 4. Build final result
    const result = viewUsers.map((user) => {
      const phone = getLast10Digits(user.phoneNumber);
      const contactDetails = contactMap.get(phone) || {};

      // Convert object {date: [...]} to {date: count}
      const contactCountPerDay = {};
      for (const date in contactDetails) {
        contactCountPerDay[date] = contactDetails[date].length;
      }

      return {
        phoneNumber: phone,
        viewLimitPerDay: user.viewLimitPerDay,
        viewsRemaining: user.viewsRemaining,
        lastUpdated: user.updatedAt,
        contactCountPerDay,
        contactedPpcDetailsByDate: contactDetails
      };
    });

    res.status(200).json({ success: true, users: result });
  } catch (err) {
    console.error("Error fetching user limits:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});



// router.get("/get-all-user-limits-30days", async (req, res) => {
//   try {
//     // Utility: Check if date is within last 30 days
//     const isWithinLast30Days = (date) => {
//       const now = new Date();
//       const d = new Date(date);
//       return !isNaN(d) && now - d <= 30 * 24 * 60 * 60 * 1000 && d <= now;
//     };

//     // 1. Get all users with view limit
//     const viewUsers = await UserViewsModel.find({ viewLimitPerDay: { $exists: true } });

//     const phoneList = viewUsers.map((u) => getLast10Digits(u.phoneNumber));

//     // 2. Fetch 30-day contact data from AddModel
//     const contactDocs = await AddModel.find(
//       { "contactRequests.phoneNumber": { $exists: true, $ne: null } },
//       "ppcId contactRequests"
//     );

//     const contactMap = new Map();

//     contactDocs.forEach((doc) => {
//       const ppcId = doc.ppcId;
//       (doc.contactRequests || []).forEach((req) => {
//         const phone = getLast10Digits(req.phoneNumber);
//         const date = req.date || req.createdAt;

//         if (!phone || !isWithinLast30Days(date)) return;

//         const entry = {
//           ppcId,
//           contactedAt: date,
//         };

//         if (!contactMap.has(phone)) {
//           contactMap.set(phone, [entry]);
//         } else {
//           contactMap.get(phone).push(entry);
//         }
//       });
//     });

//     // 3. Combine user limits and contact info
//     const result = viewUsers.map((user) => {
//       const phone = getLast10Digits(user.phoneNumber);
//       const contacts = contactMap.get(phone) || [];

//       return {
//         phoneNumber: phone,
//         viewLimitPerDay: user.viewLimitPerDay,
//         viewsRemaining: user.viewsRemaining,
//         lastUpdated: user.updatedAt,
//         contactsInLast30Days: contacts.length,
//         contactedPpcDetails: contacts,
//       };
//     });

//     res.status(200).json({ success: true, users: result });
//   } catch (err) {
//     console.error("Error fetching user limits:", err);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// });


// // PUT /admin/set-on-demand
// router.put('/admin/set-on-demand', async (req, res) => {
//   try {
//     const { ppcId, onDemand } = req.body;

//     if (!ppcId) {
//       return res.status(400).json({ message: 'ppcId is required' });
//     }

//     const property = await AddModel.findOne({ ppcId });

//     if (!property) {
//       return res.status(404).json({ message: 'Property not found' });
//     }

//     property.onDemand = onDemand;
//     await property.save();

//     res.status(200).json({ message: `Price is now ${onDemand ? 'On Demand' : 'Visible'}` });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });


router.put('/admin/set-on-demand', async (req, res) => {
  try {
    const { ppcId, onDemand, adminName } = req.body;

    if (!ppcId) {
      return res.status(400).json({ message: 'ppcId is required' });
    }

    const property = await AddModel.findOne({ ppcId });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    property.onDemand = onDemand;
    property.onDemandSetBy = {
      name: adminName || 'Unknown',
      date: new Date()
    };

    await property.save();

    res.status(200).json({ message: `Price is now ${onDemand ? 'On Demand' : 'Visible'}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.get('/property-by-ppcId', async (req, res) => {
  try {
    const { ppcId } = req.query;

    if (!ppcId) {
      return res.status(400).json({ message: 'ppcId is required' });
    }

    const property = await AddModel.findOne({ ppcId: Number(ppcId) });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const response = {
      ppcId: property.ppcId,
      onDemand: property.onDemand,
      price: property.onDemand ? "On Demand" : property.price,
      status: property.status,
      ownerName: property.ownerName
    };

    res.status(200).json({ property: response });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /admin/get-on-demand-properties
router.get('/get-on-demand-properties', async (req, res) => {
  try {
    const properties = await AddModel.find({ onDemand: true }).lean();

    if (properties.length === 0) {
      return res.status(404).json({ message: 'No properties marked as On Demand' });
    }

    // Optionally mask price as "On Demand" (for frontend)
    const processedProperties = properties.map(property => ({
      ...property,
      price: "On Demand"
    }));

    res.status(200).json({
      success: true,
      message: 'Properties with On Demand pricing fetched successfully',
      properties: processedProperties,
    });
  } catch (error) {
    console.error('Error fetching On Demand properties:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


// router.delete("/remove-phone-from-properties", async (req, res) => {
//   try {
//     const { phoneNumber } = req.body;
//     if (!phoneNumber) return res.status(400).json({ message: "Phone number required." });

//     const result = await AddModel.removePhoneNumberFromAllFields(phoneNumber);
//     res.status(200).json({ message: "Phone number removed from all fields", result });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });


// GET /get-location-applied-properties
router.get("/get-location-applied-properties", async (req, res) => {
  try {
    const properties = await AddModel.find({
      locationCoordinates: {
        $regex: /�/, // matches anything containing "�"
        $ne: ""
      }
    });

    res.status(200).json({ properties });
  } catch (err) {
    console.error("Error fetching location-applied properties:", err);
    res.status(500).json({ message: "Server error fetching properties." });
  }
});


// // GET /api/cities - Fetch distinct city values
// router.get('/cities', async (req, res) => {
//   try {
//     const cities = await AddModel.distinct('city');
//     res.json({ success: true, data: cities });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error fetching cities', error });
//   }
// });

// // GET /api/areas - Fetch distinct area values
// router.get('/areas', async (req, res) => {
//   try {
//     const areas = await AddModel.distinct('area');
//     res.json({ success: true, data: areas });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error fetching areas', error });
//   }
// });


// GET /api/cities?search=pu
router.get('/cities', async (req, res) => {
  try {
    const { search = "" } = req.query;
    const cities = await AddModel.distinct('city', {
      city: { $regex: search, $options: 'i' }
    });
    res.json({ success: true, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching cities', error });
  }
});

// GET /api/areas?search=la
router.get('/areas', async (req, res) => {
  try {
    const { search = "" } = req.query;
    const areas = await AddModel.distinct('area', {
      area: { $regex: search, $options: 'i' }
    });
    res.json({ success: true, data: areas });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching areas', error });
  }
});





// // GET /get-location-applied-properties
// router.get("/get-location-applied-address", async (req, res) => {
//   try {
//     const properties = await AddModel.find(
//       {
//         locationCoordinates: {
//           $regex: /�/, // Ensure it includes coordinates
//           $ne: ""      // Ensure it's not empty
//         }
//       },
//       {
//         // Only address-related fields
//         locationCoordinates: 1,
//         address: 1,
//         doorNo: 1,
//         street: 1,
//         area: 1,
//         nagar: 1,
//         city: 1,
//         state: 1,
//         country: 1,
//         pincode: 1,
//         _id: 0 // optional: hide Mongo _id field
//       }
//     );

//     res.status(200).json({ success: true, count: properties.length, properties });
//   } catch (err) {
//     console.error("Error fetching location-applied properties:", err);
//     res.status(500).json({ success: false, message: "Server error fetching properties." });
//   }
// });

// GET /get-location-applied-address
router.get("/get-location-applied-address", async (req, res) => {
  try {
    // Find all documents with valid location coordinates
    const properties = await AddModel.find({
      locationCoordinates: { $regex: /�/, $ne: "" }
    }, {
      locationCoordinates: 1,
      rentalPropertyAddress: 1,
      doorNo: 1,
      street: 1,
      area: 1,
      nagar: 1,
      city: 1,
      state: 1,
      country: 1,
      pinCode: 1,
      district: 1,
      _id: 0
    });

    // Filter out only those with at least one non-empty address field
    const filtered = properties.filter(p =>
      p.rentalPropertyAddress ||
      p.doorNo ||
      p.street ||
      p.area ||
      p.nagar ||
      p.city ||
      p.state ||
      p.country ||
      p.pinCode ||
      p.district
    );

    res.status(200).json({
      success: true,
      count: filtered.length,
      properties: filtered
    });
  } catch (err) {
    console.error("Error fetching location-applied properties:", err);
    res.status(500).json({ success: false, message: "Server error fetching properties." });
  }
});




// Get only properties with uploaded photos
router.get("/get-photo-properties", async (req, res) => {
  try {
    const photoProperties = await AddModel.find({
      photos: { $exists: true, $ne: [] },
      isDeleted: false // optional: exclude soft-deleted properties
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Properties with uploaded photos fetched successfully!",
      data: photoProperties,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching properties with photos",
      error,
    });
  }
});

// Get properties with bankLoan = "yes" (case-insensitive) and status = "active"
router.get("/get-bankloan-properties", async (req, res) => {
  try {
    const properties = await AddModel.find({
      bankLoan: { $regex: /^yes$/i }, // case-insensitive match
      status: "active",
      isDeleted: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Bank loan eligible properties fetched successfully",
      data: properties
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching bank loan properties",
      error: error.message
    });
  }
});


// Get all House properties below 30 Lakhs
router.get("/get-houses-below-30l", async (req, res) => {
  try {
    const properties = await AddModel.find({
      propertyType: { $regex: /^house$/i }, // matches "house" or "House" case-insensitively
      price: { $lte: 3000000 },
      status: "active",
      isDeleted: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "House properties below ?30L fetched successfully",
      data: properties
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching house properties",
      error: error.message
    });
  }
});


// router.post('/check-user-access-buyer-assistance', async (req, res) => {
//   const { phoneNumber } = req.body;

//   if (!phoneNumber) {
//     return res.status(400).json({ success: false, message: 'Phone number is required' });
//   }

//   try {
//     // ?? Step 1: Get property for this phone number
//     const userProperties = await AddModel.find({ phoneNumber, isDeleted: false });

//     const hasProperty = userProperties.length > 0;

//     // ?? Step 2: Get PayU payment status for this phone number
//     const userPayment = await PaymentPayU.findOne({
//       phone: phoneNumber,
//       payustatususer: 'paid'
//     });

//     const isPaid = !!userPayment;

//     if (hasProperty && isPaid) {
//       // ? Allowed access
//       return res.status(200).json({
//         success: true,
//         message: 'Access granted.',
//         userHasProperty: true,
//         userIsPaid: true
//       });
//     }

//     // ? Blocked
//     return res.status(403).json({
//       success: false,
//       message: 'You have to add property or buy your property plan to continue viewing buyer assistance.',
//       userHasProperty: hasProperty,
//       userIsPaid: isPaid
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });



// GET paid PPCs



router.post('/check-user-access-buyer-assistance-all', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    // ?? Step 1: Check if user has added any properties
    const userProperties = await AddModel.find({ phoneNumber, isDeleted: false });
    const hasProperty = userProperties.length > 0;

    // ?? Step 2: Fetch all PPC IDs for this user's plans
    const userPlans = await PricingPlans.find({ 'phoneNumbers.number': phoneNumber });
    const allPpcIds = userPlans.flatMap(plan =>
      plan.phoneNumbers
        .filter(pn => pn.number === phoneNumber)
        .map(pn => pn.ppcId)
    );

    // ?? Step 3: Check which PPCs have a paid status
    const paidPayments = await PaymentPayU.find({
      ppcId: { $in: allPpcIds },
      payustatususer: 'paid',
    });

    const paidPpcIds = [...new Set(paidPayments.map(p => p.ppcId))]; // Ensure unique
    const paidCount = paidPpcIds.length;

    // ?? Step 4: Count how many buyer assistances this user has viewed
    const viewedRecords = await BuyerAssistView.find({ phoneNumber });
    const viewedBaIds = viewedRecords.map(view => view.ba_id);

    // ?? Step 5: Calculate view allowance
    const allowedViews = paidCount * 3;
    const remainingViews = Math.max(allowedViews - viewedBaIds.length, 0);

    // ? Respond with all computed values
    return res.status(200).json({
      success: true,
      message: "Access granted.",
      phoneNumber,
      userHasProperty: hasProperty,
      userIsPaid: paidCount > 0,
      paidPropertiesCount: paidCount,
      allowedBuyerAssistanceViews: allowedViews,
      viewedBuyerAssistances: viewedBaIds,
      remainingViews
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});


router.post('/check-user-access-buyer-assistance', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    // Step 1: Check if user has added properties
    const userProperties = await AddModel.find({ phoneNumber, isDeleted: false });
    const hasProperty = userProperties.length > 0;

    // Step 2: Get PPC IDs from pricing plans
    const userPlans = await PricingPlans.find({ 'phoneNumbers.number': phoneNumber });
    const allPpcIds = userPlans.flatMap(plan =>
      plan.phoneNumbers
        .filter(pn => pn.number === phoneNumber)
        .map(pn => pn.ppcId)
    );

    // Step 3: Get paid PPCs
    const paidPayments = await PaymentPayU.find({
      ppcId: { $in: allPpcIds },
      payustatususer: 'paid',
    });

    const paidPpcIds = [...new Set(paidPayments.map(p => p.ppcId))];
    const paidCount = paidPpcIds.length;

    // Step 4: Get viewed buyer assistance records
    const viewedRecords = await BuyerAssistView.find({ phoneNumber });


    const viewedBaIds = viewedRecords.map(view => view.ba_id);


    // Step 5: Calculate limits
    const allowedViews = paidCount * 10;
    const remainingViews = Math.max(allowedViews - viewedBaIds.length, 0);

    return res.status(200).json({
      success: true,
      message: "Access granted.",
      phoneNumber,
      userHasProperty: hasProperty,
      userIsPaid: paidCount > 0,
      paidPropertiesCount: paidCount,
      allowedBuyerAssistanceViews: allowedViews,
      viewedBuyerAssistances: viewedBaIds,
      remainingViews
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});


router.post('/record-ba-view', async (req, res) => {
  const { phoneNumber, ba_id } = req.body;

  if (!phoneNumber || !ba_id) {
    return res.status(400).json({ success: false, message: 'Missing phone number or ba_id' });
  }

  try {
    const alreadyViewed = await BuyerAssistView.findOne({ phoneNumber, ba_id });
    if (!alreadyViewed) {
      await BuyerAssistView.create({ phoneNumber, ba_id });
    }

    res.status(200).json({ success: true, message: 'View recorded' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});


// GET count of views for a phone number
router.get('/get-buyer-assist-view-count', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    const count = await BuyerAssistView.countDocuments({ phoneNumber });
    return res.status(200).json({ success: true, phoneNumber, count });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});



// GET all views for a phone number
router.get('/get-buyer-assist-views', async (req, res) => {
  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    const views = await BuyerAssistView.find({ phoneNumber }).sort({ viewedAt: -1 }); // recent first
    return res.status(200).json({ success: true, views });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});


// // ? GET all buyer assist views (no phoneNumber filter)
// router.get('/get-buyer-assist-views-all', async (req, res) => {
//   try {
//     const views = await BuyerAssistView.find().sort({ viewedAt: -1 }); // Most recent first
//     return res.status(200).json({ success: true, views });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// });




router.get('/get-buyer-assist-views-all', async (req, res) => {
  try {
    const views = await BuyerAssistView.find().sort({ viewedAt: -1 });

    const enrichedViews = await Promise.all(
      views.map(async (view) => {
        const baData = await BuyerAssistance.findOne({ ba_id: view.ba_id }).lean();
        return {
          ...view.toObject(),
          ba_details: baData || null,
        };
      })
    );

    return res.status(200).json({ success: true, views: enrichedViews });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});


// routes/buyerAssistance.js
router.post("/log-buyer-assist-view", async (req, res) => {
  const { phoneNumber, ba_id } = req.body;

  if (!phoneNumber || !ba_id) {
    return res.status(400).json({ success: false, message: "Phone number and ba_id are required" });
  }

  try {
    // Avoid duplicate view logs
    const alreadyViewed = await BuyerAssistView.findOne({ phoneNumber, ba_id });

    if (!alreadyViewed) {
      await BuyerAssistView.create({ phoneNumber, ba_id });
    }

    return res.status(200).json({ success: true, message: "View logged" });
  } catch (err) {
    console.error("Error logging view:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});


router.get('/plans-by-phone-only-paid/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;
  try {
    const plans = await PricingPlans.find({ 'phoneNumbers.number': phoneNumber });
    if (plans.length === 0) throw { status: 404, message: "No plans found" };

    const allPpcIds = plans.flatMap(p => p.phoneNumbers.map(pn => pn.ppcId));
    const payments = await PaymentPayU.find({ ppcId: { $in: allPpcIds }, payustatususer: 'paid' });

    const paymentMap = {};
    payments.forEach(pay => {
      if (!paymentMap[pay.ppcId] || new Date(pay.createdAt) > new Date(paymentMap[pay.ppcId].createdAt)) {
        paymentMap[pay.ppcId] = pay;
      }
    });

    const now = new Date();
    const result = plans.map(plan => {
      const phoneNumbers = plan.phoneNumbers
        .filter(pn => paymentMap[pn.ppcId])
        .map(pn => {
          const pd = paymentMap[pn.ppcId];
          const expiry = pn.expireDate ? new Date(pn.expireDate) : new Date(plan.expireDate);
          const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          return {
            ...pn.toObject(),
            paymentData: pd,
            expireDate: expiry.toISOString(),
            expiryMessage: diffDays > 0 ? `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}` : 'Expired',
          };
        });

      return phoneNumbers.length ? {
        ...plan.toObject(),
        phoneNumbers
      } : null;
    }).filter(Boolean);

    res.json({ status: "success", phoneNumber, plans: result });

  } catch (err) {
    res.status(err.status || 500).json({
      status: "error",
      message: err.message || "Failed to fetch paid plans"
    });
  }
});

// POST check access & view limit
router.post('/check-user-access-buyer-assistance', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ success: false, message: 'Phone number is required' });

  try {
    const properties = await AddModel.find({ phoneNumber, isDeleted: false });
    const paidCount = (await PaymentPayU.find({
      phone: phoneNumber,
      payustatususer: 'paid'
    })).length;

    const views = await BuyerAssistView.find({ phoneNumber });
    const viewedIds = views.map(v => v.ba_id);
    const allowed = paidCount * 3;
    const remaining = Math.max(allowed - viewedIds.length, 0);

    res.json({
      success: true,
      phoneNumber,
      userHasProperty: properties.length > 0,
      paidPropertiesCount: paidCount,
      allowedBuyerAssistanceViews: allowed,
      viewedBuyerAssistances: viewedIds,
      remainingViews: remaining
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
});


// router.post('/check-buyer-assistance-limit', async (req, res) => {
//   const { phoneNumber } = req.body;

//   if (!phoneNumber) {
//     return res.status(400).json({ success: false, message: 'Phone number is required' });
//   }

//   try {
//     // 1. Get all paid properties by phoneNumber
//     const paidProperties = await PaymentPayU.find({
//       phone: phoneNumber,
//       payustatususer: 'paid'
//     });

//     const paidPropertiesCount = paidProperties.length;

//     // 2. Calculate allowed views (e.g., 3 per paid property)
//     const allowedBuyerAssistanceViews = paidPropertiesCount * 3;

//     // 3. Get viewed buyer assistance IDs from DB
//     const views = await BuyerAssistView.find({ phoneNumber }); // Adjust model name accordingly

//     const viewedBuyerAssistances = views.map(v => v.ba_id); // Assuming 'ba_id' is stored in view record

//     const remainingViews = allowedBuyerAssistanceViews - viewedBuyerAssistances.length;

//     return res.status(200).json({
//       success: true,
//       phoneNumber,
//       paidPropertiesCount,
//       allowedBuyerAssistanceViews,
//       viewedBuyerAssistances,
//       remainingViews: remainingViews >= 0 ? remainingViews : 0
//     });

//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error while checking access',
//       error: err.message
//     });
//   }
// });



router.post("/request-address", async (req, res) => {
  try {
    const { ppcId, requesterPhoneNumber } = req.body;

    if (!ppcId || !requesterPhoneNumber) {
      return res.status(400).json({ message: "ppcId and requesterPhoneNumber are required." });
    }

    // Check for existing request
    const existingRequest = await AddressRequest.findOne({ ppcId, requesterPhoneNumber });
    if (existingRequest) {
      return res.status(409).json({ message: "You have already requested the address for this property." });
    }

    const property = await AddModel.findOne({ ppcId });
    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    const newRequest = new AddressRequest({
      ppcId,
      requesterPhoneNumber,
      postedUserPhoneNumber: property.phoneNumber,
      city: property.city,
      district: property.district,
      area: property.area,
    });

    await newRequest.save();

    // Optional: Send notification to property owner
    try {
      await NotificationUser.create({
        recipientPhoneNumber: property.phoneNumber,
        senderPhoneNumber: requesterPhoneNumber,
        ppcId,
        message: `User ${requesterPhoneNumber} requested address details for your property.`,
        createdAt: new Date()
      });
    } catch (err) {
      console.error("Notification error:", err.message);
    }

    res.status(201).json({ message: "Address request submitted successfully.", request: newRequest });
  } catch (error) {
    res.status(500).json({ message: "Error submitting address request.", error: error.message });
  }
});

// GET all address requests
// router.get("/get-address-requests-all", async (req, res) => {
//   try {
//     const requests = await AddressRequest.find().sort({ createdAt: -1 }); // most recent first
//     res.status(200).json({
//       success: true,
//       total: requests.length,
//       requests,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching address requests.",
//       error: error.message,
//     });
//   }
// });


router.get("/get-address-requests-all", async (req, res) => {
  try {
    const requests = await AddressRequest.find().sort({ createdAt: -1 });

    // Fetch full property details for each ppcId
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const property = await AddModel.findOne({ ppcId: request.ppcId }).lean();
        return {
          ...request.toObject(),
          propertyDetails: property || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      total: enrichedRequests.length,
      requests: enrichedRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching address requests with property data.",
      error: error.message,
    });
  }
});

router.get("/address-requests/buyer/:phoneNumber", async (req, res) => {
  try {
    let phoneNumber = normalizePhoneNumber(req.params.phoneNumber);

    // Find all address requests where this user is the property owner
    const ownerRequests = await AddressRequest.find({
      $or: [
        { postedUserPhoneNumber: phoneNumber },
        { postedUserPhoneNumber: `+91${phoneNumber}` },
        { postedUserPhoneNumber: `91${phoneNumber}` }
      ]
    });

    if (ownerRequests.length === 0) {
      return res.status(404).json({ message: "No address requests found for this owner." });
    }

    // Map with full AddModel data
    const propertyDetails = await Promise.all(
      ownerRequests.map(async (request) => {
        const property = await AddModel.findOne({ ppcId: request.ppcId });

        return {
          requestId: request._id,
          requesterPhoneNumber: request.requesterPhoneNumber,
          status: request.status,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          property: property || {} // return full property document if found, else empty object
        };
      })
    );

    res.status(200).json(propertyDetails);
  } catch (error) {
    res.status(500).json({ message: "Error fetching owner's address requests.", error: error.message });
  }
});


// router.get("/address-requests/owner/:phoneNumber", async (req, res) => {
//   try {
//     let phoneNumber = normalizePhoneNumber(req.params.phoneNumber);

//     // Find all address requests for this owner (property posted by this user)
//     const ownerRequests = await AddressRequest.find({
//       $or: [
//         { postedUserPhoneNumber: phoneNumber },
//         { postedUserPhoneNumber: `+91${phoneNumber}` },
//         { postedUserPhoneNumber: `91${phoneNumber}` },
//       ],
//     });

//     if (ownerRequests.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No address requests found for this owner." });
//     }

//     const propertyDetails = await Promise.all(
//       ownerRequests.map(async (request) => {
//         const property = await AddModel.findOne({ ppcId: request.ppcId });

//         if (!property) {
//           return {
//             _id: request._id,
//             ppcId: request.ppcId,
//             propertyMode: "N/A",
//             price: 0,
//             propertyType: "N/A",
//             totalArea: "N/A",
//             bedrooms: "N/A",
//             ownership: "N/A",
//             bestTimeToCall: "N/A",
//             area: "N/A",
//             areaunit: "N/A",
//             city: "N/A",
//             district: "N/A",
//             status: request.status || "N/A",
//             requesterPhoneNumber: request.requesterPhoneNumber || "N/A",
//             createdAt: request.createdAt || null,
//             updatedAt: request.updatedAt || null,
//           };
//         }

//         return {
//           _id: request._id,
//           ppcId: request.ppcId,
//           propertyMode: property.propertyMode || "N/A",
//           price: property.price || 0,
//           propertyType: property.propertyType || "N/A",
//           totalArea: property.totalArea || "N/A",
//           bedrooms: property.bedrooms || "N/A",
//           ownership: property.ownership || "N/A",
//           bestTimeToCall: property.bestTimeToCall || "N/A",
//           area: property.area || "N/A",
//           areaunit: property.areaUnit || "N/A",
//           city: property.city || "N/A",
//           district: property.district || "N/A",
//           status: request.status || "N/A",
//           requesterPhoneNumber: request.requesterPhoneNumber || "N/A",
//           createdAt: request.createdAt || null,
//           updatedAt: request.updatedAt || null,
//         };
//       })
//     );

//     res.status(200).json(propertyDetails);
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching owner's address requests.",
//       error: error.message,
//     });
//   }
// });

router.get("/address-requests/owner/:phoneNumber", async (req, res) => {
  try {
    let phoneNumber = normalizePhoneNumber(req.params.phoneNumber);

    const requests = await AddressRequest.find({
      $or: [
        { requesterPhoneNumber: phoneNumber },
        { requesterPhoneNumber: `+91${phoneNumber}` },
        { requesterPhoneNumber: `91${phoneNumber}` },
      ],
    });

    if (requests.length === 0) {
      return res.status(404).json({ message: "No address requests found for this requester." });
    }

    const propertyDetails = await Promise.all(
      requests.map(async (request) => {
        const property = await AddModel.findOne({ ppcId: request.ppcId });

        const responseObj = {
          _id: request._id,
          ppcId: request.ppcId,
          requesterPhoneNumber: request.requesterPhoneNumber || "N/A",
          postedUserPhoneNumber: request.postedUserPhoneNumber || "N/A",
          status: request.status || "N/A",
          previousStatus: request.previousStatus || "",
          createdAt: request.createdAt || null,
          updatedAt: request.updatedAt || null,
          propertyMode: "N/A",
          price: 0,
          propertyType: "N/A",
          totalArea: "N/A",
          bedrooms: "N/A",
          ownership: "N/A",
          bestTimeToCall: "N/A",
          area: "N/A",
          areaunit: "N/A",
          streetName: "N/A",
          nagar: "N/A",
          pinCode: "N/A",
          city: "N/A",
          district: "N/A",
        };

        if (!property) return responseObj;

        return {
          ...responseObj,
          propertyMode: property.propertyMode || "N/A",
          price: property.price || 0,
          propertyType: property.propertyType || "N/A",
          totalArea: property.totalArea || "N/A",
          bedrooms: property.bedrooms || "N/A",
          ownership: property.ownership || "N/A",
          bestTimeToCall: property.bestTimeToCall || "N/A",
          area: property.area || "N/A",
          areaunit: property.areaUnit || "N/A",
          streetName: property.streetName || "N/A",
          nagar: property.nagar || "N/A",
          pinCode: property.pinCode || "N/A",
          city: property.city || "N/A",
          district: property.district || "N/A",
        };
      })
    );

    res.status(200).json(propertyDetails);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching address requests by requester.",
      error: error.message,
    });
  }
});



// router.get("/address-requests/owner/:phoneNumber", async (req, res) => {
//   try {
//     let phoneNumber = normalizePhoneNumber(req.params.phoneNumber);

//     // Find address requests for this property owner
//     const ownerRequests = await AddressRequest.find({
//       $or: [
//         { postedUserPhoneNumber: phoneNumber },
//         { postedUserPhoneNumber: `+91${phoneNumber}` },
//         { postedUserPhoneNumber: `91${phoneNumber}` },
//       ],
//     });

//     if (ownerRequests.length === 0) {
//       return res.status(404).json({ message: "No address requests found for this owner." });
//     }

//     const propertyDetails = await Promise.all(
//       ownerRequests.map(async (request) => {
//         const property = await AddModel.findOne({ ppcId: request.ppcId });

//         // Default response object
//         let responseObj = {
//           _id: request._id,
//           ppcId: request.ppcId,
//           propertyMode: "N/A",
//           price: 0,
//           propertyType: "N/A",
//           totalArea: "N/A",
//           bedrooms: "N/A",
//           ownership: "N/A",
//           bestTimeToCall: "N/A",
//           area: "N/A",
//           areaunit: "N/A",
//           streetName: "N/A",
//           nagar: "N/A",
//           pinCode: "N/A",
//           city: "N/A",
//           district: "N/A",
//           status: request.status || "N/A",
//           requesterPhoneNumber: request.requesterPhoneNumber || "N/A",
//           createdAt: request.createdAt || null,
//           updatedAt: request.updatedAt || null,
//         };

//         if (!property) return responseObj;

//         // Destructure address fields
//         const { area, streetName, nagar, pinCode } = property;

//         // Check if address fields are valid (pinCode is optional)
//         const isAddressFilled =
//           area?.trim() && streetName?.trim() && nagar?.trim();

//         // Update status if address is available and status is still pending
//         if (isAddressFilled && request.status === "address request pending") {
//           await AddressRequest.findByIdAndUpdate(request._id, {
//             previousStatus: request.status,
//             status: "address sent",
//           });
//           responseObj.status = "address sent";
//         }

//         // Update the response with full property details
//         return {
//           ...responseObj,
//           propertyMode: property.propertyMode || "N/A",
//           price: property.price || 0,
//           propertyType: property.propertyType || "N/A",
//           totalArea: property.totalArea || "N/A",
//           bedrooms: property.bedrooms || "N/A",
//           ownership: property.ownership || "N/A",
//           bestTimeToCall: property.bestTimeToCall || "N/A",
//           area: area || "N/A",
//           areaunit: property.areaUnit || "N/A",
//           streetName: streetName || "N/A",
//           nagar: nagar || "N/A",
//           pinCode: pinCode || "N/A",
//           city: property.city || "N/A",
//           district: property.district || "N/A",
//         };
//       })
//     );

//     res.status(200).json(propertyDetails);
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching owner's address requests.",
//       error: error.message,
//     });
//   }
// });

router.get("/address-requests/count/buyer/:phoneNumber", async (req, res) => {
  try {
    const phoneNumber = normalizePhoneNumber(req.params.phoneNumber);

    const count = await AddressRequest.countDocuments({
      $or: [
        { requesterPhoneNumber: phoneNumber },
        { requesterPhoneNumber: `+91${phoneNumber}` },
        { requesterPhoneNumber: `91${phoneNumber}` }
      ]
    });

    res.status(200).json({ buyerRequestCount: count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching buyer request count.", error: error.message });
  }
});


router.get("/address-requests/count/owner/:phoneNumber", async (req, res) => {
  try {
    const phoneNumber = normalizePhoneNumber(req.params.phoneNumber);

    const count = await AddressRequest.countDocuments({
      $or: [
        { postedUserPhoneNumber: phoneNumber },
        { postedUserPhoneNumber: `+91${phoneNumber}` },
        { postedUserPhoneNumber: `91${phoneNumber}` }
      ]
    });

    res.status(200).json({ ownerRequestCount: count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching owner request count.", error: error.message });
  }
});



router.put("/address-requests/delete/:ppcId", async (req, res) => {
  try {
    const request = await AddressRequest.findOne({ ppcId: req.params.ppcId });

    if (!request) {
      return res.status(404).json({ message: "Address request not found." });
    }

    // Save the current status before marking as deleted
    request.previousStatus = request.status;
    request.status = "deleted";

    await request.save();

    res.status(200).json({ message: "Address request marked as deleted.", request });
  } catch (error) {
    res.status(500).json({ message: "Error deleting address request.", error: error.message });
  }
});


router.put("/address-requests/undo/:ppcId", async (req, res) => {
  try {
    const request = await AddressRequest.findOne({ ppcId: req.params.ppcId });

    if (!request) {
      return res.status(404).json({ message: "Address request not found." });
    }

    if (!request.previousStatus) {
      return res.status(400).json({ message: "No previous status to restore." });
    }

    // Restore previous status
    request.status = request.previousStatus;
request.previousStatus = ""; // ? instead of ""
await request.save();

    await request.save();

    res.status(200).json({ message: "Address request restored to previous status.", request });
  } catch (error) {
    res.status(500).json({ message: "Error undoing delete.", error: error.message });
  }
});


router.put("/address-requests/send/:ppcId", async (req, res) => {
  try {
    const { ppcId } = req.params;

    const request = await AddressRequest.findOne({ ppcId: parseInt(ppcId) });

    if (!request) {
      return res.status(404).json({ message: "Address request not found." });
    }

    // Update the status to "address sent"
    request.status = "address sent";

    await request.save();

    res.status(200).json({
      message: "Address request marked as sent.",
      request
    });
  } catch (error) {
    res.status(500).json({
      message: "Error marking address request as sent.",
      error: error.message
    });
  }
});


router.put("/address-requests/delete/:ppcId/:phoneNumber", async (req, res) => {
  try {
    const { ppcId, phoneNumber } = req.params;

    const request = await AddressRequest.findOne({
      ppcId: parseInt(ppcId),
      requesterPhoneNumber: phoneNumber,
    });

    if (!request) {
      return res.status(404).json({ message: "Address request not found." });
    }

    if (request.status === "deleted") {
      return res.status(400).json({ message: "Request is already deleted." });
    }

    request.previousStatus = request.status;
    request.status = "deleted";

    await request.save();

    res.status(200).json({
      message: "Address request marked as deleted.",
      request,
    });
  } catch (error) {
    console.error("Error in DELETE address request:", error);
    res.status(500).json({
      message: "Error deleting address request.",
      error: error.message,
    });
  }
});

router.put("/address-requests/undo/:ppcId/:phoneNumber", async (req, res) => {
  try {
    const { ppcId, phoneNumber } = req.params;

    const request = await AddressRequest.findOne({
      ppcId: parseInt(ppcId),
      requesterPhoneNumber: phoneNumber,
    });

    if (!request) {
      return res.status(404).json({ message: "Address request not found." });
    }

    if (request.status !== "deleted") {
      return res.status(400).json({ message: "Cannot undo. Status is not 'deleted'." });
    }

    if (!request.previousStatus) {
      return res.status(400).json({ message: "No previous status found to restore." });
    }

    request.status = request.previousStatus;
   request.previousStatus = ""; // ? instead of ""
await request.save();

    res.status(200).json({
      message: "Address request restored to previous status.",
      request,
    });
  } catch (error) {
    console.error("Error in UNDO address request:", error);
    res.status(500).json({
      message: "Error undoing delete.",
      error: error.message,
    });
  }
});

// Controller route to delete phone references
const deletePhoneReferences = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const result = await AddModel.removePhoneNumberFromAllFields(phoneNumber);
    res.status(200).json({ message: 'Phone references removed', result });
  } catch (error) {
    res.status(500).json({ message: 'Error removing phone references', error });
  }
};


// GET all videos
// router.get('/get-property-videos', async (req, res) => {
//   try {
//     const videos = await AddModel.find(
//       { video: { $exists: true, $ne: "" } }, // filters out empty/null
//       { video: 1, _id: 0 } // project only video field
//     );

//     res.status(200).json({
//       message: 'Video list fetched successfully',
//       videos: videos,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch videos', error: error.message });
//   }
// });


// router.get('/get-property-videos', async (req, res) => {
//   try {
//     const videos = await AddModel.find(
//       { video: { $exists: true, $ne: "" } }, // Only if video exists and not empty
//       { video: 1, ppcId: 1, _id: 0 }         // Include both video and ppcId
//     );

//     res.status(200).json({
//       message: 'Video list fetched successfully',
//       videos: videos,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch videos', error: error.message });
//   }
// });










router.get('/get-property-videos', async (req, res) => {
  try {
    const videos = await AddModel.find(
      {
        video: { $exists: true, $ne: "" }  // Only properties with non-empty video
      },
      {
        video: 1,
        ppcId: 1,
        _id: 0
      }
    );

    // Normalize video paths and handle both string or array format
    const normalized = videos.flatMap(v => {
      if (typeof v.video === 'string' && v.video.trim()) {
        return [{ ppcId: v.ppcId, video: v.video.replace(/\\/g, '/') }];
      } else if (Array.isArray(v.video)) {
        return v.video
          .filter(vid => typeof vid === 'string' && vid.trim())
          .map(vid => ({
            ppcId: v.ppcId,
            video: vid.replace(/\\/g, '/')
          }));
      }
      return [];
    });

    res.status(200).json({
      message: 'Video list fetched successfully',
      total: normalized.length,
      videos: normalized,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch videos', error: error.message });
  }
});








// router.get('/get-property-videos', async (req, res) => {
//   try {
//     const videos = await AddModel.find(
//       { video: { $exists: true, $ne: "" } },
//       { video: 1, ppcId: 1, _id: 0 }
//     );

//     const normalized = videos.map(v => ({
//       ppcId: v.ppcId,
//       video: v.video.replace(/\\/g, '/') // <-- fix backslashes
//     }));

//     res.status(200).json({
//       message: 'Video list fetched successfully',
//       videos: normalized,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch videos', error: error.message });
//   }
// });


// GET /get-property-video/:ppcId
router.get('/get-property-video/:ppcId', async (req, res) => {
  try {
    const { ppcId } = req.params;

    const videoDoc = await AddModel.findOne(
      { ppcId, video: { $exists: true, $ne: "" } },
      { video: 1, ppcId: 1, _id: 0 }
    );

    if (!videoDoc) {
      return res.status(404).json({ message: 'No video found for this PPC ID' });
    }

    const normalized = {
      ppcId: videoDoc.ppcId,
      video: videoDoc.video.replace(/\\/g, '/'),
    };

    res.status(200).json({
      message: 'Video fetched successfully',
      video: normalized,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch video', error: error.message });
  }
});



// router.get("/get-all-contact-limits", async (req, res) => {
//   try {
//     const users = await UserViewsModel.find(
//       { contactLimitPerDay: { $exists: true } },
//       { phoneNumber: 1, contactLimitPerDay: 1, _id: 0 }
//     ).sort({ phoneNumber: 1 });

//     res.status(200).json({
//       success: true,
//       count: users.length,
//       users,
//     });
//   } catch (error) {
//     console.error("Fetch contact limits error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching contact limits.",
//       error: error.message,
//     });
//   }
// });



// Updated /get-all-contact-limits API
router.get("/get-all-contact-limits", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const users = await UserViewsModel.find(
      { contactLimitPerDay: { $exists: true } },
      {
        phoneNumber: 1,
        contactLimitPerDay: 1,
        contactedProperties: 1,
        _id: 0,
      }
    ).sort({ phoneNumber: 1 });

    const enrichedUsers = users.map((user) => {
      const contactSentCount = user.contactedProperties?.length || 0;

      const contactCountPerDay = {};
      const contactedPpcDetailsByDate = {};

      (user.contactedProperties || []).forEach(({ contactedAt, ppcId }) => {
        const dateStr = new Date(contactedAt).toISOString().slice(0, 10);

        contactCountPerDay[dateStr] = (contactCountPerDay[dateStr] || 0) + 1;
        if (!contactedPpcDetailsByDate[dateStr]) {
          contactedPpcDetailsByDate[dateStr] = [];
        }
        contactedPpcDetailsByDate[dateStr].push({ ppcId, contactedAt });
      });

      return {
        phoneNumber: user.phoneNumber,
        contactLimitPerDay: user.contactLimitPerDay,
        contactSentCount,
        remainingContacts: user.contactLimitPerDay - contactSentCount,
        contactCountPerDay,
        contactedPpcDetailsByDate,
      };
    });

    res.status(200).json({
      success: true,
      users: enrichedUsers,
    });
  } catch (error) {
    console.error("Fetch contact limits error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching contact limits.",
      error: error.message,
    });
  }
});


// router.get("/get-all-contact-limits", async (req, res) => {
//   try {
//     const users = await UserViewsModel.find(
//       { contactLimitPerDay: { $exists: true } },
//       {
//         phoneNumber: 1,
//         contactLimitPerDay: 1,
//         contactedProperties: 1,
//         _id: 0
//       }
//     ).sort({ phoneNumber: 1 });

//     const enrichedUsers = users.map((user) => {
//       const contactSentCount = Array.isArray(user.contactedProperties)
//         ? user.contactedProperties.length
//         : 0;

//       const remaining = user.contactLimitPerDay - contactSentCount;

//       return {
//         phoneNumber: user.phoneNumber,
//         contactLimitPerDay: user.contactLimitPerDay,
//         contactSentCount,
//         remainingContacts: remaining < 0 ? 0 : remaining,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       count: enrichedUsers.length,
//       users: enrichedUsers,
//     });
//   } catch (error) {
//     console.error("Fetch contact limits error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching contact limits.",
//       error: error.message,
//     });
//   }
// });


router.put("/update-contact-limit", async (req, res) => {
  const { phoneNumber, contactLimitPerDay } = req.body;

  if (!phoneNumber || typeof contactLimitPerDay !== "number") {
    return res.status(400).json({
      success: false,
      message: "Phone number and numeric contactLimitPerDay are required.",
    });
  }

  try {
    const cleanedPhone = phoneNumber.replace(/\D/g, "").slice(-10);

    const updatedUser = await UserViewsModel.findOneAndUpdate(
      { phoneNumber: cleanedPhone },
      { contactLimitPerDay },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: `User not found with phone number: ${cleanedPhone}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Contact limit updated to ${contactLimitPerDay} for ${cleanedPhone}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update contact limit error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating contact limit.",
      error: error.message,
    });
  }
});


router.delete("/delete-contact-limit/:phoneNumber", async (req, res) => {
  const rawPhone = req.params.phoneNumber;
  const cleanedPhone = rawPhone.replace(/\D/g, "").slice(-10);

  try {
    const user = await UserViewsModel.findOneAndUpdate(
      { phoneNumber: cleanedPhone },
      { $unset: { contactLimitPerDay: "" } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with phone number: ${cleanedPhone}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Contact limit removed for ${cleanedPhone}`,
      user,
    });
  } catch (error) {
    console.error("Delete contact limit error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting contact limit.",
      error: error.message,
    });
  }
});


router.get('/get-ppcid-activity-counts', async (req, res) => {
  try {
    const ppcMap = new Map();

    // Helper to increment counts
    const increment = (ppcId, type) => {
      if (!ppcMap.has(ppcId)) {
        ppcMap.set(ppcId, {
          ppcId,
          interestCount: 0,
          contactCount: 0,
          favoriteCount: 0,
          photoRequestCount: 0,
          offerCount: 0
        });
      }
      ppcMap.get(ppcId)[type]++;
    };

    // Interest
    const interestProps = await AddModel.find({ interestRequests: { $exists: true, $ne: [] } });
    interestProps.forEach(prop => {
      const ppcId = prop.ppcId;
      const count = prop.interestRequests.length;
      for (let i = 0; i < count; i++) increment(ppcId, 'interestCount');
    });

    // Contact
    const contactProps = await AddModel.find({ contactRequests: { $exists: true, $ne: [] } });
    contactProps.forEach(prop => {
      const ppcId = prop.ppcId;
      const count = prop.contactRequests.length;
      for (let i = 0; i < count; i++) increment(ppcId, 'contactCount');
    });

    // Favorite
    const favoriteProps = await AddModel.find({ favoriteRequests: { $exists: true, $ne: [] } });
    favoriteProps.forEach(prop => {
      const ppcId = prop.ppcId;
      const count = prop.favoriteRequests.length;
      for (let i = 0; i < count; i++) increment(ppcId, 'favoriteCount');
    });

    // Photo Requests
    const photoRequests = await PhotoRequest.find();
    photoRequests.forEach(req => {
      const ppcId = req.ppcId;
      if (ppcId) increment(ppcId, 'photoRequestCount');
    });

    // Offers
    const offers = await Offer.find();
    offers.forEach(req => {
      const ppcId = req.ppcId;
      if (ppcId) increment(ppcId, 'offerCount');
    });

    // Convert to array
    const result = Array.from(ppcMap.values());

    res.status(200).json({
      message: "Activity counts by PPC ID fetched successfully",
      data: result
    });

  } catch (error) {
    console.error("Error fetching PPC activity counts:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});





// ───────────────────────────────────────────────────────────────────────────
// Bulk upload properties from an Excel sheet (admin tool).
//
// The admin app parses the chosen .xlsx client-side (column headers must match
// the AddProperty form field names), shows a preview, then POSTs the parsed
// rows here as JSON. Every row is inserted as an APPROVED property:
//   - status: 'active'  → it appears immediately in "Approved Property"
//   - base:   'PY' | 'CH' from the upload checkbox (checked = Pondicherry/PY,
//             unchecked = Chennai/CH). insertMany() does NOT run the schema
//             pre('save') base-resolver, so the checkbox value is stored as-is.
// ───────────────────────────────────────────────────────────────────────────
router.post('/bulk-upload-properties', async (req, res) => {
  try {
    const { rows, base, addedBy, addedByRole } = req.body || {};

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No rows received to upload.' });
    }
    if (rows.length > 5000) {
      return res.status(400).json({ message: 'Too many rows in one upload (max 5000).' });
    }

    // Checkbox: only 'PY' when explicitly Pondicherry; otherwise Chennai.
    const targetBase = String(base).trim().toUpperCase() === 'PY' ? 'PY' : 'CH';

    // Whitelist of editable property fields (mirrors the AddProperty form /
    // AddModel schema). Anything else in the sheet (Section, SourceFile, …) is
    // ignored.
    const STRING_FIELDS = [
      'propertyMode', 'propertyType', 'propertyAge', 'bankLoan', 'negotiation',
      'ownership', 'bedrooms', 'kitchen', 'kitchenType', 'balconies', 'floorNo',
      'areaUnit', 'propertyApproved', 'postedBy', 'facing', 'salesMode',
      'salesType', 'description', 'furnished', 'lift', 'attachedBathrooms',
      'western', 'numberOfFloors', 'carParking', 'rentalPropertyAddress',
      'country', 'city', 'state', 'district', 'area', 'streetName', 'doorNumber',
      'nagar', 'locationCoordinates', 'ownerName', 'email', 'bestTimeToCall',
    ];
    const NUMBER_FIELDS = ['price', 'length', 'breadth', 'totalArea', 'pinCode'];

    const cleanPhone = (v) => String(v == null ? '' : v).replace(/[^\d+]/g, '');
    const val = (row, ...keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return row[k];
        }
      }
      return undefined;
    };

    // Mandatory fields decide where each row lands. This list and the presence
    // rule are IDENTICAL to the `requiredFields` gate used by BOTH admin pages
    // (/properties/pre-approved-all and /properties/pending), so a bulk row can
    // never fall between them and become invisible:
    //   all present -> status 'complete'   -> PreApproved (status complete + required==='yes')
    //   any missing -> status 'incomplete' -> Pending     (status incomplete + required==='no')
    // NOTE: price has a schema default of 0, so the pages always count it as
    // present; we mirror that below (set it to 0 when unset) to stay in sync.
    const MANDATORY_FIELDS = [
      'propertyMode', 'propertyType', 'price', 'totalArea', 'areaUnit',
      'salesType', 'postedBy',
    ];
    const hasAllMandatory = (doc) =>
      MANDATORY_FIELDS.every((f) => {
        const v = doc[f];
        return v !== undefined && v !== null && String(v).trim() !== '';
      });

    // Reserve a contiguous block of PPC-IDs.
    const latest = await AddModel.findOne().sort({ ppcId: -1 });
    let nextPpcId = latest ? latest.ppcId + 1 : 1001;

    const now = new Date();
    // One shared batch id for this upload so the whole batch can be reverted.
    const bulkUploadId = `BULK-${now.getTime()}-${Math.floor(Math.random() * 1e6)}`;
    const docs = [];

    for (const row of rows) {
      const doc = {
        ppcId: nextPpcId++,
        base: targetBase,
        createdBy: 'Admin',
        addedBy: addedBy || 'Admin',
        addedByRole: addedByRole || '',
        addedAt: now,
        bulkUploadId,
        bulkUploadAt: now,
        bulkUploadBy: addedBy || 'Admin',
        countryCode: cleanPhone(val(row, 'phoneNumberCountryCode', 'countryCode')) || '+91',
        alternateCountryCode:
          cleanPhone(val(row, 'alternatePhoneCountryCode', 'alternateCountryCode')) || '+91',
      };

      for (const f of STRING_FIELDS) {
        const v = val(row, f);
        if (v !== undefined) doc[f] = String(v).trim();
      }
      for (const f of NUMBER_FIELDS) {
        const v = val(row, f);
        if (v !== undefined) {
          const n = Number(String(v).replace(/[^\d.]/g, ''));
          if (!Number.isNaN(n)) doc[f] = n;
        }
      }

      const phone = cleanPhone(val(row, 'phoneNumber'));
      if (phone) doc.phoneNumber = phone;
      const alt = cleanPhone(val(row, 'alternatePhone'));
      if (alt) doc.alternatePhone = alt;
      doc.displayContact = doc.phoneNumber || '';

      // Mirror the schema default (price: 0) so this completeness check matches
      // what the PreApproved/Pending pages compute on the stored doc.
      if (doc.price == null) doc.price = 0;

      // Complete rows wait in PreApproved; incomplete rows drop to Pending.
      doc.status = hasAllMandatory(doc) ? 'complete' : 'incomplete';

      docs.push(doc);
    }

    const preApprovedCount = docs.filter((d) => d.status === 'complete').length;
    const pendingCount = docs.length - preApprovedCount;

    // insertMany bypasses the pre('save') base resolver, so `base`/`status` are
    // stored exactly as set above.
    const inserted = await AddModel.insertMany(docs, { ordered: true });

    return res.status(201).json({
      message: `${inserted.length} properties uploaded — ${preApprovedCount} to PreApproved, ${pendingCount} to Pending.`,
      insertedCount: inserted.length,
      preApprovedCount,
      pendingCount,
      base: targetBase,
      bulkUploadId,
      bulkUploadAt: now,
      fromPpcId: inserted.length ? inserted[0].ppcId : null,
      toPpcId: inserted.length ? inserted[inserted.length - 1].ppcId : null,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Bulk upload failed.',
      error: error.message,
    });
  }
});


// All bulk-upload batches (newest first) so the page can revert ANY previous
// batch, not just the most recent one. Uses the raw collection so the list is
// global (never narrowed by the city-scope plugin).
router.get('/bulk-upload-batches', async (req, res) => {
  try {
    const batches = await AddModel.collection.aggregate([
      { $match: { bulkUploadId: { $ne: null } } },
      { $group: {
          _id: '$bulkUploadId',
          count: { $sum: 1 },
          bulkUploadAt: { $max: '$bulkUploadAt' },
          bulkUploadBy: { $first: '$bulkUploadBy' },
          base: { $first: '$base' },
      } },
      { $sort: { bulkUploadAt: -1 } },
      { $limit: 100 },
    ]).toArray();

    return res.status(200).json({
      batches: batches.map((b) => ({
        bulkUploadId: b._id,
        count: b.count,
        bulkUploadAt: b.bulkUploadAt,
        bulkUploadBy: b.bulkUploadBy,
        base: b.base,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load bulk upload batches.', error: error.message });
  }
});


// Most recent bulk-upload batch (so the page can show "revert last upload"
// even after a refresh / navigating away). Uses findOne (not city-scoped) and
// the raw collection for the count so it's correct regardless of admin scope.
router.get('/bulk-upload-last', async (req, res) => {
  try {
    const last = await AddModel.findOne({ bulkUploadId: { $ne: null } })
      .sort({ bulkUploadAt: -1 });
    if (!last || !last.bulkUploadId) {
      return res.status(200).json({ batch: null });
    }
    const count = await AddModel.collection.countDocuments({
      bulkUploadId: last.bulkUploadId,
    });
    return res.status(200).json({
      batch: {
        bulkUploadId: last.bulkUploadId,
        bulkUploadAt: last.bulkUploadAt,
        bulkUploadBy: last.bulkUploadBy,
        base: last.base,
        count,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load last upload.', error: error.message });
  }
});


// Revert (permanently delete) a bulk-upload batch. Pass the bulkUploadId to
// revert that exact batch, or { last: true } to revert the most recent one.
// Deletion is scoped strictly to the batch's bulkUploadId, so nothing else is
// ever touched.
router.post('/bulk-upload-revert', async (req, res) => {
  try {
    let { bulkUploadId, last } = req.body || {};

    if (!bulkUploadId && last) {
      const lastDoc = await AddModel.findOne({ bulkUploadId: { $ne: null } })
        .sort({ bulkUploadAt: -1 });
      bulkUploadId = lastDoc && lastDoc.bulkUploadId;
    }

    if (!bulkUploadId) {
      return res.status(400).json({ message: 'No bulk upload batch to revert.' });
    }

    // deleteMany is not city-scoped; we restrict strictly by batch id.
    const result = await AddModel.deleteMany({ bulkUploadId });

    return res.status(200).json({
      message: `Reverted ${result.deletedCount} uploaded propert${result.deletedCount === 1 ? 'y' : 'ies'}.`,
      deletedCount: result.deletedCount,
      bulkUploadId,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Revert failed.', error: error.message });
  }
});


module.exports = router;





























