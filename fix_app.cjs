const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const replacement = `
  const displayMonthlyDclrError = useMemo(() => {
    const computedFromWeeksSum = Array(12).fill(0);
    const computedFromWeeksCount = Array(12).fill(0);
    
    weeklyDclrError.forEach(w => {
      if (w.errorRate !== null) {
        const weekNum = parseInt(w.week.replace("W", ""), 10);
        const month = Math.ceil(weekNum * 12 / 52);
        if (month >= 1 && month <= 12) {
          computedFromWeeksSum[month - 1] += w.errorRate;
          computedFromWeeksCount[month - 1] += 1;
        }
      }
    });

    return monthlyDclrError.map((m, i) => {
      let errorRate = m.errorRate;
      if (computedFromWeeksCount[i] > 0) {
        errorRate = Number((computedFromWeeksSum[i] / computedFromWeeksCount[i]).toFixed(2));
      }
      
      return {
        ...m,
        errorRate: errorRate === null ? null : Number((errorRate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1))).toFixed(2))
      };
    });
  }, [filterDivision, monthlyDclrError, weeklyDclrError]);

  const chartMonthlyScrap = useMemo(() => displayMonthlyScrap.filter(r => r.scrapCost !== null), [displayMonthlyScrap]);
  const chartWeeklyScrap = useMemo(() => displayWeeklyScrap.filter(r => r.scrapCost !== null), [displayWeeklyScrap]);
  const chartWeeklyDclrError = useMemo(() => displayWeeklyDclrError.filter(e => e.errorRate !== null), [displayWeeklyDclrError]);

  const displayMetrics = useMemo(() => {
    const baseMetrics = selectedYear === 2025 ? metrics2025 : processedMetrics2026;

    const formDateParts = formDate.split("-");
    const formYear = parseInt(formDateParts[0]);
    const formMonth = parseInt(formDateParts[1]);

    const hasSavedFormDate = productionLogs.some(log => log.date === formDate);

    return baseMetrics.map(m => {
      let eqQty = m.equivalentProducts;
      let actualQty = m.actualProducts;
      
      const filteredAssemblyLogs = filterDivision === "ALL" 
        ? assemblyDailyReports 
        : assemblyDailyReports.filter(row => row.group === filterDivision);
        
      const filteredGasLogs = filterDivision === "ALL" || filterDivision === "BG"
        ? gasDailyReports
        : [];
        
      const targetAssemblyLogs = filteredAssemblyLogs.filter(log => log.date.startsWith(\`\${m.year}-\${m.month.toString().padStart(2, "0")}\`));
      const targetGasLogs = filteredGasLogs.filter(log => log.date.startsWith(\`\${m.year}-\${m.month.toString().padStart(2, "0")}\`));

      const uniqueShiftWorkersMap: Record<string, number> = {};
      targetAssemblyLogs.forEach(log => {
        if (!uniqueShiftWorkersMap[log.date] || log.workersCount > uniqueShiftWorkersMap[log.date]) {
          uniqueShiftWorkersMap[log.date] = log.workersCount;
        }
      });
      targetGasLogs.forEach(log => {
        if (!uniqueShiftWorkersMap[log.date]) uniqueShiftWorkersMap[log.date] = 0;
        uniqueShiftWorkersMap[log.date] += log.workersCount;
      });
`;

// Replace from `  }, [filterDivision, monthlyScrap, weeklyScrap]);` to `      const workdays = Object.values(uniqueShiftWorkersMap).reduce((acc, val) => acc + val, 0);`
const targetPoint = "  }, [filterDivision, monthlyScrap, weeklyScrap]);";
const endPoint = "      const workdays = Object.values(uniqueShiftWorkersMap).reduce((acc, val) => acc + val, 0);";

const startIndex = code.indexOf(targetPoint);
const endIndex = code.indexOf(endPoint);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex + targetPoint.length) + "\n" + replacement + "\n" + code.substring(endIndex);
  fs.writeFileSync('App.tsx', code);
  console.log("Fix applied!");
} else {
  console.log("Could not find points to replace.");
}
