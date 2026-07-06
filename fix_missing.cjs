const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const additions = `
  const displayWeeklyScrap = useMemo(() => {
    return weeklyScrap.map(r => ({
      ...r,
      scrapCost: r.scrapCost === null ? null : Math.round(r.scrapCost * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1)))
    }));
  }, [filterDivision, weeklyScrap]);

  const displayWeeklyDclrError = useMemo(() => {
    return weeklyDclrError.map(r => ({
      ...r,
      errorRate: r.errorRate === null ? null : Number((r.errorRate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1))).toFixed(2))
    }));
  }, [filterDivision, weeklyDclrError]);
`;

code = code.replace(
  /  const chartMonthlyScrap = useMemo/,
  additions + '\n  const chartMonthlyScrap = useMemo'
);

fs.writeFileSync('App.tsx', code);
