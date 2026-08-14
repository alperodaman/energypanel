import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/db.js';

const createdUserIds = [];
let ipCounter = 0;

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
}

// Each test gets its own fake client IP so the /auth/login rate limiter
// (keyed by IP) doesn't accumulate hits across unrelated tests in this file.
function nextTestIp() {
  ipCounter += 1;
  return `10.0.${Math.floor(ipCounter / 255)}.${ipCounter % 255}`;
}

function loginRequest(body, ip) {
  return request(app).post('/auth/login').set('X-Forwarded-For', ip).send(body);
}

afterEach(async () => {
  if (createdUserIds.length === 0) return;
  await prisma.refreshToken.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  createdUserIds.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /auth/register', () => {
  it('registers a new user (201)', async () => {
    const email = uniqueEmail('register');
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email, name: 'Test User' });
    expect(res.body.passwordHash).toBeUndefined();
    createdUserIds.push(res.body.id);
  });

  it('rejects a duplicate email (409)', async () => {
    const email = uniqueEmail('dup');
    const first = await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'A' });
    createdUserIds.push(first.body.id);

    const res = await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'B' });

    expect(res.status).toBe(409);
  });

  it('rejects an invalid email format (400)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'A' });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  it('logs in with correct credentials (200)', async () => {
    const email = uniqueEmail('login');
    const password = 'password123';
    const reg = await request(app)
      .post('/auth/register')
      .send({ email, password, name: 'Login User' });
    createdUserIds.push(reg.body.id);

    const res = await loginRequest({ email, password }, nextTestIp());

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it('rejects a wrong password (401)', async () => {
    const email = uniqueEmail('wrongpass');
    const reg = await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'X' });
    createdUserIds.push(reg.body.id);

    const res = await loginRequest({ email, password: 'wrongpassword' }, nextTestIp());

    expect(res.status).toBe(401);
  });

  it('rejects a nonexistent user (401)', async () => {
    const res = await loginRequest({ email: uniqueEmail('nouser'), password: 'password123' }, nextTestIp());

    expect(res.status).toBe(401);
  });
});

describe('POST /auth/refresh', () => {
  it('returns a rotated token pair for a valid refresh token', async () => {
    const email = uniqueEmail('refresh');
    const password = 'password123';
    const reg = await request(app)
      .post('/auth/register')
      .send({ email, password, name: 'Refresh User' });
    createdUserIds.push(reg.body.id);
    const login = await loginRequest({ email, password }, nextTestIp());

    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).not.toBe(login.body.refreshToken);
  });

  it('rejects reuse of an already-rotated refresh token (401)', async () => {
    const email = uniqueEmail('rotate');
    const password = 'password123';
    const reg = await request(app)
      .post('/auth/register')
      .send({ email, password, name: 'Rotate User' });
    createdUserIds.push(reg.body.id);
    const login = await loginRequest({ email, password }, nextTestIp());

    await request(app).post('/auth/refresh').send({ refreshToken: login.body.refreshToken });
    const reuse = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });

    expect(reuse.status).toBe(401);
  });

  it('rejects an unknown refresh token (401)', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'not-a-real-token' });

    expect(res.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  it('returns the current user with a valid token (200)', async () => {
    const email = uniqueEmail('me');
    const password = 'password123';
    const reg = await request(app)
      .post('/auth/register')
      .send({ email, password, name: 'Me User' });
    createdUserIds.push(reg.body.id);
    const login = await loginRequest({ email, password }, nextTestIp());

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: reg.body.id, email, name: 'Me User' });
  });

  it('rejects requests without a token (401)', async () => {
    const res = await request(app).get('/auth/me');

    expect(res.status).toBe(401);
  });

  it('rejects requests with an invalid token (401)', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
  });
});
