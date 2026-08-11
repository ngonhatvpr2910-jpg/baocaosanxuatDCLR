import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  MonthlyMetric, ProductDefinition, ProductionLine, ProductionLog, ProductGroup, WeeklyAttendance, MonthlyScrapReport, WeeklyScrapReport, WeeklyDclreErrorRate, MonthlyDclreErrorRate, DailyReportRowGas, DailyReportRowAssembly, CombinedDailyReportRow
} from './types';
import {
  INDUSTRIAL_STANDARDS, SUNHOUSE_PRODUCTS, SUNHOUSE_LINES, HISTORICAL_2025, HISTORICAL_2026, CURRENT_STATE_SUMMARY, INITIAL_PRODUCTION_LOGS, WEEKLY_ATTENDANCE, MONTHLY_SCRAP_REPORT, WEEKLY_SCRAP_REPORT, WEEKLY_DCLR_ERROR_RATE, MONTHLY_DCLR_ERROR_RATE, INITIAL_GAS_DAILY_REPORTS, INITIAL_ASSEMBLY_DAILY_REPORTS
} from './data';
import { getFridayToThursdayWeeksForMonth, getStandardYearWeeks, getYearWeeks, getWeeksInMonth, getShiftSlots, formatSlotLabel, getProductModelCode, FormModelItem } from './appUtils';

