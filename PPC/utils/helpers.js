const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const isWithinAllowedTime = () => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 9 && hour < 20;
};

module.exports = {
  generateOTP,
  isWithinAllowedTime,
};











// const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// const isWithinAllowedTime = () => {
//   const now = new Date();
//   const hour = now.getHours();
//   return hour >= 9 && hour < 20; // 9 AM to before 8 PM
// };

// module.exports = {
//   generateOTP,
//   isWithinAllowedTime,
// };
