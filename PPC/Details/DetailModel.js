// // const express = require('express');
// // const router = express.Router();
// // const AdminLogin = require('../Admin/AdminModel')
// // const bcrypt = require('bcrypt');
// // const axios = require('axios');


// // const https = require('https');

// // // SMS Configuration Constants
// // const SMS_CONFIG = {
// //   BASE_URL: process.env.SMS_BASE_URL || 'https://www.smsidea.co.in',
// //   ENDPOINT: '/smsstatuswithid.aspx',
// //   TIMEOUT: 15000,
// //   RETRIES: 3,
// //   PARAMS: {
// //     user: process.env.SMS_USERNAME,
// //     pass: process.env.SMS_PASSWORD,
// //     senderid: process.env.SENDER_ID,
// //     route: "1",
// //     TemplateID: process.env.DLT_TEMPLATE_ID,
// //     EntityID: process.env.DLT_ENTITY_ID,
// //     accusage: "1",
// //     type: "text",
// //     format: "json"
// //   }
// // };

// // // Enhanced SMS Client with Retry Logic
// // const smsClient = axios.create({
// //   baseURL: SMS_CONFIG.BASE_URL,
// //   timeout: SMS_CONFIG.TIMEOUT,
// //   httpsAgent: new https.Agent({ keepAlive: true }),
// //   validateStatus: () => true // Handle all status codes
// // });

// // // OTP Generation Utility
// // const generateOTP = () => {
// //   const digits = '0123456789';
// //   let otp = '';
// //   for (let i = 0; i < 6; i++) {
// //     otp += digits[Math.floor(Math.random() * 10)];
// //   }
// //   return otp;
// // };

// // // Mobile Number Formatter
// // const formatMobileNumber = (rawNumber) => {
// //   const cleaned = rawNumber.replace(/\D/g, '');
// //   if (cleaned.length < 10) throw new Error('Invalid mobile number length');
  
// //   return cleaned.startsWith('91') 
// //     ? cleaned 
// //     : `91${cleaned.slice(-10)}`;
// // };

// // // Main OTP Endpoint
// // router.post('/send-login-otp', async (req, res) => {
// //   try {
// //     // Validate Input
// //     const requiredFields = ['userType', 'name', 'password', 'role'];
// //     const missing = requiredFields.filter(field => !req.body[field]);
    
// //     if (missing.length) {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'Missing required fields',
// //         missing
// //       });
// //     }

// //     // Find User
// //     const user = await AdminLogin.findOne({
// //       userType: new RegExp(`^${req.body.userType.trim()}$`, 'i'),
// //       name: new RegExp(`^${req.body.name.trim()}$`, 'i'),
// //       role: new RegExp(`^${req.body.role.trim()}$`, 'i')
// //     }).select('+password');

// //     if (!user) {
// //       return res.status(401).json({ 
// //         success: false, 
// //         error: 'Invalid credentials' 
// //       });
// //     }

// //     // Verify Password
// //     const validPassword = await bcrypt.compare(req.body.password, user.password);
// //     if (!validPassword) {
// //       return res.status(401).json({ 
// //         success: false, 
// //         error: 'Invalid credentials' 
// //       });
// //     }

// //     // Generate and Send OTP
// //     const otp = generateOTP();
// //     const mobile = formatMobileNumber(user.mobile);
    
// //     // Prepare SMS Payload
// //     const smsPayload = {
// //       ...SMS_CONFIG.PARAMS,
// //       mobiles: mobile,
// //       message: encodeURIComponent(`Your OTP is ${otp}. Valid for 5 minutes.`)
// //     };

// //     // SMS Send with Retry
// //     let smsResponse;
// //     for (let attempt = 1; attempt <= SMS_CONFIG.RETRIES; attempt++) {
// //       try {
// //         smsResponse = await smsClient.get(SMS_CONFIG.ENDPOINT, {
// //           params: smsPayload
// //         });
        
// //         if (smsResponse.data.includes('Success')) break;
// //         if (attempt === SMS_CONFIG.RETRIES) throw new Error('SMS send failed');
        
// //       } catch (error) {
// //         if (attempt === SMS_CONFIG.RETRIES) {
// //           console.error('Final SMS failure:', error);
// //           throw error;
// //         }
// //         await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
// //       }
// //     }

// //     // Update User Record
// //     await AdminLogin.updateOne(
// //       { _id: user._id },
// //       { 
// //         otp,
// //         otpExpiry: Date.now() + 300000,
// //         $inc: { otpAttempts: 1 } 
// //       }
// //     );

// //     // Success Response
// //     res.json({
// //       success: true,
// //       message: 'OTP sent successfully',
// //       maskedMobile: mobile.slice(-4).padStart(10, '*'),
// //       otpExpiry: 300
// //     });

// //   } catch (error) {
// //     console.error('API Error:', error);
    
// //     // Specialized Error Handling
// //     const errorMap = {
// //       ENOTFOUND: { code: 503, message: 'SMS service unavailable' },
// //       ECONNABORTED: { code: 504, message: 'SMS timeout' },
// //       ERR_BAD_REQUEST: { code: 400, message: 'Invalid SMS request' }
// //     };

// //     const errorInfo = errorMap[error.code] || { 
// //       code: 500, 
// //       message: 'Internal server error' 
// //     };

// //     res.status(errorInfo.code).json({
// //       success: false,
// //       error: errorInfo.message,
// //       ...(process.env.NODE_ENV === 'development' && {
// //         details: error.message,
// //         stack: error.stack
// //       })
// //     });
// //   }
// // });



















// const express = require('express');
// const router = express.Router();
// const AdminLogin = require('../Admin/AdminModel');
// const bcrypt = require('bcrypt');
// const axios = require('axios');
// const https = require('https');

// // SMS Service Helper
// class SMSService {
//   constructor() {
//     this.baseURL = process.env.SMS_BASE_URL || 'https://www.smsidea.co.in';
//     this.config = {
//       username: process.env.SMS_USERNAME,
//       password: process.env.SMS_PASSWORD,
//       senderId: process.env.SMS_SENDER_ID
//     };
//   }

//   async sendOTP(mobile, message) {
//     try {
//       const params = new URLSearchParams({
//         mobile: this.config.username,
//         pass: this.config.password,
//         senderid: this.config.senderId,
//         to: mobile,
//         msg: encodeURIComponent(message),
//         route: '1',
//         msgtype: 'text',
//         format: 'json'
//       });

