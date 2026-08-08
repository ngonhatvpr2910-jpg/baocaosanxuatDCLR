function getWeeksForMonth(year, month) {
  // week starts on Friday (5), ends on Thursday (4)
  // Let's find Week 1: the week that contains Jan 1st?
  // Let's assume Week 1 starts on the first Friday of the year, OR the Friday before Jan 1st if Jan 1st is not Friday.
  
  let jan1 = new Date(year, 0, 1);
  let w1Start = new Date(year, 0, 1);
  // Roll back to Friday
  while (w1Start.getDay() !== 5) {
    w1Start.setDate(w1Start.getDate() - 1);
  }
  
  // Now let's generate all 52/53 weeks of the year
  let weeks = [];
  for (let i = 1; i <= 53; i++) {
    let weekStart = new Date(w1Start);
    weekStart.setDate(w1Start.getDate() + (i - 1) * 7);
    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Check if this week overlaps with the given month (month is 1-12)
    let mStart = new Date(year, month - 1, 1);
    let mEnd = new Date(year, month, 0);
    
    if (weekStart <= mEnd && weekEnd >= mStart) {
      weeks.push({
        weekNum: i,
        name: "W" + i,
        start: weekStart.toISOString().slice(0, 10),
        end: weekEnd.toISOString().slice(0, 10)
      });
    }
  }
  return weeks;
}

console.log(getWeeksForMonth(2026, 7));
