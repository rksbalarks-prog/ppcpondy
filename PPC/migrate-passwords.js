const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Add this line
const AdminLogin = require('./Admin/AdminModel');
require('dotenv').config();

const updateExistingPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected');
    
    const users = await AdminLogin.find({});
    for (const user of users) {
      if (user.password.startsWith('$2a$')) {
        console.log(`Skipping already hashed user: ${user.name}`);
        continue;
      }
      console.log(`Updating password for user: ${user.name}`);
      user.password = await bcrypt.hash(user.password, 10);
      await user.save();
    }
    console.log('Password migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

updateExistingPasswords();  