//       const response = await axios.get(`${this.baseURL}/smsstatuswithid.aspx?${params}`, {
//         timeout: 10000
//       });

//       return this.parseResponse(response.data);
//     } catch (error) {
//       console.error('SMS Error:', error);
//       throw new Error('SMS service unavailable');
//     }
//   }

//   parseResponse(data) {
//     try {
//       if (typeof data === 'object') return data;
//       if (data.startsWith('{')) return JSON.parse(data);
//       if (data.startsWith('<')) return this.parseXMLResponse(data);
//       return this.parseStringResponse(data);
//     } catch (e) {
//       return { status: 'error', message: 'Invalid response format' };
//     }
//   }

//   parseXMLResponse(xml) {
//     const parser = new xml2js.Parser();
//     let result;
//     parser.parseString(xml, (err, res) => {
//       if (!err) result = res.smsresponse;
//     });
//     return result;
//   }

//   parseStringResponse(str) {
//     const [status, message] = str.split(':').map(s => s.trim());
//     return { status, statusdesc: message };
//   }
// }

// // OTP Generation
// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// // Route Handler
// router.post('/send-login-otp', async (req, res) => {
//   try {
//     // Validate input
//     const { userType, name, password, role } = req.body;
//     if (!userType || !name || !password || !role) {
//       return res.status(400).json({
//         success: false,
//         error: 'Missing required fields',
//         missing: ['userType', 'name', 'password', 'role'].filter(f => !req.body[f])
//       });
//     }

//     // Find user
//     const user = await AdminLogin.findOne({
//       userType: new RegExp(`^${userType}$`, 'i'),
//       name: new RegExp(`^${name}$`, 'i'),
//       role: new RegExp(`^${role}$`, 'i')
//     }).select('+password');

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ success: false, error: 'Invalid credentials' });
//     }

//     // Generate and send OTP
//     const otp = generateOTP();
//     const smsService = new SMSService();
//     const formattedMobile = `91${user.mobile}`;
    
//     // Send SMS
//     const smsResponse = await smsService.sendOTP(
//       formattedMobile,
//       `Your OTP is ${otp}. Valid for 5 minutes.`
//     );

//     if (smsResponse.status !== 'Success') {
//       throw new Error(smsResponse.statusdesc || 'SMS delivery failed');
//     }

//     // Update user record
//     user.otp = otp;
//     user.otpExpiry = Date.now() + 300000; // 5 minutes
//     await user.save();

//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       maskedMobile: user.mobile.slice(-4).padStart(10, '*'),
//       otpExpiry: 300
//     });

//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
//     });
//   }
// });













// // const express = require('express');
// // const router = express.Router();
// // const AdminLogin = require('../Admin/AdminModel');
// // const bcrypt = require('bcrypt');
// // const axios = require('axios');
// // const https = require('https');

// // // SMS Configuration
// // const SMS_CONFIG = {
// //   BASE_URL: process.env.SMS_BASE_URL || 'https://www.smsidea.co.in',
// //   ENDPOINT: '/smsstatuswithid.aspx',
// //   TIMEOUT: 15000,
// //   RETRIES: 3,
// //   PARAMS: {
// //     user: process.env.SMS_USERNAME,
// //     pass: process.env.SMS_PASSWORD,
// //     senderid: process.env.SENDER_ID,
// //     route: "1",
// //     TemplateID: process.env.DLT_TEMPLATE_ID,
// //     EntityID: process.env.DLT_ENTITY_ID,
// //     accusage: "1",
// //     type: "text",
// //     format: "json"
// //   }
// // };

// // // Axios client for SMS sending
// // const smsClient = axios.create({
// //   baseURL: SMS_CONFIG.BASE_URL,
// //   timeout: SMS_CONFIG.TIMEOUT,
// //   httpsAgent: new https.Agent({ keepAlive: true }),
// //   validateStatus: () => true // Handle all response statuses
// // });

// // // OTP Generation
// // const generateOTP = () => {
// //   return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
// // };

// // // Mobile Number Formatter
// // const formatMobileNumber = (rawNumber) => {
// //   const cleaned = rawNumber.replace(/\D/g, '');
// //   if (cleaned.length < 10) throw new Error('Invalid mobile number length');
// //   return cleaned.startsWith('91') ? cleaned : `91${cleaned.slice(-10)}`;
// // };

// // // Send OTP Function with Logging
// // const sendOTP = async (mobile, otp) => {
// //   const smsPayload = {
// //     ...SMS_CONFIG.PARAMS,
// //     mobiles: mobile,
// //     message: encodeURIComponent(`Your OTP is ${otp}. Valid for 5 minutes.`)
// //   };

// //   console.log('Sending SMS API Request:', smsPayload);

// //   for (let attempt = 1; attempt <= SMS_CONFIG.RETRIES; attempt++) {
// //     try {
// //       const smsResponse = await smsClient.get(SMS_CONFIG.ENDPOINT, { params: smsPayload });

// //       console.log(`Attempt ${attempt}: API Response -`, smsResponse.data);

// //       if (smsResponse.data.includes('Success')) return true;
// //       console.warn(`Attempt ${attempt} failed:`, smsResponse.data);

// //       if (attempt < SMS_CONFIG.RETRIES) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
// //     } catch (error) {
// //       console.error(`SMS attempt ${attempt} failed:`, error.message);

// //       if (attempt === SMS_CONFIG.RETRIES) throw new Error('SMS send failed');
// //     }
// //   }
// //   return false;
// // };

// // // OTP Login Route
// // router.post('/send-login-otp', async (req, res) => {
// //   try {
// //     // Input Validation
// //     const { userType, name, password, role } = req.body;
// //     if (!userType || !name || !password || !role) {
// //       return res.status(400).json({ success: false, error: 'Missing required fields' });
// //     }

// //     // User Lookup
// //     const user = await AdminLogin.findOne({ userType, name, role }).select('+password');
// //     if (!user || !(await bcrypt.compare(password, user.password))) {
// //       return res.status(401).json({ success: false, error: 'Invalid credentials' });
// //     }

// //     // Generate & Send OTP
// //     const otp = generateOTP();
// //     const mobile = formatMobileNumber(user.mobile);
// //     if (await sendOTP(mobile, otp)) {
// //       await AdminLogin.updateOne({ _id: user._id }, { otp, otpExpiry: Date.now() + 300000 });

