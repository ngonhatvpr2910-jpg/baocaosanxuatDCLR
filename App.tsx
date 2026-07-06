
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

export interface FormModelItem {
  id: string;
  productId: string;
  dailyPlan?: number;
  hourlyActuals: { [slotName: string]: number };
}

export interface YearWeek {
  id: number; // e.g. 1 to 53
  days: { dateStr: string; dayNum: number; monthNum: number }[];
  label: string;
}

export function getYearWeeks(year: number): YearWeek[] {
  const weeks: YearWeek[] = [];
  let currentWeekDays: { dateStr: string; dayNum: number; monthNum: number }[] = [];
  let weekIndex = 1;

  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m - 1, d);
      const dayOfWeek = date.getDay(); // 0: CN, 1: T2, ..., 5: T6, 6: T7
      const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      // Friday starts a new week!
      if (dayOfWeek === 5 && currentWeekDays.length > 0) {
        weeks.push({
          id: weekIndex,
          days: [...currentWeekDays],
          label: ""
        });
        weekIndex++;
        currentWeekDays = [];
      }

      currentWeekDays.push({ dateStr, dayNum: d, monthNum: m });
    }
  }

  if (currentWeekDays.length > 0) {
    weeks.push({
      id: weekIndex,
      days: [...currentWeekDays],
      label: ""
    });
  }

  const getDayName = (y: number, mon: number, day: number) => {
    const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return dayNames[new Date(y, mon - 1, day).getDay()];
  };

  return weeks.map(w => {
    const first = w.days[0];
    const last = w.days[w.days.length - 1];
    const firstLabel = `${getDayName(year, first.monthNum, first.dayNum)} ${String(first.dayNum).padStart(2, '0')}/${String(first.monthNum).padStart(2, '0')}`;
    const lastLabel = `${getDayName(year, last.monthNum, last.dayNum)} ${String(last.dayNum).padStart(2, '0')}/${String(last.monthNum).padStart(2, '0')}`;
    return {
      ...w,
      label: `Tuần W${w.id} (${firstLabel} - ${lastLabel})`
    };
  });
}

export function getWeeksInMonth(year: number, month: number): YearWeek[] {
  const allWeeks = getYearWeeks(year);
  return allWeeks.filter(w => w.days.some(d => d.monthNum === month));
}

export function getShiftSlots(shift: string): string[] {
  if (shift.includes("17:00")) {
    return [
      "8H - 9H", "9H - 10H", "10H - 11H", "11H - 12H",
      "13H - 14H", "14H - 15H", "15H - 16H", "16H - 17H"
    ];
  } else if (shift.includes("19h")) {
    return [
      "8H - 9H", "9H - 10H", "10H - 11H", "11H - 12H",
      "13H - 14H", "14H - 15H", "15H - 16H", "16H - 17H",
      "17H - 18H", "18H - 19H"
    ];
  } else if (shift.includes("20h00")) {
    return [
      "8H - 9H", "9H - 10H", "10H - 11H", "11H - 12H",
      "13H - 14H", "14H - 15H", "15H - 16H", "16H - 17H",
      "17H - 18H", "18H - 19H", "19H - 20H"
    ];
  }
  return [
    "8H - 9H", "9H - 10H", "10H - 11H", "11H - 12H",
    "13H - 14H", "14H - 15H", "15H - 16H", "16H - 17H"
  ];
}

export function formatSlotLabel(slot: string): string {
  let clean = slot.trim().toUpperCase().replace(/:00/g, "").replace(/\s+/g, "");
  const match = clean.match(/^(\d+)(H|H-)?-?(\d+)(H)?$/);
  if (match) {
    const start = parseInt(match[1]);
    const end = parseInt(match[3]);
    return `${start}H - ${end}H`;
  }
  return slot.trim();
}

export function getProductModelCode(name: string): string {
  // Extract clean model code (e.g. SHA76222KL, SHA75102LA, SHB2106, MMBB0787B, etc.)
  const words = name.replace(/[()]/g, ' ').split(/\s+/);
  for (const word of words) {
    const cleanWord = word.trim();
    if (/^(SHA|SHB|MMB|BBD)[A-Z0-9-]+$/i.test(cleanWord)) {
      return cleanWord.toUpperCase();
    }
  }
  for (const word of words) {
    const cleanWord = word.trim();
    if (/[A-Z]/.test(cleanWord) && /[0-9]/.test(cleanWord) && cleanWord.length >= 4) {
      return cleanWord;
    }
  }
  return name;
}

const YAXIS_DOMAIN: [number, "auto"] = [0, "auto"];



