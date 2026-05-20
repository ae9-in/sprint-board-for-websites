import fs from 'fs';

const logPath = 'C:\\Users\\jishn\\.gemini\\antigravity\\brain\\fd72becd-79b2-499e-9436-f1dda9e0cab5\\.system_generated\\logs\\transcript.jsonl';
const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

for (const line of lines) {
  if (!line) continue;
  const step = JSON.parse(line);
  if (step.source === 'USER_EXPLICIT') {
    console.log(`Step ${step.step_index} (User):`, step.content.substring(0, 150));
  }
}