// //       return res.json({
// //         success: true,
// //         message: 'OTP sent successfully',
// //         maskedMobile: mobile.slice(-4).padStart(10, '*'),
// //         otpExpiry: 300
// //       });
// //     }

// //     throw new Error('Failed to send OTP');
// //   } catch (error) {
// //     console.error('API Error:', error);

// //     res.status(500).json({
// //       success: false,
// //       error: 'Internal server error',
// //       details: error.message
// //     });
// //   }
// // });



// // -------------------

// // router.post('/send-login-otp', async (req, res) => {
// //   const { userType, name, password, role } = req.body;

// //   // Validation
// //   const missingFields = [];
// //   if (!userType) missingFields.push('userType');
// //   if (!name) missingFields.push('name');
// //   if (!password) missingFields.push('password');
// //   if (!role) missingFields.push('role');
  
// //   if (missingFields.length > 0) {
// //     return res.status(400).json({
// //       error: 'Missing required fields',
// //       missing: missingFields
// //     });
// //   }

// //   try {
// //     // Find user (case-insensitive search)
// //     // const user = await AdminLogin.findOne({
// //     //   userType: { $regex: new RegExp(`^${userType}$`, 'i') },
// //     //   name: { $regex: new RegExp(`^${name}$`, 'i') },
// //     //   role: { $regex: new RegExp(`^${role}$`, 'i') }
// //     // });

// //     const user = await AdminLogin.findOne({
// //   userType: { $regex: new RegExp(`^${userType.trim()}$`, 'i') },
// //   name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
// //   role: { $regex: new RegExp(`^${role.trim()}$`, 'i') }
// // });

// //     if (!user) {
// //       return res.status(401).json({ error: 'Invalid credentials' });
// //     }

// //     // Verify password
// //     const isPasswordValid = await bcrypt.compare(password, user.password);
// //     if (!isPasswordValid) {
// //       return res.status(401).json({ error: 'Invalid credentials' });
// //     }

// //     // Generate OTP
// //     const otp = Math.floor(100000 + Math.random() * 900000).toString();
// //     const mobile = user.mobile.startsWith('91') 
// //       ? user.mobile 
// //       : `91${user.mobile}`;

// //     // Prepare SMS parameters
// //     const smsParams = {
// //       user: process.env.SMS_USERNAME,
// //       pass: process.env.SMS_PASSWORD,
// //       senderId: process.env.SENDER_ID,
// //       to: mobile,
// //       message: `Your OTP is ${otp}. Valid for 5 minutes.`,
// //       route: 1,
// //       TemplateID: process.env.DLT_TEMPLATE_ID,
// //       EntityID: process.env.DLT_ENTITY_ID
// //     };

// //     // Send SMS
// //     const response = await axios.get(
// //       'https://www.smsidea.co.in/smsstatuswithid.aspx',
// //       { params: smsParams }
// //     );

// //     // Handle SMS API errors
// //     if (response.data.toLowerCase().includes('error')) {
// //       return res.status(502).json({
// //         error: 'SMS service unavailable',
// //         details: response.data
// //       });
// //     }

// //     // Update OTP in database
// //     user.otp = otp;
// //     await user.save();

// //     res.status(200).json({
// //       success: true,
// //       message: 'OTP sent successfully',
// //       mobile: mobile,
// //       maskedMobile: `******${mobile.slice(-4)}`
// //     });

// //   } catch (error) {
// //     console.error('Server error:', error);
// //     res.status(500).json({
// //       error: 'Internal server error',
// //       ...(process.env.NODE_ENV === 'development' && { 
// //         details: error.message 
// //       })
// //     });
// //   }
// // });



// // router.post('/send-login-otp', async (req, res) => {
// //     const { userType, name, password, role } = req.body;

// //     // Input validation
// //     const missingFields = [];
// //     if (!userType) missingFields.push('userType');
// //     if (!name) missingFields.push('name');
// //     if (!password) missingFields.push('password');
// //     if (!role) missingFields.push('role');

// //     if (missingFields.length > 0) {
// //         return res.status(400).json({
// //             success: false,
// //             error: 'Missing required fields',
// //             missing: missingFields
// //         });
// //     }

// //     try {
// //         // Clean and normalize inputs
// //         const cleanUserType = userType.trim().toLowerCase();
// //         const cleanName = name.trim().toLowerCase();
// //         const cleanRole = role.trim().toLowerCase();

// //         // Find user with case-insensitive search
// //         const user = await AdminLogin.findOne({
// //             userType: { $regex: new RegExp(`^${cleanUserType}$`, 'i') },
// //             name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
// //             role: { $regex: new RegExp(`^${cleanRole}$`, 'i') }
// //         }).select('+password');

// //         if (!user) {
// //             return res.status(401).json({
// //                 success: false,
// //                 error: 'Invalid credentials'
// //             });
// //         }

// //         // Validate password
// //         const isPasswordValid = await bcrypt.compare(password, user.password);
// //         if (!isPasswordValid) {
// //             return res.status(401).json({
// //                 success: false,
// //                 error: 'Invalid credentials'
// //             });
// //         }

// //         // Generate OTP and format mobile
// //         // const otp = Math.floor(100000 + Math.random() * 900000).toString();
// //         // const formattedMobile = user.mobile.startsWith('91') 
// //         //     ? user.mobile 
// //         //     : `91${user.mobile}`;

// //         // Generate OTP and format mobile number
// // const otp = Math.floor(100000 + Math.random() * 900000).toString();
// // const formattedMobile = user.mobile.startsWith('91') 
// //   ? user.mobile 
// //   : `91${user.mobile}`;

// // // Encode the message
// // const encodedMessage = encodeURIComponent( // <-- ADD THIS LINE
// //   `Your OTP is ${otp}. Valid for 5 minutes.`
// // );

// //         // SMS Parameters with verified names and encoding
// //        // Updated SMS Parameters (Verified with SMS Idea Support)
// // const smsParams = {
// //   username: process.env.SMS_USERNAME, // Changed from "user"
// //   password: process.env.SMS_PASSWORD, // Changed from "pass"
// //   senderid: process.env.SENDER_ID,
// //   mobiles: formattedMobile, // Parameter name might be "mobiles"
// //   message: encodedMessage,
// //   route: "1",
// //   templateid: process.env.DLT_TEMPLATE_ID, // Lowercase
// //   entityid: process.env.DLT_ENTITY_ID, // Lowercase
// //   accusage: "1",
// //   type: "text",
// //   format: "json"
// // };

