const fs = require('fs');
const content = fs.readFileSync('src/views/SuperadminDashboard.vue', 'utf8');

// Just analyze where tabs start
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('v-if="activeTab ===')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
