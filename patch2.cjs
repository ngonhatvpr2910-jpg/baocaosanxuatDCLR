const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

let target = `  const displayWeeklyScrap = useMemo(() => {
    return weeklyScrap.map(r => ({
      ...r,
      scrapCost: r.scrapCost === null ? null : Math.round(r.scrapCost * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1)))
    }));
  }, [filterDivision, weeklyScrap]);`;

let repl = `  const displayWeeklyScrap = useMemo(() => {
    const validWeeks = getFridayToThursdayWeeksForMonth(historyYear, historyMonth);
    return weeklyScrap
      .filter(r => validWeeks.includes(r.week))
      .map(r => ({
        ...r,
        scrapCost: r.scrapCost === null ? null : Math.round(r.scrapCost * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1)))
      }));
  }, [filterDivision, weeklyScrap, historyYear, historyMonth]);`;
code = code.replace(target, repl);

target = `  const displayWeeklyDclrError = useMemo(() => {
    return weeklyDclrError.map(r => ({
      ...r,
      errorRate: r.errorRate === null ? null : Number((r.errorRate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1))).toFixed(2))
    }));
  }, [filterDivision, weeklyDclrError]);`;

repl = `  const displayWeeklyDclrError = useMemo(() => {
    const validWeeks = getFridayToThursdayWeeksForMonth(historyYear, historyMonth);
    return weeklyDclrError
      .filter(r => validWeeks.includes(r.week))
      .map(r => ({
        ...r,
        errorRate: r.errorRate === null ? null : Number((r.errorRate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1))).toFixed(2))
      }));
  }, [filterDivision, weeklyDclrError, historyYear, historyMonth]);`;

code = code.replace(target, repl);
fs.writeFileSync('App.tsx', code);