// //         console.log('SMS Params:', { 
// //             ...smsParams, 
// //             user: '***', 
// //             pass: '***' 
// //         });

// //         // Send SMS request
// //       const smsResponse = await axios.get(
// //   'https://www.smsidea.co.in/smsstatuswithid.aspx',
// //   { 
// //     params: smsParams,
// //     timeout: 20000 // 20 seconds
// //   }
// // );

// //         // Handle SMS response
// //         const responseText = smsResponse.data.toString().toLowerCase();
// //         if (responseText.includes('error')) {
// //             console.error('SMS Error:', {
// //                 params: smsParams,
// //                 response: smsResponse.data
// //             });
// //             return res.status(502).json({
// //                 success: false,
// //                 error: 'SMS service unavailable',
// //                 providerError: smsResponse.data,
// //                 mobile: formattedMobile
// //             });
// //         }

// //         // Update user record
// //         await AdminLogin.updateOne(
// //             { _id: user._id },
// //             { 
// //                 $set: { 
// //                     otp: otp,
// //                     otpExpiry: Date.now() + 300000 
// //                 } 
// //             }
// //         );

// //         return res.status(200).json({
// //             success: true,
// //             message: 'OTP sent successfully',
// //             mobile: formattedMobile,
// //             maskedMobile: `******${formattedMobile.slice(-4)}`,
// //             otpExpiry: 300
// //         });

// //     } catch (error) {
// //         console.error('Server Error:', error);
// //         return res.status(500).json({
// //             success: false,
// //             error: 'Internal server error',
// //             ...(process.env.NODE_ENV === 'development' && {
// //                 details: error.message
// //             })
// //         });
// //     }
// // });


// // router.post('/send-login-otp', async (req, res) => {
// //     const { userType, name, password, role } = req.body;

// //     // Input validation
// //     const missingFields = [];
// //     if (!userType) missingFields.push('userType');
// //     if (!name) missingFields.push('name');
// //     if (!password) missingFields.push('password');
// //     if (!role) missingFields.push('role');

// //     if (missingFields.length > 0) {
// //         return res.status(400).json({
// //             success: false,
// //             error: 'Missing required fields',
// //             missing: missingFields
// //         });
// //     }

// //     try {
// //         // Clean and normalize inputs
// //         const cleanUserType = userType.trim().toLowerCase();
// //         const cleanName = name.trim().toLowerCase();
// //         const cleanRole = role.trim().toLowerCase();

// //         // Find user with case-insensitive search
// //         const user = await AdminLogin.findOne({
// //             userType: { $regex: new RegExp(`^${cleanUserType}$`, 'i') },
// //             name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
// //             role: { $regex: new RegExp(`^${cleanRole}$`, 'i') }
// //         }).select('+password');

// //         if (!user) {
// //             console.log(`User not found: ${cleanName}`);
// //             return res.status(401).json({
// //                 success: false,
// //                 error: 'Invalid credentials'
// //             });
// //         }

// //         // Validate password
// //         const isPasswordValid = await bcrypt.compare(password, user.password);
// //         if (!isPasswordValid) {
// //             console.log(`Invalid password for user: ${user.name}`);
// //             return res.status(401).json({
// //                 success: false,
// //                 error: 'Invalid credentials'
// //             });
// //         }

// //         // Generate 6-digit OTP
// //         const otp = Math.floor(100000 + Math.random() * 900000).toString();
// //         const formattedMobile = user.mobile.startsWith('91') 
// //             ? user.mobile 
// //             : `91${user.mobile}`;

// //         // Prepare SMS parameters with proper encoding
// //         const encodedMessage = encodeURIComponent(
// //             `Your OTP is ${otp}. Valid for 5 minutes.`
// //         );

// //      // Final working parameters (confirmed via manual test)
// // const smsParams = {
// //   user: "9080004443",
// //   pass: "bbg2334455",
// //   senderid: "PONDYY", // Case-sensitive!
// //   mobileno: "919080829754", // "to" might need to be "mobileno"
// //   message: encodedMessage,
// //   route: "1",
// //   templateid: "1707160992285919677",
// //   entityid: "1701158073331580442",
// //   accusage: "1",
// //   type: "text",
// //   format: "json"
// // };
// //         // Send SMS through provider API
// //         const smsResponse = await axios.get(
// //             'https://www.smsidea.co.in/smsstatuswithid.aspx',
// //             { 
// //                 params: smsParams,
// //                 timeout: 10000 // 10 second timeout
// //             }
// //         );

// //         // Handle SMS provider response
// //         console.log('SMS Provider Response:', smsResponse.data);

// //         if (smsResponse.data.includes('Error') || 
// //             smsResponse.data.includes('error')) {
// //             console.error('SMS Delivery Failed:', {
// //                 code: smsResponse.status,
// //                 message: smsResponse.data,
// //                 mobile: formattedMobile
// //             });
            
// //             return res.status(502).json({
// //                 success: false,
// //                 error: 'SMS delivery failed',
// //                 providerError: smsResponse.data,
// //                 mobile: formattedMobile
// //             });
// //         }

// //         // Update user with OTP and expiry
// //         user.otp = otp;
// //         user.otpExpiry = Date.now() + 300000; // 5 minutes
// //         await user.save();

// //         // Successful response
// //         res.status(200).json({
// //             success: true,
// //             message: 'OTP sent successfully',
// //             mobile: formattedMobile,
// //             maskedMobile: `******${formattedMobile.slice(-4)}`,
// //             otpExpiry: 300 // 5 minutes in seconds
// //         });

// //     } catch (error) {
// //         console.error('Server Error:', {
// //             message: error.message,
// //             stack: error.stack,
// //             requestBody: req.body
// //         });
        
// //         res.status(500).json({
// //             success: false,
// //             error: 'Internal server error',
// //             ...(process.env.NODE_ENV === 'development' && {
// //                 details: error.message
// //             })
// //         });
// //     }
// // });



// // router.post('/send-login-otp', async (req, res) => {
// //     const { userType, name, password, role } = req.body;

// //     // Input validation
// //     const missingFields = [];
// //     if (!userType) missingFields.push('userType');
// //     if (!name) missingFields.push('name');
// //     if (!password) missingFields.push('password');
// //     if (!role) missingFields.push('role');

