import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jishnu:jishnu123@cluster0.mt6agn4.mongodb.net/sprintboard?appName=Cluster0';

async function listProjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    console.log('✓ Connected to MongoDB');

    const orgs = await db.collection('organizations').find({}).toArray();
    console.log('\nOrganizations:');
    orgs.forEach(o => console.log(`- ${o.name} (${o.slug}) id: ${o._id}`));

    const users = await db.collection('users').find({}).toArray();
    console.log('\nUsers:');
    users.forEach(u => console.log(`- ${u.fullName} (${u.email}) id: ${u._id} orgId: ${u.organizationId}`));

    const projects = await db.collection('projects').find({}).toArray();
    console.log('\nProjects:');
    projects.forEach(p => {
      console.log(`- ${p.name} (Client: ${p.clientName})`);
      console.log(`  gitLink: ${p.gitLink}`);
      console.log(`  vercelFrontendLink: ${p.vercelFrontendLink}`);
      console.log(`  vercelBackendLink: ${p.vercelBackendLink}`);
      console.log(`  envDriveLink: ${p.envDriveLink}`);
      console.log(`  walkthroughVideoUrl: ${p.walkthroughVideoUrl}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listProjects();
