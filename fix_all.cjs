const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const replacement = `  const displayMonthlyDclrError = useMemo(() => {
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

  const displayMonthlyScrap = useMemo(() => {
    const computedFromWeeks = Array(12).fill(null);
    weeklyScrap.forEach(w => {
      if (w.scrapCost !== null) {
        const weekNum = parseInt(w.week.replace("W", ""), 10);
        const month = Math.ceil(weekNum * 12 / 52);
        if (month >= 1 && month <= 12) {
          if (computedFromWeeks[month - 1] === null) {
            computedFromWeeks[month - 1] = 0;
          }
          computedFromWeeks[month - 1] += w.scrapCost;
        }
      }
    });

    return monthlyScrap.map((m, i) => {
      let scrapCost = m.scrapCost;
      if (computedFromWeeks[i] !== null) {
        scrapCost = computedFromWeeks[i];
      }
      return {
        ...m,
        scrapCost: scrapCost === null ? null : Math.round(scrapCost * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1)))
      };
    });
  }, [filterDivision, monthlyScrap, weeklyScrap]);

  const chartMonthlyScrap = useMemo(() => displayMonthlyScrap.filter(r => r.scrapCost !== null), [displayMonthlyScrap]);
  const chartWeeklyScrap = useMemo(() => displayWeeklyScrap.filter(r => r.scrapCost !== null), [displayWeeklyScrap]);
  const chartWeeklyDclrError = useMemo(() => displayWeeklyDclrError.filter(e => e.errorRate !== null), [displayWeeklyDclrError]);

  const displayMetrics = useMemo(() => {
    const baseMetrics = selectedYear === 2025 ? metrics2025 : processedMetrics2026;

    const formDateParts = formDate.split("-");
    const formYear = parseInt(formDateParts[0]);
    const formMonth = parseInt(formDateParts[1]);

    const hasSavedFormDate = productionLogs.some(log => log.date === formDate);

    const getMonthFromDateString = (dStr) => {
      const parts = dStr.split("-");
      if (parts.length < 2) return 0;
      const mStr = parts[1].toLowerCase();
      if (mStr.startsWith("jan")) return 1;
      if (mStr.startsWith("feb")) return 2;
      if (mStr.startsWith("mar")) return 3;
      if (mStr.startsWith("apr")) return 4;
      if (mStr.startsWith("may")) return 5;
      if (mStr.startsWith("jun")) return 6;
      if (mStr.startsWith("jul")) return 7;
      if (mStr.startsWith("aug")) return 8;
      if (mStr.startsWith("sep")) return 9;
      if (mStr.startsWith("oct")) return 10;
      if (mStr.startsWith("nov")) return 11;
      if (mStr.startsWith("dec")) return 12;
      return 0;
    };

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

      const uniqueShiftWorkersMap = {};
      targetAssemblyLogs.forEach(log => {
        if (!uniqueShiftWorkersMap[log.date] || log.workersCount > uniqueShiftWorkersMap[log.date]) {
          uniqueShiftWorkersMap[log.date] = log.workersCount;
        }
      });
      targetGasLogs.forEach(log => {
        if (!uniqueShiftWorkersMap[log.date]) uniqueShiftWorkersMap[log.date] = 0;
        uniqueShiftWorkersMap[log.date] += log.workersCount;
      });

      const workdays = Object.values(uniqueShiftWorkersMap).reduce((acc, val) => acc + val, 0);

      const isFormMonth = m.year === formYear && m.month === formMonth;

      if (filterDivision === "ALL") {
        const addedEqQty = eqQty + (isFormMonth && !hasSavedFormDate ? formAggregates.totalEqQty : 0);
        const addedActualQty = actualQty + (isFormMonth && !hasSavedFormDate ? formAggregates.totalActualQty : 0);
        const addedWorkdays = workdays + (isFormMonth && !hasSavedFormDate ? formWorkersCount : 0);

        if (addedEqQty > 0 || addedActualQty > 0 || addedWorkdays > 0) {
          const baseEq = m.equivalentProducts || 0;
          const baseActual = m.actualProducts || 0;
          const baseMandays = m.productionMandays || 0;
          
          const finalEq = baseEq + addedEqQty;
          const finalActual = baseActual + addedActualQty;
          const finalMandays = baseMandays + addedWorkdays;

          const calculatedProductivity = finalMandays > 0
            ? Number(((finalEq / finalMandays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2))
            : (m.laborProductivityPercent || 100);

          return {
            ...m,
            equivalentProducts: finalEq,
            actualProducts: finalActual,
            productionMandays: finalMandays,
            laborProductivityPercent: calculatedProductivity,
          };
        }
      } else {
        // Fallback to daily reports if available for this month
        const monthReports = combinedDailyReports.filter((r) => getMonthFromDateString(r.date) === m.month);
        if (monthReports.length > 0) {
          const finalEq = monthReports.reduce((sum, r) => sum + (r.totalOutput || 0), 0);
          const finalActual = monthReports.reduce((sum, r) => sum + (r.totalActualOutput || 0), 0);
          const finalMandays = monthReports.reduce((sum, r) => sum + (r.totalCong || 0), 0);
          const calculatedProductivity = finalMandays > 0
            ? Number(((finalEq / finalMandays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2))
            : (m.laborProductivityPercent || 100);
          return {
            ...m,
            equivalentProducts: finalEq,
            actualProducts: finalActual,
            productionMandays: finalMandays,
            laborProductivityPercent: calculatedProductivity,
          };
        }
      }
      return m;
    });
  }, [selectedYear, filterDivision, metrics2025, processedMetrics2026, productionLogs, formDate, formAggregates, formWorkersCount, gasDailyReports, assemblyDailyReports, combinedDailyReports]);
`;

let lines = code.split('\n');
lines.splice(1603, 1810 - 1603 + 1, replacement);

fs.writeFileSync('App.tsx', lines.join('\n'));
