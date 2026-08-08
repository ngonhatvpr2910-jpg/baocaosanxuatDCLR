const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

let target = `  const updateScrapMetric = (type: "monthly" | "weekly", index: number, value: string) => {
    const numericValue = value === "" ? null : Number(value);
    if (type === "monthly") {
      setMonthlyScrap(prev => {
        const next = [...prev];
        next[index] = { ...next[index], scrapCost: numericValue };
        return next;
      });
    } else {
      setWeeklyScrap(prev => {
        const next = [...prev];
        next[index] = { ...next[index], scrapCost: numericValue };
        return next;
      });
    }
  };

  const updateDclrErrorMetric = (type: "monthly" | "weekly", index: number, value: string) => {
    const numericValue = value === "" ? null : Number(value);
    if (type === "monthly") {
      setMonthlyDclrError(prev => {
        const next = [...prev];
        next[index] = { ...next[index], errorRate: numericValue };
        return next;
      });
    } else {
      setWeeklyDclrError(prev => {
        const next = [...prev];
        next[index] = { ...next[index], errorRate: numericValue };
        return next;
      });
    }
  };`;

let repl = `  const updateScrapMetric = (type: "monthly" | "weekly", identifier: number | string, value: string) => {
    const numericValue = value === "" ? null : Number(value);
    if (type === "monthly") {
      setMonthlyScrap(prev => {
        const next = [...prev];
        next[identifier as number] = { ...next[identifier as number], scrapCost: numericValue };
        return next;
      });
    } else {
      setWeeklyScrap(prev => {
        const next = [...prev];
        const idx = next.findIndex(w => w.week === identifier);
        if (idx !== -1) next[idx] = { ...next[idx], scrapCost: numericValue };
        return next;
      });
    }
  };

  const updateDclrErrorMetric = (type: "monthly" | "weekly", identifier: number | string, value: string) => {
    const numericValue = value === "" ? null : Number(value);
    if (type === "monthly") {
      setMonthlyDclrError(prev => {
        const next = [...prev];
        next[identifier as number] = { ...next[identifier as number], errorRate: numericValue };
        return next;
      });
    } else {
      setWeeklyDclrError(prev => {
        const next = [...prev];
        const idx = next.findIndex(w => w.week === identifier);
        if (idx !== -1) next[idx] = { ...next[idx], errorRate: numericValue };
        return next;
      });
    }
  };`;

code = code.replace(target, repl);
fs.writeFileSync('App.tsx', code);
