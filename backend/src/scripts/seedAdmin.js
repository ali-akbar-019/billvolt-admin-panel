// Bootstraps the very first admin account.
// Run once after setting up MongoDB: node src/scripts/seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const connectDB = require('../config/db');
const User = require('../models/User.model');

const ask = (question) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer);
  }));
};

const run = async () => {
  await connectDB();

  const name = await ask('Admin name: ');
  const email = (await ask('Admin email: ')).trim().toLowerCase();
  const password = await ask('Admin password (min 8 chars): ');

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`A user with email ${email} already exists. Aborting.`);
    process.exit(1);
  }

  const passwordHash = await User.hashPassword(password);
  await User.create({ name, email, passwordHash, role: 'admin' });

  console.log(`Admin account created for ${email}.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