// //     if (missingFields.length > 0) {
// //         return res.status(400).json({
// //             success: false,
// //             error: 'Missing required fields',
// //             missing: missingFields
// //         });
// //     }

// //     try {
// //         // Clean inputs
// //         const cleanUserType = userType.trim().toLowerCase();
// //         const cleanName = name.trim().toLowerCase();
// //         const cleanRole = role.trim().toLowerCase();

// //         // Find user
// //         const user = await AdminLogin.findOne({
// //             userType: { $regex: new RegExp(`^${cleanUserType}$`, 'i') },
// //             name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
// //             role: { $regex: new RegExp(`^${cleanRole}$`, 'i') }
// //         }).select('+password');

// //         if (!user) {
// //             console.log(`User not found: ${cleanName}`);
// //             return res.status(401).json({
// //                 success: false,
// //                 error: 'Invalid credentials'
// //             });
// //         }

// //         // Validate password
// //         const isPasswordValid = await bcrypt.compare(password, user.password);
// //         if (!isPasswordValid) {
// //             console.log(`Invalid password for user: ${user.name}`);
// //             return res.status(401).json({
// //                 success: false,
// //                 error: 'Invalid credentials'
// //             });
// //         }

// //         // Generate OTP
// //         const otp = Math.floor(100000 + Math.random() * 900000).toString();
// //         const formattedMobile = user.mobile.startsWith('91') 
// //             ? user.mobile 
// //             : `91${user.mobile}`;

// //         console.log('Attempting SMS to:', formattedMobile);
// //         console.log('Using SMS Params:', {
// //             user: process.env.SMS_USERNAME,
// //             senderId: process.env.SENDER_ID,
// //             template: process.env.DLT_TEMPLATE_ID,
// //             entity: process.env.DLT_ENTITY_ID
// //         });

// //         // SMS configuration
// //         const smsParams = {
// //             user: process.env.SMS_USERNAME,
// //             pass: process.env.SMS_PASSWORD,
// //             senderId: process.env.SENDER_ID,
// //             to: formattedMobile,
// //             message: `Your OTP is ${otp}. Valid for 5 minutes.`,
// //             route: 1,
// //             TemplateID: process.env.DLT_TEMPLATE_ID,
// //             EntityID: process.env.DLT_ENTITY_ID
// //         };

// //         // Send SMS
// //         const smsResponse = await axios.get(
// //             'https://www.smsidea.co.in/smsstatuswithid.aspx',
// //             { 
// //                 params: smsParams,
// //                 timeout: 10000 // Increased timeout
// //             }
// //         );

// //         console.log('SMS API Response:', smsResponse.data);

// //         // Handle SMS errors
// //         if (typeof smsResponse.data === 'string' && smsResponse.data.toLowerCase().includes('error')) {
// //             console.error('SMS Failed:', {
// //                 code: smsResponse.status,
// //                 response: smsResponse.data,
// //                 mobile: formattedMobile
// //             });
            
// //             return res.status(502).json({
// //                 success: false,
// //                 error: 'SMS delivery failed',
// //                 providerError: smsResponse.data,
// //                 mobile: formattedMobile
// //             });
// //         }

// //         // Update user
// //         user.otp = otp;
// //         user.otpExpiry = Date.now() + 300000; // 5 minutes
// //         await user.save();

// //         // Success response
// //         res.status(200).json({
// //             success: true,
// //             message: 'OTP sent successfully',
// //             mobile: formattedMobile,
// //             maskedMobile: `******${formattedMobile.slice(-4)}`,
// //             otpExpiry: 300
// //         });

// //     } catch (error) {
// //         console.error('Server Error:', {
// //             message: error.message,
// //             stack: error.stack,
// //             requestBody: req.body
// //         });
        
// //         res.status(500).json({
// //             success: false,
// //             error: 'Internal server error',
// //             ...(process.env.NODE_ENV === 'development' && {
// //                 details: error.message
// //             })
// //         });
// //     }
// // });






// // Temporary password reset route (remove after use)
// router.post('/reset-password', async (req, res) => {
//   try {
//     const { username, newPassword } = req.body;
    
//     // Generate new hash
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(newPassword, salt);

//     // Update password
//     const result = await AdminLogin.updateOne(
//       { name: username },
//       { $set: { password: hashedPassword } }
//     );

//     if(result.modifiedCount === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "User not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Password reset successfully"
//     });

//   } catch (error) {
//     console.error("Password reset error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Internal server error"
//     });
//   }
// });



// // router.post('/send-login-otp', async (req, res) => {
// //     const { userType, name, password, role } = req.body;

// //     // Input validation with detailed error messages
// //     const missingFields = [];
// //     if (!userType) missingFields.push('userType');
// //     if (!name) missingFields.push('name');
// //     if (!password) missingFields.push('password');
// //     if (!role) missingFields.push('role');

// //     if (missingFields.length > 0) {
// //         return res.status(400).json({
// //             success: false,
// //             error: 'Missing required fields',
// //             missing: missingFields
// //         });
// //     }

// //     try {
// //         // Clean and format inputs
// //         const cleanUserType = userType.trim().toLowerCase();
// //         const cleanName = name.trim().toLowerCase();
// //         const cleanRole = role.trim().toLowerCase();

// //         // Find user with case-insensitive search and projection
// //         const user = await AdminLogin.findOne({
// //             userType: { $regex: new RegExp(`^${cleanUserType}$`, 'i') },
// //             name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
// //             role: { $regex: new RegExp(`^${cleanRole}$`, 'i') }
// //         }).select('+password');

// //         if (!user) {
// //             console.log(`User not found: ${cleanName}`);
// //             return res.status(401).json({
// //                 success: false,
// //                 error: 'Invalid credentials'
// //             });
// //         }

// //         // Password validation
// //         const isPasswordValid = await bcrypt.compare(password, user.password);
// //         if (!isPasswordValid) {
// //             console.log(`Invalid password for user: ${user.name}`);
// //             return res.status(401).json({
// //                 success: false,
// //                 error: 'Invalid credentials'
// //             });
// //         }

// //         // OTP generation
// //         const otp = Math.floor(100000 + Math.random() * 900000).toString();
// //         const formattedMobile = user.mobile.startsWith('91') 
// //             ? user.mobile 
// //             : `91${user.mobile}`;

