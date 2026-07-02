import fs from 'fs';

let content = fs.readFileSync('src/data.ts', 'utf8');

content = content.replace(
  /export const HISTORICAL_2025: MonthlyMetric\[\] = \[\s*[\s\S]*?\s*\];/m,
  `export const HISTORICAL_2025: MonthlyMetric[] = Array.from({ length: 12 }).map((_, i) => ({ year: 2025, month: i + 1, laborProductivityPercent: null, productionMandays: null, equivalentProducts: null, attendanceRatePercent: null }));`
);

content = content.replace(
  /export const HISTORICAL_2026: MonthlyMetric\[\] = \[\s*[\s\S]*?\s*\];/m,
  `export const HISTORICAL_2026: MonthlyMetric[] = Array.from({ length: 12 }).map((_, i) => ({ year: 2026, month: i + 1, laborProductivityPercent: null, productionMandays: null, equivalentProducts: null, attendanceRatePercent: null }));`
);

content = content.replace(
  /export const CURRENT_STATE_SUMMARY: TargetComparison = \{[\s\S]*?\};/m,
  `export const CURRENT_STATE_SUMMARY: TargetComparison = {
  khsx: 0,
  actual: 0,
  attendanceRate: 0,
  productivityTarget: 110.0,
};`
);

content = content.replace(
  /export const INITIAL_PRODUCTION_LOGS: ProductionLog\[\] = \[\s*[\s\S]*?\s*\];/m,
  `export const INITIAL_PRODUCTION_LOGS: ProductionLog[] = [];`
);

content = content.replace(
  /export const INITIAL_GAS_DAILY_REPORTS: DailyReportRowGas\[\] = \[\s*[\s\S]*?\s*\];/m,
  `export const INITIAL_GAS_DAILY_REPORTS: DailyReportRowGas[] = [];`
);

content = content.replace(
  /export const INITIAL_ASSEMBLY_DAILY_REPORTS: DailyReportRowAssembly\[\] = \[\s*[\s\S]*?\s*\];/m,
  `export const INITIAL_ASSEMBLY_DAILY_REPORTS: DailyReportRowAssembly[] = [];`
);

fs.writeFileSync('src/data.ts', content, 'utf8');
console.log('done');
