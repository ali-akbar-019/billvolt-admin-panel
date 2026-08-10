const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User.model');

// Creates a user directly (bypassing the admin-only /register endpoint,
// which needs an existing admin to call it — chicken-and-egg for tests).
const createUser = async ({ name = 'Test User', email, password = 'Password123!', role = 'staff' }) => {
  const passwordHash = await User.hashPassword(password);
  return User.create({ name, email, passwordHash, role, status: 'active' });
};

// Logs in and returns the Set-Cookie header array, ready to pass to
// .set('Cookie', cookies) on later requests.
const loginAndGetCookies = async (email, password = 'Password123!') => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed in test helper: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.headers['set-cookie'];
};

module.exports = { app, createUser, loginAndGetCookies };
