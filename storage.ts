import { isValidHourlySlot } from './appUtils';
import {
  Worker,
  WorkerDivision,
  WorkerType,
  AttendanceRecord,
  ProductDefinition,
  ProductionLog,
  MonthlyMetric,
  DailyReportRowGas,
  DailyReportRowAssembly,
  MonthlyScrapReport,
  WeeklyScrapReport,
  WeeklyDclreErrorRate,
  MonthlyDclreErrorRate,
} from './types';
import {
  INITIAL_WORKERS,
  INITIAL_ATTENDANCE,
  SUNHOUSE_PRODUCTS,
  INITIAL_PRODUCTION_LOGS,
  HISTORICAL_2025,
  HISTORICAL_2026,
  INITIAL_GAS_DAILY_REPORTS,
  INITIAL_ASSEMBLY_DAILY_REPORTS,
  MONTHLY_SCRAP_REPORT,
  WEEKLY_SCRAP_REPORT,
  WEEKLY_DCLR_ERROR_RATE,
  MONTHLY_DCLR_ERROR_RATE,
} from './data';

// ==========================================
// LOCAL STORAGE KEYS
// ==========================================
export const STORAGE_KEYS = {
  WORKERS: 'sunhouse_workers',
  ATTENDANCE: 'sunhouse_attendance_logs',
  PRODUCTS: 'sunhouse_products_v2',
  PRODUCTION_LOGS: 'sunhouse_production_logs_v2',
  MONTHLY_PLAN: 'sunhouse_monthly_plan_v2',
  MONTHLY_TARGETS: 'sunhouse_monthly_targets_v2',
  METRICS_2025: 'sunhouse_metrics_2025_v2',
  METRICS_2026: 'sunhouse_metrics_2026_v2',
  GAS_DAILY: 'sunhouse_gas_daily_reports_v2',
  ASSEMBLY_DAILY: 'sunhouse_assembly_daily_reports_v2',
  DECLARED_IMEIS: 'sunhouse_declared_imeis',
  SCANNED_IMEIS: 'sunhouse_scanned_imeis',
  MONTHLY_SCRAP: 'sunhouse_monthly_scrap_v2',
  WEEKLY_SCRAP: 'sunhouse_weekly_scrap_v2',
  WEEKLY_DCLR_ERROR: 'sunhouse_weekly_dclr_error_v2',
  MONTHLY_DCLR_ERROR: 'sunhouse_monthly_dclr_error_v2',
};

// Helper đọc localStorage an toàn và hiệu năng cao
export function getLocal<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch (err) {
    console.warn(`[storage] Lỗi đọc localStorage key "${key}":`, err);
    return fallback;
  }
}

