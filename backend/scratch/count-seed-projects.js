import fs from 'fs';

const fileContent = fs.readFileSync('seed-projects.js', 'utf8');
const regex = /name:\s*'([^']+)'/g;
let match;
const names = [];
while ((match = regex.exec(fileContent)) !== null) {
  names.push(match[1]);
}
console.log("Total names in seed-projects.js:", names.length);
console.log(JSON.stringify(names, null, 2));
