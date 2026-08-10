const request = require('supertest');
const { app, createUser, loginAndGetCookies } = require('./helpers');

describe('RBAC — admin-only endpoints', () => {
  test('staff cannot list or manage users', async () => {
    await createUser({ email: 'staff2@billvolt.com', password: 'CorrectHorse1!', role: 'staff' });
    const staffCookies = await loginAndGetCookies('staff2@billvolt.com', 'CorrectHorse1!');

    const listRes = await request(app).get('/api/users').set('Cookie', staffCookies);
    expect(listRes.status).toBe(403);
  });

  test('admin can list users', async () => {
    await createUser({ email: 'admin1@billvolt.com', password: 'CorrectHorse1!', role: 'admin' });
    const adminCookies = await loginAndGetCookies('admin1@billvolt.com', 'CorrectHorse1!');

    const res = await request(app).get('/api/users').set('Cookie', adminCookies);
    expect(res.status).toBe(200);
  });

  test('staff cannot reveal a provider\'s sensitive fields', async () => {
    await createUser({ email: 'staff3@billvolt.com', password: 'CorrectHorse1!', role: 'staff' });
    const staffCookies = await loginAndGetCookies('staff3@billvolt.com', 'CorrectHorse1!');

    const practiceRes = await request(app)
      .post('/api/practices')
      .set('Cookie', staffCookies)
      .send({ groupName: 'Test Practice' });
    const practiceId = practiceRes.body.practice._id;

    const providerRes = await request(app)
      .post('/api/providers')
      .set('Cookie', staffCookies)
      .send({ name: 'Dr. Test', practiceId });
    const providerId = providerRes.body.provider._id;

    const sensitiveRes = await request(app).get(`/api/providers/${providerId}/sensitive`).set('Cookie', staffCookies);
    expect(sensitiveRes.status).toBe(403);
  });

  test('unauthenticated requests are rejected across protected routes', async () => {
    const endpoints = ['/api/practices', '/api/providers', '/api/credentialing', '/api/followups', '/api/settings'];
    for (const endpoint of endpoints) {
      const res = await request(app).get(endpoint);
      expect(res.status).toBe(401);
    }
  });
});
