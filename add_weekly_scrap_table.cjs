const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const weeklyScrapRows = `                        <tr key="scr-week-header" className="bg-slate-900/30 text-slate-400 font-semibold border-b border-slate-850 font-mono">
                          {displayWeeklyScrap.map(w => (
                            <td key={\`tb2-w-\${w.week}\`} className="py-2.5 px-2 text-center border-l border-slate-850 font-semibold">{w.week}</td>
                          ))}
                        </tr>
                        <tr key="scr-week-values" className="border-b border-slate-850 text-slate-350 font-mono">
                          {displayWeeklyScrap.map((w, idx) => (
                            <td key={\`tb2-wv-\${w.week}\`} className="py-1 px-1 border-l border-slate-850">
                              <input 
                                type="number" 
                                value={w.scrapCost === null || Number.isNaN(w.scrapCost) ? "" : w.scrapCost}
                                onChange={(e) => updateScrapMetric("weekly", idx, e.target.value)}
                                className="w-full min-w-[70px] bg-transparent text-right outline-none p-1 rounded font-semibold text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:bg-slate-800/50 focus:bg-slate-800 focus:text-rose-400"
                                placeholder="—"
                              />
                            </td>
                          ))}
                        </tr>`;

code = code.replace(
  /<tbody>\s*<\/tbody>/,
  `<tbody>\n${weeklyScrapRows}\n                      </tbody>`
);

fs.writeFileSync('App.tsx', code);
