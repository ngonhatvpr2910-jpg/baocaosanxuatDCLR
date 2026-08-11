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

export const WeeklyReportTab = ({
  setSelectedReportWeek,
  selectedReportWeek,
  selectedYear,
  handleExportWeeklyExcel,
  weeklyReportData,
  filterDivision
}: any) => {
  return (
    <motion.div
              key="weekly-report"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Controls */}
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                    <FileSpreadsheet className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Báo Cáo Kết Quả Sản Xuất Tuần</h2>
                    <p className="text-xs text-slate-400">Chi tiết kế hoạch & thực tế toàn phân xưởng</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => setSelectedReportWeek(prev => Math.max(1, prev - 1))}
                      className="p-2 hover:bg-slate-800 text-slate-400 transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <select 
                      value={selectedReportWeek} 
                      onChange={(e) => setSelectedReportWeek(Number(e.target.value))}
                      className="bg-transparent px-3 py-2 text-sm text-white focus:outline-none font-bold"
                    >
                      {getStandardYearWeeks(selectedYear).map(w => (
                        <option key={w.id} value={w.id} className="bg-slate-900 text-white">W{w.id}: {w.days[0].dateStr.split('-').reverse().slice(0,2).join('/')} - {w.days[w.days.length-1].dateStr.split('-').reverse().slice(0,2).join('/')}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setSelectedReportWeek(prev => Math.min(53, prev + 1))}
                      className="p-2 hover:bg-slate-800 text-slate-400 transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    onClick={handleExportWeeklyExcel}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-black transition cursor-pointer shadow-lg shadow-emerald-900/20 border border-emerald-400"
                  >
                    <Download className="w-4 h-4" /> XUẤT EXCEL
                  </button>
                </div>
              </div>

              {/* Main Table Container */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xl">
                <div className="overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  <table className="w-full text-[11px] border-collapse min-w-[1200px] bg-white text-black">
                    <thead className="sticky top-0 z-20 bg-slate-50 shadow-md">
                      {/* Top Header Row */}
                      <tr className="bg-white text-black border-b border-slate-200">
                        <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 text-center sticky left-0 z-30 bg-white">STT</th>
                        <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 text-left sticky left-[40px] z-30 bg-white min-w-[100px]">Mã SP</th>
                        <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 text-left sticky left-[140px] z-30 bg-white min-w-[200px]">Tên sản phẩm</th>
                        <th rowSpan={2} className="px-2 py-2 border-r border-slate-200 text-center">ĐVT</th>
                        <th rowSpan={2} className="px-2 py-2 border-r border-slate-200 text-center text-black font-bold">Hệ số<br/>quy đổi</th>
                        
                        {weeklyReportData.weekObj?.days.map((day, i) => {
                          const dayNames = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
                          const dayName = dayNames[new Date(day.dateStr).getDay()];
                          return (
                            <th key={i} colSpan={2} className="px-2 py-1 border-r border-slate-200 text-center font-black">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-black font-bold uppercase tracking-tighter">{dayName}</span>
                                <span className="text-black font-bold text-xs">{day.dayNum}/{day.monthNum}</span>
                              </div>
                            </th>
                          );
                        })}
                        
                        <th colSpan={3} className="px-3 py-1 border-slate-200 text-center font-black bg-white text-rose-600 uppercase tracking-widest border-l-2 border-l-slate-300">Kết quả SX</th>
                      </tr>
                      {/* Sub-Header Row */}
                      <tr className="bg-slate-50 text-black border-b border-slate-200">
                        {weeklyReportData.weekObj?.days.map((_, i) => (
                          <React.Fragment key={i}>
                            <th className="px-2 py-1.5 border-r border-slate-200 text-center font-mono text-[10px] text-amber-600 font-bold bg-amber-50">KH</th>
                            <th className="px-2 py-1.5 border-r border-slate-200 text-center font-mono text-[10px] text-emerald-600 font-bold bg-emerald-50">TT</th>
                          </React.Fragment>
                        ))}
                        <th className="px-2 py-1.5 border-r border-slate-200 text-center font-mono text-[10px] text-amber-600 font-bold border-l-2 border-l-slate-300 bg-amber-50">KHSX</th>
                        <th className="px-2 py-1.5 border-r border-slate-200 text-center font-mono text-[10px] text-rose-600 font-bold bg-rose-50">TỔNG TT</th>
                        <th className="px-2 py-1.5 border-slate-200 text-center font-mono text-[10px] text-slate-500 font-bold bg-slate-50">+/-</th>
                      </tr>
                    </thead>
                    
                    <tbody className="divide-y divide-slate-200">
                      {weeklyReportData.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-3 py-2 border-r border-slate-200 text-center text-black font-mono sticky left-0 z-10 bg-white group-hover:bg-slate-50">{idx + 1}</td>
                          <td className="px-3 py-2 border-r border-slate-200 text-black font-bold font-mono sticky left-[40px] z-10 bg-white group-hover:bg-slate-50">{row.product.code}</td>
                          <td className="px-3 py-2 border-r border-slate-200 text-black font-medium sticky left-[140px] z-10 bg-white group-hover:bg-slate-50 line-clamp-1">{row.product.name}</td>
                          <td className="px-2 py-2 border-r border-slate-200 text-center text-black">{row.product.unit || "Cái"}</td>
                          <td className="px-2 py-2 border-r border-slate-200 text-center text-amber-600 font-bold font-mono">{row.product.factor?.toFixed(2)}</td>
                          
                          {row.dayData.map((d, i) => (
                            <React.Fragment key={i}>
                              <td className={`px-2 py-2 border-r border-slate-200 text-center font-mono text-black`}>
                                {d.plan > 0 ? d.plan.toLocaleString() : "-"}
                              </td>
                              <td className={`px-2 py-2 border-r border-slate-200 text-center font-mono font-bold ${d.actual > 0 ? "text-emerald-600" : "text-black"}`}>
                                {d.actual > 0 ? d.actual.toLocaleString() : "-"}
                              </td>
                            </React.Fragment>
                          ))}
                          
                          <td className="px-2 py-2 border-r border-slate-200 text-center font-mono font-black text-black bg-slate-50 border-l-2 border-l-slate-300">{row.totalPlan.toLocaleString()}</td>
                          <td className="px-2 py-2 border-r border-slate-200 text-center font-mono font-black text-rose-600 bg-slate-50">{row.totalActual.toLocaleString()}</td>
                          <td className={`px-2 py-2 text-center font-mono font-black border-slate-200 bg-slate-50 ${row.diff >= 0 ? "text-emerald-600" : "text-black"}`}>
                            {row.diff > 0 ? `+${row.diff.toLocaleString()}` : row.diff.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Footer Rows for Totals */}
                    <tfoot className="sticky bottom-0 z-20 bg-slate-50 font-black uppercase text-[11px] text-black">
                      {/* Unconverted Total */}
                      <tr className="bg-slate-50 text-black border-t-2 border-slate-300">
                        <td colSpan={3} className="px-4 py-3 border-r border-slate-200 text-left sticky left-0 z-10 bg-slate-50">Tổng sản phẩm chưa quy đổi</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">Chiếc</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">-</td>
                        {weeklyReportData.dayTotals.map((d, i) => (
                          <React.Fragment key={i}>
                            <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">{d.plan.toLocaleString()}</td>
                            <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">{d.actual.toLocaleString()}</td>
                          </React.Fragment>
                        ))}
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs border-l-2 border-l-slate-300">{weeklyReportData.grandTotal.plan?.toLocaleString()}</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">{weeklyReportData.grandTotal.actual?.toLocaleString()}</td>
                        <td className="px-2 py-3 text-center font-mono text-xs">{(weeklyReportData.grandTotal.allTimeActual - weeklyReportData.grandTotal.allTimePlan)?.toLocaleString()}</td>
                      </tr>

                      {/* Converted Total */}
                      <tr className="bg-slate-50 text-black border-t border-slate-200">
                        <td colSpan={3} className="px-4 py-3 border-r border-slate-200 text-left sticky left-0 z-10 bg-slate-50">Tổng sản phẩm quy đổi</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">Chiếc</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">-</td>
                        {weeklyReportData.dayTotals.map((d, i) => (
                          <React.Fragment key={i}>
                            <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">{Number(d.planEq.toFixed(2)).toLocaleString()}</td>
                            <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">{Number(d.actualEq.toFixed(2)).toLocaleString()}</td>
                          </React.Fragment>
                        ))}
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs border-l-2 border-l-slate-300">{Number((weeklyReportData.grandTotal.planEq || 0).toFixed(2)).toLocaleString()}</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">{Number((weeklyReportData.grandTotal.actualEq || 0).toFixed(2)).toLocaleString()}</td>
                        <td className="px-2 py-3 text-center font-mono text-xs">{Number((weeklyReportData.grandTotal.allTimeActualEq - weeklyReportData.grandTotal.allTimePlanEq).toFixed(2)).toLocaleString()}</td>
                      </tr>

                      {/* Workers Total */}
                      <tr className="bg-slate-100 text-black border-t border-slate-200">
                        <td colSpan={3} className="px-4 py-3 border-r border-slate-200 text-left sticky left-0 z-10 bg-slate-100">Tổng số người (Công thao tác)</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">Người</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">-</td>
                        {weeklyReportData.dayTotals.map((d, i) => (
                          <React.Fragment key={i}>
                            <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">-</td>
                            <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">{d.workers ? Number((d.workers as number).toFixed(2)).toLocaleString() : "-"}</td>
                          </React.Fragment>
                        ))}
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs border-l-2 border-l-slate-300">-</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">{weeklyReportData.grandTotal.workers ? Number(weeklyReportData.grandTotal.workers.toFixed(2)).toLocaleString() : "-"}</td>
                        <td className="px-2 py-3 text-center font-mono text-xs">-</td>
                      </tr>

                      {/* Productivity Row */}
                      <tr className="bg-slate-50 text-black border-t border-slate-200">
                        <td colSpan={3} className="px-4 py-3 border-r border-slate-200 text-left sticky left-0 z-10 bg-slate-50">Hiệu suất NSLĐ (Chấm)</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">Chấm</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">9.03</td>
                        {weeklyReportData.dayTotals.map((d, i) => {
                          const dots = d.workers > 0 ? (d.actualEq / d.workers) : 0;
                          return (
                            <React.Fragment key={i}>
                              <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">-</td>
                              <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs font-black">
                                {dots > 0 ? dots.toFixed(2) : "-"}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs border-l-2 border-l-slate-300">-</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs font-black">
                          {/* Use weekly calculation logic */}
                          {(() => {
                            const totalDaysWithWorkers = weeklyReportData.dayTotals.filter(d => (d.workers as number) > 0).length;
                            const totalMandays = weeklyReportData.grandTotal.workers * totalDaysWithWorkers;
                            const avgDots = totalMandays > 0 ? (weeklyReportData.grandTotal.actualEq / totalMandays) : 0;
                            return avgDots > 0 ? avgDots.toFixed(2) : "-";
                          })()}
                        </td>
                        <td className="px-2 py-3 text-center font-mono text-xs">-</td>
                      </tr>

                      {/* Productivity Percent Row */}
                      <tr className="bg-slate-50 text-black border-t border-slate-200">
                        <td colSpan={3} className="px-4 py-3 border-r border-slate-200 text-left sticky left-0 z-10 bg-slate-50">Hiệu suất NSLĐ (%)</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">%</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">100%</td>
                        {weeklyReportData.dayTotals.map((d, i) => {
                          const dots = d.workers > 0 ? (d.actualEq / (d.workers as number)) : 0;
                          const percent = (dots / 9.03) * 100;
                          return (
                            <React.Fragment key={i}>
                              <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs">-</td>
                              <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs font-bold">
                                {dots > 0 ? `${percent.toFixed(1)}%` : "-"}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs border-l-2 border-l-slate-300">-</td>
                        <td className="px-2 py-3 border-r border-slate-200 text-center font-mono text-xs font-bold">
                          {(() => {
                            const totalDaysWithWorkers = weeklyReportData.dayTotals.filter(d => (d.workers as number) > 0).length;
                            const totalMandays = weeklyReportData.grandTotal.workers * totalDaysWithWorkers;
                            const avgDots = totalMandays > 0 ? (weeklyReportData.grandTotal.actualEq / totalMandays) : 0;
                            const avgPercent = (avgDots / 9.03) * 100;
                            return avgDots > 0 ? `${avgPercent.toFixed(1)}%` : "-";
                          })()}
                        </td>
                        <td className="px-2 py-3 text-center font-mono text-xs">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Bottom Summary & Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Summary Card */}
                <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-800 flex flex-col justify-between shadow-lg">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-rose-500" />
                      TỔNG KẾT TUẦN W{selectedReportWeek}
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                        <span className="block text-[10px] text-slate-500 font-mono uppercase mb-1">KH (Tuần)</span>
                        <span className="text-xl font-black text-white font-mono">{weeklyReportData.grandTotal.planEq > 0 ? Math.round(weeklyReportData.grandTotal.planEq).toLocaleString() : "0"}</span>
                      </div>
                      <div className="text-center p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                        <span className="block text-[10px] text-slate-500 font-mono uppercase mb-1">TH (Tuần)</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">{weeklyReportData.grandTotal.actualEq > 0 ? Math.round(weeklyReportData.grandTotal.actualEq).toLocaleString() : "0"}</span>
                      </div>
                      <div className="text-center p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                        <span className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Tỉ lệ (%)</span>
                        <span className={`text-xl font-black font-mono ${weeklyReportData.grandTotal.actualEq >= weeklyReportData.grandTotal.planEq ? "text-emerald-400" : "text-rose-500"}`}>
                          {weeklyReportData.grandTotal.planEq > 0 ? `${(weeklyReportData.grandTotal.actualEq / weeklyReportData.grandTotal.planEq * 100).toFixed(1)}%` : "0%"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Trạng thái tuần:</span>
                        {(() => {
                          const data = weeklyReportData as any;
                          const lastDayWithDataIndex = [...data.dayTotals].reverse().findIndex((d: any) => d.actualEq > 0);
                          const lastIndex = lastDayWithDataIndex === -1 ? -1 : data.dayTotals.length - 1 - lastDayWithDataIndex;
                          
                          const isCumulativeAchieved = data.cumulativeActualEq >= data.cumulativePlanEq && data.cumulativePlanEq > 0;
                          const isTodayAchieved = lastIndex >= 0 ? data.dayTotals[lastIndex].actualEq >= data.dayTotals[lastIndex].planEq : false;
                          
                          // Cumulative failure overrides today's success
                          // If cumulative is achieved, but today failed, we still show ĐẠT (on track) 
                          // unless today's achievement is the primary indicator user wants.
                          // Based on "ngày đạt thì tuần đạt", but "lũy kế không đạt thì chưa đạt":
                          const status = isCumulativeAchieved ? "ĐẠT KẾ HOẠCH" : "CHƯA ĐẠT KẾ HOẠCH";
                          const color = isCumulativeAchieved ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-500";
                          
                          return (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${color}`}>
                              {status}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>NSLĐ Trung bình:</span>
                        <div className="text-right">
                          <span className={`text-xl font-black font-mono block ${((weeklyReportData.grandTotal.actualEq / (weeklyReportData.grandTotal.workers * (weeklyReportData.dayTotals.filter(d => (d.workers as number) > 0).length || 1))) / 9.03 * 100) >= 100 ? "text-emerald-400" : "text-amber-400"}`}>
                            {(() => {
                              const totalDaysWithWorkers = weeklyReportData.dayTotals.filter(d => (d.workers as number) > 0).length;
                              const totalMandays = weeklyReportData.grandTotal.workers * totalDaysWithWorkers;
                              const avgDots = totalMandays > 0 ? (weeklyReportData.grandTotal.actualEq / totalMandays) : 0;
                              const avgPercent = (avgDots / 9.03) * 100;
                              return `${avgPercent.toFixed(1)}%`;
                            })()}
                          </span>
                          <span className="text-white/60 font-bold font-mono text-[10px]">
                            {(() => {
                              const totalDaysWithWorkers = weeklyReportData.dayTotals.filter(d => (d.workers as number) > 0).length;
                              const totalMandays = weeklyReportData.grandTotal.workers * totalDaysWithWorkers;
                              const avgDots = totalMandays > 0 ? (weeklyReportData.grandTotal.actualEq / totalMandays) : 0;
                              return `${avgDots.toFixed(2)} Chấm / Định mức 9.03`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-800/60">
                    <div className="flex items-center gap-3 p-3 bg-rose-500/5 rounded-lg border border-rose-500/10 text-[11px] text-rose-200/70 leading-relaxed">
                      <Info className="w-4 h-4 text-rose-500 shrink-0" />
                      Số liệu được tổng hợp từ nhật ký sản xuất hằng ngày và kế hoạch tháng đã thiết lập.
                    </div>
                  </div>
                </div>

                {/* Chart Card */}
                <div className="lg:col-span-2 bg-slate-900/40 p-6 rounded-xl border border-slate-800 shadow-lg">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      BIỂU ĐỒ NĂNG SUẤT VÀ SẢN LƯỢNG {filterDivision === "ALL" ? "PHÂN XƯỞNG" : filterDivision}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                        <span className="text-[10px] font-mono">KH (Quy đổi)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                        <span className="text-[10px] font-mono">TH (Thực tế)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-mono">NSLĐ (%)</span>
                      </div>
                    </div>
                  </h3>
                  
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={weeklyReportData.dayTotals.map((d, i) => ({
                        name: weeklyReportData.weekObj?.days[i].dayNum + "/" + weeklyReportData.weekObj?.days[i].monthNum,
                        kh: Math.round(d.planEq),
                        tt: Math.round(d.actualEq),
                        prod: d.workers > 0 ? Number(((d.actualEq / (d.workers as number)) / 9.03 * 100).toFixed(1)) : 0
                      }))} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                          dy={10}
                        />
                        <YAxis 
                          yId="left"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                        />
                        <YAxis 
                          yId="right"
                          orientation="right"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#10b981', fontSize: 11, fontWeight: 'bold' }}
                          domain={[0, 160]}
                          unit="%"
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}
                          itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                          labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}
                        />
                        <ReferenceLine yId="right" y={100} stroke="#475569" strokeWidth={1} strokeDasharray="3 3" label={{ position: 'right', value: '100%', fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                        
                        <Bar yId="left" dataKey="kh" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Kế hoạch (QĐ)" barSize={20}>
                          <LabelList dataKey="kh" position="top" fill="#3b82f6" fontSize={10} fontWeight="bold" offset={5} formatter={(val: number) => val > 0 ? val.toLocaleString() : ""} />
                        </Bar>
                        <Bar yId="left" dataKey="tt" fill="#ef4444" radius={[2, 2, 0, 0]} name="Thực tế (QĐ)" barSize={20}>
                          <LabelList dataKey="tt" position="top" fill="#ef4444" fontSize={10} fontWeight="bold" offset={5} formatter={(val: number) => val > 0 ? val.toLocaleString() : ""} />
                        </Bar>
                        
                        <Line yId="right" type="monotone" dataKey="prod" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} name="NSLĐ (%)">
                          <LabelList dataKey="prod" position="top" fill="#ef4444" fontSize={18} fontWeight="900" offset={25} formatter={(val: number) => val > 0 ? `${val}%` : ""} />
                        </Line>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
  );
};
