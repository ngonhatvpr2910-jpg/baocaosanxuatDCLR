export function getFridayToThursdayWeeks(year: number, month: number) {
  let w1Start = new Date(year, 0, 1);
  while (w1Start.getDay() !== 5) {
    w1Start.setDate(w1Start.getDate() - 1);
  }
  
  let weeks = [];
  for (let i = 1; i <= 53; i++) {
    let weekStart = new Date(w1Start);
    weekStart.setDate(w1Start.getDate() + (i - 1) * 7);
    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    let mStart = new Date(year, month - 1, 1);
    let mEnd = new Date(year, month, 0);
    
    if (weekStart <= mEnd && weekEnd >= mStart) {
      weeks.push("W" + i);
    }
  }
  return weeks;
}
