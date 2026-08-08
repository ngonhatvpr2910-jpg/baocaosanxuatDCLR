const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const target = `    const updated = baseMetrics.map((m) => {
      // Get logs for this month
      const logsForMonth = productionLogs.filter(`;

const replacement = `    const updated = baseMetrics.map((m) => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const isPast = m.year < currentYear || (m.year === currentYear && m.month < currentMonth);
      const isCurrent = m.year === currentYear && m.month === currentMonth;
      const isLocked = (isPast || isCurrent) && !(m.year === 2026 && m.month === 7);
      const isAutoReportMonth = isLocked;

      // Get logs for this month
      const logsForMonth = productionLogs.filter(`;

code = code.replace(target, replacement);

const target2 = `      if (hasLogs || isFormMonth) {
        const filteredLogs = hasSavedFormDate`;

const replacement2 = `      if (isAutoReportMonth && (hasLogs || isFormMonth)) {
        const filteredLogs = hasSavedFormDate`;

code = code.replace(target2, replacement2);

fs.writeFileSync('App.tsx', code);
