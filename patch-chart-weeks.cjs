const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

let target = `  const chartMonthlyScrap = useMemo(() => displayMonthlyScrap.filter(r => r.scrapCost !== null), [displayMonthlyScrap]);
  const chartWeeklyScrap = useMemo(() => displayWeeklyScrap.filter(r => r.scrapCost !== null), [displayWeeklyScrap]);
  const chartWeeklyDclrError = useMemo(() => displayWeeklyDclrError.filter(e => e.errorRate !== null), [displayWeeklyDclrError]);`;

let repl = `  const chartValidWeeks = useMemo(() => {
    const valid = getFridayToThursdayWeeksForMonth(selectedYear, scrapQualityMonth);
    if (valid.length === 0) return [];
    const firstWeekStr = valid[0];
    const firstWeekNum = parseInt(firstWeekStr.replace("W", ""), 10);
    const pastWeeks = [];
    if (firstWeekNum > 2) {
      pastWeeks.push("W" + (firstWeekNum - 2));
      pastWeeks.push("W" + (firstWeekNum - 1));
    } else if (firstWeekNum > 1) {
      pastWeeks.push("W" + (firstWeekNum - 1));
    }
    return [...pastWeeks, ...valid];
  }, [selectedYear, scrapQualityMonth]);

  const chartMonthlyScrap = useMemo(() => displayMonthlyScrap, [displayMonthlyScrap]);
  
  const chartWeeklyScrap = useMemo(() => {
    return weeklyScrap
      .filter(r => chartValidWeeks.includes(r.week))
      .map(r => ({
        ...r,
        scrapCost: r.scrapCost === null ? null : Math.round(r.scrapCost * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1)))
      }));
  }, [filterDivision, weeklyScrap, chartValidWeeks]);

  const chartWeeklyDclrError = useMemo(() => {
    return weeklyDclrError
      .filter(r => chartValidWeeks.includes(r.week))
      .map(r => ({
        ...r,
        errorRate: r.errorRate === null ? null : Number((r.errorRate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1))).toFixed(2))
      }));
  }, [filterDivision, weeklyDclrError, chartValidWeeks]);`;

code = code.replace(target, repl);
fs.writeFileSync('App.tsx', code);
