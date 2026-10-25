import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../prisma';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../auth';

describe('NEBULA 2046 // Authentication & Security Engine', () => {
  beforeAll(async () => {
    // Ensure test user is cleaned up if exists
    await prisma.user.deleteMany({
      where: { email: 'test_pilot_2046@nebula.io' },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'test_pilot_2046@nebula.io' },
    });
    await prisma.$disconnect();
  });

  it('correctly hashes passwords and verifies with salt', async () => {
    const rawPassword = 'QuantumOrbitSecret2046!';
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);

    const match = await comparePassword(rawPassword, hash);
    expect(match).toBe(true);

    const mismatch = await comparePassword('WrongPassword', hash);
    expect(mismatch).toBe(false);
  });

  it('generates valid cryptographic JWTs and verifies payloads', () => {
    const userId = 'usr_quantum_orbit_77';
    const token = generateToken(userId);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(userId);

    const invalid = verifyToken('corrupted.token.payload');
    expect(invalid).toBeNull();
  });

  it('registers a new user and creates default preferences', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test_pilot_2046@nebula.io',
        username: 'test_pilot_2046',
        displayName: 'Test Pilot Alpha',
        password: 'Password2046!',
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('test_pilot_2046@nebula.io');
    expect(res.body.preferences).toBeDefined();
    expect(res.body.preferences.theme).toBe('dark');
  });

  it('rejects duplicate email registration with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test_pilot_2046@nebula.io',
        username: 'different_user_name',
        displayName: 'Duplicate Pilot',
        password: 'Password2046!',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('authenticates valid credentials on /api/auth/login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        login: 'test_pilot_2046',
        password: 'Password2046!',
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('test_pilot_2046');
  });

  it('rejects incorrect password on login with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        login: 'test_pilot_2046',
        password: 'IncorrectPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid');
  });

  it('protects private /api/auth/me endpoint without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
