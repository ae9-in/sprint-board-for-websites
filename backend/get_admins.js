import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const UserSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  role: String
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({ role: 'SUPER_ADMIN' }).limit(5);
    console.log('JSON_START');
    console.log(JSON.stringify(users));
    console.log('JSON_END');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
listUsers();
