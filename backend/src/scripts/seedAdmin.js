// Creates (or resets) the first admin account — no prompts, just run it.
//   npm run seed:admin
//
// Uses these from .env if present, otherwise falls back to defaults below:
//   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
//
// Safe to re-run: if the account already exists, it resets the password
// and makes sure the role is 'admin' instead of failing.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User.model');

const NAME = process.env.ADMIN_NAME || 'Admin';
const EMAIL = (process.env.ADMIN_EMAIL || 'admin@billvolt.com').trim().toLowerCase();
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

const run = async () => {
  await connectDB();

  const passwordHash = await User.hashPassword(PASSWORD);
  const existing = await User.findOne({ email: EMAIL });

  if (existing) {
    existing.name = NAME;
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    existing.status = 'active';
    await existing.save();
    console.log(`Existing account updated and reset to admin: ${EMAIL}`);
  } else {
    await User.create({ name: NAME, email: EMAIL, passwordHash, role: 'admin', status: 'active' });
    console.log(`Admin account created: ${EMAIL}`);
  }

  console.log('---');
  console.log(`Email:    ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
  console.log('---');
  console.log('Log in with these, then change the password from the app once auth for that ships.');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
