import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const dbFile = path.join(os.tmpdir(), `ecard-test-${process.pid}-${Date.now()}.sqlite`);
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.DB_FILE = dbFile;
process.env.NODE_ENV = 'test';

let app;
let db;
let adminCookie;

before(async () => {
  ({ app, db } = await import('../server/app.js'));
  const hash = bcrypt.hashSync('AdminPassword123!', 10);
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Test Admin', 'admin@test.local', hash, 'admin');
  const login = await request(app).post('/api/auth/login').send({ email: 'admin@test.local', password: 'AdminPassword123!' });
  assert.equal(login.status, 200);
  adminCookie = login.headers['set-cookie'];
});

after(() => {
  db.close();
  try { fs.unlinkSync(dbFile); } catch { /* temp database may already be removed */ }
});

test('health endpoint reports database health', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok', database: 'ok' });
});

test('login rejects invalid credentials', async () => {
  const response = await request(app).post('/api/auth/login').send({ email: 'admin@test.local', password: 'wrong-password' });
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'LOGIN_FAILED');
});

test('students endpoint requires authentication', async () => {
  const response = await request(app).get('/api/students');
  assert.equal(response.status, 401);
});

test('admin can list students', async () => {
  const response = await request(app).get('/api/students').set('Cookie', adminCookie);
  assert.equal(response.status, 200);
  assert.equal(response.body.length, 4);
});

test('appreciation increases marks and creates history', async () => {
  const response = await request(app).post('/api/events').set('Cookie', adminCookie).send({ studentId: 'ST-1024', type: 'Appreciation', amount: 3, reason: 'Excellent teamwork', notifyParent: false });
  assert.equal(response.status, 200);
  assert.equal(response.body.marks, 11);
  assert.equal(response.body.status, 'Good');
  const history = await request(app).get('/api/students/ST-1024/history').set('Cookie', adminCookie);
  assert.equal(history.body[0].type, 'Appreciation');
});

test('sanction never pushes marks below zero', async () => {
  const response = await request(app).post('/api/events').set('Cookie', adminCookie).send({ studentId: 'ST-1068', type: 'Sanction', amount: 20, reason: 'Policy violation', notifyParent: true });
  assert.equal(response.status, 200);
  assert.equal(response.body.marks, 0);
});

test('conduct status thresholds are enforced', async () => {
  const { calculateConductStatus } = await import('../server/routes/events.js');
  assert.equal(calculateConductStatus(0), 'Good');
  assert.equal(calculateConductStatus(11), 'Good');
  assert.equal(calculateConductStatus(12), 'Watch');
  assert.equal(calculateConductStatus(17), 'Watch');
  assert.equal(calculateConductStatus(18), 'Review');
});

test('permission card can be created and approved', async () => {
  const created = await request(app).post('/api/permissions').set('Cookie', adminCookie).send({ studentId: 'ST-1024', reason: 'Medical appointment', outTime: '2026-09-02T14:00:00.000Z', backTime: '2026-09-02T16:00:00.000Z' });
  assert.equal(created.status, 201);
  const approved = await request(app).patch(`/api/permissions/${created.body.code}`).set('Cookie', adminCookie).send({ status: 'Approved' });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.status, 'Approved');
});

test('monthly report returns a PDF', async () => {
  const response = await request(app).get('/api/reports/monthly.pdf').set('Cookie', adminCookie);
  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /application\/pdf/);
});
