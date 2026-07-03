const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

// Only match <Bar and <Line where the next char is space or > or \n
content = content.replace(/<Bar([\s>])/g, '<Bar isAnimationActive={false}$1');
content = content.replace(/<Line([\s>])/g, '<Line isAnimationActive={false}$1');
// And clean up duplicates just in case
content = content.replace(/isAnimationActive=\{false\} isAnimationActive=\{false\}/g, 'isAnimationActive={false}');

fs.writeFileSync('App.tsx', content);
