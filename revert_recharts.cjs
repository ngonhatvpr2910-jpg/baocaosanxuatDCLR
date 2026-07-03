const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

content = content.replace(/<Bar isAnimationActive=\{false\}code/g, '<Barcode');
content = content.replace(/<Bar isAnimationActive=\{false\}Chart/g, '<BarChart');
content = content.replace(/<Line isAnimationActive=\{false\}Chart/g, '<LineChart');
content = content.replace(/<Bar isAnimationActive=\{false\} /g, '<Bar ');
content = content.replace(/<Line isAnimationActive=\{false\} /g, '<Line ');
content = content.replace(/<Bar isAnimationActive=\{false\}\n/g, '<Bar\n');
content = content.replace(/<Line isAnimationActive=\{false\}\n/g, '<Line\n');

fs.writeFileSync('App.tsx', content);
