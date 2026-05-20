import fs from 'fs';

const logPath = 'C:\\Users\\jishn\\.gemini\\antigravity\\brain\\fd72becd-79b2-499e-9436-f1dda9e0cab5\\.system_generated\\logs\\transcript.jsonl';
const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const steps = [];
for (const line of lines) {
  if (!line) continue;
  steps.push(JSON.parse(line));
}

// Get last 20 steps
const lastSteps = steps.slice(-20);
for (const step of lastSteps) {
  console.log(`Step ${step.step_index} (${step.source} - ${step.type}):`);
  if (step.content) {
    console.log(step.content.substring(0, 300));
  } else if (step.tool_calls) {
    console.log(JSON.stringify(step.tool_calls));
  }
  console.log('------------------');
}
