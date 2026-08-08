const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// The original state was:
// const [historyYear, setHistoryYear] = useState<2025 | 2026>(2025);
// It was changed to:
// const [selectedYear, setHistoryYear] = useState<2025 | 2026>(2025);

code = code.replace(`const [selectedYear, setHistoryYear] = useState<2025 | 2026>(2025);`, `const [historyYear, setHistoryYear] = useState<2025 | 2026>(2025);`);

// And in the history metrics section, I need to restore historyYear:
code = code.replace(/const currentHistoryMetrics = selectedYear === 2025 \? metrics2025 : processedMetrics2026;/g, `const currentHistoryMetrics = historyYear === 2025 ? metrics2025 : processedMetrics2026;`);
code = code.replace(/const targetNSLD = monthlyTargets\[\`\$\{selectedYear\}-\$\{m.month\}\`\] \|\| 110;/g, `const targetNSLD = monthlyTargets[\`\${historyYear}-\${m.month}\`] || 110;`);
code = code.replace(/const isPastPeriod = selectedYear === 2025 \|\| m.month <= 6;/g, `const isPastPeriod = historyYear === 2025 || m.month <= 6;`);
code = code.replace(/hasActualData: actualNSLD !== null && \(isPastPeriod \|\| \(selectedYear === 2026 && m.month === 7\)\),/g, `hasActualData: actualNSLD !== null && (isPastPeriod || (historyYear === 2026 && m.month === 7)),`);
code = code.replace(/}, \[selectedYear, metrics2025, processedMetrics2026, monthlyTargets\]\);/g, `}, [historyYear, metrics2025, processedMetrics2026, monthlyTargets]);`);
code = code.replace(/selectedYear === 2025/g, `historyYear === 2025`);
code = code.replace(/selectedYear === 2026/g, `historyYear === 2026`);
code = code.replace(/selectedYear < currentYear/g, `historyYear < currentYear`);
code = code.replace(/selectedYear === currentYear/g, `historyYear === currentYear`);
code = code.replace(/\`history-row-\$\{m.month\}-\$\{selectedYear\}\`/g, `\`history-row-\${m.month}-\${historyYear}\``);
code = code.replace(/updateHistoryMetric\(selectedYear, m.month/g, `updateHistoryMetric(historyYear, m.month`);
code = code.replace(/year: selectedYear, field/g, `year: historyYear, field`);
code = code.replace(/của năm \{selectedYear\}/g, `của năm {historyYear}`);
code = code.replace(/Thực tế \(\{selectedYear\}\)/g, `Thực tế ({historyYear})`);
code = code.replace(/\(\{selectedYear\}\): /g, `({historyYear}): `);
code = code.replace(/\`NSLĐ Thực Tế \(\$\{selectedYear\}\)\`/g, `\`NSLĐ Thực Tế (\${historyYear})\``);
code = code.replace(/monthlyTargets\[\`\$\{selectedYear\}-\$\{selectedTargetMonth\}\`\]/g, `monthlyTargets[\`\${historyYear}-\${selectedTargetMonth}\`]`);
code = code.replace(/updateMonthlyTarget\(selectedYear,/g, `updateMonthlyTarget(historyYear,`);
code = code.replace(/cho cả năm \{selectedYear\}/g, `cho cả năm {historyYear}`);
code = code.replace(/updated\[\`\$\{selectedYear\}-\$\{m\}\`\]/g, `updated[\`\${historyYear}-\${m}\`]`);

fs.writeFileSync('App.tsx', code);
