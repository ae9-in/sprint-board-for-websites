import 'dotenv/config';
import mongoose from 'mongoose';
import { Organization } from './models/Organization.js';
import { hashPassword } from './utils/bcrypt.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jishnu:jishnu123@cluster0.mt6agn4.mongodb.net/sprintboard?appName=Cluster0';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    console.log('✓ Connected to MongoDB');

    // Check if admin organization exists
    let org = await db.collection('organizations').findOne({ slug: 'sprintboard' });

    if (!org) {
      const result = await db.collection('organizations').insertOne({
        name: 'SprintBoard',
        slug: 'sprintboard',
        ownerEmail: 'admin@sprintboard.com',
        plan: 'PRO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      org = await db.collection('organizations').findOne({ _id: result.insertedId });
      console.log('✓ Created organization: SprintBoard');
    }

    // Check if admin user exists
    let admin = await db.collection('users').findOne({ email: 'admin@sprintboard.com' });

    console.log('Organization ID:', org._id);

    if (!admin) {
      const passwordHash = await hashPassword('admin@123');
      const result = await db.collection('users').insertOne({
        organizationId: org._id,
        fullName: 'Admin User',
        email: 'admin@sprintboard.com',
        passwordHash: passwordHash,
        role: 'SUPER_ADMIN',
        userType: 'DEVELOPER',
        isActive: true,
        inviteAccepted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      });
      admin = await db.collection('users').findOne({ _id: result.insertedId });
      console.log('✓ Created admin user: admin@sprintboard.com');

      // Update organization owner
      await db.collection('organizations').updateOne(
        { _id: org._id },
        { $set: { ownerId: admin._id, updatedAt: new Date() } }
      );
    } else {
      // Update password if user exists
      const passwordHash = await hashPassword('admin@123');
      await db.collection('users').updateOne(
        { _id: admin._id },
        { $set: { passwordHash, isActive: true, inviteAccepted: true, role: 'SUPER_ADMIN', updatedAt: new Date() } }
      );
      console.log('✓ Updated admin user password');
    }

    console.log('\n✅ Admin user ready!');
    console.log('   Email: admin@sprintboard.com');
    console.log('   Password: admin@123');
    console.log('   Role: SUPER_ADMIN\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedAdmin();