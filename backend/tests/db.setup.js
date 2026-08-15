const fs = require('fs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Use a locally-installed mongod when one exists instead of downloading a
// ~500MB binary on first run. Add more paths here if yours lives elsewhere.
const SYSTEM_BINARY_CANDIDATES = [
  'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
  'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
  'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
  '/usr/bin/mongod',
  '/usr/local/bin/mongod',
].filter((p) => fs.existsSync(p));

if (!process.env.MONGOMS_SYSTEM_BINARY && SYSTEM_BINARY_CANDIDATES.length) {
  process.env.MONGOMS_SYSTEM_BINARY = SYSTEM_BINARY_CANDIDATES[0];
}

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      // Explicit storage engine (vs. the ephemeralForTest default) so the
      // in-memory server starts on MongoDB 7+ binaries, where that engine no
      // longer exists, and on older 6.x binaries alike.
      storageEngine: 'wiredTiger',
      // wiredTiger snapshots + slower disks can take a while on first start.
      launchTimeout: 120000,
    },
  });
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
