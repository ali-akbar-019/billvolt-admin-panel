const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User.model');

// Creates a user directly (bypassing the admin-only /register endpoint,
// which needs an existing admin to call it — chicken-and-egg for tests).
const createUser = async ({ name = 'Test User', email, password = 'Password123!', role = 'staff', assignedPracticeIds = [] }) => {
  const passwordHash = await User.hashPassword(password);
  return User.create({ name, email, passwordHash, role, status: 'active', assignedPracticeIds });
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

// Mints an access-token cookie directly for a user (bypasses the login rate
// limiter — used by suites that need many authenticated requests and don't
// care about testing the login flow itself). The token is signed with the
// test JWT secret from tests/env.setup.js.
const cookiesForUser = (user) => {
  const accessToken = jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  return [`accessToken=${accessToken}; Path=/; HttpOnly; SameSite=Strict`];
};

// Convenience: create a user + return a cookie header in one call.
const createUserAndGetCookies = async (opts) => {
  const user = await createUser(opts);
  return cookiesForUser(user);
};

module.exports = { app, createUser, loginAndGetCookies, cookiesForUser, createUserAndGetCookies };
