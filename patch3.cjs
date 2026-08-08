const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

let target = `  const [weeklyScrap, setWeeklyScrap] = useState<WeeklyScrapReport[]>(() => {
    const saved = localStorage.getItem("sunhouse_weekly_scrap_v2");
    if (saved) return JSON.parse(saved);
    const initial = JSON.parse(JSON.stringify(WEEKLY_SCRAP_REPORT)) as WeeklyScrapReport[];
    initial[0].scrapCost = 1820000;
    initial[1].scrapCost = 2150000;
    initial[2].scrapCost = 1480000;
    initial[3].scrapCost = 3420000;
    initial[4].scrapCost = 2900000;
    initial[5].scrapCost = 1120000;
    return initial;
  });

  const [weeklyDclrError, setWeeklyDclrError] = useState<WeeklyDclreErrorRate[]>(() => {
    const saved = localStorage.getItem("sunhouse_weekly_dclr_error_v2");
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(WEEKLY_DCLR_ERROR_RATE));
  });`;

let repl = `  const [weeklyScrap, setWeeklyScrap] = useState<WeeklyScrapReport[]>(() => {
    const saved = localStorage.getItem("sunhouse_weekly_scrap_v2");
    let arr = saved ? JSON.parse(saved) : [];
    let full = Array.from({ length: 53 }).map((_, i) => ({ week: "W" + (1 + i), scrapCost: null }));
    arr.forEach(a => {
      const idx = full.findIndex(f => f.week === a.week);
      if (idx !== -1) full[idx].scrapCost = a.scrapCost;
    });
    if (!saved) {
      const d = [1820000, 2150000, 1480000, 3420000, 2900000, 1120000];
      d.forEach((v, i) => {
        const idx = full.findIndex(f => f.week === "W" + (23 + i));
        if (idx !== -1) full[idx].scrapCost = v;
      });
    }
    return full;
  });

  const [weeklyDclrError, setWeeklyDclrError] = useState<WeeklyDclreErrorRate[]>(() => {
    const saved = localStorage.getItem("sunhouse_weekly_dclr_error_v2");
    let arr = saved ? JSON.parse(saved) : [];
    let full = Array.from({ length: 53 }).map((_, i) => ({ week: "W" + (1 + i), errorRate: null }));
    arr.forEach(a => {
      const idx = full.findIndex(f => f.week === a.week);
      if (idx !== -1) full[idx].errorRate = a.errorRate;
    });
    return full;
  });`;

code = code.replace(target, repl);
fs.writeFileSync('App.tsx', code);
