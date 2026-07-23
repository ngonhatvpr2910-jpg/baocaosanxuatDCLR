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
    if (weekNum <= 4) return 1;
    if (weekNum <= 8) return 2;
    if (weekNum <= 13) return 3;
    if (weekNum <= 17) return 4;
    if (weekNum <= 21) return 5;
    if (weekNum <= 26) return 6;
    if (weekNum <= 30) return 7;
    if (weekNum <= 34) return 8;
    if (weekNum <= 39) return 9;
    if (weekNum <= 43) return 10;
    if (weekNum <= 47) return 11;
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
console.log(computedFromWeeks);