// Helper ghi localStorage an toàn
export function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[storage] Lỗi ghi localStorage key "${key}":`, err);
  }
}

// Định danh duy nhất cho phiên trình duyệt/tab hiện tại để lọc bỏ phản hồi ngược (self-echo)
export const CLIENT_SESSION_ID = typeof window !== 'undefined'
  ? ((window as any).__SUNHOUSE_CLIENT_ID ||= 'cli_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now())
  : 'cli_srv';

// Live broadcast channel dùng chung toàn ứng dụng (Hỗ trợ BroadcastChannel trình duyệt)
let sharedBroadcastChannel: BroadcastChannel | null = null;
export function getSharedBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    if (!sharedBroadcastChannel) {
      try {
        sharedBroadcastChannel = new BroadcastChannel('sunhouse_local_tab_sync');
      } catch (e) {
        sharedBroadcastChannel = null;
      }
    }
    return sharedBroadcastChannel;
  }
  return null;
}

// Helper phát broadcast đồng bộ tức thì cho tất cả các tab đang mở trên cùng trình duyệt
export function broadcastTableUpdate(tableName: string, extraData?: any): void {
  try {
    const ch = getSharedBroadcastChannel();
    if (!ch) return;
    ch.postMessage({
      type: 'table_sync_event',
      table: tableName,
      data: extraData,
      senderId: CLIENT_SESSION_ID,
      timestamp: Date.now(),
    });
  } catch (err) {
    // Silent
  }
}

// ==========================================
// 1. QUẢN LÝ NHÂN SỰ (WORKERS)
// ==========================================
export async function getWorkers(): Promise<Worker[]> {
  return getLocal<Worker[]>(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
}

export const fetchWorkers = getWorkers;

export async function insertWorker(worker: Worker): Promise<void> {
  const localList = getLocal<Worker[]>(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  const updated = [worker, ...localList.filter((w) => w.id !== worker.id)];
  setLocal(STORAGE_KEYS.WORKERS, updated);
  broadcastTableUpdate('workers');
}

export async function updateWorker(id: string, updatedData: Partial<Worker>): Promise<void> {
  const localList = getLocal<Worker[]>(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  const updated = localList.map((w) => (w.id === id ? { ...w, ...updatedData } : w));
  setLocal(STORAGE_KEYS.WORKERS, updated);
  broadcastTableUpdate('workers');
}

export async function deleteWorker(id: string): Promise<void> {
  const localList = getLocal<Worker[]>(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  setLocal(STORAGE_KEYS.WORKERS, localList.filter((w) => w.id !== id));
  broadcastTableUpdate('workers');
}

export async function saveWorker(worker: Worker): Promise<void> {
  const localList = getLocal<Worker[]>(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  const exists = localList.some((w) => w.id === worker.id);
  const updated = exists
    ? localList.map((w) => (w.id === worker.id ? worker : w))
    : [...localList, worker];
  setLocal(STORAGE_KEYS.WORKERS, updated);
  broadcastTableUpdate('workers');
}

export async function saveAllWorkers(workers: Worker[]): Promise<void> {
  setLocal(STORAGE_KEYS.WORKERS, workers);
  broadcastTableUpdate('workers');
}

// ==========================================
// 2. NHẬT KÝ ĐIỂM DANH (ATTENDANCE LOGS)
// ==========================================
export async function getAttendanceLogs(limitCount?: number): Promise<AttendanceRecord[]> {
  const logs = getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  return limitCount ? logs.slice(0, limitCount) : logs;
}

export async function saveAttendanceLog(record: AttendanceRecord): Promise<void> {
  const localList = getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  const updated = localList.some((r) => r.id === record.id)
    ? localList.map((r) => (r.id === record.id ? record : r))
    : [...localList, record];
  setLocal(STORAGE_KEYS.ATTENDANCE, updated);
  broadcastTableUpdate('attendance_records');
}

export async function deleteAttendanceLog(id: string): Promise<void> {
  const localList = getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  setLocal(STORAGE_KEYS.ATTENDANCE, localList.filter((r) => r.id !== id));
  broadcastTableUpdate('attendance_records');
}

export async function saveAllAttendanceLogs(logs: AttendanceRecord[]): Promise<void> {
  setLocal(STORAGE_KEYS.ATTENDANCE, logs);
  broadcastTableUpdate('attendance_records');
}

// ==========================================
// 3. DANH MỤC SẢN PHẨM (PRODUCTS)
// ==========================================
export async function getProducts(): Promise<ProductDefinition[]> {
  const defaultProducts = SUNHOUSE_PRODUCTS.map((p) => ({
    ...p,
    price: p.price === null || Number.isNaN(Number(p.price)) ? (p.group === 'MLN' ? 4500000 : 1800000) : Number(p.price),
    factor: p.factor === null || Number.isNaN(Number(p.factor)) ? 1 : Number(p.factor),
  }));
  return getLocal<ProductDefinition[]>(STORAGE_KEYS.PRODUCTS, defaultProducts);
}

export async function saveProduct(product: ProductDefinition): Promise<void> {
  const localList = await getProducts();
  const updated = localList.some((p) => p.id === product.id)
    ? localList.map((p) => (p.id === product.id ? product : p))
    : [...localList, product];
  setLocal(STORAGE_KEYS.PRODUCTS, updated);
  broadcastTableUpdate('products');
}

export async function deleteProduct(id: string): Promise<void> {
  const localList = await getProducts();
  setLocal(STORAGE_KEYS.PRODUCTS, localList.filter((p) => p.id !== id));
  broadcastTableUpdate('products');
}

export async function saveAllProducts(products: ProductDefinition[]): Promise<void> {
  setLocal(STORAGE_KEYS.PRODUCTS, products);
  broadcastTableUpdate('products');
}

export const upsertProducts = saveAllProducts;

// ==========================================
// 4. NHẬT KÝ SẢN XUẤT (PRODUCTION LOGS)
// ==========================================
export async function getProductionLogs(limitCount?: number): Promise<ProductionLog[]> {
  const logs = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
  return limitCount ? logs.slice(0, limitCount) : logs;
}

export async function saveProductionLog(log: ProductionLog): Promise<void> {
  const localList = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
  const updated = localList.some((l) => l.id === log.id)
    ? localList.map((l) => (l.id === log.id ? log : l))
    : [log, ...localList];
  setLocal(STORAGE_KEYS.PRODUCTION_LOGS, updated);
  broadcastTableUpdate('production_logs');
}

export async function deleteProductionLog(id: string): Promise<void> {
  const localList = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
  setLocal(STORAGE_KEYS.PRODUCTION_LOGS, localList.filter((l) => l.id !== id));
  broadcastTableUpdate('production_logs');
}

export async function saveAllProductionLogs(logs: ProductionLog[]): Promise<void> {
  setLocal(STORAGE_KEYS.PRODUCTION_LOGS, logs);
  broadcastTableUpdate('production_logs');
}

export const upsertProductionLogs = saveAllProductionLogs;

// API nạp nhật ký sản xuất theo ca/ngày
export async function fetchShiftProductionLogs(
  selectedDate: string,
  selectedDept?: string
): Promise<{ data: any[] | null; error: any }> {
  const localLogs = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
  let rows = localLogs.filter((l) => l.date === selectedDate);
  if (selectedDept && selectedDept !== 'ALL') {
    rows = rows.filter((r: any) => {
      const d = r.department || r.productGroup;
      return !d || d === selectedDept;
    });
  }
  return { data: rows, error: null };
}

export interface HourlyLogPayload {
  work_date: string;
  department: string;
  product_code: string;
  shift: string;
  quantity: number;
  productId?: string;
  productName?: string;
  status?: string;
  technician_name?: string;
  allHourlyActuals?: Record<string, number>;
}

export async function upsertHourlyProductionLog(
  payload: HourlyLogPayload
): Promise<{ data: any; error: any }> {
  const cleanSlot = payload.shift.replace(/\s+/g, '');
  const qty = Number(payload.quantity || 0);

  try {
    const localProducts = await getProducts();
    const prod = localProducts.find(
      (p) =>
        (payload.productId && p.id === payload.productId) ||
        (payload.product_code && (p.code === payload.product_code || p.id === payload.product_code))
    ) || {
      id: payload.productId || payload.product_code,
      name: payload.product_code || 'Sản phẩm',
      group: payload.department || 'MLN',
      factor: 1,
      code: payload.product_code,
    };

    const localLogs = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
    const existingIndex = localLogs.findIndex(
      (l) => l.date === payload.work_date && (l.productId === prod.id || l.productName === prod.name)
    );

    let updatedLog: ProductionLog;

    if (existingIndex >= 0) {
      const old = localLogs[existingIndex];
      const newHourlyActuals = { ...(old.hourlyActuals || {}) };
      newHourlyActuals[cleanSlot] = qty;

      const sumActuals = Object.values(newHourlyActuals).reduce((a, b) => a + Number(b || 0), 0);
      const factor = Number(prod.factor ?? old.equivalentFactor ?? 1);
      const eqUnits = Math.round(sumActuals * factor);

      updatedLog = {
        ...old,
        actualUnits: sumActuals,
        equivalentProducts: eqUnits,
        hourlyActuals: newHourlyActuals,
        technicianName: payload.technician_name || old.technicianName || 'Nguyễn Văn A',
      };
      localLogs[existingIndex] = updatedLog;
    } else {
      const initialHourlyActuals: Record<string, number> = { [cleanSlot]: qty };
      const factor = Number(prod.factor ?? 1);
      const eqUnits = Math.round(qty * factor);

      updatedLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: payload.work_date,
        lineId: 'line-01',
        lineName: 'Chuyền 1',
        productId: prod.id,
        productName: prod.name,
        productGroup: (prod.group as any) || (payload.department as any) || 'MLN',
        actualUnits: qty,
        workersCount: 0,
        officialWorkers: 0,
        seasonalWorkers: 0,
        equivalentFactor: factor,
        equivalentProducts: eqUnits,
        laborProductivityPercent: 0,
        shift: 'Ca HC (08:00 - 17:00)',
        technicianName: payload.technician_name || 'Nguyễn Văn A',
        hourlyActuals: initialHourlyActuals,
      };
      localLogs.unshift(updatedLog);
    }

    setLocal(STORAGE_KEYS.PRODUCTION_LOGS, localLogs);
    broadcastTableUpdate('production_logs', { action: 'hourly_upsert', id: updatedLog.id });

    return { data: updatedLog, error: null };
  } catch (err: any) {
    console.error('[storage] Lỗi lưu production_logs cục bộ:', err);
    return { data: null, error: err };
  }
}

// ==========================================
// 5. KẾ HOẠCH THÁNG (MONTHLY PLAN)
// ==========================================
export async function getMonthlyPlan(): Promise<Record<string, Record<string, Record<number, number>>>> {
  return getLocal<Record<string, Record<string, Record<number, number>>>>(STORAGE_KEYS.MONTHLY_PLAN, {});
}

export async function saveMonthlyPlan(plan: Record<string, Record<string, Record<number, number>>>): Promise<void> {
  setLocal(STORAGE_KEYS.MONTHLY_PLAN, plan);
  broadcastTableUpdate('monthly_plan');
}

// ==========================================
// 6. MỤC TIÊU THÁNG (MONTHLY TARGETS)
// ==========================================
export async function getMonthlyTargets(): Promise<Record<string, number>> {
  const defaults: Record<string, number> = {};
  for (const y of [2025, 2026]) {
    for (let m = 1; m <= 12; m++) {
      defaults[`${y}-${m}`] = 110;
    }
  }
  return getLocal<Record<string, number>>(STORAGE_KEYS.MONTHLY_TARGETS, defaults);
}

export async function saveMonthlyTargets(targets: Record<string, number>): Promise<void> {
  setLocal(STORAGE_KEYS.MONTHLY_TARGETS, targets);
  broadcastTableUpdate('monthly_targets');
}

// ==========================================
// 7. SỐ LIỆU THÁNG (MONTHLY METRICS)
// ==========================================
export async function getMonthlyMetrics(year: 2025 | 2026): Promise<MonthlyMetric[]> {
  const key = year === 2025 ? STORAGE_KEYS.METRICS_2025 : STORAGE_KEYS.METRICS_2026;
  const fallback = year === 2025 ? HISTORICAL_2025 : HISTORICAL_2026;
  return getLocal<MonthlyMetric[]>(key, fallback);
}

export async function saveMonthlyMetrics(year: 2025 | 2026, metrics: MonthlyMetric[]): Promise<void> {
  const key = year === 2025 ? STORAGE_KEYS.METRICS_2025 : STORAGE_KEYS.METRICS_2026;
  setLocal(key, metrics);
  broadcastTableUpdate('monthly_metrics', { year });
}

// ==========================================
// 8. BÁO CÁO HÀNG NGÀY (DAILY REPORTS)
// ==========================================
export async function getGasDailyReports(): Promise<DailyReportRowGas[]> {
  return getLocal<DailyReportRowGas[]>(STORAGE_KEYS.GAS_DAILY, INITIAL_GAS_DAILY_REPORTS);
}

export async function saveGasDailyReports(reports: DailyReportRowGas[]): Promise<void> {
  setLocal(STORAGE_KEYS.GAS_DAILY, reports);
  broadcastTableUpdate('daily_reports', { type: 'gas' });
}

export async function getAssemblyDailyReports(): Promise<DailyReportRowAssembly[]> {
  return getLocal<DailyReportRowAssembly[]>(STORAGE_KEYS.ASSEMBLY_DAILY, INITIAL_ASSEMBLY_DAILY_REPORTS);
}

export async function saveAssemblyDailyReports(reports: DailyReportRowAssembly[]): Promise<void> {
  setLocal(STORAGE_KEYS.ASSEMBLY_DAILY, reports);
  broadcastTableUpdate('daily_reports', { type: 'assembly' });
}

export async function getAllDailyReports(): Promise<{
  gas: DailyReportRowGas[];
  assembly: DailyReportRowAssembly[];
  declaredImeis: any[];
  scannedImeis: any[];
  monthlyScrap: MonthlyScrapReport[];
  weeklyScrap: WeeklyScrapReport[];
  weeklyDclr: WeeklyDclreErrorRate[];
  monthlyDclr: MonthlyDclreErrorRate[];
}> {
  const [gas, assembly, declaredImeis, scannedImeis, monthlyScrap, weeklyScrap, weeklyDclr, monthlyDclr] =
    await Promise.all([
      getGasDailyReports(),
      getAssemblyDailyReports(),
      getDeclaredImeis(),
      getScannedImeis(),
      getMonthlyScrap(),
      getWeeklyScrap(),
      getWeeklyDclrError(),
      getMonthlyDclrError(),
    ]);
  return { gas, assembly, declaredImeis, scannedImeis, monthlyScrap, weeklyScrap, weeklyDclr, monthlyDclr };
}

// ==========================================
// 9. PHẾ PHẨM & TỶ LỆ LỖI (SCRAP & QUALITY)
// ==========================================
export async function getMonthlyScrap(): Promise<MonthlyScrapReport[]> {
  return getLocal<MonthlyScrapReport[]>(STORAGE_KEYS.MONTHLY_SCRAP, MONTHLY_SCRAP_REPORT);
}

export async function saveMonthlyScrap(reports: MonthlyScrapReport[]): Promise<void> {
  setLocal(STORAGE_KEYS.MONTHLY_SCRAP, reports);
  broadcastTableUpdate('daily_reports', { type: 'monthly_scrap' });
}

export async function getWeeklyScrap(): Promise<WeeklyScrapReport[]> {
  return getLocal<WeeklyScrapReport[]>(STORAGE_KEYS.WEEKLY_SCRAP, WEEKLY_SCRAP_REPORT);
}

export async function saveWeeklyScrap(reports: WeeklyScrapReport[]): Promise<void> {
  setLocal(STORAGE_KEYS.WEEKLY_SCRAP, reports);
  broadcastTableUpdate('daily_reports', { type: 'weekly_scrap' });
}

export const getWeeklyScrapReport = getWeeklyScrap;
export const saveWeeklyScrapReport = saveWeeklyScrap;

export async function getWeeklyDclrError(): Promise<WeeklyDclreErrorRate[]> {
  return getLocal<WeeklyDclreErrorRate[]>(STORAGE_KEYS.WEEKLY_DCLR_ERROR, WEEKLY_DCLR_ERROR_RATE);
}

export async function saveWeeklyDclrError(reports: WeeklyDclreErrorRate[]): Promise<void> {
  setLocal(STORAGE_KEYS.WEEKLY_DCLR_ERROR, reports);
  broadcastTableUpdate('daily_reports', { type: 'weekly_dclr_error' });
}

export const getWeeklyDclrErrorRate = getWeeklyDclrError;
export const saveWeeklyDclrErrorRate = saveWeeklyDclrError;

export async function getMonthlyDclrError(): Promise<MonthlyDclreErrorRate[]> {
  return getLocal<MonthlyDclreErrorRate[]>(STORAGE_KEYS.MONTHLY_DCLR_ERROR, MONTHLY_DCLR_ERROR_RATE);
}

export async function saveMonthlyDclrError(reports: MonthlyDclreErrorRate[]): Promise<void> {
  setLocal(STORAGE_KEYS.MONTHLY_DCLR_ERROR, reports);
  broadcastTableUpdate('daily_reports', { type: 'monthly_dclr_error' });
}

export const getMonthlyDclrErrorRate = getMonthlyDclrError;
export const saveMonthlyDclrErrorRate = saveMonthlyDclrError;

// ==========================================
// 10. QUẢN LÝ IMEI (DECLARED & SCANNED)
// ==========================================
export async function getDeclaredImeis(): Promise<any[]> {
  return getLocal<any[]>(STORAGE_KEYS.DECLARED_IMEIS, []);
}

export async function saveDeclaredImeis(records: any[]): Promise<void> {
  setLocal(STORAGE_KEYS.DECLARED_IMEIS, records);
  broadcastTableUpdate('daily_reports', { type: 'declared_imeis' });
}

export async function getScannedImeis(): Promise<any[]> {
  return getLocal<any[]>(STORAGE_KEYS.SCANNED_IMEIS, []);
}

export async function saveScannedImeis(records: any[]): Promise<void> {
  setLocal(STORAGE_KEYS.SCANNED_IMEIS, records);
  broadcastTableUpdate('daily_reports', { type: 'scanned_imeis' });
}

export async function getTransactions(limit: number = 100): Promise<any[]> {
  return [];
}

export async function getLabels(limit: number = 100): Promise<any[]> {
  return [];
}

export async function getInventory(): Promise<any[]> {
  return [];
}

export async function getProductionOrders(limit: number = 100): Promise<any[]> {
  return [];
}

// ==========================================
// 11. BẢN NHÁP FORM NHẬT KÝ CA (FORM DRAFTS)
// ==========================================
export interface FormDraftData {
  date: string;
  shift: string;
  slots: string[];
  items: any[];
  officialRO: Record<string, number>;
  seasonalRO: Record<string, number>;
  officialBG: Record<string, number>;
  seasonalBG: Record<string, number>;
  officialRMA: Record<string, number>;
  seasonalRMA: Record<string, number>;
  technician: string;
  updatedAt: string;
}

export async function getFormDraft(date: string, shift: string): Promise<FormDraftData | null> {
  const localKey = `sunhouse_draft_${date}_${shift}`;
  return getLocal<FormDraftData | null>(localKey, null);
}

export async function saveFormDraft(draft: FormDraftData): Promise<void> {
  const localKey = `sunhouse_draft_${draft.date}_${draft.shift}`;
  setLocal(localKey, draft);
  setLocal('sunhouse_last_active_form_draft', draft);
}

export async function clearFormDraft(date: string, shift: string): Promise<void> {
  const localKey = `sunhouse_draft_${date}_${shift}`;
  try {
    localStorage.removeItem(localKey);
    localStorage.removeItem('sunhouse_last_active_form_draft');
  } catch (e) {}
}

export function sendLiveFormBroadcast(draft: Partial<FormDraftData>): void {
  try {
    const ch = getSharedBroadcastChannel();
    if (!ch) return;
    ch.postMessage({
      type: 'form_cell_change',
      payload: { ...draft, senderId: CLIENT_SESSION_ID, timestamp: Date.now() },
    });
  } catch (err) {
    // Silent
  }
}

// ==========================================
// 12. REALTIME SUBSCRIPTION
// ==========================================
export interface RealtimeCallbacks {
  onProductionLogsChange?: (payload: any) => void;
  onAttendanceChange?: (payload: any) => void;
  onTransactionsChange?: (payload: any) => void;
  onInventoryChange?: (payload: any) => void;
  onProductionOrdersChange?: (payload: any) => void;
  onWorkersChange?: (payload: any) => void;
  onProductsChange?: (payload: any) => void;
  onMonthlyPlanChange?: (payload: any) => void;
  onMonthlyTargetsChange?: (payload: any) => void;
  onMonthlyMetricsChange?: (payload: any) => void;
  onDailyReportsChange?: (payload: any) => void;
  onLiveFormChange?: (payload: any) => void;
  onTableSyncChange?: (table: string, payload: any) => void;
}

export function subscribeToRealtime(callbacks: RealtimeCallbacks): () => void {
  const ch = getSharedBroadcastChannel();
  if (!ch) return () => {};

  const handleMessage = (event: MessageEvent) => {
    const msg = event.data;
    if (!msg || msg.senderId === CLIENT_SESSION_ID) return;

    if (msg.type === 'form_cell_change') {
      callbacks.onLiveFormChange?.(msg);
    } else if (msg.type === 'table_sync_event' && msg.table) {
      callbacks.onTableSyncChange?.(msg.table, msg.data);
      switch (msg.table) {
        case 'workers':
          callbacks.onWorkersChange?.({ eventType: 'UPDATE', new: msg.data });
          break;
        case 'attendance_records':
          callbacks.onAttendanceChange?.({ eventType: 'UPDATE', new: msg.data });
          break;
        case 'products':
          callbacks.onProductsChange?.({ eventType: 'UPDATE', new: msg.data });
          break;
        case 'production_logs':
          callbacks.onProductionLogsChange?.({ eventType: 'UPDATE', new: msg.data });
          break;
        case 'monthly_plan':
          callbacks.onMonthlyPlanChange?.({ new: { plan_data: msg.data } });
          break;
        case 'monthly_targets':
          callbacks.onMonthlyTargetsChange?.({ new: { targets_data: msg.data } });
          break;
        case 'monthly_metrics':
          callbacks.onMonthlyMetricsChange?.({ new: { year: msg.data?.year, metrics_data: msg.data } });
          break;
        case 'daily_reports':
          callbacks.onDailyReportsChange?.({ new: { report_type: msg.data?.type, report_data: msg.data } });
          break;
      }
    }
  };

  ch.addEventListener('message', handleMessage);
  return () => {
    ch.removeEventListener('message', handleMessage);
  };
}

// ==========================================
// 13. TẢI TẤT CẢ DỮ LIỆU ĐẦU TIÊN (ALL INITIAL DATA)
// ==========================================
export async function getAllInitialData(): Promise<{
  workers: Worker[];
  attendanceLogs: AttendanceRecord[];
  products: ProductDefinition[];
  productionLogs: ProductionLog[];
  monthlyPlan: Record<string, Record<string, Record<number, number>>>;
  monthlyTargets: Record<string, number>;
  metrics2025: MonthlyMetric[];
  metrics2026: MonthlyMetric[];
  gasDailyReports: DailyReportRowGas[];
  assemblyDailyReports: DailyReportRowAssembly[];
  declaredImeis: any[];
  scannedImeis: any[];
  monthlyScrap: MonthlyScrapReport[];
  weeklyScrap: WeeklyScrapReport[];
  weeklyDclr: WeeklyDclreErrorRate[];
  monthlyDclr: MonthlyDclreErrorRate[];
}> {
  const [
    workers,
    attendanceLogs,
    products,
    productionLogs,
    monthlyPlan,
    monthlyTargets,
    metrics2025,
    metrics2026,
    gasDailyReports,
    assemblyDailyReports,
    declaredImeis,
    scannedImeis,
    monthlyScrap,
    weeklyScrap,
    weeklyDclr,
    monthlyDclr,
  ] = await Promise.all([
    getWorkers(),
    getAttendanceLogs(),
    getProducts(),
    getProductionLogs(),
    getMonthlyPlan(),
    getMonthlyTargets(),
    getMonthlyMetrics(2025),
    getMonthlyMetrics(2026),
    getGasDailyReports(),
    getAssemblyDailyReports(),
    getDeclaredImeis(),
    getScannedImeis(),
    getMonthlyScrap(),
    getWeeklyScrap(),
    getWeeklyDclrError(),
    getMonthlyDclrError(),
  ]);

  return {
    workers,
    attendanceLogs,
    products,
    productionLogs,
    monthlyPlan,
    monthlyTargets,
    metrics2025,
    metrics2026,
    gasDailyReports,
    assemblyDailyReports,
    declaredImeis,
    scannedImeis,
    monthlyScrap,
    weeklyScrap,
    weeklyDclr,
    monthlyDclr,
  };
}
