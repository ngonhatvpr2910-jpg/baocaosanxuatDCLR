const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  /formOfficialCountRO: Number\(\(offRO \/ 8\)\.toFixed\(2\)\),/g,
  'formOfficialCountRO: Number((offRO / 8).toFixed(2)) || 0,'
);
code = code.replace(
  /formSeasonalCountRO: Number\(\(seasRO \/ 8\)\.toFixed\(2\)\),/g,
  'formSeasonalCountRO: Number((seasRO / 8).toFixed(2)) || 0,'
);
code = code.replace(
  /formWorkersCountRO: Number\(\(\(offRO \+ seasRO\) \/ 8\)\.toFixed\(2\)\),/g,
  'formWorkersCountRO: Number(((offRO + seasRO) / 8).toFixed(2)) || 0,'
);
code = code.replace(
  /formOfficialCountRMA: Number\(\(offRMA \/ 8\)\.toFixed\(2\)\),/g,
  'formOfficialCountRMA: Number((offRMA / 8).toFixed(2)) || 0,'
);
code = code.replace(
  /formSeasonalCountRMA: Number\(\(seasRMA \/ 8\)\.toFixed\(2\)\),/g,
  'formSeasonalCountRMA: Number((seasRMA / 8).toFixed(2)) || 0,'
);
code = code.replace(
  /formWorkersCountRMA: Number\(\(\(offRMA \+ seasRMA\) \/ 8\)\.toFixed\(2\)\),/g,
  'formWorkersCountRMA: Number(((offRMA + seasRMA) / 8).toFixed(2)) || 0,'
);
code = code.replace(
  /formOfficialCountBG: Number\(\(offBG \/ 8\)\.toFixed\(2\)\),/g,
  'formOfficialCountBG: Number((offBG / 8).toFixed(2)) || 0,'
);
code = code.replace(
  /formSeasonalCountBG: Number\(\(seasBG \/ 8\)\.toFixed\(2\)\),/g,
  'formSeasonalCountBG: Number((seasBG / 8).toFixed(2)) || 0,'
);
code = code.replace(
  /formWorkersCountBG: Number\(\(\(offBG \+ seasBG\) \/ 8\)\.toFixed\(2\)\),/g,
  'formWorkersCountBG: Number(((offBG + seasBG) / 8).toFixed(2)) || 0,'
);
code = code.replace(
  /formWorkersCount: Number\(\(\(offRO \+ seasRO \+ offRMA \+ seasRMA \+ offBG \+ seasBG\) \/ 8\)\.toFixed\(2\)\),/g,
  'formWorkersCount: Number(((offRO + seasRO + offRMA + seasRMA + offBG + seasBG) / 8).toFixed(2)) || 0,'
);

fs.writeFileSync('App.tsx', code);
