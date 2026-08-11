import { DigitalClock } from "./src/appUtils";

import { SystemDataTab } from './src/components/SystemDataTab';
import { AnalyticsTab } from './src/components/AnalyticsTab';
import { HistoryDataTab } from './src/components/HistoryDataTab';
import { WeeklyReportTab } from './src/components/WeeklyReportTab';
import { ProductsTab } from './src/components/ProductsTab';
import { MonthlyPlanTab } from './src/components/MonthlyPlanTab';
import { LoggingTab } from './src/components/LoggingTab';
import { ImeiTrackingTab } from './src/components/ImeiTrackingTab';
import { DashboardTab } from './src/components/DashboardTab';
import { useState } from 'react';


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
  LabelList,
} from "recharts";
import {
  TrendingUp,
  Users,
  Award,
  Calendar,
  Layers,
  ChevronRight,
  Database,
  PlusCircle,
  Clock,
  Sparkles,
  Info,
  CheckCircle,
  RotateCcw,
  Sliders,
  Flame,
  Droplet,
  FileText,
  FileCheck,
  Building,
  ArrowRight,
  Calculator,
  FileSpreadsheet,
  Trash2,
  Edit,
  Pencil,
  X,
  Upload,
  Download,
  Check,
  AlertCircle,
  Zap,
  DollarSign,
  Activity,
  Lock,
  Unlock,
  History,
  ScanBarcode, Barcode, List, Search, Filter, Eye, RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
import {
  MonthlyMetric,
  ProductDefinition,
  ProductionLine,
  ProductionLog,
  ProductGroup,
  WeeklyAttendance,
  MonthlyScrapReport,
  WeeklyScrapReport,
  WeeklyDclreErrorRate,
  MonthlyDclreErrorRate,
  DailyReportRowGas,
  DailyReportRowAssembly,
  CombinedDailyReportRow,
} from "./types";
import {
  INDUSTRIAL_STANDARDS,
  SUNHOUSE_PRODUCTS,
  SUNHOUSE_LINES,
  HISTORICAL_2025,
  HISTORICAL_2026,
  CURRENT_STATE_SUMMARY,
  INITIAL_PRODUCTION_LOGS,
  WEEKLY_ATTENDANCE,
  MONTHLY_SCRAP_REPORT,
  WEEKLY_SCRAP_REPORT,
  WEEKLY_DCLR_ERROR_RATE,
  MONTHLY_DCLR_ERROR_RATE,
  INITIAL_GAS_DAILY_REPORTS,
  INITIAL_ASSEMBLY_DAILY_REPORTS,
} from "./data";

import { useAppLogic } from './src/useAppLogic';
export default function App() {
  const {
    showHeader,
    isScrolled,
    setActiveTab,
    activeTab,
    setFilterDivision,
    filterDivision,
    setSelectedYear,
    historyYear,
    setDashboardSubTab,
    dashboardSubTab,
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
    weeklyChartData,
    selectedDeclareDate,
    setSelectedDeclareDate,
    filteredDeclareProducts,
    selectedDeclareProductId,
    setSelectedDeclareProductId,
    declareImeiInput,
    setDeclareImeiInput,
    handleDeclareImeiSubmit,
    setImeiSubTab,
    imeiSubTab,
    scannedImeis,
    declaredImeis,
    filteredScannedImeis,
    imeiFilterDate,
    setImeiFilterDate,
    imeiSearchTerm,
    setImeiSearchTerm,
    products,
    deleteConfirmId,
    setScannedImeis,
    setDeleteConfirmId,
    filteredDeclaredImeis,
    declareFilterDate,
    setDeclareFilterDate,
    declareSearchTerm,
    setDeclareSearchTerm,
    deleteDeclareConfirmImei,
    setDeclaredImeis,
    setDeleteDeclareConfirmImei,
    comparisonRecords,
    setCompareStatusFilter,
    compareStatusFilter,
    filteredComparisonRecords,
    formMessage,
    handleAddLog,
    handleDateChange,
    formShift,
    handleShiftChange,
    formLineId,
    setFormLineId,
    formTechnician,
    setFormTechnician,
    newSlotInput,
    setNewSlotInput,
    handleAddSlot,
    scanInput,
    setScanInput,
    handleScanSubmit,
    formSlots,
    handleDeleteSlot,
    formModelItems,
    handleUpdateItem,
    handleUpdateItemHourly,
    getPrevDayLeftover,
    handleRemoveItem,
    handleAddNewItem,
    displayTotalActualQty,
    displayTotalPlanQty,
    displayTotalRemainingQty,
    displayTotalEqQty,
    formOfficialWorkersRO,
    formSeasonalWorkersRO,
    formAggregates,
    formOfficialWorkersRMA,
    formSeasonalWorkersRMA,
    formOfficialWorkersBG,
    formSeasonalWorkersBG,
    handleUpdateOfficialWorkerRO,
    formOfficialCountRO,
    handleUpdateSeasonalWorkerRO,
    formSeasonalCountRO,
    formWorkersCountRO,
    handleUpdateOfficialWorkerRMA,
    formOfficialCountRMA,
    handleUpdateSeasonalWorkerRMA,
    formSeasonalCountRMA,
    formWorkersCountRMA,
    handleUpdateOfficialWorkerBG,
    formOfficialCountBG,
    handleUpdateSeasonalWorkerBG,
    formSeasonalCountBG,
    formWorkersCountBG,
    formWorkersCount,
    formHourlyChartData,
    dailySummaries,
    setLoggingSubTab,
    loggingSubTab,
    recordsFilterDate,
    setRecordsFilterDate,
    logsDates,
    displayProductionLogs,
    hourlyChartData,
    displayDailySummaries,
    setFormDate,
    setFormModelItems,
    setFormMessage,
    setSelectedProductToAdd,
    setIsAddPlanModalOpen,
    handleExportMonthlyPlan,
    handleMonthlyPlanUpload,
    monthlyPlan,
    currentYearMonth,
    handleClearMonthlyPlanRow,
    setMonthlyPlan,
    setExecutionFilterType,
    executionFilterType,
    executionFilterDay,
    setExecutionFilterDay,
    executionFilterWeek,
    setExecutionFilterWeek,
    monthlyPlanExecution,
    setEditingProductId,
    setProdFormName,
    setProdFormCode,
    setProdFormGroup,
    setProdFormFactor,
    setProdFormPrice,
    setProdFormDescription,
    setProdFormMessage,
    handleExportProducts,
    handleExcelUpload,
    excelImportError,
    excelImportSuccess,
    parsedExcelProducts,
    handleCancelExcelImport,
    handleConfirmExcelImport,
    editingProductId,
    handleEditProductClick,
    handleDeleteProduct,
    prodFormMessage,
    handleSaveProduct,
    prodFormGroup,
    prodFormCode,
    prodFormName,
    prodFormFactor,
    prodFormPrice,
    prodFormDescription,
    handleCancelProductEdit,
    setSelectedReportWeek,
    selectedReportWeek,
    handleExportWeeklyExcel,
    weeklyReportData,
    setHistoryYear,
    metrics2025,
    processedMetrics2026,
    updateHistoryMetric,
    setFocusedField,
    simulatedHistoryMetrics,
    yearlyCumulativeCompareData,
    selectedTargetMonth,
    setSelectedTargetMonth,
    monthlyTargets,
    updateMonthlyTarget,
    setMonthlyTargets,
    handleTriggerAiAnalysis,
    isAiLoading,
    aiError,
    aiAnalysis,
    handleExportFullBackup,
    handleImportFullBackup,
    deletePlanModal,
    setDeletePlanModal,
    isAddPlanModalOpen,
    selectedProductToAdd,
    pendingPastDate,
    setPendingPastDate
  } = useAppLogic();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-rose-500/10 selection:text-rose-900 light-theme">
      {/* STICKY HEADER & NAVIGATION CONTAINER */}
      <div className={`sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl transition-transform duration-300 ${showHeader ? "translate-y-0" : "-translate-y-full"}`}>
        {/* HEADER BAR */}
        <header>
          <div className={`relative w-full max-w-[1800px] mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-4 transition-all duration-300 ${isScrolled ? "py-2 min-h-[56px]" : "py-3.5 min-h-[68px]"}`}>
            {/* Left: Date info & System Status (positioned absolute on md+ or simplified when scrolled, replacing brand identity) */}
            <div className={`flex items-center gap-3 transition-transform duration-300 md:absolute md:left-4 ${isScrolled ? "scale-95" : "scale-100"}`}>
              <div className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-300 font-mono flex items-center gap-2 shadow-inner text-xs">
                <Calendar className="w-4 h-4 text-rose-500" />
                <span className="font-bold">{(() => {
                  const d = new Date();
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}/${month}/${year}`;
                })()}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700 mx-1"></span>
                <DigitalClock />
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Hệ thống trực tuyến"></div>
            </div>

            {/* Center: Title */}
            <div className="text-center flex flex-col items-center justify-center max-w-xl md:max-w-2xl lg:max-w-4xl px-2 transition-all duration-300">
              <h1 className="text-lg md:text-2xl lg:text-3xl font-black tracking-wider text-white uppercase drop-shadow-md transition-transform duration-300">
                BÁO CÁO SẢN XUẤT PHÂN XƯỞNG LẮP RÁP NMBD
              </h1>
              {!isScrolled && (
                <p className="text-[11px] md:text-xs text-rose-500 font-bold mt-1 tracking-widest uppercase transition-opacity duration-300 animate-fadeIn">
                  Hệ thống Quản lý Hiệu suất & Kế hoạch Sản xuất MES
                </p>
              )}
            </div>
          </div>
        </header>

        {/* SUB-NAVIGATOR (TAB PANEL) */}
        <div className="bg-slate-950/20 border-t border-slate-800/40">
          <div className="w-full max-w-[1800px] mx-auto px-4 flex justify-between items-center overflow-x-auto">
            <div className={`flex gap-1 scrollbar-none transition-all duration-300 ${isScrolled ? "py-1" : "py-1.5"}`}>
              <button
                id="tab-dashboard"
                onClick={() => setActiveTab("dashboard")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-3.5 py-1.5 text-sm gap-2" : "px-5 py-2.5 text-sm gap-2.5"
                } ${
                  activeTab === "dashboard"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20 border border-rose-400 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent font-bold"
                }`}
              >
                <Database className={`transition-all duration-300 ${isScrolled ? "w-4.5 h-4.5" : "w-5 h-5"}`} />
                <span className="tracking-wide">Bảng Điều Hành (Dashboard)</span>
              </button>
              <button
                id="tab-logging"
                onClick={() => setActiveTab("logging")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-3.5 py-1.5 text-sm gap-2" : "px-5 py-2.5 text-sm gap-2.5"
                } ${
                  activeTab === "logging"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20 border border-rose-400 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent font-bold"
                }`}
              >
                <PlusCircle className={`transition-all duration-300 ${isScrolled ? "w-4.5 h-4.5" : "w-5 h-5"}`} />
                <span className="tracking-wide">Ghi Nhật Ký Ca</span>
              </button>
              <button
                id="tab-imei-tracking"
                onClick={() => setActiveTab("imei-tracking")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-3.5 py-1.5 text-sm gap-2" : "px-5 py-2.5 text-sm gap-2.5"
                } ${
                  activeTab === "imei-tracking"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20 border border-rose-400 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent font-bold"
                }`}
              >
                <Barcode className={`transition-all duration-300 ${isScrolled ? "w-4.5 h-4.5" : "w-5 h-5"}`} />
                <span className="tracking-wide">Theo Dõi IMEI</span>
              </button>
              <button
                id="tab-products"
                onClick={() => setActiveTab("products")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-3.5 py-1.5 text-sm gap-2" : "px-5 py-2.5 text-sm gap-2.5"
                } ${
                  activeTab === "products"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20 border border-rose-400 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent font-bold"
                }`}
              >
                <Sliders className={`transition-all duration-300 ${isScrolled ? "w-4.5 h-4.5" : "w-5 h-5"}`} />
                <span className="tracking-wide">Cấu Hình Sản Phẩm</span>
              </button>
              <button
                id="tab-monthly-plan"
                onClick={() => setActiveTab("monthly-plan")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-3.5 py-1.5 text-sm gap-2" : "px-5 py-2.5 text-sm gap-2.5"
                } ${
                  activeTab === "monthly-plan"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20 border border-rose-400 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent font-bold"
                }`}
              >
                <Calendar className={`transition-all duration-300 ${isScrolled ? "w-4.5 h-4.5" : "w-5 h-5"}`} />
                <span className="tracking-wide">KHSX Tháng</span>
              </button>
              <button
                id="tab-weekly-report"
                onClick={() => setActiveTab("weekly-report")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-3.5 py-1.5 text-sm gap-2" : "px-5 py-2.5 text-sm gap-2.5"
                } ${
                  activeTab === "weekly-report"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20 border border-rose-400 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent font-bold"
                }`}
              >
                <FileText className={`transition-all duration-300 ${isScrolled ? "w-4.5 h-4.5" : "w-5 h-5"}`} />
                <span className="tracking-wide">Báo cáo Tuần</span>
              </button>
              <button
                id="tab-history"
                onClick={() => setActiveTab("history-data")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-3.5 py-1.5 text-sm gap-2" : "px-5 py-2.5 text-sm gap-2.5"
                } ${
                  activeTab === "history-data"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20 border border-rose-400 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent font-bold"
                }`}
              >
                <History className={`transition-all duration-300 ${isScrolled ? "w-4.5 h-4.5" : "w-5 h-5"}`} />
                <span className="tracking-wide">Mục tiêu sản xuất năm 2026</span>
              </button>

              <button
                id="tab-system"
                onClick={() => setActiveTab("system-data")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-3.5 py-1.5 text-sm gap-2" : "px-5 py-2.5 text-sm gap-2.5"
                } ${
                  activeTab === "system-data"
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20 border border-amber-400 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent font-bold"
                }`}
              >
                <RefreshCw className={`transition-all duration-300 ${isScrolled ? "w-4.5 h-4.5" : "w-5 h-5"}`} />
                <span className="tracking-wide">Dữ liệu hệ thống</span>
              </button>
            </div>
            
            {/* Right: Interactive Filters (Division + Year) */}
            <div className="flex flex-wrap items-center gap-3 shrink-0 ml-4 py-1.5">
              {/* Division Selection (DCRO / DCBG) */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
                <span className="text-xs text-slate-400 font-black uppercase pl-2 hidden sm:inline">Bộ phận:</span>
                <button
                  id="filter-all"
                  onClick={() => setFilterDivision("ALL")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    filterDivision === "ALL" ? "bg-rose-600 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  id="filter-mln"
                  onClick={() => setFilterDivision("MLN")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                    filterDivision === "MLN" ? "bg-rose-600 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Droplet className="w-3.5 h-3.5 text-cyan-400" /> DCRO
                </button>
                <button
                  id="filter-rma"
                  onClick={() => setFilterDivision("RMA")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                    filterDivision === "RMA" ? "bg-rose-600 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-amber-400" /> DCRMA
                </button>
                <button
                  id="filter-bg"
                  onClick={() => setFilterDivision("BG")}
                  className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                    filterDivision === "BG" ? "bg-rose-600 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500" /> DCBG
                </button>
              </div>
              {/* Year Selection (2025 / 2026) */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
                <span className="text-xs text-slate-400 font-black uppercase pl-2 hidden sm:inline">Năm:</span>
                <button
                  id="year-2025"
                  onClick={() => setSelectedYear(2025)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    historyYear === 2025 ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  2025
                </button>
                <button
                  id="year-2026"
                  onClick={() => setSelectedYear(2026)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    historyYear === 2026 ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  2026
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* MAIN CONTENT SPACE */}
      <main className="w-full max-w-[1800px] mx-auto px-4 py-6">

        {/* ACTIVE TAB: DASHBOARD */}
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
    <DashboardTab
      setDashboardSubTab={setDashboardSubTab}
      dashboardSubTab={dashboardSubTab}
      filterDivision={filterDivision}
      selectedYear={selectedYear}
      formDate={formDate}
      totalMonthlyPlanUnits={totalMonthlyPlanUnits}
      kpis={kpis}
      isRevenueVisible={isRevenueVisible}
      setIsRevenueVisible={setIsRevenueVisible}
      setIsPasswordInputVisible={setIsPasswordInputVisible}
      isPasswordInputVisible={isPasswordInputVisible}
      setPasswordInput={setPasswordInput}
      passwordInput={passwordInput}
      setRevenuePasswordError={setRevenuePasswordError}
      revenuePasswordError={revenuePasswordError}
      displayMetrics={displayMetrics}
      setLaborViewMode={setLaborViewMode}
      laborViewMode={laborViewMode}
      nsldComparisonData={nsldComparisonData}
      setActiveTab={setActiveTab}
      productionLogs={productionLogs}
      handleEditLog={handleEditLog}
      handleDeleteLog={handleDeleteLog}
      chartMonthlyScrap={chartMonthlyScrap}
      chartWeeklyScrap={chartWeeklyScrap}
      displayMonthlyDclrError={displayMonthlyDclrError}
      chartWeeklyDclrError={chartWeeklyDclrError}
      scrapQualityMonth={scrapQualityMonth}
      setScrapQualityMonth={setScrapQualityMonth}
      displayWeeklyScrap={displayWeeklyScrap}
      updateScrapMetric={updateScrapMetric}
      displayWeeklyDclrError={displayWeeklyDclrError}
      updateDclrErrorMetric={updateDclrErrorMetric}
      setChartTimeDimension={setChartTimeDimension}
      chartTimeDimension={chartTimeDimension}
      monthlyComparisonChartData={monthlyComparisonChartData}
      yearlyChartData={yearlyChartData}
      dailyChartData={dailyChartData}
      weeklyChartData={weeklyChartData}
    />
  )}


          {/* ACTIVE TAB: LOGGING INPUT FORM */}
          
        {activeTab === "imei-tracking" && (
    <ImeiTrackingTab
      selectedDeclareDate={selectedDeclareDate}
      setSelectedDeclareDate={setSelectedDeclareDate}
      filteredDeclareProducts={filteredDeclareProducts}
      selectedDeclareProductId={selectedDeclareProductId}
      setSelectedDeclareProductId={setSelectedDeclareProductId}
      declareImeiInput={declareImeiInput}
      setDeclareImeiInput={setDeclareImeiInput}
      handleDeclareImeiSubmit={handleDeclareImeiSubmit}
      setImeiSubTab={setImeiSubTab}
      imeiSubTab={imeiSubTab}
      scannedImeis={scannedImeis}
      declaredImeis={declaredImeis}
      filteredScannedImeis={filteredScannedImeis}
      imeiFilterDate={imeiFilterDate}
      setImeiFilterDate={setImeiFilterDate}
      imeiSearchTerm={imeiSearchTerm}
      setImeiSearchTerm={setImeiSearchTerm}
      products={products}
      deleteConfirmId={deleteConfirmId}
      setScannedImeis={setScannedImeis}
      setDeleteConfirmId={setDeleteConfirmId}
      filteredDeclaredImeis={filteredDeclaredImeis}
      declareFilterDate={declareFilterDate}
      setDeclareFilterDate={setDeclareFilterDate}
      declareSearchTerm={declareSearchTerm}
      setDeclareSearchTerm={setDeclareSearchTerm}
      deleteDeclareConfirmImei={deleteDeclareConfirmImei}
      setDeclaredImeis={setDeclaredImeis}
      setDeleteDeclareConfirmImei={setDeleteDeclareConfirmImei}
      comparisonRecords={comparisonRecords}
      setCompareStatusFilter={setCompareStatusFilter}
      compareStatusFilter={compareStatusFilter}
      filteredComparisonRecords={filteredComparisonRecords}
    />
  )}

{activeTab === "logging" && (
    <LoggingTab
      formMessage={formMessage}
      handleAddLog={handleAddLog}
      formDate={formDate}
      handleDateChange={handleDateChange}
      formShift={formShift}
      handleShiftChange={handleShiftChange}
      formLineId={formLineId}
      setFormLineId={setFormLineId}
      formTechnician={formTechnician}
      setFormTechnician={setFormTechnician}
      newSlotInput={newSlotInput}
      setNewSlotInput={setNewSlotInput}
      handleAddSlot={handleAddSlot}
      scanInput={scanInput}
      setScanInput={setScanInput}
      handleScanSubmit={handleScanSubmit}
      formSlots={formSlots}
      handleDeleteSlot={handleDeleteSlot}
      formModelItems={formModelItems}
      filterDivision={filterDivision}
      products={products}
      handleUpdateItem={handleUpdateItem}
      handleUpdateItemHourly={handleUpdateItemHourly}
      getPrevDayLeftover={getPrevDayLeftover}
      handleRemoveItem={handleRemoveItem}
      handleAddNewItem={handleAddNewItem}
      displayTotalActualQty={displayTotalActualQty}
      displayTotalPlanQty={displayTotalPlanQty}
      displayTotalRemainingQty={displayTotalRemainingQty}
      displayTotalEqQty={displayTotalEqQty}
      formOfficialWorkersRO={formOfficialWorkersRO}
      formSeasonalWorkersRO={formSeasonalWorkersRO}
      formAggregates={formAggregates}
      formOfficialWorkersRMA={formOfficialWorkersRMA}
      formSeasonalWorkersRMA={formSeasonalWorkersRMA}
      formOfficialWorkersBG={formOfficialWorkersBG}
      formSeasonalWorkersBG={formSeasonalWorkersBG}
      handleUpdateOfficialWorkerRO={handleUpdateOfficialWorkerRO}
      formOfficialCountRO={formOfficialCountRO}
      handleUpdateSeasonalWorkerRO={handleUpdateSeasonalWorkerRO}
      formSeasonalCountRO={formSeasonalCountRO}
      formWorkersCountRO={formWorkersCountRO}
      handleUpdateOfficialWorkerRMA={handleUpdateOfficialWorkerRMA}
      formOfficialCountRMA={formOfficialCountRMA}
      handleUpdateSeasonalWorkerRMA={handleUpdateSeasonalWorkerRMA}
      formSeasonalCountRMA={formSeasonalCountRMA}
      formWorkersCountRMA={formWorkersCountRMA}
      handleUpdateOfficialWorkerBG={handleUpdateOfficialWorkerBG}
      formOfficialCountBG={formOfficialCountBG}
      handleUpdateSeasonalWorkerBG={handleUpdateSeasonalWorkerBG}
      formSeasonalCountBG={formSeasonalCountBG}
      formWorkersCountBG={formWorkersCountBG}
      formWorkersCount={formWorkersCount}
      formHourlyChartData={formHourlyChartData}
      kpis={kpis}
      productionLogs={productionLogs}
      dailySummaries={dailySummaries}
      setLoggingSubTab={setLoggingSubTab}
      loggingSubTab={loggingSubTab}
      recordsFilterDate={recordsFilterDate}
      setRecordsFilterDate={setRecordsFilterDate}
      logsDates={logsDates}
      setFilterDivision={setFilterDivision}
      displayProductionLogs={displayProductionLogs}
      handleEditLog={handleEditLog}
      handleDeleteLog={handleDeleteLog}
      hourlyChartData={hourlyChartData}
      displayDailySummaries={displayDailySummaries}
      setFormDate={setFormDate}
      setFormModelItems={setFormModelItems}
      setFormMessage={setFormMessage}
    />
  )}


          {/* ACTIVE TAB: MONTHLY PLAN */}
          {activeTab === "monthly-plan" && (
    <MonthlyPlanTab
      setSelectedProductToAdd={setSelectedProductToAdd}
      setIsAddPlanModalOpen={setIsAddPlanModalOpen}
      handleExportMonthlyPlan={handleExportMonthlyPlan}
      handleMonthlyPlanUpload={handleMonthlyPlanUpload}
      products={products}
      monthlyPlan={monthlyPlan}
      currentYearMonth={currentYearMonth}
      filterDivision={filterDivision}
      handleClearMonthlyPlanRow={handleClearMonthlyPlanRow}
      setMonthlyPlan={setMonthlyPlan}
      formDate={formDate}
      setExecutionFilterType={setExecutionFilterType}
      executionFilterType={executionFilterType}
      executionFilterDay={executionFilterDay}
      setExecutionFilterDay={setExecutionFilterDay}
      executionFilterWeek={executionFilterWeek}
      setExecutionFilterWeek={setExecutionFilterWeek}
      monthlyPlanExecution={monthlyPlanExecution}
    />
  )}

          {/* ACTIVE TAB: PRODUCT CONFIGURATION */}
          {activeTab === "products" && (
    <ProductsTab
      setEditingProductId={setEditingProductId}
      setProdFormName={setProdFormName}
      setProdFormCode={setProdFormCode}
      setProdFormGroup={setProdFormGroup}
      setProdFormFactor={setProdFormFactor}
      setProdFormPrice={setProdFormPrice}
      setProdFormDescription={setProdFormDescription}
      setProdFormMessage={setProdFormMessage}
      handleExportProducts={handleExportProducts}
      handleExcelUpload={handleExcelUpload}
      excelImportError={excelImportError}
      excelImportSuccess={excelImportSuccess}
      parsedExcelProducts={parsedExcelProducts}
      handleCancelExcelImport={handleCancelExcelImport}
      handleConfirmExcelImport={handleConfirmExcelImport}
      products={products}
      editingProductId={editingProductId}
      handleEditProductClick={handleEditProductClick}
      handleDeleteProduct={handleDeleteProduct}
      prodFormMessage={prodFormMessage}
      handleSaveProduct={handleSaveProduct}
      prodFormGroup={prodFormGroup}
      prodFormCode={prodFormCode}
      prodFormName={prodFormName}
      prodFormFactor={prodFormFactor}
      prodFormPrice={prodFormPrice}
      prodFormDescription={prodFormDescription}
      handleCancelProductEdit={handleCancelProductEdit}
    />
  )}


          {/* ACTIVE TAB: HISTORY DATA */}
          {activeTab === "weekly-report" && (
    <WeeklyReportTab
      setSelectedReportWeek={setSelectedReportWeek}
      selectedReportWeek={selectedReportWeek}
      selectedYear={selectedYear}
      handleExportWeeklyExcel={handleExportWeeklyExcel}
      weeklyReportData={weeklyReportData}
      filterDivision={filterDivision}
    />
  )}

          {activeTab === "history-data" && (
    <HistoryDataTab
      setHistoryYear={setHistoryYear}
      historyYear={historyYear}
      metrics2025={metrics2025}
      processedMetrics2026={processedMetrics2026}
      updateHistoryMetric={updateHistoryMetric}
      setFocusedField={setFocusedField}
      simulatedHistoryMetrics={simulatedHistoryMetrics}
      selectedYear={selectedYear}
      yearlyCumulativeCompareData={yearlyCumulativeCompareData}
      selectedTargetMonth={selectedTargetMonth}
      setSelectedTargetMonth={setSelectedTargetMonth}
      monthlyTargets={monthlyTargets}
      updateMonthlyTarget={updateMonthlyTarget}
      setMonthlyTargets={setMonthlyTargets}
    />
  )}

          {/* ACTIVE TAB: AI ADVISOR */}
          {activeTab === "analytics" && (
    <AnalyticsTab
      handleTriggerAiAnalysis={handleTriggerAiAnalysis}
      isAiLoading={isAiLoading}
      aiError={aiError}
      aiAnalysis={aiAnalysis}
    />
  )}

          {activeTab === "system-data" && (
    <SystemDataTab
      handleExportFullBackup={handleExportFullBackup}
      handleImportFullBackup={handleImportFullBackup}
    />
  )}
        </AnimatePresence>

      </main>

      {/* MODAL LỰA CHỌN XÓA KHSX THÁNG (2 PHƯƠNG ÁN) */}
      <AnimatePresence>
        {deletePlanModal && deletePlanModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm" id="delete-plan-modal-container">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
              id="delete-plan-modal"
            >
              <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider font-sans">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  Xử lý Kế hoạch sản xuất tháng
                </h3>
                <button
                  onClick={() => setDeletePlanModal(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                  id="btn-close-delete-modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Lựa chọn phương án xử lý cho mã hàng <strong className="text-rose-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{deletePlanModal.code}</strong>:
                </p>

                <div className="space-y-3 pt-1">
                  {/* Option 1: Xóa luôn KHSX tháng (loại bỏ khỏi bảng) */}
                  <button
                    onClick={() => {
                      const { prodId, code } = deletePlanModal;
                      setMonthlyPlan((prev) => {
                        const next = { ...prev };
                        if (next[currentYearMonth]) {
                          next[currentYearMonth] = { ...next[currentYearMonth] };
                          delete next[currentYearMonth][prodId];
                        }
                        return next;
                      });
                      setFormMessage(`❌ Đã loại bỏ mã hàng ${code} khỏi bảng Kế hoạch tháng.`);
                      setTimeout(() => setFormMessage(""), 2000);
                      setDeletePlanModal(null);
                    }}
                    className="w-full text-left p-3 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/50 hover:border-rose-800 rounded-lg transition group flex flex-col gap-1 cursor-pointer"
                    id="btn-option-delete-all"
                  >
                    <span className="font-bold text-rose-400 group-hover:text-rose-300 text-xs flex items-center gap-1.5">
                      Phương án 1: Xóa mã hàng khỏi bảng Kế hoạch tháng
                    </span>
                    <span className="text-[10px] text-rose-400/70 leading-normal font-sans">
                      Mã hàng sẽ bị loại bỏ khỏi bảng Kế hoạch tháng này (vẫn giữ lại trong danh mục cấu hình sản phẩm).
                    </span>
                  </button>

                  {/* Option 2: Chỉ xóa toàn bộ kế hoạch ngày (giữ lại dòng trong bảng) */}
                  <button
                    onClick={() => {
                      const { prodId, code } = deletePlanModal;
                      setMonthlyPlan((prev) => {
                        const next = { ...prev };
                        if (!next[currentYearMonth]) {
                          next[currentYearMonth] = {};
                        } else {
                          next[currentYearMonth] = { ...next[currentYearMonth] };
                        }
                        next[currentYearMonth][prodId] = {};
                        return next;
                      });
                      setFormMessage(`✅ Đã xóa trắng toàn bộ kế hoạch ngày của mã hàng ${code}`);
                      setTimeout(() => setFormMessage(""), 2000);
                      setDeletePlanModal(null);
                    }}
                    className="w-full text-left p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-lg transition group flex flex-col gap-1 cursor-pointer"
                    id="btn-option-clear-days"
                  >
                    <span className="font-bold text-slate-200 group-hover:text-white text-xs flex items-center gap-1.5">
                      Phương án 2: Chỉ xóa toàn bộ kế hoạch ngày
                    </span>
                    <span className="text-[10px] text-slate-400 leading-normal font-sans">
                      Giữ lại mã hàng trong danh sách, chỉ xóa trắng toàn bộ sản lượng kế hoạch của các ngày.
                    </span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 border-t border-slate-800/60 flex justify-end gap-2">
                <button
                  onClick={() => setDeletePlanModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded text-xs transition cursor-pointer"
                  id="btn-cancel-delete-modal"
                >
                  Hủy thao tác
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL THÊM KẾ HOẠCH SẢN XUẤT THÁNG TỪ CẤU HÌNH SẢN PHẨM */}
      <AnimatePresence>
        {isAddPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm" id="add-plan-modal-container">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
              id="add-plan-modal"
            >
              <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider font-sans">
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  Thêm mã hàng vào Kế hoạch tháng
                </h3>
                <button
                  onClick={() => setIsAddPlanModalOpen(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                  id="btn-close-add-modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Chọn sản phẩm từ danh mục cấu hình để đưa vào bảng lập kế hoạch sản xuất tháng:
                </p>

                {products.filter(p => (monthlyPlan[currentYearMonth]?.[p.id]) === undefined && (filterDivision === "ALL" || p.group === filterDivision)).length === 0 ? (
                  <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg text-center">
                    <p className="text-xs text-amber-400 font-sans">
                      🎉 Tất cả sản phẩm trong cấu hình đều đã có mặt trong Kế hoạch tháng!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Chọn sản phẩm</label>
                      <select
                        value={selectedProductToAdd}
                        onChange={(e) => setSelectedProductToAdd(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                        id="select-product-to-add"
                      >
                        <option value="">-- Chọn một mã hàng --</option>
                        {products
                          .filter(p => (monthlyPlan[currentYearMonth]?.[p.id]) === undefined && (filterDivision === "ALL" || p.group === filterDivision))
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.code} - {p.name} ({p.group})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => {
                          const unplanned = products.filter(p => (monthlyPlan[currentYearMonth]?.[p.id]) === undefined && (filterDivision === "ALL" || p.group === filterDivision));
                          if (unplanned.length === 0) return;
                          if (window.confirm(`Thêm nhanh toàn bộ ${unplanned.length} mã hàng chưa lập kế hoạch vào bảng KHSX tháng?`)) {
                            setMonthlyPlan(prev => {
                              const next = { ...prev };
                              if (!next[currentYearMonth]) next[currentYearMonth] = {};
                              unplanned.forEach(p => {
                                next[currentYearMonth][p.id] = {};
                              });
                              return next;
                            });
                            setFormMessage(`✅ Đã thêm tất cả mã hàng vào Kế hoạch tháng!`);
                            setTimeout(() => setFormMessage(""), 2000);
                            setIsAddPlanModalOpen(false);
                          }
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded text-xs font-semibold transition cursor-pointer text-center font-sans"
                        id="btn-add-all-unplanned"
                      >
                        Thêm nhanh tất cả ({products.filter(p => (monthlyPlan[currentYearMonth]?.[p.id]) === undefined).length})
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950/40 border-t border-slate-800/60 flex justify-end gap-2">
                <button
                  onClick={() => setIsAddPlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded text-xs transition cursor-pointer font-sans"
                  id="btn-cancel-add-modal"
                >
                  Đóng
                </button>
                {products.filter(p => (monthlyPlan[currentYearMonth]?.[p.id]) === undefined).length > 0 && (
                  <button
                    onClick={() => {
                      if (!selectedProductToAdd) return;
                      setMonthlyPlan(prev => {
                        const next = { ...prev };
                        if (!next[currentYearMonth]) next[currentYearMonth] = {};
                        next[currentYearMonth][selectedProductToAdd] = {};
                        return next;
                      });
                      const p = products.find(item => item.id === selectedProductToAdd);
                      setFormMessage(`✅ Đã thêm mã hàng ${p?.code || ""} vào Kế hoạch tháng!`);
                      setTimeout(() => setFormMessage(""), 2000);
                      setIsAddPlanModalOpen(false);
                      setSelectedProductToAdd("");
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition cursor-pointer font-sans"
                    disabled={!selectedProductToAdd}
                    id="btn-confirm-add-plan"
                  >
                    Thêm vào Kế Hoạch
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingPastDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              onClick={() => setPendingPastDate(null)}
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
                <span className="text-amber-400">⚠️</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Xác nhận ngày</h3>
              </div>

              <div className="p-5 text-slate-300 text-sm">
                Bạn đang chọn một ngày trong quá khứ (<strong className="text-amber-400">{pendingPastDate.split('-').reverse().join('/')}</strong>).<br /><br />
                Bạn có muốn bổ sung nhật ký ghi ca cho ngày này không?
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                <button
                  onClick={() => setPendingPastDate(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    setFormDate(pendingPastDate);
                    setPendingPastDate(null);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs transition cursor-pointer"
                >
                  Xác nhận bổ sung
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-500 mt-12">
        <div className="w-full max-w-[1800px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="font-bold text-white tracking-wider">SUNHOUSE GROUP MES</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Giải pháp tích hợp điều hành, số hóa bảng ghi và đánh giá năng suất lao động lũy kế của dây chuyền lắp ráp (DCLR) ngành Máy lọc nước RO & Bếp Gas gia dụng.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-slate-300 block uppercase font-mono text-[10px]">Quy ước kpi & IE tiêu chuẩn</span>
            <ul className="space-y-1 text-[11px]">
              <li>• Chu kỳ tiêu chuẩn: 9.03 sản phẩm quy đổi tính trên một người / ngày công.</li>
              <li>• KPI mục tiêu tối ưu hóa lao động: Năm đạt 110%. Tháng 7-12: DCRO 125%, DCBG 100%, Tổng Phân xưởng 121%.</li>
              <li>• Địa điểm: Nhà máy SUNHOUSE Bình Dương (DCLR NMBD).</li>
            </ul>
          </div>

          <div className="space-y-1.5 md:text-right">
            <span className="font-semibold text-slate-300 block uppercase font-mono text-[10px]">Thông báo hệ thống</span>
            <p className="text-[11px] leading-normal">
              Đồng bộ tự động theo thời gian hệ thống: <strong className="text-slate-300 font-mono">{formDate.split("-").reverse().join("/")}</strong>. <br />
              Đăng nhập bởi KSV trưởng: <strong className="text-rose-400 font-mono">nhatnm@sunhouse.com.vn</strong>. <br />
              Tất cả quyền dữ liệu được bảo vệ nghiêm ngặt.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );

}
