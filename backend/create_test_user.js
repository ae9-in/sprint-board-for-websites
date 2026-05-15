import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const UserSchema = new mongoose.Schema({
  organizationId: mongoose.Schema.Types.ObjectId,
  fullName: String,
  email: String,
  passwordHash: String,
  role: String,
  userType: String,
  isActive: Boolean,
  inviteAccepted: Boolean
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find the organization from the admin
    const admin = await User.findOne({ email: 'admin@sprintboard.com' });
    if (!admin) {
       console.log('Admin not found');
       return;
    }

    const email = 'developer@test.com';
    const password = 'User@123';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    
    await User.deleteMany({ email }); // Clear if exists

    await User.create({
      organizationId: admin.organizationId,
      fullName: 'John Developer',
      email: email,
      passwordHash: hash,
      role: 'USER',
      userType: 'DEVELOPER',
      isActive: true,
      inviteAccepted: true
    });
    
    console.log(`Created test developer account: ${email} / ${password}`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

createTestUser();
