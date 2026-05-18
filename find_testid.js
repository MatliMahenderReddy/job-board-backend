const fs = require('fs');
const html = fs.readFileSync('indeed_debug.html', 'utf8');
const regex = /data-testid="([^"]+)"/g;
const matches = new Set();
let match;
while ((match = regex.exec(html)) !== null) {
  matches.add(match[1]);
}
console.log(Array.from(matches));
