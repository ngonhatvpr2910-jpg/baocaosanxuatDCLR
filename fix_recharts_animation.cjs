const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

// Replace <Bar ...> with <Bar isAnimationActive={false} ...> if it doesn't have it
content = content.replace(/<Bar(?!\s+isAnimationActive)([\s\S]*?)>/g, '<Bar isAnimationActive={false}$1>');
// Replace <Line ...> with <Line isAnimationActive={false} ...> if it doesn't have it
content = content.replace(/<Line(?!\s+isAnimationActive)([\s\S]*?)>/g, '<Line isAnimationActive={false}$1>');

fs.writeFileSync('App.tsx', content);
