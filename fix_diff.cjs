const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  /const diff = \(kpis\.currentJulyProductivity - \(metrics2025\.find\(m => m\.month === 7\)\?\.laborProductivityPercent \|\| 0\)\)\.toFixed\(1\);/g,
  'const diff = ((kpis.currentJulyProductivity || 0) - (metrics2025.find(m => m.month === 7)?.laborProductivityPercent || 0)).toFixed(1);'
);

fs.writeFileSync('App.tsx', code);
