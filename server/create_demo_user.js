const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createDemoUser = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://raiyaniyug5457_db_user:<db_password>@cluster0.53gdfyi.mongodb.net/';
    
    // Check if mongoURI has <db_password> and replace it with the actual password if we have it in .env
    await mongoose.connect(mongoURI);

    const email = 'demo@example.com';
    const password = 'password123';
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Demo user already exists: demo@example.com / password123');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name: 'Demo User' });
    await user.save();
    
    console.log('Demo user created successfully!');
    console.log('Email: demo@example.com');
    console.log('Password: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating demo user:', error);
    process.exit(1);
  }
};

createDemoUser();
