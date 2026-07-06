const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const weeklyGraph = `
                {/* Recharts: Chi phí Hàng Hỏng (Scrap) - Tuần */}
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/60">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Theo Dõi Hàng Hỏng Theo Tuần</h4>
                      <p className="text-xs text-slate-400">Tổn thất chi tiết từng tuần sản xuất (VND)</p>
                    </div>
                    <span className="px-2.5 py-1 bg-rose-950 text-rose-450 text-[10px] font-mono border border-rose-800 rounded">
                      Weekly Metric
                    </span>
                  </div>
                  <div className="h-[380px]">
                    <ResponsiveContainer width="99%" height="100%">
                      <BarChart data={chartWeeklyScrap} margin={{ top: 40, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="week" fontSize={11} stroke="#64748b" />
                        <YAxis tickFormatter={(v) => \`\${(v / 1000000).toFixed(1)}M\`} fontSize={11} stroke="#64748b" domain={YAXIS_DOMAIN} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }}
                          formatter={(value) => [\`\${Number(value).toLocaleString()} VND\`, "Giá trị hàng hỏng"]}
                        />
                        <Bar isAnimationActive={false} dataKey="scrapCost" name="Cước phí hỏng (VND)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={18}>
                          <LabelList dataKey="scrapCost" position="top" fill="#f43f5e" fontSize={10} fontWeight="semibold" formatter={(v) => \`\${(v / 1000000).toFixed(1)}M\`} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
`;

code = code.replace(
  /<div className="grid grid-cols-1 gap-6">([\s\S]*?)<\/div>\s*\{\/\* LỖI THAO TÁC BIỂU ĐỒ \*\/\}/g,
  '<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">$1' + weeklyGraph + '              </div>\n              {/* LỖI THAO TÁC BIỂU ĐỒ */}'
);

fs.writeFileSync('App.tsx', code);
