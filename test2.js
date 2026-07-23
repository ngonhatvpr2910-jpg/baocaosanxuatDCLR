const MONTHLY_SCRAP_REPORT = Array.from({ length: 12 }).map((_, i) => ({ month: i + 1, scrapCost: null }));
const monthlyScrap = MONTHLY_SCRAP_REPORT.slice(0, 6); // Simulate length 6 from local storage

const weeklyScrap = [
  { week: 'W23', scrapCost: 3400000 },
  { week: 'W24', scrapCost: 1700000 },
  { week: 'W25', scrapCost: 2400000 },
  { week: 'W26', scrapCost: 2500000 },
  { week: 'W27', scrapCost: 1000000 },
  { week: 'W28', scrapCost: 600000 },
  { week: 'W29', scrapCost: 1600000 }
];
const getProductionMonthFromWeek = (weekStr) => {
    const weekNum = parseInt(weekStr.replace("W", ""), 10);
    if (weekNum <= 26) return 6;
    if (weekNum <= 30) return 7;
    return 12;
};

const computedFromWeeks = Array(12).fill(null);
weeklyScrap.forEach(w => {
  if (w.scrapCost !== null) {
    const month = getProductionMonthFromWeek(w.week);
    if (month >= 1 && month <= 12) {
      if (computedFromWeeks[month - 1] === null) {
        computedFromWeeks[month - 1] = 0;
      }
      computedFromWeeks[month - 1] += w.scrapCost;
    }
  }
});

const filterDivision = "ALL";
const displayMonthlyScrap = Array.from({ length: 12 }).map((_, i) => {
  const existing = monthlyScrap.find(m => m.month === i + 1);
  let scrapCost = existing ? existing.scrapCost : null;
  if (computedFromWeeks[i] !== null) {
    scrapCost = computedFromWeeks[i];
  }
  return {
    month: i + 1,
    scrapCost: scrapCost === null ? null : Math.round(scrapCost * 1)
  };
});

console.log(displayMonthlyScrap);
