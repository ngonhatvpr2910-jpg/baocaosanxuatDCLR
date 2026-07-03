const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

content = content.replace(
  /const itemDateStr = new Date\(item\.timestamp\)\.toISOString\(\)\.slice\(0, 10\);/,
  `const d = new Date(item.timestamp);
        const itemDateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');`
);

fs.writeFileSync('App.tsx', content);
