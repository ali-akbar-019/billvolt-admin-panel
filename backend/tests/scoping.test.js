const request = require('supertest');
const { app, createUserAndGetCookies } = require('./helpers');
const Practice = require('../src/models/Practice.model');
const Provider = require('../src/models/Provider.model');
const CredentialingRecord = require('../src/models/CredentialingRecord.model');
const FollowUp = require('../src/models/FollowUp.model');

const createScopedData = async (practiceIds) => {
  const [visible, other] = practiceIds;
  const provider = await Provider.create({ name: 'Dr. Visible', practiceId: visible, status: 'active' });
  const otherProvider = await Provider.create({ name: 'Dr. Hidden', practiceId: other, status: 'active' });
  await CredentialingRecord.create([
    { providerId: provider._id, payerName: 'Aetna', status: 'in_progress' },
    { providerId: otherProvider._id, payerName: 'Cigna', status: 'in_progress' },
  ]);
  return { provider, otherProvider };
};

describe('FR-001 — per-practice scoping', () => {
  let practices;
  let adminCookies;
  let staffCookies;

  // db.setup.js wipes all collections after EVERY test, so each test starts
  // from a clean DB. beforeEach re-creates the scoped data and both logins.
  beforeEach(async () => {
    practices = await Practice.create([
      { groupName: 'Visible Practice', status: 'active' },
      { groupName: 'Hidden Practice', status: 'active' },
    ]);
    await createScopedData(practices.map((p) => p._id));

    await createUserAndGetCookies({ email: 'scope-admin@billvolt.com', password: 'CorrectHorse1!', role: 'admin' })
      .then((c) => (adminCookies = c));

    await createUserAndGetCookies({
      email: 'scope-staff@billvolt.com',
      password: 'CorrectHorse1!',
      role: 'staff',
      assignedPracticeIds: [practices[0]._id],
    }).then((c) => (staffCookies = c));
  });

  test('staff sees only assigned practices', async () => {
    const res = await request(app).get('/api/practices').set('Cookie', staffCookies);
    const ids = res.body.practices.map((p) => p._id);
    expect(res.status).toBe(200);
    expect(ids).toEqual([practices[0]._id.toString()]);
  });

  test('admin sees all practices', async () => {
    const res = await request(app).get('/api/practices').set('Cookie', adminCookies);
    expect(res.body.practices.length).toBe(2);
  });

  test('staff sees only providers from assigned practices', async () => {
    const res = await request(app).get('/api/providers').set('Cookie', staffCookies);
    const ids = res.body.providers.map((p) => p._id);
    expect(res.status).toBe(200);
    expect(ids).toHaveLength(1);
    expect(res.body.providers[0].name).toBe('Dr. Visible');
  });

  test('staff cannot fetch a provider from an unassigned practice', async () => {
    const hidden = await Provider.findOne({ name: 'Dr. Hidden' });
    const res = await request(app).get(`/api/providers/${hidden._id}`).set('Cookie', staffCookies);
    expect(res.status).toBe(403);
  });

  test('staff cannot create a provider in an unassigned practice', async () => {
    const res = await request(app)
      .post('/api/providers')
      .set('Cookie', staffCookies)
      .send({ name: 'Dr. Trespass', practiceId: practices[1]._id });
    expect(res.status).toBe(403);
  });

  test('staff credentialing list is scoped to assigned practices', async () => {
    const res = await request(app).get('/api/credentialing').set('Cookie', staffCookies);
    expect(res.status).toBe(200);
    const payers = res.body.records.map((r) => r.payerName);
    expect(payers).toEqual(['Aetna']);
  });

  test('staff reports summary is scoped', async () => {
    const res = await request(app).get('/api/reports/summary').set('Cookie', staffCookies);
    expect(res.status).toBe(200);
    expect(res.body.practices.total).toBe(1);
    expect(res.body.providers.total).toBe(1);
  });

  test('staff dashboard summary is scoped', async () => {
    const res = await request(app).get('/api/dashboard/summary').set('Cookie', staffCookies);
    expect(res.status).toBe(200);
    expect(res.body.activePractices).toBe(1);
    expect(res.body.providers.total).toBe(1);
  });

  test('staff audit log access stays blocked (admin-only)', async () => {
    const res = await request(app).get('/api/audit-logs').set('Cookie', staffCookies);
    expect(res.status).toBe(403);
  });
});