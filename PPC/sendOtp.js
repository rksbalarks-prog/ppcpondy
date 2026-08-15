
// // const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// // const snsClient = new SNSClient({
// //   region: "ap-south-1",
// //   credentials: {
// //     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
// //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// //   }
// // });

// // function generateOTP() {
// //   return Math.floor(100000 + Math.random() * 900000).toString();
// // }



// const sendOtp = async (phoneNumber) => {
//   const otp = generateOTP();

//   // This message must EXACTLY match your approved DLT template
//   const message = `Your OTP is : ${otp} Thanks for using PPC Pondy`;

//   const params = {
//     Message: message,
//     PhoneNumber: `+91${phoneNumber}`,
//     MessageAttributes: {
//       'AWS.SNS.SMS.SMSType': {
//         DataType: 'String',
//         StringValue: 'Transactional'
//       },
//       'AWS.SNS.SMS.SenderID': {
//         DataType: 'String',
//         StringValue: process.env.SENDER_ID || 'PONDYY'
//       },
//       'AWS.SNS.SMS.EntityId': {
//         DataType: 'String',
//         StringValue: process.env.DLT_ENTITY_ID
//       },
//       'AWS.SNS.SMS.TemplateId': {
//         DataType: 'String',
//         StringValue: process.env.DLT_TEMPLATE_ID
//       }
//     }
//   };

//   try {
//     const command = new PublishCommand(params);
//     const result = await snsClient.send(command);
//     return { success: true, otp, messageId: result.MessageId };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// };

// module.exports = sendOtp;




// require("dotenv").config();
// const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// const snsClient = new SNSClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const sendOtp = async (phoneNumber, otp) => {
//   // Ensure phone number is in E.164 format
//   const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  
//   const params = {
//     PhoneNumber: formattedPhone,
//  Message: `Your OTP is: ${otp}`,
//      MessageAttributes: {
//       'AWS.SNS.SMS.SenderID': {
//         DataType: 'String',
//         StringValue: process.env.AWS_SNS_SENDER_ID,
//       },
//       'AWS.SNS.SMS.SMSType': {
//         DataType: 'String',
//         StringValue: 'Transactional',
//       },
//       'AWS.MM.SMS.EntityId': {
//         DataType: 'String',
//         StringValue: process.env.DLT_ENTITY_ID,
//       },
//       'AWS.MM.SMS.TemplateId': {
//         DataType: 'String',
//         StringValue: process.env.DLT_TEMPLATE_ID,
//       },
//     }
//   };

//   try {
//     const result = await snsClient.send(new PublishCommand(params));
//     console.log("Message sent:", result.MessageId);
//     return result;
//   } catch (err) {
//     console.error("Error sending SMS:", err);
//     throw err;
//   }
// };

// module.exports=sendOtp;






// // require("dotenv").config();
// // const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// // const snsClient = new SNSClient({
// //   region: process.env.AWS_REGION,
// //   credentials: {
// //     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
// //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// //   },
// // });

// // const sendOtp = async (phoneNumber, otp) => {
// //   const params = {
// //     PhoneNumber: phoneNumber,
// //     Message: `Your OTP is: ${otp}`,
// //     MessageAttributes: {
// //       'AWS.SNS.SMS.SenderID': {
// //         DataType: 'String',
// //         StringValue: process.env.AWS_SNS_SENDER_ID,
// //       },
// //       'AWS.SNS.SMS.SMSType': {
// //         DataType: 'String',
// //         StringValue: 'Transactional',
// //       },
// //       'AWS.SNS.SMS.ENTITYID': {
// //         DataType: 'String',
// //         StringValue: process.env.AWS_SNS_ENTITY_ID,
// //       },
// //       'AWS.SNS.SMS.TEMPLATE_ID': {
// //         DataType: 'String',
// //         StringValue: process.env.AWS_SNS_TEMPLATE_ID,
// //       }
// //     }
// //   };

