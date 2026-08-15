






const express = require('express');
const router = express.Router();
const officeMobileMap = require('../utils/officeMobileMap');
const { getOfficeOtpNumbers } = require('../utils/otpNumbers'); // DB-backed OTP recipients (admin panel), file fallback
const { sendOtpSms } = require('../utils/smsSender'); // ✅ Correct import
const { generateOTP, isWithinAllowedTime } = require('../utils/helpers');
const AdminLogin = require('../Admin/AdminModel')
const { signAdminToken, requireAdmin } = require('../utils/adminAuth');



// OTP Store (in-memory)
const otpStore = {}; // In production, use Redis or DB

function storeOtp(officeName, otp) {
  otpStore[officeName] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
  };
}

function verifyOtp(officeName, enteredOtp) {
  const data = otpStore[officeName];
  if (!data) return { success: false, message: 'No OTP requested' };

  if (Date.now() > data.expiresAt) {
    return { success: false, message: 'OTP expired' };
  }

  if (data.otp !== enteredOtp) {
    return { success: false, message: 'Invalid OTP' };
  }

  delete otpStore[officeName]; // Clear OTP after success
  return { success: true, message: 'OTP verified successfully' };
}


router.post('/send-otp-login', async (req, res) => {
  try {
    const { adminName } = req.body;

    if (!adminName) {
      return res.status(400).json({ success: false, message: 'Admin name is required' });
    }

    // Resolve officeName from the admin's stored record (authoritative source)
    // instead of trusting the client. Each AdminLogin doc has an `officeName`
    // (enum: 'ADMIN' | 'ARV 1' | 'ARV 2' | 'ARV 3') tied to that admin.
    // Fall back to 'ADMIN' for legacy records that were created before officeName
    // was assigned per-admin so existing logins keep working.
    const admin = await AdminLogin.findOne({ name: adminName });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const officeName = admin.officeName || 'ADMIN';

    // Numbers are managed from the admin panel (OTP Numbers page) and stored in
    // the OtpNumber collection; falls back to the legacy static officeMobileMap
    // when an office has none configured yet.
    const validNumbers = await getOfficeOtpNumbers(officeName);
    if (!Array.isArray(validNumbers) || validNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No OTP numbers configured for this office. Add at least one in the OTP Numbers panel.',
      });
    }

    // Time restriction removed — OTP can now be requested at any time for all offices.
    // if (officeName.startsWith('ARV') && !isWithinAllowedTime()) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'OTP can only be requested between 9 AM and 8 PM for this office',
    //   });
    // }

    const otp = generateOTP();
    const results = [];

    for (const number of validNumbers) {
      const result = await sendOtpSms(number, otp, adminName); // you must have this function
      results.push({ number, ...result });
    }

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP to some or all numbers',
        details: failed,
      });
    }

    // ✅ Save OTP
    storeOtp(officeName, otp);

    return res.json({
      success: true,
      message: `OTP sent to ${officeName} numbers`,
      maskedNumbers: validNumbers.map(n =>
        n.replace(/(\+\d{2})\d{6}(\d{2})/, '$1******$2')
      ),
      otpExpirySeconds: 300,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});




router.post('/verify-otp-login', async (req, res) => {
  const { adminName, otp } = req.body;

  if (!adminName || !otp) {
    return res.status(400).json({ success: false, message: 'Admin name and OTP are required' });
  }

  // Resolve officeName from the admin record so the verify key matches the
  // /send-otp-login flow (which now also derives it server-side). Same legacy
  // fallback to 'ADMIN' so verify works for admins without explicit office.
  const admin = await AdminLogin.findOne({ name: adminName });
  if (!admin) {
    return res.status(404).json({ success: false, message: 'Admin not found' });
  }
  const officeName = admin.officeName || 'ADMIN';

  const result = verifyOtp(officeName, otp);

  if (result.success) {
    // OTP verified → issue a signed session token. The admin app stores this
    // and sends it as `Authorization: Bearer <token>` on every request; it is
    // also what the route guard checks before letting the dashboard load.
    const token = signAdminToken({
      name: admin.name,
      role: admin.role,
      base: admin.base,
    });
    return res.json({
      success: true,
      message: result.message,
      token,
      admin: { name: admin.name, role: admin.role, base: admin.base || 'ALL' },
    });
  } else {
    return res.status(401).json({ success: false, message: result.message });
  }
});




