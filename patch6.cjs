const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// 1. Add state variable
let stateTarget = `  const [dashboardSubTab, setDashboardSubTab] = useState<"standard" | "scrap-quality" | "charts">("standard");`;
let stateRepl = `  const [dashboardSubTab, setDashboardSubTab] = useState<"standard" | "scrap-quality" | "charts">("standard");
  const [scrapQualityMonth, setScrapQualityMonth] = useState<number>(new Date().getMonth() + 1);`;
code = code.replace(stateTarget, stateRepl);

// 2. Fix the broken variable references
code = code.replace(/historyMonth/g, 'scrapQualityMonth');
code = code.replace(/historyYear/g, 'selectedYear'); // Use global selectedYear for these

fs.writeFileSync('App.tsx', code);
