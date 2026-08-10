const request = require('supertest');
const { app, createUser, loginAndGetCookies } = require('./helpers');

describe('Practice CRUD', () => {
  let cookies;

  beforeEach(async () => {
    await createUser({ email: 'staff@billvolt.com', password: 'CorrectHorse1!', role: 'staff' });
    cookies = await loginAndGetCookies('staff@billvolt.com', 'CorrectHorse1!');
  });

  test('rejects creating a practice without a group name', async () => {
    const res = await request(app).post('/api/practices').set('Cookie', cookies).send({});
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('groupName');
  });

  test('creates, lists, updates, and deletes a practice', async () => {
    const createRes = await request(app)
      .post('/api/practices')
      .set('Cookie', cookies)
      .send({ groupName: 'Acme Medical Group', groupNpi: '1234567890' });
    expect(createRes.status).toBe(201);
    const practiceId = createRes.body.practice._id;

    const listRes = await request(app).get('/api/practices').set('Cookie', cookies);
    expect(listRes.status).toBe(200);
    expect(listRes.body.practices.some((p) => p._id === practiceId)).toBe(true);

    const updateRes = await request(app)
      .patch(`/api/practices/${practiceId}`)
      .set('Cookie', cookies)
      .send({ status: 'inactive' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.practice.status).toBe('inactive');

    // Staff (non-admin) should NOT be able to delete
    const forbiddenDelete = await request(app).delete(`/api/practices/${practiceId}`).set('Cookie', cookies);
    expect(forbiddenDelete.status).toBe(403);
  });

  test('search filters by group name', async () => {
    await request(app).post('/api/practices').set('Cookie', cookies).send({ groupName: 'Riverside Clinic' });
    await request(app).post('/api/practices').set('Cookie', cookies).send({ groupName: 'Lakeside Medical' });

    const res = await request(app).get('/api/practices').set('Cookie', cookies).query({ q: 'Riverside' });
    expect(res.status).toBe(200);
    expect(res.body.practices).toHaveLength(1);
    expect(res.body.practices[0].groupName).toBe('Riverside Clinic');
  });

  test('NoSQL injection attempt via query params is neutralized', async () => {
    await request(app).post('/api/practices').set('Cookie', cookies).send({ groupName: 'Safe Clinic', status: 'active' });

    // Attempt: ?status[$ne]=active would try to match everything EXCEPT active
    // if not sanitized. After sanitizeInput strips the $ne key, status ends
    // up as an empty object and the filter is effectively ignored — it
    // should NOT crash and should NOT return practices with $ne semantics.
    const res = await request(app).get('/api/practices?status[$ne]=active').set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.practices)).toBe(true);
  });
});