const bcrypt = require('bcrypt');




router.post('/adminlogin', async (req, res) => {
    const { name, password, role, base: selectedBase } = req.body;

    try {
        const admin = await AdminLogin.findOne({ name });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch || admin.role !== role) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // City check: an 'ALL' admin can pick any city at login; a 'PY' / 'CH'
        // admin must pick the city they are locked to. Existing accounts that
        // have no `base` field yet are treated as 'ALL'. When no base is sent
        // (older admin build) we skip the check for backwards-compatibility.
        const userBase = admin.base || 'ALL';
        if (selectedBase && userBase !== 'ALL' && userBase !== selectedBase) {
            return res.status(400).json({
                message: `This account can only sign in to ${userBase === 'PY' ? 'Pondicherry' : 'Chennai'}.`
            });
        }

        // ✅ Update last login date
        admin.lastLogin = new Date();
        await admin.save();

        return res.status(200).json({
            message: 'Login successful',
            data: {
                name: admin.name,
                role: admin.role,
                base: admin.base,            // the admin's allowed scope
                lastLogin: admin.lastLogin   // return date in response
            }
        });

    } catch (error) {
        return res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
});



// router.post('/adminlogin', async (req, res) => {
//     const { name, password, role, userType } = req.body;

//     try {
//         const admin = await AdminLogin.findOne({ name });
//         if (!admin) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         const isMatch = await bcrypt.compare(password, admin.password);
    
//         if (!isMatch || admin.role !== role || admin.userType !== userType) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         return res.status(200).json({
//             message: 'Login successful',
//             data: {
//                 name: admin.name,
//                 role: admin.role,
//                 userType: admin.userType
//             }
//         });

//     } catch (error) {
//         return res.status(500).json({ message: 'Something went wrong', error: error.message });
//     }
// });