export const useAppLogic = () => {
const [isScrolled, setIsScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 40);
      
      // Only hide/show if scrolled enough to avoid jitter
      const delta = currentScrollY - lastScrollY.current;
      if (currentScrollY > 120) {
        if (delta > 20) {
          setShowHeader(false);
        } else if (delta < -20) {
          setShowHeader(true);
        }
      } else {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [laborViewMode, setLaborViewMode] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [filterDivision, setFilterDivision] = useState<ProductGroup | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<"dashboard" | "logging" | "monthly-plan" | "products" | "analytics" | "history-data" | "system-data" | "weekly-report">("dashboard");
  const [selectedReportWeek, setSelectedReportWeek] = useState<number>(() => {
    const now = new Date();
    const weeks = getYearWeeks(now.getFullYear());
    const dateStr = now.toISOString().split('T')[0];
    const currentWeek = weeks.find(w => w.days.some(d => d.dateStr === dateStr));
    return currentWeek ? currentWeek.id : 1;
  });
  const [isRevenueVisible, setIsRevenueVisible] = useState(false);
  const [isPasswordInputVisible, setIsPasswordInputVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [revenuePasswordError, setRevenuePasswordError] = useState("");
  const [dashboardSubTab, setDashboardSubTab] = useState<"standard" | "scrap-quality" | "charts">("standard");
  const [scrapQualityMonth, setScrapQualityMonth] = useState<number>(new Date().getMonth() + 1);
  const [chartTimeDimension, setChartTimeDimension] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [historyYear, setHistoryYear] = useState<2025 | 2026>(2025);
  const [focusedField, setFocusedField] = useState<{ month: number; year: number; field: string } | null>(null);
  const [executionFilterType, setExecutionFilterType] = useState<"MONTH" | "WEEK" | "DAY">("MONTH");
  const [executionFilterWeek, setExecutionFilterWeek] = useState<number>(1);
  const [executionFilterDay, setExecutionFilterDay] = useState<number>(() => {
    const today = new Date();
    return today.getDate();
  });

  // State cho Đặt mục tiêu NSLĐ và giả lập dữ liệu lịch sử
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("sunhouse_monthly_targets_v2");
    if (saved) return JSON.parse(saved);
    const defaults: Record<string, number> = {};
    for (const y of [2025, 2026]) {
      for (let m = 1; m <= 12; m++) {
        defaults[`${y}-${m}`] = 110;
      }
    }
    return defaults;
  });

  const [selectedTargetMonth, setSelectedTargetMonth] = useState<number>(1);

  const updateHistoryMetric = (year: 2025 | 2026, month: number, field: keyof MonthlyMetric, value: string) => {
    const numericValue = value === "" ? null : Number(value);
    
    const updateMetricsList = (prev: MonthlyMetric[]) => {
      return prev.map(m => {
        if (m.month === month) {
          const updatedItem = { ...m, [field]: numericValue };
          
          // Tự động tính toán NSLĐ (%) từ SP Quy đổi và Tổng Công (công thao tác)
          const eq = updatedItem.equivalentProducts;
          const mandays = updatedItem.productionMandays;
          
          if (eq !== null && mandays !== null && mandays > 0) {
            updatedItem.laborProductivityPercent = Number(((eq / mandays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(1));
          } else if (field === "equivalentProducts" || field === "productionMandays") {
            updatedItem.laborProductivityPercent = null;
          }
          return updatedItem;
        }
        return m;
      });
    };

    if (year === 2025) {
      setMetrics2025(prev => updateMetricsList(prev));
    } else {
      setMetrics2026(prev => updateMetricsList(prev));
    }
  };

  const updateMonthlyTarget = (year: number, month: number, targetValue: number) => {
    setMonthlyTargets(prev => ({
      ...prev,
      [`${year}-${month}`]: targetValue
    }));
  };

  const updateScrapMetric = (type: "monthly" | "weekly", identifier: number | string, value: string) => {
    const numericValue = value === "" ? null : Number(value);
    if (type === "monthly") {
      setMonthlyScrap(prev => {
        const next = [...prev];
        next[identifier as number] = { ...next[identifier as number], scrapCost: numericValue };
        return next;
      });
    } else {
      setWeeklyScrap(prev => {
        const next = [...prev];
        const idx = next.findIndex(w => w.week === identifier);
        if (idx !== -1) next[idx] = { ...next[idx], scrapCost: numericValue };
        return next;
      });
    }
  };

  const updateDclrErrorMetric = (type: "monthly" | "weekly", identifier: number | string, value: string) => {
    const numericValue = value === "" ? null : Number(value);
    if (type === "monthly") {
      setMonthlyDclrError(prev => {
        const next = [...prev];
        next[identifier as number] = { ...next[identifier as number], errorRate: numericValue };
        return next;
      });
    } else {
      setWeeklyDclrError(prev => {
        const next = [...prev];
        const idx = next.findIndex(w => w.week === identifier);
        if (idx !== -1) next[idx] = { ...next[idx], errorRate: numericValue };
        return next;
      });
    }
  };

  // Dữ liệu tháng (sao lưu trong localStorage để cho phép thêm bản ghi thực tế)
  const [metrics2025, setMetrics2025] = useState<MonthlyMetric[]>(() => {
    const saved = localStorage.getItem("sunhouse_metrics_2025_v2");
    return saved ? JSON.parse(saved) : HISTORICAL_2025;
  });

  const [metrics2026, setMetrics2026] = useState<MonthlyMetric[]>(() => {
    const saved = localStorage.getItem("sunhouse_metrics_2026_v2");
    return saved ? JSON.parse(saved) : HISTORICAL_2026;
  });

  const [monthlyScrap, setMonthlyScrap] = useState<MonthlyScrapReport[]>(() => {
    const saved = localStorage.getItem("sunhouse_monthly_scrap_v2");
    if (saved) return JSON.parse(saved);
    const initial = JSON.parse(JSON.stringify(MONTHLY_SCRAP_REPORT)) as MonthlyScrapReport[];
    initial[0].scrapCost = 7819247;
    initial[1].scrapCost = 7064628;
    initial[2].scrapCost = 28391248;
    initial[3].scrapCost = 17490855;
    initial[4].scrapCost = 10099929;
    initial[5].scrapCost = 5085125;
    return initial;
  });

  const [weeklyScrap, setWeeklyScrap] = useState<WeeklyScrapReport[]>(() => {
    const saved = localStorage.getItem("sunhouse_weekly_scrap_v2");
    let arr = saved ? JSON.parse(saved) : [];
    let full = Array.from({ length: 53 }).map((_, i) => ({ week: "W" + (1 + i), scrapCost: null }));
    arr.forEach(a => {
      const idx = full.findIndex(f => f.week === a.week);
      if (idx !== -1) full[idx].scrapCost = a.scrapCost;
    });
    if (!saved) {
      const d = [1820000, 2150000, 1480000, 3420000, 2900000, 1120000];
      d.forEach((v, i) => {
        const idx = full.findIndex(f => f.week === "W" + (23 + i));
        if (idx !== -1) full[idx].scrapCost = v;
      });
    }
    return full;
  });

  const [weeklyDclrError, setWeeklyDclrError] = useState<WeeklyDclreErrorRate[]>(() => {
    const saved = localStorage.getItem("sunhouse_weekly_dclr_error_v2");
    let arr = saved ? JSON.parse(saved) : [];
    let full = Array.from({ length: 53 }).map((_, i) => ({ week: "W" + (1 + i), errorRate: null }));
    arr.forEach(a => {
      const idx = full.findIndex(f => f.week === a.week);
      if (idx !== -1) full[idx].errorRate = a.errorRate;
    });
    return full;
  });

  const [monthlyDclrError, setMonthlyDclrError] = useState<MonthlyDclreErrorRate[]>(() => {
    const saved = localStorage.getItem("sunhouse_monthly_dclr_error_v2");
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(MONTHLY_DCLR_ERROR_RATE));
  });

  useEffect(() => {
    localStorage.setItem("sunhouse_monthly_scrap_v2", JSON.stringify(monthlyScrap));
  }, [monthlyScrap]);
  useEffect(() => {
    localStorage.setItem("sunhouse_weekly_scrap_v2", JSON.stringify(weeklyScrap));
  }, [weeklyScrap]);
  useEffect(() => {
    localStorage.setItem("sunhouse_weekly_dclr_error_v2", JSON.stringify(weeklyDclrError));
  }, [weeklyDclrError]);
  useEffect(() => {
    localStorage.setItem("sunhouse_monthly_dclr_error_v2", JSON.stringify(monthlyDclrError));
  }, [monthlyDclrError]);

  const [products, setProducts] = useState<ProductDefinition[]>(() => {
    const defaultProducts = SUNHOUSE_PRODUCTS.map(p => ({
      ...p,
      price: (p.price === null || Number.isNaN(Number(p.price))) ? (p.group === "MLN" ? 4500000 : 1800000) : Number(p.price)
    }));

    const saved = localStorage.getItem("sunhouse_products_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => ({
            ...p,
            price: (p.price === null || Number.isNaN(Number(p.price))) ? (p.group === "MLN" ? 4500000 : 1800000) : Number(p.price),
            factor: (p.factor === null || Number.isNaN(Number(p.factor))) ? 1 : Number(p.factor)
          }));
        }
      } catch (e) {
        // ignore
      }
    }
    return defaultProducts;
  });

  const [monthlyPlan, setMonthlyPlan] = useState<{ [yearMonth: string]: { [productId: string]: { [day: number]: number } } }>(() => {
    const saved = localStorage.getItem("sunhouse_monthly_plan_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Simple heuristic to check if it's the new format
        if (Object.keys(parsed).length > 0 && typeof Object.values(parsed)[0] === 'object' && !Array.isArray(Object.values(parsed)[0])) {
           // It might be the new format or old one. 
           // Old format: { [productId]: { [day]: number } }
           // New format: { [yearMonth]: { [productId]: { [day]: number } } }
           const firstVal = Object.values(parsed)[0];
           const keys = Object.keys(firstVal);
           if (keys.length > 0 && typeof Object.values(firstVal)[0] === 'object') {
             return parsed;
           }
        }
      } catch (e) {}
    }

    const today = new Date();
    const currentYearMonthStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0');
    const initial: { [yearMonth: string]: { [productId: string]: { [day: number]: number } } } = {
      [currentYearMonthStr]: {}
    };
    
    // No longer seeding data to avoid user confusion
    return initial;
  });

  useEffect(() => {
    localStorage.setItem("sunhouse_monthly_plan_v2", JSON.stringify(monthlyPlan));
  }, [monthlyPlan]);

  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>(() => {
    // Clear legacy storage keys
    localStorage.removeItem("sunhouse_production_logs");
    const saved = localStorage.getItem("sunhouse_production_logs_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ProductionLog[];
        return parsed.map(log => {
          const nameLower = (log.lineName || "").toLowerCase();
          if (nameLower.includes("mln") || nameLower.includes("lắp ráp ro") || nameLower.includes("dcro")) {
            return { ...log, lineName: "DCRO" };
          }
          if (nameLower.includes("kín ga") || nameLower.includes("bếp gas") || nameLower.includes("lr bg") || nameLower.includes("dcbg")) {
            return { ...log, lineName: "DCBG" };
          }
          return log;
        });
      } catch (e) {
        return INITIAL_PRODUCTION_LOGS;
      }
    }
    return INITIAL_PRODUCTION_LOGS;
  });

  useEffect(() => {
    localStorage.setItem("sunhouse_production_logs_v2", JSON.stringify(productionLogs));
  }, [productionLogs]);

  // Dữ liệu báo cáo chi tiết Excel cho 2 chuyền (Bếp Gas & Lắp ráp)
  const [gasDailyReports, setGasDailyReports] = useState<DailyReportRowGas[]>(() => {
    const saved = localStorage.getItem("sunhouse_gas_daily_reports_v2");
    return saved ? JSON.parse(saved) : INITIAL_GAS_DAILY_REPORTS;
  });

  const [assemblyDailyReports, setAssemblyDailyReports] = useState<DailyReportRowAssembly[]>(() => {
    const saved = localStorage.getItem("sunhouse_assembly_daily_reports_v2");
    return saved ? JSON.parse(saved) : INITIAL_ASSEMBLY_DAILY_REPORTS;
  });



  const [dailyReportsSubTab, setDailyReportsSubTab] = useState<"combined" | "gas" | "assembly">("combined");
  const [loggingSubTab, setLoggingSubTab] = useState<"records" | "hourly" | "daily">("records");
  const [recordsFilterDate, setRecordsFilterDate] = useState<string>("ALL");
  const [excelMessage, setExcelMessage] = useState<string>("");

  // === TRẠNG THÁI FORM CẬP NHẬT BÁO CÁO HÀNG NGÀY ===
  const [editorLine, setEditorLine] = useState<"gas" | "assembly">("gas");
  const [editorDate, setEditorDate] = useState<string>("12-Jun");
  
  // Các field của Gas Stove
  const [egGasStove, setEgGasStove] = useState<number>(4.0);
  const [egSeasonalGas, setEgSeasonalGas] = useState<number>(3.0);
  const [egRmaGas, setEgRmaGas] = useState<number>(8.0);
  const [egOutputStove, setEgOutputStove] = useState<number>(56);
  const [egOutputRma, setEgOutputRma] = useState<number>(42);
  const [egNhanSuLineGas, setEgNhanSuLineGas] = useState<number>(10);
  const [egNhanSuNghiGas, setEgNhanSuNghiGas] = useState<number>(1);

  // Các field của Assembly line
  const [egAssemblyChinh, setEgAssemblyChinh] = useState<number>(53.0);
  const [egAssemblyThoiVu, setEgAssemblyThoiVu] = useState<number>(16.0);
  const [egAssemblyOutputLine, setEgAssemblyOutputLine] = useState<number>(572);
  const [egAssemblyKhsx, setEgAssemblyKhsx] = useState<number>(738);
  const [egAssemblyNhanSuDiLam, setEgAssemblyNhanSuDiLam] = useState<number>(54);
  const [egAssemblyNhanSuNghi, setEgAssemblyNhanSuNghi] = useState<number>(3);

  // === TRẠNG THÁI CẤU HÌNH SẢN PHẨM ===
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodFormName, setProdFormName] = useState<string>("");
  const [prodFormCode, setProdFormCode] = useState<string>("");
  const [prodFormGroup, setProdFormGroup] = useState<ProductGroup>("MLN");
  const [prodFormFactor, setProdFormFactor] = useState<number>(1.0);
  const [prodFormPrice, setProdFormPrice] = useState<number>(2000000);
  const [prodFormDescription, setProdFormDescription] = useState<string>("");
  const [prodFormMessage, setProdFormMessage] = useState<string>("");

  // States cho Excel upload
  const [excelImportError, setExcelImportError] = useState<string>("");
  const [excelImportSuccess, setExcelImportSuccess] = useState<string>("");
  const [parsedExcelProducts, setParsedExcelProducts] = useState<ProductDefinition[]>([]);

  // Modal lựa chọn xóa KHSX tháng (2 phương án)
  const [deletePlanModal, setDeletePlanModal] = useState<{ isOpen: boolean; prodId: string; code: string } | null>(null);

  // Modal thêm kế hoạch sản xuất tháng từ cấu hình sản phẩm
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState<boolean>(false);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>("");

  // Auto đồng bộ form khi thay đổi Line & Ngày chọn
  useEffect(() => {
    if (editorLine === "gas") {
      const row = gasDailyReports.find((r) => r.date === editorDate);
      if (row) {
        setEgGasStove(Number(row.congGasStove || 0));
        setEgSeasonalGas(Number(row.congSeasonal || 0));
        setEgRmaGas(Number(row.congRma || 0));
        setEgOutputStove(Number(row.outputStove || 0));
        setEgOutputRma(Number(row.outputRma || 0));
        setEgNhanSuLineGas(Number(row.tongNhanSuLine || 0));
        setEgNhanSuNghiGas(Number(row.nhansuNghi || 0));
      }
    } else {
      const row = assemblyDailyReports.find((r) => r.date === editorDate);
      if (row) {
        setEgAssemblyChinh(Number(row.congChinhThuc || 0));
        setEgAssemblyThoiVu(Number(row.congThoiVu || 0));
        setEgAssemblyOutputLine(Number(row.outputLineChinh || 0));
        setEgAssemblyKhsx(Number(row.khsxNgay || 0));
        setEgAssemblyNhanSuDiLam(Number(row.tongNhanSuLineDiLam || 0));
        setEgAssemblyNhanSuNghi(Number(row.tongNhansuNghi || 0));
      }
    }
  }, [editorLine, editorDate, gasDailyReports, assemblyDailyReports]);

  // Trợ lý thông minh AI
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  // Điều khiển Form thêm nhật ký mới (Hỗ trợ Nhiều Model & Chia Khung giờ 2h/lần)
  const [formDate, setFormDate] = useState<string>(() => {
    const today = new Date();
    // Use local time instead of UTC to avoid timezone issues where it might be one day behind
    return today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
  });
  const [pendingPastDate, setPendingPastDate] = useState<string | null>(null);
  const currentYearMonth = useMemo(() => {
    const parts = formDate.split("-");
    return `${parts[0]}-${parts[1]}`;
  }, [formDate]);

  useEffect(() => {
    if (!formDate) return;
    const parts = formDate.split("-");
    if (parts.length < 3) return;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return;

    setExecutionFilterDay(day);

    const weeks = getYearWeeks(year);
    const matchedWeek = weeks.find(w => w.days.some(d => d.monthNum === month && d.dayNum === day));
    if (matchedWeek) {
      setExecutionFilterWeek(matchedWeek.id);
    }
  }, [formDate]);
  const [formLineId, setFormLineId] = useState<string>(SUNHOUSE_LINES[0].id);
  const [formShift, setFormShift] = useState<"Ca HC (08:00 - 17:00)" | "Ca HC (08:00 - 19h)" | "Ca HC (08:00 - 20h00)">("Ca HC (08:00 - 17:00)");
  const [formSlots, setFormSlots] = useState<string[]>(() => getShiftSlots("Ca HC (08:00 - 17:00)"));
  const [newSlotInput, setNewSlotInput] = useState<string>("20H - 21H");
  const [scanInput, setScanInput] = useState<string>("");

  interface ScannedImei {
    id: string;
    imei: string;
    productId: string;
    timestamp: string;
    slot: string;
  }

  interface DeclaredImei { imei: string; productId: string; date: string; }
  const [declaredImeis, setDeclaredImeis] = useState<DeclaredImei[]>(() => {
    const saved = localStorage.getItem("sunhouse_declared_imeis");
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    return [];
  });
  useEffect(() => {
    localStorage.setItem("sunhouse_declared_imeis", JSON.stringify(declaredImeis));
  }, [declaredImeis]);

  const [scannedImeis, setScannedImeis] = useState<ScannedImei[]>(() => {
    const saved = localStorage.getItem("sunhouse_scanned_imeis");
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          return parsed.filter((item: any) => new Date(item.timestamp).getTime() > thirtyDaysAgo);
        }
      } catch(e){}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("sunhouse_scanned_imeis", JSON.stringify(scannedImeis));
  }, [scannedImeis]);

  const [imeiSearchTerm, setImeiSearchTerm] = useState("");
  const [imeiFilterDate, setImeiFilterDate] = useState(new Date().toISOString().slice(0, 10));
  
  // NEW Sub-tab & filtering states for IMEI Tracking
  const [imeiSubTab, setImeiSubTab] = useState<"scanned" | "declared" | "compare">("scanned");
  const [declareSearchTerm, setDeclareSearchTerm] = useState("");
  const [declareFilterDate, setDeclareFilterDate] = useState(new Date().toISOString().slice(0, 10));
  const [compareStatusFilter, setCompareStatusFilter] = useState<"all" | "matched" | "missing" | "un-declared">("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteDeclareConfirmImei, setDeleteDeclareConfirmImei] = useState<string | null>(null);
  const [declareImeiInput, setDeclareImeiInput] = useState("");
  const [selectedDeclareDate, setSelectedDeclareDate] = useState(formDate);
  const [selectedDeclareProductId, setSelectedDeclareProductId] = useState("");

  const filteredDeclareProducts = useMemo(() => {
    if (!selectedDeclareDate) return [];
    const dateParts = selectedDeclareDate.split("-");
    if (dateParts.length < 3) return [];
    const ym = `${dateParts[0]}-${dateParts[1]}`;
    const dNum = parseInt(dateParts[2], 10);
    
    return products.filter(p => {
      const plan = monthlyPlan[ym]?.[p.id]?.[dNum] || 0;
      return plan > 0;
    });
  }, [selectedDeclareDate, monthlyPlan, products]);

  useEffect(() => {
    if (filteredDeclareProducts.length > 0) {
      if (!selectedDeclareProductId || !filteredDeclareProducts.find(p => p.id === selectedDeclareProductId)) {
        setSelectedDeclareProductId(filteredDeclareProducts[0].id);
      }
    } else {
      setSelectedDeclareProductId("");
    }
  }, [filteredDeclareProducts, selectedDeclareProductId]);

  const filteredScannedImeis = useMemo(() => {
    let filtered = scannedImeis;
    if (imeiFilterDate) {
      filtered = filtered.filter(item => {
        try {
          return new Date(item.timestamp).toISOString().slice(0, 10) === imeiFilterDate;
        } catch (e) {
          return false;
        }
      });
    }
    if (imeiSearchTerm) {
      const searchLower = imeiSearchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const prod = products.find(p => p.id === item.productId);
        return item.imei.toLowerCase().includes(searchLower) ||
               (prod && prod.code.toLowerCase().includes(searchLower)) ||
               (prod && prod.name.toLowerCase().includes(searchLower));
      });
    }
    return filtered;
  }, [scannedImeis, imeiSearchTerm, imeiFilterDate, products]);

  const filteredDeclaredImeis = useMemo(() => {
    let filtered = declaredImeis;
    if (declareFilterDate) {
      filtered = filtered.filter(item => item.date === declareFilterDate);
    }
    if (declareSearchTerm) {
      const searchLower = declareSearchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const prod = products.find(p => p.id === item.productId);
        return item.imei.toLowerCase().includes(searchLower) ||
               (prod && prod.code.toLowerCase().includes(searchLower)) ||
               (prod && prod.name.toLowerCase().includes(searchLower));
      });
    }
    return filtered;
  }, [declaredImeis, declareSearchTerm, declareFilterDate, products]);

  interface ComparisonRecord {
    imei: string;
    productId: string;
    declareDate?: string;
    scanTimestamp?: string;
    scanSlot?: string;
    status: "matched" | "missing" | "un-declared";
  }

  const comparisonRecords = useMemo(() => {
    const allImeiMap = new Map<string, ComparisonRecord>();

    declaredImeis.forEach(d => {
      allImeiMap.set(d.imei, {
        imei: d.imei,
        productId: d.productId,
        declareDate: d.date,
        status: "missing"
      });
    });

    scannedImeis.forEach(s => {
      const existing = allImeiMap.get(s.imei);
      if (existing) {
        existing.scanTimestamp = s.timestamp;
        existing.scanSlot = s.slot;
        existing.status = "matched";
      } else {
        allImeiMap.set(s.imei, {
          imei: s.imei,
          productId: s.productId,
          scanTimestamp: s.timestamp,
          scanSlot: s.slot,
          status: "un-declared"
        });
      }
    });

    return Array.from(allImeiMap.values());
  }, [declaredImeis, scannedImeis]);

  const filteredComparisonRecords = useMemo(() => {
    let records = comparisonRecords;
    
    if (imeiFilterDate) {
      records = records.filter(r => {
        if (r.declareDate === imeiFilterDate) return true;
        if (r.scanTimestamp) {
          try {
            return new Date(r.scanTimestamp).toISOString().slice(0, 10) === imeiFilterDate;
          } catch (e) {}
        }
        return false;
      });
    }
    
    if (compareStatusFilter !== "all") {
      records = records.filter(r => r.status === compareStatusFilter);
    }
    
    if (imeiSearchTerm) {
      const searchLower = imeiSearchTerm.toLowerCase();
      records = records.filter(r => {
        const prod = products.find(p => p.id === r.productId);
        return r.imei.toLowerCase().includes(searchLower) ||
               (prod && prod.code.toLowerCase().includes(searchLower)) ||
               (prod && prod.name.toLowerCase().includes(searchLower));
      });
    }
    
    return records;
  }, [comparisonRecords, imeiFilterDate, compareStatusFilter, imeiSearchTerm, products]);



  const handleScanSubmit = (scannedValue?: any) => {
    let val = scanInput;
    if (typeof scannedValue === 'string') {
      val = scannedValue;
    }
    if (!val || typeof val !== 'string' || !val.trim()) return;
    
    const currentHour = new Date().getHours();
    let currentSlot = `${currentHour}H - ${currentHour + 1}H`;
    
    if (formSlots && !formSlots.includes(currentSlot)) {
      const availableHours = formSlots.map(s => parseInt((s || "").split("H")[0])).filter(h => !isNaN(h));
      const closestPastHour = availableHours.slice().reverse().find(h => h <= currentHour) || availableHours[0];
      if (closestPastHour !== undefined) {
         currentSlot = formSlots.find(s => s.startsWith(`${closestPastHour}H`)) || formSlots[0];
      }
      if (!currentSlot) {
        setFormMessage(`❌ Không tìm thấy khung giờ phù hợp để ghi nhận.`);
        setScanInput("");
        return;
      }
    }
    
    
    // --- AUTO-DETECT MODEL FROM DECLARED IMEIS ---
    const declaration = declaredImeis.find(d => d.imei === val && d.date === formDate);
    if (!declaration) {
      setFormMessage(`❌ IMEI ${val} chưa được khai báo cho KHSX ngày ${formDate}.`);
      setScanInput("");
      return;
    }
    const targetModelId = declaration.productId;

    // --- CHECK KHSX PLAN ---
    const dateParts = formDate.split("-");
    const checkYearMonth = `${dateParts[0]}-${dateParts[1]}`;
    const checkDay = parseInt(dateParts[2], 10);
    const planForToday = monthlyPlan[checkYearMonth]?.[targetModelId]?.[checkDay] || 0;

    if (planForToday <= 0) {
      setFormMessage(`❌ Mã hàng này chưa có Kế Hoạch Sản Xuất cho ngày ${formDate}. Không thể quét.`);
      setScanInput("");
      return;
    }

    // Count already scanned today for this targetModelId
    const scannedTodayCount = scannedImeis.filter(item => {
      if (item.productId !== targetModelId) return false;
      try {
        const d = new Date(item.timestamp);
        const itemDateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
        return itemDateStr === formDate;
      } catch(e) {
        return false;
      }
    }).length;

    if (scannedTodayCount >= planForToday) {
      setFormMessage(`❌ Đã đủ KHSX cho model này (${scannedTodayCount}/${planForToday}). Không thể quét thêm.`);
      setScanInput("");
      return;
    }

    // --- CHECK DUPLICATE SCANNED IMEI ---
    const isAlreadyScanned = scannedImeis.some(s => s.imei === val);
    if (isAlreadyScanned) {
      setFormMessage(`❌ IMEI ${val} đã được quét thành công trước đó (trùng lặp).`);
      setScanInput("");
      return;
    }
    
    // ------------------

    let updatedItems = [...formModelItems];
    let itemIndex = updatedItems.findIndex(m => m.productId === targetModelId);
    
    if (itemIndex === -1) {
      // Auto-add model to form if not exists
      const newRow: FormModelItem = {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: targetModelId,
        dailyPlan: planForToday,
        hourlyActuals: {}
      };
      updatedItems.push(newRow);
      itemIndex = updatedItems.length - 1;
    }
    
    const existingActuals = updatedItems[itemIndex].hourlyActuals || {};
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      hourlyActuals: { ...existingActuals }
    };
    const currentQty = parseInt(updatedItems[itemIndex].hourlyActuals[currentSlot] as any) || 0;
    updatedItems[itemIndex].hourlyActuals[currentSlot] = currentQty + 1;
    
    setFormModelItems(updatedItems);
    
    const newImei: ScannedImei = {
      id: `imei-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
      imei: val,
      productId: targetModelId,
      timestamp: new Date().toISOString(),
      slot: currentSlot
    };
    setScannedImeis(prev => [newImei, ...prev]);

    setFormMessage(`✅ Đã ghi nhận +1 sản phẩm cho khung giờ ${currentSlot} (Mã quét: ${val})`);
    setScanInput("");
  };

  const handleDeclareImeiSubmit = (val: string) => {
    const trimmed = val.trim().toUpperCase();
    if (!trimmed) return;
    
    const date = selectedDeclareDate;
    const productId = selectedDeclareProductId;
    if (!date || !productId) {
      alert('Vui lòng chọn ngày và sản phẩm (có kế hoạch sản xuất) trước khi quét!');
      return;
    }

    // --- CHECK KHSX PLAN ---
    const dateParts = date.split("-");
    const ym = `${dateParts[0]}-${dateParts[1]}`;
    const dNum = parseInt(dateParts[2], 10);
    const planLimit = monthlyPlan[ym]?.[productId]?.[dNum] || 0;

    const currentCount = declaredImeis.filter(d => d.productId === productId && d.date === date).length;

    if (planLimit <= 0) {
      alert(`❌ Mã hàng này chưa có Kế Hoạch Sản Xuất cho ngày ${date}. Không thể khai báo.`);
      return;
    }

    if (currentCount >= planLimit) {
      alert(`❌ Đã đạt giới hạn khai báo KHSX (${currentCount}/${planLimit}) cho model này ngày ${date}. Không thể khai báo thêm.`);
      return;
    }
    
    const newDecl = { imei: trimmed, productId, date };
    let isDuplicate = false;
    
    setDeclaredImeis(prev => {
      const exists = prev.some(p => p.imei === trimmed);
      if (exists) {
        isDuplicate = true;
        return prev;
      }
      return [newDecl, ...prev];
    });
    
    if (isDuplicate) {
      alert(`❌ IMEI ${trimmed} đã được khai báo trước đó! Không thể khai báo lại.`);
      setDeclareImeiInput('');
      return;
    }
    
    setDeclareImeiInput('');
    
    // Switch to declared tab and sync date filter to show the new record directly
    setImeiSubTab("declared");
    setDeclareFilterDate(date);
    
    // Highlight the scan was successful
    const scanInputEl = document.getElementById('declareImeiInputEl');
    if (scanInputEl) {
      scanInputEl.classList.add('bg-emerald-900/50');
      setTimeout(() => {
        scanInputEl.classList.remove('bg-emerald-900/50');
      }, 300);
    }
  };

  const [formOfficialWorkersRO, setFormOfficialWorkersRO] = useState<{ [slotName: string]: number }>({
    "8H - 9H": 0,
    "9H - 10H": 0,
    "10H - 11H": 0,
    "11H - 12H": 0,
    "13H - 14H": 0,
    "14H - 15H": 0,
    "15H - 16H": 0,
    "16H - 17H": 0,
    "17H - 18H": 0,
    "18H - 19H": 0,
    "19H - 20H": 0,
  });
  const [formSeasonalWorkersRO, setFormSeasonalWorkersRO] = useState<{ [slotName: string]: number }>({
    "8H - 9H": 0,
    "9H - 10H": 0,
    "10H - 11H": 0,
    "11H - 12H": 0,
    "13H - 14H": 0,
    "14H - 15H": 0,
    "15H - 16H": 0,
    "16H - 17H": 0,
    "17H - 18H": 0,
    "18H - 19H": 0,
    "19H - 20H": 0,
  });
  const [formOfficialWorkersRMA, setFormOfficialWorkersRMA] = useState<{ [slotName: string]: number }>({
    "8H - 9H": 0,
    "9H - 10H": 0,
    "10H - 11H": 0,
    "11H - 12H": 0,
    "13H - 14H": 0,
    "14H - 15H": 0,
    "15H - 16H": 0,
    "16H - 17H": 0,
    "17H - 18H": 0,
    "18H - 19H": 0,
    "19H - 20H": 0,
  });
  const [formSeasonalWorkersRMA, setFormSeasonalWorkersRMA] = useState<{ [slotName: string]: number }>({
    "8H - 9H": 0,
    "9H - 10H": 0,
    "10H - 11H": 0,
    "11H - 12H": 0,
    "13H - 14H": 0,
    "14H - 15H": 0,
    "15H - 16H": 0,
    "16H - 17H": 0,
    "17H - 18H": 0,
    "18H - 19H": 0,
    "19H - 20H": 0,
  });
  const [formOfficialWorkersBG, setFormOfficialWorkersBG] = useState<{ [slotName: string]: number }>({
    "8H - 9H": 0,
    "9H - 10H": 0,
    "10H - 11H": 0,
    "11H - 12H": 0,
    "13H - 14H": 0,
    "14H - 15H": 0,
    "15H - 16H": 0,
    "16H - 17H": 0,
    "17H - 18H": 0,
    "18H - 19H": 0,
    "19H - 20H": 0,
  });
  const [formSeasonalWorkersBG, setFormSeasonalWorkersBG] = useState<{ [slotName: string]: number }>({
    "8H - 9H": 0,
    "9H - 10H": 0,
    "10H - 11H": 0,
    "11H - 12H": 0,
    "13H - 14H": 0,
    "14H - 15H": 0,
    "15H - 16H": 0,
    "16H - 17H": 0,
    "17H - 18H": 0,
    "18H - 19H": 0,
    "19H - 20H": 0,
  });

  // calculate hourly workers for RO and BG
  const formHourlyWorkersRO = useMemo(() => {
    const hw: { [slot: string]: number } = {};
    formSlots.forEach((s) => {
      hw[s] = (formOfficialWorkersRO[s] || 0) + (formSeasonalWorkersRO[s] || 0);
    });
    return hw;
  }, [formOfficialWorkersRO, formSeasonalWorkersRO, formSlots]);

  const formHourlyWorkersBG = useMemo(() => {
    const hw: { [slot: string]: number } = {};
    formSlots.forEach((s) => {
      hw[s] = (formOfficialWorkersBG[s] || 0) + (formSeasonalWorkersBG[s] || 0);
    });
    return hw;
  }, [formOfficialWorkersBG, formSeasonalWorkersBG, formSlots]);

  const formHourlyWorkersRMA = useMemo(() => {
    const hw: { [slot: string]: number } = {};
    formSlots.forEach((s) => {
      hw[s] = (formOfficialWorkersRMA[s] || 0) + (formSeasonalWorkersRMA[s] || 0);
    });
    return hw;
  }, [formOfficialWorkersRMA, formSeasonalWorkersRMA, formSlots]);

  // calculate combined formHourlyWorkers dynamically
  const formHourlyWorkers = useMemo(() => {
    const hw: { [slot: string]: number } = {};
    formSlots.forEach((s) => {
      hw[s] = (formHourlyWorkersRO[s] || 0) + (formHourlyWorkersBG[s] || 0) + (formHourlyWorkersRMA[s] || 0);
    });
    return hw;
  }, [formHourlyWorkersRO, formHourlyWorkersBG, formHourlyWorkersRMA, formSlots]);

  const [formModelItems, setFormModelItems] = useState<FormModelItem[]>(() => [
    {
      id: "item-init",
      productId: "mln-01",
      dailyPlan: 0,
      hourlyActuals: {
        "8H - 9H": 0,
        "9H - 10H": 0,
        "10H - 11H": 0,
        "11H - 12H": 0,
        "13H - 14H": 0,
        "14H - 15H": 0,
        "15H - 16H": 0,
        "16H - 17H": 0,
      }
    }
  ]);

  const {
    formOfficialCountRO,
    formSeasonalCountRO,
    formWorkersCountRO,
    formOfficialCountRMA,
    formSeasonalCountRMA,
    formWorkersCountRMA,
    formOfficialCountBG,
    formSeasonalCountBG,
    formWorkersCountBG,
    formWorkersCount
  } = useMemo(() => {
    let offRO = 0;
    let seasRO = 0;
    let offRMA = 0;
    let seasRMA = 0;
    let offBG = 0;
    let seasBG = 0;

    formSlots.forEach(slot => {
      // Tính cho RO & RMA (MLN Group)
      let sumEqRO = 0;
      let sumEqRMA = 0;
      
      formModelItems.forEach(item => {
        const p = products.find(x => x.id === item.productId) || products[0];
        if (!p) return;
        if (p.group === "RMA") {
          sumEqRMA += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
        } else if (p.group === "MLN") {
          // Check for RMA keyword in name or code
          const isRMA = p.name.toLowerCase().includes("rma") || p.code.toLowerCase().includes("rma") || p.id.toLowerCase().includes("rma");
          if (isRMA) {
            sumEqRMA += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
          } else {
            sumEqRO += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
          }
        }
      });

      const workersRO = (formOfficialWorkersRO[slot] || 0) + (formSeasonalWorkersRO[slot] || 0);
      if (workersRO > 0) {
        offRO += (formOfficialWorkersRO[slot] || 0);
        seasRO += (formSeasonalWorkersRO[slot] || 0);
      }

      const workersRMA = (formOfficialWorkersRMA[slot] || 0) + (formSeasonalWorkersRMA[slot] || 0);
      if (workersRMA > 0) {
        offRMA += (formOfficialWorkersRMA[slot] || 0);
        seasRMA += (formSeasonalWorkersRMA[slot] || 0);
      }

      // Tính cho BG
      let sumEqBG = 0;
      formModelItems.forEach(item => {
        const p = products.find(x => x.id === item.productId) || products[0];
        if (p.group === "BG") {
          sumEqBG += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
        }
      });
      const workersBG = (formOfficialWorkersBG[slot] || 0) + (formSeasonalWorkersBG[slot] || 0);
      if (workersBG > 0) {
        offBG += (formOfficialWorkersBG[slot] || 0);
        seasBG += (formSeasonalWorkersBG[slot] || 0);
      }
    });

    return {
      formOfficialCountRO: Number((offRO / 8).toFixed(2)) || 0,
      formSeasonalCountRO: Number((seasRO / 8).toFixed(2)) || 0,
      formWorkersCountRO: Number(((offRO + seasRO) / 8).toFixed(2)) || 0,
      formOfficialCountRMA: Number((offRMA / 8).toFixed(2)) || 0,
      formSeasonalCountRMA: Number((seasRMA / 8).toFixed(2)) || 0,
      formWorkersCountRMA: Number(((offRMA + seasRMA) / 8).toFixed(2)) || 0,
      formOfficialCountBG: Number((offBG / 8).toFixed(2)) || 0,
      formSeasonalCountBG: Number((seasBG / 8).toFixed(2)) || 0,
      formWorkersCountBG: Number(((offBG + seasBG) / 8).toFixed(2)) || 0,
      formWorkersCount: Number(((offRO + seasRO + offRMA + seasRMA + offBG + seasBG) / 8).toFixed(2)) || 0,
    };
  }, [formSlots, formModelItems, formOfficialWorkersRO, formSeasonalWorkersRO, formOfficialWorkersRMA, formSeasonalWorkersRMA, formOfficialWorkersBG, formSeasonalWorkersBG, products]);
  const [formTechnician, setFormTechnician] = useState<string>("Nguyễn Minh Hoàng Khiêm ( DCLR )");
  const [formMessage, setFormMessage] = useState<string>("");

  // Lưu trữ dữ liệu vào localStorage khi có thay đổi
  useEffect(() => {
    localStorage.setItem("sunhouse_metrics_2025_v2", JSON.stringify(metrics2025));
  }, [metrics2025]);

  useEffect(() => {
    localStorage.setItem("sunhouse_metrics_2026_v2", JSON.stringify(metrics2026));
  }, [metrics2026]);

  useEffect(() => {
    localStorage.setItem("sunhouse_monthly_targets_v2", JSON.stringify(monthlyTargets));
  }, [monthlyTargets]);


  useEffect(() => {
    localStorage.setItem("sunhouse_gas_daily_reports_v2", JSON.stringify(gasDailyReports));
  }, [gasDailyReports]);

  useEffect(() => {
    localStorage.setItem("sunhouse_assembly_daily_reports_v2", JSON.stringify(assemblyDailyReports));
  }, [assemblyDailyReports]);

  useEffect(() => {
    localStorage.setItem("sunhouse_products_v2", JSON.stringify(products));
  }, [products]);

  // === DỮ LIỆU TÍNH TỔNG CHUNG 2 DÂY CHUYỀN ===
  const combinedDailyReports = useMemo<CombinedDailyReportRow[]>(() => {
    // 1. Lọc các ngày thực tế từ 2 bảng (bỏ các hàng tổng hợp tuần)
    const gasDays = gasDailyReports.filter((r) => !r.isSummary && !r.isOff);
    const assemblyDays = assemblyDailyReports.filter((r) => !r.isSummary);

    // 2. Tìm tất cả các ngày duy nhất
    const allDatesSet = new Set<string>();
    gasDays.forEach((r) => allDatesSet.add(r.date));
    assemblyDays.forEach((r) => allDatesSet.add(r.date));

    const uniqueDates = Array.from(allDatesSet).sort((a, b) => {
      const getDay = (d: string) => {
        const match = d.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 999;
      };
      return getDay(a) - getDay(b);
    });

    // 3. Với mỗi ngày, tính tổng hợp dữ liệu của 2 dây chuyền
    return uniqueDates.map((dateString) => {
      const gasRow = gasDays.find((r) => r.date === dateString);
      const assemRow = assemblyDays.find((r) => r.date === dateString);

      // --- GAS METRICS ---
      const gasCong = gasRow
        ? Number(gasRow.congGasStove || 0) +
          Number(gasRow.congSeasonal || 0) +
          Number(gasRow.congRma || 0)
        : 0;

      const gasOutput = gasRow
        ? Number(gasRow.outputStove || 0) + Number(gasRow.outputRma || 0)
        : 0;
      const actualGasOutput = gasRow
        ? Number(gasRow.actualStove || 0) + Number(gasRow.actualRma || 0)
        : 0;
      const gasDm = gasRow ? Number(gasRow.dinhmucSlTheoNs || 0) : 0;
      const gasWorkerPresent = gasRow ? Number(gasRow.tongNhanSuLine || 0) : 0;
      const gasWorkerAbsent = gasRow ? Number(gasRow.nhansuNghi || 0) : 0;

      // --- ASSEMBLY METRICS ---
      const assemCong = assemRow
        ? Number(assemRow.congChinhThuc || 0) + Number(assemRow.congThoiVu || 0)
        : 0;

      const assemOutput = assemRow ? Number(assemRow.outputLineChinh || 0) : 0;
      const actualAssemOutput = assemRow ? Number(assemRow.actualLineChinh || 0) : 0;
      const assemDm = assemRow ? Number(assemRow.dinhmucSlTheoNs || 0) : 0;
      const assemWorkerPresent = assemRow ? Number(assemRow.tongNhanSuLineDiLam || 0) : 0;
      const assemWorkerAbsent = assemRow ? Number(assemRow.tongNhansuNghi || 0) : 0;
      const assemKhsx = assemRow ? Number(assemRow.khsxNgay || 0) : 0;

      // --- COMBINED RESULTS ---
      const totalCong = Number((gasCong + assemCong).toFixed(3));
      const totalOutput = gasOutput + assemOutput;
      const totalActualOutput = actualGasOutput + actualAssemOutput;
      const totalDinhmucSlTheoNs = Number((gasDm + assemDm).toFixed(3));

      // NSLĐ Phân Xưởng LR (%) = (totalOutput / totalCong) / 9.03 * 100%
      const combinedNsld = totalCong > 0
        ? Number(((totalOutput / totalCong) / 9.03 * 100).toFixed(1))
        : 0;

      const totalNhanSuDiLam = gasWorkerPresent + assemWorkerPresent;
      const totalNhanSuNghi = gasWorkerAbsent + assemWorkerAbsent;

      const combinedTileDiLam = (totalNhanSuDiLam + totalNhanSuNghi) > 0
        ? Number((totalNhanSuDiLam / (totalNhanSuDiLam + totalNhanSuNghi) * 100).toFixed(1))
        : 100;

      const khsxDailyCombined = assemKhsx; // Lấy theo line chính
      const tileHoanThanhKhsxCombined = khsxDailyCombined > 0
        ? Number((totalOutput / khsxDailyCombined * 100).toFixed(1))
        : 0;

      return {
        date: dateString,
        totalCong,
        totalOutput,
        totalActualOutput,
        totalDinhmucSlTheoNs,
        combinedNsld,
        totalNhanSuDiLam,
        totalNhanSuNghi,
        combinedTileDiLam,
        khsxDailyCombined,
        tileHoanThanhKhsxCombined,
      };
    });
  }, [gasDailyReports, assemblyDailyReports]);


  // Helper to calculate the accumulated leftover from preceding days of the same month/year
  const getPrevDayLeftover = (productId: string, currentDateStr: string) => {
      const parts = currentDateStr.split("-");
    if (parts.length !== 3) return 0;
    const year = parts[0];
    const month = parts[1];
    const ym = `${year}-${month}`;
    const currentMonthPlan = monthlyPlan[ym] || {};
    const currentDayNum = parseInt(parts[2]);
    if (isNaN(currentDayNum)) return 0;

    let accumulated = 0;
    for (let d = 1; d < currentDayNum; d++) {
      const dayStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
      const plan = currentMonthPlan[productId]?.[d] || 0;
      const actual = productionLogs
        .filter(log => log.date === dayStr && log.productId === productId)
        .reduce((sum, log) => sum + log.actualUnits, 0);
      accumulated += (plan - actual);
    }
    return accumulated || 0;
  };


  // --- FORM DYNAMICS ---
  const formAggregates = useMemo(() => {
    let totalActualQty = 0;
    let totalEqQty = 0;
    let totalPlanQty = 0;
    let totalRemainingQty = 0;
    let totalActualQtyRO = 0;
    let totalEqQtyRO = 0;
    let totalPlanQtyRO = 0;
    let totalRemainingQtyRO = 0;
    let totalActualQtyRMA = 0;
    let totalEqQtyRMA = 0;
    let totalPlanQtyRMA = 0;
    let totalRemainingQtyRMA = 0;
    let totalActualQtyBG = 0;
    let totalEqQtyBG = 0;
    let totalPlanQtyBG = 0;
    let totalRemainingQtyBG = 0;
    let totalRevenue = 0;

    formModelItems.forEach((item) => {
      const prodDef = products.find((p) => p.id === item.productId) || products[0];
      if (!prodDef) return;
      
      const modelActual = Object.keys(item.hourlyActuals).reduce((sum, key) => sum + (item.hourlyActuals[key] || 0), 0);
      const modelEq = Math.round(modelActual * prodDef.factor);
      const revenue = modelActual * (prodDef.price || 0);
      totalActualQty += modelActual;
      totalEqQty += modelEq;
      totalRevenue += revenue;
      totalPlanQty += (item.dailyPlan || 0);
      
      const leftover = getPrevDayLeftover(item.productId, formDate);
      const remaining = Math.max(0, (item.dailyPlan || 0) + leftover - modelActual);
      totalRemainingQty += remaining;

      const isRMA = prodDef.group === "RMA" || 
                    (prodDef.group === "MLN" && (
                      prodDef.name.toLowerCase().includes("rma") || 
                      prodDef.code.toLowerCase().includes("rma") || 
                      prodDef.id.toLowerCase().includes("rma")
                    ));

      if (isRMA) {
        totalActualQtyRMA += modelActual;
        totalEqQtyRMA += modelEq;
        totalPlanQtyRMA += (item.dailyPlan || 0);
        totalRemainingQtyRMA += remaining;
      } else if (prodDef.group === "MLN") {
        totalActualQtyRO += modelActual;
        totalEqQtyRO += modelEq;
        totalPlanQtyRO += (item.dailyPlan || 0);
        totalRemainingQtyRO += remaining;
      } else {
        totalActualQtyBG += modelActual;
        totalEqQtyBG += modelEq;
        totalPlanQtyBG += (item.dailyPlan || 0);
        totalRemainingQtyBG += remaining;
      }
    });

    const activeSlots = formSlots;
    let totalStandardRO = 0;
    let totalStandardRMA = 0;
    let totalStandardBG = 0;

    activeSlots.forEach((slot) => {
      const wRO = (formOfficialWorkersRO[slot] || 0) + (formSeasonalWorkersRO[slot] || 0);
      const wRMA = (formOfficialWorkersRMA[slot] || 0) + (formSeasonalWorkersRMA[slot] || 0);
      const wBG = (formOfficialWorkersBG[slot] || 0) + (formSeasonalWorkersBG[slot] || 0);
      totalStandardRO += wRO * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8);
      totalStandardRMA += wRMA * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8);
      totalStandardBG += wBG * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8);
    });

    const avgProductivityRO = totalStandardRO > 0 ? Number(((totalEqQtyRO / totalStandardRO) * 100).toFixed(1)) : 0;
    const avgProductivityRMA = totalStandardRMA > 0 ? Number(((totalEqQtyRMA / totalStandardRMA) * 100).toFixed(1)) : 0;
    const avgProductivityBG = totalStandardBG > 0 ? Number(((totalEqQtyBG / totalStandardBG) * 100).toFixed(1)) : 0;

    const totalStandardCombined = totalStandardRO + totalStandardRMA + totalStandardBG;
    const avgProductivity = totalStandardCombined > 0 ? Number(((totalEqQty / totalStandardCombined) * 100).toFixed(1)) : 0;

    return {
      totalActualQty,
      totalEqQty,
      totalPlanQty,
      totalRemainingQty,
      totalWorkers: formWorkersCount,
      totalWorkersRO: formWorkersCountRO,
      totalWorkersRMA: formWorkersCountRMA,
      totalWorkersBG: formWorkersCountBG,
      totalActualQtyRO,
      totalEqQtyRO,
      totalPlanQtyRO,
      totalRemainingQtyRO,
      totalActualQtyRMA,
      totalEqQtyRMA,
      totalPlanQtyRMA,
      totalRemainingQtyRMA,
      totalActualQtyBG,
      totalEqQtyBG,
      totalPlanQtyBG,
      totalRemainingQtyBG,
      avgProductivity,
      avgProductivityRO,
      avgProductivityRMA,
      avgProductivityBG,
      totalRevenue,
    };
  }, [formModelItems, formOfficialWorkersRO, formSeasonalWorkersRO, formOfficialWorkersRMA, formSeasonalWorkersRMA, formOfficialWorkersBG, formSeasonalWorkersBG, formSlots, formWorkersCount, formWorkersCountRO, formWorkersCountRMA, formWorkersCountBG, products, monthlyPlan, productionLogs, formDate]);
  // --- LOGIC TÍNH TOÁN DỰA TRÊN NHẬT KÝ CA MỚI
  const processedMetrics2026 = useMemo(() => {
    // Clone số liệu 2026 từ biểu đồ đã cập nhật
    const baseMetrics = JSON.parse(JSON.stringify(metrics2026)) as MonthlyMetric[];

    const formDateParts = formDate.split("-");
    const formYear = parseInt(formDateParts[0]);
    const formMonth = parseInt(formDateParts[1]);

    const hasSavedFormDate = productionLogs.some(log => log.date === formDate);

    const getMonthFromDateString = (dStr: string): number => {
      const parts = dStr.split("-");
      if (parts.length < 2) return 0;
      const mStr = parts[1].toLowerCase();
      if (mStr.startsWith("jan")) return 1;
      if (mStr.startsWith("feb")) return 2;
      if (mStr.startsWith("mar")) return 3;
      if (mStr.startsWith("apr")) return 4;
      if (mStr.startsWith("may")) return 5;
      if (mStr.startsWith("jun")) return 6;
      if (mStr.startsWith("jul")) return 7;
      if (mStr.startsWith("aug")) return 8;
      if (mStr.startsWith("sep")) return 9;
      if (mStr.startsWith("oct")) return 10;
      if (mStr.startsWith("nov")) return 11;
      if (mStr.startsWith("dec")) return 12;
      return 0;
    };

    const updated = baseMetrics.map((m) => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const isPast = m.year < currentYear || (m.year === currentYear && m.month < currentMonth);
      const isCurrent = m.year === currentYear && m.month === currentMonth;
      const isLocked = (isPast || isCurrent) && !(m.year === 2026 && m.month === 7);
      const isAutoReportMonth = isLocked;

      // Get logs for this month
      const logsForMonth = productionLogs.filter(
        (log) => log.date.startsWith(`${m.year}-${String(m.month).padStart(2, '0')}`)
      );

      const isFormMonth = m.year === formYear && m.month === formMonth;
      const hasLogs = logsForMonth.length > 0;

      if (isAutoReportMonth && (hasLogs || isFormMonth)) {
        const filteredLogs = hasSavedFormDate
          ? logsForMonth
          : logsForMonth.filter((log) => log.date !== formDate);

        let filteredByDivisionLogs = filteredLogs;
        if (filterDivision !== "ALL") {
          filteredByDivisionLogs = filteredLogs.filter(log => log.productGroup === filterDivision);
        }

        const eqQty = filteredByDivisionLogs.reduce((acc, curr) => acc + (curr.equivalentProducts || 0), 0);
        const actualQty = filteredByDivisionLogs.reduce((acc, curr) => acc + (curr.actualUnits || 0), 0);
        
        // Sum unique shift workers
        const uniqueShiftWorkersMap: { [key: string]: number } = {};
        filteredByDivisionLogs.forEach((log) => {
          const key = `${log.date}_${log.shift}_${log.lineId}`;
          uniqueShiftWorkersMap[key] = Math.max(uniqueShiftWorkersMap[key] || 0, log.workersCount || 0);
        });
        const workdays = Object.values(uniqueShiftWorkersMap).reduce((acc, val) => acc + (val || 0), 0);

        let addedEqQty = eqQty;
        let addedActualQty = actualQty;
        let addedWorkdays = workdays;

        if (isFormMonth && !hasSavedFormDate) {
          if (filterDivision === "ALL") {
            addedEqQty += formAggregates.totalEqQty;
            addedActualQty += formAggregates.totalActualQty;
            addedWorkdays += formWorkersCount;
          } else if (filterDivision === "MLN") {
            addedEqQty += formAggregates.totalEqQtyRO;
            addedActualQty += formAggregates.totalActualQtyRO;
            addedWorkdays += formWorkersCountRO;
          } else if (filterDivision === "BG") {
            addedEqQty += formAggregates.totalEqQtyBG;
            addedActualQty += formAggregates.totalActualQtyBG;
            addedWorkdays += formWorkersCountBG;
          }
        }

        if (addedEqQty > 0 || addedActualQty > 0 || addedWorkdays > 0) {
          const finalEq = addedEqQty;
          const finalActual = addedActualQty;
          const finalMandays = addedWorkdays;

          const calculatedProductivity = (finalMandays > 0 && !Number.isNaN(finalEq) && !Number.isNaN(finalMandays))
            ? Number(((finalEq / finalMandays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2))
            : (m.laborProductivityPercent || 100);

          return {
            ...m,
            equivalentProducts: finalEq,
            actualProducts: finalActual,
            productionMandays: finalMandays,
            laborProductivityPercent: calculatedProductivity,
          };
        }
      } else {

        // Fallback to daily reports if available for this month (e.g. June 2026)
        const getValues = (item: any, gasRow: any) => {
          let totalCong = 0;
          let totalOutput = 0;
          let totalActualOutput = 0;
          
          if (filterDivision === "ALL" || filterDivision === "MLN") {
            const ratio = filterDivision === "ALL" ? 1 : 0.9;
            totalCong += (item.congChinhThuc + item.congThoiVu) * ratio;
            totalOutput += item.outputLineChinh * ratio;
            totalActualOutput += item.actualLineChinh * ratio;
          }
          if (filterDivision === "ALL" || filterDivision === "RMA") {
            if (filterDivision === "RMA") {
               totalCong += (item.congChinhThuc + item.congThoiVu) * 0.1;
               totalOutput += item.outputLineChinh * 0.1;
               totalActualOutput += item.actualLineChinh * 0.1;
            }
          }
          if (filterDivision === "ALL" || filterDivision === "BG") {
            totalCong += gasRow.congGasStove + gasRow.congSeasonal + gasRow.congRma;
            totalOutput += gasRow.outputStove + gasRow.outputRma;
            totalActualOutput += gasRow.actualStove + gasRow.actualRma;
          }
          return { totalCong, totalOutput, totalActualOutput };
        };

        const assemMonthReports = assemblyDailyReports.filter((r) => !r.isSummary && getMonthFromDateString(r.date) === m.month && r.date.startsWith(m.year.toString()));
        if (assemMonthReports.length > 0) {
          let finalEq = 0;
          let finalActual = 0;
          let finalMandays = 0;

          assemMonthReports.forEach(item => {
             const gasRow = gasDailyReports.find(g => g.date === item.date) || { congGasStove: 0, congSeasonal: 0, congRma: 0, outputStove: 0, outputRma: 0, actualStove: 0, actualRma: 0 } as any;
             const { totalCong, totalOutput, totalActualOutput } = getValues(item, gasRow);
             finalEq += totalOutput;
             finalActual += totalActualOutput;
             finalMandays += totalCong;
          });

          const calculatedProductivity = finalMandays > 0
            ? Number(((finalEq / finalMandays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2))
            : (m.laborProductivityPercent || 100);

          return {
            ...m,
            equivalentProducts: finalEq,
            actualProducts: finalActual,
            productionMandays: finalMandays,
            laborProductivityPercent: calculatedProductivity,
          };
        }
      }
      
      return m;
    });

    return updated;
  }, [metrics2026, productionLogs, formDate, formAggregates, formWorkersCount, formWorkersCountRO, formWorkersCountBG, filterDivision, assemblyDailyReports, gasDailyReports]);

  // Lọc/chia tỉ lệ dữ liệu tĩnh dựa trên bộ lọc
  const displayWeeklyAttendance = useMemo(() => {
    return WEEKLY_ATTENDANCE.map(w => ({
      ...w,
      rate: w.rate === null ? null : Number((w.rate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 1.01 : filterDivision === "RMA" ? 1.02 : 0.99))).toFixed(1))
    }));
  }, [filterDivision]);

  const getProductionMonthFromWeek = (weekStr: string): number => {
    const weekNum = parseInt(weekStr.replace("W", ""), 10);
    // Standard production calendar mapping
    if (weekNum <= 4) return 1;
    if (weekNum <= 8) return 2;
    if (weekNum <= 13) return 3;
    if (weekNum <= 17) return 4;
    if (weekNum <= 21) return 5;
    if (weekNum <= 26) return 6;
    if (weekNum <= 30) return 7; // W27-W30 are July
    if (weekNum <= 34) return 8;
    if (weekNum <= 39) return 9;
    if (weekNum <= 43) return 10;
    if (weekNum <= 47) return 11;
    return 12;
  };

  const displayMonthlyScrap = useMemo(() => {
    const computedFromWeeks = Array(12).fill(null);
    weeklyScrap.forEach(w => {
      if (w.scrapCost !== null) {
        const month = getProductionMonthFromWeek(w.week);
        if (month >= 1 && month <= 12) {
          if (computedFromWeeks[month - 1] === null) {
            computedFromWeeks[month - 1] = 0;
          }
          computedFromWeeks[month - 1] += w.scrapCost;
        }
      }
    });

    return Array.from({ length: 12 }).map((_, i) => {
      const existing = monthlyScrap.find(m => m.month === i + 1);
      let scrapCost = existing ? existing.scrapCost : null;
      if (computedFromWeeks[i] !== null) {
        scrapCost = computedFromWeeks[i];
      }
      
      return {
        month: i + 1,
        scrapCost: scrapCost === null ? null : Math.round(scrapCost * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1)))
      };
    });
  }, [filterDivision, monthlyScrap, weeklyScrap]);

  const displayMonthlyDclrError = useMemo(() => {
    const computedFromWeeksSum = Array(12).fill(0);
    const computedFromWeeksCount = Array(12).fill(0);
    
    weeklyDclrError.forEach(w => {
      if (w.errorRate !== null) {
        const month = getProductionMonthFromWeek(w.week);
        if (month >= 1 && month <= 12) {
          computedFromWeeksSum[month - 1] += w.errorRate;
          computedFromWeeksCount[month - 1] += 1;
        }
      }
    });

    return Array.from({ length: 12 }).map((_, i) => {
      const existing = monthlyDclrError.find(m => m.month === i + 1);
      let errorRate = existing ? existing.errorRate : null;
      
      if (computedFromWeeksCount[i] > 0) {
        errorRate = Number((computedFromWeeksSum[i] / computedFromWeeksCount[i]).toFixed(2));
      }

      return {
        month: i + 1,
        errorRate: errorRate === null ? null : Number((errorRate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1))).toFixed(2))
      };
    });
  }, [filterDivision, monthlyDclrError, weeklyDclrError]);



  const displayWeeklyScrap = useMemo(() => {
    const validWeeks = getFridayToThursdayWeeksForMonth(selectedYear, scrapQualityMonth);
    return weeklyScrap
      .filter(r => validWeeks.includes(r.week))
      .map(r => ({
        ...r,
        scrapCost: r.scrapCost === null ? null : Math.round(r.scrapCost * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1)))
      }));
  }, [filterDivision, weeklyScrap, selectedYear, scrapQualityMonth]);

  const displayWeeklyDclrError = useMemo(() => {
    const validWeeks = getFridayToThursdayWeeksForMonth(selectedYear, scrapQualityMonth);
    return weeklyDclrError
      .filter(r => validWeeks.includes(r.week))
      .map(r => ({
        ...r,
        errorRate: r.errorRate === null ? null : Number((r.errorRate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1))).toFixed(2))
      }));
  }, [filterDivision, weeklyDclrError, selectedYear, scrapQualityMonth]);

  const chartValidWeeks = useMemo(() => {
    const valid = getFridayToThursdayWeeksForMonth(selectedYear, scrapQualityMonth);
    if (valid.length === 0) return [];
    const firstWeekStr = valid[0];
    const firstWeekNum = parseInt(firstWeekStr.replace("W", ""), 10);
    const pastWeeks = [];
    if (firstWeekNum > 2) {
      pastWeeks.push("W" + (firstWeekNum - 2));
      pastWeeks.push("W" + (firstWeekNum - 1));
    } else if (firstWeekNum > 1) {
      pastWeeks.push("W" + (firstWeekNum - 1));
    }
    return [...pastWeeks, ...valid];
  }, [selectedYear, scrapQualityMonth]);

  const chartMonthlyScrap = useMemo(() => displayMonthlyScrap, [displayMonthlyScrap]);
  
  const chartWeeklyScrap = useMemo(() => {
    return weeklyScrap
      .filter(r => chartValidWeeks.includes(r.week))
      .map(r => ({
        ...r,
        scrapCost: r.scrapCost === null ? null : Math.round(r.scrapCost * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1)))
      }));
  }, [filterDivision, weeklyScrap, chartValidWeeks]);

  const chartWeeklyDclrError = useMemo(() => {
    return weeklyDclrError
      .filter(r => chartValidWeeks.includes(r.week))
      .map(r => ({
        ...r,
        errorRate: r.errorRate === null ? null : Number((r.errorRate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1))).toFixed(2))
      }));
  }, [filterDivision, weeklyDclrError, chartValidWeeks]);

  const weeklyReportData = useMemo(() => {
    const weeks = getStandardYearWeeks(selectedYear);
    const weekObj = weeks.find(w => w.id === selectedReportWeek);
    if (!weekObj) return { rows: [], dayTotals: [], grandTotal: {} };

    const filteredProducts = products.filter(p => filterDivision === "ALL" || p.group === filterDivision);
    
    const rows = filteredProducts.map(product => {
      const dayData = weekObj.days.map(day => {
        const yearMonth = `${day.dateStr.split('-')[0]}-${day.dateStr.split('-')[1]}`;
        const plan = monthlyPlan[yearMonth]?.[product.id]?.[day.dayNum] || 0;
        
        const logs = productionLogs.filter(log => log.date === day.dateStr && log.productId === product.id);
        const actual = logs.reduce((sum, log) => sum + log.actualUnits, 0);
        
        return { plan, actual };
      });

      const totalPlan = dayData.reduce((sum, d) => sum + d.plan, 0);
      const totalActual = dayData.reduce((sum, d) => sum + d.actual, 0);

      // --- CUMULATIVE CALCULATION FOR +/- COLUMN ---
      const endOfWeekDateStr = weekObj.days[weekObj.days.length - 1].dateStr;
      
      // All-time actual for this product up to the end of the current selected week
      const allTimeActual = productionLogs
        .filter(l => l.productId === product.id && l.date <= endOfWeekDateStr)
        .reduce((sum, l) => sum + l.actualUnits, 0);
      
      const allTimeActualEq = allTimeActual * (product.factor || 1);
        
      // Total plan for this product up to the end of the current selected week
      let allTimePlan = 0;
      Object.entries(monthlyPlan).forEach(([yearMonth, productPlans]) => {
        const [pYear, pMonth] = yearMonth.split('-').map(Number);
        const [eYear, eMonth, eDay] = endOfWeekDateStr.split('-').map(Number);
        
        if (pYear < eYear || (pYear === eYear && pMonth < eMonth)) {
          // Full previous months
          const pPlan = productPlans[product.id] || {};
          Object.values(pPlan).forEach(val => allTimePlan += (val as number));
        } else if (pYear === eYear && pMonth === eMonth) {
          // Current selected month up to end of selected week
          const pPlan = productPlans[product.id] || {};
          Object.entries(pPlan).forEach(([day, val]) => {
            if (Number(day) <= eDay) allTimePlan += (val as number);
          });
        }
      });
      
      const allTimePlanEq = allTimePlan * (product.factor || 1);

      const diff = allTimeActual - allTimePlan;
      const diffEq = allTimeActualEq - allTimePlanEq;

      return {
        product,
        dayData,
        totalPlan,
        totalActual,
        allTimeActual,
        allTimePlan,
        allTimeActualEq,
        allTimePlanEq,
        diff,
        diffEq
      };
    }).filter(row => row.totalPlan > 0 || row.totalActual > 0);

    const dayTotals = weekObj.days.map((_, i) => {
      const plan = rows.reduce((sum, r) => sum + r.dayData[i].plan, 0);
      const actual = rows.reduce((sum, r) => sum + r.dayData[i].actual, 0);
      const planEq = rows.reduce((sum, r) => sum + r.dayData[i].plan * (r.product.factor || 1), 0);
      const actualEq = rows.reduce((sum, r) => sum + r.dayData[i].actual * (r.product.factor || 1), 0);
      
      const dayLogs = productionLogs.filter(log => log.date === weekObj.days[i].dateStr);
      
      // Calculate total workers for the day by summing workers from unique lines
      const uniqueLines = Array.from(new Set(dayLogs.map(l => l.lineId)));
      const workers = uniqueLines.reduce((sum, lineId) => {
        const lineLogs = dayLogs.filter(l => l.lineId === lineId);
        return sum + (lineLogs.length > 0 ? lineLogs[0].workersCount : 0);
      }, 0);

      return { plan, actual, planEq, actualEq, workers };
    });

    const grandTotal = {
      plan: dayTotals.reduce((sum: number, d) => sum + d.plan, 0),
      actual: dayTotals.reduce((sum: number, d) => sum + d.actual, 0),
      planEq: dayTotals.reduce((sum: number, d) => sum + d.planEq, 0),
      actualEq: dayTotals.reduce((sum: number, d) => sum + d.actualEq, 0),
      workers: dayTotals.reduce((sum: number, d) => sum + (d.workers as number), 0) / (dayTotals.filter(d => (d.workers as number) > 0).length || 1),
      allTimeActual: rows.reduce((sum, r) => sum + (r as any).allTimeActual, 0),
      allTimePlan: rows.reduce((sum, r) => sum + (r as any).allTimePlan, 0),
      allTimeActualEq: rows.reduce((sum, r) => sum + (r as any).allTimeActualEq, 0),
      allTimePlanEq: rows.reduce((sum, r) => sum + (r as any).allTimePlanEq, 0)
    };

    // Calculate cumulative values up to the last day with production
    const lastDayWithDataIndex = [...dayTotals].reverse().findIndex(d => d.actualEq > 0);
    const lastIndex = lastDayWithDataIndex === -1 ? -1 : dayTotals.length - 1 - lastDayWithDataIndex;
    
    const cumulativePlanEq = lastIndex >= 0 ? dayTotals.slice(0, lastIndex + 1).reduce((sum, d) => sum + d.planEq, 0) : 0;
    const cumulativeActualEq = lastIndex >= 0 ? dayTotals.slice(0, lastIndex + 1).reduce((sum, d) => sum + d.actualEq, 0) : 0;

    return { weekObj, rows, dayTotals, grandTotal, cumulativePlanEq, cumulativeActualEq };
  }, [selectedYear, selectedReportWeek, products, monthlyPlan, productionLogs, filterDivision]);

  const handleExportWeeklyExcel = () => {
    const { weekObj, rows } = weeklyReportData;
    if (!weekObj) return;

    const workbook = XLSX.utils.book_new();
    const excelData = rows.map((r, idx) => {
      const row: any = {
        "STT": idx + 1,
        "Mã SP": r.product.code,
        "Tên sản phẩm": r.product.name,
        "ĐVT": r.product.unit || "Cái",
        "Hệ số quy đổi": r.product.factor,
      };
      
      weekObj.days.forEach((day, i) => {
        const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
        const dayName = dayNames[new Date(day.dateStr).getDay()];
        row[`${dayName} ${day.dayNum}/${day.monthNum} KH`] = r.dayData[i].plan;
        row[`${dayName} ${day.dayNum}/${day.monthNum} TT`] = r.dayData[i].actual;
      });
      
      row["Tổng KHSX"] = r.totalPlan;
      row["Tổng thực tế"] = r.totalActual;
      row["Chênh lệch"] = r.diff;
      
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo Tuần");
    XLSX.writeFile(workbook, `Bao_cao_tuan_W${selectedReportWeek}_${selectedYear}.xlsx`);
  };

  const displayMetrics = useMemo(() => {
    const baseMetrics = historyYear === 2025 ? metrics2025 : processedMetrics2026;

    if (historyYear === 2026) {
      // processedMetrics2026 already handles logs and filterDivision internally
      return baseMetrics;
    }

    // For 2025, handle logs (this part might still be needed if 2025 doesn't have a processed version)
    const formDateParts = formDate.split("-");
    const formYear = parseInt(formDateParts[0]);
    const formMonth = parseInt(formDateParts[1]);

    const hasSavedFormDate = productionLogs.some(log => log.date === formDate);

    const getMonthFromDateString = (dStr) => {
      const parts = dStr.split("-");
      if (parts.length < 2) return 0;
      const mStr = parts[1].toLowerCase();
      if (mStr.startsWith("jan")) return 1;
      if (mStr.startsWith("feb")) return 2;
      if (mStr.startsWith("mar")) return 3;
      if (mStr.startsWith("apr")) return 4;
      if (mStr.startsWith("may")) return 5;
      if (mStr.startsWith("jun")) return 6;
      if (mStr.startsWith("jul")) return 7;
      if (mStr.startsWith("aug")) return 8;
      if (mStr.startsWith("sep")) return 9;
      if (mStr.startsWith("oct")) return 10;
      if (mStr.startsWith("nov")) return 11;
      if (mStr.startsWith("dec")) return 12;
      return 0;
    };

    return baseMetrics.map(m => {
      let eqQty = m.equivalentProducts;
      let actualQty = m.actualProducts;
      
      const filteredAssemblyLogs = filterDivision === "ALL" 
        ? assemblyDailyReports 
        : assemblyDailyReports.filter(row => row.group === filterDivision);
        
      const filteredGasLogs = filterDivision === "ALL" || filterDivision === "BG"
        ? gasDailyReports
        : [];
        
      const targetAssemblyLogs = filteredAssemblyLogs.filter(log => log.date.startsWith(`${m.year}-${m.month.toString().padStart(2, "0")}`));
      const targetGasLogs = filteredGasLogs.filter(log => log.date.startsWith(`${m.year}-${m.month.toString().padStart(2, "0")}`));

      const uniqueShiftWorkersMap: Record<string, number> = {};
      targetAssemblyLogs.forEach(log => {
        if (!uniqueShiftWorkersMap[log.date] || log.workersCount > uniqueShiftWorkersMap[log.date]) {
          uniqueShiftWorkersMap[log.date] = log.workersCount;
        }
      });
      targetGasLogs.forEach(log => {
        if (!uniqueShiftWorkersMap[log.date]) uniqueShiftWorkersMap[log.date] = 0;
        uniqueShiftWorkersMap[log.date] += log.workersCount;
      });

      const workdays = Object.values(uniqueShiftWorkersMap).reduce((acc, val) => acc + val, 0);

      const isFormMonth = m.year === formYear && m.month === formMonth;

      if (filterDivision === "ALL") {
        const addedEqQty = eqQty + (isFormMonth && !hasSavedFormDate ? formAggregates.totalEqQty : 0);
        const addedActualQty = actualQty + (isFormMonth && !hasSavedFormDate ? formAggregates.totalActualQty : 0);
        const addedWorkdays = workdays + (isFormMonth && !hasSavedFormDate ? formWorkersCount : 0);

        if (addedEqQty > 0 || addedActualQty > 0 || addedWorkdays > 0) {
          const finalEq = addedEqQty;
          const finalActual = addedActualQty;
          const finalMandays = addedWorkdays;

          const calculatedProductivity = (finalMandays > 0 && !Number.isNaN(finalEq) && !Number.isNaN(finalMandays))
            ? Number(((finalEq / finalMandays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2))
            : (m.laborProductivityPercent || 100);

          return {
            ...m,
            equivalentProducts: finalEq,
            actualProducts: finalActual,
            productionMandays: finalMandays,
            laborProductivityPercent: calculatedProductivity,
          };
        }
      } else {
        // Fallback to daily reports if available for this month
        const getValues = (item: any, gasRow: any) => {
          let totalCong = 0;
          let totalOutput = 0;
          let totalActualOutput = 0;
          
          if (filterDivision === "ALL" || filterDivision === "MLN") {
            const ratio = filterDivision === "ALL" ? 1 : 0.9;
            totalCong += (item.congChinhThuc + item.congThoiVu) * ratio;
            totalOutput += item.outputLineChinh * ratio;
            totalActualOutput += item.actualLineChinh * ratio;
          }
          if (filterDivision === "ALL" || filterDivision === "RMA") {
            if (filterDivision === "RMA") {
               totalCong += (item.congChinhThuc + item.congThoiVu) * 0.1;
               totalOutput += item.outputLineChinh * 0.1;
               totalActualOutput += item.actualLineChinh * 0.1;
            }
          }
          if (filterDivision === "ALL" || filterDivision === "BG") {
            totalCong += gasRow.congGasStove + gasRow.congSeasonal + gasRow.congRma;
            totalOutput += gasRow.outputStove + gasRow.outputRma;
            totalActualOutput += gasRow.actualStove + gasRow.actualRma;
          }
          return { totalCong, totalOutput, totalActualOutput };
        };

        const assemMonthReports = assemblyDailyReports.filter((r) => !r.isSummary && getMonthFromDateString(r.date) === m.month && r.date.startsWith(m.year.toString()));
        if (assemMonthReports.length > 0) {
          let finalEq = 0;
          let finalActual = 0;
          let finalMandays = 0;

          assemMonthReports.forEach(item => {
             const gasRow = gasDailyReports.find(g => g.date === item.date) || { congGasStove: 0, congSeasonal: 0, congRma: 0, outputStove: 0, outputRma: 0, actualStove: 0, actualRma: 0 } as any;
             const { totalCong, totalOutput, totalActualOutput } = getValues(item, gasRow);
             finalEq += totalOutput;
             finalActual += totalActualOutput;
             finalMandays += totalCong;
          });

          const calculatedProductivity = finalMandays > 0
            ? Number(((finalEq / finalMandays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2))
            : (m.laborProductivityPercent || 100);

          return {
            ...m,
            equivalentProducts: finalEq,
            actualProducts: finalActual,
            productionMandays: finalMandays,
            laborProductivityPercent: calculatedProductivity,
          };
        }
      }
      return m;
    });
  }, [selectedYear, filterDivision, metrics2025, processedMetrics2026, productionLogs, formDate, formAggregates, formWorkersCount, gasDailyReports, assemblyDailyReports, combinedDailyReports]);

  const nsldComparisonData = useMemo(() => {
    const getValues = (item: any, gasRow: any) => {
      let totalCong = 0;
      let totalOutput = 0;
      
      if (filterDivision === "ALL" || filterDivision === "MLN") {
        const ratio = filterDivision === "ALL" ? 1 : 0.9;
        totalCong += (item.congChinhThuc + item.congThoiVu) * ratio;
        totalOutput += item.outputLineChinh * ratio;
      }
      if (filterDivision === "ALL" || filterDivision === "RMA") {
        const ratio = filterDivision === "ALL" ? 0 : 0.1;
        if (filterDivision === "RMA") {
           totalCong += (item.congChinhThuc + item.congThoiVu) * 0.1;
           totalOutput += item.outputLineChinh * 0.1;
        }
      }
      if (filterDivision === "ALL" || filterDivision === "BG") {
        totalCong += gasRow.congGasStove + gasRow.congSeasonal + gasRow.congRma;
        totalOutput += gasRow.outputStove + gasRow.outputRma;
      }
      
      return { totalCong, totalOutput };
    };

    // Chuẩn bị dữ liệu từ logs (từ tháng 7/2026 trở đi) cho các tính toán daily và weekly
    const logsByDate: { [key: string]: { totalEq: number, mandays: number } } = {};
    const filteredLogs = filterDivision === "ALL" ? productionLogs : productionLogs.filter(l => l.productGroup === filterDivision);
    const workersByDateShiftLine: { [key: string]: number } = {};
    
    filteredLogs.forEach(log => {
      if (!log.date.startsWith(selectedYear)) return;
      if (!logsByDate[log.date]) logsByDate[log.date] = { totalEq: 0, mandays: 0 };
      logsByDate[log.date].totalEq += log.equivalentProducts;
      
      const shiftKey = `${log.date}_${log.shift}_${log.lineId}`;
      workersByDateShiftLine[shiftKey] = Math.max(workersByDateShiftLine[shiftKey] || 0, log.workersCount);
    });
    
    Object.entries(workersByDateShiftLine).forEach(([key, workers]) => {
      const date = key.split('_')[0];
      if (logsByDate[date]) logsByDate[date].mandays += workers;
    });

    const isFormInLogs = filteredLogs.some(l => l.date === formDate);
    if (!isFormInLogs && formDate && formDate.startsWith(selectedYear)) {
      if (!logsByDate[formDate]) logsByDate[formDate] = { totalEq: 0, mandays: 0 };
      if (filterDivision === "ALL") {
        logsByDate[formDate].totalEq += formAggregates.totalEqQty;
        logsByDate[formDate].mandays += formWorkersCount;
      } else if (filterDivision === "MLN") {
        logsByDate[formDate].totalEq += formAggregates.totalEqQtyRO;
        logsByDate[formDate].mandays += formWorkersCountRO;
      } else if (filterDivision === "BG") {
        logsByDate[formDate].totalEq += formAggregates.totalEqQtyBG;
        logsByDate[formDate].mandays += formWorkersCountBG;
      }
    }

    if (laborViewMode === "daily") {
      const historicalDaily = assemblyDailyReports
        .filter((r) => !r.isSummary && r.date.startsWith(selectedYear))
        .map((item) => {
          const gasRow = gasDailyReports.find(g => g.date === item.date) || { congGasStove: 0, congSeasonal: 0, congRma: 0, outputStove: 0, outputRma: 0 } as any;
          const { totalCong, totalOutput } = getValues(item, gasRow);
          const value = totalCong > 0 ? Number(((totalOutput / totalCong) / 9.03 * 100).toFixed(1)) : 0;
          return { name: item.date, value, rawDate: "" };
        });

      const newDaily = Object.entries(logsByDate).map(([date, data]) => {
         const value = data.mandays > 0 ? Number(((data.totalEq / data.mandays) / 9.03 * 100).toFixed(1)) : 0;
         const d = new Date(date);
         const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
         const formattedName = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}`;
         return { name: formattedName, value, rawDate: date };
      });
      
      newDaily.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

      return [...historicalDaily, ...newDaily.map(d => ({ name: d.name, value: d.value }))];
    }

    if (laborViewMode === "weekly") {
      let historicalWeekly: any[] = [];
      if (selectedYear === "2025") {
         historicalWeekly = assemblyDailyReports
          .filter((r) => r.isSummary && r.date.includes("W"))
          .map((item) => {
            const gasRow = gasDailyReports.find(g => g.date === item.date) || { congGasStove: 0, congSeasonal: 0, congRma: 0, outputStove: 0, outputRma: 0 } as any;
            const { totalCong, totalOutput } = getValues(item, gasRow);
            const value = totalCong > 0 ? Number(((totalOutput / totalCong) / 9.03 * 100).toFixed(1)) : 0;
            return { name: item.date, value };
          });
      }

      // Group new daily logs into weeks
      const allWeeks = getYearWeeks(parseInt(selectedYear));
      const getWeekNo = (dStr: string) => {
        const week = allWeeks.find(w => w.days.some(d => d.dateStr === dStr));
        return week ? week.id : 0;
      };

      const weeklyData: { [key: string]: { totalEq: number, mandays: number } } = {};
      Object.entries(logsByDate).forEach(([date, data]) => {
        const weekNo = getWeekNo(date);
        const weekKey = `Tuần ${weekNo}`;
        if (!weeklyData[weekKey]) weeklyData[weekKey] = { totalEq: 0, mandays: 0 };
        weeklyData[weekKey].totalEq += data.totalEq;
        weeklyData[weekKey].mandays += data.mandays;
      });

      const newWeekly = Object.entries(weeklyData).map(([week, data]) => {
        const value = data.mandays > 0 ? Number(((data.totalEq / data.mandays) / 9.03 * 100).toFixed(1)) : 0;
        return { name: week, value, rawWeek: parseInt(week.replace("Tuần ", "")) };
      });
      newWeekly.sort((a, b) => a.rawWeek - b.rawWeek);

      return [...historicalWeekly, ...newWeekly.map(w => ({ name: w.name, value: w.value }))];
    }

    if (laborViewMode === "monthly") {
      return displayMetrics.filter(m => m.laborProductivityPercent !== null).map(m => ({
        name: `Tháng ${m.month}`,
        value: m.laborProductivityPercent || 0
      }));
    }

    // Yearly
    const currentMonthNum = parseInt(formDate.split("-")[1], 10);

    const getYearlyValue2025 = () => {
      let totalCong = 0;
      let totalOutput = 0;
      
      const reports = assemblyDailyReports.filter((r) => {
        if (r.isSummary || !r.date.startsWith("2025")) return false;
        const monthNum = parseInt(r.date.split("-")[1], 10);
        return monthNum <= currentMonthNum;
      });
      
      reports.forEach(item => {
         const gasRow = gasDailyReports.find(g => g.date === item.date) || { congGasStove: 0, congSeasonal: 0, congRma: 0, outputStove: 0, outputRma: 0 } as any;
         
         if (filterDivision === "ALL" || filterDivision === "MLN") {
            const ratio = filterDivision === "ALL" ? 1 : 0.9;
            totalCong += (item.congChinhThuc + item.congThoiVu) * ratio;
            totalOutput += item.outputLineChinh * ratio;
         }
         if (filterDivision === "RMA") {
            totalCong += (item.congChinhThuc + item.congThoiVu) * 0.1;
            totalOutput += item.outputLineChinh * 0.1;
         }
         if (filterDivision === "ALL" || filterDivision === "BG") {
            totalCong += gasRow.congGasStove + gasRow.congSeasonal + gasRow.congRma;
            totalOutput += gasRow.outputStove + gasRow.outputRma;
         }
      });
      
      if (totalCong > 0) {
        return Number(((totalOutput / totalCong) / 9.03 * 100).toFixed(1));
      }
      
      // Fallback
      const active = metrics2025.filter(m => m.laborProductivityPercent !== null && m.month <= currentMonthNum);
      if (active.length === 0) return 0;
      let sumEq = 0; let sumMan = 0;
      active.forEach(m => { sumEq += m.equivalentProducts || 0; sumMan += m.productionMandays || 0; });
      if (sumMan === 0) return 0;
      return Number(((sumEq / sumMan) / 9.03 * 100).toFixed(1));
    };

    const getYearlyValue2026 = () => {
      const activeMonths = processedMetrics2026.filter((m) => m.laborProductivityPercent !== null && m.month <= currentMonthNum);
      if (activeMonths.length === 0) return 0;
      
      let totalEq = 0;
      let totalMandays = 0;
      
      activeMonths.forEach(m => {
        totalEq += (m.equivalentProducts || 0);
        totalMandays += (m.productionMandays || 0);
      });
      
      if (totalMandays === 0) return 0;
      return Number(((totalEq / totalMandays) / 9.03 * 100).toFixed(1));
    };

    return [
      { name: `Năm 2025 (đến T${currentMonthNum})`, value: getYearlyValue2025() },
      { name: `Năm 2026 (đến T${currentMonthNum})`, value: getYearlyValue2026() }
    ];
    
  }, [assemblyDailyReports, gasDailyReports, laborViewMode, filterDivision, displayMetrics, productionLogs, formDate, formAggregates, formWorkersCount, formWorkersCountRO, formWorkersCountBG, selectedYear, metrics2025, processedMetrics2026]);

  const totalMonthlyPlanUnits = useMemo(() => {
    const [year, month] = formDate.split("-");
    const ym = `${year}-${month}`;
    const currentMonthPlan = monthlyPlan[ym] || {};
    
    let total = 0;
    let totalUnconverted = 0;

    // Iterate over configured products to ensure data matches visibility in the plan table
    products.forEach(p => {
      // Filter based on selected division
      if (filterDivision === "ALL") {
        if (p.group === "RMA") return; // Exclude RMA from total plan when ALL
      } else if (p.group !== filterDivision) {
        return;
      }
      
      const productDays = currentMonthPlan[p.id];
      if (!productDays) return;
      
      const factor = p.factor || 1;
      Object.values(productDays).forEach(planValue => {
        const val = Number(planValue) || 0;
        totalUnconverted += val;
        total += val * factor;
      });
    });

    return { total, totalUnconverted };
  }, [monthlyPlan, products, filterDivision, formDate]);

  const monthlyPlanExecution = useMemo(() => {
    const [year, month] = formDate.split("-");
    const ym = `${year}-${month}`;
    const currentMonthPlan = monthlyPlan[ym] || {};
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    
    // Filter production logs for this month
    const monthLogs = productionLogs.filter(log => log.date.startsWith(ym));

    // Check if current formDate is already saved in logs
    const hasSavedFormDate = productionLogs.some(log => log.date === formDate);

    // Get products with plan in this month OR with actual production in this month
    const planProductIds = Object.keys(currentMonthPlan);
    const actualProductIds = Array.from(new Set(monthLogs.map(log => log.productId)));
    
    // If formDate month is current month, and not saved yet, also include products in formModelItems
    const formProductIds = (!hasSavedFormDate && formDate.startsWith(ym)) 
      ? formModelItems.map(item => item.productId) 
      : [];

    const allRelevantProductIds = Array.from(new Set([...planProductIds, ...actualProductIds, ...formProductIds]));

    // Filter to only include products that actually exist in the products list
    const existingProductIds = allRelevantProductIds.filter(prodId => products.some(prod => prod.id === prodId));

    const yearWeeks = getYearWeeks(Number(year));
    const selectedWeekObj = yearWeeks.find(w => w.id === executionFilterWeek) || yearWeeks[0];
    const isDateInSelectedWeek = (dateStr: string) => {
      return selectedWeekObj ? selectedWeekObj.days.some(d => d.dateStr === dateStr) : false;
    };

    const items = existingProductIds.map(prodId => {
      const p = products.find(prod => prod.id === prodId)!;

      // Sum of plan based on filter type
      let planQty = 0;
      if (executionFilterType === "MONTH") {
        if (currentMonthPlan[prodId]) {
          Object.values(currentMonthPlan[prodId]).forEach(val => {
            planQty += Number(val) || 0;
          });
        }
      } else if (executionFilterType === "WEEK") {
        if (selectedWeekObj) {
          selectedWeekObj.days.forEach(dInfo => {
            const [yStr, mStr, dStr] = dInfo.dateStr.split("-");
            const ymKey = `${yStr}-${mStr}`;
            const dayVal = Number(dStr);
            if (monthlyPlan[ymKey]?.[prodId]?.[dayVal]) {
              planQty += Number(monthlyPlan[ymKey][prodId][dayVal]) || 0;
            }
          });
        }
      } else if (executionFilterType === "DAY") {
        const dayNum = executionFilterDay;
        if (currentMonthPlan[prodId]) {
          planQty = Number(currentMonthPlan[prodId][dayNum]) || 0;
        }
      }

      // Sum of actual produced based on filter type
      let actualQty = 0;
      let actualEqQty = 0;

      if (executionFilterType === "MONTH") {
        monthLogs.forEach(log => {
          if (log.productId === prodId) {
            actualQty += log.actualUnits || 0;
            actualEqQty += log.equivalentProducts || 0;
          }
        });
      } else if (executionFilterType === "WEEK") {
        productionLogs.forEach(log => {
          if (log.productId === prodId && isDateInSelectedWeek(log.date)) {
            actualQty += log.actualUnits || 0;
            actualEqQty += log.equivalentProducts || 0;
          }
        });
      } else if (executionFilterType === "DAY") {
        const filterDateStr = `${year}-${month}-${String(executionFilterDay).padStart(2, '0')}`;
        productionLogs.forEach(log => {
          if (log.productId === prodId && log.date === filterDateStr) {
            actualQty += log.actualUnits || 0;
            actualEqQty += log.equivalentProducts || 0;
          }
        });
      }

      // Add unsaved form values if applicable
      const prodFactor: number = Number((p as any).factor) || 1;
      let includeForm = false;
      if (executionFilterType === "MONTH") {
        includeForm = true;
      } else if (executionFilterType === "WEEK") {
        includeForm = isDateInSelectedWeek(formDate);
      } else if (executionFilterType === "DAY") {
        const filterDateStr = `${year}-${month}-${String(executionFilterDay).padStart(2, '0')}`;
        includeForm = formDate === filterDateStr;
      }

      if (!hasSavedFormDate && formDate.startsWith(ym) && includeForm) {
        const formItem = formModelItems.find(item => item.productId === prodId);
        if (formItem) {
          const formActual: number = (Object.values(formItem.hourlyActuals) as any[]).reduce((sum: number, val: any): number => sum + (Number(val) || 0), 0);
          const formEq: number = Math.round(formActual * prodFactor);
          actualQty += formActual;
          actualEqQty += formEq;
        }
      }

      const planEqQty = planQty * prodFactor;
      const diffQty = actualQty - planQty; // How much ahead (+) or behind (-) of plan
      const progressPercent = planQty > 0 ? Number(((actualQty / planQty) * 100).toFixed(1)) : (actualQty > 0 ? 100 : 0);

      return {
        product: p,
        planQty,
        planEqQty,
        actualQty,
        actualEqQty,
        diffQty,
        progressPercent,
      };
    });

    // Apply division filter
    const filteredItems = items.filter(item => filterDivision === "ALL" || item.product.group === filterDivision);

    // Sort by group, then by product code
    return filteredItems.sort((a, b) => a.product.group.localeCompare(b.product.group) || a.product.code.localeCompare(b.product.code));
  }, [monthlyPlan, productionLogs, products, formDate, formModelItems, filterDivision, executionFilterType, executionFilterDay, executionFilterWeek]);

  // Thống kê tóm tắt đầu não
  const kpis = useMemo(() => {
    // Sử dụng displayMetrics vì nó đã lọc chuẩn xác theo filterDivision
    const metricsToUse = displayMetrics;

    // Lấy logs của tháng hiện tại làm đại diện
    const formDateParts = formDate.split("-");
    const formYear = parseInt(formDateParts[0]);
    const formMonth = parseInt(formDateParts[1]);
    const monthPrefix = `${formYear}-${String(formMonth).padStart(2, '0')}`;

    const hasSavedFormDate = productionLogs.some(log => log.date === formDate);

    const logsForMonth = productionLogs.filter(
      (log) => log.date.startsWith(monthPrefix) && (filterDivision === "ALL" || log.productGroup === filterDivision)
    );
    
    const filteredLogs = hasSavedFormDate
      ? logsForMonth
      : logsForMonth.filter((log) => log.date !== formDate);

    // Split Eq Prod into two: for display in Card 2 vs for calculation in Card 4/4.5
    let totalEqProd_display = 0;
    let totalEqProd_productivity = 0;
    let totalActualUnitsMonth_display = 0;

    filteredLogs.forEach(log => {
      const isRMA = log.productGroup === "RMA";
      
      // Always add to productivity base
      totalEqProd_productivity += log.equivalentProducts;
      
      // Conditional add to display totals
      if (!(filterDivision === "ALL" && isRMA)) {
        totalEqProd_display += log.equivalentProducts;
        totalActualUnitsMonth_display += log.actualUnits;
      }
    });
    
    // Group workers to avoid double counting across different models on the same day/shift/line
    const uniqueShiftMap: { [key: string]: { workers: number, official: number, seasonal: number } } = {};
    filteredLogs.forEach((log) => {
      const key = `${log.date}_${log.shift}_${log.lineId}`;
      const official = log.officialWorkers !== undefined ? log.officialWorkers : log.workersCount;
      const seasonal = log.seasonalWorkers !== undefined ? log.seasonalWorkers : 0;
      
      if (!uniqueShiftMap[key] || log.workersCount > uniqueShiftMap[key].workers) {
        uniqueShiftMap[key] = {
          workers: log.workersCount,
          official,
          seasonal
        };
      }
    });

    let totalMandaysMonth = Object.values(uniqueShiftMap).reduce((acc, val) => acc + val.workers, 0);
    let totalOfficialMonth = Object.values(uniqueShiftMap).reduce((acc, val) => acc + val.official, 0);
    let totalSeasonalMonth = Object.values(uniqueShiftMap).reduce((acc, val) => acc + val.seasonal, 0);

    // If formDate month matches and it hasn't been saved yet, add active form values
    if (!hasSavedFormDate) {
      if (filterDivision === "ALL") {
        // For Display (Card 2) - Exclude RMA
        totalEqProd_display += (formAggregates.totalEqQtyRO + formAggregates.totalEqQtyBG);
        totalActualUnitsMonth_display += (formAggregates.totalActualQtyRO + formAggregates.totalActualQtyBG);
        
        // For Productivity (Card 4/4.5) - Include All
        totalEqProd_productivity += formAggregates.totalEqQty;
        
        // Workers (Card 5) - Include All
        totalMandaysMonth += formWorkersCount;
        totalOfficialMonth += formOfficialCountRO + formOfficialCountBG + formOfficialCountRMA;
        totalSeasonalMonth += formSeasonalCountRO + formSeasonalCountBG + formSeasonalCountRMA;
      } else if (filterDivision === "MLN") {
        totalEqProd_display += formAggregates.totalEqQtyRO;
        totalEqProd_productivity += formAggregates.totalEqQtyRO;
        totalActualUnitsMonth_display += formAggregates.totalActualQtyRO;
        totalMandaysMonth += formWorkersCountRO;
        totalOfficialMonth += formOfficialCountRO;
        totalSeasonalMonth += formSeasonalCountRO;
      } else if (filterDivision === "BG") {
        totalEqProd_display += formAggregates.totalEqQtyBG;
        totalEqProd_productivity += formAggregates.totalEqQtyBG;
        totalActualUnitsMonth_display += formAggregates.totalActualQtyBG;
        totalMandaysMonth += formWorkersCountBG;
        totalOfficialMonth += formOfficialCountBG;
        totalSeasonalMonth += formSeasonalCountBG;
      } else if (filterDivision === "RMA") {
        totalEqProd_display += formAggregates.totalEqQtyRMA;
        totalEqProd_productivity += formAggregates.totalEqQtyRMA;
        totalActualUnitsMonth_display += formAggregates.totalActualQtyRMA;
        totalMandaysMonth += formWorkersCountRMA;
        totalOfficialMonth += formOfficialCountRMA;
        totalSeasonalMonth += formSeasonalCountRMA;
      }
    }

    // Tổng sản lượng quy đổi cả năm (phát sinh)
    const totalEqProducts = metricsToUse
      .filter((m) => m.equivalentProducts !== null)
      .reduce((sum, m) => sum + (m.equivalentProducts || 0), 0);

    // Tổng số ngày công tích lũy
    const totalMandays = metricsToUse
      .filter((m) => m.productionMandays !== null)
      .reduce((sum, m) => sum + (m.productionMandays || 0), 0);

    // Hiệu suất trung bình cả năm (NSLĐ luỹ kế năm) - Sử dụng logic giống biểu đồ so sánh
    const filledMetrics = metricsToUse.filter(m => 
      m.equivalentProducts !== null && 
      m.productionMandays !== null && 
      m.productionMandays > 0
    );
    
    let avgLaborProductivity = 0;
    if (filledMetrics.length > 0) {
      const sumEq = filledMetrics.reduce((sum, m) => sum + (m.equivalentProducts || 0), 0);
      const sumDays = filledMetrics.reduce((sum, m) => sum + (m.productionMandays || 0), 0);
      avgLaborProductivity = Number(((sumEq / sumDays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(1));
    }

    // Revenue Calculation
    const plannedRevenue = Object.entries(monthlyPlan).reduce((acc: number, [ym, productsInMonth]) => {
      // Only count for current month
      const [fYear, fMonth] = formDate.split("-");
      if (ym !== `${fYear}-${fMonth}`) return acc;

      return acc + Object.entries(productsInMonth).reduce((acc2: number, [prodId, days]) => {
        const prod = products.find(p => p.id === prodId);
        if (!prod || prod.price === undefined) return acc2;
        
        // Exclude RMA when ALL
        if (filterDivision === "ALL" && prod.group === "RMA") return acc2;
        
        // Filter by group if not ALL
        if (filterDivision !== "ALL" && prod.group !== filterDivision) return acc2;
        
        const dayValues = Object.values(days) as number[];
        const totalUnits = dayValues.reduce((s: number, v: number) => s + v, 0);
        const price = prod.price || 0;
        return acc2 + (totalUnits * price);
      }, 0);
    }, 0);

    const actualRevenue = filteredLogs.reduce((acc, log) => {
        const prod = products.find(p => p.id === log.productId);
        if (!prod || prod.price === undefined) return acc;
        
        // Exclude RMA when ALL
        if (filterDivision === "ALL" && log.productGroup === "RMA") return acc;
        
        // Filter by group if not ALL
        if (filterDivision !== "ALL" && log.productGroup !== filterDivision) return acc;
        
        return acc + (log.actualUnits * (prod.price || 0));
    }, 0);

    // Add active form revenue if not saved yet
    let finalActualRevenue = actualRevenue;
    if (!hasSavedFormDate) {
      formModelItems.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (!prod || prod.price === undefined) return;
        
        // Exclude RMA when ALL
        if (filterDivision === "ALL" && prod.group === "RMA") return;
        
        // Filter by group if not ALL
        if (filterDivision !== "ALL" && prod.group !== filterDivision) return;
        
        const actualUnits = Object.keys(item.hourlyActuals).reduce((sum, key) => sum + (item.hourlyActuals[key] || 0), 0);
        finalActualRevenue += actualUnits * (prod.price || 0);
      });
    }

    const monthTarget = formMonth >= 7 
      ? (filterDivision === "MLN" ? 125 : filterDivision === "BG" ? 100 : filterDivision === "RMA" ? 110 : 121) 
      : 110;
    const yearTarget = 110;

    // Combined BG + RMA metrics for DCRMA Dashboard
    let combinedBgRmaEq = 0;
    let combinedBgRmaMandays = 0;
    
    const logsBgRma = productionLogs.filter(log => 
      log.date.startsWith(monthPrefix) && (log.productGroup === "BG" || log.productGroup === "RMA")
    );
    const filteredLogsBgRma = hasSavedFormDate
      ? logsBgRma
      : logsBgRma.filter(log => log.date !== formDate);
      
    combinedBgRmaEq = filteredLogsBgRma.reduce((sum, log) => sum + log.equivalentProducts, 0);
    
    const uniqueShiftMapBgRma: { [key: string]: number } = {};
    filteredLogsBgRma.forEach(log => {
      const key = `${log.date}_${log.shift}_${log.lineId}`;
      if (!uniqueShiftMapBgRma[key] || log.workersCount > uniqueShiftMapBgRma[key]) {
        uniqueShiftMapBgRma[key] = log.workersCount;
      }
    });
    combinedBgRmaMandays = Object.values(uniqueShiftMapBgRma).reduce((acc, v) => acc + v, 0);
    
    if (!hasSavedFormDate) {
      combinedBgRmaEq += (formAggregates.totalEqQtyBG + formAggregates.totalEqQtyRMA);
      combinedBgRmaMandays += (formWorkersCountBG + formWorkersCountRMA);
    }
    
    const combinedBgRmaLp = combinedBgRmaMandays > 0 
      ? Number(((combinedBgRmaEq / combinedBgRmaMandays / 9.03) * 100).toFixed(1))
      : 0;

    return {
      totalEqProducts,
      totalMandays,
      avgLaborProductivity,
      currentJulyEq: Math.round(totalEqProd_display) || 0,
      currentJulyUnconverted: Math.round(totalActualUnitsMonth_display) || 0,
      currentJulyMandays: Math.round(totalMandaysMonth) || 0,
      currentJulyOfficial: Math.round(totalOfficialMonth) || 0,
      currentJulySeasonal: Math.round(totalSeasonalMonth) || 0,
      currentJulyProductivity: Number(((totalEqProd_productivity / (totalMandaysMonth || 1) / INDUSTRIAL_STANDARDS.standardQtyPerManday) * 100).toFixed(2)) || 0,
      currentJulyCompletionRate: totalMonthlyPlanUnits.total > 0 ? Number(((totalEqProd_display / totalMonthlyPlanUnits.total) * 100).toFixed(1)) || 0 : 0,
      plannedRevenue,
      actualRevenue: finalActualRevenue,
      monthTarget,
      yearTarget,
      combinedBgRmaLp,
      combinedBgRmaEq,
      combinedBgRmaMandays
    };
  }, [selectedYear, processedMetrics2026, metrics2025, filterDivision, productionLogs, monthlyPlan, products, formDate, formAggregates, formWorkersCount, totalMonthlyPlanUnits, formOfficialCountRO, formOfficialCountBG, formSeasonalCountRO, formSeasonalCountBG, formWorkersCountRO, formWorkersCountBG, formModelItems]);

  const monthlyComparisonChartData = useMemo(() => {
    const applyFilter = (m: MonthlyMetric) => {
      if (filterDivision === "ALL") return m.laborProductivityPercent;
      if (m.laborProductivityPercent === null || m.laborProductivityPercent === undefined) return null;
      return Number((m.laborProductivityPercent * (filterDivision === "MLN" ? 1.02 : 0.98)).toFixed(2));
    };

    return Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i + 1;
      const m2025 = metrics2025.find(m => m.month === monthIndex);
      const m2026 = processedMetrics2026.find(m => m.month === monthIndex);

      return {
        month: `Tháng ${monthIndex}`,
        productivity2025: m2025 ? applyFilter(m2025) : null,
        productivity2026: m2026 ? applyFilter(m2026) : null,
      };
    });
  }, [metrics2025, processedMetrics2026, filterDivision]);

  const dailyChartData = useMemo(() => {
    return combinedDailyReports.map(r => ({
      date: r.date,
      nsld: r.combinedNsld,
      output: r.totalOutput
    }));
  }, [combinedDailyReports]);

  const weeklyChartData = useMemo(() => {
    // Group combinedDailyReports into chunks of 7 days
    const weeks: any[] = [];
    for (let i = 0; i < combinedDailyReports.length; i += 7) {
      const chunk = combinedDailyReports.slice(i, i + 7);
      const totalOutput = chunk.reduce((sum, r) => sum + r.totalOutput, 0);
      const totalCong = chunk.reduce((sum, r) => sum + r.totalCong, 0);
      const nsld = totalCong > 0 ? Number(((totalOutput / totalCong) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2)) : 0;
      weeks.push({
        week: `Tuần ${Math.floor(i / 7) + 1}`,
        nsld,
        output: totalOutput
      });
    }
    return weeks;
  }, [combinedDailyReports]);

  const yearlyChartData = useMemo(() => {
    const applyFilter = (m: MonthlyMetric) => {
      if (filterDivision === "ALL") return m.laborProductivityPercent;
      if (m.laborProductivityPercent === null || m.laborProductivityPercent === undefined) return null;
      return Number((m.laborProductivityPercent * (filterDivision === "MLN" ? 1.02 : 0.98)).toFixed(2));
    };
    
    // Average productivity for 2025 vs 2026
    const valid2025 = metrics2025.filter(m => m.laborProductivityPercent !== null);
    const valid2026 = processedMetrics2026.filter(m => m.laborProductivityPercent !== null);

    const avg2025 = valid2025.length > 0 ? valid2025.reduce((sum, m) => sum + (applyFilter(m) || 0), 0) / valid2025.length : 0;
    const avg2026 = valid2026.length > 0 ? valid2026.reduce((sum, m) => sum + (applyFilter(m) || 0), 0) / valid2026.length : 0;

    return [
      { year: "2025", productivity: Number(avg2025.toFixed(2)) },
      { year: "2026", productivity: Number(avg2026.toFixed(2)) }
    ];
  }, [metrics2025, processedMetrics2026, filterDivision]);

  // So sánh NSLĐ thực tế với Năm 2025 và chỉ tiêu đặt ra
  const simulatedHistoryMetrics = useMemo(() => {
    const currentHistoryMetrics = historyYear === 2025 ? metrics2025 : processedMetrics2026;

    return currentHistoryMetrics.map(m => {
      // 1. NSLĐ đã lưu thực tế của năm hiện tại được chọn
      const actualNSLD = m.laborProductivityPercent;

      // 2. NSLĐ Năm 2025 để đối chiếu
      const metric2025 = metrics2025.find(x => x.month === m.month);
      const nsld2025 = metric2025 ? metric2025.laborProductivityPercent : null;

      // 3. Mục tiêu tháng lấy từ monthlyTargets
      const targetNSLD = monthlyTargets[`${historyYear}-${m.month}`] || 110;
      const isPastPeriod = historyYear === 2025 || m.month <= 6;

      return {
        month: `T${m.month}`,
        monthFullName: `Tháng ${m.month}`,
        monthNum: m.month,
        actualNSLD: actualNSLD,
        nsld2025: nsld2025,
        targetNSLD: targetNSLD,
        hasActualData: actualNSLD !== null && (isPastPeriod || (historyYear === 2026 && m.month === 7)),
      };
    });
  }, [historyYear, metrics2025, processedMetrics2026, monthlyTargets]);

  // Biểu đồ so sánh NSLĐ lũy kế cả năm của năm 2025 và năm 2026 (chỉ thể hiện năm thôi không cần tháng)
  const yearlyCumulativeCompareData = useMemo(() => {
    const calcYearly = (metrics: MonthlyMetric[]) => {
      // Ưu tiên tính lũy kế theo tổng sản phẩm quy đổi và tổng ngày công của các tháng đã điền
      const filled = metrics.filter(m => m.equivalentProducts !== null && m.productionMandays !== null && m.productionMandays > 0);
      if (filled.length > 0) {
        const sumEq = filled.reduce((sum, m) => sum + (m.equivalentProducts || 0), 0);
        const sumDays = filled.reduce((sum, m) => sum + (m.productionMandays || 0), 0);
        return Number(((sumEq / sumDays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(1));
      }
      // Nếu không có, lấy trung bình cộng của các tháng có dữ liệu NSLĐ nhập trực tiếp
      const filledNSLD = metrics.filter(m => m.laborProductivityPercent !== null);
      if (filledNSLD.length > 0) {
        return Number((filledNSLD.reduce((sum, m) => sum + (m.laborProductivityPercent || 0), 0) / filledNSLD.length).toFixed(1));
      }
      return 0;
    };

    const val2025 = calcYearly(metrics2025);
    const val2026 = calcYearly(processedMetrics2026);

    return [
      {
        name: "Lũy Kế Cả Năm",
        "Năm 2025": val2025,
        "Năm 2026": val2026,
      }
    ];
  }, [metrics2025, processedMetrics2026]);


  // Helper to get previous day formatted as YYYY-MM-DD safely
  const getPreviousDayStr = (dateStr: string): string => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return "";
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // 0-indexed
    const day = parseInt(parts[2]);
    const date = new Date(year, month, day);
    date.setDate(date.getDate() - 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };


  const dailySummaries = useMemo(() => {
    const groups: { [date: string]: ProductionLog[] } = {};
    const filteredLogs = filterDivision === "ALL" 
      ? productionLogs 
      : productionLogs.filter(log => log.productGroup === filterDivision);
      
    filteredLogs.forEach((log) => {
      if (!groups[log.date]) {
        groups[log.date] = [];
      }
      groups[log.date].push(log);
    });

    const summaryList = Object.keys(groups).map((date) => {
      const logs = groups[date];
      const totalActual = logs.reduce((sum, l) => sum + (l.actualUnits || 0), 0);
      const totalEquivalent = logs.reduce((sum, l) => sum + (l.equivalentProducts || 0), 0);

      // Nhóm theo shift & line để tính số công thực tế không bị nhân bản
      const shiftLineWorkers: { [key: string]: number } = {};
      logs.forEach((log) => {
        const key = `${log.shift}_${log.lineId}`;
        shiftLineWorkers[key] = Math.max(shiftLineWorkers[key] || 0, log.workersCount || 0);
      });
      const totalWorkers = Object.values(shiftLineWorkers).reduce((sum, w) => sum + (w || 0), 0);

      const avgProductivity = (totalWorkers > 0 && !Number.isNaN(totalEquivalent) && !Number.isNaN(totalWorkers))
        ? Number(((totalEquivalent / totalWorkers) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2))
        : 0;

      const uniqueProducts = Array.from(new Set(logs.map((l) => l.productName)));
      const uniqueLines = Array.from(new Set(logs.map((l) => l.lineName)));
      const shiftCount = Array.from(new Set(logs.map((l) => l.shift))).length;

      return {
        date,
        totalActual,
        totalEquivalent,
        totalWorkers,
        avgProductivity,
        uniqueProducts,
        uniqueLines,
        shiftCount,
        recordsCount: logs.length,
      };
    });

    return summaryList.sort((a, b) => b.date.localeCompare(a.date));
  }, [productionLogs, filterDivision]);

  const logsDates = useMemo(() => {
    const dates = Array.from(new Set(productionLogs.map((l) => l.date))) as string[];
    return dates.sort((a, b) => b.localeCompare(a));
  }, [productionLogs]);

  const displayProductionLogs = useMemo(() => {
    return productionLogs.filter((log) => {
      const matchDivision = filterDivision === "ALL" || log.productGroup === filterDivision;
      const matchDate = recordsFilterDate === "ALL" || log.date === recordsFilterDate;
      return matchDivision && matchDate;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.shift.localeCompare(a.shift));
  }, [productionLogs, filterDivision, recordsFilterDate]);

  const displayDailySummaries = useMemo(() => {
    if (recordsFilterDate === "ALL") return dailySummaries;
    return dailySummaries.filter(summary => summary.date === recordsFilterDate);
  }, [dailySummaries, recordsFilterDate]);

  const hourlyChartData = useMemo(() => {
    const targetDate = recordsFilterDate;
    const filteredLogs = productionLogs.filter((log) => {
      const matchDate = targetDate === "ALL" || log.date === targetDate;
      const matchDivision = filterDivision === "ALL" || log.productGroup === filterDivision;
      return matchDate && matchDivision;
    });

    const slotsMap = [
      { key: "8H - 9H", label: "08:00 - 09:00" },
      { key: "9H - 10H", label: "09:00 - 10:00" },
      { key: "10H - 11H", label: "10:00 - 11:00" },
      { key: "11H - 12H", label: "11:00 - 12:00" },
      { key: "13H - 14H", label: "13:00 - 14:00" },
      { key: "14H - 15H", label: "14:00 - 15:00" },
      { key: "15H - 16H", label: "15:00 - 16:00" },
      { key: "16H - 17H", label: "16:00 - 17:00" },
      { key: "17H - 18H", label: "17:00 - 18:00" },
      { key: "18H - 19H", label: "18:00 - 19:00" },
      { key: "19H - 20H", label: "19:00 - 20:00" },
    ];

    return slotsMap.map(({ key, label }) => {
      let qty = 0;
      let eqQty = 0;
      
      const shiftWorkersMap: { [shiftKey: string]: number } = {};

      filteredLogs.forEach((log) => {
        if (log.hourlyActuals && log.hourlyActuals[key] !== undefined) {
          const val = log.hourlyActuals[key] || 0;
          qty += val;
          eqQty += Math.round(val * log.equivalentFactor);
          
          // Get unique worker count for this shift-hour
          const shiftKey = `${log.date}_${log.lineId}_${log.shift}`;
          if (!shiftWorkersMap[shiftKey]) {
            shiftWorkersMap[shiftKey] = (log.hourlyWorkers && log.hourlyWorkers[key]) || log.workersCount || 0;
          }
        }
      });
      
      const sumWorkers = Object.values(shiftWorkersMap).reduce((a, b) => a + b, 0);
      let nslđ: number | null = null;
      if (sumWorkers > 0) {
        // standardQtyPerManday is per 8h, so per hour is standardQtyPerManday / 8
        const hourlyStandard = INDUSTRIAL_STANDARDS.standardQtyPerManday / 8;
        nslđ = Number(((eqQty / (sumWorkers * hourlyStandard)) * 100).toFixed(1));
      }

      return {
        slotName: label,
        "Sản lượng (Cái)": qty,
        "Quy đổi (SP)": eqQty,
        "NSLĐ Đạt (%)": nslđ,
      };
    });
  }, [productionLogs, filterDivision, recordsFilterDate]);


  const formHourlyChartData = useMemo(() => {
    return formSlots.map(slot => {
      let sumEqRO = 0;
      let sumEqRMA = 0;
      let sumEqBG = 0;
      formModelItems.forEach(item => {
        const p = products.find(x => x.id === item.productId) || products[0];
        if (!p) return;
        if (p.group === "RMA") {
          sumEqRMA += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
        } else if (p.group === "MLN") {
          const isRMA = p.name.toLowerCase().includes("rma") || p.code.toLowerCase().includes("rma") || p.id.toLowerCase().includes("rma");
          if (isRMA) {
            sumEqRMA += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
          } else {
            sumEqRO += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
          }
        } else if (p.group === "BG") {
          sumEqBG += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
        }
      });

      const workersRO = (formOfficialWorkersRO[slot] || 0) + (formSeasonalWorkersRO[slot] || 0);
      const workersRMA = (formOfficialWorkersRMA[slot] || 0) + (formSeasonalWorkersRMA[slot] || 0);
      const workersBG = (formOfficialWorkersBG[slot] || 0) + (formSeasonalWorkersBG[slot] || 0);

      let prodPctRO = 0;
      if (workersRO > 0) {
        prodPctRO = Number(((sumEqRO / (workersRO * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
      }
      
      let prodPctRMA = 0;
      if (workersRMA > 0) {
        prodPctRMA = Number(((sumEqRMA / (workersRMA * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
      }

      let prodPctBG = 0;
      if (workersBG > 0) {
        prodPctBG = Number(((sumEqBG / (workersBG * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
      }

      const totalWorkers = workersRO + workersRMA + workersBG;
      const totalEq = sumEqRO + sumEqRMA + sumEqBG;
      let prodPctDCLR = 0;
      if (totalWorkers > 0) {
        prodPctDCLR = Number(((totalEq / (totalWorkers * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
      }

      return {
        slot,
        "DCRO": prodPctRO,
        "DCRMA": prodPctRMA,
        "DCBG": prodPctBG,
        "DCLR": prodPctDCLR
      };
    });
  }, [formSlots, formModelItems, products, formOfficialWorkersRO, formSeasonalWorkersRO, formOfficialWorkersRMA, formSeasonalWorkersRMA, formOfficialWorkersBG, formSeasonalWorkersBG]);

  // --- EVENT HANDLERS ---
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (!newDate) return;
    
    const today = new Date();
    const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
    
    if (newDate < todayStr) {
      setPendingPastDate(newDate);
    } else {
      setFormDate(newDate);
    }
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();

    const targetLine = SUNHOUSE_LINES.find((l) => l.id === formLineId) || SUNHOUSE_LINES[0];

    // Kiểm tra tính hợp lệ của danh sách model
    if (formModelItems.length === 0) {
      setFormMessage("⚠️ Vui lòng thêm ít nhất một model sản phẩm");
      return;
    }

    if (formWorkersCount <= 0) {
      setFormMessage(`⚠️ Tổng số công nhân tham gia phải lớn hơn 0`);
      return;
    }

    let totalEquivalent = 0;

    for (const item of formModelItems) {
      const actualUnits = Object.keys(item.hourlyActuals).reduce((sum, key) => sum + (item.hourlyActuals[key] || 0), 0);
      if (actualUnits < 0) {
        const prodDef = products.find((p) => p.id === item.productId) || products[0];
        setFormMessage(`⚠️ Sản lượng hoàn thành cho model "${prodDef.name}" không được âm`);
        return;
      }
      const prodDef = products.find((p) => p.id === item.productId) || products[0];
      totalEquivalent += Math.round(actualUnits * prodDef.factor);
    }

    // Tạo danh sách bản ghi mới cho từng model trong ca
    const newLogs: ProductionLog[] = formModelItems.map((item, idx) => {
      const prodDef = products.find((p) => p.id === item.productId) || products[0];
      const actualUnits = Object.keys(item.hourlyActuals).reduce((sum, key) => sum + (item.hourlyActuals[key] || 0), 0);
      const equivalentProducts = Math.round(actualUnits * prodDef.factor);

      // Determine Line ID & Name based on Product Group
      const isMLN = prodDef.group === "MLN";
      const isRMA = prodDef.group === "RMA" || prodDef.name.toLowerCase().includes("rma") || prodDef.code.toLowerCase().includes("rma") || prodDef.id.toLowerCase().includes("rma");
      
      let lineId = "line-bg-02";
      let lineName = "DCBG";
      let workersCount = formWorkersCountBG;
      let officialWorkers = formOfficialCountBG;
      let seasonalWorkers = formSeasonalCountBG;
      let hourlyWorkers = formHourlyWorkersBG;
      let hourlyOfficialWorkers = formOfficialWorkersBG;
      let hourlySeasonalWorkers = formSeasonalWorkersBG;
      let laborProductivityPercent = formAggregates.avgProductivityBG;

      if (isRMA) {
        lineId = "line-rma-03";
        lineName = "DCRMA";
        workersCount = formWorkersCountRMA;
        officialWorkers = formOfficialCountRMA;
        seasonalWorkers = formSeasonalCountRMA;
        hourlyWorkers = formHourlyWorkersRMA;
        hourlyOfficialWorkers = formOfficialWorkersRMA;
        hourlySeasonalWorkers = formSeasonalWorkersRMA;
        laborProductivityPercent = formAggregates.avgProductivityRMA;
      } else if (isMLN) {
        lineId = "line-mln-01";
        lineName = "DCRO";
        workersCount = formWorkersCountRO;
        officialWorkers = formOfficialCountRO;
        seasonalWorkers = formSeasonalCountRO;
        hourlyWorkers = formHourlyWorkersRO;
        hourlyOfficialWorkers = formOfficialWorkersRO;
        hourlySeasonalWorkers = formSeasonalWorkersRO;
        laborProductivityPercent = formAggregates.avgProductivityRO;
      }

      return {
        id: "log-" + (productionLogs.length + idx + 1) + "-" + Date.now() + "-" + idx,
        date: formDate,
        lineId,
        lineName,
        productId: item.productId,
        productName: prodDef.name,
        productGroup: prodDef.group,
        actualUnits,
        workersCount,
        officialWorkers,
        seasonalWorkers,
        equivalentFactor: prodDef.factor,
        equivalentProducts,
        laborProductivityPercent,
        shift: formShift,
        technicianName: formTechnician,
        hourlyActuals: item.hourlyActuals,
        hourlyWorkers,
        hourlyOfficialWorkers,
        hourlySeasonalWorkers,
      };
    });

    setProductionLogs((prev) => {
      const filtered = prev.filter((log) => log.date !== formDate || log.shift !== formShift);
      return [...newLogs, ...filtered];
    });

    setFormMessage(`✅ Đã lưu ${newLogs.length} bản ghi nhật ký ca thành công & cập nhật KPI!`);

    // Reset form fields
    resetFormFields();

    // Xóa thông báo sau 4 giây
    setTimeout(() => {
      setFormMessage("");
    }, 4000);
  };

  const resetFormFields = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormLineId(SUNHOUSE_LINES[0].id);
    setFormShift("Ca HC (08:00 - 17:00)");
    setFormSlots(getShiftSlots("Ca HC (08:00 - 17:00)"));
    setFormOfficialWorkersRO({});
    setFormSeasonalWorkersRO({});
    setFormOfficialWorkersRMA({});
    setFormSeasonalWorkersRMA({});
    setFormOfficialWorkersBG({});
    setFormSeasonalWorkersBG({});
    setFormModelItems(() => [{
      productId: SUNHOUSE_PRODUCTS[0].id,
      hourlyActuals: {},
    }]);
    setFormTechnician("Nguyễn Minh Hoàng Khiêm ( DCLR )");
  };

  const handleDeleteLog = (id: string) => {
    setProductionLogs((prev) => prev.filter((log) => log.id !== id));
    setFormMessage("❌ Đã xóa bản ghi nhật ký ca thành công.");
    setTimeout(() => {
      setFormMessage("");
    }, 3500);
  };

  const handleEditLog = (date: string, shift: string) => {
    const logsForDate = productionLogs.filter(l => l.date === date && l.shift === shift);
    if (logsForDate.length === 0) return;

    const firstLog = logsForDate[0];
    setFormDate(date);
    setFormShift(firstLog.shift as any);
    setFormTechnician(firstLog.technicianName);

    // Thu thập tất cả các slots được sử dụng
    const allSlots = new Set<string>();
    logsForDate.forEach(log => {
      if (log.hourlyActuals) {
        Object.keys(log.hourlyActuals).forEach(slot => allSlots.add(slot));
      }
    });
    
    // Đảm bảo các slots mặc định cũng có mặt nếu shift là mặc định
    const defaultSlots = getShiftSlots(firstLog.shift);
    defaultSlots.forEach(s => allSlots.add(s));
    
    const sortedSlots = Array.from(allSlots).sort((a, b) => {
      const hA = parseInt(a.split("H")[0]);
      const hB = parseInt(b.split("H")[0]);
      return hA - hB;
    });
    setFormSlots(sortedSlots);

    // Tái cấu trúc formModelItems
    const newFormModelItems: FormModelItem[] = logsForDate.map(log => ({
      id: "item-" + log.productId + "-" + Date.now() + Math.random(),
      productId: log.productId,
      dailyPlan: 0,
      hourlyActuals: log.hourlyActuals || {}
    }));
    setFormModelItems(newFormModelItems);

    // Khôi phục nhân sự
    setFormOfficialWorkersRO({});
    setFormSeasonalWorkersRO({});
    setFormOfficialWorkersRMA({});
    setFormSeasonalWorkersRMA({});
    setFormOfficialWorkersBG({});
    setFormSeasonalWorkersBG({});

    logsForDate.forEach(log => {
      const isRMA = log.lineId === "line-rma-03";
      const isMLN = log.lineId === "line-mln-01";
      const isBG = log.lineId === "line-bg-02";

      if (isRMA) {
        if (log.hourlyOfficialWorkers) {
          setFormOfficialWorkersRMA(prev => ({ ...prev, ...log.hourlyOfficialWorkers }));
        } else if (log.hourlyWorkers) {
          setFormOfficialWorkersRMA(prev => ({ ...prev, ...log.hourlyWorkers }));
        }
        if (log.hourlySeasonalWorkers) {
          setFormSeasonalWorkersRMA(prev => ({ ...prev, ...log.hourlySeasonalWorkers }));
        }
      } else if (isMLN) {
        if (log.hourlyOfficialWorkers) {
          setFormOfficialWorkersRO(prev => ({ ...prev, ...log.hourlyOfficialWorkers }));
        } else if (log.hourlyWorkers) {
          setFormOfficialWorkersRO(prev => ({ ...prev, ...log.hourlyWorkers }));
        }
        if (log.hourlySeasonalWorkers) {
          setFormSeasonalWorkersRO(prev => ({ ...prev, ...log.hourlySeasonalWorkers }));
        }
      } else if (isBG) {
        if (log.hourlyOfficialWorkers) {
          setFormOfficialWorkersBG(prev => ({ ...prev, ...log.hourlyOfficialWorkers }));
        } else if (log.hourlyWorkers) {
          setFormOfficialWorkersBG(prev => ({ ...prev, ...log.hourlyWorkers }));
        }
        if (log.hourlySeasonalWorkers) {
          setFormSeasonalWorkersBG(prev => ({ ...prev, ...log.hourlySeasonalWorkers }));
        }
      }
    });

    setActiveTab("logging");
    setLoggingSubTab("records"); 
    setFormMessage("🔄 Đã tải dữ liệu nhật ký ngày " + date + " lên form để chỉnh sửa. Sau khi sửa xong, nhấn 'Lưu Nhật Ký Ca' để cập nhật.");
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShiftChange = (newShift: "Ca HC (08:00 - 17:00)" | "Ca HC (08:00 - 19h)" | "Ca HC (08:00 - 20h00)") => {
    setFormShift(newShift);
    const slots = getShiftSlots(newShift);
    setFormSlots(slots);
    setFormModelItems((prev) =>
      prev.map((item) => {
        const nextHourly: { [key: string]: number } = {};
        slots.forEach((s) => {
          nextHourly[s] = item.hourlyActuals[s] !== undefined ? item.hourlyActuals[s] : 0;
        });
        return {
          ...item,
          hourlyActuals: nextHourly,
        };
      })
    );
    setFormOfficialWorkersRO((prev) => {
      const nextWorkers: { [key: string]: number } = {};
      slots.forEach((s) => {
        nextWorkers[s] = prev[s] !== undefined ? prev[s] : 0;
      });
      return nextWorkers;
    });
    setFormSeasonalWorkersRO((prev) => {
      const nextWorkers: { [key: string]: number } = {};
      slots.forEach((s) => {
        nextWorkers[s] = prev[s] !== undefined ? prev[s] : 0;
      });
      return nextWorkers;
    });
    setFormOfficialWorkersBG((prev) => {
      const nextWorkers: { [key: string]: number } = {};
      slots.forEach((s) => {
        nextWorkers[s] = prev[s] !== undefined ? prev[s] : 0;
      });
      return nextWorkers;
    });
    setFormSeasonalWorkersBG((prev) => {
      const nextWorkers: { [key: string]: number } = {};
      slots.forEach((s) => {
        nextWorkers[s] = prev[s] !== undefined ? prev[s] : 0;
      });
      return nextWorkers;
    });
  };

  const handleAddSlot = () => {
    if (!newSlotInput.trim()) return;
    const cleanSlot = formatSlotLabel(newSlotInput.trim());
    if (formSlots.includes(cleanSlot)) {
      setFormMessage("⚠️ Khung giờ đã tồn tại");
      return;
    }
    setFormSlots((prev) => {
      const nextSlots = [...prev, cleanSlot];
      return nextSlots.sort((a, b) => {
        const hourA = parseInt(a.match(/^(\d+)/)?.[1] || "0", 10);
        const hourB = parseInt(b.match(/^(\d+)/)?.[1] || "0", 10);
        return hourA - hourB;
      });
    });
    setFormOfficialWorkersRO((prev) => ({ ...prev, [cleanSlot]: 0 }));
    setFormSeasonalWorkersRO((prev) => ({ ...prev, [cleanSlot]: 0 }));
    setFormOfficialWorkersBG((prev) => ({ ...prev, [cleanSlot]: 0 }));
    setFormSeasonalWorkersBG((prev) => ({ ...prev, [cleanSlot]: 0 }));
    setFormModelItems((prev) =>
      prev.map((item) => ({
        ...item,
        hourlyActuals: { ...item.hourlyActuals, [cleanSlot]: 0 },
      }))
    );
    setNewSlotInput("");
    setFormMessage(`✅ Đã thêm khung giờ ${cleanSlot} thành công!`);
    setTimeout(() => setFormMessage(""), 3500);
  };

  const handleDeleteSlot = (slotToDelete: string) => {
    setFormSlots((prev) => prev.filter((s) => s !== slotToDelete));
    setFormMessage(`❌ Đã xóa khung giờ ${slotToDelete}.`);
    setTimeout(() => setFormMessage(""), 3500);
  };

  const handleUpdateOfficialWorkerRO = (slot: string, value: number) => {
    setFormOfficialWorkersRO((prev) => ({
      ...prev,
      [slot]: value,
    }));
  };

  const handleUpdateSeasonalWorkerRO = (slot: string, value: number) => {
    setFormSeasonalWorkersRO((prev) => ({
      ...prev,
      [slot]: value,
    }));
  };

  const handleUpdateOfficialWorkerRMA = (slot: string, value: number) => {
    setFormOfficialWorkersRMA((prev) => ({
      ...prev,
      [slot]: value,
    }));
  };

  const handleUpdateSeasonalWorkerRMA = (slot: string, value: number) => {
    setFormSeasonalWorkersRMA((prev) => ({
      ...prev,
      [slot]: value,
    }));
  };

  const handleUpdateOfficialWorkerBG = (slot: string, value: number) => {
    setFormOfficialWorkersBG((prev) => ({
      ...prev,
      [slot]: value,
    }));
  };

  const handleUpdateSeasonalWorkerBG = (slot: string, value: number) => {
    setFormSeasonalWorkersBG((prev) => ({
      ...prev,
      [slot]: value,
    }));
  };

  const handleAddNewItem = () => {
    const slots = formSlots;
    const initialHrs: { [key: string]: number } = {};
    slots.forEach((s) => {
      initialHrs[s] = 0;
    });
    
    const availableProducts = filterDivision === "ALL" 
      ? products 
      : products.filter(p => p.group === filterDivision);
    const defaultProdId = availableProducts[0]?.id || products[0]?.id || "mln-01";
    const [year, month, day] = formDate.split("-");
    const ym = `${year}-${month}`;
    const dayNum = parseInt(day);
    const planVal = (monthlyPlan[ym]?.[defaultProdId]?.[dayNum]) || 0;

    setFormModelItems((prev) => [
      ...prev,
      {
        id: "item-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        productId: defaultProdId,
        dailyPlan: planVal,
        hourlyActuals: initialHrs,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setFormModelItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<FormModelItem>) => {
    const itemToUpdate = formModelItems.find(it => it.id === id);
    if (!itemToUpdate) return;

    const currentProductId = updates.productId || itemToUpdate.productId;

    // Nếu người dùng thay đổi dailyPlan, ta cập nhật ngược lại vào monthlyPlan cho ngày hiện tại làm base plan đúng
    if (updates.dailyPlan !== undefined) {
      const [year, month, day] = formDate.split("-");
      const ym = `${year}-${month}`;
      const dayNum = parseInt(day);
      if (!isNaN(dayNum)) {
        setMonthlyPlan((prev) => {
          const next = { ...prev };
          if (!next[ym]) next[ym] = {};
          if (!next[ym][currentProductId]) {
            next[ym][currentProductId] = {};
          }
          next[ym][currentProductId][dayNum] = updates.dailyPlan!;
          return next;
        });
      }
    }

    setFormModelItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newUpdates = { ...updates };
        
        // Auto-fill dailyPlan if productId changed
        if (updates.productId && updates.productId !== item.productId) {
          const [year, month, day] = formDate.split("-");
          const ym = `${year}-${month}`;
          const dayNum = parseInt(day);
          newUpdates.dailyPlan = (monthlyPlan[ym]?.[updates.productId]?.[dayNum]) || 0;
        }
        
        return { ...item, ...newUpdates };
      })
    );
  };

  const handleUpdateItemHourly = (id: string, slotName: string, qty: number) => {
    setFormModelItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          hourlyActuals: {
            ...item.hourlyActuals,
            [slotName]: qty,
          },
        };
      })
    );
  };

  // === XỬ LÝ LƯU EXCEL BÁO CÁO HÀNG NGÀY CHUYÊN NGHIỆP ===
  const handleSaveExcelReport = (e: React.FormEvent) => {
    e.preventDefault();
    setExcelMessage("");

    if (editorLine === "gas") {
      // 1. Cập nhật ngày được chọn
      const updatedGas = gasDailyReports.map((row) => {
        if (row.date === editorDate) {
          const totalCong = Number((egGasStove + egSeasonalGas + egRmaGas).toFixed(3));
          const totalOutput = egOutputStove + egOutputRma;
          const dmSl = Number((totalCong * 9.03).toFixed(3));
          const nsPercent = dmSl > 0 ? Number((totalOutput / dmSl * 100).toFixed(1)) : 0;
          const tlDiLam = (egNhanSuLineGas + egNhanSuNghiGas) > 0
            ? Number((egNhanSuLineGas / (egNhanSuLineGas + egNhanSuNghiGas) * 100).toFixed(1))
            : 100;

          return {
            ...row,
            congGasStove: egGasStove,
            congSeasonal: egSeasonalGas,
            congRma: egRmaGas,
            outputStove: egOutputStove,
            outputRma: egOutputRma,
            dinhmucSlTheoNs: dmSl,
            nsldTheoNgay: nsPercent,
            tongNhanSuLine: egNhanSuLineGas,
            nhansuNghi: egNhanSuNghiGas,
            tileDiLam: tlDiLam
          };
        }
        return row;
      });

      // 2. Định nghĩa hàm tính gộp cho một khoảng ngày của Bếp Gas
      const recomputeGasWeek = (tempReports: DailyReportRowGas[], weekSymbol: string, dates: string[]) => {
        const weekDays = tempReports.filter((r) => dates.includes(r.date) && !r.isSummary && !r.isOff);
        
        let sumCongGas = 0;
        let sumCongSeas = 0;
        let sumCongRma = 0;
        let sumOutStove = 0;
        let sumOutRma = 0;
        let sumNsDiLam = 0;
        let sumNsNghi = 0;

        weekDays.forEach((d) => {
          sumCongGas += Number(d.congGasStove || 0);
          sumCongSeas += Number(d.congSeasonal || 0);
          sumCongRma += Number(d.congRma || 0);
          sumOutStove += Number(d.outputStove || 0);
          sumOutRma += Number(d.outputRma || 0);
          sumNsDiLam += Number(d.tongNhanSuLine || 0);
          sumNsNghi += Number(d.nhansuNghi || 0);
        });

        const totalCong = Number((sumCongGas + sumCongSeas + sumCongRma).toFixed(3));
        const totalOut = sumOutStove + sumOutRma;
        const totalDm = Number((totalCong * 9.03).toFixed(3));
        const weekNs = totalDm > 0 ? Number((totalOut / totalDm * 100).toFixed(1)) : 0;
        const weekTlDiLam = (sumNsDiLam + sumNsNghi) > 0 ? Number((sumNsDiLam / (sumNsDiLam + sumNsNghi) * 100).toFixed(1)) : 100;

        return tempReports.map((row) => {
          if (row.date === weekSymbol && row.isSummary) {
            return {
              ...row,
              congGasStove: Number(sumCongGas.toFixed(3)),
              congSeasonal: Number(sumCongSeas.toFixed(3)),
              congRma: Number(sumCongRma.toFixed(3)),
              outputStove: sumOutStove,
              outputRma: sumOutRma,
              dinhmucSlTheoNs: totalDm,
              nsldTheoNgay: weekNs,
              tongNhanSuLine: sumNsDiLam,
              nhansuNghi: sumNsNghi,
              tileDiLam: weekTlDiLam
            };
          }
          return row;
        });
      };

      // 3. Tự động tính toán tuần
      let withRecalcs = [...updatedGas];
      withRecalcs = recomputeGasWeek(withRecalcs, "W1", ["01-Jun", "03-Jun", "04-Jun"]);
      withRecalcs = recomputeGasWeek(withRecalcs, "W2", ["05-Jun", "06-Jun", "07-Jun", "08-Jun", "09-Jun", "10-Jun", "11-Jun"]);
      withRecalcs = recomputeGasWeek(withRecalcs, "W3", ["12-Jun"]);

      setGasDailyReports(withRecalcs);
      setExcelMessage("✅ Đã cập nhật thành công Báo cáo Bếp Gas và tự động tính toán lại dữ liệu Tuần & Tổng hợp KPI!");
    } else {
      // ASSEMBLY LINE
      // 1. Cập nhật ngày được chọn
      const updatedAssembly = assemblyDailyReports.map((row) => {
        if (row.date === editorDate) {
          const totalCong = Number((egAssemblyChinh + egAssemblyThoiVu).toFixed(3));
          const totalOutput = egAssemblyOutputLine;
          const dmSl = Number((totalCong * 9.03).toFixed(3));
          const nsPercent = dmSl > 0 ? Number((totalOutput / dmSl * 100).toFixed(1)) : 0;
          const tlKhsx = egAssemblyKhsx > 0 ? Number((totalOutput / egAssemblyKhsx * 100).toFixed(1)) : 0;
          const tlDiLam = (egAssemblyNhanSuDiLam + egAssemblyNhanSuNghi) > 0
            ? Number((egAssemblyNhanSuDiLam / (egAssemblyNhanSuDiLam + egAssemblyNhanSuNghi) * 100).toFixed(1))
            : 100;

          return {
            ...row,
            congChinhThuc: egAssemblyChinh,
            congThoiVu: egAssemblyThoiVu,
            outputLineChinh: totalOutput,
            dinhmucSlTheoNs: dmSl,
            nsldTheoNgay: nsPercent,
            khsxNgay: egAssemblyKhsx,
            tileHoanThanhKhsx: tlKhsx,
            tongNhanSuLineDiLam: egAssemblyNhanSuDiLam,
            tongNhansuNghi: egAssemblyNhanSuNghi,
            tileDiLam: tlDiLam
          };
        }
        return row;
      });

      // 2. Hàm tính gộp cho Assembly Week
      const recomputeAssemWeek = (tempReports: DailyReportRowAssembly[], weekSymbol: string, dates: string[]) => {
        const weekDays = tempReports.filter((r) => dates.includes(r.date) && !r.isSummary);
        
        let sumCongChinh = 0;
        let sumCongThoivu = 0;
        let sumOutput = 0;
        let sumKhsx = 0;
        let sumNsDiLam = 0;
        let sumNsNghi = 0;

        weekDays.forEach((d) => {
          sumCongChinh += Number(d.congChinhThuc || 0);
          sumCongThoivu += Number(d.congThoiVu || 0);
          sumOutput += Number(d.outputLineChinh || 0);
          sumKhsx += Number(d.khsxNgay || 0);
          sumNsDiLam += Number(d.tongNhanSuLineDiLam || 0);
          sumNsNghi += Number(d.tongNhansuNghi || 0);
        });

        const totalCong = Number((sumCongChinh + sumCongThoivu).toFixed(3));
        const totalDm = Number((totalCong * 9.03).toFixed(3));
        const weekNs = totalDm > 0 ? Number((sumOutput / totalDm * 100).toFixed(1)) : 0;
        const weekKhPercent = sumKhsx > 0 ? Number((sumOutput / sumKhsx * 100).toFixed(1)) : 0;
        const weekTlDiLam = (sumNsDiLam + sumNsNghi) > 0 ? Number((sumNsDiLam / (sumNsDiLam + sumNsNghi) * 100).toFixed(1)) : 100;

        return tempReports.map((row) => {
          if (row.date === weekSymbol && row.isSummary) {
            return {
              ...row,
              congChinhThuc: Number(sumCongChinh.toFixed(3)),
              congThoiVu: Number(sumCongThoivu.toFixed(3)),
              outputLineChinh: sumOutput,
              dinhmucSlTheoNs: totalDm,
              nsldTheoNgay: weekNs,
              khsxNgay: sumKhsx,
              tileHoanThanhKhsx: weekKhPercent,
              tongNhanSuLineDiLam: sumNsDiLam,
              tongNhansuNghi: sumNsNghi,
              tileDiLam: weekTlDiLam
            };
          }
          return row;
        });
      };

      // 3. Tự động tính toán tuần cho Assembly
      let withRecalcs = [...updatedAssembly];
      withRecalcs = recomputeAssemWeek(withRecalcs, "W22/T6", ["01-Jun", "02-Jun", "03-Jun", "04-Jun"]);
      withRecalcs = recomputeAssemWeek(withRecalcs, "W23/T6", ["05-Jun", "06-Jun", "08-Jun", "09-Jun", "10-Jun", "11-Jun"]);
      withRecalcs = recomputeAssemWeek(withRecalcs, "W24/T6", ["12-Jun", "13-Jun"]);

      setAssemblyDailyReports(withRecalcs);
      setExcelMessage("✅ Đã cập nhật thành công Báo cáo Lắp ráp và tự động tính toán lại dữ liệu Tuần & Tổng hợp KPI!");
    }

    // Tự xoá tin nhắn sau 5 giây
    setTimeout(() => {
      setExcelMessage("");
    }, 5000);
  };

  const handleResetExcelReports = () => {
    if (confirm("Khôi phục toàn bộ các báo cáo hàng ngày (Bếp gas, Lắp ráp, Tổng hợp) về số liệu gốc ban đầu?")) {
      setGasDailyReports(INITIAL_GAS_DAILY_REPORTS);
      setAssemblyDailyReports(INITIAL_ASSEMBLY_DAILY_REPORTS);
      localStorage.removeItem("sunhouse_gas_daily_reports_v2");
      localStorage.removeItem("sunhouse_assembly_daily_reports_v2");
      setExcelMessage("🔄 Đã khôi phục dữ liệu Excel gốc.");
      setTimeout(() => setExcelMessage(""), 3000);
    }
  };

  const handleResetLogs = () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục về trạng thái dữ liệu mẫu ban đầu?")) {
      setProductionLogs(INITIAL_PRODUCTION_LOGS);
      setMetrics2025(HISTORICAL_2025);
      setMetrics2026(HISTORICAL_2026);
      const resetProducts = SUNHOUSE_PRODUCTS.map(p => ({
        ...p,
        price: p.group === "MLN" ? 4500000 : 1800000
      }));
      setProducts(resetProducts);
      localStorage.removeItem("sunhouse_production_logs");
      localStorage.removeItem("sunhouse_metrics_2025_v2");
      localStorage.removeItem("sunhouse_metrics_2026_v2");
      localStorage.removeItem("sunhouse_products_v2");
      setFormMessage("🔄 Đã khôi phục dữ liệu ban đầu.");
      setTimeout(() => setFormMessage(""), 3000);
    }
  };

  const handleEditProductClick = (prod: ProductDefinition) => {
    setEditingProductId(prod.id);
    setProdFormName(prod.name);
    setProdFormCode(prod.code);
    setProdFormGroup(prod.group);
    setProdFormFactor(prod.factor);
    setProdFormPrice(prod.price ?? (prod.group === "MLN" ? 4500000 : 1800000));
    setProdFormDescription(prod.description || "");
    setProdFormMessage("");
  };

  const handleCancelProductEdit = () => {
    setEditingProductId(null);
    setProdFormName("");
    setProdFormCode("");
    setProdFormGroup("MLN");
    setProdFormFactor(1.0);
    setProdFormPrice(2000000);
    setProdFormDescription("");
    setProdFormMessage("");
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormName.trim()) {
      setProdFormMessage("⚠️ Vui lòng nhập tên sản phẩm");
      return;
    }
    if (!prodFormCode.trim()) {
      setProdFormMessage("⚠️ Vui lòng nhập mã model");
      return;
    }

    if (editingProductId) {
      // Update existing
      setProducts(prev => prev.map(p => {
        if (p.id === editingProductId) {
          return {
            ...p,
            name: prodFormName,
            code: prodFormCode,
            group: prodFormGroup,
            factor: Number(prodFormFactor),
            price: Number(prodFormPrice),
            description: prodFormDescription
          };
        }
        return p;
      }));
      setProdFormMessage("✅ Đã cập nhật sản phẩm thành công!");
    } else {
      // Add new
      const newId = `prod-new-${Date.now()}`;
      const newProduct: ProductDefinition = {
        id: newId,
        name: prodFormName,
        code: prodFormCode,
        group: prodFormGroup,
        factor: Number(prodFormFactor),
        price: Number(prodFormPrice),
        description: prodFormDescription
      };
      setProducts(prev => [...prev, newProduct]);
      setProdFormMessage("✅ Đã thêm sản phẩm mới thành công!");
    }

    setTimeout(() => {
      handleCancelProductEdit();
    }, 1200);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setProdFormMessage("❌ Đã xóa sản phẩm thành công.");
    setTimeout(() => {
      setProdFormMessage("");
    }, 3000);
  };

  const handleDownloadTemplate = () => {
    const wsData = [
      ["Phân nhóm (MLN hoặc BG)", "Mã Model (Code)", "Tên sản phẩm đầy đủ", "Hệ số quy đổi (Factor)", "Giá bán (VND)", "Mô tả / Ghi chú"],
      ["MLN", "SHA76222KL", "Máy lọc nước RO Sunhouse 11 lõi SHA76222KL", 1.0, 4500000, "Mẫu máy lọc nước chuẩn"],
      ["BG", "SHB3223MT", "Bếp gas dương kính Sunhouse SHB3223MT", 0.8, 1850000, "Bếp gas mới"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách sản phẩm");
    XLSX.writeFile(wb, "Template_Nhap_San_Pham_Sunhouse.xlsx");
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      alert("Không có sản phẩm nào để xuất.");
      return;
    }
    const header = ["Phân nhóm", "Mã Model (Code)", "Tên sản phẩm", "Hệ số quy đổi", "Giá bán (VND)", "Ghi chú"];
    const rows = products.map(p => [
      p.group,
      p.code,
      p.name,
      p.factor,
      p.price,
      p.description || ""
    ]);
    const wsData = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_san_pham");
    XLSX.writeFile(wb, "Danh_sach_san_pham_NMBD.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (data.length < 2) {
          setExcelImportError("⚠️ File Excel rỗng hoặc không đúng định dạng mẫu.");
          return;
        }

        const headers = data[0].map((h: any) => String(h || "").trim());

        // Mapping index based on standard headers used in Export
        let groupIdx = headers.findIndex((h: string) => h === "Phân nhóm" || h.toLowerCase().includes("nhóm") || h.toLowerCase().includes("group"));
        let codeIdx = headers.findIndex((h: string) => h === "Mã Model (Code)" || h.toLowerCase().includes("mã") || h.toLowerCase().includes("model") || h.toLowerCase().includes("code"));
        let nameIdx = headers.findIndex((h: string) => h === "Tên sản phẩm" || h.toLowerCase().includes("tên") || h.toLowerCase().includes("name") || h.toLowerCase().includes("sản phẩm"));
        let factorIdx = headers.findIndex((h: string) => h === "Hệ số quy đổi" || h.toLowerCase().includes("hệ số") || h.toLowerCase().includes("factor") || h.toLowerCase().includes("quy đổi"));
        let priceIdx = headers.findIndex((h: string) => h === "Giá bán (VND)" || h.toLowerCase().includes("giá") || h.toLowerCase().includes("price"));
        let descIdx = headers.findIndex((h: string) => h === "Ghi chú" || h.toLowerCase().includes("mô tả") || h.toLowerCase().includes("desc") || h.toLowerCase().includes("ghi chú"));

        if (groupIdx === -1) groupIdx = 0;
        if (codeIdx === -1) codeIdx = 1;
        if (nameIdx === -1) nameIdx = 2;
        if (factorIdx === -1) factorIdx = 3;
        if (priceIdx === -1) priceIdx = 4;
        if (descIdx === -1) descIdx = 5;

        const newParsedProducts: ProductDefinition[] = [];

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          const rawGroup = String(row[groupIdx] || "").trim();
          const rawCode = String(row[codeIdx] || "").trim();
          const rawName = String(row[nameIdx] || "").trim();
          const rawFactor = row[factorIdx];
          const rawPrice = row[priceIdx];
          const rawDesc = String(row[descIdx] || "").trim();

          if (!rawName && !rawCode) continue;

          let group: ProductGroup = "MLN";
          const groupNormalized = rawGroup.toLowerCase();
          if (groupNormalized.includes("bếp") || groupNormalized.includes("gas") || groupNormalized.includes("bg")) {
            group = "BG";
          }

          const factorNum = Number(rawFactor) || 1.0;
          const priceNum = Number(rawPrice) || (group === "MLN" ? 4500000 : 1800000);

          newParsedProducts.push({
            id: `prod-excel-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            group,
            code: rawCode || getProductModelCode(rawName),
            name: rawName || rawCode,
            factor: factorNum,
            price: priceNum,
            description: rawDesc || `Excel ${new Date().toLocaleDateString("vi-VN")}`
          });
        }

        if (newParsedProducts.length === 0) {
          setExcelImportError("⚠️ Không tìm thấy dòng sản phẩm hợp lệ nào trong file Excel.");
          setParsedExcelProducts([]);
        } else {
          setParsedExcelProducts(newParsedProducts);
          setExcelImportError("");
          setExcelImportSuccess(`📁 Đã đọc thành công ${newParsedProducts.length} sản phẩm từ file. Nhấn "Xác nhận nhập" để lưu.`);
        }
      } catch (error) {
        console.error(error);
        setExcelImportError("⚠️ Lỗi phân tích file Excel. Vui lòng đảm bảo file không bị hỏng và đúng cấu trúc.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmExcelImport = () => {
    if (parsedExcelProducts.length === 0) return;

    setProducts((prev) => {
      const existingMap = new Map<string, ProductDefinition>(prev.map((p) => [p.code.toLowerCase(), p]));

      parsedExcelProducts.forEach((newP) => {
        const key = newP.code.toLowerCase();
        if (existingMap.has(key)) {
          const current = existingMap.get(key)!;
          existingMap.set(key, {
            ...current,
            name: newP.name,
            group: newP.group,
            factor: newP.factor,
            price: newP.price,
            description: newP.description,
          });
        } else {
          // Add new
          existingMap.set(key, newP);
        }
      });

      return Array.from(existingMap.values());
    });

    setExcelImportSuccess(`🎉 Đã nhập/cập nhật thành công ${parsedExcelProducts.length} sản phẩm từ file Excel!`);
    setParsedExcelProducts([]);
    
    // Clear the input file element
    const fileInput = document.getElementById("excel-product-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";

    setTimeout(() => {
      setExcelImportSuccess("");
    }, 4000);
  };

  const handleCancelExcelImport = () => {
    setParsedExcelProducts([]);
    setExcelImportError("");
    setExcelImportSuccess("");
    const fileInput = document.getElementById("excel-product-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleMonthlyPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        let headerRowIdx = -1;
        let dayColMap: { [day: number]: number } = {};
        
        for (let i = 0; i < Math.min(20, data.length); i++) {
          const row = data[i];
          let foundDays = 0;
          let tempMap: { [day: number]: number } = {};
          
          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || "").trim();
            const num = parseInt(cell);
            if (!isNaN(num) && num >= 1 && num <= 31) {
              tempMap[num] = j;
              foundDays++;
            }
          }
          
          if (foundDays >= 28) {
            headerRowIdx = i;
            dayColMap = tempMap;
            break;
          }
        }

        if (headerRowIdx === -1) {
           setFormMessage("⚠️ Không tìm thấy dòng ngày tháng (1-31) trong file Excel!");
           return;
        }

        const [year, month] = formDate.split("-");
        const ym = `${year}-${month}`;
        const newPlan = { ...monthlyPlan };
        if (!newPlan[ym]) newPlan[ym] = {};

        for (let i = headerRowIdx + 1; i < data.length; i++) {
          const row = data[i];
          if (!row) continue;
          const productCode = String(row[0] || "").trim();
          const productName = String(row[1] || "").trim();
          
          if (!productCode && !productName) continue;

          const matchedProduct = products.find(p => p.code === productCode || p.name.includes(productCode) || (productName && p.name.includes(productName)));
          if (matchedProduct) {
             if (!newPlan[ym][matchedProduct.id]) {
                newPlan[ym][matchedProduct.id] = {};
             }
             for (let day = 1; day <= 31; day++) {
                const colIdx = dayColMap[day];
                if (colIdx !== undefined) {
                   const val = parseInt(row[colIdx]);
                   if (!isNaN(val) && val >= 0) {
                      newPlan[ym][matchedProduct.id][day] = val;
                   } else {
                      delete newPlan[ym][matchedProduct.id][day];
                   }
                }
             }
          }
        }

        setMonthlyPlan(newPlan);
        setFormMessage("✅ Đã cập nhật KHSX từ file Excel thành công!");
        setTimeout(() => setFormMessage(""), 3500);

      } catch (err) {
        console.error(err);
        setFormMessage("❌ Lỗi đọc file Excel!");
        setTimeout(() => setFormMessage(""), 3500);
      }
      
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleCopyDayOneToAll = (prodId: string) => {
    const firstDayVal = monthlyPlan[currentYearMonth]?.[prodId]?.[1] || 0;
    setMonthlyPlan((prev) => {
      const next = { ...prev };
      if (!next[currentYearMonth]) next[currentYearMonth] = {};
      if (!next[currentYearMonth][prodId]) next[currentYearMonth][prodId] = {};
      for (let d = 2; d <= 31; d++) {
        next[currentYearMonth][prodId][d] = firstDayVal;
      }
      return next;
    });
    setFormMessage("✅ Đã sao chép giá trị ngày 1 cho toàn bộ tháng!");
    setTimeout(() => setFormMessage(""), 2000);
  };

  const handleClearMonthlyPlanRow = (prodId: string) => {
    const p = products.find(item => item.id === prodId);
    const code = p?.code || prodId;
    setDeletePlanModal({
      isOpen: true,
      prodId,
      code
    });
  };

  const handleDownloadMonthlyPlanTemplate = () => {
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const header = ["Mã hàng", "Tên hàng", ...days];
    
    // Fill with current products and their current plan if exists
    const rows = products.map(p => {
      const row = [p.code, p.name];
      days.forEach(day => {
        row.push(monthlyPlan[currentYearMonth]?.[p.id]?.[day] ?? "");
      });
      return row;
    });

    const wsData = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KHSX_Thang");
    XLSX.writeFile(wb, "Template_KHSX_Thang_Sunhouse.xlsx");
  };

  const handleExportMonthlyPlan = () => {
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const [year, month] = formDate.split("-");
    const header = ["Mã hàng", "Tên hàng", "Phân xưởng", ...days];
    
    // Get products that have a plan for the current month
    const filteredProducts = products.filter(p => 
      (monthlyPlan[currentYearMonth]?.[p.id]) !== undefined && 
      (filterDivision === "ALL" || p.group === filterDivision)
    );

    if (filteredProducts.length === 0) {
      alert("Không có dữ liệu kế hoạch tháng để xuất.");
      return;
    }

    const rows = filteredProducts.map(p => {
      const row = [p.code, p.name, p.group];
      days.forEach(day => {
        row.push(monthlyPlan[currentYearMonth]?.[p.id]?.[day] ?? 0);
      });
      return row;
    });

    const wsData = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KHSX_Thang");
    XLSX.writeFile(wb, `KHSX_Thang_${month}_${year}_${filterDivision}.xlsx`);
  };

  const handleExportFullBackup = () => {
    const wb = XLSX.utils.book_new();

    // 1. Production Logs
    const wsLogs = XLSX.utils.json_to_sheet(productionLogs.map(log => ({
      ...log,
      hourlyActuals: JSON.stringify(log.hourlyActuals || {}),
      hourlyWorkers: JSON.stringify(log.hourlyWorkers || {})
    })));
    XLSX.utils.book_append_sheet(wb, wsLogs, "Production_Logs");

    // 2. Products
    const wsProducts = XLSX.utils.json_to_sheet(products);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Products");

    // 3. Monthly Plan (Flattened)
    const flattenedPlan: any[] = [];
    Object.keys(monthlyPlan).forEach(ym => {
      Object.keys(monthlyPlan[ym]).forEach(prodId => {
        const row: any = { yearMonth: ym, productId: prodId };
        for (let d = 1; d <= 31; d++) {
          row[`day_${d}`] = monthlyPlan[ym][prodId][d] ?? "";
        }
        flattenedPlan.push(row);
      });
    });
    const wsPlan = XLSX.utils.json_to_sheet(flattenedPlan);
    XLSX.utils.book_append_sheet(wb, wsPlan, "Monthly_Plan");

    // 4. Gas Daily Reports
    const wsGas = XLSX.utils.json_to_sheet(gasDailyReports);
    XLSX.utils.book_append_sheet(wb, wsGas, "Gas_Daily_Reports");

    // 5. Assembly Daily Reports
    const wsAssembly = XLSX.utils.json_to_sheet(assemblyDailyReports);
    XLSX.utils.book_append_sheet(wb, wsAssembly, "Assembly_Daily_Reports");

    // 6. Metrics 2025 & 2026
    const wsMetrics2025 = XLSX.utils.json_to_sheet(metrics2025);
    XLSX.utils.book_append_sheet(wb, wsMetrics2025, "Metrics_2025");
    const wsMetrics2026 = XLSX.utils.json_to_sheet(metrics2026);
    XLSX.utils.book_append_sheet(wb, wsMetrics2026, "Metrics_2026");

    // 7. Other Metrics
    const wsMonthlyScrap = XLSX.utils.json_to_sheet(monthlyScrap);
    XLSX.utils.book_append_sheet(wb, wsMonthlyScrap, "Monthly_Scrap");
    const wsWeeklyScrap = XLSX.utils.json_to_sheet(weeklyScrap);
    XLSX.utils.book_append_sheet(wb, wsWeeklyScrap, "Weekly_Scrap");
    const wsWeeklyDclrError = XLSX.utils.json_to_sheet(weeklyDclrError);
    XLSX.utils.book_append_sheet(wb, wsWeeklyDclrError, "Weekly_DCLR_Error");
    const wsMonthlyDclrError = XLSX.utils.json_to_sheet(monthlyDclrError);
    XLSX.utils.book_append_sheet(wb, wsMonthlyDclrError, "Monthly_DCLR_Error");

    XLSX.writeFile(wb, `Sao_Luu_Toan_Bo_Bao_Cao_Sunhouse_${new Date().toISOString().split('T')[0]}.xlsx`);
    setFormMessage("✅ Đã xuất toàn bộ dữ liệu báo cáo ra file Excel thành công!");
    setTimeout(() => setFormMessage(""), 3500);
  };

  const handleImportFullBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        
        // Helper to get sheet data
        const getSheetData = (name: string) => {
          const ws = wb.Sheets[name];
          if (!ws) return null;
          return XLSX.utils.sheet_to_json(ws);
        };

        // 1. Production Logs
        const logsData = getSheetData("Production_Logs");
        if (logsData) {
          const importedLogs = (logsData as any[]).map(log => ({
            ...log,
            hourlyActuals: log.hourlyActuals ? JSON.parse(log.hourlyActuals) : {},
            hourlyWorkers: log.hourlyWorkers ? JSON.parse(log.hourlyWorkers) : {}
          }));
          setProductionLogs(importedLogs);
        }

        // 2. Products
        const productsData = getSheetData("Products");
        if (productsData) setProducts(productsData as ProductDefinition[]);

        // 3. Monthly Plan
        const planData = getSheetData("Monthly_Plan");
        if (planData) {
          const newPlan: any = {};
          (planData as any[]).forEach(row => {
            const ym = row.yearMonth;
            const pid = row.productId;
            if (!newPlan[ym]) newPlan[ym] = {};
            if (!newPlan[ym][pid]) newPlan[ym][pid] = {};
            for (let d = 1; d <= 31; d++) {
              const val = row[`day_${d}`];
              if (val !== undefined && val !== "") {
                newPlan[ym][pid][d] = Number(val);
              }
            }
          });
          setMonthlyPlan(newPlan);
        }

        // 4. Gas Reports
        const gasData = getSheetData("Gas_Daily_Reports");
        if (gasData) setGasDailyReports(gasData as DailyReportRowGas[]);

        // 5. Assembly Reports
        const assemblyData = getSheetData("Assembly_Daily_Reports");
        if (assemblyData) setAssemblyDailyReports(assemblyData as DailyReportRowAssembly[]);

        // 6. Metrics
        const m2025Data = getSheetData("Metrics_2025");
        if (m2025Data) setMetrics2025(m2025Data as MonthlyMetric[]);
        const m2026Data = getSheetData("Metrics_2026");
        if (m2026Data) setMetrics2026(m2026Data as MonthlyMetric[]);

        // 7. Others
        const mScrapData = getSheetData("Monthly_Scrap");
        if (mScrapData) setMonthlyScrap(mScrapData as MonthlyScrapReport[]);
        const wScrapData = getSheetData("Weekly_Scrap");
        if (wScrapData) setWeeklyScrap(wScrapData as WeeklyScrapReport[]);
        const wErrorData = getSheetData("Weekly_DCLR_Error");
        if (wErrorData) setWeeklyDclrError(wErrorData as WeeklyDclreErrorRate[]);
        const mErrorData = getSheetData("Monthly_DCLR_Error");
        if (mErrorData) setMonthlyDclrError(mErrorData as MonthlyDclreErrorRate[]);

        setFormMessage("✅ Đã khôi phục toàn bộ dữ liệu báo cáo từ file Excel thành công!");
        setTimeout(() => setFormMessage(""), 4000);

      } catch (err) {
        console.error(err);
        setFormMessage("❌ Lỗi khôi phục dữ liệu từ file Excel! Vui lòng kiểm tra định dạng file.");
        setTimeout(() => setFormMessage(""), 4000);
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // --- TRANG PHÂN TÍCH AI (GEMINI BACKEND CALL) ---
  const handleTriggerAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiError("");
    setAiAnalysis("");

    try {
      // Chuẩn bị dữ liệu gửi đi
      const response = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedYear,
          yearlyMetricData: displayMetrics,
          filterDivision,
          customLogs: productionLogs,
          weeklyAttendance: displayWeeklyAttendance,
          monthlyScrapReport: displayMonthlyScrap,
          weeklyScrapReport: displayWeeklyScrap,
          weeklyDclreErrorRate: displayWeeklyDclrError,
          monthlyDclreErrorRate: displayMonthlyDclrError,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAiAnalysis(data.analysis);
      } else {
        setAiError(data.error || "Không thể kết nối máy chủ phân tích.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError("Máy chủ bận hoặc không cấu hình khóa API. Vui lòng kết nối khóa Gemini trong bảng Secrets.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Auto trigger AI khi chuyển sang tab AI lần đầu tiên nếu chưa có dữ liệu
  useEffect(() => {
    if (activeTab === "analytics" && !aiAnalysis && !isAiLoading) {
      handleTriggerAiAnalysis();
    }
  }, [activeTab]);

  // Keep track of the last processed date to detect when the date changes (initially empty so it triggers on mount)
  const lastProcessedDateRef = useRef<string>("");

  // Auto-fill/update production models when formDate or monthlyPlan changes
  useEffect(() => {
    const dayNum = parseInt(formDate.split("-")[2]);
    if (isNaN(dayNum)) return;

    const dateChanged = lastProcessedDateRef.current !== formDate;
    lastProcessedDateRef.current = formDate;

    // Find all product IDs that have a plan value > 0 for this specific day in the monthly plan
    const plannedProductIds = products
      .filter(p => (monthlyPlan[currentYearMonth]?.[p.id]?.[dayNum] || 0) > 0)
      .map(p => p.id);

    // Find products with outstanding cumulative debt (leftover > 0) from preceding days of the same month
    const leftoverPrevProductIds = products
      .filter(p => {
        const leftover = getPrevDayLeftover(p.id, formDate);
        return leftover > 0;
      })
      .map(p => p.id);

    const combinedProductIds = Array.from(new Set([...plannedProductIds, ...leftoverPrevProductIds]));

    // If the user changed the date, we fully update/populate the production models based on that day's plan
    if (dateChanged) {
      // Reset workers counts to 0 for unsaved days to avoid mixing days
      const resetSlots = formSlots;
      const initialWorkers: { [slotName: string]: number } = {};
      resetSlots.forEach(s => {
        initialWorkers[s] = 0;
      });
      setFormOfficialWorkersRO(initialWorkers);
      setFormSeasonalWorkersRO(initialWorkers);
      setFormOfficialWorkersBG(initialWorkers);
      setFormSeasonalWorkersBG(initialWorkers);

      if (combinedProductIds.length > 0) {
        setFormModelItems(() => {
          return combinedProductIds.map((prodId, idx) => {
            const planVal = (monthlyPlan[currentYearMonth]?.[prodId]?.[dayNum]) || 0;
            const initialHrs: { [slotName: string]: number } = {};
            formSlots.forEach(s => {
              initialHrs[s] = 0;
            });
            return {
              id: `item-auto-${prodId}-${Date.now()}-${idx}`,
              productId: prodId,
              dailyPlan: planVal,
              hourlyActuals: initialHrs
            };
          });
        });
      } else {
        // Fallback default row
        const initialHrs: { [slotName: string]: number } = {};
        formSlots.forEach(s => {
          initialHrs[s] = 0;
        });
        setFormModelItems([
          {
            id: `item-init-${Date.now()}`,
            productId: "mln-01",
            dailyPlan: (monthlyPlan[currentYearMonth]?.["mln-01"]?.[dayNum]) || 0,
            hourlyActuals: initialHrs
          }
        ]);
      }
    } else {
      // If the date is the same (e.g. they edited plans or something changed in monthlyPlan),
      // or if there are no planned products, we just synchronize the dailyPlan field for the existing list of items.
      setFormModelItems(prev => {
        let changed = false;
        const next = prev.map(item => {
          const planVal = (monthlyPlan[currentYearMonth]?.[item.productId]?.[dayNum]) || 0;
          if (item.dailyPlan !== planVal) {
            changed = true;
            return { ...item, dailyPlan: planVal };
          }
          return item;
         });
        return changed ? next : prev;
      });
    }
  }, [formDate, monthlyPlan, products, formSlots, productionLogs]);

  const displayTotalActualQty = filterDivision === "MLN" ? formAggregates.totalActualQtyRO : (filterDivision === "BG" ? formAggregates.totalActualQtyBG : formAggregates.totalActualQty);
  const displayTotalEqQty = filterDivision === "MLN" ? formAggregates.totalEqQtyRO : (filterDivision === "BG" ? formAggregates.totalEqQtyBG : formAggregates.totalEqQty);
  const displayTotalPlanQty = filterDivision === "MLN" ? formAggregates.totalPlanQtyRO : (filterDivision === "BG" ? formAggregates.totalPlanQtyBG : formAggregates.totalPlanQty);
  const displayTotalRemainingQty = filterDivision === "MLN" ? formAggregates.totalRemainingQtyRO : (filterDivision === "BG" ? formAggregates.totalRemainingQtyBG : formAggregates.totalRemainingQty);

  
  return {
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
  };
};
