const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Inside products initialization:
// return parsed.map((p: any) => ({
//   ...p,
//   price: p.price ?? (p.group === "MLN" ? 4500000 : 1800000),
//   factor: p.factor ?? 1
// }));

code = code.replace(
  /factor: p\.factor \?\? 1/g,
  'factor: (p.factor === null || Number.isNaN(Number(p.factor))) ? 1 : Number(p.factor)'
);

code = code.replace(
  /price: p\.price \?\? \(p\.group === "MLN" \? 4500000 : 1800000\)/g,
  'price: (p.price === null || Number.isNaN(Number(p.price))) ? (p.group === "MLN" ? 4500000 : 1800000) : Number(p.price)'
);

fs.writeFileSync('App.tsx', code);
