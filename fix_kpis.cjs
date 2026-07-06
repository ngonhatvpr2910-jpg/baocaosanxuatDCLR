const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  /currentJulyEq: Math\.round\(totalEqProd_display\),/g,
  'currentJulyEq: Math.round(totalEqProd_display) || 0,'
);
code = code.replace(
  /currentJulyUnconverted: Math\.round\(totalActualUnitsMonth_display\),/g,
  'currentJulyUnconverted: Math.round(totalActualUnitsMonth_display) || 0,'
);
code = code.replace(
  /currentJulyMandays: Math\.round\(totalMandaysMonth\),/g,
  'currentJulyMandays: Math.round(totalMandaysMonth) || 0,'
);
code = code.replace(
  /currentJulyOfficial: Math\.round\(totalOfficialMonth\),/g,
  'currentJulyOfficial: Math.round(totalOfficialMonth) || 0,'
);
code = code.replace(
  /currentJulySeasonal: Math\.round\(totalSeasonalMonth\),/g,
  'currentJulySeasonal: Math.round(totalSeasonalMonth) || 0,'
);
code = code.replace(
  /currentJulyProductivity: Number\(\(\(totalEqProd_productivity \/ \(totalMandaysMonth \|\| 1\) \/ INDUSTRIAL_STANDARDS\.standardQtyPerManday\) \* 100\)\.toFixed\(2\)\),/g,
  'currentJulyProductivity: Number(((totalEqProd_productivity / (totalMandaysMonth || 1) / INDUSTRIAL_STANDARDS.standardQtyPerManday) * 100).toFixed(2)) || 0,'
);
code = code.replace(
  /currentJulyCompletionRate: totalMonthlyPlanUnits\.total > 0 \? Number\(\(\(totalEqProd_display \/ totalMonthlyPlanUnits\.total\) \* 100\)\.toFixed\(1\)\) : 0,/g,
  'currentJulyCompletionRate: totalMonthlyPlanUnits.total > 0 ? Number(((totalEqProd_display / totalMonthlyPlanUnits.total) * 100).toFixed(1)) || 0 : 0,'
);

fs.writeFileSync('App.tsx', code);
