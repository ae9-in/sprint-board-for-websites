import fs from 'fs';

const logPath = 'C:\\Users\\jishn\\.gemini\\antigravity\\brain\\fd72becd-79b2-499e-9436-f1dda9e0cab5\\.system_generated\\logs\\transcript.jsonl';

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

for (const line of lines) {
  if (!line) continue;
  const step = JSON.parse(line);
  if (step.source === 'USER_EXPLICIT' && step.step_index === 3) {
    console.log("Found user request content length:", step.content.length);
    fs.writeFileSync('scratch/user-req-3.txt', step.content);
    console.log("Saved content to scratch/user-req-3.txt");
    break;
  }
}
