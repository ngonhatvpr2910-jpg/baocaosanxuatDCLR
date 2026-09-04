import { YAXIS_DOMAIN, getProductModelCode, getWeeksInMonth, getYearWeeks, getStandardYearWeeks } from "./appUtils";
import * as XLSX from "xlsx";
import { SUNHOUSE_LINES, INDUSTRIAL_STANDARDS } from "./data";
import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine, LabelList
} from 'recharts';
import {
  TrendingUp, Users, Award, Calendar, Layers, ChevronRight, Database, PlusCircle, Clock, Sparkles, Info, CheckCircle, RotateCcw, Sliders, Flame, Droplet, FileText, FileCheck, Building, ArrowRight, Calculator, FileSpreadsheet, Trash2, Edit, Pencil, X, Upload, Download, Check, AlertCircle, Zap, DollarSign, Activity, Lock, Unlock, History, ScanBarcode, Barcode, List, Search, Filter, Eye, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// Types might be needed, let's just use any for now or import from types
import { ProductGroup, MonthlyMetric } from './types';

export const MonthlyPlanTab = ({
  setSelectedProductToAdd,
  setIsAddPlanModalOpen,
  handleExportMonthlyPlan,
  handleMonthlyPlanUpload,
  products,
  monthlyPlan,
  currentYearMonth,
  filterDivision,
  handleClearMonthlyPlanRow,
  setMonthlyPlan,
  formDate,
  setExecutionFilterType,
  executionFilterType,
  executionFilterDay,
  setExecutionFilterDay,
  executionFilterWeek,
  setExecutionFilterWeek,
  monthlyPlanExecution
}: any) => {
  return (
    <motion.div
              key="monthly-plan"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/60 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                      Kế hoạch sản xuất Tháng
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">Cập nhật KHSX cho từng mã hàng theo ngày</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedProductToAdd("");
                        setIsAddPlanModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 font-bold rounded transition text-xs shadow-sm cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Thêm Kế Hoạch
                    </button>
                    <button
                      onClick={handleExportMonthlyPlan}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-500 font-bold rounded transition text-xs shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Xuất Excel
                    </button>

                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 hover:text-emerald-300 font-bold rounded cursor-pointer transition text-xs border border-emerald-900/50">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Import Excel
                      <input type="file" accept=".xlsx, .xls" onChange={handleMonthlyPlanUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-lg overflow-y-auto relative">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-900 text-slate-300 uppercase font-mono text-[10px] tracking-wider">
                        <th className="py-2.5 px-3 border-b border-r border-slate-800 sticky top-0 left-0 z-30 bg-slate-900 min-w-[120px] w-[120px] max-w-[120px]">Mã hàng</th>
                        <th className="py-2.5 px-3 border-b border-r border-slate-800 sticky top-0 left-[120px] z-30 bg-slate-900 w-10 text-center">Tools</th>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <th key={day} className="py-2.5 px-2 border-b border-r border-slate-800 text-center w-16 min-w-[80px] sticky top-0 z-20 bg-slate-900">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {products.filter(p => (monthlyPlan[currentYearMonth]?.[p.id]) !== undefined && (filterDivision === "ALL" || p.group === filterDivision)).length === 0 ? (
                        <tr key="empty-monthly-plan">
                          <td colSpan={33} className="py-12 text-center text-slate-400 text-xs font-sans bg-slate-950">
                            Chưa có mã hàng nào trong Kế hoạch tháng. Hãy bấm <strong className="text-emerald-400">"Thêm Kế Hoạch"</strong> hoặc <strong className="text-emerald-400">"Import Excel"</strong> để bắt đầu.
                          </td>
                        </tr>
                      ) : (
                        products.filter(p => (monthlyPlan[currentYearMonth]?.[p.id]) !== undefined && (filterDivision === "ALL" || p.group === filterDivision)).map(p => (
                          <tr key={p.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-1.5 px-3 font-mono text-[11px] text-slate-300 border-r border-slate-800 sticky left-0 z-10 bg-slate-950 font-bold truncate min-w-[120px] w-[120px] max-w-[120px]" title={p.code}>
                              {p.code}
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-800 sticky left-[120px] z-10 bg-slate-950 min-w-[60px] w-[60px]">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => handleClearMonthlyPlanRow(p.id)}
                                  className="p-1 hover:bg-rose-900/50 rounded text-slate-500 hover:text-rose-400 transition"
                                  title="Xóa toàn bộ hàng"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <td key={day} className="p-0 border-r border-slate-800 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={(monthlyPlan[currentYearMonth]?.[p.id]?.[day]) !== undefined ? monthlyPlan[currentYearMonth]?.[p.id]?.[day] : ""}
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    setMonthlyPlan(prev => {
                                      const next = { ...prev };
                                      if (!next[currentYearMonth]) next[currentYearMonth] = {};
                                      if (!next[currentYearMonth][p.id]) next[currentYearMonth][p.id] = {};
                                      if (valStr === "") {
                                          delete next[currentYearMonth][p.id][day];
                                      } else {
                                          next[currentYearMonth][p.id][day] = parseInt(valStr) || 0;
                                      }
                                      return next;
                                    });
                                  }}
                                  className="w-full h-full min-h-[35px] min-w-[80px] bg-transparent text-center text-slate-100 focus:bg-slate-800 focus:outline-none text-[12px] font-bold px-2"
                                />
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BẢNG THEO DÕI THỰC HIỆN KẾ HOẠCH SẢN XUẤT */}
              <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/60 space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                      <TrendingUp className="w-5 h-5 text-rose-500" />
                      Theo dõi Thực hiện Kế hoạch sản xuất Tháng {parseInt(formDate.split("-")[1])}/{formDate.split("-")[0]}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">So sánh Sản lượng lũy kế thực tế so với mục tiêu kế hoạch</p>
                  </div>
                  <div className="text-[11px] font-mono bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-400">
                    Phân xưởng: <strong className="text-rose-500">{filterDivision === "ALL" ? "Tất cả" : filterDivision === "MLN" ? "DCRO" : filterDivision === "RMA" ? "DCRMA (RMA)" : "DCBG"}</strong>
                  </div>
                </div>

                {/* Bộ lọc theo ngày, tuần, tháng */}
                <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-850 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Bộ lọc thời gian báo cáo:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setExecutionFilterType("DAY")}
                        className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all duration-200 ${
                          executionFilterType === "DAY"
                            ? "bg-rose-600 text-white shadow-md"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Lọc theo Ngày
                      </button>
                      <button
                        onClick={() => setExecutionFilterType("WEEK")}
                        className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all duration-200 ${
                          executionFilterType === "WEEK"
                            ? "bg-rose-600 text-white shadow-md"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Lọc theo Tuần
                      </button>
                      <button
                        onClick={() => setExecutionFilterType("MONTH")}
                        className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all duration-200 ${
                          executionFilterType === "MONTH"
                            ? "bg-rose-600 text-white shadow-md"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Lọc theo Tháng
                      </button>
                    </div>

                    {executionFilterType === "DAY" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-sans">Chọn ngày:</span>
                        <select
                          value={executionFilterDay}
                          onChange={(e) => setExecutionFilterDay(parseInt(e.target.value) || 1)}
                          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-bold font-mono text-white focus:border-rose-500 outline-none"
                        >
                          {(() => {
                            const [year, month] = formDate.split("-");
                            const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
                            return Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                              <option key={d} value={d}>Ngày {d}</option>
                            ));
                          })()}
                        </select>
                      </div>
                    )}

                    {executionFilterType === "WEEK" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-sans">Chọn tuần:</span>
                        <select
                          value={executionFilterWeek}
                          onChange={(e) => setExecutionFilterWeek(parseInt(e.target.value) || 1)}
                          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-bold font-mono text-white focus:border-rose-500 outline-none"
                        >
                          {(() => {
                            const [year, month] = formDate.split("-");
                            const customWeeks = getWeeksInMonth(Number(year), Number(month));
                            return customWeeks.map(item => (
                              <option key={item.id} value={item.id}>{item.label}</option>
                            ));
                          })()}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tóm tắt nhanh Thực hiện Kế hoạch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    const totalPlan = monthlyPlanExecution.reduce((sum, item) => sum + item.planQty, 0);
                    const totalPlanEq = monthlyPlanExecution.reduce((sum, item) => sum + item.planEqQty, 0);
                    const totalActual = monthlyPlanExecution.reduce((sum, item) => sum + item.actualQty, 0);
                    const totalActualEq = monthlyPlanExecution.reduce((sum, item) => sum + item.actualEqQty, 0);
                    const overallPercent = totalPlan > 0 ? Number(((totalActual / totalPlan) * 100).toFixed(1)) : (totalActual > 0 ? 100 : 0);
                    const diffSum = totalActual - totalPlan;

                    const [year, month] = formDate.split("-");
                    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
                    const yearWeeks = getYearWeeks(Number(year));
                    const selectedWeekObj = yearWeeks.find(w => w.id === executionFilterWeek) || yearWeeks[0];
                    const weekLabelPart = selectedWeekObj ? selectedWeekObj.label : `Tuần ${executionFilterWeek}`;

                    const planLabel = executionFilterType === "MONTH" 
                      ? "Tổng Kế Hoạch Tháng" 
                      : executionFilterType === "WEEK" 
                        ? `Kế Hoạch ${weekLabelPart}` 
                        : `Kế Hoạch Ngày ${executionFilterDay}`;

                    const actualLabel = executionFilterType === "MONTH" 
                      ? "Thực Tế Sản Xuất Tháng" 
                      : executionFilterType === "WEEK" 
                        ? `Thực Tế ${weekLabelPart}` 
                        : `Thực Tế Ngày ${executionFilterDay}`;

                    return (
                      <>
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                          <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">{planLabel}</div>
                          <div className="text-lg font-black text-white mt-1 font-mono">
                            {(totalPlan || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal font-sans">SP</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Quy đổi: {Math.round(totalPlanEq || 0).toLocaleString()} SP</div>
                        </div>

                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                          <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">{actualLabel}</div>
                          <div className="text-lg font-black text-emerald-400 mt-1 font-mono">
                            {(totalActual || 0).toLocaleString()} <span className="text-xs text-emerald-500 font-normal font-sans">SP</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Quy đổi: {Math.round(totalActualEq || 0).toLocaleString()} SP</div>
                        </div>

                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                          <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Tỷ Lệ Hoàn Thành</div>
                          <div className="text-lg font-black text-rose-500 mt-1 font-mono">
                            {overallPercent}%
                          </div>
                          <div className="w-full bg-slate-850 rounded-full h-1.5 mt-1.5">
                            <div 
                              className="bg-rose-500 h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, overallPercent)}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                          <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Hao Hụt / Vượt Tiến Độ</div>
                          <div className={`text-lg font-black mt-1 font-mono ${diffSum >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                            {diffSum >= 0 ? `+${(diffSum || 0).toLocaleString()}` : (diffSum || 0).toLocaleString()} <span className="text-xs font-normal font-sans text-slate-400">SP</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-sans">So với chỉ tiêu ban đầu</div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Grid Table */}
                <div className="overflow-x-auto border border-slate-850 rounded-lg overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-900 text-slate-300 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-20">
                        <th className="py-3 px-4 font-semibold sticky left-0 z-10 bg-slate-900">Mã hàng</th>
                        <th className="py-3 px-4 font-semibold">Tên sản phẩm</th>
                        <th className="py-3 px-4 font-semibold text-center">Phân xưởng</th>
                        <th className="py-3 px-4 text-right font-semibold">Hệ số QĐ</th>
                        <th className="py-3 px-4 text-right font-semibold">Kế hoạch (SP)</th>
                        <th className="py-3 px-4 text-right font-semibold">Thực tế (SP)</th>
                        <th className="py-3 px-4 text-right font-semibold">Chênh lệch</th>
                        <th className="py-3 px-4 font-semibold">Tiến độ hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 bg-slate-950/20">
                      {monthlyPlanExecution.length === 0 ? (
                        <tr key="empty-monthly-execution">
                          <td colSpan={8} className="py-12 text-center text-slate-500 italic font-sans bg-slate-950/40">
                            Không có dữ liệu kế hoạch hoặc sản xuất thực tế nào trong tháng này để theo dõi.
                          </td>
                        </tr>
                      ) : (
                        monthlyPlanExecution.map((item) => {
                          const isSuccess = item.progressPercent >= 100;
                          return (
                            <tr key={item.product.id} className="hover:bg-slate-900/40 transition">
                              <td className="py-3 px-4 font-mono font-bold text-slate-200 sticky left-0 bg-slate-950 z-10">
                                {item.product.code}
                              </td>
                              <td className="py-3 px-4 text-slate-300 truncate max-w-xs font-sans" title={item.product.name}>
                                {item.product.name}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  item.product.group === "MLN" 
                                    ? "bg-blue-950/50 text-blue-400 border border-blue-900/45" 
                                    : "bg-orange-950/50 text-orange-400 border border-orange-900/45"
                                }`}>
                                  {item.product.group === "MLN" ? "DCRO" : item.product.group === "RMA" ? "DCRMA" : "DCBG"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-400">
                                {item.product.factor}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-white">
                                {(item.planQty || 0).toLocaleString()}
                                <div className="text-[10px] text-slate-500 font-normal font-sans">
                                  QĐ: {Math.round(item.planEqQty || 0).toLocaleString()}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                                {(item.actualQty || 0).toLocaleString()}
                                <div className="text-[10px] text-slate-500 font-normal font-sans">
                                  QĐ: {Math.round(item.actualEqQty || 0).toLocaleString()}
                                </div>
                              </td>
                              <td className={`py-3 px-4 text-right font-mono font-bold ${
                                item.diffQty >= 0 ? "text-emerald-500" : "text-rose-400"
                              }`}>
                                {item.diffQty >= 0 ? `+${(item.diffQty || 0).toLocaleString()}` : (item.diffQty || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-24 bg-slate-850 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-300 ${
                                        isSuccess ? "bg-emerald-500" : "bg-rose-500"
                                      }`}
                                      style={{ width: `${Math.min(100, item.progressPercent)}%` }}
                                    />
                                  </div>
                                  <span className={`font-mono text-xs font-bold min-w-[45px] ${
                                    isSuccess ? "text-emerald-400" : "text-rose-400"
                                  }`}>
                                    {item.progressPercent}%
                                  </span>
                                  {isSuccess ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500 inline-block" />
                                  ) : item.planQty > 0 ? (
                                    <AlertCircle className="w-4 h-4 text-rose-500/80 inline-block" />
                                  ) : (
                                    <span className="w-4 h-4 inline-block" />
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
  );
};
