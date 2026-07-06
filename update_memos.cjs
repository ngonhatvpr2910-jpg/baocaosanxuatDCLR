const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const displayMonthlyScrapLogic = `
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
`;

code = code.replace(
  /const displayMonthlyScrap = useMemo\(\(\) => \{[\s\S]*?\}\);/g,
  displayMonthlyScrapLogic.trim()
);

const displayMonthlyDclrErrorLogic = `
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
`;

code = code.replace(
  /const displayMonthlyDclrError = useMemo\(\(\) => \{[\s\S]*?\}\);/g,
  displayMonthlyDclrErrorLogic.trim()
);

fs.writeFileSync('App.tsx', code);