// //   try {
// //     const result = await snsClient.send(new PublishCommand(params));
// //     console.log("Message sent:", result.MessageId);
// //     return result;
// //   } catch (err) {
// //     console.error("Error sending SMS:", err);
// //     throw err;
// //   }
// // };

// // module.exports = sendOtp;




require("dotenv").config();
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const sendOtp = async (phoneNumber, otp) => {
  const formattedPhone = phoneNumber.startsWith('+')
    ? phoneNumber
    : `+91${phoneNumber}`;

  // ✅ Build message with your format
  const message = `Your OTP is : ${otp}. Thanks for using PPC Pondy`;
//   const message = `Your OTP is : ${otp}. Thanks for using Rent Pondy`;


  const params = {
    PhoneNumber: formattedPhone,
    Message: message, // use variable instead of hardcoding
    MessageAttributes: {
      'AWS.SNS.SMS.SenderID': {
        DataType: 'String',
        StringValue: process.env.SMS_SENDER_ID,
      },
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional',
      },
      'AWS.MM.SMS.EntityId': {
        DataType: 'String',
        StringValue: process.env.DLT_ENTITY_ID,
      },
      'AWS.MM.SMS.TemplateId': {
        DataType: 'String',
        StringValue: process.env.DLT_TEMPLATE_ID,
      },
    },
  };

  try {
    const result = await snsClient.send(new PublishCommand(params));
    // console.log("✅ Message sent:", result.MessageId);
    return result;
  } catch (err) {
    // console.error("❌ Error sending SMS:", err);
    throw err;
  }
};

module.exports = sendOtp;






// const sendOtp = async (phoneNumber) => {
//   const otp = generateOTP();

//   // This message must EXACTLY match your approved DLT template
//   const message = `Your OTP is : ${otp} Thanks for using PPC Pondy`;

//   const params = {
//     Message: message,
//     PhoneNumber: `+91${phoneNumber}`,
//     MessageAttributes: {
//       'AWS.SNS.SMS.SMSType': {
//         DataType: 'String',
//         StringValue: 'Transactional'
//       },
//       'AWS.SNS.SMS.SenderID': {
//         DataType: 'String',
//         StringValue: process.env.SENDER_ID || 'PONDYY'
//       },
//       'AWS.MM.SMS.EntityId': {
//         DataType: 'String',
//         StringValue: process.env.DLT_ENTITY_ID,
//       },
//       'AWS.MM.SMS.TemplateId': {
//         DataType: 'String',
//         StringValue: process.env.DLT_TEMPLATE_ID,
//       },
//     }
//   };

//   try {
//     const command = new PublishCommand(params);
//     const result = await snsClient.send(command);
//     return { success: true, otp, messageId: result.MessageId };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// };

// module.exports = sendOtp;









// require("dotenv").config();
// const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// const snsClient = new SNSClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const sendOtp = async (phoneNumber, otp) => {
//   const formattedPhone = phoneNumber.startsWith('+')
//     ? phoneNumber
//     : `+91${phoneNumber}`;

//   const params = {
//     PhoneNumber: formattedPhone,
//     Message: `Your OTP is ${otp}`, // EXACT match with DLT template
//     MessageAttributes: {
//       'AWS.SNS.SMS.SenderID': {
//         DataType: 'String',
//         StringValue: process.env.SMS_SENDER_ID, // Fixed env var
//       },
//       'AWS.SNS.SMS.SMSType': {
//         DataType: 'String',
//         StringValue: 'Transactional',
//       },
//       'AWS.MM.SMS.EntityId': {
//         DataType: 'String',
//         StringValue: process.env.DLT_ENTITY_ID,
//       },
//       'AWS.MM.SMS.TemplateId': {
//         DataType: 'String',
//         StringValue: process.env.DLT_TEMPLATE_ID,
//       },
//     },
//   };

//   try {
//     const result = await snsClient.send(new PublishCommand(params));
//     console.log("Message sent:", result.MessageId);
//     return result;
//   } catch (err) {
//     console.error("Error sending SMS:", err);
//     throw err;
//   }
// };

// module.exports = sendOtp;