const DigitalClock = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour12: false }));
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("vi-VN", { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className="text-rose-500 font-bold ml-1">{time}</span>;
};

export default function App() {
  // --- STATE ---
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [laborViewMode, setLaborViewMode] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [filterDivision, setFilterDivision] = useState<ProductGroup | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<"dashboard" | "logging" | "monthly-plan" | "products" | "analytics" | "history-data" | "system-data">("dashboard");
  const [isRevenueVisible, setIsRevenueVisible] = useState(false);
  const [isPasswordInputVisible, setIsPasswordInputVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [revenuePasswordError, setRevenuePasswordError] = useState("");
  const [dashboardSubTab, setDashboardSubTab] = useState<"standard" | "scrap-quality" | "charts">("standard");
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

  const updateScrapMetric = (type: "monthly" | "weekly", index: number, value: string) => {
    const numericValue = value === "" ? null : Number(value);
    if (type === "monthly") {
      setMonthlyScrap(prev => {
        const next = [...prev];
        next[index] = { ...next[index], scrapCost: numericValue };
        return next;
      });
    } else {
      setWeeklyScrap(prev => {
        const next = [...prev];
        next[index] = { ...next[index], scrapCost: numericValue };
        return next;
      });
    }
  };

  const updateDclrErrorMetric = (type: "monthly" | "weekly", index: number, value: string) => {
    const numericValue = value === "" ? null : Number(value);
    if (type === "monthly") {
      setMonthlyDclrError(prev => {
        const next = [...prev];
        next[index] = { ...next[index], errorRate: numericValue };
        return next;
      });
    } else {
      setWeeklyDclrError(prev => {
        const next = [...prev];
        next[index] = { ...next[index], errorRate: numericValue };
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
    if (saved) return JSON.parse(saved);
    const initial = JSON.parse(JSON.stringify(WEEKLY_SCRAP_REPORT)) as WeeklyScrapReport[];
    initial[0].scrapCost = 1820000;
    initial[1].scrapCost = 2150000;
    initial[2].scrapCost = 1480000;
    initial[3].scrapCost = 3420000;
    initial[4].scrapCost = 2900000;
    initial[5].scrapCost = 1120000;
    return initial;
  });

  const [weeklyDclrError, setWeeklyDclrError] = useState<WeeklyDclreErrorRate[]>(() => {
    const saved = localStorage.getItem("sunhouse_weekly_dclr_error_v2");
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(WEEKLY_DCLR_ERROR_RATE));
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
      price: p.price ?? (p.group === "MLN" ? 4500000 : 1800000)
    }));

    const saved = localStorage.getItem("sunhouse_products_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => ({
            ...p,
            price: p.price ?? (p.group === "MLN" ? 4500000 : 1800000),
            factor: p.factor ?? 1
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
      formOfficialCountRO: Number((offRO / 8).toFixed(2)),
      formSeasonalCountRO: Number((seasRO / 8).toFixed(2)),
      formWorkersCountRO: Number(((offRO + seasRO) / 8).toFixed(2)),
      formOfficialCountRMA: Number((offRMA / 8).toFixed(2)),
      formSeasonalCountRMA: Number((seasRMA / 8).toFixed(2)),
      formWorkersCountRMA: Number(((offRMA + seasRMA) / 8).toFixed(2)),
      formOfficialCountBG: Number((offBG / 8).toFixed(2)),
      formSeasonalCountBG: Number((seasBG / 8).toFixed(2)),
      formWorkersCountBG: Number(((offBG + seasBG) / 8).toFixed(2)),
      formWorkersCount: Number(((offRO + seasRO + offRMA + seasRMA + offBG + seasBG) / 8).toFixed(2)),
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
    return accumulated;
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
      // Get logs for this month
      const logsForMonth = productionLogs.filter(
        (log) => log.date.startsWith(`${m.year}-${String(m.month).padStart(2, '0')}`)
      );

      const isFormMonth = m.year === formYear && m.month === formMonth;
      const hasLogs = logsForMonth.length > 0;

      if (hasLogs || isFormMonth) {
        const filteredLogs = hasSavedFormDate
          ? logsForMonth
          : logsForMonth.filter((log) => log.date !== formDate);

        const eqQty = filteredLogs.reduce((acc, curr) => acc + curr.equivalentProducts, 0);
        const actualQty = filteredLogs.reduce((acc, curr) => acc + curr.actualUnits, 0);
        
        // Sum unique shift workers
        const uniqueShiftWorkersMap: { [key: string]: number } = {};
        filteredLogs.forEach((log) => {
          const key = `${log.date}_${log.shift}_${log.lineId}`;
          uniqueShiftWorkersMap[key] = Math.max(uniqueShiftWorkersMap[key] || 0, log.workersCount);
        });
        const workdays = Object.values(uniqueShiftWorkersMap).reduce((acc, val) => acc + val, 0);

        const addedEqQty = eqQty + (isFormMonth && !hasSavedFormDate ? formAggregates.totalEqQty : 0);
        const addedActualQty = actualQty + (isFormMonth && !hasSavedFormDate ? formAggregates.totalActualQty : 0);
        const addedWorkdays = workdays + (isFormMonth && !hasSavedFormDate ? formWorkersCount : 0);

        if (addedEqQty > 0 || addedActualQty > 0 || addedWorkdays > 0) {
          const baseEq = m.equivalentProducts || 0;
          const baseActual = m.actualProducts || 0;
          const baseMandays = m.productionMandays || 0;
          
          const finalEq = baseEq + addedEqQty;
          const finalActual = baseActual + addedActualQty;
          const finalMandays = baseMandays + addedWorkdays;

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
      } else {
        // Fallback to daily reports if available for this month (e.g. June 2026)
        const monthReports = combinedDailyReports.filter((r) => getMonthFromDateString(r.date) === m.month);
        if (monthReports.length > 0) {
          const finalEq = monthReports.reduce((sum, r) => sum + (r.totalOutput || 0), 0);
          const finalActual = monthReports.reduce((sum, r) => sum + (r.totalActualOutput || 0), 0);
          const finalMandays = monthReports.reduce((sum, r) => sum + (r.totalCong || 0), 0);

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
  }, [metrics2026, productionLogs, formDate, formAggregates, formWorkersCount, combinedDailyReports]);

  // Lọc/chia tỉ lệ dữ liệu tĩnh dựa trên bộ lọc
  const displayWeeklyAttendance = useMemo(() => {
    return WEEKLY_ATTENDANCE.map(w => ({
      ...w,
      rate: w.rate === null ? null : Number((w.rate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 1.01 : filterDivision === "RMA" ? 1.02 : 0.99))).toFixed(1))
    }));
  }, [filterDivision]);

  const displayMonthlyScrap = useMemo(() => {
    const ratio = filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.5 : filterDivision === "RMA" ? 0.1 : 0.4);
    return monthlyScrap.map(r => ({
      ...r,
      scrapCost: r.scrapCost === null ? null : Math.round(r.scrapCost * ratio)
    }));
  }, [filterDivision, monthlyScrap]);

  const displayWeeklyScrap = useMemo(() => {
    const ratio = filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.5 : filterDivision === "RMA" ? 0.1 : 0.4);
    return weeklyScrap.map(r => ({
      ...r,
      scrapCost: r.scrapCost === null ? null : Math.round(r.scrapCost * ratio)
    }));
  }, [filterDivision, weeklyScrap]);

  const displayWeeklyDclrError = useMemo(() => {
    return weeklyDclrError.map(r => ({
      ...r,
      errorRate: r.errorRate === null ? null : Number((r.errorRate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1))).toFixed(2))
    }));
  }, [filterDivision, weeklyDclrError]);

  const displayMonthlyDclrError = useMemo(() => {
    return monthlyDclrError.map(r => ({
      ...r,
      errorRate: r.errorRate === null ? null : Number((r.errorRate * (filterDivision === "ALL" ? 1 : (filterDivision === "MLN" ? 0.9 : filterDivision === "RMA" ? 0.95 : 1.1))).toFixed(2))
    }));
  }, [filterDivision, monthlyDclrError]);

  // Bộ lọc dữ liệu theo bộ phận Phân xưởng (Máy Lọc Nước vs Bếp Gas)
  // Trong thực tế, các chỉ số sản lượng sẽ chia theo nhóm sản phẩm. Nếu lọc, ta áp dụng hệ số tỉ lệ tương đối hoặc tính từ logs
  const chartMonthlyScrap = useMemo(() => displayMonthlyScrap.filter(r => r.scrapCost !== null), [displayMonthlyScrap]);
  const chartWeeklyScrap = useMemo(() => displayWeeklyScrap.filter(r => r.scrapCost !== null), [displayWeeklyScrap]);
  const chartWeeklyDclrError = useMemo(() => displayWeeklyDclrError.filter(e => e.errorRate !== null), [displayWeeklyDclrError]);

  const displayMetrics = useMemo(() => {
    const baseMetrics = selectedYear === 2025 ? metrics2025 : processedMetrics2026;

    const formDateParts = formDate.split("-");
    const formYear = parseInt(formDateParts[0]);
    const formMonth = parseInt(formDateParts[1]);

    const hasSavedFormDate = productionLogs.some(log => log.date === formDate);

    return baseMetrics.map((m) => {
      // Historical data (months 1-6 of 2026, or all of 2025)
      if (selectedYear === 2025 || m.month < 7) {
        if (selectedYear === 2026) {
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

          const gasMonthDays = gasDailyReports.filter(r => !r.isSummary && !r.isOff && getMonthFromDateString(r.date) === m.month);
          const assemMonthDays = assemblyDailyReports.filter(r => !r.isSummary && getMonthFromDateString(r.date) === m.month);

          if (gasMonthDays.length > 0 || assemMonthDays.length > 0) {
            if (filterDivision === "ALL") {
              return m; // Already computed dynamically in processedMetrics2026
            } else if (filterDivision === "BG") {
              const eq = gasMonthDays.reduce((sum, r) => sum + Number(r.outputStove || 0), 0);
              const actual = gasMonthDays.reduce((sum, r) => sum + Number(r.actualStove || 0), 0);
              const mandays = gasMonthDays.reduce((sum, r) => sum + (Number(r.congGasStove || 0) + Number(r.congSeasonal || 0)), 0);
              const lp = mandays > 0 ? Number(((eq / mandays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2)) : null;
              return { ...m, equivalentProducts: eq, actualProducts: actual, productionMandays: mandays, laborProductivityPercent: lp };
            } else if (filterDivision === "MLN") {
              const eq = assemMonthDays.reduce((sum, r) => sum + Number(r.outputLineChinh || 0), 0);
              const actual = assemMonthDays.reduce((sum, r) => sum + Number(r.actualLineChinh || 0), 0);
              const mandays = assemMonthDays.reduce((sum, r) => sum + (Number(r.congChinhThuc || 0) + Number(r.congThoiVu || 0)), 0);
              const lp = mandays > 0 ? Number(((eq / mandays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2)) : null;
              return { ...m, equivalentProducts: eq, actualProducts: actual, productionMandays: mandays, laborProductivityPercent: lp };
            } else if (filterDivision === "RMA") {
              const eq = gasMonthDays.reduce((sum, r) => sum + Number(r.outputRma || 0), 0);
              const actual = gasMonthDays.reduce((sum, r) => sum + Number(r.actualRma || 0), 0);
              const mandays = gasMonthDays.reduce((sum, r) => sum + Number(r.congRma || 0), 0);
              const lp = mandays > 0 ? Number(((eq / mandays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2)) : (m.month <= 6 ? 100 : null);
              return { ...m, equivalentProducts: eq, actualProducts: actual, productionMandays: mandays, laborProductivityPercent: lp };
            }
          }
        }

        if (filterDivision === "ALL") return m;
        const ratio = filterDivision === "MLN" ? 0.5 : filterDivision === "RMA" ? 0.05 : 0.45;
        const mandayRatio = filterDivision === "MLN" ? 0.52 : filterDivision === "RMA" ? 0.04 : 0.44;
        const nslRatio = filterDivision === "MLN" ? 1.02 : filterDivision === "RMA" ? 0.9 : 0.98;
        
        if (m.equivalentProducts === null) return m;
        return {
          ...m,
          equivalentProducts: Math.round(m.equivalentProducts * ratio),
          actualProducts: m.actualProducts ? Math.round(m.actualProducts * ratio) : null,
          productionMandays: Math.round((m.productionMandays || 0) * mandayRatio),
          laborProductivityPercent: m.laborProductivityPercent
            ? Number((m.laborProductivityPercent * nslRatio).toFixed(2))
            : null,
        };
      }

      // New data (month 7+ of 2026)
      const logsForMonth = productionLogs.filter(
        (log) => log.date.startsWith(`${m.year}-${String(m.month).padStart(2, '0')}`)
      );
      
      const filteredLogs = hasSavedFormDate
        ? logsForMonth
        : logsForMonth.filter((log) => log.date !== formDate);

      const divisionLogs = filterDivision === "ALL" 
        ? filteredLogs 
        : filteredLogs.filter((log) => log.productGroup === filterDivision);

      const eqQty = divisionLogs.reduce((acc, curr) => acc + curr.equivalentProducts, 0);
      const actualQty = divisionLogs.reduce((acc, curr) => acc + curr.actualUnits, 0);

      const uniqueShiftWorkersMap: { [key: string]: number } = {};
      divisionLogs.forEach((log) => {
        const key = `${log.date}_${log.shift}_${log.lineId}`;
        uniqueShiftWorkersMap[key] = Math.max(uniqueShiftWorkersMap[key] || 0, log.workersCount);
      });
      const workdays = Object.values(uniqueShiftWorkersMap).reduce((acc, val) => acc + val, 0);

      const isFormMonth = m.year === formYear && m.month === formMonth;
      
      let finalEq = eqQty;
      let finalActual = actualQty;
      let finalMandays = workdays;

      if (isFormMonth && !hasSavedFormDate) {
        if (filterDivision === "ALL") {
          finalEq += formAggregates.totalEqQty;
          finalActual += formAggregates.totalActualQty;
          finalMandays += formWorkersCount;
        } else if (filterDivision === "MLN") {
          finalEq += formAggregates.totalEqQtyRO;
          finalActual += formAggregates.totalActualQtyRO;
          finalMandays += formWorkersCountRO;
        } else if (filterDivision === "RMA") {
          finalEq += formAggregates.totalEqQtyRMA;
          finalActual += formAggregates.totalActualQtyRMA;
          finalMandays += formWorkersCountRMA;
        } else if (filterDivision === "BG") {
          finalEq += formAggregates.totalEqQtyBG;
          finalActual += formAggregates.totalActualQtyBG;
          finalMandays += formWorkersCountBG;
        }
      }

      if (finalEq > 0 || finalActual > 0 || finalMandays > 0) {
        const calculatedProductivity = finalMandays > 0
          ? Number(((finalEq / finalMandays) / INDUSTRIAL_STANDARDS.standardQtyPerManday * 100).toFixed(2))
          : 0;

        return {
          ...m,
          equivalentProducts: finalEq,
          actualProducts: finalActual,
          productionMandays: finalMandays,
          laborProductivityPercent: calculatedProductivity,
        };
      }

      return m; // returns base m if no data
    });
  }, [selectedYear, filterDivision, metrics2025, processedMetrics2026, productionLogs, formDate, formAggregates, formWorkersCount, formWorkersCountRO, formWorkersCountBG, gasDailyReports, assemblyDailyReports]);

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
        // In "ALL" mode, we don't double count, but in "RMA" mode we show the 10% portion
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

    if (laborViewMode === "daily") {
      const historicalDaily = assemblyDailyReports
        .filter((r) => !r.isSummary)
        .map((item) => {
          const gasRow = gasDailyReports.find(g => g.date === item.date) || { congGasStove: 0, congSeasonal: 0, congRma: 0, outputStove: 0, outputRma: 0 } as any;
          const { totalCong, totalOutput } = getValues(item, gasRow);
          const value = totalCong > 0 ? Number(((totalOutput / totalCong) / 9.03 * 100).toFixed(1)) : 0;
          return { name: item.date, value, rawDate: "" }; // rawDate for sorting not needed here
        });

      // Từ tháng 7 trở đi, lấy từ nhật ký ca (productionLogs) + form hiện tại
      const logsByDate: { [key: string]: { totalEq: number, mandays: number } } = {};
      const filteredLogs = filterDivision === "ALL" ? productionLogs : productionLogs.filter(l => l.productGroup === filterDivision);
      
      // Tách nhân sự theo ca để tính công (tránh đếm trùng)
      const workersByDateShiftLine: { [key: string]: number } = {};
      
      filteredLogs.forEach(log => {
        if (!logsByDate[log.date]) logsByDate[log.date] = { totalEq: 0, mandays: 0 };
        logsByDate[log.date].totalEq += log.equivalentProducts;
        
        const shiftKey = `${log.date}_${log.shift}_${log.lineId}`;
        workersByDateShiftLine[shiftKey] = Math.max(workersByDateShiftLine[shiftKey] || 0, log.workersCount);
      });
      
      // Gộp công lại theo ngày
      Object.entries(workersByDateShiftLine).forEach(([key, workers]) => {
        const date = key.split('_')[0];
        if (logsByDate[date]) logsByDate[date].mandays += workers;
      });

      // Thêm form hiện tại nếu chưa được lưu
      const isFormInLogs = filteredLogs.some(l => l.date === formDate);
      if (!isFormInLogs && formDate) {
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
      const historicalWeekly = assemblyDailyReports
        .filter((r) => r.isSummary && r.date.includes("W"))
        .map((item) => {
          const gasRow = gasDailyReports.find(g => g.date === item.date) || { congGasStove: 0, congSeasonal: 0, congRma: 0, outputStove: 0, outputRma: 0 } as any;
          const { totalCong, totalOutput } = getValues(item, gasRow);
          const value = totalCong > 0 ? Number(((totalOutput / totalCong) / 9.03 * 100).toFixed(1)) : 0;
          return { name: item.date, value };
        });
        
      // For weekly from logs, it's complex to determine W number properly, so we skip or approximate if needed.
      // To keep it simple and fulfill the requirement, we will focus on Daily/Monthly/Yearly. 
      // If we must implement weekly, we can group newDaily by week.
      return historicalWeekly; 
    }

    if (laborViewMode === "monthly") {
      return displayMetrics.filter(m => m.laborProductivityPercent !== null).map(m => ({
        name: `Tháng ${m.month}`,
        value: m.laborProductivityPercent || 0
      }));
    }

    // Yearly
    const activeMonths = displayMetrics.filter((m) => m.laborProductivityPercent !== null);
    if (activeMonths.length === 0) return [{ name: `Năm ${selectedYear}`, value: 0 }];
    
    // Average productivity across active months
    const avg = activeMonths.reduce((sum, m) => sum + (m.laborProductivityPercent || 0), 0) / activeMonths.length;
    return [{ name: `Năm ${selectedYear}`, value: Number(avg.toFixed(1)) }];
    
  }, [assemblyDailyReports, gasDailyReports, laborViewMode, filterDivision, displayMetrics, productionLogs, formDate, formAggregates, formWorkersCount, formWorkersCountRO, formWorkersCountBG, selectedYear]);

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

    // Hiệu suất trung bình cả năm (NSLĐ luỹ kế năm)
    const activeMonths = metricsToUse.filter((m) => m.laborProductivityPercent !== null);
    
    let avgLaborProductivity = 0;
    if (filterDivision === "BG" && selectedYear === 2026) {
      // Lấy 61.8 (T5) và 84.3 (T6) làm cơ sở cho BG
      const t5 = 61.8;
      const t6 = 84.3;
      let totalProd = t5 + t6;
      let count = 2;
      
      if (totalMandaysMonth > 0) {
        const currentMonthProd = Number(((totalEqProd_productivity / totalMandaysMonth / INDUSTRIAL_STANDARDS.standardQtyPerManday) * 100).toFixed(2));
        totalProd += currentMonthProd;
        count++;
      }
      
      avgLaborProductivity = Number((totalProd / count).toFixed(2));
    } else if (filterDivision === "RMA") {
      // User requested current cumulative RMA to be 100%
      avgLaborProductivity = 100;
    } else {
      avgLaborProductivity = totalMandays > 0
        ? Number(((totalEqProducts / totalMandays / INDUSTRIAL_STANDARDS.standardQtyPerManday) * 100).toFixed(2))
        : 0;
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
      currentJulyEq: Math.round(totalEqProd_display),
      currentJulyUnconverted: Math.round(totalActualUnitsMonth_display),
      currentJulyMandays: Math.round(totalMandaysMonth),
      currentJulyOfficial: Math.round(totalOfficialMonth),
      currentJulySeasonal: Math.round(totalSeasonalMonth),
      currentJulyProductivity: Number(((totalEqProd_productivity / (totalMandaysMonth || 1) / INDUSTRIAL_STANDARDS.standardQtyPerManday) * 100).toFixed(2)),
      currentJulyCompletionRate: totalMonthlyPlanUnits.total > 0 ? Number(((totalEqProd_display / totalMonthlyPlanUnits.total) * 100).toFixed(1)) : 0,
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
      const totalActual = logs.reduce((sum, l) => sum + l.actualUnits, 0);
      const totalEquivalent = logs.reduce((sum, l) => sum + l.equivalentProducts, 0);

      // Nhóm theo shift & line để tính số công thực tế không bị nhân bản
      const shiftLineWorkers: { [key: string]: number } = {};
      logs.forEach((log) => {
        const key = `${log.shift}_${log.lineId}`;
        shiftLineWorkers[key] = Math.max(shiftLineWorkers[key] || 0, log.workersCount);
      });
      const totalWorkers = Object.values(shiftLineWorkers).reduce((sum, w) => sum + w, 0);

      const avgProductivity = totalWorkers > 0
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
      const filtered = prev.filter((log) => log.date !== formDate);
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

  const handleEditLog = (date: string) => {
    const logsForDate = productionLogs.filter(l => l.date === date);
    if (logsForDate.length === 0) return;

    const firstLog = logsForDate[0];
    setFormDate(date);
    setFormShift(firstLog.shift);
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

        const headers = data[0].map((h: any) => String(h || "").trim().toLowerCase());

        let groupIdx = headers.findIndex((h: string) => h.includes("nhóm") || h.includes("group") || h.includes("loại"));
        let codeIdx = headers.findIndex((h: string) => h.includes("code") || h.includes("mã") || h.includes("model"));
        let nameIdx = headers.findIndex((h: string) => h.includes("tên") || h.includes("name") || h.includes("sản phẩm"));
        let factorIdx = headers.findIndex((h: string) => h.includes("hệ số") || h.includes("factor") || h.includes("quy đổi"));
        let priceIdx = headers.findIndex((h: string) => h.includes("giá") || h.includes("price"));
        let descIdx = headers.findIndex((h: string) => h.includes("mô tả") || h.includes("desc") || h.includes("ghi chú"));

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-rose-500/10 selection:text-rose-900 light-theme">
      {/* STICKY HEADER & NAVIGATION CONTAINER */}
      <div className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl will-change-transform">
        {/* HEADER BAR */}
        <header>
          <div className={`relative w-full max-w-[1800px] mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-4 transition-[padding,min-height] duration-300 ${isScrolled ? "py-1.5 min-h-[44px]" : "py-4 min-h-[72px]"}`}>
            {/* Left: Date info & System Status (positioned absolute on md+ or simplified when scrolled, replacing brand identity) */}
            <div className={`flex items-center gap-3 transition-transform duration-300 ${isScrolled ? "md:absolute md:left-4 scale-90" : "md:absolute md:left-4 scale-100"}`}>
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

            {/* Center: Title (Cân giữa, to, rõ, in đậm, giữ nguyên kích thước khi cuộn) */}
            <div className="text-center flex flex-col items-center justify-center max-w-xl md:max-w-2xl lg:max-w-4xl px-2 transition-[transform,opacity] duration-300">
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
                  isScrolled ? "px-2.5 py-1 text-[11px] gap-1.5" : "px-4 py-2 text-xs gap-2"
                } ${
                  activeTab === "dashboard"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-900/10 border border-rose-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <Database className={`transition-all duration-300 ${isScrolled ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
                <span>Bảng Điều Hành (Dashboard)</span>
              </button>
              <button
                id="tab-logging"
                onClick={() => setActiveTab("logging")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-2.5 py-1 text-[11px] gap-1.5" : "px-4 py-2 text-xs gap-2"
                } ${
                  activeTab === "logging"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-900/10 border border-rose-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <PlusCircle className={`transition-all duration-300 ${isScrolled ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
                <span>Ghi Nhật Ký Ca</span>
              </button>
              <button
                id="tab-imei-tracking"
                onClick={() => setActiveTab("imei-tracking")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-2.5 py-1 text-[11px] gap-1.5" : "px-4 py-2 text-xs gap-2"
                } ${
                  activeTab === "imei-tracking"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-900/10 border border-rose-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <Barcode className={`transition-all duration-300 ${isScrolled ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
                <span>Theo Dõi IMEI</span>
              </button>
              <button
                id="tab-products"
                onClick={() => setActiveTab("products")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-2.5 py-1 text-[11px] gap-1.5" : "px-4 py-2 text-xs gap-2"
                } ${
                  activeTab === "products"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-900/10 border border-rose-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <Sliders className={`transition-all duration-300 ${isScrolled ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
                <span>Cấu Hình Sản Phẩm</span>
              </button>
              <button
                id="tab-monthly-plan"
                onClick={() => setActiveTab("monthly-plan")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-2.5 py-1 text-[11px] gap-1.5" : "px-4 py-2 text-xs gap-2"
                } ${
                  activeTab === "monthly-plan"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-900/10 border border-rose-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <Calendar className={`transition-all duration-300 ${isScrolled ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
                <span>KHSX Tháng</span>
              </button>
              <button
                id="tab-history"
                onClick={() => setActiveTab("history-data")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-2.5 py-1 text-[11px] gap-1.5" : "px-4 py-2 text-xs gap-2"
                } ${
                  activeTab === "history-data"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-900/10 border border-rose-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <History className={`transition-all duration-300 ${isScrolled ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
                <span>Mục tiêu sản xuất năm 2026</span>
              </button>

              <button
                id="tab-system-data"
                onClick={() => setActiveTab("system-data")}
                className={`rounded-lg font-semibold transition-all duration-300 flex items-center cursor-pointer ${
                  isScrolled ? "px-2.5 py-1 text-[11px] gap-1.5" : "px-4 py-2 text-xs gap-2"
                } ${
                  activeTab === "system-data"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-900/10 border border-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <RefreshCw className={`transition-all duration-300 ${isScrolled ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
                <span>Dữ liệu hệ thống</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT SPACE */}
      <main className="w-full max-w-[1800px] mx-auto px-4 py-6">

        {/* ACTIVE TAB: DASHBOARD */}
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
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

                {/* Right: Interactive Filters (Division + Year) */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Division Selection (DCRO / DCBG) */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase pl-2 hidden sm:inline">Bộ phận:</span>
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
                    <span className="text-[10px] text-slate-500 font-mono uppercase pl-2 hidden sm:inline">Năm:</span>
                    <button
                      id="year-2025"
                      onClick={() => setSelectedYear(2025)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        selectedYear === 2025 ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      2025
                    </button>
                    <button
                      id="year-2026"
                      onClick={() => setSelectedYear(2026)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        selectedYear === 2026 ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      2026
                    </button>
                  </div>
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
                    <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">KHSX THÁNG {parseInt(formDate.split("-")[1])}</span>
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
                    <span className="text-[11px] text-cyan-400 font-mono uppercase tracking-wider">LŨY KẾ THỰC HIỆN / TỔNG KẾ HOẠCH THÁNG {parseInt(formDate.split("-")[1])}</span>
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
                      <span className="text-[11px] text-amber-400 font-mono uppercase tracking-wider">NSLĐ GỘP (DCBG & DCRMA)</span>
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
                      <span className="text-[11px] text-emerald-400 font-mono uppercase tracking-wider">DOANH THU (KH VS THỰC)</span>
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
                              {kpis.plannedRevenue > 0 ? Math.round((kpis.actualRevenue / kpis.plannedRevenue) * 100) : 0}%
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
                    <span className="text-[11px] text-amber-400 font-mono uppercase tracking-wider">NSLĐ LŨY KẾ CẢ NĂM ({filterDivision === "ALL" ? "PHÂN XƯỞNG" : filterDivision})</span>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-bold tracking-tight ${kpis.avgLaborProductivity >= kpis.yearTarget ? "text-emerald-400" : "text-amber-400"}`}>
                      {kpis.avgLaborProductivity}%
                    </span>
                    <span className="text-xs text-slate-500 font-mono">/ mục tiêu {kpis.yearTarget}%</span>
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
                    <span className="text-[11px] text-orange-400 font-mono uppercase tracking-wider">NSLĐ THÁNG {parseInt(formDate.split("-")[1])}</span>
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
                    <span className="text-[11px] text-indigo-400 font-mono uppercase tracking-wider">TỔNG CÔNG THAO TÁC (THÁNG)</span>
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
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickFormatter={(v) => `Tháng ${v}`} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={11} domain={YAXIS_DOMAIN} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} domain={YAXIS_DOMAIN} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", color: "#f8fafc" }}
                    />
                    <Legend />
                    <Bar isAnimationActive={false} yAxisId="left" dataKey="actualProducts" name="Sản lượng thực tế" fill="#94a3b8" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="actualProducts" position="top" offset={3} fill="#94a3b8" fontSize={10} fontWeight="semibold" />
                    </Bar>
                    <Bar isAnimationActive={false} yAxisId="left" dataKey="equivalentProducts" name="Sản lượng quy đổi" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="equivalentProducts" position="top" offset={3} fill="#3b82f6" fontSize={10} fontWeight="semibold" />
                    </Bar>
                    <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="laborProductivityPercent" name="Năng Suất (%)" stroke="#f97316" strokeWidth={2}>
                      <LabelList dataKey="laborProductivityPercent" position="top" offset={10} fill="#f97316" fontSize={10} fontWeight="semibold" formatter={(v: any) => `${v}%`} />
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
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} domain={YAXIS_DOMAIN} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", color: "#f8fafc" }}
                      formatter={(value: number) => [`${value}%`, "NSLĐ"]}
                    />
                    <Legend />
                    <Bar isAnimationActive={false} dataKey="value" name="NSLĐ (%)" fill="#10b981" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="value" position="top" offset={3} fill="#10b981" fontSize={10} fontWeight="semibold" formatter={(v: number) => v > 0 ? `${v}%` : ''} />
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
                                handleEditLog(log.date);
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
                          <span className="text-white font-bold block">{log.actualUnits} cái (Quy đổi: {log.equivalentProducts} SP)</span>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">NSLĐ Ca</span>
                          <span className={`font-mono font-bold ${log.laborProductivityPercent >= kpis.monthTarget ? "text-emerald-400" : "text-amber-400"}`}>
                            {log.laborProductivityPercent.toFixed(1)}%
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
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Tiêu Điểm Hàng Hỏng (Scrap)</span>
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
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Tỉ Lệ Lỗi Thao Tác</span>
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
                      Month 1 - Month 6 Metric
                    </span>
                  </div>
                  <div className="h-[380px]">
                    <ResponsiveContainer width="99%" height="100%">
                      <BarChart data={chartMonthlyScrap} margin={{ top: 40, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" tickFormatter={(v) => `Tháng ${v}`} fontSize={11} stroke="#64748b" />
                        <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} fontSize={11} stroke="#64748b" domain={YAXIS_DOMAIN} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }}
                          formatter={(value: any) => [`${Number(value).toLocaleString()} VND`, "Giá trị hàng hỏng"]}
                        />
                        <Bar isAnimationActive={false} dataKey="scrapCost" name="Cước phí hỏng (VND)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={35}>
                          <LabelList dataKey="scrapCost" position="top" fill="#f43f5e" fontSize={10} fontWeight="semibold" formatter={(v: any) => `${(v / 1000000).toFixed(1)}M`} />
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
                        <XAxis dataKey="week" fontSize={11} stroke="#64748b" />
                        <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} fontSize={11} stroke="#64748b" domain={YAXIS_DOMAIN} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }}
                          formatter={(value: any) => [`${Number(value).toLocaleString()} VND`, "Giá trị hàng hỏng"]}
                        />
                        <Bar isAnimationActive={false} dataKey="scrapCost" name="Cước phí hỏng (VND)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={18}>
                          <LabelList dataKey="scrapCost" position="top" fill="#f43f5e" fontSize={10} fontWeight="semibold" formatter={(v: any) => `${(v / 1000000).toFixed(1)}M`} />
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
                        <XAxis dataKey="month" tickFormatter={(v) => `Tháng ${v}`} fontSize={11} stroke="#64748b" />
                        <YAxis domain={YAXIS_DOMAIN} tickFormatter={(v) => `${v}%`} fontSize={11} stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }} />
                        <Line isAnimationActive={false} type="monotone" dataKey="errorRate" name="Tỉ lệ lỗi (%)" stroke="#fbbf24" strokeWidth={3} dot={{ r: 5, fill: "#fbbf24" }} activeDot={{ r: 7 }}>
                          <LabelList dataKey="errorRate" position="top" fill="#fbbf24" fontSize={10} fontWeight="semibold" formatter={(v: any) => `${v}%`} />
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
                        <XAxis dataKey="week" fontSize={11} stroke="#64748b" />
                        <YAxis domain={YAXIS_DOMAIN} tickFormatter={(v) => `${v}%`} fontSize={11} stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }} />
                        <Line isAnimationActive={false} type="monotone" dataKey="errorRate" name="Tỉ lệ lỗi (%)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 5, fill: "#f43f5e" }} activeDot={{ r: 7 }}>
                          <LabelList dataKey="errorRate" position="top" fill="#f43f5e" fontSize={10} fontWeight="semibold" formatter={(v: any) => `${v}%`} />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* CHÍNH XÁC CÁC BẢNG TRÌNH BÀY SÁT BẢNG EXCEL TRONG ẢNH */}
              <div className="bg-slate-900/30 rounded-xl border border-slate-800/60 p-5 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-rose-500" />
                    Hồ Sơ Danh Mục Lỗi Sản Lượng (Trích xuất từ Excel gốc)
                  </h4>
                  <p className="text-xs text-slate-400">Đồng bộ chính xác từ biểu mẫu Excel lưu trữ kỹ thuật của Phân xưởng DCLR</p>
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
                        <tr key="scr-month-header" className="bg-slate-900/30 text-slate-400 font-semibold border-b border-slate-850 font-mono">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                            <td key={`tb2-m-${m}`} className="py-2.5 px-2 text-right border-l border-slate-850 font-semibold text-[10px]">T {m}</td>
                          ))}
                        </tr>
                        <tr key="scr-month-values" className="border-b border-slate-850 text-slate-300 font-mono">
                          {displayMonthlyScrap.map((m, idx) => (
                            <td key={`tb2-mv-${m.month}`} className="py-1 px-1 border-l border-slate-850">
                              <input 
                                type="number" 
                                value={m.scrapCost === null ? "" : m.scrapCost}
                                onChange={(e) => updateScrapMetric("monthly", idx, e.target.value)}
                                readOnly={m.scrapCost !== null}
                                className={`w-full min-w-[70px] bg-transparent text-right outline-none p-1 rounded font-semibold text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  m.scrapCost !== null ? "cursor-not-allowed opacity-80" : "hover:bg-slate-800/50 focus:bg-slate-800 focus:text-rose-400"
                                }`}
                                placeholder="—"
                              />
                            </td>
                          ))}
                        </tr>
                        <tr key="scr-week-header-label" className="bg-slate-900/30 font-semibold">
                          <td colSpan={13} className="py-2 px-3 text-rose-400 border-t border-slate-800 font-sans">
                            Báo cáo hàng hỏng Tuần
                          </td>
                        </tr>
                        <tr key="scr-week-header-codes" className="bg-slate-900/40 text-slate-400 border-b border-slate-850 font-mono text-[10px]">
                          <td className="py-2 px-3 font-sans text-slate-450">Mã Tuần</td>
                          {displayWeeklyScrap.map(w => (
                            <td key={`tb2-w-${w.week}`} className="py-1.5 px-1.5 text-right border-l border-slate-850 font-semibold">{w.week}</td>
                          ))}
                        </tr>
                        <tr key="scr-week-values" className="text-slate-350 font-mono">
                          <td className="py-2 px-3 bg-slate-950/20 text-slate-400 font-sans">Chi phí (VND)</td>
                          {displayWeeklyScrap.map((w, idx) => (
                            <td key={`tb2-wv-${w.week}`} className="py-1 px-1 border-l border-slate-850">
                              <input 
                                type="number" 
                                value={w.scrapCost === null ? "" : w.scrapCost}
                                onChange={(e) => updateScrapMetric("weekly", idx, e.target.value)}
                                readOnly={w.scrapCost !== null}
                                className={`w-full min-w-[60px] bg-transparent text-right outline-none p-1 rounded font-semibold text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  w.scrapCost !== null ? "cursor-not-allowed opacity-80" : "hover:bg-slate-800/50 focus:bg-slate-800 focus:text-amber-500"
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
                                value={w.errorRate === null ? "" : w.errorRate}
                                onChange={(e) => updateDclrErrorMetric("weekly", idx, e.target.value)}
                                readOnly={w.errorRate !== null}
                                className={`w-full min-w-[50px] bg-transparent text-center outline-none p-1 rounded font-semibold text-[11px] ${
                                  w.errorRate === null ? "text-slate-500 hover:bg-slate-800/50 focus:bg-slate-800" :
                                  w.errorRate > 3 ? "text-rose-450 cursor-not-allowed" : "text-emerald-400 cursor-not-allowed"
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
                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                        <YAxis domain={YAXIS_DOMAIN} tickFormatter={(val) => `${val}%`} stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", color: "#f8fafc" }}
                          formatter={(value: any, name: any) => [`${value}%`, name === "productivity2025" ? "Năm 2025" : "Năm 2026"]}
                        />
                        <Legend formatter={(value: any) => value === "productivity2025" ? "2025" : "2026"} />
                        <Bar isAnimationActive={false} dataKey="productivity2025" name="Năm 2025" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                          <LabelList dataKey="productivity2025" position="top" fill="#3b82f6" fontSize={10} fontWeight="semibold" formatter={(v: any) => `${v}%`} />
                        </Bar>
                        <Bar isAnimationActive={false} dataKey="productivity2026" name="Năm 2026" fill="#f97316" radius={[2, 2, 0, 0]}>
                          <LabelList dataKey="productivity2026" position="top" fill="#f97316" fontSize={10} fontWeight="semibold" formatter={(v: any) => `${v}%`} />
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
                          <LabelList dataKey="productivity" position="top" fill="#10b981" fontSize={10} fontWeight="semibold" formatter={(v: any) => `${v}%`} />
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
      )}


          {/* ACTIVE TAB: LOGGING INPUT FORM */}
          
        {activeTab === "imei-tracking" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Barcode className="w-6 h-6 text-rose-500" />
                Theo Dõi IMEI Sản Xuất
              </h2>
              <p className="text-sm text-slate-400">
                Danh sách các mã IMEI đã quét và lưu vào hệ thống.
              </p>
            </div>


            {/* KHAI BÁO IMEI */}
            <div className="bg-slate-900/30 rounded-xl border border-slate-800/60 overflow-hidden flex flex-col p-4 space-y-4">
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
                    value={selectedDeclareDate}
                    onChange={(e) => setSelectedDeclareDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Mã Sản Phẩm {filteredDeclareProducts.length === 0 && <span className="text-rose-500 normal-case">(Chưa có KHSX ngày này)</span>}</label>
                  <select
                    id="declareImeiProduct"
                    value={selectedDeclareProductId}
                    onChange={(e) => setSelectedDeclareProductId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans"
                  >
                    {filteredDeclareProducts.length > 0 ? (
                      filteredDeclareProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                      ))
                    ) : (
                      <option value="">-- Không có model sản xuất --</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                {/* Quick Scan Input */}
                <div className="bg-slate-900/40 p-5 rounded-lg border border-slate-800 space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Quét IMEI Khai Báo (KHSX)</label>
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-700/60 flex items-center justify-center">
                        <Barcode className="w-6 h-6 text-emerald-500" />
                      </div>
                      <input
                        type="text"
                        id="declareImeiInputEl"
                        placeholder={filteredDeclareProducts.length > 0 ? "Quét IMEI vào đây để lưu trực tiếp vào danh sách..." : "Không có KHSX - Vui lòng chọn ngày khác..."}
                        value={declareImeiInput}
                        disabled={filteredDeclareProducts.length === 0}
                        onChange={(e) => setDeclareImeiInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleDeclareImeiSubmit(declareImeiInput);
                          }
                        }}
                        className={`flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-white font-mono focus:border-emerald-500 outline-none placeholder-slate-600 text-sm shadow-inner ${filteredDeclareProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <button
                        type="button"
                        disabled={filteredDeclareProducts.length === 0}
                        onClick={() => handleDeclareImeiSubmit(declareImeiInput)}
                        className={`bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-xl flex items-center justify-center shrink-0 text-sm cursor-pointer transition-all active:scale-95 shadow-lg shadow-emerald-900/20 ${filteredDeclareProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Ghi Nhận
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-slate-500 italic bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    <span className="text-emerald-500 font-bold not-italic">HƯỚNG DẪN:</span>
                    <p>Đặt con trỏ vào ô nhập liệu và sử dụng máy quét. Mỗi mã IMEI hợp lệ sẽ được hệ thống kiểm tra đối chiếu KHSX và tự động lưu trực tiếp vào bảng danh sách phía dưới.</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-slate-900/30 rounded-xl border border-slate-800/60 overflow-hidden flex flex-col">
              {/* SUB-TABS SELECTOR */}
              <div className="flex border-b border-slate-200 bg-slate-100 p-1 gap-1">
                <button
                  onClick={() => setImeiSubTab("scanned")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    imeiSubTab === "scanned"
                      ? "bg-rose-600 text-white shadow shadow-rose-600/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <ScanBarcode className="w-4 h-4" />
                  Lịch Sử Quét Thực Tế ({scannedImeis.length})
                </button>
                <button
                  onClick={() => setImeiSubTab("declared")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    imeiSubTab === "declared"
                      ? "bg-emerald-600 text-white shadow shadow-emerald-600/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Danh Sách Khai Báo ({declaredImeis.length})
                </button>
                <button
                  onClick={() => setImeiSubTab("compare")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    imeiSubTab === "compare"
                      ? "bg-sky-600 text-white shadow shadow-sky-600/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Đối Chiếu & So Sánh Số Liệu
                </button>
              </div>

              {/* VIEW 1: SCANNED HISTORY */}
              {imeiSubTab === "scanned" && (
                <>
                  <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                     <div>
                       <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                          <List className="w-4 h-4 text-rose-500" />
                          Lịch Sử Quét ({filteredScannedImeis.length})
                       </h3>
                       <p className="text-[11px] text-slate-400 mt-1">Truy xuất danh sách IMEI thực tế sản xuất tại xưởng.</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={imeiFilterDate}
                          onChange={(e) => setImeiFilterDate(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Tìm nhanh IMEI, Model..."
                          value={imeiSearchTerm}
                          onChange={(e) => setImeiSearchTerm(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                        />
                     </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800">
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Thời Gian</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mã IMEI</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mã Model</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tên Sản Phẩm</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Khung Giờ</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredScannedImeis.length > 0 ? (
                          filteredScannedImeis.map((item) => {
                            const prod = products.find(p => p.id === item.productId);
                            return (
                              <tr key={item.id} className="hover:bg-slate-900/50 transition">
                                <td className="p-3 text-sm text-slate-300 font-mono">
                                   {new Date(item.timestamp).toLocaleString("vi-VN")}
                                </td>
                                <td className="p-3 text-sm text-emerald-400 font-mono font-bold">
                                   {item.imei}
                                </td>
                                <td className="p-3 text-sm text-slate-200">
                                   {prod?.code || item.productId}
                                </td>
                                <td className="p-3 text-sm text-slate-400 truncate max-w-[200px]" title={prod?.name || "N/A"}>
                                   {prod?.name || "N/A"}
                                </td>
                                <td className="p-3 text-sm text-rose-400 font-mono">
                                   {item.slot}
                                </td>
                                <td className="p-3 text-right">
                                   {deleteConfirmId === item.id ? (
                                     <div className="flex items-center justify-end gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                                       <span className="text-[10px] text-slate-400 font-sans">Xóa?</span>
                                       <button
                                         onClick={() => {
                                           setScannedImeis(prev => prev.filter(x => x.id !== item.id));
                                           setDeleteConfirmId(null);
                                         }}
                                         className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                                       >
                                         Xác Nhận
                                       </button>
                                       <button
                                         onClick={() => setDeleteConfirmId(null)}
                                         className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                                       >
                                         Hủy
                                       </button>
                                     </div>
                                   ) : (
                                     <button 
                                       onClick={() => setDeleteConfirmId(item.id)}
                                       className="text-rose-500 hover:text-rose-400 p-1 cursor-pointer"
                                       title="Xóa"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   )}
                                 </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr key="empty-scanned-imeis">
                            <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                              Chưa có dữ liệu IMEI nào được quét phù hợp với bộ lọc.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* VIEW 2: DECLARED HISTORY */}
              {imeiSubTab === "declared" && (
                <>
                  <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                     <div>
                       <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-emerald-500" />
                          Danh Sách IMEI Đã Khai Báo KHSX ({filteredDeclaredImeis.length})
                       </h3>
                       <p className="text-[11px] text-slate-400 mt-1">Truy xuất kế hoạch sản xuất IMEI đã được nạp trước.</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={declareFilterDate}
                          onChange={(e) => setDeclareFilterDate(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Tìm nhanh IMEI, Model..."
                          value={declareSearchTerm}
                          onChange={(e) => setDeclareSearchTerm(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                     </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800">
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ngày Khai Báo</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mã IMEI</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mã Model</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tên Sản Phẩm</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Trạng Thái</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredDeclaredImeis.length > 0 ? (
                          filteredDeclaredImeis.map((item, index) => {
                            const prod = products.find(p => p.id === item.productId);
                            const isAlreadyScanned = scannedImeis.some(s => s.imei === item.imei);
                            return (
                              <tr key={`${item.imei}-${index}`} className="hover:bg-slate-900/50 transition">
                                <td className="p-3 text-sm text-slate-300 font-mono">
                                   {item.date}
                                </td>
                                <td className="p-3 text-sm text-emerald-400 font-mono font-bold">
                                   {item.imei}
                                </td>
                                <td className="p-3 text-sm text-slate-200">
                                   {prod?.code || item.productId}
                                </td>
                                <td className="p-3 text-sm text-slate-400 truncate max-w-[200px]" title={prod?.name || "N/A"}>
                                   {prod?.name || "N/A"}
                                </td>
                                <td className="p-3 text-xs">
                                   {isAlreadyScanned ? (
                                     <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                       Đã Quét Thực Tế
                                     </span>
                                   ) : (
                                     <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                                       Chưa Sản Xuất
                                     </span>
                                   )}
                                </td>
                                <td className="p-3 text-right">
                                   {deleteDeclareConfirmImei === item.imei ? (
                                     <div className="flex items-center justify-end gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                                       <span className="text-[10px] text-slate-400 font-sans">Xóa?</span>
                                       <button
                                         onClick={() => {
                                           setDeclaredImeis(prev => prev.filter(x => x.imei !== item.imei));
                                           setDeleteDeclareConfirmImei(null);
                                         }}
                                         className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                                       >
                                         Xác Nhận
                                       </button>
                                       <button
                                         onClick={() => setDeleteDeclareConfirmImei(null)}
                                         className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                                       >
                                         Hủy
                                       </button>
                                     </div>
                                   ) : (
                                     <button 
                                       onClick={() => setDeleteDeclareConfirmImei(item.imei)}
                                       className="text-rose-500 hover:text-rose-400 p-1 cursor-pointer"
                                       title="Xóa Khai Báo"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   )}
                                 </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr key="empty-declared-imeis">
                            <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                              Không tìm thấy IMEI khai báo nào phù hợp với bộ lọc.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* VIEW 3: DETAILED COMPARISON AND DISCREPANCY ANALYSIS */}
              {imeiSubTab === "compare" && (
                <>
                  {/* METRICS PANEL */}
                  <div className="p-4 bg-slate-900/40 border-b border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/60">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Tổng IMEI Khai Báo</div>
                      <div className="text-lg font-bold text-white mt-0.5 font-mono">
                        {comparisonRecords.filter(r => r.status === "matched" || r.status === "missing").length}
                      </div>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/60">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Thực Tế Đã Quét</div>
                      <div className="text-lg font-bold text-rose-400 mt-0.5 font-mono">
                        {scannedImeis.length}
                      </div>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/60">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Đã Trùng Khớp</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">
                        {comparisonRecords.filter(r => r.status === "matched").length}
                      </div>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/60">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Tỷ Lệ Trùng Khớp</div>
                      <div className="text-lg font-bold text-sky-400 mt-0.5 font-mono">
                        {(() => {
                          const declCount = comparisonRecords.filter(r => r.status === "matched" || r.status === "missing").length;
                          const matchedCount = comparisonRecords.filter(r => r.status === "matched").length;
                          return declCount > 0 ? `${Math.round((matchedCount / declCount) * 100)}%` : "0%";
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* CONTROLS AREA */}
                  <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/20">
                     <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Lọc Trạng Thái:</span>
                        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 gap-1 flex-wrap">
                          <button
                            onClick={() => setCompareStatusFilter("all")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                              compareStatusFilter === "all" ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                          >
                            Tất cả ({filteredComparisonRecords.length})
                          </button>
                          <button
                            onClick={() => setCompareStatusFilter("matched")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                              compareStatusFilter === "matched" ? "bg-emerald-950 text-emerald-400 border border-emerald-800/30" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                          >
                            Khớp ({comparisonRecords.filter(r => r.status === "matched").length})
                          </button>
                          <button
                            onClick={() => setCompareStatusFilter("missing")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                              compareStatusFilter === "missing" ? "bg-amber-950 text-amber-400 border border-amber-800/30" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                          >
                            Sót / Chưa Quét ({comparisonRecords.filter(r => r.status === "missing").length})
                          </button>
                          <button
                            onClick={() => setCompareStatusFilter("un-declared")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                              compareStatusFilter === "un-declared" ? "bg-rose-950 text-rose-400 border border-rose-800/30" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                          >
                            Quét Ngoài KHSX ({comparisonRecords.filter(r => r.status === "un-declared").length})
                          </button>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={imeiFilterDate}
                          onChange={(e) => setImeiFilterDate(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Tra cứu IMEI..."
                          value={imeiSearchTerm}
                          onChange={(e) => setImeiSearchTerm(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        <button
                          onClick={() => {
                            const dataToExport = filteredComparisonRecords.map(r => {
                              const prod = products.find(p => p.id === r.productId);
                              const statusText = r.status === "matched" ? "Đã khớp (Đã sản xuất)" :
                                                 r.status === "missing" ? "Thiếu (Chưa quét)" : "Quét ngoài KHSX";
                              return {
                                "Mã IMEI": r.imei,
                                "Mã Sản Phẩm": prod?.code || r.productId,
                                "Tên Sản Phẩm": prod?.name || "N/A",
                                "Ngày Khai Báo (KHSX)": r.declareDate || "N/A",
                                "Thời Gian Quét Thực Tế": r.scanTimestamp ? new Date(r.scanTimestamp).toLocaleString("vi-VN") : "N/A",
                                "Khung Giờ Quét": r.scanSlot || "N/A",
                                "Trạng Thái Đối Chiếu": statusText
                              };
                            });

                            const ws = XLSX.utils.json_to_sheet(dataToExport);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Doi_Chieu_IMEI");
                            XLSX.writeFile(wb, `Doi_Chieu_IMEI_Sunhouse_${imeiFilterDate || "Tat_Ca"}.xlsx`);
                          }}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Xuất File Đối Chiếu (Excel)
                        </button>
                     </div>
                  </div>

                  {/* COMPARISON TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800">
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mã IMEI</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mã Model</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tên Sản Phẩm</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ngày Khai Báo (KHSX)</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Thời Gian Quét</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Khung Giờ Quét</th>
                          <th className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kết Quả Đối Chiếu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredComparisonRecords.length > 0 ? (
                          filteredComparisonRecords.map((item, idx) => {
                            const prod = products.find(p => p.id === item.productId);
                            return (
                              <tr key={`${item.imei}-${idx}`} className="hover:bg-slate-900/50 transition">
                                <td className="p-3 text-sm text-slate-100 font-mono font-bold">
                                   {item.imei}
                                </td>
                                <td className="p-3 text-sm text-slate-300">
                                   {prod?.code || item.productId}
                                </td>
                                <td className="p-3 text-sm text-slate-400 truncate max-w-[200px]" title={prod?.name || "N/A"}>
                                   {prod?.name || "N/A"}
                                </td>
                                <td className="p-3 text-sm text-slate-400 font-mono">
                                   {item.declareDate || <span className="text-slate-600 font-sans">— (Không khai báo)</span>}
                                </td>
                                <td className="p-3 text-sm text-slate-400 font-mono">
                                   {item.scanTimestamp ? new Date(item.scanTimestamp).toLocaleString("vi-VN") : <span className="text-slate-600 font-sans">— (Chưa sản xuất)</span>}
                                </td>
                                <td className="p-3 text-sm text-rose-400 font-mono">
                                   {item.scanSlot || <span className="text-slate-600 font-sans">—</span>}
                                </td>
                                <td className="p-3 text-xs">
                                  {item.status === "matched" && (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1 w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      Đã Khớp (Đúng KHSX)
                                    </span>
                                  )}
                                  {item.status === "missing" && (
                                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold flex items-center gap-1 w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                      Sót (Chưa Sản Xuất)
                                    </span>
                                  )}
                                  {item.status === "un-declared" && (
                                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold flex items-center gap-1 w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                                      Quét Ngoài KHSX
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr key="empty-comparison-records">
                            <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                              Không tìm thấy bản ghi đối chiếu nào phù hợp.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

{activeTab === "logging" && (
            <motion.div
              key="logging"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 w-full"
            >
              
              {/* FORM ZONE */}
              <div className="w-full bg-slate-900/30 p-3 rounded-xl border border-slate-800/60 space-y-3">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <PlusCircle className="text-rose-500 w-5 h-5" />
                    Khởi tạo Nhật Ký Ca mới
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ghi nhiều model chung một ngày, cập nhật chi tiết khung giờ 1h/lần</p>
                </div>

                {formMessage && (
                  <div className={`p-3 rounded text-xs ${
                    formMessage.startsWith("✅") ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"
                  }`}>
                    {formMessage}
                  </div>
                )}

                <form onSubmit={handleAddLog} className="space-y-3 text-xs text-slate-300">
                  
                  {/* New Excel-like Form Layout */}
                  <div className="space-y-3">
                    {/* Header Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-400 font-mono uppercase">Ngày ghi nhận</label>
                        <input type="date" value={formDate} onChange={handleDateChange} className="w-full bg-slate-950/40 border border-slate-700/60 rounded p-1.5 text-white font-mono focus:border-rose-500 outline-none" required />
                      </div>
                      
                      {/* Hidden fields as requested */}
                      <div className="hidden">
                        <select value={formShift} onChange={(e: any) => handleShiftChange(e.target.value)}>
                          <option value="Ca HC (08:00 - 17:00)">Ca HC (08:00 - 17:00)</option>
                        </select>
                        <select value={formLineId} onChange={(e) => setFormLineId(e.target.value)}>
                          {SUNHOUSE_LINES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <select value={formTechnician} onChange={(e) => setFormTechnician(e.target.value)}>
                          <option value="Nguyễn Minh Hoàng Khiêm ( DCLR )">Nguyễn Minh Hoàng Khiêm ( DCLR )</option>
                          <option value="Nguyễn Quốc Thịnh ( DCBG )">Nguyễn Quốc Thịnh ( DCBG )</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 col-span-1">
                        <label className="text-[11px] text-emerald-400 font-mono uppercase flex items-center gap-1">
                          <PlusCircle className="w-3 h-3" /> Thêm khung giờ
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="8H - 9H"
                            value={newSlotInput}
                            onChange={(e) => setNewSlotInput(e.target.value)}
                            className="w-full bg-slate-950/40 border border-slate-700/60 rounded p-1.5 text-white font-mono focus:border-rose-500 outline-none placeholder-slate-750 text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddSlot}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 rounded flex items-center justify-center shrink-0 text-xs cursor-pointer"
                            title="Thêm khung giờ mới"
                          >
                            Thêm
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Máy quét mã vạch (Barcode Scanner) */}
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/80 space-y-2">
                      <label className="text-[11px] text-sky-400 font-mono uppercase flex items-center gap-1">
                        <ScanBarcode className="w-3 h-3" /> Quét mã IMEI (Tự động cộng 1 vào khung giờ hiện tại)
                      </label>
                      <div className="flex gap-2 items-center">
                        <div className="bg-slate-950/50 p-2 rounded border border-slate-800 text-sky-400 font-mono text-[10px] px-3 flex items-center gap-1.5 shrink-0 select-none">
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
                          TỰ ĐỘNG NHẬN DIỆN MODEL
                        </div>
                        <input
                          type="text"
                          placeholder="Đặt con trỏ chuột vào đây và quét IMEI..."
                          value={scanInput}
                          onChange={(e) => setScanInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               e.preventDefault();
                               handleScanSubmit(e.currentTarget.value.toUpperCase());
                             }
                          }}
                          className="flex-1 bg-slate-950/40 border border-slate-700/60 rounded p-1.5 text-white font-mono focus:border-sky-500 outline-none placeholder-slate-600 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleScanSubmit(scanInput)}
                          className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-1.5 rounded flex items-center justify-center shrink-0 text-xs cursor-pointer transition-colors"
                        >
                          Ghi Nhận
                        </button>
                      </div>
                    </div>

                    {/* Matrix Input Table */}
                    <div className="overflow-x-auto border border-slate-800 rounded-lg shadow-xl shadow-slate-950">
                      <table className="matrix-table w-full text-[12px] font-mono whitespace-nowrap text-center">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase">
                            <th className="py-1 px-1 text-left sticky left-0 bg-slate-900 z-10 min-w-[160px] w-[160px]">Model Sản Xuất</th>
                            <th className="py-1 px-1 border-r border-slate-800 min-w-[65px] w-[65px] text-center">HSQĐ</th>
                            <th className="py-1 px-1 border-r border-slate-800 min-w-[95px] w-[95px] text-center">KHSX Ngày</th>
                            {formSlots.map(slot => (
                              <th key={slot} className="py-1 px-1 border-r border-slate-800 bg-slate-900/50 relative group min-w-[80px] w-[80px] text-center">
                                <div className="flex items-center justify-center gap-0.5 flex-nowrap whitespace-nowrap text-[11px] font-bold">
                                  <span>{slot}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlot(slot)}
                                    className="opacity-0 group-hover:opacity-100 transition text-rose-500 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                                    title={`Xóa khung giờ ${slot}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </th>
                            ))}
                            <th className="py-1 px-1 border-r border-slate-800 text-rose-400 min-w-[85px] w-[85px] text-center">Tổng Lượng</th>
                            <th className="py-1 px-1 border-r border-slate-800 text-amber-500 min-w-[85px] w-[85px] text-center">Chênh Lệch</th>
                            <th className="py-1 px-1 border-r border-slate-800 text-cyan-400 min-w-[115px] w-[115px] text-center">SL CẦN HOÀN THÀNH LSX</th>
                            <th className="py-1 px-1 text-center text-slate-500 w-8">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950/30 text-slate-200">
                          {formModelItems
                            .filter((item) => {
                              if (filterDivision === "ALL") return true;
                              const p = products.find((x) => x.id === item.productId);
                              if (!p) return true;
                              return p.group === filterDivision;
                            })
                            .map((item, idx) => {
                              const prodDef = products.find((p) => p.id === item.productId) || products[0];
                              if (!prodDef) return null;
                              const modelActual = Object.keys(item.hourlyActuals).reduce((sum, key) => sum + (item.hourlyActuals[key] || 0), 0);
                              return (
                                <tr key={`model-row-${item.id}-${idx}`} className="hover:bg-slate-900/50 transition">
                                  <td className="py-1 px-1 sticky left-0 bg-slate-950/50 z-10 text-left border-r border-slate-800 min-w-[160px] w-[160px]">
                                    <div className="flex gap-1 items-center w-full">
                                      <span className="text-slate-600 font-bold ml-1 shrink-0 select-none whitespace-nowrap">{idx + 1}.</span>
                                      <select
                                        value={item.productId}
                                        onChange={(e) => handleUpdateItem(item.id, { productId: e.target.value })}
                                        className="w-full bg-transparent border-0 text-white focus:ring-0 outline-none cursor-pointer whitespace-nowrap text-[13px] py-0.5"
                                      >
                                        {products
                                          .filter(prod => filterDivision === "ALL" || prod.group === filterDivision)
                                          .map((prod) => (
                                          <option key={prod.id} value={prod.id} className="bg-slate-900">
                                            {getProductModelCode(prod.name)}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </td>
                                  <td className="py-1 px-2 border-r border-slate-800 text-cyan-500 font-bold min-w-[65px] w-[65px] text-center">{prodDef.factor}</td>
                                  <td className="p-0 border-r border-slate-800 min-w-[95px] w-[95px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.dailyPlan !== undefined ? item.dailyPlan : ""}
                                      onChange={(e) => handleUpdateItem(item.id, { dailyPlan: parseInt(e.target.value) || 0 })}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center focus:bg-slate-900 focus:outline-none font-bold text-amber-400 placeholder-slate-700 text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="0"
                                    />
                                  </td>
                                  {formSlots.map(slot => (
                                    <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                      <input
                                        type="number"
                                        min={0}
                                        value={item.hourlyActuals[slot] !== undefined ? item.hourlyActuals[slot] : ""}
                                        onChange={(e) => handleUpdateItemHourly(item.id, slot, parseInt(e.target.value) || 0)}
                                        className="w-full h-full min-h-[30px] bg-transparent text-center focus:bg-slate-900 focus:outline-none font-bold text-white placeholder-slate-700 text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                      />
                                    </td>
                                  ))}
                                  <td className="py-1 px-2 font-bold text-emerald-400 border-r border-slate-800 bg-slate-900/30 min-w-[85px] w-[85px] text-center">{modelActual}</td>
                                  <td className={`py-1 px-2 font-bold border-r border-slate-800 bg-slate-900/30 text-center min-w-[85px] w-[85px] ${
                                    modelActual - (item.dailyPlan || 0) >= 0 ? "text-emerald-400" : "text-rose-500"
                                  }`}>
                                    {modelActual - (item.dailyPlan || 0) > 0 ? `+${modelActual - (item.dailyPlan || 0)}` : modelActual - (item.dailyPlan || 0)}
                                  </td>
                                  <td className="py-1 px-2 font-bold text-cyan-400 border-r border-slate-800 bg-slate-900/30 text-center min-w-[115px] w-[115px]">
                                    {Math.max(0, (item.dailyPlan || 0) + getPrevDayLeftover(item.productId, formDate) - modelActual)}
                                  </td>
                                  <td className="py-1 px-2">
                                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-rose-500 hover:text-rose-400 transition" disabled={formModelItems.length === 1}>
                                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}

                          {/* 2. Add Row Button */}
                          <tr key="add-row-btn">
                            <td colSpan={formSlots.length + 7} className="py-1 px-1 text-left bg-slate-900/30">
                              <button type="button" onClick={handleAddNewItem} className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 hover:text-emerald-400">
                                <PlusCircle className="w-3 h-3" /> Thêm Model
                              </button>
                            </td>
                          </tr>

                          {/* 3. Metrics Summary Rows */}
                          {/* Total Qty */}
                          <tr key="total-qty-row" className="bg-slate-900/60 font-bold border-t-2 border-slate-700">
                            <td colSpan={3} className="py-1 px-1 text-right text-slate-300 border-r border-slate-800 sticky left-0 bg-slate-900/60 z-10">
                              Tổng sản lượng (Cái)
                            </td>
                            {formSlots.map(slot => {
                              const sum = formModelItems
                                .filter(item => filterDivision === "ALL" || (products.find(x => x.id === item.productId) || products[0]).group === filterDivision)
                                .reduce((acc, item) => acc + (item.hourlyActuals[slot] || 0), 0);
                              return <td key={slot} className="py-1 px-1 border-r border-slate-800 text-white min-w-[80px] w-[80px] text-center">{sum}</td>
                            })}
                            <td className="py-1 px-1 border-r border-slate-800 text-rose-400">{displayTotalActualQty}</td>
                            <td className={`py-1 px-1 border-r border-slate-800 font-bold text-center ${
                              displayTotalActualQty - displayTotalPlanQty >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              {displayTotalActualQty - displayTotalPlanQty > 0 
                                ? `+${displayTotalActualQty - displayTotalPlanQty}` 
                                : displayTotalActualQty - displayTotalPlanQty}
                            </td>
                            <td className="py-1 px-1 border-r border-slate-800 text-cyan-400 font-bold text-center">
                              {displayTotalRemainingQty}
                            </td>
                            <td></td>
                          </tr>

                          {/* Equivalent Qty */}
                          <tr key="equivalent-qty-row" className="bg-slate-900/80 font-bold">
                            <td colSpan={3} className="py-1 px-1 text-right text-cyan-400 border-r border-slate-800 sticky left-0 bg-slate-900/80 z-10 whitespace-nowrap">
                              Sản phẩm quy đổi (SP)
                            </td>
                            {formSlots.map(slot => {
                              let sumEq = 0;
                              formModelItems
                                .filter(item => filterDivision === "ALL" || (products.find(x => x.id === item.productId) || products[0]).group === filterDivision)
                                .forEach(item => {
                                const p = products.find(x => x.id === item.productId) || products[0];
                                sumEq += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
                              });
                              return <td key={slot} className="py-1 px-1 border-r border-slate-800 text-cyan-400 min-w-[80px] w-[80px] text-center">{sumEq}</td>
                            })}
                            <td className="py-1 px-1 border-r border-slate-800 text-cyan-400">{displayTotalEqQty}</td>
                            <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                            <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                            <td></td>
                          </tr>

                          {/* Tỷ lệ hoàn thành KHSX (%) */}
                          <tr key="completion-rate-row" className="bg-slate-900/90 font-bold border-t border-slate-800 text-amber-400">
                            <td colSpan={3} className="py-1 px-1 text-right border-r border-slate-800 sticky left-0 bg-slate-900/90 z-10 text-amber-400 whitespace-nowrap">
                              Tỷ lệ hoàn thành KHSX (%)
                            </td>
                            {formSlots.map(slot => {
                              const sumActual = formModelItems
                                .filter(item => filterDivision === "ALL" || (products.find(x => x.id === item.productId) || products[0]).group === filterDivision)
                                .reduce((acc, item) => acc + (item.hourlyActuals[slot] || 0), 0);
                              const hourlyPlan = displayTotalPlanQty / (formSlots.length || 1);
                              let rate = 0;
                              if (hourlyPlan > 0) {
                                rate = Number(((sumActual / hourlyPlan) * 100).toFixed(1));
                              }
                              return (
                                <td key={slot} className={`py-1 px-1 border-r border-slate-800 min-w-[80px] w-[80px] text-center ${rate >= 100 ? "text-emerald-400" : rate > 0 ? "text-amber-400" : "text-rose-400"}`}>
                                  {displayTotalPlanQty > 0 ? `${rate}%` : "-"}
                                </td>
                              )
                            })}
                            <td className="py-1 px-1 border-r border-slate-800 text-amber-400">
                              {displayTotalPlanQty > 0 
                                ? `${((displayTotalActualQty / displayTotalPlanQty) * 100).toFixed(1)}%` 
                                : "-"}
                            </td>
                            <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                            <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                            <td></td>
                          </tr>

                          {/* Productivity RO % */}
                          {(filterDivision === "ALL" || filterDivision === "MLN") && (
                            <tr key="productivity-ro-row" className="bg-slate-900 font-bold border-t border-slate-800">
                              <td colSpan={3} className="py-1 px-1 text-right text-emerald-400 border-r border-slate-800 sticky left-0 bg-slate-900 z-10 whitespace-nowrap">
                                NSLĐ DCRO (%)
                              </td>
                              {formSlots.map(slot => {
                                let sumEqRO = 0;
                                formModelItems.forEach(item => {
                                  const p = products.find(x => x.id === item.productId) || products[0];
        if (!p) return;
        if (p.group === "MLN") {
                                    sumEqRO += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
                                  }
                                });
                                const workersRO = (formOfficialWorkersRO[slot] || 0) + (formSeasonalWorkersRO[slot] || 0);
                                let prodPct = 0;
                                if (workersRO > 0) {
                                  prodPct = Number(((sumEqRO / (workersRO * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
                                }
                                return (
                                  <td key={slot} className={`py-1 px-1 border-r border-slate-800 min-w-[80px] w-[80px] text-center ${prodPct >= kpis.monthTarget ? "text-emerald-400" : prodPct >= 100 ? "text-amber-400" : "text-rose-400"}`}>
                                    {prodPct > 0 ? `${prodPct}%` : "-"}
                                  </td>
                                )
                              })}
                              <td className="py-1 px-1 border-r border-slate-800 text-emerald-400">{formAggregates.avgProductivityRO}%</td>
                              <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                              <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                              <td></td>
                            </tr>
                          )}

                          {/* Productivity RMA % */}
                          {(filterDivision === "ALL" || filterDivision === "MLN" || filterDivision === "RMA") && (
                            <tr key="productivity-rma-row" className="bg-slate-900 font-bold border-t border-slate-800">
                              <td colSpan={3} className="py-1 px-1 text-right text-amber-400 border-r border-slate-800 sticky left-0 bg-slate-900 z-10 whitespace-nowrap">
                                NSLĐ DCRMA (%)
                              </td>
                              {formSlots.map(slot => {
                                let sumEqRMA = 0;
                                formModelItems.forEach(item => {
                                  const p = products.find(x => x.id === item.productId) || products[0];
                                  if (!p) return;
                                  const isRMA = p.group === "RMA" || 
                                                (p.group === "MLN" && (
                                                  p.name.toLowerCase().includes("rma") || 
                                                  p.code.toLowerCase().includes("rma") || 
                                                  p.id.toLowerCase().includes("rma")
                                                ));
                                  if (isRMA) {
                                    sumEqRMA += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
                                  }
                                });
                                const workersRMA = (formOfficialWorkersRMA[slot] || 0) + (formSeasonalWorkersRMA[slot] || 0);
                                let prodPct = 0;
                                if (workersRMA > 0) {
                                  prodPct = Number(((sumEqRMA / (workersRMA * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
                                }
                                return (
                                  <td key={slot} className={`py-1 px-1 border-r border-slate-800 min-w-[80px] w-[80px] text-center ${prodPct >= 100 ? "text-emerald-400" : prodPct > 0 ? "text-amber-400" : "text-rose-400"}`}>
                                    {prodPct > 0 ? `${prodPct}%` : "-"}
                                  </td>
                                )
                              })}
                              <td className="py-1 px-1 border-r border-slate-800 text-amber-400">{formAggregates.avgProductivityRMA}%</td>
                              <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                              <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                              <td></td>
                            </tr>
                          )}

                          {/* Productivity BG % */}
                          {(filterDivision === "ALL" || filterDivision === "BG") && (
                            <tr key="productivity-bg-row" className="bg-slate-900 font-bold">
                              <td colSpan={3} className="py-1 px-1 text-right text-sky-400 border-r border-slate-800 sticky left-0 bg-slate-900 z-10 whitespace-nowrap">
                                NSLĐ DCBG (%)
                              </td>
                              {formSlots.map(slot => {
                                let sumEqBG = 0;
                                formModelItems.forEach(item => {
                                  const p = products.find(x => x.id === item.productId) || products[0];
                                  if (p.group === "BG") {
                                    sumEqBG += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
                                  }
                                });
                                const workersBG = (formOfficialWorkersBG[slot] || 0) + (formSeasonalWorkersBG[slot] || 0);
                                let prodPct = 0;
                                if (workersBG > 0) {
                                  prodPct = Number(((sumEqBG / (workersBG * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
                                }
                                return (
                                  <td key={slot} className={`py-1 px-1 border-r border-slate-800 min-w-[80px] w-[80px] text-center ${prodPct >= kpis.monthTarget ? "text-sky-400" : prodPct >= 100 ? "text-amber-400" : "text-rose-400"}`}>
                                    {prodPct > 0 ? `${prodPct}%` : "-"}
                                  </td>
                                )
                              })}
                              <td className="py-1 px-1 border-r border-slate-800 text-sky-400">{formAggregates.avgProductivityBG}%</td>
                              <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                              <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                              <td></td>
                            </tr>
                          )}

                          {/* Combined Productivity % */}
                          {filterDivision === "ALL" && (
                            <tr key="productivity-combined-row" className="bg-slate-900/40 font-semibold text-slate-400">
                              <td colSpan={3} className="py-1 px-1 text-right border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 whitespace-nowrap">
                                NSLĐ Phân Xưởng LR (%)
                              </td>
                              {formSlots.map(slot => {
                                let sumEqCombined = 0;
                                formModelItems.forEach(item => {
                                  const p = products.find(x => x.id === item.productId) || products[0];
                                  sumEqCombined += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
                                });
                                const workersCombined = (formOfficialWorkersRO[slot] || 0) + (formSeasonalWorkersRO[slot] || 0) + (formOfficialWorkersBG[slot] || 0) + (formSeasonalWorkersBG[slot] || 0) + (formOfficialWorkersRMA[slot] || 0) + (formSeasonalWorkersRMA[slot] || 0);
                                let prodPct = 0;
                                if (workersCombined > 0) {
                                  prodPct = Number(((sumEqCombined / (workersCombined * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
                                }
                                return (
                                  <td key={slot} className="py-1 px-1 border-r border-slate-800 min-w-[80px] w-[80px] text-center">
                                    {prodPct > 0 ? `${prodPct}%` : "-"}
                                  </td>
                                )
                              })}
                              <td className="py-1 px-1 border-r border-slate-800">{formAggregates.avgProductivity}%</td>
                              <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                              <td className="py-1 px-1 border-r border-slate-800 text-slate-500">-</td>
                              <td></td>
                            </tr>
                          )}

                          {/* Spacer */}
                          <tr key="spacer-1" className="h-2 bg-slate-950">
                            <td colSpan={formSlots.length + 7}></td>
                          </tr>

                          {/* --- worker tracking: LINE RO --- */}
                          {(filterDivision === "ALL" || filterDivision === "MLN") && (
                            <React.Fragment key="worker-tracking-ro">
                              <tr key="ro-header" className="bg-emerald-950/20 border-t border-emerald-900/50">
                                <td colSpan={3} className="py-1 px-1 text-left pl-2 text-emerald-400 font-bold border-r border-slate-800 sticky left-0 bg-slate-950 z-10 whitespace-nowrap">
                                  📍 DÂY CHUYỀN LẮP RÁP RO (DCRO)
                                </td>
                                <td colSpan={formSlots.length + 4}></td>
                              </tr>

                              <tr key="ro-official-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-rose-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS CHÍNH THỨC RO
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formOfficialWorkersRO[slot] !== undefined ? formOfficialWorkersRO[slot] : ""}
                                      onChange={(e) => handleUpdateOfficialWorkerRO(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-rose-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-rose-300 font-bold text-center">{formOfficialCountRO}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="ro-seasonal-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-amber-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS THỜI VỤ RO
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formSeasonalWorkersRO[slot] !== undefined ? formSeasonalWorkersRO[slot] : ""}
                                      onChange={(e) => handleUpdateSeasonalWorkerRO(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-amber-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-amber-300 font-bold text-center">{formSeasonalCountRO}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="ro-total-workers" className="bg-emerald-950/30">
                                <td colSpan={3} className="py-1 px-2 text-right text-emerald-400 font-bold border-r border-slate-800 sticky left-0 bg-emerald-950/90 z-10 pl-4 whitespace-nowrap">
                                  ↳ Tổng nhân sự DCRO
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="py-1 px-1 border-r border-slate-800 text-emerald-400 font-bold min-w-[80px] w-[80px] text-center">
                                    {(formOfficialWorkersRO[slot] || 0) + (formSeasonalWorkersRO[slot] || 0)}
                                  </td>
                                ))}
                                <td className="py-1 px-1 border-r border-slate-800 text-emerald-400 font-bold text-center">
                                  {formWorkersCountRO}
                                </td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              {/* Spacer */}
                              <tr key="ro-spacer" className="h-2 bg-slate-950">
                                <td colSpan={formSlots.length + 7}></td>
                              </tr>

                              {/* --- worker tracking: LINE RMA --- */}
                              <tr key="rma-header" className="bg-amber-950/20 border-t border-amber-900/50">
                                <td colSpan={3} className="py-1 px-1 text-left pl-2 text-amber-400 font-bold border-r border-slate-800 sticky left-0 bg-slate-950 z-10 whitespace-nowrap">
                                  📍 DÂY CHUYỀN LẮP RÁP RMA (RW)
                                </td>
                                <td colSpan={formSlots.length + 4}></td>
                              </tr>

                              <tr key="rma-official-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-rose-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS CHÍNH THỨC RMA
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formOfficialWorkersRMA[slot] !== undefined ? formOfficialWorkersRMA[slot] : ""}
                                      onChange={(e) => handleUpdateOfficialWorkerRMA(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-rose-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-rose-300 font-bold text-center">{formOfficialCountRMA}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="rma-seasonal-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-amber-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS THỜI VỤ RMA
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formSeasonalWorkersRMA[slot] !== undefined ? formSeasonalWorkersRMA[slot] : ""}
                                      onChange={(e) => handleUpdateSeasonalWorkerRMA(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-amber-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-amber-300 font-bold text-center">{formSeasonalCountRMA}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="rma-total-workers" className="bg-amber-950/30">
                                <td colSpan={3} className="py-1 px-2 text-right text-amber-400 font-bold border-r border-slate-800 sticky left-0 bg-amber-950/90 z-10 pl-4 whitespace-nowrap">
                                  ↳ Tổng nhân sự DCRMA
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="py-1 px-1 border-r border-slate-800 text-amber-400 font-bold min-w-[80px] w-[80px] text-center">
                                    {(formOfficialWorkersRMA[slot] || 0) + (formSeasonalWorkersRMA[slot] || 0)}
                                  </td>
                                ))}
                                <td className="py-1 px-1 border-r border-slate-800 text-amber-400 font-bold text-center">
                                  {formWorkersCountRMA}
                                </td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="rma-spacer" className="h-2 bg-slate-950">
                                <td colSpan={formSlots.length + 7}></td>
                              </tr>
                            </React.Fragment>
                          )}

                          {/* --- worker tracking: LINE BG --- */}
                          {(filterDivision === "ALL" || filterDivision === "BG") && (
                            <React.Fragment key="worker-tracking-bg">
                              <tr key="bg-header" className="bg-sky-950/20 border-t border-sky-900/50">
                                <td colSpan={3} className="py-1 px-1 text-left pl-2 text-sky-400 font-bold border-r border-slate-800 sticky left-0 bg-slate-950 z-10 whitespace-nowrap">
                                  📍 DÂY CHUYỀN LẮP RÁP BẾP GAS (DCBG)
                                </td>
                                <td colSpan={formSlots.length + 4}></td>
                              </tr>

                              <tr key="bg-official-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-rose-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS CHÍNH THỨC BG
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formOfficialWorkersBG[slot] !== undefined ? formOfficialWorkersBG[slot] : ""}
                                      onChange={(e) => handleUpdateOfficialWorkerBG(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-rose-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-rose-300 font-bold text-center">{formOfficialCountBG}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="bg-seasonal-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-amber-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS THỜI VỤ BG
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formSeasonalWorkersBG[slot] !== undefined ? formSeasonalWorkersBG[slot] : ""}
                                      onChange={(e) => handleUpdateSeasonalWorkerBG(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-amber-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-amber-300 font-bold text-center">{formSeasonalCountBG}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="bg-total-workers" className="bg-sky-950/30">
                                <td colSpan={3} className="py-1 px-2 text-right text-sky-400 font-bold border-r border-slate-800 sticky left-0 bg-sky-950/90 z-10 pl-4 whitespace-nowrap">
                                  ↳ Tổng nhân sự DCBG
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="py-1 px-1 border-r border-slate-800 text-sky-400 font-bold min-w-[80px] w-[80px] text-center">
                                    {(formOfficialWorkersBG[slot] || 0) + (formSeasonalWorkersBG[slot] || 0)}
                                  </td>
                                ))}
                                <td className="py-1 px-1 border-r border-slate-800 text-sky-400 font-bold text-center">
                                  {formWorkersCountBG}
                                </td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              {/* Spacer */}
                              <tr key="bg-spacer" className="h-2 bg-slate-950">
                                <td colSpan={formSlots.length + 7}></td>
                              </tr>
                            </React.Fragment>
                          )}

                          {/* Combined Grand Total Workers */}
                          {filterDivision === "ALL" && (
                            <tr key="grand-total-workers" className="bg-slate-900 border-t border-slate-700">
                              <td colSpan={3} className="py-1 px-1 text-right text-white font-bold border-r border-slate-800 sticky left-0 bg-slate-900 z-10 whitespace-nowrap">
                                Tổng nhân sự Phân Xưởng LR (RO + RMA + BG)
                              </td>
                              {formSlots.map(slot => {
                                const totalH = (formOfficialWorkersRO[slot] || 0) + (formSeasonalWorkersRO[slot] || 0) + (formOfficialWorkersRMA[slot] || 0) + (formSeasonalWorkersRMA[slot] || 0) + (formOfficialWorkersBG[slot] || 0) + (formSeasonalWorkersBG[slot] || 0);
                                return (
                                  <td key={slot} className="py-1 px-1 border-r border-slate-800 text-white font-bold min-w-[80px] w-[80px] text-center">
                                    {totalH}
                                  </td>
                                );
                              })}
                              <td className="py-1 px-1 border-r border-slate-800 text-white font-bold">
                                {formWorkersCount}
                              </td>
                              <td className="border-r border-slate-800"></td>
                              <td className="border-r border-slate-800"></td>
                              <td></td>
                            </tr>
                          )}
                          
                        </tbody>
                      </table>
                    </div>

                    {/* Hourly Productivity Chart */}
                    {formSlots.length > 0 && (
                      <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30">
                        <h4 className="text-[11px] font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-rose-500" />
                          Biểu đồ NSLĐ từng khung giờ
                        </h4>
                        <div className="h-[360px] w-full mt-2">
                          <ResponsiveContainer width="99%" height="100%">
                            <ComposedChart data={formHourlyChartData} margin={{ top: 40, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis dataKey="slot" stroke="#64748b" fontSize={10} tickMargin={5} />
                              <YAxis domain={YAXIS_DOMAIN} tickFormatter={(val) => `${val}%`} stroke="#64748b" fontSize={10} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px" }}
                                itemStyle={{ fontSize: "11px" }}
                                labelStyle={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}
                                formatter={(value: any, name: any) => [`${value}%`, name]}
                                cursor={{ fill: '#1e293b', opacity: 0.4 }}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                              <ReferenceLine y={kpis.monthTarget} stroke="#10b981" strokeDasharray="3 3" />
                              <Bar isAnimationActive={false} dataKey="DCRO" name="NSLĐ DCRO" fill="#10b981" radius={[2, 2, 0, 0]}>
                                <LabelList dataKey="DCRO" position="top" offset={5} fill="#10b981" fontSize={10} fontWeight="semibold" formatter={(v: number) => v > 0 ? `${v}%` : ''} />
                              </Bar>
                              <Bar isAnimationActive={false} dataKey="DCRMA" name="NSLĐ DCRMA" fill="#f59e0b" radius={[2, 2, 0, 0]}>
                                <LabelList dataKey="DCRMA" position="top" offset={5} fill="#f59e0b" fontSize={10} fontWeight="semibold" formatter={(v: number) => v > 0 ? `${v}%` : ''} />
                              </Bar>
                              <Bar isAnimationActive={false} dataKey="DCBG" name="NSLĐ DCBG" fill="#0ea5e9" radius={[2, 2, 0, 0]}>
                                <LabelList dataKey="DCBG" position="top" offset={5} fill="#0ea5e9" fontSize={10} fontWeight="semibold" formatter={(v: number) => v > 0 ? `${v}%` : ''} />
                              </Bar>
                              <Line isAnimationActive={false} type="monotone" dataKey="DCLR" name="NSLĐ Phân Xưởng LR" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: "#f43f5e" }} activeDot={{ r: 6 }}>
                                <LabelList dataKey="DCLR" position="top" fill="#f43f5e" fontSize={10} fontWeight="semibold" formatter={(v: number) => v > 0 ? `${v}%` : ''} offset={12} />
                              </Line>
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer text-[12px] uppercase tracking-wider shadow-lg shadow-rose-900/30"
                      >
                        <PlusCircle className="w-4 h-4" /> Lưu Nhật Ký Ca
                      </button>
                    </div>

                  </div>
                </form>
              </div>


              {/* LIVE DATABASE TABLE LOG DISPLAY LIST */}
              <div className="w-full bg-slate-900/30 p-5 rounded-xl border border-slate-800/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Database className="text-rose-500 w-5 h-5" />
                      Lăng kính Dữ liệu MES & Báo cáo Ca
                    </h3>
                    <p className="text-xs text-slate-400">Xem vết dữ liệu, truy xuất báo cáo theo giờ hoặc tổng hợp gọn theo ngày</p>
                  </div>

                  <span className="text-[11px] font-mono text-cyan-400 border border-slate-800 px-2 py-1 rounded bg-slate-900">
                    Quy mô: <span className="font-bold">{productionLogs.length} bản ghi</span> | <span className="font-bold text-rose-455">{dailySummaries.length} ngày</span>
                  </span>
                </div>

                {/* SUB-TABS SELECTOR & LOCAL DIVISION FILTER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/30 p-2 rounded-lg border border-slate-850/60">
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setLoggingSubTab("records")}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                        loggingSubTab === "records"
                          ? "bg-rose-600 font-bold text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      📝 Chi tiết Nhật ký Ca
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoggingSubTab("hourly")}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                        loggingSubTab === "hourly"
                          ? "bg-rose-600 font-bold text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      ⏰ Báo cáo Khung giờ (1h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoggingSubTab("daily")}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                        loggingSubTab === "daily"
                          ? "bg-rose-600 font-bold text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      📅 Tổng hợp theo Ngày
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Local Date Selector for Logs */}
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1 px-2">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Lọc ngày:</span>
                      <select
                        value={recordsFilterDate}
                        onChange={(e) => setRecordsFilterDate(e.target.value)}
                        className="bg-transparent border-none text-[11px] font-semibold text-slate-300 focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL" className="bg-slate-950">🗓️ Tất cả ngày</option>
                        {logsDates.map((d) => (
                          <option key={d} value={d} className="bg-slate-950 text-white">
                            📅 {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Local Division Selector for Logs */}
                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                      <span className="text-[10px] text-slate-500 font-mono uppercase pl-2 pr-1 hidden sm:inline">Lọc tổ:</span>
                      {(["ALL", "MLN", "RMA", "BG"] as const).map(div => (
                          <button
                            key={div}
                            type="button"
                            onClick={() => setFilterDivision(div)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                              filterDivision === div ? "bg-rose-600 text-white font-bold" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {div === "ALL" ? "Tất cả" : div === "MLN" ? "DCRO" : div === "RMA" ? "DCRMA (RMA)" : "DCBG"}
                          </button>
                      ))}
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {loggingSubTab === "records" && (
                    <motion.div
                      key="records-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-mono text-[10px]">
                              <th className="py-2.5 px-3">Ngày/Ca</th>
                              <th className="py-2.5 px-3">Dây chuyền</th>
                              <th className="py-2.5 px-3">Chi tiết Sản phẩm</th>
                              <th className="py-2.5 px-3 text-right">Lắp thực đạt</th>
                              <th className="py-2.5 px-3 text-right">Hệ số</th>
                              <th className="py-2.5 px-3 text-right">Quy đổi (SP)</th>
                              <th className="py-2.5 px-3 text-right">Công</th>
                              <th className="py-2.5 px-3 text-center">Năng suất hiếu quả</th>
                              <th className="py-2.5 px-3 text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {productionLogs.length === 0 ? (
                              <tr key="empty-logs">
                                <td colSpan={9} className="py-8 text-center text-slate-500 font-sans italic">
                                  Không có dữ liệu nhật ký ca nào. Hãy điền form bên trái để ghi nhận mới!
                                </td>
                              </tr>
                            ) : displayProductionLogs.length === 0 ? (
                              <tr key="filtered-empty-logs">
                                <td colSpan={9} className="py-8 text-center text-slate-500 font-sans italic">
                                  Không tìm thấy dữ liệu nhật ký ca khớp với bộ lọc ngày hoặc tổ sản xuất.
                                </td>
                              </tr>
                            ) : (
                              displayProductionLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-900 transition text-slate-300">
                                  <td className="py-3 px-3">
                                    <div className="font-medium text-white">{log.date}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{log.shift}</div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="font-semibold text-slate-200 block">{log.lineName}</span>
                                    <span className="text-[10px] text-slate-500 block">SUNHOUSE Binh Duong</span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="font-medium text-slate-400 block text-[11px]">{log.productName}</span>
                                    {log.hourlyActuals && (
                                      <div className="flex flex-wrap gap-1 mt-1 max-w-[280px]">
                                        {Object.keys(log.hourlyActuals).map((slot) => {
                                          const val = log.hourlyActuals?.[slot];
                                          const startHr = slot.split(" ")[0] || slot;
                                          return (
                                            <span key={slot} className="text-[9px] bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 text-slate-450 font-mono" title={slot}>
                                              {startHr}: <span className="text-cyan-400 font-extrabold">{val}</span>
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono font-medium text-white">{log.actualUnits}</td>
                                  <td className="py-3 px-3 text-right font-mono text-cyan-500 font-bold">x{log.equivalentFactor}</td>
                                  <td className="py-3 px-3 text-right font-mono font-bold text-white">{log.equivalentProducts}</td>
                                  <td className="py-3 px-3 text-right font-mono">{log.workersCount}</td>
                                  <td className="py-3 px-3 text-center">
                                    <span className={`inline-block font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                      log.laborProductivityPercent >= kpis.monthTarget
                                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                        : "bg-amber-950 text-amber-400 border border-amber-800"
                                    }`}>
                                      {log.laborProductivityPercent.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleEditLog(log.date)}
                                        className="p-1 text-slate-400 hover:text-cyan-500 rounded hover:bg-cyan-950 bg-transparent border border-transparent transition cursor-pointer"
                                        title="Chỉnh sửa nhật ký này"
                                      >
                                        <Edit className="w-4 h-4 inline-block" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-955 bg-transparent border border-transparent transition cursor-pointer"
                                        title="Xóa dòng nhật ký"
                                      >
                                        <Trash2 className="w-4 h-4 inline-block" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {loggingSubTab === "hourly" && (
                    <motion.div
                      key="hourly-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-5"
                    >
                      {/* FILTER DATE & MINI INSIGHT */}
                      <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="space-y-1.5 self-start sm:self-auto w-full sm:w-auto">
                          <label className="text-[10px] text-slate-400 font-semibold font-mono uppercase block">Chọn Ngày Báo Cáo Khung Giờ:</label>
                          <select
                            value={recordsFilterDate}
                            onChange={(e) => setRecordsFilterDate(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500 w-full sm:w-auto min-w-[200px]"
                          >
                            <option value="ALL">🗓️ Tất cả các ngày (Lũy kế)</option>
                            {logsDates.map((d) => (
                              <option key={d} value={d}>
                                📅 Ngày {d}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-4 text-xs font-mono self-end sm:self-auto">
                          <div className="text-center">
                            <span className="text-slate-500 text-[10px] block font-sans">Tổng SL (Cái)</span>
                            <span className="text-sm font-bold text-white">
                              {hourlyChartData.reduce((acc, curr) => acc + curr["Sản lượng (Cái)"], 0)} Cái
                            </span>
                          </div>
                          <div className="border-l border-slate-800 h-8 self-center"></div>
                          <div className="text-center">
                            <span className="text-slate-500 text-[10px] block font-sans">Tổng Quy Đổi</span>
                            <span className="text-sm font-bold text-cyan-400">
                              {hourlyChartData.reduce((acc, curr) => acc + curr["Quy đổi (SP)"], 0)} SP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* HOURLY DISTRIBUTION VISUAL GRAPH */}
                      <div className="h-[380px] bg-slate-1000 p-3.5 rounded-lg border border-slate-850 flex flex-col">
                        <h4 className="text-slate-300 text-[11px] font-semibold font-mono uppercase mb-3 text-center flex items-center justify-center gap-1.5 shrink-0">
                          <Clock className="w-4 h-4 text-rose-500" />
                          Phân bổ sản lượng lắp ráp theo khung giờ 1h / ca làm việc {recordsFilterDate !== "ALL" ? `- Ngày ${recordsFilterDate}` : "(Sát thực các ngày)"}
                        </h4>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="99%" height="100%">
                            <ComposedChart data={hourlyChartData} margin={{ top: 40, right: 30, left: -25, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              dataKey="slotName"
                              tick={{ fill: "#94a3b8", fontSize: 9 }}
                              axisLine={{ stroke: "#334155" }}
                            />
                            <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={{ stroke: "#334155" }} domain={YAXIS_DOMAIN} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#34d399", fontSize: 9 }} axisLine={{ stroke: "#334155" }} domain={YAXIS_DOMAIN} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "6px", fontSize: "11px" }}
                              itemStyle={{ color: "#f8fafc" }}
                            />
                            <Legend wrapperStyle={{ fontSize: "10px" }} />
                            <Bar isAnimationActive={false} yAxisId="left" dataKey="Sản lượng (Cái)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20}>
                              <LabelList dataKey="Sản lượng (Cái)" position="top" offset={5} fill="#f43f5e" fontSize={9} fontWeight="semibold" />
                            </Bar>
                            <Bar isAnimationActive={false} yAxisId="left" dataKey="Quy đổi (SP)" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={20}>
                              <LabelList dataKey="Quy đổi (SP)" position="top" offset={5} fill="#22d3ee" fontSize={9} fontWeight="semibold" />
                            </Bar>
                            <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="NSLĐ Đạt (%)" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }}>
                              <LabelList dataKey="NSLĐ Đạt (%)" position="top" offset={12} fill="#34d399" fontSize={10} fontWeight="semibold" formatter={(v: any) => `${v}%`} />
                            </Line>
                          </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* MATRIX HOURLY TABLE */}
                      <div className="overflow-x-auto max-h-[350px] overflow-y-auto border border-slate-850/60 rounded-lg">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono text-[9px] uppercase sticky top-0 backdrop-blur">
                              <th className="py-2.5 px-3 min-w-[120px]">SP/Chuyền</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">08-09h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">09-10h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">10-11h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">11-12h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">13-14h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">14-15h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">15-16h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">16-17h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">17-18h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">18-19h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40">19-20h</th>
                              <th className="py-2.5 px-2 text-right text-rose-400">Tổng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                            {(() => {
                              const filteredLogs = productionLogs.filter((log) => {
                                const matchDate = recordsFilterDate === "ALL" || log.date === recordsFilterDate;
                                const matchDivision = filterDivision === "ALL" || log.productGroup === filterDivision;
                                return matchDate && matchDivision;
                              });

                              if (filteredLogs.length === 0) {
                                return (
                                  <tr key="empty-hourly">
                                    <td colSpan={13} className="py-8 text-center text-slate-500 italic font-sans">
                                      Không có dữ liệu khớp với bộ lọc ngày hoặc tổ sản xuất.
                                    </td>
                                  </tr>
                                );
                              }

                              return filteredLogs.map((log) => {
                                const h08_09 = log.hourlyActuals?.["8H - 9H"] !== undefined ? log.hourlyActuals["8H - 9H"] : null;
                                const h09_10 = log.hourlyActuals?.["9H - 10H"] !== undefined ? log.hourlyActuals["9H - 10H"] : null;
                                const h10_11 = log.hourlyActuals?.["10H - 11H"] !== undefined ? log.hourlyActuals["10H - 11H"] : null;
                                const h11_12 = log.hourlyActuals?.["11H - 12H"] !== undefined ? log.hourlyActuals["11H - 12H"] : null;
                                const h13_14 = log.hourlyActuals?.["13H - 14H"] !== undefined ? log.hourlyActuals["13H - 14H"] : null;
                                const h14_15 = log.hourlyActuals?.["14H - 15H"] !== undefined ? log.hourlyActuals["14H - 15H"] : null;
                                const h15_16 = log.hourlyActuals?.["15H - 16H"] !== undefined ? log.hourlyActuals["15H - 16H"] : null;
                                const h16_17 = log.hourlyActuals?.["16H - 17H"] !== undefined ? log.hourlyActuals["16H - 17H"] : null;
                                const h17_18 = log.hourlyActuals?.["17H - 18H"] !== undefined ? log.hourlyActuals["17H - 18H"] : null;
                                const h18_19 = log.hourlyActuals?.["18H - 19H"] !== undefined ? log.hourlyActuals["18H - 19H"] : null;
                                const h19_20 = log.hourlyActuals?.["19H - 20H"] !== undefined ? log.hourlyActuals["19H - 20H"] : null;

                                return (
                                  <tr key={log.id} className="hover:bg-slate-900 transition text-slate-300">
                                    <td className="py-2.5 px-3">
                                      <div className="text-white font-medium font-sans text-[11.5px] whitespace-normal break-words max-w-[250px]" title={log.productName}>
                                        {log.productName}
                                      </div>
                                      <div className="text-[9px] text-slate-500 font-mono">
                                        {log.date} | {log.lineName} | {log.shift.split(" ")[0]}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-cyan-400 font-bold border-r border-slate-900">
                                      {h08_09 !== null ? h08_09 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-cyan-400 font-bold border-r border-slate-900">
                                      {h09_10 !== null ? h09_10 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-cyan-400 font-bold border-r border-slate-900">
                                      {h10_11 !== null ? h10_11 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-cyan-400 font-bold border-r border-slate-900">
                                      {h11_12 !== null ? h11_12 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-cyan-400 font-bold border-r border-slate-900">
                                      {h13_14 !== null ? h13_14 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-cyan-400 font-bold border-r border-slate-900">
                                      {h14_15 !== null ? h14_15 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-cyan-400 font-bold border-r border-slate-900">
                                      {h15_16 !== null ? h15_16 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-cyan-400 font-bold border-r border-slate-900">
                                      {h16_17 !== null ? h16_17 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-cyan-400 font-bold border-r border-slate-900">
                                      {h17_18 !== null ? h17_18 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-cyan-400 font-bold border-r border-slate-900">
                                      {h18_19 !== null ? h18_19 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-cyan-400 font-bold border-r border-slate-900">
                                      {h19_20 !== null ? h19_20 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-2 text-right font-bold text-white text-[11px]">
                                      {log.actualUnits}
                                    </td>
                                    <td className="py-2.5 px-2.5 text-center">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                        log.laborProductivityPercent >= kpis.monthTarget
                                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-900/50"
                                          : "bg-amber-950/60 text-amber-400 border-amber-900/50"
                                      }`}>
                                        {log.laborProductivityPercent.toFixed(0)}%
                                      </span>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {loggingSubTab === "daily" && (
                    <motion.div
                      key="daily-summary-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-slate-850 rounded-lg">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono text-[10px] sticky top-0 backdrop-blur">
                              <th className="py-3 px-3">Ngày sản xuất</th>
                              <th className="py-3 px-3">Phạm vi ca / Số model</th>
                              <th className="py-3 px-3">Dây chuyền hoạt động</th>
                              <th className="py-3 px-3">Sản phẩm chế tạo chính</th>
                              <th className="py-3 px-3 text-right">Tổng thực tế (Cái)</th>
                              <th className="py-3 px-3 text-right">MES quy đổi (SP)</th>
                              <th className="py-3 px-3 text-right">Tổng nhân lực gán</th>
                              <th className="py-3 px-3 text-center">Năng suất b.quân ngày</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {dailySummaries.length === 0 ? (
                              <tr key="empty-daily">
                                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans italic">
                                  Chưa ghi nhận dữ liệu để tổng hợp theo ngày.
                                </td>
                              </tr>
                            ) : displayDailySummaries.length === 0 ? (
                              <tr key="filtered-empty-daily">
                                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans italic">
                                  Không tìm thấy tổng hợp ngày khớp với bộ lọc ngày được chọn.
                                </td>
                              </tr>
                            ) : (
                              displayDailySummaries.map((summary) => (
                                <tr key={summary.date} className="hover:bg-slate-900 transition text-slate-300">
                                  <td className="py-3.5 px-3">
                                    <span className="font-bold text-white block text-[12px]">{summary.date}</span>
                                    <span className="text-[10px] text-rose-400 font-mono font-bold block mt-0.5">
                                      {summary.recordsCount} bản ghi n.ký
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3 font-mono text-[11px]">
                                    <div className="text-slate-200">{summary.shiftCount} ca sản xuất</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{summary.recordsCount} models</div>
                                  </td>
                                  <td className="py-3.5 px-3 text-[11px] font-sans text-slate-300">
                                    <div className="flex flex-col gap-0.5">
                                      {summary.uniqueLines.map((l) => (
                                        <span key={l} className="text-slate-300 font-semibold">• {l}</span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <div className="flex flex-wrap gap-1 max-w-[190px]">
                                      {summary.uniqueProducts.map((p) => (
                                        <span key={p} className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.2 rounded whitespace-normal break-words max-w-[250px]" title={p}>
                                          {p}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-3 text-right font-mono text-white text-[11.5px] font-bold">
                                    {summary.totalActual} <span className="text-[10px] text-slate-500 font-normal">Cái</span>
                                  </td>
                                  <td className="py-3.5 px-3 text-right font-mono text-cyan-400 font-extrabold text-[12px]">
                                    {summary.totalEquivalent} <span className="font-normal text-[9px] text-slate-500">SP</span>
                                  </td>
                                  <td className="py-3.5 px-3 text-right font-mono text-indigo-400 text-[11.5px] font-bold">
                                    {summary.totalWorkers} <span className="text-[10px] text-slate-500 font-normal font-sans">công</span>
                                  </td>
                                  <td className="py-3.5 px-3 text-center">
                                    <span className={`inline-block font-mono font-extrabold px-2.5 py-0.5 rounded text-[11px] border ${
                                      summary.avgProductivity >= kpis.monthTarget
                                        ? "bg-emerald-950/80 text-emerald-400 border-emerald-900/50"
                                        : "bg-amber-950/80 text-amber-400 border-amber-900/50"
                                    }`}>
                                      {summary.avgProductivity.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-850 text-slate-450 text-xs flex justify-between items-center">
                  <span className="leading-snug">💡 Mẹo: Dữ liệu Nhật ký Ca tự động được lưu trữ và tổng hợp thời gian thực vào các bộ chỉ số năng suất KPI Tháng {parseInt(formDate.split("-")[1])}/{formDate.split("-")[0]} trên Dashboard!</span>
                  <button
                    onClick={() => {
                      const d = new Date();
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setFormDate(`${year}-${month}-${day}`);
                      const slots = formSlots;
                      const testHrs: { [key: string]: number } = {};
                      slots.forEach((s) => {
                        testHrs[s] = 55;
                      });
                      setFormModelItems([
                        {
                          id: "item-example",
                          productId: "mln-01",
                          hourlyActuals: testHrs,
                        }
                      ]);
                      setFormMessage(`💡 Đã tự cấu hình thử dữ liệu bám sát Tháng ${parseInt(formDate.split("-")[1])}/${formDate.split("-")[0]} vào Form!`);
                    }}
                    className="text-xs text-rose-450 hover:text-white font-semibold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ml-4 border-0 bg-transparent font-sans"
                  >
                    Xem ví dụ <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </motion.div>
          )}


          {/* ACTIVE TAB: MONTHLY PLAN */}
          {activeTab === "monthly-plan" && (
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
                      onClick={handleDownloadMonthlyPlanTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white font-bold rounded transition text-xs border border-slate-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Tải File Mẫu
                    </button>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 hover:text-emerald-300 font-bold rounded cursor-pointer transition text-xs border border-emerald-900/50">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Import Excel
                      <input type="file" accept=".xlsx, .xls" onChange={handleMonthlyPlanUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-[600px] overflow-y-auto relative">
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
                            {totalPlan.toLocaleString()} <span className="text-xs text-slate-400 font-normal font-sans">SP</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Quy đổi: {Math.round(totalPlanEq).toLocaleString()} SP</div>
                        </div>

                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                          <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">{actualLabel}</div>
                          <div className="text-lg font-black text-emerald-400 mt-1 font-mono">
                            {totalActual.toLocaleString()} <span className="text-xs text-emerald-500 font-normal font-sans">SP</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Quy đổi: {Math.round(totalActualEq).toLocaleString()} SP</div>
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
                            {diffSum >= 0 ? `+${diffSum.toLocaleString()}` : diffSum.toLocaleString()} <span className="text-xs font-normal font-sans text-slate-400">SP</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-sans">So với chỉ tiêu ban đầu</div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Grid Table */}
                <div className="overflow-x-auto border border-slate-850 rounded-lg max-h-[500px] overflow-y-auto">
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
                                {item.planQty.toLocaleString()}
                                <div className="text-[10px] text-slate-500 font-normal font-sans">
                                  QĐ: {Math.round(item.planEqQty).toLocaleString()}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                                {item.actualQty.toLocaleString()}
                                <div className="text-[10px] text-slate-500 font-normal font-sans">
                                  QĐ: {Math.round(item.actualEqQty).toLocaleString()}
                                </div>
                              </td>
                              <td className={`py-3 px-4 text-right font-mono font-bold ${
                                item.diffQty >= 0 ? "text-emerald-500" : "text-rose-400"
                              }`}>
                                {item.diffQty >= 0 ? `+${item.diffQty.toLocaleString()}` : item.diffQty.toLocaleString()}
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
          )}

          {/* ACTIVE TAB: PRODUCT CONFIGURATION */}
          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-rose-600" />
                      Cấu Hình Danh Mục Sản Phẩm & Hệ Số Quy Đổi
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Cập nhật Model, Mã code, Hệ số quy đổi tính công suất IE và Giá bán sản phẩm được đồng bộ trong toàn hệ thống.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProductId(null);
                      setProdFormName("");
                      setProdFormCode("");
                      setProdFormGroup("MLN");
                      setProdFormFactor(1.0);
                      setProdFormPrice(2000000);
                      setProdFormDescription("");
                      setProdFormMessage("");
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>➕ Thêm Sản Phẩm Mới</span>
                  </button>
                </div>

                {/* EXCEL IMPORT AREA */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        Nhập sản phẩm hàng loạt từ File Excel
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tải file mẫu Excel về máy, điền thông tin và tải lên để đồng bộ nhanh chóng danh mục sản phẩm vào hệ thống.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDownloadTemplate}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Tải file mẫu Excel"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        Tải file Excel mẫu
                      </button>
                      
                      <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        Chọn file Excel...
                        <input
                          id="excel-product-upload"
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleExcelUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Excel Error & Success Logs */}
                  {excelImportError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2 animate-pulse">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>{excelImportError}</div>
                    </div>
                  )}

                  {excelImportSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>{excelImportSuccess}</div>
                    </div>
                  )}

                  {/* Excel Parsed Products Preview Table */}
                  {parsedExcelProducts.length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mt-4 shadow-sm">
                      <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          📋 Xem trước danh sách chuẩn bị nhập ({parsedExcelProducts.length} dòng)
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelExcelImport}
                            className="px-2.5 py-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded cursor-pointer transition"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            onClick={handleConfirmExcelImport}
                            className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1 cursor-pointer transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Xác nhận nhập
                          </button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                              <th className="py-2 px-3">Phân nhóm</th>
                              <th className="py-2 px-3">Mã Model</th>
                              <th className="py-2 px-3">Tên sản phẩm đầy đủ</th>
                              <th className="py-2 px-3 text-center">Hệ số quy đổi</th>
                              <th className="py-2 px-3 text-right">Giá bán dự kiến</th>
                              <th className="py-2 px-3">Mô tả / Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {parsedExcelProducts.map((p, index) => (
                              <tr key={index} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-semibold text-slate-700">{p.group === "MLN" ? "DCRO" : p.group === "RMA" ? "DCRMA" : "DCBG"}</td>
                                <td className="py-2 px-3 font-mono font-bold text-slate-950">{p.code}</td>
                                <td className="py-2 px-3 truncate max-w-[180px]" title={p.name}>{p.name}</td>
                                <td className="py-2 px-3 text-center font-bold text-rose-600 font-mono">{p.factor.toFixed(2)}</td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                                  {p.price ? p.price.toLocaleString("vi-VN") + " ₫" : "-"}
                                </td>
                                <td className="py-2 px-3 truncate max-w-[150px] text-slate-400" title={p.description}>{p.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* LEFT COLUMN: PRODUCT LIST */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <th className="py-3 px-4">Nhóm</th>
                            <th className="py-3 px-4">Mã Model</th>
                            <th className="py-3 px-4">Tên Sản Phẩm đầy đủ</th>
                            <th className="py-3 px-4 text-center">Hệ số quy đổi</th>
                            <th className="py-3 px-4 text-right">Giá bán (VND)</th>
                            <th className="py-3 px-4 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                          {products.map((prod) => (
                            <tr
                              key={prod.id}
                              className={`hover:bg-slate-50/50 transition ${
                                editingProductId === prod.id ? "bg-rose-50/50 font-medium" : ""
                              }`}
                            >
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    prod.group === "MLN"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-sky-50 text-sky-700 border border-sky-200"
                                  }`}
                                >
                                  {prod.group === "MLN" ? "DCRO" : prod.group === "RMA" ? "DCRMA" : "DCBG"}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-950">
                                {prod.code || getProductModelCode(prod.name)}
                              </td>
                              <td className="py-3 px-4 text-slate-800 max-w-xs truncate" title={prod.name}>
                                {prod.name}
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                                {prod.factor.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                                {prod.price ? prod.price.toLocaleString("vi-VN") + " ₫" : "-"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEditProductClick(prod)}
                                    className="p-1 text-slate-500 hover:text-slate-950 hover:bg-slate-100 rounded transition cursor-pointer"
                                    title="Sửa sản phẩm"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title="Xóa sản phẩm"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: EDITOR FORM */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 h-fit space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {editingProductId ? "📝 Cập Nhật Thông Tin" : "➕ Thêm Sản Phẩm Mới"}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {editingProductId ? `Đang chỉnh sửa sản phẩm` : "Điền thông tin để tạo dòng sản phẩm mới"}
                      </p>
                    </div>

                    {prodFormMessage && (
                      <div
                        className={`p-3 rounded-lg text-xs font-medium border ${
                          prodFormMessage.startsWith("✅")
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {prodFormMessage}
                      </div>
                    )}

                    <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                          Phân nhóm sản phẩm
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setProdFormGroup("MLN")}
                            className={`py-2 rounded-lg font-bold border transition text-[11px] ${
                              prodFormGroup === "MLN"
                                ? "bg-white border-rose-600 text-rose-600 shadow-sm"
                                : "bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            🌊 DCRO (MLN)
                          </button>
                          <button
                            type="button"
                            onClick={() => setProdFormGroup("RMA")}
                            className={`py-2 rounded-lg font-bold border transition text-[11px] ${
                              prodFormGroup === "RMA"
                                ? "bg-white border-rose-600 text-rose-600 shadow-sm"
                                : "bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            ♻️ DCRMA (RMA/RW)
                          </button>
                          <button
                            type="button"
                            onClick={() => setProdFormGroup("BG")}
                            className={`py-2 rounded-lg font-bold border transition text-[11px] ${
                              prodFormGroup === "BG"
                                ? "bg-white border-rose-600 text-rose-600 shadow-sm"
                                : "bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            🔥 Bếp Gas (BG)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                          Mã Model (Code)
                        </label>
                        <input
                          type="text"
                          value={prodFormCode}
                          onChange={(e) => setProdFormCode(e.target.value)}
                          placeholder="Ví dụ: RMVSHA76222KL, BBDMMB3569MT..."
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-mono text-sm uppercase"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                          Tên đầy đủ sản phẩm
                        </label>
                        <textarea
                          rows={2}
                          value={prodFormName}
                          onChange={(e) => setProdFormName(e.target.value)}
                          placeholder="Ví dụ: Máy lọc nước RO UltraPURE Sunhouse 11 lõi SHA76222KL..."
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                            Hệ số quy đổi (Factor)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="10.00"
                            value={prodFormFactor}
                            onChange={(e) => setProdFormFactor(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-mono text-sm font-bold text-rose-600"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                            Giá bán (VND)
                          </label>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={prodFormPrice}
                            onChange={(e) => setProdFormPrice(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-mono text-sm font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                          Mô tả / Ghi chú khác
                        </label>
                        <textarea
                          rows={2}
                          value={prodFormDescription}
                          onChange={(e) => setProdFormDescription(e.target.value)}
                          placeholder="Nhập mô tả chi tiết..."
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {editingProductId && (
                          <button
                            type="button"
                            onClick={handleCancelProductEdit}
                            className="py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition cursor-pointer"
                          >
                            Hủy
                          </button>
                        )}
                        <button
                          type="submit"
                          className={`py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition shadow-md cursor-pointer ${
                            !editingProductId ? "col-span-2" : ""
                          }`}
                        >
                          💾 {editingProductId ? "Cập Nhật" : "Lưu Sản Phẩm"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          )}


          {/* ACTIVE TAB: HISTORY DATA */}
          {activeTab === "history-data" && (
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
                          const isLocked = isPast || isCurrent;
                          
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
                                  value={m.laborProductivityPercent === null ? "" : m.laborProductivityPercent} 
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
                                      value={m.actualProducts === null ? "" : m.actualProducts.toLocaleString()} 
                                      className="w-full bg-slate-950/20 border border-slate-800/40 text-emerald-400/80 rounded p-1.5 pr-14 text-sm cursor-not-allowed font-medium font-mono"
                                      placeholder="Tự động..."
                                    />
                                    <span className="absolute right-2 text-[9px] font-bold text-slate-500 tracking-wider bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800 pointer-events-none select-none">Báo cáo</span>
                                  </>
                                ) : (
                                  <>
                                    <input 
                                      type="number" 
                                      value={m.actualProducts === null ? "" : m.actualProducts} 
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
                                      value={m.equivalentProducts === null ? "" : m.equivalentProducts.toLocaleString()} 
                                      className="w-full bg-slate-950/20 border border-slate-800/40 text-blue-400/80 rounded p-1.5 pr-14 text-sm cursor-not-allowed font-medium font-mono"
                                      placeholder="Tự động..."
                                    />
                                    <span className="absolute right-2 text-[9px] font-bold text-slate-500 tracking-wider bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800 pointer-events-none select-none">Báo cáo</span>
                                  </>
                                ) : (
                                  <>
                                    <input 
                                      type="number" 
                                      value={m.equivalentProducts === null ? "" : m.equivalentProducts} 
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
                                      value={m.productionMandays === null ? "" : m.productionMandays.toLocaleString()} 
                                      className="w-full bg-slate-950/20 border border-slate-800/40 text-purple-400/80 rounded p-1.5 pr-14 text-sm cursor-not-allowed font-medium font-mono"
                                      placeholder="Tự động..."
                                    />
                                    <span className="absolute right-2 text-[9px] font-bold text-slate-500 tracking-wider bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800 pointer-events-none select-none">Báo cáo</span>
                                  </>
                                ) : (
                                  <>
                                    <input 
                                      type="number" 
                                      value={m.productionMandays === null ? "" : m.productionMandays} 
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
                          <XAxis dataKey="month" fontSize={11} stroke="#64748b" />
                          <YAxis tickFormatter={(v) => `${v}%`} domain={YAXIS_DOMAIN} fontSize={11} stroke="#64748b" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg shadow-xl text-xs space-y-1.5 font-sans">
                                    <p className="font-semibold text-white border-b border-slate-800 pb-1">{data.monthFullName} ({historyYear})</p>
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
                              value={monthlyTargets[`${historyYear}-${selectedTargetMonth}`] || 110}
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
                          value={monthlyTargets[`${historyYear}-${selectedTargetMonth}`] || 110} 
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
          )}

          {/* ACTIVE TAB: AI ADVISOR */}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* TOP CHAT INSTRUCTION */}
              <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-rose-500 animate-pulse w-5 h-5" />
                    Báo Cáo Nghiên Cứu & Trợ Lý Kỹ Thuật Sản Xuất Sunhouse AI
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sử dụng mô hình ngôn ngữ lớn <strong>Google Gemini 3.5</strong> thông qua cổng bảo mật của ứng dụng để tự động phân tích sâu, phát hiện nút thắt cổ chai và đề xuất tối ưu hóa nhân sự.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleTriggerAiAnalysis}
                    disabled={isAiLoading}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg text-xs tracking-wider transition cursor-pointer flex items-center gap-2"
                    id="btn-reanalyze-ai"
                  >
                    {isAiLoading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                        Đang phân tích số liệu...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        PHÂN TÍCH LẠI VỚI GEMINI
                      </>
                    )}
                  </button>
                </div>
              </div>


              {/* MAIN REPORT VIEW CONTAINER */}
              <div className="bg-slate-900/30 rounded-xl border border-rose-900/30 overflow-hidden shadow-2xl relative">
                
                {/* Visual Accent bar */}
                <div className="h-1 bg-gradient-to-r from-rose-600 via-amber-500 to-cyan-500"></div>

                <div className="p-6">
                  
                  {isAiLoading && (
                    <div className="py-16 flex flex-col items-center justify-center space-y-4">
                      {/* Beautiful simulated manufacturing loading visual */}
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                      <div className="text-center space-y-1.5">
                        <span className="text-xs text-rose-400 font-mono block">INITIALIZING SUNHOUSE DECISION BRAIN</span>
                        <p className="text-sm font-medium text-slate-300">Đang đồng bộ số liệu excel & nhật ký sản xuất ca thực tế...</p>
                        <span className="text-[10px] text-slate-500 font-mono block">Connecting to secure Google GenAI Cloud via Applet Proxy...</span>
                      </div>
                    </div>
                  )}

                  {aiError && !isAiLoading && (
                    <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-400 rounded-lg text-xs space-y-2">
                      <div className="font-bold flex items-center gap-2">
                        <Info className="w-4 h-4" /> Không thể khởi chạy Trợ lý AI
                      </div>
                      <p>{aiError}</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-350">
                        <li>Hãy chắc chắn bạn đã cấu hình khóa <strong>GEMINI_API_KEY</strong> trong phần cài đặt <strong>Secrets</strong> của AI Studio.</li>
                        <li>Đội ngũ kỹ thuật SUNHOUSE có thể truy cập mã nguồn để gán biến môi trường thủ công.</li>
                      </ul>
                    </div>
                  )}

                  {!isAiLoading && aiAnalysis && (
                    <div className="space-y-6 text-slate-200 leading-relaxed text-sm">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm font-bold text-white uppercase tracking-wider">BÁO CÁO NHÀ MÁY THỰC THI</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Bản phân tích tự động (Dữ liệu thời gian thực)</span>
                      </div>

                      {/* Render markdown analysis styled cleanly */}
                      <div className="prose prose-invert prose-rose max-w-none text-slate-300 font-sans space-y-4">
                        {aiAnalysis.split("\n").map((line, idx) => {
                          // Very basic markdown formatting parser for pristine UI
                          if (line.startsWith("###")) {
                            return (
                              <h4 key={idx} className="text-sm font-bold text-white border-l-4 border-rose-500 pl-2 mt-4 mb-2">
                                {line.replace("###", "").trim()}
                              </h4>
                            );
                          }
                          if (line.startsWith("##")) {
                            return (
                              <h3 key={idx} className="text-base font-bold text-rose-400 border-b border-slate-800 pb-1 mt-6 mb-3">
                                {line.replace("##", "").trim()}
                              </h3>
                            );
                          }
                          if (line.startsWith("#")) {
                            return (
                              <h2 key={idx} className="text-lg font-bold text-white mt-8 mb-4">
                                {line.replace("#", "").trim()}
                              </h2>
                            );
                          }
                          if (line.startsWith("-") || line.startsWith("*")) {
                            return (
                              <li key={idx} className="ml-4 list-disc text-slate-300 py-0.5">
                                {line.replace(/^[-*]\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                              </li>
                            );
                          }
                          return (
                            <p key={idx} className="text-xs md:text-sm text-slate-300 leading-relaxed text-justify">
                              {/* Bold conversion */}
                              {line.split("**").map((part, i) => (i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part))}
                            </p>
                          );
                        })}
                      </div>

                      {/* Closing Sign-off */}
                      <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div>
                          <span>Phê duyệt bởi:</span>
                          <strong className="text-slate-300 font-semibold block uppercase">Cơ sở sản xuất NM Bình Dương</strong>
                        </div>
                        <div>
                          <span>Bộ phận IE:</span>
                          <span className="text-rose-400 font-mono font-bold block">SUNHOUSE VIETNAM GROUP</span>
                        </div>
                      </div>

                    </div>
                  )}

                  {!isAiLoading && !aiAnalysis && !aiError && (
                    <div className="py-20 text-center space-y-4">
                      <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-sm text-slate-400 max-w-md mx-auto">
                        Số liệu đã sẵn sàng để chuyển giao sang hệ AI Phân Tích. Nhấp vào nút bên dưới để khởi tạo cuộc gọi dữ liệu và nhận chiến lược cân bằng chuyền.
                      </p>
                      <button
                        onClick={handleTriggerAiAnalysis}
                        className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs uppercase"
                        id="btn-trigger-analytics"
                      >
                        BẮT ĐẦU PHÂN TÍCH AI
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </motion.div>
          )}

          {activeTab === "system-data" && (
            <motion.div
              key="system-data"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <RefreshCw className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">Quản Lý Dữ Liệu Hệ Thống</h2>
                      <p className="text-slate-400 text-sm mt-1">
                        Sao lưu và khôi phục toàn bộ cơ sở dữ liệu báo cáo qua file Excel.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Export Section */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group">
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Download className="w-5 h-5 text-sky-400" />
                          Xuất Toàn Bộ Dữ Liệu (Backup)
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                          Hệ thống sẽ tổng hợp tất cả Nhật ký sản xuất, Danh mục sản phẩm, Kế hoạch tháng, 
                          và các Chỉ số KPI vào một file Excel duy nhất có nhiều sheet. 
                          Dùng để lưu trữ offline hoặc di chuyển dữ liệu.
                        </p>
                      </div>
                      <button
                        onClick={handleExportFullBackup}
                        className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-900/20 flex items-center gap-2 shrink-0 group-hover:scale-105 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-5 h-5" />
                        Xuất Excel
                      </button>
                    </div>
                  </div>

                  {/* Import Section */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group">
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Upload className="w-5 h-5 text-emerald-400" />
                          Khôi Phục Dữ Liệu (Restore)
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                          Tải lên file Excel backup đã xuất trước đó để khôi phục toàn bộ trạng thái hệ thống. 
                          <span className="text-amber-400 font-semibold block mt-1">⚠️ Cảnh báo: Dữ liệu hiện tại trên trình duyệt sẽ bị ghi đè hoàn toàn.</span>
                        </p>
                      </div>
                      <label className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 shrink-0 cursor-pointer group-hover:scale-105">
                        <RefreshCw className="w-5 h-5" />
                        Chọn File Backup
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          className="hidden"
                          onChange={handleImportFullBackup}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-200/70 leading-relaxed">
                        <span className="font-bold text-amber-400 block mb-1 uppercase tracking-wider text-[10px]">Hướng dẫn quan trọng:</span>
                        - File Excel backup chứa nhiều Sheet (Production_Logs, Products, Monthly_Plan, ...). Không nên thay đổi tên Sheet nếu muốn khôi phục chính xác.<br/>
                        - Bạn có thể chỉnh sửa dữ liệu trực tiếp trong file Excel rồi khôi phục lại, nhưng hãy đảm bảo định dạng cột không thay đổi.<br/>
                        - Dữ liệu được lưu trữ cục bộ trong trình duyệt (LocalStorage). Việc "Dọn dẹp trình duyệt" có thể làm mất dữ liệu, vì vậy hãy sao lưu thường xuyên.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
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
