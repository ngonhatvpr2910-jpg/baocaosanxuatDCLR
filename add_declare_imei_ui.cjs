const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

const declareUI = `
            {/* KHAI BÁO IMEI */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col p-4 space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Khai Báo IMEI KHSX
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Ngày KHSX</label>
                  <input
                    type="date"
                    id="declareImeiDate"
                    defaultValue={formDate}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Mã Sản Phẩm</label>
                  <select
                    id="declareImeiProduct"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Danh sách IMEI (mỗi dòng 1 IMEI)</label>
                <textarea
                  id="declareImeiList"
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans font-mono"
                  placeholder="Paste danh sách IMEI vào đây..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    const date = (document.getElementById('declareImeiDate') as HTMLInputElement).value;
                    const productId = (document.getElementById('declareImeiProduct') as HTMLSelectElement).value;
                    const rawList = (document.getElementById('declareImeiList') as HTMLTextAreaElement).value;
                    if (!date || !productId || !rawList.trim()) {
                      alert('Vui lòng điền đủ thông tin!');
                      return;
                    }
                    const imeis = rawList.split('\\n').map(i => i.trim()).filter(i => i);
                    if (imeis.length === 0) return;
                    
                    const newDecls = imeis.map(i => ({
                      imei: i,
                      productId,
                      date
                    }));
                    
                    setDeclaredImeis(prev => {
                      const filtered = prev.filter(p => !(p.productId === productId && p.date === date));
                      return [...newDecls, ...filtered];
                    });
                    
                    alert(\`Đã khai báo thành công \${newDecls.length} IMEI cho KHSX ngày \${date}\`);
                    (document.getElementById('declareImeiList') as HTMLTextAreaElement).value = '';
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
                >
                  Lưu Khai Báo
                </button>
              </div>
            </div>
`;

content = content.replace(
  /<div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col">/,
  declareUI + '\n            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col">'
);

fs.writeFileSync('App.tsx', content);
