import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Organization, User, Project } from '../src/models/index.js';
import { generateAccessToken } from '../src/utils/jwt.js';

describe('Multi-Tenant Isolation Integration Tests', () => {
  let orgA, orgB, userA, userB, projectA, tokenA;

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

    projectA = await Project.create({
      name: 'Project A',
      organizationId: orgA._id,
      clientName: 'Client A',
      description: 'Test Project A',
      startDate: new Date(),
      deadline: new Date(Date.now() + 86400000),
      createdBy: userA._id
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
  });

  test('User A should be able to access Project A', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectA._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Project A');
  });

  test('User A should NOT be able to access Project B (Cross-tenant leak prevention)', async () => {
    const projectB = await Project.create({
      name: 'Project B',
      organizationId: orgB._id,
      clientName: 'Client B',
      description: 'Test Project B',
      startDate: new Date(),
      deadline: new Date(Date.now() + 86400000),
      createdBy: userB._id
    });

    const res = await request(app)
      .get(`/api/projects/${projectB._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('User A should only see their own organization projects in listing', async () => {
    await Project.create({
      name: 'Project B',
      organizationId: orgB._id,
      clientName: 'Client B',
      description: 'Test Project B',
      startDate: new Date(),
      deadline: new Date(Date.now() + 86400000),
      createdBy: userB._id
    });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Project A');
  });
});
