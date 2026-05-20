import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sprintboard';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(c => console.log(`- ${c.name}`));

    const count = await db.collection('deploymentdetails').countDocuments();
    console.log(`Total deployment details: ${count}`);

    const sample = await db.collection('deploymentdetails').find({}).limit(5).toArray();
    console.log('Sample deployment details:', JSON.stringify(sample, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

check();
