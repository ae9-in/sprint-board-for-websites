import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const UserSchema = new mongoose.Schema({
  email: String,
  passwordHash: String
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'admin@sprintboard.com';
    const newPassword = 'Admin@123';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(newPassword, salt);
    
    const result = await User.updateOne({ email }, { passwordHash: hash });
    
    if (result.matchedCount > 0) {
      console.log(`Successfully reset password for ${email} to ${newPassword}`);
    } else {
      console.log(`User ${email} not found.`);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

resetPassword();
