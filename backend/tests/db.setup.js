const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      // Explicit storage engine (vs. the ephemeralForTest default) so the
      // in-memory server starts on MongoDB 7+ binaries, where that engine no
      // longer exists, and on older 6.x binaries alike.
      storageEngine: 'wiredTiger',
      // wiredTiger snapshots + slower disks can take a while on first start.
      launchTimeout: 60000,
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
