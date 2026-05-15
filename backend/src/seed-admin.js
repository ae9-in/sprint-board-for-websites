import 'dotenv/config';
import mongoose from 'mongoose';
import { Organization, User } from './models/index.js';
import { hashPassword } from './utils/bcrypt.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jishnu:jishnu123@cluster0.mt6agn4.mongodb.net/sprintboard?appName=Cluster0';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if admin organization exists
    let org = await Organization.findOne({ slug: 'sprintboard' });

    if (!org) {
      org = await Organization.create({
        name: 'SprintBoard',
        slug: 'sprintboard',
        ownerEmail: 'admin@sprintboard.com',
        plan: 'PRO',
        isActive: true
      });
      console.log('✓ Created organization: SprintBoard');
    }

    // Check if admin user exists
    let admin = await User.findOne({ email: 'admin@sprintboard.com' });

    if (!admin) {
      admin = await User.create({
        organizationId: org._id,
        fullName: 'Admin User',
        email: 'admin@sprintboard.com',
        passwordHash: await hashPassword('admin@123'),
        role: 'SUPER_ADMIN',
        userType: 'DEVELOPER',
        isActive: true,
        inviteAccepted: true,
        createdBy: null
      });
      console.log('✓ Created admin user: admin@sprintboard.com');

      // Update organization owner
      org.ownerId = admin._id;
      await org.save();
    } else {
      // Update password if user exists
      admin.passwordHash = await hashPassword('admin@123');
      admin.isActive = true;
      admin.inviteAccepted = true;
      admin.role = 'SUPER_ADMIN';
      await admin.save();
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