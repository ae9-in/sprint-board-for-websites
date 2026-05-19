import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Organization, User, Project, ProjectFile, TestingReport, MaintenanceLog, FeatureRequest } from '../src/models/index.js';
import { generateAccessToken } from '../src/utils/jwt.js';

describe('Project Features Integration Tests (Files, Testing, Maintenance, Features)', () => {
  let orgA, orgB, userA, userB, projectA, projectB, tokenA, tokenB;

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
      createdBy: userA._id,
      assignedUserIds: [userA._id]
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

    projectB = await Project.create({
      name: 'Project B',
      organizationId: orgB._id,
      clientName: 'Client B',
      description: 'Test Project B',
      startDate: new Date(),
      deadline: new Date(Date.now() + 86400000),
      createdBy: userB._id,
      assignedUserIds: [userB._id]
    });

    tokenB = generateAccessToken(userB);
  });

  describe('Files Endpoints', () => {
    test('User A should be able to upload a Google Drive link for Project A', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectA._id}/files`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fileName: 'Design Spec Doc',
          googleDriveLink: 'https://drive.google.com/file/d/123/view',
          linkedEntityType: 'REQUIREMENT'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileName).toBe('Design Spec Doc');
      expect(res.body.data.storageKey).toBe('https://drive.google.com/file/d/123/view');
    });

    test('User A should be able to fetch files for Project A', async () => {
      await ProjectFile.create({
        projectId: projectA._id,
        organizationId: orgA._id,
        fileName: 'Existing Doc',
        fileType: 'link',
        fileSize: 0,
        storageKey: 'https://drive.google.com/file/d/456/view',
        linkedEntityType: 'REQUIREMENT',
        linkedEntityId: projectA._id,
        uploadedBy: userA._id,
        createdBy: userA._id
      });

      const res = await request(app)
        .get(`/api/projects/${projectA._id}/files`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].fileName).toBe('Existing Doc');
    });

    test('User A should NOT be able to upload/fetch files for Project B (Cross-tenant leak prevention)', async () => {
      const resUpload = await request(app)
        .post(`/api/projects/${projectB._id}/files`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fileName: 'Hacker Spec Doc',
          googleDriveLink: 'https://drive.google.com/file/d/666/view'
        });

      expect(resUpload.status).toBe(403);

      const resFetch = await request(app)
        .get(`/api/projects/${projectB._id}/files`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resFetch.status).toBe(403);
    });
  });

  describe('Testing Reports Endpoints', () => {
    test('User A should be able to upload a testing report for Project A', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectA._id}/testing-reports`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          testCaseId: 'TC-01',
          moduleTested: 'Auth Module',
          bugDescription: 'Login fails with long email addresses',
          reproductionSteps: '1. Go to login page\n2. Enter 100 character email\n3. Click Submit',
          severity: 'HIGH',
          googleDriveLink: 'https://drive.google.com/file/d/tc123/view'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.testCaseId).toBe('TC-01');
      expect(res.body.data.moduleTested).toBe('Auth Module');
      expect(res.body.data.fileIds.length).toBe(1);
    });

    test('User A should be able to fetch testing reports for Project A', async () => {
      await TestingReport.create({
        projectId: projectA._id,
        organizationId: orgA._id,
        testCaseId: 'TC-02',
        moduleTested: 'Signup Module',
        bugDescription: 'Validation fails silently',
        reproductionSteps: 'reproduce steps',
        severity: 'MEDIUM',
        status: 'OPEN',
        browserDevice: 'Chrome/Desktop',
        createdBy: userA._id
      });

      const res = await request(app)
        .get(`/api/projects/${projectA._id}/testing-reports`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].testCaseId).toBe('TC-02');
    });

    test('User A should NOT be able to access testing reports for Project B', async () => {
      const resUpload = await request(app)
        .post(`/api/projects/${projectB._id}/testing-reports`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          testCaseId: 'TC-03',
          moduleTested: 'Hacker Module',
          bugDescription: 'Exploit works',
          reproductionSteps: 'reproduce',
          severity: 'CRITICAL'
        });

      expect(resUpload.status).toBe(403);

      const resFetch = await request(app)
        .get(`/api/projects/${projectB._id}/testing-reports`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resFetch.status).toBe(403);
    });
  });

  describe('Maintenance Logs Endpoints', () => {
    test('User A should be able to manage maintenance logs for Project A', async () => {
      // Create log
      const resCreate = await request(app)
        .post(`/api/projects/${projectA._id}/maintenance-logs`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          issueTitle: 'Server crash under heavy load',
          description: 'Memory leak causes crash every 4 hours',
          severity: 'CRITICAL',
          googleDriveLink: 'https://drive.google.com/file/d/maint123/view'
        });

      expect(resCreate.status).toBe(201);
      expect(resCreate.body.success).toBe(true);
      expect(resCreate.body.data.issueTitle).toBe('Server crash under heavy load');
      
      const logId = resCreate.body.data._id;

      // Fetch logs
      const resFetch = await request(app)
        .get(`/api/projects/${projectA._id}/maintenance-logs`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resFetch.status).toBe(200);
      expect(resFetch.body.data.length).toBe(1);

      // Update log (PATCH)
      const resUpdate = await request(app)
        .patch(`/api/projects/${projectA._id}/maintenance-logs/${logId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          status: 'RESOLVED',
          resolutionNotes: 'Patched process memory limits in server environment'
        });

      expect(resUpdate.status).toBe(200);
      expect(resUpdate.body.data.status).toBe('RESOLVED');
      expect(resUpdate.body.data.resolutionNotes).toBe('Patched process memory limits in server environment');
    });

    test('User A should NOT be able to manage maintenance logs for Project B', async () => {
      const resCreate = await request(app)
        .post(`/api/projects/${projectB._id}/maintenance-logs`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          issueTitle: 'Unauthorized issue',
          description: 'Hacked',
          severity: 'HIGH'
        });

      expect(resCreate.status).toBe(403);
    });
  });

  describe('Feature Requests Endpoints', () => {
    test('User A should be able to manage feature requests for Project A', async () => {
      // Create feature request
      const resCreate = await request(app)
        .post(`/api/projects/${projectA._id}/feature-requests`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Implement Dark Mode',
          description: 'User preference based visual style with glassmorphism',
          googleDriveLink: 'https://drive.google.com/file/d/dark123/view'
        });

      expect(resCreate.status).toBe(201);
      expect(resCreate.body.success).toBe(true);
      expect(resCreate.body.data.title).toBe('Implement Dark Mode');

      // Fetch feature requests
      const resFetch = await request(app)
        .get(`/api/projects/${projectA._id}/feature-requests`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resFetch.status).toBe(200);
      expect(resFetch.body.data.length).toBe(1);
      expect(resFetch.body.data[0].title).toBe('Implement Dark Mode');
    });

    test('User A should NOT be able to manage feature requests for Project B', async () => {
      const resCreate = await request(app)
        .post(`/api/projects/${projectB._id}/feature-requests`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Unauthorized feature',
          description: 'steal data'
        });

      expect(resCreate.status).toBe(403);
    });
  });
});
