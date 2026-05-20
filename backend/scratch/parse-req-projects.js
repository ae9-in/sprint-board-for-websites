import fs from 'fs';

const content = fs.readFileSync('scratch/user-req-3.txt', 'utf8');

// Parse name-XYZ blocks
const matches = content.matchAll(/name-([a-zA-Z\s]+)\t\r?\n\t"([^"]+)"/g);

let total = 0;
for (const match of matches) {
  const devName = match[1].trim();
  const projectsStr = match[2];
  const projects = projectsStr.split('\n').map(p => p.trim()).filter(Boolean);
  console.log(`Developer: ${devName} (${projects.length} projects)`);
  projects.forEach((p, i) => {
    console.log(`  ${i+1}. ${p}`);
  });
  total += projects.length;
}

console.log(`\nTotal projects parsed: ${total}`);
