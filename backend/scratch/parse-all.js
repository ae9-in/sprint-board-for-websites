import fs from 'fs';

const content = fs.readFileSync('scratch/user-req-3.txt', 'utf8');

// The file contains name-<devName> and then columns separated by tabs.
// Let's split by "name-"
const parts = content.split(/(?=name-[a-zA-Z\s]+)/);

for (const part of parts) {
  if (!part.trim()) continue;
  const lines = part.split('\n');
  const firstLine = lines[0];
  const devName = firstLine.replace('name-', '').trim();
  console.log(`\n=================== DEVELOPER: ${devName} ===================`);
  
  // The rest of the part is the tab-separated columns for this developer
  const rest = part.substring(firstLine.length).trim();
  // Split by tabs, taking care of quotes
  // We can write a simple regex or parser to split by tab, but only when not inside quotes
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < rest.length; i++) {
    const char = rest[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '\t' && !inQuotes) {
      cols.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current) {
    cols.push(current.trim());
  }

  console.log(`Found ${cols.length} columns:`);
  cols.forEach((col, idx) => {
    console.log(`--- Column ${idx + 1} ---`);
    console.log(col);
  });
}
