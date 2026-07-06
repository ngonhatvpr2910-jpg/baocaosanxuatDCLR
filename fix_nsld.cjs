const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  /  \}, \[selectedYear, filterDivision, metrics2025, processedMetrics2026, productionLogs, formDate, formAggregates, formWorkersCount, gasDailyReports, assemblyDailyReports, combinedDailyReports\]\);\n\n    const getValues/,
  `  }, [selectedYear, filterDivision, metrics2025, processedMetrics2026, productionLogs, formDate, formAggregates, formWorkersCount, gasDailyReports, assemblyDailyReports, combinedDailyReports]);\n\n  const nsldComparisonData = useMemo(() => {\n    const getValues`
);

fs.writeFileSync('App.tsx', code);
