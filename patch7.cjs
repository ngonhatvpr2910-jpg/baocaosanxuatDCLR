const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

let target = `                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-rose-500" />
                    Hồ Sơ Danh Mục Lỗi Sản Lượng
                  </h4>`;

let repl = `                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-rose-500" />
                      Hồ Sơ Danh Mục Lỗi Sản Lượng
                    </h4>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Tháng:</label>
                      <select 
                        value={scrapQualityMonth}
                        onChange={(e) => setScrapQualityMonth(Number(e.target.value))}
                        className="bg-slate-950 text-white text-xs border border-slate-700 rounded px-2 py-1 outline-none"
                      >
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i+1} value={i+1}>Tháng {i+1}</option>
                        ))}
                      </select>
                    </div>
                  </div>`;

code = code.replace(target, repl);
fs.writeFileSync('App.tsx', code);
