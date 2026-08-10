// Runs before Jest's test framework is even loaded — plain env setup,
// no jest globals available here yet.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.FIELD_ENCRYPTION_KEY = 'test-field-encryption-key-32bytes';
process.env.CLIENT_URL = 'http://localhost:5173';
// Deliberately no REDIS_URL / MONGODB_URI — the app degrades gracefully
// without Redis (see session.service.js), and db.setup.js below points
// mongoose at an in-memory MongoDB instead of MONGODB_URI.