// //         // SMS configuration
// //         const smsParams = {
// //             user: process.env.SMS_USERNAME,
// //             pass: process.env.SMS_PASSWORD,
// //             senderId: process.env.SENDER_ID,
// //             to: formattedMobile,
// //             message: `Your OTP is ${otp}. Valid for 5 minutes.`,
// //             route: 1,
// //             TemplateID: process.env.DLT_TEMPLATE_ID,
// //             EntityID: process.env.DLT_ENTITY_ID
// //         };

// //         // SMS transmission
// //         const smsResponse = await axios.get(
// //             'https://www.smsidea.co.in/smsstatuswithid.aspx',
// //             { params: smsParams, timeout: 5000 }
// //         );

// //         // Handle SMS provider errors
// //         if (smsResponse.data.toLowerCase().includes('error')) {
// //             console.error('SMS Gateway Error:', smsResponse.data);
// //             return res.status(502).json({
// //                 success: false,
// //                 error: 'SMS service temporarily unavailable',
// //                 providerError: smsResponse.data
// //             });
// //         }

// //         // Update user with new OTP
// //         user.otp = otp;
// //         user.otpExpiry = Date.now() + 300000; // 5 minutes expiry
// //         await user.save();

// //         // Successful response
// //         res.status(200).json({
// //             success: true,
// //             message: 'OTP sent successfully',
// //             mobile: formattedMobile,
// //             maskedMobile: `******${formattedMobile.slice(-4)}`,
// //             otpExpiry: 300 // seconds
// //         });

// //     } catch (error) {
// //         console.error('Server Error:', error);
// //         res.status(500).json({
// //             success: false,
// //             error: 'Internal server error',
// //             ...(process.env.NODE_ENV === 'development' && {
// //                 details: error.message,
// //                 stack: error.stack
// //             })
// //         });
// //     }
// // });




// // ************************
// // // POST: Send OTP after verifying user
// // router.post('/send-login-otp', async (req, res) => {
// //     const { userType, name, password, role } = req.body;

// //     if (!userType || !name || !password || !role) {
// //         return res.status(400).json({ message: 'All fields are required' });
// //     }

// //     try {
// //         // Step 1: Find user matching all fields
// //         const user = await AdminLogin.findOne({ userType, name, password, role });

// //         if (!user) {
// //             return res.status(401).json({ message: 'Invalid credentials' });
// //         }

// //         // Step 2: Generate OTP
// //         // const otp = Math.floor(100000 + Math.random() * 900000).toString();

// //         // Step 2: Generate OTP
// // const otp = Math.floor(100000 + Math.random() * 900000).toString();
// // console.log(`Generated OTP for ${user.name} (${user.mobile}): ${otp}`);  // 👈 Add this line


// //         // Step 3: Send OTP using SMSIdea
// //         // const smsUrl = 'https://www.smsidea.co.in/smsstatuswithid.aspx';
// //         // const smsParams = {
// //         //     mobile: user.mobile,
// //         //     message: `Your login OTP is ${otp}`,
// //         //     senderid: 'SMSIDA', // Replace with your DLT approved sender ID
// //         //     key: 'a2125466c08545e4b7387d06b8a2ec08', // Replace with your actual key
// //         //     accusage: 1
// //         // };

// //         const smsUrl = 'https://www.smsidea.co.in/smsstatuswithid.aspx';
// // const smsParams = {
// //     mobile: user.mobile,
// //     message: `Dear user, your OTP is ${otp}, valid for 5 mins.`, // ← match DLT template
// //     senderid: process.env.SENDER_ID,
// //     key: process.env.SMS_API_KEY,
// //     accusage: 1
// // };

// // const response = await axios.get(smsUrl, { params: smsParams });
// // console.log('SMS API response:', response.data); // ← log to check


// //         await axios.get(smsUrl, { params: smsParams });

// //         // Step 4: Save OTP to user document
// //         user.otp = otp;
// //         await user.save();

// //         // Step 5: Respond
// //         res.status(200).json({
// //             message: 'OTP sent successfully',
// //             mobile: user.mobile
// //         });
// //     } catch (error) {
// //         console.error('Error sending OTP:', error.message);
// //         res.status(500).json({ message: 'Internal server error' });
// //     }
// // });





// // // POST: Send OTP after verifying user credentials
// // router.post('/send-login-otp', async (req, res) => {
// //   const { userType, name, password, role } = req.body;

// //   // Validate required fields
// //   if (!userType || !name || !password || !role) {
// //     return res.status(400).json({ message: 'All fields are required' });
// //   }

// //   try {
// //     // Step 1: Find user by matching all given fields
// //     const user = await AdminLogin.findOne({ userType, name, password, role });
// //     if (!user) {
// //       return res.status(401).json({ message: 'Invalid credentials' });
// //     }

// //     // Step 2: Generate a 6-digit OTP
// //     const otp = Math.floor(100000 + Math.random() * 900000).toString();
// //     console.log(`Generated OTP for ${user.name} (${user.mobile}): ${otp}`);

// //     // Step 3: Prepare SMS sending parameters
// //     const smsUrl = 'https://www.smsidea.co.in/smsstatuswithid.aspx';
// //     const smsParams = {
// //       mobile: user.mobile,
// //       message: `Dear user, your OTP is ${otp}, valid for 5 mins.`, // DLT template compliant message
// //       senderid: process.env.SENDER_ID, // Make sure these env variables are set
// //       key: process.env.SMS_API_KEY,
// //       accusage: 1
// //     };

// //     // Step 4: Send OTP SMS
// //     const response = await axios.get(smsUrl, { params: smsParams });
// //     console.log('SMS API response:', response.data);

// //     // Optional: You might want to check the response for success/failure here

// //     // Step 5: Save OTP to user document in DB
// //     user.otp = otp;
// //     await user.save();

// //     // Step 6: Respond success
// //     res.status(200).json({
// //       message: 'OTP sent successfully',
// //       mobile: user.mobile
// //     });

// //   } catch (error) {
// //     console.error('Error sending OTP:', error.message);
// //     res.status(500).json({ message: 'Internal server error' });
// //   }
// // });



// // // Admin login route (POST /adminlogin)
// // router.post('/adminlogin', async (req, res) => {
// //     const { name, password, role, userType } = req.body;

