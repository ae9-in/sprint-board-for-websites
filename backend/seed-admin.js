import 'dotenv/config';
import mongoose from 'mongoose';
import { hashPassword } from './src/utils/bcrypt.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://jishnu:jishnu123@cluster0.mt6agn4.mongodb.net/?appName=Cluster0';

const adminData = {
  email: 'admin@sprintboard.com',
  password: 'admin123',
  fullName: 'Admin User',
  organizationName: 'Sprint Board'
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  const { Organization, User } = await import('./src/models/index.js');

  // Check if admin exists
  const existingUser = await User.findOne({ email: adminData.email.toLowerCase() });
  if (existingUser) {
    console.log('Admin user already exists');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    await mongoose.disconnect();
    return;
  }

  // Create organization
  const slug = adminData.organizationName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  const organization = await Organization.create({
    name: adminData.organizationName,
    slug,
    ownerEmail: adminData.email,
    plan: 'FREE',
    isActive: true
  });
  console.log('✓ Organization created:', organization.name);

  // Create admin user
  const passwordHash = await hashPassword(adminData.password);
  const user = await User.create({
    organizationId: organization._id,
    fullName: adminData.fullName,
    email: adminData.email.toLowerCase(),
    passwordHash,
    role: 'SUPER_ADMIN',
    userType: 'DEVELOPER',
    isActive: true,
    inviteAccepted: true,
    createdBy: null
  });
  console.log('✓ Admin user created');

  console.log('\n=== ADMIN LOGIN DETAILS ===');
  console.log('Email:', adminData.email);
  console.log('Password:', adminData.password);
  console.log('===========================\n');

  await mongoose.disconnect();
  console.log('✓ Disconnected');
}

seed().catch(console.error);