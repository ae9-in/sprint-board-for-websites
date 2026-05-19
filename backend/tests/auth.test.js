import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Organization, User, InviteToken } from '../src/models/index.js';
import { generateAccessToken } from '../src/utils/jwt.js';

describe('Auth Endpoints (Disabled Signup & Direct Add & Isolation)', () => {
  let orgA, orgB, userA, userB, tokenA, tokenB;

  beforeEach(async () => {
    // Create Org A
    orgA = await Organization.create({ 
      name: 'Org A', 
      slug: 'org-a',
      ownerEmail: 'owner-a@test.com',
      ownerId: new mongoose.Types.ObjectId().toString()
    });

    userA = await User.create({
      fullName: 'User A',
      email: 'a@test.com',
      passwordHash: 'hash',
      organizationId: orgA._id,
      role: 'ADMIN',
      userType: 'DEVELOPER'
    });
    
    tokenA = generateAccessToken(userA);

    // Create Org B
    orgB = await Organization.create({ 
      name: 'Org B', 
      slug: 'org-b',
      ownerEmail: 'owner-b@test.com',
      ownerId: new mongoose.Types.ObjectId().toString()
    });

    userB = await User.create({
      fullName: 'User B',
      email: 'b@test.com',
      passwordHash: 'hash',
      organizationId: orgB._id,
      role: 'ADMIN',
      userType: 'DEVELOPER'
    });

    tokenB = generateAccessToken(userB);
  });

  test('POST /api/auth/signup should return 403 Forbidden since public signup is disabled', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'new@test.com',
        password: 'password123',
        fullName: 'New User',
        organizationName: 'New Org'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SIGNUP_DISABLED');
  });

  test('POST /api/auth/invite/send with fullName and password should directly create a team member', async () => {
    const res = await request(app)
      .post('/api/auth/invite/send')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        email: 'direct-member@test.com',
        role: 'USER',
        userType: 'TESTER',
        fullName: 'Direct Member',
        password: 'password123'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('direct-member@test.com');
    expect(res.body.data.user.role).toBe('USER');
    expect(res.body.data.user.userType).toBe('TESTER');

    // Verify it exists in DB with Org A organization ID
    const dbUser = await User.findOne({ email: 'direct-member@test.com' });
    expect(dbUser).toBeDefined();
    expect(dbUser.organizationId.toString()).toBe(orgA._id.toString());
  });

  test('GET /api/auth/members should return organization members only (Tenant Isolation)', async () => {
    // Add a member in Org A
    await User.create({
      fullName: 'Member A',
      email: 'member-a@test.com',
      passwordHash: 'hash',
      organizationId: orgA._id,
      role: 'USER',
      userType: 'DEVELOPER'
    });

    // Add a member in Org B
    await User.create({
      fullName: 'Member B',
      email: 'member-b@test.com',
      passwordHash: 'hash',
      organizationId: orgB._id,
      role: 'USER',
      userType: 'TESTER'
    });

    // Fetch members using token A
    const resA = await request(app)
      .get('/api/auth/members')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    expect(resA.body.success).toBe(true);
    // Should have userA and Member A (2 members)
    expect(resA.body.data.length).toBe(2);
    expect(resA.body.data.some(u => u.email === 'member-a@test.com')).toBe(true);
    expect(resA.body.data.some(u => u.email === 'member-b@test.com')).toBe(false);

    // Fetch members using token B
    const resB = await request(app)
      .get('/api/auth/members')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    expect(resB.body.success).toBe(true);
    // Should have userB and Member B (2 members)
    expect(resB.body.data.length).toBe(2);
    expect(resB.body.data.some(u => u.email === 'member-b@test.com')).toBe(true);
    expect(resB.body.data.some(u => u.email === 'member-a@test.com')).toBe(false);
  });
});