// //     try {
// //         // Find the admin by name only
// //         const admin = await AdminLogin.findOne({ name });
// //         if (!admin) {
// //             return res.status(400).json({ message: 'Invalid credentials' });
// //         }

// //         // Check password, role, and userType
// //         if (
// //             admin.password !== password || 
// //             admin.role !== role || 
// //             admin.userType !== userType
// //         ) {
// //             return res.status(400).json({ message: 'Invalid credentials' });
// //         }

// //         // Success response
// //         return res.status(200).json({ 
// //             message: 'Login successful', 
// //             data: {
// //                 name: admin.name,
// //                 role: admin.role,
// //                 userType: admin.userType
// //             }
// //         });

// //     } catch (error) {
// //         return res.status(500).json({ message: 'Something went wrong', error: error.message });
// //     }
// // });



// // router.get('/get-admin-logs', async (req, res) => {
// //     const { page = 1, limit = 10 } = req.query; // Set default page and limit

// //     try {
// //         const logs = await AdminLogin.find()
// //             .skip((page - 1) * limit)  // Skip the appropriate number of records based on the page
// //             .limit(Number(limit))  // Limit the number of records returned
// //             .sort({ date: -1 }); // Sort logs by date in descending order (latest first)

// //         const totalLogs = await AdminLogin.countDocuments(); // Get the total number of logs

// //         return res.status(200).json({
// //             logs,
// //             totalLogs,
// //             totalPages: Math.ceil(totalLogs / limit),  // Calculate total pages
// //             currentPage: page
// //         });
// //     } catch (error) {
// //         return res.status(500).json({
// //             message: 'Server Error',
// //             error: error.message
// //         });
// //     }
// // });








// // // ***********************

// // // PPC OTP Endpoint
// // router.post('/send-login-otp', async (req, res) => {
// //   const { userType, name, password, role } = req.body;

// //   // Validate required fields
// //   if (!userType || !name || !password || !role) {
// //     return res.status(400).json({ error: 'All fields are required' });
// //   }

// //   try {
// //     // Find user
// //     const user = await AdminLogin.findOne({ userType, name, password, role });
// //     if (!user) return res.status(401).json({ error: 'Invalid credentials' });

// //     // Generate 6-digit OTP
// //     const otp = Math.floor(100000 + Math.random() * 900000).toString();

// //     // Format mobile number
// //     let mobile = user.mobile;
// //     if (!mobile.startsWith('91')) mobile = `91${mobile}`;

// //     // SMS API Parameters
// //     const smsParams = {
// //       user: process.env.SMS_USERNAME,      // 9080004443
// //       pass: process.env.SMS_PASSWORD,      // bbg2334455
// //       senderId: process.env.SENDER_ID,     // PONDYY
// //       to: mobile,
// //       message: `Your OTP is ${otp}. Valid for 5 minutes.`,
// //       route: 1,
// //       TemplateID: process.env.DLT_TEMPLATE_ID,
// //       EntityID: process.env.DLT_ENTITY_ID
// //     };

// //     // Send SMS
// //     const response = await axios.get('https://www.smsidea.co.in/smsstatuswithid.aspx', {
// //       params: smsParams
// //     });

// //     // Handle SMS API errors
// //     if (response.data.toLowerCase().includes('error')) {
// //       return res.status(500).json({
// //         error: 'SMS sending failed',
// //         details: response.data
// //       });
// //     }

// //     // Save OTP to database
// //     user.otp = otp;
// //     await user.save();

// //     res.status(200).json({
// //       success: true,
// //       message: 'OTP sent successfully',
// //       mobile: user.mobile
// //     });

// //   } catch (error) {
// //     console.error('Server error:', error);
// //     res.status(500).json({ error: 'Internal server error' });
// //   }
// // });

// // // ***************





// router.post('/admin-create', async (req, res) => {
//     const newUser = new AdminLogin({
//         name: req.body.name,
//         address: req.body.address,
//         office: req.body.office,
//         jobType: req.body.jobType,
//         targetWeek: req.body.targetWeek,
//         targetMonth: req.body.targetMonth,
//         mobile: req.body.mobile,
//         aadhaarNumber: req.body.aadhaarNumber,
//         userName: req.body.userName,
//         password: req.body.password,
//         role: req.body.role,
//         userType: req.body.userType
//     });

//     try {
//         const savedUser = await newUser.save();
//         res.status(201).json(savedUser);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

// // Get all users
// router.get('/admin-all', async (req, res) => {
//     try {
//         const users = await AdminLogin.find();
//         res.json(users);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });



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


// router.delete('/admin-delete/:id', async (req, res) => {
//     try {
//         const userId = req.params.id;
        
//         const user = await AdminLogin.findById(userId);
//         if (user == null) {
//             return res.status(404).json({ message: 'Cannot find user' });
//         }

//         // Use findByIdAndDelete() instead of remove()
//         await AdminLogin.findByIdAndDelete(userId);

//         res.json({ message: 'Deleted user' });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });

// module.exports = router;










// const express = require('express');
// const router = express.Router();
// const AdminLogin = require('../Admin/AdminModel');
// const bcrypt = require('bcrypt');
// const axios = require('axios');

// class SMSService {
//   constructor() {
//     this.baseURL = process.env.SMS_BASE_URL || 'https://www.smsidea.co.in';
//     this.config = {
//       username: process.env.SMS_USERNAME,
//       password: process.env.SMS_PASSWORD,
//       senderId: process.env.SMS_SENDER_ID
//     };
//   }

//   async sendOTP(mobile, message) {
//     const params = new URLSearchParams({
//       mobile: this.config.username,
//       pass: this.config.password,
//       senderid: this.config.senderId,
//       to: mobile,
//       msg: message,
//       route: '1',
//       msgtype: 'text',
//       format: 'json'
//     });

//     const response = await axios.get(`${this.baseURL}/smsstatuswithid.aspx?${params}`);
//     return this.parseResponse(response.data);
//   }

//   parseResponse(data) {
//     if (typeof data === 'object') return data;
//     if (data.startsWith('{')) return JSON.parse(data);
//     const [status, message] = data.split(':').map(s => s.trim());
//     return { status, statusdesc: message };
//   }
// }

// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// router.post('/send-login-otp', async (req, res) => {
//   try {
//     const { userType, name, password, role } = req.body;

//     if (!userType || !name || !password || !role) {
//       return res.status(400).json({
//         success: false,
//         error: 'Missing required fields',
//         missing: ['userType', 'name', 'password', 'role'].filter(f => !req.body[f])
//       });
//     }

