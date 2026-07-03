const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

const replacement = `              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Danh sách IMEI (mỗi dòng 1 IMEI)</label>
                  <div className="flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-emerald-500" />
                    <input
                      type="text"
                      placeholder="Quét IMEI vào đây..."
                      className="px-3 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            const ta = document.getElementById('declareImeiList') as HTMLTextAreaElement;
                            ta.value = ta.value ? ta.value + '\\n' + val : val;
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <textarea`;

content = content.replace(
  /<div>\s*<label className="block text-\[11px\] font-semibold text-slate-400 uppercase tracking-wider mb-2">Danh sách IMEI \(mỗi dòng 1 IMEI\)<\/label>\s*<textarea/,
  replacement
);

fs.writeFileSync('App.tsx', content);
