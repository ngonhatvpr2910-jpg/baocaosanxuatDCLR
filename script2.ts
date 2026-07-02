import fs from 'fs';

let content = fs.readFileSync('src/data.ts', 'utf8');

content = content.replace(
  /export const WEEKLY_ATTENDANCE: WeeklyAttendance\[\] = \[\s*[\s\S]*?\s*\];/m,
  `export const WEEKLY_ATTENDANCE: WeeklyAttendance[] = Array.from({ length: 12 }).map((_, i) => ({ week: "W" + (22 + i), rate: null }));`
);

content = content.replace(
  /export const MONTHLY_SCRAP_REPORT: MonthlyScrapReport\[\] = \[\s*[\s\S]*?\s*\];/m,
  `export const MONTHLY_SCRAP_REPORT: MonthlyScrapReport[] = Array.from({ length: 12 }).map((_, i) => ({ month: i + 1, scrapCost: null }));`
);

content = content.replace(
  /export const WEEKLY_SCRAP_REPORT: WeeklyScrapReport\[\] = \[\s*[\s\S]*?\s*\];/m,
  `export const WEEKLY_SCRAP_REPORT: WeeklyScrapReport[] = Array.from({ length: 12 }).map((_, i) => ({ week: "W" + (23 + i), scrapCost: null }));`
);

content = content.replace(
  /export const WEEKLY_DCLR_ERROR_RATE: WeeklyDclreErrorRate\[\] = \[\s*[\s\S]*?\s*\];/m,
  `export const WEEKLY_DCLR_ERROR_RATE: WeeklyDclreErrorRate[] = Array.from({ length: 12 }).map((_, i) => ({ week: "W" + (21 + i), errorRate: null }));`
);

content = content.replace(
  /export const MONTHLY_DCLR_ERROR_RATE: MonthlyDclreErrorRate\[\] = \[\s*[\s\S]*?\s*\];/m,
  `export const MONTHLY_DCLR_ERROR_RATE: MonthlyDclreErrorRate[] = Array.from({ length: 12 }).map((_, i) => ({ month: i + 1, errorRate: null }));`
);

fs.writeFileSync('src/data.ts', content, 'utf8');
console.log('done 2');