//     const user = await AdminLogin.findOne({
//       userType: new RegExp(`^${userType}$`, 'i'),
//       name: new RegExp(`^${name}$`, 'i'),
//       role: new RegExp(`^${role}$`, 'i')
//     }).select('+password');

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ success: false, error: 'Invalid credentials' });
//     }

//     const otp = generateOTP();
//     const smsService = new SMSService();
//     const formattedMobile = `91${user.mobile}`;

//     const smsResponse = await smsService.sendOTP(
//       formattedMobile,
//       `Your OTP is ${otp}. Valid for 5 minutes.`
//     );

//     if (smsResponse.status !== 'Success') {
//       throw new Error(smsResponse.statusdesc || 'SMS delivery failed');
//     }

//     user.otp = otp;
//     user.otpExpiry = Date.now() + 5 * 60 * 1000;
//     await user.save();

//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       maskedMobile: user.mobile.slice(-4).padStart(10, '*'),
//       otpExpiry: 300
//     });

//   } catch (error) {
//     console.error('OTP Error:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });


// router.post('/send-otp-login', async (req, res) => {
//   try {
//     const { mobileNumber } = req.body;

//     // Validate mobile number (Indian number, 10 digits, optionally with country code)
//     if (!mobileNumber || !/^(\+91|91)?[6-9]\d{9}$/.test(mobileNumber)) {
//       return res.status(400).json({ success: false, message: 'Invalid mobile number' });
//     }

//     // Normalize mobile number to 10 digits without prefix
//     let normalizedMobile = mobileNumber.replace(/^(\+91|91)/, '');

//     // Generate 6-digit OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     // Compose SMS message (URL encode it)
//     const message = `Your OTP is ${otp}. It will expire in 5 minutes.`;
//     const encodedMessage = encodeURIComponent(message);

//     // Build SMS API URL with all required params according to SMSIdea docs
// const smsUrl = `https://smsidea.co.in/smsstatuswithid.aspx?` +
//   `username=${encodeURIComponent(process.env.SMS_USERNAME)}` +
//   `&password=${encodeURIComponent(process.env.SMS_PASSWORD)}` +
//   `&senderid=${encodeURIComponent(process.env.SMS_SENDER_ID)}` +  // senderid is correct here
//   `&mobile=91${normalizedMobile}` +
//   `&msg=${encodedMessage}` +  // use msg here, NOT message
//   `&route=1&type=1&format=json`;


//   console.log('SMS URL:', smsUrl);

//     // Send SMS via GET request
//     const smsResponse = await axios.get(smsUrl);

//     // Log for debugging
//     console.log('SMS API Response:', smsResponse.data);

//     // SMSIdea returns JSON or text; check for success:
//     // According to docs, success usually has 'status' or 'ErrorCode' === '0'
//     if (smsResponse.data && (smsResponse.data.Status === "Success" || smsResponse.data.ErrorCode === "0")) {
//       // TODO: Save OTP and expiry to DB if you want to verify later

//       return res.json({
//         success: true,
//         message: 'OTP sent successfully',
//         otp, // Remove this in production!
//         maskedMobile: maskMobile(normalizedMobile),
//         otpExpiry: 300
//       });
//     } else {
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send OTP',
//         details: smsResponse.data
//       });
//     }
//   } catch (error) {
//     console.error('OTP Error:', error.message || error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error while sending OTP'
//     });
//   }
// });

// // Utility to mask mobile number (e.g. 91******1234)
// function maskMobile(mobile) {
//   return mobile.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
// }


// module.exports = router;










// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// const { sendOtpSms } = require('../utils/smsSender');

// const { checkDeliveryStatus } = require('../utils/smsSender');
// router.get('/check-delivery-status/:messageId', async (req, res) => {
//   const messageId = req.params.messageId;
//   if (!messageId) {
//     return res.status(400).json({ success: false, message: 'messageId is required' });
//   }
//   try {
//     const data = await checkDeliveryStatus(messageId);
//     if (!data) {
//       return res.status(500).json({ success: false, message: 'Failed to fetch delivery status' });
//     }
//     res.json({ success: true, status: data });
//   } catch (error) {
//     console.error('Error in /check-delivery-status:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });

// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// router.post('/send-otp-login', async (req, res) => {
//   try {
//     const { mobileNumber } = req.body;
//     if (!mobileNumber || !/^(\+91|91)?[6-9][0-9]{9}$/.test(mobileNumber)) {
//       return res.status(400).json({ success: false, message: 'Invalid mobile number' });
//     }

//     const otp = generateOTP();

//     const smsResult = await sendOtpSms(mobileNumber, otp);

//     if (!smsResult.success) {
//       return res.status(500).json({ success: false, message: smsResult.message });
//     }

//     // Optionally save OTP in DB with expiry here

//     res.json({
//       success: true,
//       message: smsResult.message,
//       maskedMobile: mobileNumber.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
//       otpExpiry: 300,
//       // otp // Only for dev/testing, remove before production
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// });

// module.exports = router;



















// -------------------------*********************-------------------------



// const express = require('express');
// const router = express.Router();
// const PaymentPayU = require('./models/PaymentPayU'); // Adjust path as needed

// // Helper function to normalize phone number (if needed)
// const normalizePhoneNumber = (phone) => {
//   // Your existing normalize logic or just return phone if none
//   return phone;
// };

// // Generic route generator for status
// const getPaymentsByStatus = (status) => async (req, res) => {
//   try {
//     let { phoneNumber } = req.params;
//     phoneNumber = normalizePhoneNumber(phoneNumber);

//     const payments = await PaymentPayU.find({
//       phone: { $regex: new RegExp(phoneNumber + '$') },
//       payustatususer: status,
//     }).sort({ createdAt: -1 });

//     if (payments.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `No payments with status '${status}' found for this phone number.`,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       phoneNumber,
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

// // Define routes
// router.get('/payments/pay-now/:phoneNumber', getPaymentsByStatus('pay now'));
// router.get('/payments/pay-later/:phoneNumber', getPaymentsByStatus('pay later'));
// router.get('/payments/paid/:phoneNumber', getPaymentsByStatus('paid'));
// router.get('/payments/pay-failed/:phoneNumber', getPaymentsByStatus('pay failed'));

// module.exports = router;
