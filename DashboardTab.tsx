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

export const DashboardTab = ({
  setDashboardSubTab,
  dashboardSubTab,
  filterDivision,
  selectedYear,
  formDate,
  totalMonthlyPlanUnits,
  kpis,
  isRevenueVisible,
  setIsRevenueVisible,
  setIsPasswordInputVisible,
  isPasswordInputVisible,
  setPasswordInput,
  passwordInput,
  setRevenuePasswordError,
  revenuePasswordError,
  displayMetrics,
  setLaborViewMode,
  laborViewMode,
  nsldComparisonData,
  setActiveTab,
  productionLogs,
  handleEditLog,
  handleDeleteLog,
  chartMonthlyScrap,
  chartWeeklyScrap,
  displayMonthlyDclrError,
  chartWeeklyDclrError,
  scrapQualityMonth,
  setScrapQualityMonth,
  displayWeeklyScrap,
  updateScrapMetric,
  displayWeeklyDclrError,
  updateDclrErrorMetric,
  setChartTimeDimension,
  chartTimeDimension,
  monthlyComparisonChartData,
  yearlyChartData,
  dailyChartData,
  weeklyChartData
}: any) => {
  return (
    <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* UNIFIED PREMIUM DASHBOARD TOOLBAR */}
              <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Segmented Dashboard Sub-tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setDashboardSubTab("standard")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
                      dashboardSubTab === "standard"
                        ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/10"
                        : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border-slate-800"
                    }`}
                  >
                    📊 Định mức Sản lượng & Năng suất (DCLR)
                  </button>
                  <button
                    onClick={() => setDashboardSubTab("scrap-quality")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
                      dashboardSubTab === "scrap-quality"
                        ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/10"
                        : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border-slate-800"
                    }`}
                  >
                    ⚠️ Báo cáo Hao hụt & Lỗi Thao Tác
                  </button>
                  <button
                    onClick={() => setDashboardSubTab("charts")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
                      dashboardSubTab === "charts"
                        ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/10"
                        : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border-slate-800"
                    }`}
                  >
                    📈 Biểu đồ Phân tích
                  </button>
                </div>
              </div>

              {/* Toolbar Helper Text / Context Indicator */}
              <div className="text-[11px] text-slate-400 font-mono mt-1 pl-1 flex justify-between items-center">
                <span>
                  {dashboardSubTab === "standard" 
                    ? "✓ Thống kê chu kỳ & công lao động cơ bản"
                    : dashboardSubTab === "scrap-quality" 
                      ? "⚡ Đã tích hợp 5 báo cáo dữ liệu chất lượng mới"
                      : "🔍 Phân tích xu hướng theo các khung thời gian"
                  }
                </span>
                <span className="text-slate-500 hidden sm:block">
                  Lọc hiện tại: {filterDivision === "ALL" ? "Toàn bộ phân xưởng" : filterDivision === "MLN" ? "Dây chuyền RO" : filterDivision === "RMA" ? "Dây chuyền RMA" : "Dây chuyền Bếp Ga"} — Năm {selectedYear}
                </span>
              </div>


              {dashboardSubTab === "standard" ? (
                <>
                  {/* COMPACT BENTO KPI CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* CARD 1: HOẠCH ĐỊNH KHSX THÁNG */}
                <div id="card-khsx" className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-600/5 rounded-full blur-xl group-hover:bg-rose-600/10 transition-all"></div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400 font-black uppercase tracking-wider">KHSX THÁNG {parseInt(formDate.split("-")[1])}</span>
                    <Layers className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white tracking-tight">{totalMonthlyPlanUnits.totalUnconverted.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 font-mono">SP</span>
                    <span className="text-sm text-slate-400 mx-1">/</span>
                    <span className="text-2xl font-bold text-white tracking-tight">{totalMonthlyPlanUnits.total.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 font-mono">SP quy đổi</span>
                  </div>
                  <div className="mt-2 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span className="text-slate-400">Target sản lượng chi nhánh</span>
                  </div>
                </div>

                {/* CARD 2: THỰC HIỆN LŨY KẾ THÁNG */}
                <div id="card-actual" className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-600/5 rounded-full blur-xl group-hover:bg-cyan-600/10 transition-all"></div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-cyan-400 font-black uppercase tracking-wider">LŨY KẾ THỰC HIỆN / TỔNG KẾ HOẠCH THÁNG {parseInt(formDate.split("-")[1])}</span>
                    <TrendingUp className="w-4 h-4 text-cyan-400 animate-pulse" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-cyan-400 tracking-tight">
                      {kpis.currentJulyEq.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">SP</span>
                    <span className="text-sm text-slate-400 mx-1">/</span>
                    <span className="text-2xl font-bold text-slate-200 tracking-tight">
                      {Math.round(totalMonthlyPlanUnits.total).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono ml-1">Kế hoạch</span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 font-mono">
                    (Thực tế chưa quy đổi: {kpis.currentJulyUnconverted.toLocaleString()} SP)
                  </div>
                  <div className="mt-2 text-xs flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                      Tiến độ đạt tháng
                    </span>
                    <span className="font-mono font-bold text-cyan-400">
                      {kpis.currentJulyCompletionRate}%
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 font-mono italic">
                    Công thức: (Thực hiện lũy kế / Tổng SP quy đổi KH) * 100
                  </div>
                </div>

                {/* CARD 3: BÁO CÁO DOANH THU OR COMBINED PRODUCTIVITY */}
                {filterDivision === "RMA" ? (
                  <div id="card-combined-productivity" className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/5 rounded-full blur-xl group-hover:bg-amber-600/10 transition-all"></div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-amber-400 font-black uppercase tracking-wider">NSLĐ GỘP (DCBG & DCRMA)</span>
                      <Users className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-amber-400 tracking-tight">
                      {kpis.combinedBgRmaLp}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-col gap-0.5">
                      <div>Sản lượng gộp: {kpis.combinedBgRmaEq.toLocaleString()} SP</div>
                      <div>Tổng công gộp: {kpis.combinedBgRmaMandays.toLocaleString()} công</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/50">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-mono italic">Mục tiêu: {kpis.monthTarget}%</span>
                        <div className={`w-2 h-2 rounded-full ${kpis.combinedBgRmaLp >= kpis.monthTarget ? "bg-emerald-500" : "bg-rose-500"} animate-pulse`}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div id="card-revenue" className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-full blur-xl group-hover:bg-emerald-600/10 transition-all"></div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-emerald-400 font-black uppercase tracking-wider">DOANH THU (KH VS THỰC)</span>
                      {isRevenueVisible ? (
                        <button onClick={() => {
                          setIsRevenueVisible(false);
                          setIsPasswordInputVisible(false);
                        }} className="cursor-pointer border-0 bg-transparent text-emerald-400 hover:text-emerald-300 transition-colors" title="Khóa bảng doanh thu">
                          <Unlock className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => {
                          setIsPasswordInputVisible(!isPasswordInputVisible);
                          setPasswordInput("");
                        }} className="cursor-pointer border-0 bg-transparent text-slate-500 hover:text-emerald-400 transition-colors" title="Mở khóa bảng doanh thu">
                          <Lock className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {isRevenueVisible ? (
                      <>
                        <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                          {kpis.actualRevenue.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">KH: {kpis.plannedRevenue.toLocaleString()}</div>
                        <div className="mt-2 text-xs flex items-center justify-between">
                          <span className="text-slate-400">Tỉ lệ hoàn thành</span>
                          <span className="font-mono font-bold text-emerald-400">
                              {kpis.plannedRevenue > 0 ? (Math.round((kpis.actualRevenue / kpis.plannedRevenue) * 100) || 0) : 0}%
                          </span>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-800/50 flex justify-end">
                          <button 
                            onClick={() => {
                              setIsRevenueVisible(false);
                              setIsPasswordInputVisible(false);
                            }}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-0"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Khóa lại</span>
                          </button>
                        </div>
                      </>
                    ) : isPasswordInputVisible ? (
                      <div className="flex flex-col items-center justify-center py-2 space-y-2">
                        <input
                          type="password"
                          placeholder="Nhập mật khẩu..."
                          className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          value={passwordInput}
                          onChange={(e) => {
                            setPasswordInput(e.target.value);
                            setRevenuePasswordError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (passwordInput === "SH2026") {
                                setIsRevenueVisible(true);
                                setIsPasswordInputVisible(false);
                                setRevenuePasswordError("");
                              } else {
                                setRevenuePasswordError("Mật khẩu không đúng!");
                              }
                            }
                          }}
                        />
                        {revenuePasswordError && (
                          <span className="text-[11px] text-rose-500 font-bold font-mono tracking-tight animate-bounce">
                            ⚠️ {revenuePasswordError}
                          </span>
                        )}
                        <button
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors border-0 cursor-pointer"
                          onClick={() => {
                            if (passwordInput === "SH2026") {
                              setIsRevenueVisible(true);
                              setIsPasswordInputVisible(false);
                              setRevenuePasswordError("");
                            } else {
                              setRevenuePasswordError("Mật khẩu không đúng!");
                            }
                          }}
                        >
                          Mở khóa
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex flex-col items-center justify-center py-2 opacity-60 cursor-pointer hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setIsPasswordInputVisible(!isPasswordInputVisible);
                          setPasswordInput("");
                          setRevenuePasswordError("");
                        }}
                      >
                        <Lock className="w-6 h-6 text-slate-500 mb-2 hover:text-emerald-400 transition-colors" />
                        <span className="text-xs text-slate-500">Dữ liệu bảo mật</span>
                      </div>
                    )}
                  </div>
                )}

                {/* CARD 4: HIỆU SUẤT TRUNG BÌNH */}
                <div id="card-efficiency" className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/5 rounded-full blur-xl group-hover:bg-amber-600/10 transition-all"></div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-amber-400 font-black uppercase tracking-wider">NSLĐ LŨY KẾ CẢ NĂM ({filterDivision === "ALL" ? "PHÂN XƯỞNG" : filterDivision})</span>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-bold tracking-tight ${kpis.avgLaborProductivity >= kpis.yearTarget ? "text-emerald-400" : "text-amber-400"}`}>
                      {kpis.avgLaborProductivity}%
                    </span>
                    <span className="text-xs text-slate-500 font-mono">/ mục tiêu {kpis.yearTarget}%</span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 font-mono italic">
                    Công thức: (Σ Sản phẩm Quy đổi / Σ Ngày công / 9.03) * 100 (Lũy kế)
                  </div>
                  <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                    <span>Trạng thái năm {selectedYear}</span>
                    <span className={`font-semibold font-mono text-[10px] uppercase border px-1.5 py-0.2 rounded ${
                      kpis.avgLaborProductivity >= kpis.yearTarget ? "text-emerald-400 bg-emerald-950 border-emerald-800" : "text-amber-400 bg-amber-950 border-amber-800"
                    }`}>
                      {kpis.avgLaborProductivity >= kpis.yearTarget ? "ĐẠT MỤC TIÊU" : "TIỆM CẬN MỤC TIÊU"}
                    </span>
                  </div>
                </div>

                {/* CARD 4.5: NSLĐ THÁNG */}
                <div id="card-efficiency-month" className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 rounded-full blur-xl group-hover:bg-orange-600/10 transition-all"></div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-orange-400 font-black uppercase tracking-wider">NSLĐ THÁNG {parseInt(formDate.split("-")[1])}</span>
                    <Activity className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-bold tracking-tight ${kpis.currentJulyProductivity >= kpis.monthTarget ? "text-emerald-400" : "text-orange-400"}`}>
                      {kpis.currentJulyProductivity}%
                    </span>
                    <span className="text-xs text-slate-500 font-mono">/ mục tiêu {kpis.monthTarget}%</span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 font-mono italic">
                    Công thức: (SP Quy đổi / Tổng Công / 9.03) * 100
                  </div>
                  <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                    <span>Trạng thái tháng</span>
                    <span className={`font-semibold font-mono text-[10px] uppercase border px-1.5 py-0.2 rounded ${
                      kpis.currentJulyProductivity >= kpis.monthTarget ? "text-emerald-400 bg-emerald-950 border-emerald-800" : "text-orange-400 bg-orange-950 border-orange-800"
                    }`}>
                      {kpis.currentJulyProductivity >= kpis.monthTarget ? "ĐẠT MỤC TIÊU" : "CHƯA ĐẠT"}
                    </span>
                  </div>
                </div>

                {/* CARD 5: TỔNG CÔNG THAO TÁC */}
                <div id="card-labor" className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full blur-xl group-hover:bg-indigo-600/10 transition-all"></div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-indigo-400 font-black uppercase tracking-wider">TỔNG CÔNG THAO TÁC (THÁNG)</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-indigo-400 tracking-tight">
                    {kpis.currentJulyMandays.toLocaleString()} <span className="text-sm font-normal text-slate-400">công</span>
                  </div>
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>• Chính thức</span>
                      <span className="font-mono text-slate-300">{kpis.currentJulyOfficial.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>• Thời vụ</span>
                      <span className="font-mono text-slate-300">{kpis.currentJulySeasonal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* VISUAL CHART REPLACEMENT */}
              <div className="bg-slate-900/30 rounded-xl border border-slate-800/60 p-6 h-[500px] flex flex-col">
                <div className="mb-6 shrink-0">
                  <h4 className="text-sm font-semibold text-white">Biểu đồ Tổng quan Thống kê Sản xuất</h4>
                  <p className="text-[11px] text-slate-400">Trực quan hóa sản lượng và năng suất theo tháng</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="99%" height="100%">
                    <ComposedChart data={displayMetrics} margin={{ top: 40, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickFormatter={(v) => `Tháng ${v}`} interval={0} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={11} domain={YAXIS_DOMAIN} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} domain={YAXIS_DOMAIN} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", color: "#f8fafc" }}
                    />
                    <Legend />
                    <Bar isAnimationActive={false} yAxisId="left" dataKey="actualProducts" name="Sản lượng thực tế" fill="#94a3b8" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="actualProducts" position="top" offset={3} fill="#94a3b8" fontSize={10} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? v : ''} />
                    </Bar>
                    <Bar isAnimationActive={false} yAxisId="left" dataKey="equivalentProducts" name="Sản lượng quy đổi" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="equivalentProducts" position="top" offset={3} fill="#3b82f6" fontSize={10} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? v : ''} />
                    </Bar>
                    <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="laborProductivityPercent" name="Năng Suất (%)" stroke="#f97316" strokeWidth={2}>
                      <LabelList dataKey="laborProductivityPercent" position="top" offset={10} fill="#f97316" fontSize={10} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? `${v}%` : ''} />
                    </Line>
                  </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* NEW CHART: OFFICIAL LABOR COMPARISON */}
              <div className="bg-slate-900/30 rounded-xl border border-slate-800/60 p-6 h-[550px] flex flex-col">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Biểu đồ So sánh NSLĐ</h4>
                    <p className="text-[11px] text-slate-400">So sánh năng suất lao động theo các mốc thời gian</p>
                  </div>
                  <select 
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-md px-2 py-1"
                    onChange={(e) => setLaborViewMode(e.target.value as any)}
                    value={laborViewMode}
                  >
                    <option value="daily">Hàng Ngày</option>
                    <option value="weekly">Hàng Tuần</option>
                    <option value="monthly">Hàng Tháng</option>
                    <option value="yearly">Hàng Năm</option>
                  </select>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="99%" height="100%">
                    <BarChart data={nsldComparisonData} margin={{ top: 40, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={13} fontWeight="medium" />
                    <YAxis stroke="#64748b" fontSize={13} tickFormatter={(v) => `${v}%`} domain={YAXIS_DOMAIN} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", color: "#f8fafc", fontSize: "14px", fontWeight: "bold" }}
                      itemStyle={{ fontSize: "14px" }}
                      formatter={(value: number) => [`${value}%`, "NSLĐ"]}
                    />
                    <Legend wrapperStyle={{ fontSize: "14px", fontWeight: "medium" }} />
                    <Bar isAnimationActive={false} dataKey="value" name="NSLĐ (%)" fill="#10b981" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="value" position="top" offset={5} fill="#10b981" fontSize={13} fontWeight="bold" formatter={(v: number) => v > 0 ? `${v}%` : ''} />
                    </Bar>
                  </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>


              {/* ACTIVE RECENT LOGS SECTION */}
              <div className="bg-slate-900/30 rounded-xl border border-slate-800/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Clock className="text-rose-500 w-4 h-4" />
                      Nhật Ký Ghi Nhận Ca Làm Việc Gần Nhất
                    </h4>
                    <p className="text-xs text-slate-400">Các ca sản xuất Máy lọc nước (MLN) & Bếp ga (BG) mới cập nhật</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("logging")}
                    className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Thêm nhật ký ca
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productionLogs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-900/60 leading-relaxed border border-slate-800 hover:border-slate-700 transition rounded-lg p-3.5 space-y-2 text-xs relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">{log.date} — {log.shift}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLog(log.date, log.shift);
                              }}
                              className="text-slate-500 hover:text-cyan-400 p-0.5 rounded"
                              title="Chỉnh sửa nhật ký này"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLog(log.id);
                              }}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded"
                              title="Xóa nhật ký này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <span className={`font-semibold px-2 py-0.2 rounded text-[10px] ${
                          log.productGroup === "MLN" ? "bg-cyan-940 text-cyan-400 border border-cyan-800" : "bg-orange-950 text-orange-400 border border-orange-850"
                        }`}>
                          {log.productGroup === "MLN" ? "DCRO" : log.productGroup === "RMA" ? "DCRMA" : "DCBG"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="font-semibold text-white">{log.productName}</div>
                        <div className="text-slate-450 text-[11px] font-mono">{log.lineName}</div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">Lắp ráp thực tế</span>
                          <span className="text-white font-bold block">{(log.actualUnits || 0)} cái (Quy đổi: {(log.equivalentProducts || 0)} SP)</span>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">NSLĐ Ca</span>
                          <span className={`font-mono font-bold ${Number(log.laborProductivityPercent) >= kpis.monthTarget ? "text-emerald-400" : "text-amber-400"}`}>
                            {(Number(log.laborProductivityPercent) || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono text-right mt-1 pt-1 border-t border-slate-850/50">
                        Technician: {log.technicianName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : dashboardSubTab === "scrap-quality" ? (
            <div className="space-y-6" id="quality-scrap-section">
              {/* QUẢN LÝ BIỆN PHÁP CẢNH BÁO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/30 p-4 rounded-xl border border-amber-900/40 flex items-start gap-3">
                  <div className="bg-amber-950 p-2 rounded-lg border border-amber-805 text-amber-500 shrink-0">
                    <Flame className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Tiêu Điểm Hàng Hỏng (Scrap)</span>
                    <h4 className="text-sm font-bold text-white">Tổn thất Tháng 3 đạt đỉnh (28.39tr VND)</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Do lỗi lắp họng bếp ga SHB5546 và nứt kính slim. Đã giao bộ phận Kỹ thuật IE khảo sát tiêu chuẩn ép kim loại.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/30 p-4 rounded-xl border border-cyan-900/30 flex items-start gap-3">
                  <div className="bg-cyan-950 p-2 rounded-lg border border-cyan-800 text-cyan-400 shrink-0">
                    <Award className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Tỉ Lệ Lỗi Thao Tác</span>
                    <h4 className="text-sm font-bold text-white">Mức lỗi thao tác T6 cực tốt (2.3%)</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Lịch trình đào tạo tay nghề lắp ráp giúp hạn chế lỗi thao tác lắp ro vỏ và dây đốt bếp đơn giảm về mức an toàn.
                    </p>
                  </div>
                </div>
              </div>

              {/* BIỂU ĐỒ TRỰC QUAN HÓA CHO DỮ LIỆU ĐÍNH KÈM */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recharts: Chi phí Hàng Hỏng (Scrap) - Tháng */}
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/60">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Theo Dõi Thiệt hại Giá Trị Hàng Hỏng Theo Tháng (Scrap Value)</h4>
                      <p className="text-xs text-slate-400">Thống kê giá trị tổn hao hàng hỏng của dây chuyền bám sát sổ sách theo từng tháng</p>
                    </div>
                    <span className="px-2.5 py-1 bg-rose-950 text-rose-450 text-[10px] font-mono border border-rose-800 rounded">
                      Monthly Scrap Metric
                    </span>
                  </div>
                  <div className="h-[380px]">
                    <ResponsiveContainer width="99%" height="100%">
                      <BarChart data={chartMonthlyScrap} margin={{ top: 40, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" tickFormatter={(v) => `Tháng ${v}`} fontSize={11} stroke="#64748b" interval={0} />
                        <YAxis tickFormatter={(v) => v ? `${(v / 1000000).toFixed(1)}M` : ''} fontSize={11} stroke="#64748b" domain={YAXIS_DOMAIN} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }}
                          formatter={(value: any) => [`${Number(value).toLocaleString()} VND`, "Giá trị hàng hỏng"]}
                        />
                        <Bar isAnimationActive={false} dataKey="scrapCost" name="Cước phí hỏng (VND)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={35}>
                          <LabelList dataKey="scrapCost" position="top" fill="#f43f5e" fontSize={10} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? `${(Number(v) / 1000000).toFixed(1)}M` : ''} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              
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
                        <XAxis dataKey="week" fontSize={11} stroke="#64748b" interval={0} />
                        <YAxis tickFormatter={(v) => v ? `${(v / 1000000).toFixed(1)}M` : ''} fontSize={11} stroke="#64748b" domain={YAXIS_DOMAIN} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }}
                          formatter={(value: any) => [`${Number(value).toLocaleString()} VND`, "Giá trị hàng hỏng"]}
                        />
                        <Bar isAnimationActive={false} dataKey="scrapCost" name="Cước phí hỏng (VND)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={18}>
                          <LabelList dataKey="scrapCost" position="top" fill="#f43f5e" fontSize={10} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? `${(Number(v) / 1000000).toFixed(1)}M` : ''} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              {/* LỖI THAO TÁC BIỂU ĐỒ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/60">
                  <h4 className="text-sm font-semibold text-white mb-2">Tỉ Lệ Lỗi Thao Tác DCLR Theo Tháng (%)</h4>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="99%" height="100%">
                      <LineChart data={displayMonthlyDclrError} margin={{ top: 40, right: 15, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" tickFormatter={(v) => `Tháng ${v}`} fontSize={11} stroke="#64748b" interval={0} />
                        <YAxis domain={YAXIS_DOMAIN} tickFormatter={(v) => `${v}%`} fontSize={11} stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }} />
                        <Line isAnimationActive={false} type="monotone" dataKey="errorRate" name="Tỉ lệ lỗi (%)" stroke="#fbbf24" strokeWidth={3} dot={{ r: 5, fill: "#fbbf24" }} activeDot={{ r: 7 }}>
                          <LabelList dataKey="errorRate" position="top" fill="#fbbf24" fontSize={10} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? `${v}%` : ''} />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/60">
                  <h4 className="text-sm font-semibold text-white mb-2">Tỉ Lệ Lỗi Thao Tác DCLR Theo Tuần (%)</h4>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="99%" height="100%">
                      <LineChart data={chartWeeklyDclrError} margin={{ top: 40, right: 15, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="week" fontSize={11} stroke="#64748b" interval={0} />
                        <YAxis domain={YAXIS_DOMAIN} tickFormatter={(v) => `${v}%`} fontSize={11} stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }} />
                        <Line isAnimationActive={false} type="monotone" dataKey="errorRate" name="Tỉ lệ lỗi (%)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 5, fill: "#f43f5e" }} activeDot={{ r: 7 }}>
                          <LabelList dataKey="errorRate" position="top" fill="#f43f5e" fontSize={10} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? `${v}%` : ''} />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* CHÍNH XÁC CÁC BẢNG TRÌNH BÀY SÁT BẢNG EXCEL TRONG ẢNH */}
              <div className="bg-slate-900/30 rounded-xl border border-slate-800/60 p-5 space-y-6">
                <div>
                  <div className="flex justify-between items-center">
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
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    * Lưu ý: Dữ liệu tuần ở 2 mục dưới đây là dữ liệu tuần theo năm và tính từ thứ 6 tuần này đến thứ 5 của tuần tiếp theo.
                  </p>
                </div>

                {/* BIỂU MẪU EXCEL 1 */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
                  <div className="bg-slate-900 px-4 py-2 border-b border-slate-850 text-xs font-bold text-white flex justify-between items-center">
                    <span className="text-rose-400 font-mono">I. BÁO CÁO HÀNG HỎNG SẢN XUẤT (VND LOSS)</span>
                    <span className="text-[10px] text-slate-500">Mã: IE-SCR-2026</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <tbody>
                        <tr key="scr-week-header" className="bg-slate-900/30 text-slate-400 font-semibold border-b border-slate-850 font-mono">
                          {displayWeeklyScrap.map(w => (
                            <td key={`tb2-w-${w.week}`} className="py-2.5 px-2 text-center border-l border-slate-850 font-semibold">{w.week}</td>
                          ))}
                        </tr>
                        <tr key="scr-week-values" className="border-b border-slate-850 text-slate-350 font-mono">
                          {displayWeeklyScrap.map((w, idx) => (
                            <td key={`tb2-wv-${w.week}`} className="py-1 px-1 border-l border-slate-850">
                              <input 
                                type="number" 
                                value={w.scrapCost === null || Number.isNaN(w.scrapCost) ? "" : w.scrapCost}
                                onChange={(e) => updateScrapMetric("weekly", w.week, e.target.value)}
                                className="w-full min-w-[70px] bg-transparent text-right outline-none p-1 rounded font-semibold text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:bg-slate-800/50 focus:bg-slate-800 focus:text-rose-400"
                                placeholder="—"
                              />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BIỂU MẪU EXCEL 2 */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
                  <div className="bg-slate-900 px-4 py-2 border-b border-slate-850 text-xs font-bold text-white flex justify-between items-center">
                    <span className="text-rose-400 font-mono">II. TỈ LỆ LỖI THAO TÁC SẢN XUẤT DCLR</span>
                    <span className="text-[10px] text-slate-500">Mã: IE-ERR-2026</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <tbody>
                        <tr key="err-week-header" className="bg-slate-900/30 text-slate-400 font-semibold border-b border-slate-850 font-mono">
                          {displayWeeklyDclrError.map(w => (
                            <td key={`tb3-w-${w.week}`} className="py-2.5 px-2 text-center border-l border-slate-850 font-semibold">{w.week}</td>
                          ))}
                        </tr>
                        <tr key="err-week-values" className="border-b border-slate-850 text-slate-350 font-mono">
                          {displayWeeklyDclrError.map((w, idx) => (
                            <td key={`tb3-wv-${w.week}`} className={`py-1 px-1 border-l border-slate-850 ${
                              w.errorRate === null ? "" :
                              w.errorRate > 3 ? "bg-rose-950/20" :
                              w.errorRate < 2 ? "bg-emerald-950/20" : ""
                            }`}>
                              <input 
                                type="number" 
                                step="0.1"
                                value={w.errorRate === null || Number.isNaN(w.errorRate) ? "" : w.errorRate}
                                onChange={(e) => updateDclrErrorMetric("weekly", w.week, e.target.value)}
                                className={`w-full min-w-[50px] bg-transparent text-center outline-none p-1 rounded font-semibold text-[11px] hover:bg-slate-800/50 focus:bg-slate-800 ${
                                  w.errorRate === null ? "text-slate-500" :
                                  w.errorRate > 3 ? "text-rose-450" : "text-emerald-400"
                                }`}
                                placeholder="—"
                              />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          ) : dashboardSubTab === "charts" ? (
            <div className="space-y-6" id="charts-section">
              <div className="bg-slate-900/30 rounded-xl border border-slate-800/60 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Phân tích Xu hướng Sản xuất & Năng suất
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      So sánh theo ngày, tuần, tháng và năm
                    </p>
                  </div>
                  <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 self-start">
                    {(["daily", "weekly", "monthly", "yearly"] as const).map((dim) => (
                      <button
                        key={dim}
                        onClick={() => setChartTimeDimension(dim)}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                          chartTimeDimension === dim
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        }`}
                      >
                        {dim === "daily" ? "Theo Ngày" : dim === "weekly" ? "Theo Tuần" : dim === "monthly" ? "Theo Tháng" : "Theo Năm"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[500px]">
                  <ResponsiveContainer width="99%" height="100%">
                    {chartTimeDimension === "monthly" ? (
                      <BarChart data={monthlyComparisonChartData} margin={{ top: 40, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} interval={0} />
                        <YAxis domain={YAXIS_DOMAIN} tickFormatter={(val) => `${val}%`} stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", color: "#f8fafc" }}
                          formatter={(value: any, name: any) => [`${value}%`, name === "productivity2025" ? "Năm 2025" : "Năm 2026"]}
                        />
                        <Legend formatter={(value: any) => value === "productivity2025" ? "2025" : "2026"} />
                        <Bar isAnimationActive={false} dataKey="productivity2025" name="Năm 2025" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                          <LabelList dataKey="productivity2025" position="top" fill="#3b82f6" fontSize={10} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? `${v}%` : ''} />
                        </Bar>
                        <Bar isAnimationActive={false} dataKey="productivity2026" name="Năm 2026" fill="#f97316" radius={[2, 2, 0, 0]}>
                          <LabelList dataKey="productivity2026" position="top" fill="#f97316" fontSize={10} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? `${v}%` : ''} />
                        </Bar>
                      </BarChart>
                    ) : chartTimeDimension === "yearly" ? (
                      <BarChart data={yearlyChartData} margin={{ top: 40, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                        <YAxis domain={YAXIS_DOMAIN} tickFormatter={(val) => `${val}%`} stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", color: "#f8fafc" }}
                          formatter={(value: any) => [`${value}%`, "Hiệu suất lao động"]}
                        />
                        <Bar isAnimationActive={false} dataKey="productivity" name="Hiệu suất lao động (%)" fill="#10b981" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="productivity" position="top" fill="#10b981" fontSize={10} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? `${v}%` : ''} />
                        </Bar>
                      </BarChart>
                    ) : (
                      <ComposedChart data={chartTimeDimension === "daily" ? dailyChartData : weeklyChartData} margin={{ top: 40, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey={chartTimeDimension === "daily" ? "date" : "week"} stroke="#64748b" fontSize={11} />
                        <YAxis yAxisId="left" stroke="#64748b" fontSize={11} domain={YAXIS_DOMAIN} />
                        <YAxis yAxisId="right" orientation="right" domain={YAXIS_DOMAIN} tickFormatter={(val) => `${val}%`} stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", color: "#f8fafc" }}
                          formatter={(value: any, name: any) => [name === "nsld" ? `${value}%` : value, name === "nsld" ? "Năng suất (%)" : "Sản lượng quy đổi"]}
                        />
                        <Legend formatter={(value: any) => value === "nsld" ? "Năng suất LĐ (%)" : "Sản lượng quy đổi"} />
                        <Bar isAnimationActive={false} yAxisId="left" dataKey="output" name="output" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                        <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="nsld" name="nsld" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "#020617" }} activeDot={{ r: 6 }} />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
  );
};
