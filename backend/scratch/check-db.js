import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Project } from '../src/models/index.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sprintboard';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const projects = await Project.find({ isDeleted: false }).lean();
    
    // Group by organizationId
    const orgProjects = {};
    projects.forEach(p => {
      const orgId = p.organizationId.toString();
      if (!orgProjects[orgId]) orgProjects[orgId] = [];
      orgProjects[orgId].push(p);
    });

    console.log(`Total non-deleted projects: ${projects.length}`);
    console.log(`Organizations found: ${Object.keys(orgProjects).length}`);

    Object.entries(orgProjects).forEach(([orgId, list]) => {
      console.log(`\n--- Org ID: ${orgId} (${list.length} projects) ---`);
      
      const counts = {};
      list.forEach(p => {
        counts[p.name] = (counts[p.name] || 0) + 1;
      });

      console.log('Duplicate projects within this org:');
      let duplicatesFound = false;
      Object.entries(counts).forEach(([name, count]) => {
        if (count > 1) {
          console.log(`- "${name}": ${count} times`);
          duplicatesFound = true;
        }
      });
      if (!duplicatesFound) {
        console.log('None');
      }

      console.log('Sample of project names (first 10):');
      list.slice(0, 10).forEach((p, idx) => {
        console.log(`  ${idx + 1}. "${p.name}" (${p.clientName})`);
      });
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

check();
