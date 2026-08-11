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

export const HistoryDataTab = ({
  setHistoryYear,
  historyYear,
  metrics2025,
  processedMetrics2026,
  updateHistoryMetric,
  setFocusedField,
  simulatedHistoryMetrics,
  selectedYear,
  yearlyCumulativeCompareData,
  selectedTargetMonth,
  setSelectedTargetMonth,
  monthlyTargets,
  updateMonthlyTarget,
  setMonthlyTargets
}: any) => {
  return (
    <motion.div
              key="history-data"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-slate-900/30 rounded-xl border border-slate-800/60 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="space-y-1">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-orange-400" />
                      Mục tiêu sản xuất năm 2026 & Dữ liệu Lịch sử
                    </h3>
                    <p className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5">
                      <span>Dữ liệu kế hoạch & thực tế cho từng tháng.</span>
                      <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                        <Lock className="w-3 h-3" /> Các tháng đã qua và hiện tại được khóa để bảo vệ dữ liệu báo cáo.
                      </span>
                    </p>
                  </div>
                  <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 self-start">
                    <button
                      onClick={() => setHistoryYear(2025)}
                      className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                        historyYear === 2025
                          ? "bg-orange-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      Năm 2025
                    </button>
                    <button
                      onClick={() => setHistoryYear(2026)}
                      className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                        historyYear === 2026
                          ? "bg-orange-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      Năm 2026
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="py-3 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">Tháng</th>
                        <th className="py-3 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">NSLĐ (%)</th>
                        <th className="py-3 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">SP Thực tế</th>
                        <th className="py-3 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">SP Quy đổi</th>
                        <th className="py-3 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Công</th>
                      </tr>
                    </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {(historyYear === 2025 ? metrics2025 : processedMetrics2026).map((m) => {
                          const now = new Date();
                          const currentYear = now.getFullYear();
                          const currentMonth = now.getMonth() + 1;

                          const isPast = historyYear < currentYear || (historyYear === currentYear && m.month < currentMonth);
                          const isCurrent = historyYear === currentYear && m.month === currentMonth;
                          const isLocked = (isPast || isCurrent) && !(historyYear === 2026 && m.month === 7);
                          
                          // Auto report for past and current months
                          const isAutoReportMonth = isLocked;
                          
                          const isLpLocked = isLocked;
                          const isApLocked = isLocked;
                          const isEpLocked = isLocked;
                          const isPmLocked = isLocked;

                          return (
                            <tr key={`history-row-${m.month}-${historyYear}`} className={`hover:bg-slate-900/50 transition-colors ${isLocked ? "bg-slate-950/20" : ""}`}>
                            <td className="py-2 px-2 text-sm font-medium text-slate-300">
                              <div className="flex items-center gap-1.5">
                                Tháng {m.month}
                                {isLocked && <Lock className="w-2.5 h-2.5 text-slate-500" />}
                              </div>
                            </td>
                            
                            {/* NSLĐ */}
                            <td className="py-2 px-2">
                              <div className="relative flex items-center">
                                <input 
                                  type="number" 
                                  value={m.laborProductivityPercent === null || Number.isNaN(m.laborProductivityPercent) ? "" : m.laborProductivityPercent} 
                                  onChange={(e) => updateHistoryMetric(historyYear, m.month, "laborProductivityPercent", e.target.value)}
                                  onFocus={() => setFocusedField({ month: m.month, year: historyYear, field: "laborProductivityPercent" })}
                                  onBlur={() => setFocusedField(null)}
                                  disabled={isLpLocked}
                                  className={`w-full border rounded p-1.5 pr-8 text-sm outline-none transition-all font-medium font-mono ${
                                    isLpLocked 
                                      ? "bg-slate-950/60 border-slate-800/50 text-orange-500/70 cursor-not-allowed"
                                      : "bg-slate-900/40 border-slate-700/50 text-orange-400 focus:border-orange-500/50 focus:bg-slate-900/60"
                                  }`}
                                  placeholder="VD: 110"
                                />
                                {isLpLocked ? (
                                  <Lock className="w-3 h-3 text-slate-600 absolute right-2.5" />
                                ) : (
                                  <span className="absolute right-2 text-[9px] font-bold text-slate-500 tracking-wider bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800 pointer-events-none select-none">%</span>
                                )}
                              </div>
                            </td>

                            {/* SP Thực tế */}
                            <td className="py-2 px-2">
                              <div className="relative flex items-center">
                                {isAutoReportMonth ? (
                                  <>
                                    <input 
                                      type="text" 
                                      readOnly
                                      value={m.actualProducts === null || Number.isNaN(m.actualProducts) ? "" : m.actualProducts.toLocaleString()} 
                                      className="w-full bg-slate-950/20 border border-slate-800/40 text-emerald-400/80 rounded p-1.5 pr-14 text-sm cursor-not-allowed font-medium font-mono"
                                      placeholder="Tự động..."
                                    />
                                    <span className="absolute right-2 text-[9px] font-bold text-slate-500 tracking-wider bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800 pointer-events-none select-none">Báo cáo</span>
                                  </>
                                ) : (
                                  <>
                                    <input 
                                      type="number" 
                                      value={m.actualProducts === null || Number.isNaN(m.actualProducts) ? "" : m.actualProducts} 
                                      onChange={(e) => updateHistoryMetric(historyYear, m.month, "actualProducts", e.target.value)}
                                      onFocus={() => setFocusedField({ month: m.month, year: historyYear, field: "actualProducts" })}
                                      onBlur={() => setFocusedField(null)}
                                      disabled={isApLocked}
                                      className={`w-full bg-slate-900/40 border rounded p-1.5 pr-8 text-sm outline-none transition-all ${
                                        isApLocked
                                          ? "bg-slate-950/40 text-slate-500 border-slate-900/20 cursor-not-allowed"
                                          : "border-slate-700/50 text-white focus:border-orange-500/50 focus:bg-slate-900/60"
                                      }`} 
                                      placeholder="VD: 1500"
                                    />
                                    {isApLocked && (
                                      <Lock className="w-3.5 h-3.5 text-slate-600 absolute right-2.5 pointer-events-none" />
                                    )}
                                  </>
                                )}
                              </div>
                            </td>

                            {/* SP Quy đổi */}
                            <td className="py-2 px-2">
                              <div className="relative flex items-center">
                                {isAutoReportMonth ? (
                                  <>
                                    <input 
                                      type="text" 
                                      readOnly
                                      value={m.equivalentProducts === null || Number.isNaN(m.equivalentProducts) ? "" : m.equivalentProducts.toLocaleString()} 
                                      className="w-full bg-slate-950/20 border border-slate-800/40 text-blue-400/80 rounded p-1.5 pr-14 text-sm cursor-not-allowed font-medium font-mono"
                                      placeholder="Tự động..."
                                    />
                                    <span className="absolute right-2 text-[9px] font-bold text-slate-500 tracking-wider bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800 pointer-events-none select-none">Báo cáo</span>
                                  </>
                                ) : (
                                  <>
                                    <input 
                                      type="number" 
                                      value={m.equivalentProducts === null || Number.isNaN(m.equivalentProducts) ? "" : m.equivalentProducts} 
                                      onChange={(e) => updateHistoryMetric(historyYear, m.month, "equivalentProducts", e.target.value)}
                                      onFocus={() => setFocusedField({ month: m.month, year: historyYear, field: "equivalentProducts" })}
                                      onBlur={() => setFocusedField(null)}
                                      disabled={isEpLocked}
                                      className={`w-full bg-slate-900/40 border rounded p-1.5 pr-8 text-sm outline-none transition-all ${
                                        isEpLocked
                                          ? "bg-slate-950/40 text-slate-500 border-slate-900/20 cursor-not-allowed"
                                          : "border-slate-700/50 text-white focus:border-orange-500/50 focus:bg-slate-900/60"
                                      }`} 
                                      placeholder="VD: 1550"
                                    />
                                    {isEpLocked && (
                                      <Lock className="w-3.5 h-3.5 text-slate-600 absolute right-2.5 pointer-events-none" />
                                    )}
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Tổng Công */}
                            <td className="py-2 px-2">
                              <div className="relative flex items-center">
                                {isAutoReportMonth ? (
                                  <>
                                    <input 
                                      type="text" 
                                      readOnly
                                      value={m.productionMandays === null || Number.isNaN(m.productionMandays) ? "" : m.productionMandays.toLocaleString()} 
                                      className="w-full bg-slate-950/20 border border-slate-800/40 text-purple-400/80 rounded p-1.5 pr-14 text-sm cursor-not-allowed font-medium font-mono"
                                      placeholder="Tự động..."
                                    />
                                    <span className="absolute right-2 text-[9px] font-bold text-slate-500 tracking-wider bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800 pointer-events-none select-none">Báo cáo</span>
                                  </>
                                ) : (
                                  <>
                                    <input 
                                      type="number" 
                                      value={m.productionMandays === null || Number.isNaN(m.productionMandays) ? "" : m.productionMandays} 
                                      onChange={(e) => updateHistoryMetric(historyYear, m.month, "productionMandays", e.target.value)}
                                      onFocus={() => setFocusedField({ month: m.month, year: historyYear, field: "productionMandays" })}
                                      onBlur={() => setFocusedField(null)}
                                      disabled={isPmLocked}
                                      className={`w-full bg-slate-900/40 border rounded p-1.5 pr-8 text-sm outline-none transition-all ${
                                        isPmLocked
                                          ? "bg-slate-950/40 text-slate-500 border-slate-900/20 cursor-not-allowed"
                                          : "border-slate-700/50 text-white focus:border-orange-500/50 focus:bg-slate-900/60"
                                      }`} 
                                      placeholder="VD: 450"
                                    />
                                    {isPmLocked && (
                                      <Lock className="w-3.5 h-3.5 text-slate-600 absolute right-2.5 pointer-events-none" />
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PHẦN GIẢ LẬP NSLĐ & THIẾT LẬP MỤC TIÊU */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* CỘT TRÁI CHỨA 2 BIỂU ĐỒ */}
                <div className="xl:col-span-2 space-y-6">
                  
                  {/* 1. BIỂU ĐỒ SO SÁNH HIỆU SUẤT VỚI NĂM 2025 */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          <TrendingUp className="text-orange-500 w-4 h-4" />
                          Biểu Đồ So Sánh Hiệu Suất với Năm 2025 & Chỉ Tiêu (Lũy kế %)
                        </h4>
                        <p className="text-xs text-slate-400">
                          So sánh năng suất thực tế của năm {historyYear} với năm cơ sở 2025 và chỉ tiêu kế hoạch.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                        <span className="flex items-center gap-1 bg-orange-950 text-orange-400 px-2 py-0.5 border border-orange-800 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          Thực tế ({historyYear})
                        </span>
                        <span className="flex items-center gap-1 bg-blue-950 text-blue-400 px-2 py-0.5 border border-blue-800 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          Năm 2025
                        </span>
                        <span className="flex items-center gap-1 bg-rose-950/80 text-rose-400 px-2 py-0.5 border border-rose-900 rounded font-bold">
                          <span className="w-1.5 h-1.5 bg-rose-500 block"></span>
                          Mục tiêu
                        </span>
                      </div>
                    </div>

                    <div className="h-[400px]">
                      <ResponsiveContainer width="99%" height="100%">
                        <ComposedChart data={simulatedHistoryMetrics} margin={{ top: 40, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="month" fontSize={11} stroke="#64748b" interval={0} />
                          <YAxis tickFormatter={(v) => `${v}%`} domain={YAXIS_DOMAIN} fontSize={11} stroke="#64748b" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg shadow-xl text-xs space-y-1.5 font-sans">
                                    <p className="font-semibold text-white border-b border-slate-800 pb-1">{data.monthFullName} ({selectedYear})</p>
                                    <p className="text-slate-400">
                                      Thực tế ({historyYear}): <span className="text-orange-400 font-semibold">{data.hasActualData ? `${data.actualNSLD}%` : "Chưa nhập / Trống"}</span>
                                    </p>
                                    <p className="text-slate-400">
                                      Năm 2025: <span className="text-blue-400 font-semibold">{data.nsld2025 !== null ? `${data.nsld2025}%` : "Chưa nhập / Trống"}</span>
                                    </p>
                                    <p className="text-slate-400">
                                      Mục tiêu: <span className="text-rose-400 font-semibold">{data.targetNSLD}%</span>
                                    </p>
                                    <div className="border-t border-slate-800/80 pt-1.5 mt-1 text-[10px] text-slate-500 space-y-0.5 font-mono">
                                      {data.hasActualData && <p className="text-amber-500/85">🔒 Ô dữ liệu tháng này đã được lưu khóa</p>}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          
                          <Bar isAnimationActive={false} 
                            dataKey="actualNSLD" 
                            name={`NSLĐ Thực Tế (${historyYear})`} 
                            fill="#f97316" 
                            radius={[4, 4, 0, 0]} 
                            barSize={18}
                          >
                            <LabelList dataKey="actualNSLD" position="top" offset={3} fill="#fb923c" fontSize={10} fontWeight="semibold" formatter={(v: any) => v !== null && v !== undefined ? `${Number(v).toFixed(1)}%` : ''} />
                          </Bar>

                          <Bar isAnimationActive={false} 
                            dataKey="nsld2025" 
                            name="NSLĐ Năm 2025" 
                            fill="#3b82f6" 
                            fillOpacity={0.6}
                            stroke="#3b82f6"
                            strokeWidth={1}
                            radius={[4, 4, 0, 0]} 
                            barSize={18}
                          >
                            <LabelList dataKey="nsld2025" position="top" offset={3} fill="#60a5fa" fontSize={10} fontWeight="semibold" formatter={(v: any) => v !== null && v !== undefined ? `${Number(v).toFixed(1)}%` : ''} />
                          </Bar>

                          <Line isAnimationActive={false} 
                            type="monotone" 
                            dataKey="targetNSLD" 
                            name="Chỉ Tiêu Mục Tiêu" 
                            stroke="#f43f5e" 
                            strokeWidth={3}
                            dot={{ r: 4, stroke: "#fda4af", strokeWidth: 1 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
                      <Calculator className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-300">Tính năng đối chiếu và đặt chỉ tiêu cải tiến:</p>
                        <p>
                          Hệ thống hiển thị song song năng suất lao động thực tế so với năng suất gốc của năm 2025. Nhờ đó, ban quản lý dễ dàng đánh giá tốc độ tăng trưởng hiệu suất và đưa ra mục tiêu cải tiến (Đường màu đỏ) phù hợp nhất cho từng giai đoạn.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. BIỂU ĐỒ SO SÁNH SONG SONG NSLĐ LŨY KẾ NĂM 2025 & NĂM 2026 */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          <History className="text-blue-500 w-4 h-4" />
                          Biểu Đồ Đối Chiếu Năng Suất Thực Tế Lũy Kế: Năm 2025 vs Năm 2026 (%)
                        </h4>
                        <p className="text-xs text-slate-400">
                          Biểu đồ thể hiện hiệu suất lũy kế của toàn bộ năm học hỏi từ các tháng đã cập nhật dữ liệu lịch sử.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                        <span className="flex items-center gap-1 bg-blue-950 text-blue-400 px-2 py-0.5 border border-blue-800 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          Năm 2025
                        </span>
                        <span className="flex items-center gap-1 bg-orange-950 text-orange-400 px-2 py-0.5 border border-orange-800 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          Năm 2026
                        </span>
                      </div>
                    </div>

                    <div className="h-[400px]">
                      <ResponsiveContainer width="99%" height="100%">
                        <BarChart data={yearlyCumulativeCompareData} margin={{ top: 40, right: 30, left: -10, bottom: 5 }} barGap={12}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                          <YAxis tickFormatter={(v) => `${v}%`} domain={YAXIS_DOMAIN} fontSize={11} stroke="#64748b" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                const val2025 = data["Năm 2025"];
                                const val2026 = data["Năm 2026"];
                                const diff = (val2025 && val2026) ? (val2026 - val2025).toFixed(1) : null;
                                return (
                                  <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg shadow-xl text-xs space-y-1.5 font-sans">
                                    <p className="font-semibold text-white border-b border-slate-800 pb-1">Hiệu Suất Lũy Kế Cả Năm</p>
                                    <p className="text-blue-400">
                                      Năm 2025: <span className="font-semibold">{val2025 > 0 ? `${val2025}%` : "Trống"}</span>
                                    </p>
                                    <p className="text-orange-400">
                                      Năm 2026: <span className="font-semibold">{val2026 > 0 ? `${val2026}%` : "Trống"}</span>
                                    </p>
                                    {diff !== null && (
                                      <div className="border-t border-slate-800/80 pt-1.5 mt-1 font-mono text-[10px]">
                                        <span className="text-slate-400">Chênh lệch tăng trưởng: </span>
                                        <span className={Number(diff) >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                          {Number(diff) >= 0 ? `+${diff}` : diff}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          
                          <Bar isAnimationActive={false} 
                            dataKey="Năm 2025" 
                            name="Lũy Kế Năm 2025" 
                            fill="#3b82f6" 
                            radius={[4, 4, 0, 0]} 
                            barSize={50}
                          >
                            <LabelList dataKey="Năm 2025" position="top" offset={3} fill="#60a5fa" fontSize={11} fontWeight="semibold" formatter={(v: any) => v && v > 0 ? `${v}%` : ''} />
                          </Bar>

                          <Bar isAnimationActive={false} 
                            dataKey="Năm 2026" 
                            name="Lũy Kế Năm 2026" 
                            fill="#f97316" 
                            radius={[4, 4, 0, 0]} 
                            barSize={50}
                          >
                            <LabelList dataKey="Năm 2026" position="top" offset={3} fill="#fb923c" fontSize={11} fontWeight="semibold" formatter={(v: any) => v && v > 0 ? `${v}%` : ''} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
                      <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-300">Biểu đồ so sánh tích hợp tổng lũy kế năm:</p>
                        <p>
                          Chỉ số này tự động tính toán tổng sản lượng quy đổi chia cho tổng ngày công thực tế của tất cả các tháng đã nhập trong lịch sử đối chiếu với năng suất chuẩn Sunhouse. Trực quan hóa chính xác kết quả tăng trưởng năng suất giữa 2 niên độ.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 2. BẢNG ĐIỀU KHIỂN THIẾT LẬP MỤC TIÊU */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col justify-between gap-6">
                  <div className="space-y-5">
                    <div className="border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Sliders className="text-rose-400 w-4 h-4" />
                        Bảng Thiết Lập Mục Tiêu NSLĐ
                      </h4>
                      <p className="text-xs text-slate-400">
                        Đặt chỉ tiêu chất lượng và năng suất lao động cho từng tháng cụ thể
                      </p>
                    </div>

                    {/* ĐẶT MỤC TIÊU NSLĐ CHO TỪNG THÁNG */}
                    <div className="space-y-4 bg-slate-900/40 p-4 rounded-lg border border-slate-800">
                      <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                        Điều chỉnh chỉ tiêu từng tháng
                      </h5>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Chọn tháng</label>
                          <select
                            value={selectedTargetMonth}
                            onChange={(e) => setSelectedTargetMonth(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1.5 w-full focus:border-rose-500 outline-none"
                          >
                            {Array.from({ length: 12 }).map((_, i) => (
                              <option key={i} value={i + 1}>Tháng {i + 1}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Mục tiêu (%)</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="50"
                              max="200"
                              value={Number.isNaN(monthlyTargets[`${historyYear}-${selectedTargetMonth}`]) ? 110 : (monthlyTargets[`${historyYear}-${selectedTargetMonth}`] || 110)}
                              onChange={(e) => updateMonthlyTarget(historyYear, selectedTargetMonth, Number(e.target.value))}
                              className="bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded p-1.5 w-full focus:border-rose-500 outline-none text-center"
                            />
                            <span className="text-xs text-slate-400">%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Kéo nhanh để đặt mục tiêu:</span>
                          <span className="font-mono text-rose-400 font-bold">
                            {monthlyTargets[`${historyYear}-${selectedTargetMonth}`] || 110}%
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min="70" 
                          max="160" 
                          value={Number.isNaN(monthlyTargets[`${historyYear}-${selectedTargetMonth}`]) ? 110 : (monthlyTargets[`${historyYear}-${selectedTargetMonth}`] || 110)} 
                          onChange={(e) => updateMonthlyTarget(historyYear, selectedTargetMonth, Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500" 
                        />
                      </div>

                      <div className="pt-3 border-t border-slate-800 space-y-1.5">
                        <p className="text-[10px] text-slate-500">Thiết lập nhanh cho cả năm {historyYear}:</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...monthlyTargets };
                              for (let m = 1; m <= 12; m++) {
                                updated[`${historyYear}-${m}`] = 110;
                              }
                              setMonthlyTargets(updated);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 py-1.5 px-1 rounded border border-slate-800 text-center transition cursor-pointer"
                          >
                            Mục tiêu 110% cả năm
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...monthlyTargets };
                              for (let m = 1; m <= 12; m++) {
                                updated[`${historyYear}-${m}`] = 120;
                              }
                              setMonthlyTargets(updated);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 py-1.5 px-1 rounded border border-slate-800 text-center transition cursor-pointer"
                          >
                            Mục tiêu 120% cả năm
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                    <p className="leading-relaxed text-center px-1">
                      Chỉ tiêu NSLĐ thiết lập tại đây sẽ làm mốc định hướng cho các hoạt động đo lường hiệu suất thực tế hàng ngày, hàng tuần của nhà máy Sunhouse.
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
  );
};