// ✅ GET: Get all admins (excluding passwords)
router.get('/get-all-admins', requireAdmin, async (req, res) => {
  try {
    const admins = await AdminLogin.find({}, '-password'); // exclude password
    res.status(200).json({ data: admins });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// // Admin login route (POST /adminlogin)
// router.post('/adminlogin', async (req, res) => {
//     const { name, password, role, userType } = req.body;

//     try {
//         // Find the admin by name only
//         const admin = await AdminLogin.findOne({ name });
//         if (!admin) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         // Check password, role, and userType
//         if (
//             admin.password !== password || 
//             admin.role !== role || 
//             admin.userType !== userType
//         ) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         // Success response
//         return res.status(200).json({ 
//             message: 'Login successful', 
//             data: {
//                 name: admin.name,
//                 role: admin.role,
//                 userType: admin.userType
//             }
//         });

//     } catch (error) {
//         return res.status(500).json({ message: 'Something went wrong', error: error.message });
//     }
// });


router.get('/get-admin-logs', requireAdmin, async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Set default page and limit

    try {
        const logs = await AdminLogin.find()
            .skip((page - 1) * limit)  // Skip the appropriate number of records based on the page
            .limit(Number(limit))  // Limit the number of records returned
            .sort({ date: -1 }); // Sort logs by date in descending order (latest first)

        const totalLogs = await AdminLogin.countDocuments(); // Get the total number of logs

        return res.status(200).json({
            logs,
            totalLogs,
            totalPages: Math.ceil(totalLogs / limit),  // Calculate total pages
            currentPage: page
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
});


router.post('/admin-create', requireAdmin, async (req, res) => {
    const newUser = new AdminLogin({
        name: req.body.name,
        address: req.body.address,
        office: req.body.office,
        jobType: req.body.jobType,
        targetWeek: req.body.targetWeek,
        targetMonth: req.body.targetMonth,
        mobile: req.body.mobile,
        aadhaarNumber: req.body.aadhaarNumber,
        userName: req.body.userName,
        password: req.body.password,
        role: req.body.role
    });

    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.post('/admin-creates', requireAdmin, async (req, res) => {
  try {
    const newUser = new AdminLogin({
      name: req.body.name,
      address: req.body.address,
      office: req.body.office,
      jobType: req.body.jobType,
      targetWeek: req.body.targetWeek,
      targetMonth: req.body.targetMonth,
      mobile: req.body.mobile,
      aadhaarNumber: req.body.aadhaarNumber,
      userName: req.body.userName,
      password: req.body.password,            // will be auto-hashed by pre('save')
      plainPassword: req.body.password,       // ✅ save raw password (dev only)
      role: req.body.role
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Get all users
router.get('/admin-all', async (req, res) => {
    try {
        const users = await AdminLogin.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ✅ Update Admin
router.post('/admin-updates/:id', requireAdmin, async (req, res) => {
  try {
    const user = await AdminLogin.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const fields = [
      'name', 'address', 'office', 'officeName', 'jobType', 'targetWeek', 'targetMonth',
      'mobile', 'aadhaarNumber', 'userName', 'role'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (req.body.password) {
      user.password = req.body.password;
      user.plainPassword = req.body.password;
    }

    const updated = await user.save();
    res.status(200).json({ message: 'User updated', data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Get One Admin
router.get('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const user = await AdminLogin.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user); // will include plainPassword
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});


// // ✅ GET: Get all admins including plainPassword
// router.get('/admin-lists', async (req, res) => {
//   try {
//     // Explicitly select plainPassword and other fields
//     const admins = await AdminLogin.find({}, 'name userName role userType mobile plainPassword');

//     res.status(200).json({ data: admins });
//   } catch (err) {
//     console.error("❌ Fetch error:", err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });


// ✅ GET: Get all admins (including all fields)
router.get('/admin-lists', requireAdmin, async (req, res) => {
  try {
    // Fetch all admin records
    const admins = await AdminLogin.find({}); // No field filter — get everything

    res.status(200).json({ data: admins });
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// // Update a user by ID
// router.patch('/admin-update/:id', async (req, res) => {
//     try {
//         const user = await AdminLogin.findById(req.params.id);
//         if (user == null) {
//             return res.status(404).json({ message: 'Cannot find user' });
//         }

//         if (req.body.name != null) {
//             user.name = req.body.name;
//         }
//         if (req.body.address != null) {
//             user.address = req.body.address;
//         }
//         if (req.body.office != null) {
//             user.office = req.body.office;
//         }
//         if (req.body.jobType != null) {
//             user.jobType = req.body.jobType;
//         }
//         if (req.body.targetWeek != null) {
//             user.targetWeek = req.body.targetWeek;
//         }
//         if (req.body.targetMonth != null) {
//             user.targetMonth = req.body.targetMonth;
//         }
//         if (req.body.mobile != null) {
//             user.mobile = req.body.mobile;
//         }
//         if (req.body.aadhaarNumber != null) {
//             user.aadhaarNumber = req.body.aadhaarNumber;
//         }
//         if (req.body.userName != null) {
//             user.userName = req.body.userName;
//         }
//         if (req.body.password != null) {
//             user.password = req.body.password;
//         }
//         if (req.body.role != null) {
//             user.role = req.body.role;
//         }
//         if (req.body.userType != null) {
//             user.userType = req.body.userType;
//         }

//         const updatedUser = await user.save();
//         res.json(updatedUser);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });




// ✅ PATCH: Update Admin by ID
router.post('/admin-update/:id', requireAdmin, async (req, res) => {
  try {
    const user = await AdminLogin.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Cannot find user' });
    }

    // Update fields conditionally
    const fields = [
      'name', 'address', 'office', 'jobType', 'targetWeek', 'targetMonth',
      'mobile', 'aadhaarNumber', 'userName', 'role'
    ];

    fields.forEach(field => {
      if (req.body[field] != null) {
        user[field] = req.body[field];
      }
    });

    // ✅ Handle password update with hashing
    if (req.body.password != null) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      user.password = hashedPassword;
    }

    const updatedUser = await user.save();
    res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



router.delete('/admin-delete/:id', requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        
        const user = await AdminLogin.findById(userId);
        if (user == null) {
            return res.status(404).json({ message: 'Cannot find user' });
        }

        // Use findByIdAndDelete() instead of remove()
        await AdminLogin.findByIdAndDelete(userId);

        res.json({ message: 'Deleted user' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;












