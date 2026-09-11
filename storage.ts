import { supabase, isSupabaseConfigured } from './supabaseClient';
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
// LOCAL STORAGE KEYS (Fallback an toàn)
// ==========================================
const STORAGE_KEYS = {
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

// Helper đọc localStorage an toàn
function getLocal<T>(key: string, fallback: T): T {
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
function setLocal<T>(key: string, data: T): void {
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

// Live broadcast channel dùng chung toàn ứng dụng
let sharedBroadcastChannel: any = null;
export function getSharedBroadcastChannel(): any {
  if (!supabase || !isSupabaseConfigured) return null;
  if (!sharedBroadcastChannel) {
    sharedBroadcastChannel = supabase.channel('sunhouse_live_form_room', {
      config: { broadcast: { self: false } },
    });
    sharedBroadcastChannel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Kênh Broadcast liên tab đã sẵn sàng');
      }
    });
  }
  return sharedBroadcastChannel;
}

// Helper phát broadcast đồng bộ tức thì cho tất cả các máy/tab đang mở
export function broadcastTableUpdate(tableName: string, extraData?: any): void {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    const ch = getSharedBroadcastChannel();
    if (!ch) return;
    ch.send({
      type: 'broadcast',
      event: 'table_sync_event',
      payload: { table: tableName, data: extraData, senderId: CLIENT_SESSION_ID, timestamp: Date.now() },
    });
  } catch (err) {
    console.warn('[storage] Gửi broadcast đồng bộ bảng thất bại:', err);
  }
}

// ==========================================
// 1. QUẢN LÝ NHÂN SỰ (WORKERS)
// ==========================================
export async function getWorkers(): Promise<Worker[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      // Tối ưu Egress: Chỉ select đúng các cột cần hiển thị trên bảng, tuyệt đối KHÔNG dùng '*'
      let res: any = await supabase
        .from('workers')
        .select('id, name, division, type, qr_code, image_url')
        .order('id', { ascending: true })
        .limit(5000);

      // Hỗ trợ trường hợp bảng dùng tên cột biến thể (worker_code, full_name, department, status)
      if (res.error && res.error.message?.includes('does not exist')) {
        res = await supabase
          .from('workers')
          .select('id, worker_code, full_name, department, status')
          .order('id', { ascending: true })
          .limit(5000);
      }

      if (res.error) throw res.error;

      if (res.data) {
        const mapped: Worker[] = res.data.map((row: any) => ({
          id: String(row.id || row.worker_code || ''),
          name: String(row.name || row.full_name || ''),
          division: (row.division || row.department || 'RO') as WorkerDivision,
          type: (row.type || row.status || 'OFFICIAL') as WorkerType,
          qrCode: String(row.qr_code || row.worker_code || row.id || ''),
          imageUrl: row.image_url || row.imageUrl || undefined,
        }));
        setLocal(STORAGE_KEYS.WORKERS, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('[storage] Không thể tải workers từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<Worker[]>(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
}

export const fetchWorkers = getWorkers;

export async function insertWorker(worker: Worker): Promise<void> {
  // Gọi trực tiếp lên Supabase trước
  if (supabase && isSupabaseConfigured) {
    const { error } = await supabase.from('workers').insert([
      {
        id: worker.id,
        name: worker.name,
        division: worker.division,
        type: worker.type,
        qr_code: worker.qrCode,
        image_url: worker.imageUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      console.warn('[storage] Lỗi thêm mới worker lên Supabase:', error.message || error);
      throw error;
    }
  }

  // Chỉ cập nhật Local Storage sau khi Supabase trả về kết quả thành công
  const localList = getLocal<Worker[]>(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  const updated = [worker, ...localList.filter((w) => w.id !== worker.id)];
  setLocal(STORAGE_KEYS.WORKERS, updated);
}

export async function updateWorker(id: string, updatedData: Partial<Worker>): Promise<void> {
  // Gọi trực tiếp update lên Supabase trước
  if (supabase && isSupabaseConfigured) {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updatedData.name !== undefined) payload.name = updatedData.name;
    if (updatedData.division !== undefined) payload.division = updatedData.division;
    if (updatedData.type !== undefined) payload.type = updatedData.type;
    if (updatedData.qrCode !== undefined) payload.qr_code = updatedData.qrCode;
    if (updatedData.imageUrl !== undefined) payload.image_url = updatedData.imageUrl || null;
    if (updatedData.id !== undefined && updatedData.id !== id) payload.id = updatedData.id;

    const { error } = await supabase.from('workers').update(payload).eq('id', id);
    if (error) {
      console.warn('[storage] Lỗi cập nhật worker trên Supabase:', error.message || error);
      throw error;
    }
  }

  // Chỉ cập nhật Local Storage sau khi Supabase trả về kết quả thành công
  const localList = getLocal<Worker[]>(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  const updated = localList.map((w) => (w.id === id ? { ...w, ...updatedData } : w));
  setLocal(STORAGE_KEYS.WORKERS, updated);
}

export async function deleteWorker(id: string): Promise<void> {
  // Gọi trực tiếp xóa trên Supabase trước
  if (supabase && isSupabaseConfigured) {
    const { error } = await supabase.from('workers').delete().eq('id', id);
    if (error) {
      console.warn('[storage] Lỗi xóa worker trên Supabase:', error.message || error);
      throw error;
    }
  }

  // Chỉ cập nhật Local Storage sau khi Supabase trả về kết quả thành công
  const localList = getLocal<Worker[]>(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  setLocal(STORAGE_KEYS.WORKERS, localList.filter((w) => w.id !== id));
}

export async function saveWorker(worker: Worker): Promise<void> {
  const localList = getLocal<Worker[]>(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  const exists = localList.some((w) => w.id === worker.id);
  const updated = exists
    ? localList.map((w) => (w.id === worker.id ? worker : w))
    : [...localList, worker];
  setLocal(STORAGE_KEYS.WORKERS, updated);

  if (supabase && isSupabaseConfigured) {
    try {
      if (exists) {
        await updateWorker(worker.id, worker);
      } else {
        await insertWorker(worker);
      }
      broadcastTableUpdate('workers');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu worker:', err?.message || err);
    }
  }
}

export async function saveAllWorkers(workers: Worker[]): Promise<void> {
  setLocal(STORAGE_KEYS.WORKERS, workers);

  if (supabase && isSupabaseConfigured && workers.length > 0) {
    try {
      const rows = workers.map((w) => ({
        id: w.id,
        name: w.name,
        division: w.division,
        type: w.type,
        qr_code: w.qrCode,
        image_url: w.imageUrl || null,
      }));
      const { error } = await supabase.from('workers').upsert(rows);
      if (error) console.warn('[storage] Lưu trữ workers lên Supabase:', error.message || error);
      broadcastTableUpdate('workers');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu workers lên Supabase:', err?.message || err);
    }
  }
}

// ==========================================
// 2. NHẬT KÝ ĐIỂM DANH (ATTENDANCE LOGS)
// ==========================================
export async function getAttendanceLogs(limitCount: number = 1000): Promise<AttendanceRecord[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('id, worker_id, date, slot, check_in_time, check_out_time, scanned_division')
        .order('date', { ascending: false })
        .limit(limitCount);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: AttendanceRecord[] = data.map((row: any) => ({
          id: row.id,
          workerId: row.worker_id || row.workerId,
          date: row.date,
          slot: row.slot || undefined,
          checkInTime: row.check_in_time || row.checkInTime,
          checkOutTime: row.check_out_time || row.checkOutTime || undefined,
          scannedDivision: row.scanned_division || row.scannedDivision || undefined,
        }));
        setLocal(STORAGE_KEYS.ATTENDANCE, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('[storage] Không thể tải attendance_records từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
}

export async function saveAttendanceLog(record: AttendanceRecord): Promise<void> {
  const localList = getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  const updated = localList.some((r) => r.id === record.id)
    ? localList.map((r) => (r.id === record.id ? record : r))
    : [...localList, record];
  setLocal(STORAGE_KEYS.ATTENDANCE, updated);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('attendance_records').upsert({
        id: record.id,
        worker_id: record.workerId,
        date: record.date,
        slot: record.slot || null,
        check_in_time: record.checkInTime,
        check_out_time: record.checkOutTime || null,
        scanned_division: record.scannedDivision || null,
      });
      if (error) console.warn('[storage] Lưu attendance_record lên Supabase:', error.message || error);
      broadcastTableUpdate('attendance_records');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu attendance_record:', err?.message || err);
    }
  }
}

export async function deleteAttendanceLog(id: string): Promise<void> {
  const localList = getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  setLocal(STORAGE_KEYS.ATTENDANCE, localList.filter((r) => r.id !== id));

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('attendance_records').delete().eq('id', id);
      if (error) console.warn('[storage] Xóa attendance_record trên Supabase:', error.message || error);
      broadcastTableUpdate('attendance_records');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi xóa attendance_record:', err?.message || err);
    }
  }
}

export async function saveAllAttendanceLogs(logs: AttendanceRecord[]): Promise<void> {
  setLocal(STORAGE_KEYS.ATTENDANCE, logs);

  if (supabase && isSupabaseConfigured && logs.length > 0) {
    try {
      const rows = logs.map((record) => ({
        id: record.id,
        worker_id: record.workerId,
        date: record.date,
        slot: record.slot || null,
        check_in_time: record.checkInTime,
        check_out_time: record.checkOutTime || null,
        scanned_division: record.scannedDivision || null,
      }));
      const { error } = await supabase.from('attendance_records').upsert(rows);
      if (error) console.warn('[storage] Lưu trữ attendance_records lên Supabase:', error.message || error);
      broadcastTableUpdate('attendance_records');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu attendance lên Supabase:', err?.message || err);
    }
  }
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

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, group, code, factor, description, price')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: ProductDefinition[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          group: row.group,
          code: row.code,
          factor: Number(row.factor ?? 1),
          description: row.description || '',
          price: row.price !== null ? Number(row.price) : undefined,
        }));
        setLocal(STORAGE_KEYS.PRODUCTS, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('[storage] Không thể tải products từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<ProductDefinition[]>(STORAGE_KEYS.PRODUCTS, defaultProducts);
}

export async function saveProduct(product: ProductDefinition): Promise<void> {
  const localList = getLocal<ProductDefinition[]>(STORAGE_KEYS.PRODUCTS, []);
  const updated = localList.some((p) => p.id === product.id)
    ? localList.map((p) => (p.id === product.id ? product : p))
    : [...localList, product];
  setLocal(STORAGE_KEYS.PRODUCTS, updated);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('products').upsert({
        id: product.id,
        name: product.name,
        group: product.group,
        code: product.code,
        factor: product.factor,
        description: product.description || '',
        price: product.price ?? null,
      });
      if (error) console.warn('[storage] Lưu product lên Supabase:', error.message || error);
      broadcastTableUpdate('products');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu product:', err?.message || err);
    }
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const localList = getLocal<ProductDefinition[]>(STORAGE_KEYS.PRODUCTS, []);
  setLocal(STORAGE_KEYS.PRODUCTS, localList.filter((p) => p.id !== id));

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) console.warn('[storage] Xóa product trên Supabase:', error.message || error);
      broadcastTableUpdate('products');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi xóa product:', err?.message || err);
    }
  }
}

export async function upsertProducts(products: ProductDefinition[]): Promise<void> {
  if (!products || products.length === 0) return;
  const localList = getLocal<ProductDefinition[]>(STORAGE_KEYS.PRODUCTS, []);
  const prodMap = new Map<string, ProductDefinition>(localList.map((p) => [p.id, p]));
  products.forEach((p) => prodMap.set(p.id, p));
  setLocal(STORAGE_KEYS.PRODUCTS, Array.from(prodMap.values()));

  if (supabase && isSupabaseConfigured) {
    try {
      const rows = products.map((p) => ({
        id: p.id,
        name: p.name,
        group: p.group,
        code: p.code,
        factor: p.factor,
        description: p.description || '',
        price: p.price ?? null,
      }));
      const { error } = await supabase.from('products').upsert(rows);
      if (error) console.warn('[storage] Upsert products lên Supabase:', error.message || error);
      broadcastTableUpdate('products');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi upsert products:', err?.message || err);
    }
  }
}

export async function saveAllProducts(products: ProductDefinition[]): Promise<void> {
  setLocal(STORAGE_KEYS.PRODUCTS, products);

  if (supabase && isSupabaseConfigured && products.length > 0) {
    try {
      const rows = products.map((p) => ({
        id: p.id,
        name: p.name,
        group: p.group,
        code: p.code,
        factor: p.factor,
        description: p.description || '',
        price: p.price ?? null,
      }));
      const { error } = await supabase.from('products').upsert(rows);
      if (error) console.warn('[storage] Lưu trữ products lên Supabase:', error.message || error);
      broadcastTableUpdate('products');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu products lên Supabase:', err?.message || err);
    }
  }
}

// ==========================================
// 4. NHẬT KÝ SẢN XUẤT (PRODUCTION LOGS)
// ==========================================
export async function getProductionLogs(limitCount: number = 1000): Promise<ProductionLog[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('production_logs')
        .select(
          'id, date, line_id, line_name, product_id, product_name, product_group, ' +
          'actual_units, workers_count, official_workers, seasonal_workers, equivalent_factor, ' +
          'equivalent_products, labor_productivity_percent, shift, technician_name, ' +
          'hourly_actuals, hourly_workers, hourly_official_workers, hourly_seasonal_workers'
        )
        .order('date', { ascending: false })
        .limit(limitCount);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: ProductionLog[] = data.map((row: any) => {
          const hw = row.hourly_workers || row.hourlyWorkers || {};
          let official = row.hourly_official_workers || row.hourlyOfficialWorkers || hw["__official"];
          let seasonal = row.hourly_seasonal_workers || row.hourlySeasonalWorkers || hw["__seasonal"];
          
          const cleanedHw = { ...hw };
          delete cleanedHw["__official"];
          delete cleanedHw["__seasonal"];

          return {
            id: row.id,
            date: row.date,
            lineId: row.line_id || row.lineId,
            lineName: row.line_name || row.lineName,
            productId: row.product_id || row.productId,
            productName: row.product_name || row.productName,
            productGroup: row.product_group || row.productGroup,
            actualUnits: Number(row.actual_units ?? row.actualUnits ?? 0),
            workersCount: Number(row.workers_count ?? row.workersCount ?? 0),
            officialWorkers: row.official_workers !== null ? Number(row.official_workers) : undefined,
            seasonalWorkers: row.seasonal_workers !== null ? Number(row.seasonal_workers) : undefined,
            equivalentFactor: Number(row.equivalent_factor ?? row.equivalentFactor ?? 1),
            equivalentProducts: Number(row.equivalent_products ?? row.equivalentProducts ?? 0),
            laborProductivityPercent: Number(row.labor_productivity_percent ?? row.laborProductivityPercent ?? 0),
            shift: row.shift,
            technicianName: row.technician_name || row.technicianName || '',
            hourlyActuals: row.hourly_actuals || row.hourlyActuals || {},
            hourlyWorkers: cleanedHw,
            hourlyOfficialWorkers: official || {},
            hourlySeasonalWorkers: seasonal || {},
          };
        });
        setLocal(STORAGE_KEYS.PRODUCTION_LOGS, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('[storage] Không thể tải production_logs từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
}

export async function saveProductionLog(log: ProductionLog): Promise<void> {
  const localList = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
  const updated = localList.some((l) => l.id === log.id)
    ? localList.map((l) => (l.id === log.id ? log : l))
    : [log, ...localList];
  setLocal(STORAGE_KEYS.PRODUCTION_LOGS, updated);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('production_logs').upsert({
        id: log.id,
        date: log.date,
        line_id: log.lineId,
        line_name: log.lineName,
        product_id: log.productId,
        product_name: log.productName,
        product_group: log.productGroup,
        actual_units: log.actualUnits,
        workers_count: log.workersCount,
        official_workers: log.officialWorkers ?? null,
        seasonal_workers: log.seasonalWorkers ?? null,
        equivalent_factor: log.equivalentFactor,
        equivalent_products: log.equivalentProducts,
        labor_productivity_percent: log.laborProductivityPercent,
        shift: log.shift,
        technician_name: log.technicianName,
        hourly_actuals: log.hourlyActuals || {},
        hourly_workers: { ...(log.hourlyWorkers || {}), "__official": log.hourlyOfficialWorkers || {}, "__seasonal": log.hourlySeasonalWorkers || {} },
        hourly_official_workers: log.hourlyOfficialWorkers || {},
        hourly_seasonal_workers: log.hourlySeasonalWorkers || {},
      });
      if (error) console.warn('[storage] Lưu production_log lên Supabase:', error.message || error);
      broadcastTableUpdate('production_logs');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu production_log:', err?.message || err);
    }
  }
}

export async function deleteProductionLog(id: string): Promise<void> {
  const localList = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
  setLocal(STORAGE_KEYS.PRODUCTION_LOGS, localList.filter((l) => l.id !== id));

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('production_logs').delete().eq('id', id);
      if (error) console.warn('[storage] Xóa production_log trên Supabase:', error.message || error);
      broadcastTableUpdate('production_logs');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi xóa production_log:', err?.message || err);
    }
  }
}

export async function upsertProductionLogs(logs: ProductionLog[]): Promise<void> {
  if (!logs || logs.length === 0) return;
  const localList = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
  const logMap = new Map<string, ProductionLog>(localList.map((l) => [l.id, l]));
  logs.forEach((l) => logMap.set(l.id, l));
  setLocal(STORAGE_KEYS.PRODUCTION_LOGS, Array.from(logMap.values()));

  if (supabase && isSupabaseConfigured) {
    try {
      const rows = logs.map((log) => ({
        id: log.id,
        date: log.date,
        line_id: log.lineId,
        line_name: log.lineName,
        product_id: log.productId,
        product_name: log.productName,
        product_group: log.productGroup,
        actual_units: log.actualUnits,
        workers_count: log.workersCount,
        official_workers: log.officialWorkers ?? null,
        seasonal_workers: log.seasonalWorkers ?? null,
        equivalent_factor: log.equivalentFactor,
        equivalent_products: log.equivalentProducts,
        labor_productivity_percent: log.laborProductivityPercent,
        shift: log.shift,
        technician_name: log.technicianName,
        hourly_actuals: log.hourlyActuals || {},
        hourly_workers: { ...(log.hourlyWorkers || {}), "__official": log.hourlyOfficialWorkers || {}, "__seasonal": log.hourlySeasonalWorkers || {} },
        hourly_official_workers: log.hourlyOfficialWorkers || {},
        hourly_seasonal_workers: log.hourlySeasonalWorkers || {},
      }));
      const { error } = await supabase.from('production_logs').upsert(rows);
      if (error) console.warn('[storage] Upsert production_logs lên Supabase:', error.message || error);
      broadcastTableUpdate('production_logs');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi upsert production_logs:', err?.message || err);
    }
  }
}

export async function saveAllProductionLogs(logs: ProductionLog[]): Promise<void> {
  setLocal(STORAGE_KEYS.PRODUCTION_LOGS, logs);

  if (supabase && isSupabaseConfigured && logs.length > 0) {
    try {
      const rows = logs.map((log) => ({
        id: log.id,
        date: log.date,
        line_id: log.lineId,
        line_name: log.lineName,
        product_id: log.productId,
        product_name: log.productName,
        product_group: log.productGroup,
        actual_units: log.actualUnits,
        workers_count: log.workersCount,
        official_workers: log.officialWorkers ?? null,
        seasonal_workers: log.seasonalWorkers ?? null,
        equivalent_factor: log.equivalentFactor,
        equivalent_products: log.equivalentProducts,
        labor_productivity_percent: log.laborProductivityPercent,
        shift: log.shift,
        technician_name: log.technicianName,
        hourly_actuals: log.hourlyActuals || {},
        hourly_workers: { ...(log.hourlyWorkers || {}), "__official": log.hourlyOfficialWorkers || {}, "__seasonal": log.hourlySeasonalWorkers || {} },
        hourly_official_workers: log.hourlyOfficialWorkers || {},
        hourly_seasonal_workers: log.hourlySeasonalWorkers || {},
      }));
      const { error } = await supabase.from('production_logs').upsert(rows);
      if (error) console.warn('[storage] Lưu trữ production_logs lên Supabase:', error.message || error);
      broadcastTableUpdate('production_logs');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu production_logs lên Supabase:', err?.message || err);
    }
  }
}

// --------------------------------------------------------------------
// ĐỒNG BỘ RIÊNG CHO TAB 'GHI NHẬT KÝ CA' (SHIFT LOG / HOURLY LOGS)
// --------------------------------------------------------------------
let hasGranularSchema: boolean | null = false; // Mặc định dùng schema tiêu chuẩn (hourly_actuals JSONB) để đạt hiệu năng cao nhất và tương thích 100%

export interface HourlyLogPayload {
  work_date: string;
  department: string;
  product_code: string;
  shift: string;
  quantity: number;
  status?: string;
  productId?: string;
  productName?: string;
  allHourlyActuals?: Record<string, number>;
}

// Helper phát hiện lỗi kết nối / timeout mạng tạm thời (Failed to fetch, timeout, 57014, NetworkError)
export function isTransientNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = (typeof err === 'string' ? err : err.message || err.details || '') + '';
  const code = (err.code || '') + '';
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Load failed') ||
    msg.includes('timeout') ||
    msg.includes('AbortError') ||
    msg.includes('socket') ||
    msg.includes('offline') ||
    code === '57014'
  );
}

// Background queue để tự động đồng bộ lại khi có mạng
const pendingOfflineRecords = new Map<string, any>();

async function flushPendingOfflineQueue() {
  if (!supabase || !isSupabaseConfigured || pendingOfflineRecords.size === 0) return;
  const records = Array.from(pendingOfflineRecords.values());
  console.info(`[storage] Đang đồng bộ lại ${records.length} bản ghi chờ lên Supabase...`);
  try {
    const { error } = await supabase.from('production_logs').upsert(records);
    if (!error) {
      console.info('✅ Đã đồng bộ thành công các bản ghi ngoại tuyến lên Supabase.');
      pendingOfflineRecords.clear();
      broadcastTableUpdate('production_logs');
    }
  } catch (e) {
    console.warn('[storage] Thử đồng bộ ngoại tuyến chưa thành công, sẽ thử lại sau:', e);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.info('[storage] Trình duyệt đã kết nối mạng trở lại, kích hoạt đồng bộ.');
    flushPendingOfflineQueue();
  });
  setInterval(() => {
    if (pendingOfflineRecords.size > 0 && navigator.onLine !== false) {
      flushPendingOfflineQueue();
    }
  }, 25000);
}

export async function fetchShiftProductionLogs(
  selectedDate: string,
  selectedDept?: string
): Promise<{ data: any[] | null; error: any }> {
  if (!supabase || !isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase chưa được cấu hình') };
  }

  try {
    let rows: any[] = [];

    // Nếu chưa xác định hoặc đã xác nhận database hỗ trợ cột work_date
    if (hasGranularSchema === true) {
      let res: any = null;
      try {
        res = await supabase.from('production_logs').select('*').eq('work_date', selectedDate);
      } catch (e: any) {
        res = { error: e };
      }
      
      // Nếu bảng chưa có cột work_date (lỗi PGRST204 hoặc 42703), fallback sang cột date
      if (res?.error && (res.error.code === 'PGRST204' || res.error.code === '42703' || res.error.message?.includes('work_date') || res.error.message?.includes('schema cache'))) {
        hasGranularSchema = false;
        try {
          res = await supabase.from('production_logs').select('*').eq('date', selectedDate);
        } catch (e: any) {
          res = { error: e };
        }
      }

      if (res?.error) {
        if (isTransientNetworkError(res.error)) {
          console.warn('[storage] Mạng gián đoạn khi tải nhật ký ca, dùng bộ nhớ cục bộ:', res.error?.message || res.error);
          const localLogs = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
          rows = localLogs.filter((l) => l.date === selectedDate);
          return { data: rows, error: null };
        }
        console.warn('[storage] Lỗi query production_logs theo ngày:', res.error);
        return { data: null, error: res.error };
      }
      rows = res?.data || [];
    } else {
      // Schema tiêu chuẩn (cột date)
      let res: any = null;
      try {
        res = await supabase.from('production_logs').select('*').eq('date', selectedDate);
      } catch (e: any) {
        res = { error: e };
      }

      if (res?.error) {
        if (isTransientNetworkError(res.error)) {
          console.warn('[storage] Mạng gián đoạn khi tải nhật ký ca, dùng bộ nhớ cục bộ:', res.error?.message || res.error);
          const localLogs = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
          rows = localLogs.filter((l) => l.date === selectedDate);
          return { data: rows, error: null };
        }
        console.warn('[storage] Lỗi query production_logs theo date:', res.error);
        return { data: null, error: res.error };
      }
      rows = res?.data || [];
    }

    if (selectedDept && selectedDept !== 'ALL') {
      rows = rows.filter((r: any) => {
        const d = r.department || r.product_group;
        return !d || d === selectedDept;
      });
    }

    return { data: rows, error: null };
  } catch (err: any) {
    if (isTransientNetworkError(err)) {
      console.warn('[storage] Ngoại lệ mạng khi fetch shift production logs, nạp từ local storage:', err?.message || err);
      const localLogs = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, INITIAL_PRODUCTION_LOGS);
      const rows = localLogs.filter((l) => l.date === selectedDate);
      return { data: rows, error: null };
    }
    console.error('[storage] Ngoại lệ khi fetch shift production logs:', err);
    return { data: null, error: err };
  }
}

// Hàng đợi đơn chuyến (Single-flight Queue) để chống xung đột khóa hàng (Row Lock Contention / Deadlock)
const inFlightHourlyUpserts = new Map<string, Promise<any>>();

export async function upsertHourlyProductionLog(
  payload: HourlyLogPayload
): Promise<{ data: any; error: any }> {
  if (!supabase || !isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase chưa được cấu hình. Dữ liệu đang được lưu vào bộ nhớ cục bộ.') };
  }

  const queueKey = `${payload.work_date}_${payload.productId || payload.product_code}`;
  const previousOp = inFlightHourlyUpserts.get(queueKey) || Promise.resolve();

  const currentOp = previousOp
    .catch(() => {})
    .then(async () => {
      return executeUpsertHourlyInternal(payload);
    });

  inFlightHourlyUpserts.set(queueKey, currentOp);

  try {
    const res = await currentOp;
    return res;
  } finally {
    if (inFlightHourlyUpserts.get(queueKey) === currentOp) {
      inFlightHourlyUpserts.delete(queueKey);
    }
  }
}

async function executeUpsertHourlyInternal(
  payload: HourlyLogPayload
): Promise<{ data: any; error: any }> {
  const cleanSlot = payload.shift.replace(/\s+/g, ''); // Ví dụ: '8H-9H'
  const qty = Number(payload.quantity || 0);

  // 1. Thử ghi theo Granular Schema (nếu database đã xác nhận có các cột work_date, department, product_code,...)
  if (hasGranularSchema === true) {
    try {
      const record = {
        work_date: payload.work_date,
        department: payload.department,
        product_code: payload.product_code,
        shift: cleanSlot,
        quantity: qty,
        status: payload.status || 'OK'
      };

      const res = await supabase.from('production_logs').upsert(record, {
        onConflict: 'work_date,product_code,shift'
      });

      if (!res.error) {
        broadcastTableUpdate('production_logs');
        return { data: res.data, error: null };
      }

      if (
        res.error.code === 'PGRST204' || 
        res.error.code === '42703' || 
        res.error.code === '42P10' || 
        res.error.message?.includes('department') || 
        res.error.message?.includes('work_date')
      ) {
        hasGranularSchema = false;
      } else {
        console.warn('[storage] Lỗi UPSERT granular:', res.error);
        return { data: null, error: res.error };
      }
    } catch {
      hasGranularSchema = false;
    }
  }

  // 2. Schema Tiêu Chuẩn (Bảng production_logs chuẩn với hourly_actuals JSONB)
  try {
    const localProducts = getLocal<ProductDefinition[]>(STORAGE_KEYS.PRODUCTS, SUNHOUSE_PRODUCTS);
    const prod = localProducts.find(
      (p) => p.id === payload.productId || p.code === payload.product_code || p.id === payload.product_code || p.name.includes(payload.product_code)
    );

    const targetProdId = prod ? prod.id : (payload.productId || payload.product_code);
    const targetProdName = prod ? prod.name : (payload.productName || payload.product_code);
    const targetDept = prod ? prod.group : (payload.department === 'BG' ? 'BG' : payload.department === 'RMA' ? 'RMA' : 'MLN');
    const factor = prod ? prod.factor : 1.0;

    const lineId = targetDept === 'BG' ? 'line-bg-02' : targetDept === 'RMA' ? 'line-rma-03' : 'line-mln-01';
    const lineName = targetDept === 'BG' ? 'DCBG' : targetDept === 'RMA' ? 'DCRMA' : 'DCRO';

    // Cập nhật Local Storage NGAY LẬP TỨC để đảm bảo 100% dữ liệu không bị mất
    const localLogs = getLocal<ProductionLog[]>(STORAGE_KEYS.PRODUCTION_LOGS, []);
    const localIdx = localLogs.findIndex(
      (l) => l.date === payload.work_date && (l.productId === targetProdId || l.productId === payload.product_code)
    );

    let rowId = `log-${payload.work_date}-${targetProdId}`;
    let existingLog: ProductionLog | undefined = localIdx !== -1 ? localLogs[localIdx] : undefined;
    if (existingLog) {
      rowId = existingLog.id;
    }

    const rawHourly: Record<string, number> = payload.allHourlyActuals
      ? { ...payload.allHourlyActuals }
      : { ...(existingLog?.hourlyActuals || {}), [cleanSlot]: qty };

    const sanitizedHourly: Record<string, number> = {};
    Object.entries(rawHourly).forEach(([k, v]) => {
      if (isValidHourlySlot(k)) {
        sanitizedHourly[k] = Number(v) || 0;
      }
    });

    const totalUnits = Object.values(sanitizedHourly).reduce((sum, v) => sum + (Number(v) || 0), 0);
    const currentFactor = existingLog?.equivalentFactor || factor;
    const eqUnits = Math.round(totalUnits * currentFactor);

    const updatedLog: ProductionLog = {
      id: rowId,
      date: payload.work_date,
      lineId: existingLog?.lineId || lineId,
      lineName: existingLog?.lineName || lineName,
      productId: targetProdId,
      productName: existingLog?.productName || targetProdName,
      productGroup: existingLog?.productGroup || targetDept,
      actualUnits: totalUnits,
      workersCount: existingLog?.workersCount || 0,
      officialWorkers: existingLog?.officialWorkers,
      seasonalWorkers: existingLog?.seasonalWorkers,
      equivalentFactor: currentFactor,
      equivalentProducts: eqUnits,
      laborProductivityPercent: existingLog?.laborProductivityPercent || 0,
      shift: existingLog?.shift || "Ca HC (08:00 - 17:00)",
      technicianName: existingLog?.technicianName || '',
      hourlyActuals: sanitizedHourly,
      hourlyWorkers: existingLog?.hourlyWorkers || {},
      hourlyOfficialWorkers: existingLog?.hourlyOfficialWorkers || {},
      hourlySeasonalWorkers: existingLog?.hourlySeasonalWorkers || {},
    };

    if (localIdx !== -1) {
      localLogs[localIdx] = updatedLog;
    } else {
      localLogs.unshift(updatedLog);
    }
    setLocal(STORAGE_KEYS.PRODUCTION_LOGS, localLogs);

    // Chuẩn bị payload đồng bộ lên Supabase tương thích chính xác với schema tiêu chuẩn
    const standardRecord = {
      id: updatedLog.id,
      date: updatedLog.date,
      line_id: updatedLog.lineId,
      line_name: updatedLog.lineName,
      product_id: updatedLog.productId,
      product_name: updatedLog.productName,
      product_group: updatedLog.productGroup,
      actual_units: updatedLog.actualUnits,
      workers_count: updatedLog.workersCount,
      official_workers: updatedLog.officialWorkers ?? null,
      seasonal_workers: updatedLog.seasonalWorkers ?? null,
      equivalent_factor: updatedLog.equivalentFactor,
      equivalent_products: updatedLog.equivalentProducts,
      labor_productivity_percent: updatedLog.laborProductivityPercent,
      shift: updatedLog.shift,
      technician_name: updatedLog.technicianName,
      hourly_actuals: updatedLog.hourlyActuals,
      hourly_workers: updatedLog.hourlyWorkers,
      hourly_official_workers: updatedLog.hourlyOfficialWorkers,
      hourly_seasonal_workers: updatedLog.hourlySeasonalWorkers,
    };

    let res: any = null;
    try {
      res = await supabase.from('production_logs').upsert(standardRecord);
    } catch (e: any) {
      res = { error: e };
    }

    // Nếu gặp lỗi mạng tạm thời hoặc timeout (Failed to fetch, 57014), tự động thử gửi lại sau 600ms
    if (res?.error && isTransientNetworkError(res.error)) {
      console.warn('[storage] Phát hiện mạng chập chờn hoặc timeout, tự động gửi lại sau 600ms...', res.error?.message || res.error);
      await new Promise((r) => setTimeout(r, 600));
      try {
        res = await supabase.from('production_logs').upsert(standardRecord);
      } catch (e: any) {
        res = { error: e };
      }
    }

    if (res?.error) {
      // Nếu là lỗi mất kết nối mạng hoặc timeout (Failed to fetch, 57014, NetworkError)
      if (isTransientNetworkError(res.error)) {
        console.warn('[storage] Mất kết nối mạng tạm thời (Failed to fetch / Timeout). Bản ghi đã được bảo toàn an toàn trên máy cục bộ (LocalStorage) và lưu vào hàng đợi đồng bộ tự động.');
        pendingOfflineRecords.set(standardRecord.id, standardRecord);
        broadcastTableUpdate('production_logs', { action: 'hourly_upsert', id: standardRecord.id });
        return { data: null, error: null }; // Bỏ qua lỗi toast làm phiền người dùng vì đã lưu an toàn vào LocalStorage
      }
      console.error('[storage] Lỗi lưu production_logs (schema tiêu chuẩn):', res.error);
      return { data: null, error: res.error };
    }

    pendingOfflineRecords.delete(standardRecord.id);
    broadcastTableUpdate('production_logs', { action: 'hourly_upsert', id: standardRecord.id });
    return { data: res?.data, error: null };
  } catch (err: any) {
    if (isTransientNetworkError(err)) {
      console.warn('[storage] Ngoại lệ mạng (Failed to fetch / Timeout). Dữ liệu đã được bảo toàn an toàn trên máy cục bộ.');
      broadcastTableUpdate('production_logs', { action: 'hourly_upsert', id: payload.productId || payload.product_code });
      return { data: null, error: null };
    }
    console.error('[storage] Ngoại lệ khi lưu production_logs:', err);
    return { data: null, error: err };
  }
}

// ==========================================
// 5. KẾ HOẠCH THÁNG (MONTHLY PLAN)
// ==========================================
export type MonthlyPlanData = {
  [yearMonth: string]: { [productId: string]: { [day: number]: number } };
};

export async function getMonthlyPlan(): Promise<MonthlyPlanData> {
  const today = new Date();
  const currentYearMonthStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  const initial: MonthlyPlanData = { [currentYearMonthStr]: {} };

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('monthly_plan')
        .select('id, plan_data')
        .eq('id', 'default_plan')
        .single();

      if (!error && data && data.plan_data) {
        setLocal(STORAGE_KEYS.MONTHLY_PLAN, data.plan_data);
        return data.plan_data as MonthlyPlanData;
      }
    } catch (err) {
      console.warn('[storage] Không thể tải monthly_plan từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<MonthlyPlanData>(STORAGE_KEYS.MONTHLY_PLAN, initial);
}

export async function saveMonthlyPlan(plan: MonthlyPlanData): Promise<void> {
  setLocal(STORAGE_KEYS.MONTHLY_PLAN, plan);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('monthly_plan').upsert({
        id: 'default_plan',
        plan_data: plan,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[storage] Lưu monthly_plan lên Supabase:', error.message || error);
      broadcastTableUpdate('monthly_plan');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu monthly_plan:', err?.message || err);
    }
  }
}

// ==========================================
// 6. MỤC TIÊU NSLĐ THÁNG (MONTHLY TARGETS)
// ==========================================
export async function getMonthlyTargets(): Promise<Record<string, number>> {
  const defaults: Record<string, number> = {};
  for (const y of [2025, 2026]) {
    for (let m = 1; m <= 12; m++) {
      defaults[`${y}-${m}`] = 110;
    }
  }

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('monthly_targets')
        .select('id, targets_data')
        .eq('id', 'default_targets')
        .single();

      if (!error && data && data.targets_data) {
        setLocal(STORAGE_KEYS.MONTHLY_TARGETS, data.targets_data);
        return data.targets_data as Record<string, number>;
      }
    } catch (err) {
      console.warn('[storage] Không thể tải monthly_targets từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<Record<string, number>>(STORAGE_KEYS.MONTHLY_TARGETS, defaults);
}

export async function saveMonthlyTargets(targets: Record<string, number>): Promise<void> {
  setLocal(STORAGE_KEYS.MONTHLY_TARGETS, targets);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('monthly_targets').upsert({
        id: 'default_targets',
        targets_data: targets,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[storage] Lưu monthly_targets lên Supabase:', error.message || error);
      broadcastTableUpdate('monthly_targets');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu monthly_targets:', err?.message || err);
    }
  }
}

// ==========================================
// 7. SỐ LIỆU LỊCH SỬ THÁNG (METRICS 2025 / 2026)
// ==========================================
export async function getMonthlyMetrics(year: 2025 | 2026): Promise<MonthlyMetric[]> {
  const key = year === 2025 ? STORAGE_KEYS.METRICS_2025 : STORAGE_KEYS.METRICS_2026;
  const initial = year === 2025 ? HISTORICAL_2025 : HISTORICAL_2026;

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('monthly_metrics')
        .select('id, year, metrics_data')
        .eq('id', `metrics_${year}`)
        .single();

      if (!error && data && data.metrics_data) {
        setLocal(key, data.metrics_data);
        return data.metrics_data as MonthlyMetric[];
      }
    } catch (err) {
      console.warn(`[storage] Không thể tải metrics ${year} từ Supabase, dùng local fallback:`, err);
    }
  }
  return getLocal<MonthlyMetric[]>(key, initial);
}

export async function saveMonthlyMetrics(year: 2025 | 2026, metrics: MonthlyMetric[]): Promise<void> {
  const key = year === 2025 ? STORAGE_KEYS.METRICS_2025 : STORAGE_KEYS.METRICS_2026;
  setLocal(key, metrics);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('monthly_metrics').upsert({
        id: `metrics_${year}`,
        year: year,
        metrics_data: metrics,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn(`[storage] Lưu metrics ${year} lên Supabase:`, error.message || error);
      broadcastTableUpdate('monthly_metrics');
    } catch (err: any) {
      console.warn(`[storage] Trạng thái kết nối khi lưu metrics ${year}:`, err?.message || err);
    }
  }
}

// ==========================================
// 8. BÁO CÁO HÀNG NGÀY CHI TIẾT (GAS & ASSEMBLY)
// ==========================================
export interface AllDailyReportsBundle {
  gas: DailyReportRowGas[];
  assembly: DailyReportRowAssembly[];
  monthlyScrap: MonthlyScrapReport[];
  weeklyScrap: WeeklyScrapReport[];
  weeklyDclr: WeeklyDclreErrorRate[];
  monthlyDclr: MonthlyDclreErrorRate[];
  declaredImeis: any[];
  scannedImeis: any[];
}

// Gom toàn bộ 8 bảng báo cáo hàng ngày vào 1 query duy nhất để tiết kiệm 87% Egress và tải siêu tốc
export async function getAllDailyReports(): Promise<AllDailyReportsBundle> {
  const result: AllDailyReportsBundle = {
    gas: getLocal<DailyReportRowGas[]>(STORAGE_KEYS.GAS_DAILY, INITIAL_GAS_DAILY_REPORTS),
    assembly: getLocal<DailyReportRowAssembly[]>(STORAGE_KEYS.ASSEMBLY_DAILY, INITIAL_ASSEMBLY_DAILY_REPORTS),
    monthlyScrap: getLocal<MonthlyScrapReport[]>(STORAGE_KEYS.MONTHLY_SCRAP, MONTHLY_SCRAP_REPORT),
    weeklyScrap: getLocal<WeeklyScrapReport[]>(STORAGE_KEYS.WEEKLY_SCRAP, WEEKLY_SCRAP_REPORT),
    weeklyDclr: getLocal<WeeklyDclreErrorRate[]>(STORAGE_KEYS.WEEKLY_DCLR_ERROR, WEEKLY_DCLR_ERROR_RATE),
    monthlyDclr: getLocal<MonthlyDclreErrorRate[]>(STORAGE_KEYS.MONTHLY_DCLR_ERROR, MONTHLY_DCLR_ERROR_RATE),
    declaredImeis: getLocal<any[]>(STORAGE_KEYS.DECLARED_IMEIS, []),
    scannedImeis: getLocal<any[]>(STORAGE_KEYS.SCANNED_IMEIS, []),
  };

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('id, report_type, report_data')
        .in('id', [
          'gas_daily_reports',
          'assembly_daily_reports',
          'monthly_scrap_report',
          'weekly_scrap_report',
          'weekly_dclr_error',
          'monthly_dclr_error',
          'declared_imeis',
          'scanned_imeis',
        ]);

      if (!error && data && data.length > 0) {
        data.forEach((row: any) => {
          if (!row.report_data) return;
          if (row.id === 'gas_daily_reports') {
            result.gas = row.report_data;
            setLocal(STORAGE_KEYS.GAS_DAILY, row.report_data);
          } else if (row.id === 'assembly_daily_reports') {
            result.assembly = row.report_data;
            setLocal(STORAGE_KEYS.ASSEMBLY_DAILY, row.report_data);
          } else if (row.id === 'monthly_scrap_report') {
            result.monthlyScrap = row.report_data;
            setLocal(STORAGE_KEYS.MONTHLY_SCRAP, row.report_data);
          } else if (row.id === 'weekly_scrap_report') {
            result.weeklyScrap = row.report_data;
            setLocal(STORAGE_KEYS.WEEKLY_SCRAP, row.report_data);
          } else if (row.id === 'weekly_dclr_error') {
            result.weeklyDclr = row.report_data;
            setLocal(STORAGE_KEYS.WEEKLY_DCLR_ERROR, row.report_data);
          } else if (row.id === 'monthly_dclr_error') {
            result.monthlyDclr = row.report_data;
            setLocal(STORAGE_KEYS.MONTHLY_DCLR_ERROR, row.report_data);
          } else if (row.id === 'declared_imeis') {
            result.declaredImeis = row.report_data;
            setLocal(STORAGE_KEYS.DECLARED_IMEIS, row.report_data);
          } else if (row.id === 'scanned_imeis') {
            result.scannedImeis = row.report_data;
            setLocal(STORAGE_KEYS.SCANNED_IMEIS, row.report_data);
          }
        });
      }
    } catch (err) {
      console.warn('[storage] Không thể nạp gói daily_reports từ Supabase:', err);
    }
  }

  return result;
}
export async function getGasDailyReports(): Promise<DailyReportRowGas[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('id, report_type, report_data')
        .eq('id', 'gas_daily_reports')
        .single();

      if (!error && data && data.report_data) {
        setLocal(STORAGE_KEYS.GAS_DAILY, data.report_data);
        return data.report_data as DailyReportRowGas[];
      }
    } catch (err) {
      console.warn('[storage] Không thể tải gas_daily_reports từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<DailyReportRowGas[]>(STORAGE_KEYS.GAS_DAILY, INITIAL_GAS_DAILY_REPORTS);
}

export async function saveGasDailyReports(reports: DailyReportRowGas[]): Promise<void> {
  setLocal(STORAGE_KEYS.GAS_DAILY, reports);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('daily_reports').upsert({
        id: 'gas_daily_reports',
        report_type: 'gas',
        report_data: reports,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[storage] Lưu gas_daily_reports lên Supabase:', error.message || error);
      broadcastTableUpdate('daily_reports');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu gas_daily_reports:', err?.message || err);
    }
  }
}

export async function getAssemblyDailyReports(): Promise<DailyReportRowAssembly[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('id, report_type, report_data')
        .eq('id', 'assembly_daily_reports')
        .single();

      if (!error && data && data.report_data) {
        setLocal(STORAGE_KEYS.ASSEMBLY_DAILY, data.report_data);
        return data.report_data as DailyReportRowAssembly[];
      }
    } catch (err) {
      console.warn('[storage] Không thể tải assembly_daily_reports từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<DailyReportRowAssembly[]>(STORAGE_KEYS.ASSEMBLY_DAILY, INITIAL_ASSEMBLY_DAILY_REPORTS);
}

export async function saveAssemblyDailyReports(reports: DailyReportRowAssembly[]): Promise<void> {
  setLocal(STORAGE_KEYS.ASSEMBLY_DAILY, reports);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('daily_reports').upsert({
        id: 'assembly_daily_reports',
        report_type: 'assembly',
        report_data: reports,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[storage] Lưu assembly_daily_reports lên Supabase:', error.message || error);
      broadcastTableUpdate('daily_reports');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu assembly_daily_reports:', err?.message || err);
    }
  }
}

// ==========================================
// 8B. BÁO CÁO PHẾ PHẨM & TỶ LỆ LỖI (SCRAP & DCLR ERROR)
// ==========================================
export async function getMonthlyScrapReport(): Promise<MonthlyScrapReport[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('report_data')
        .eq('id', 'monthly_scrap_report')
        .maybeSingle();

      if (!error && data?.report_data) {
        setLocal(STORAGE_KEYS.MONTHLY_SCRAP, data.report_data);
        return data.report_data as MonthlyScrapReport[];
      }
    } catch (err) {
      console.warn('[storage] Không thể tải monthly_scrap từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<MonthlyScrapReport[]>(STORAGE_KEYS.MONTHLY_SCRAP, MONTHLY_SCRAP_REPORT);
}

export async function saveMonthlyScrapReport(reports: MonthlyScrapReport[]): Promise<void> {
  setLocal(STORAGE_KEYS.MONTHLY_SCRAP, reports);
  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('daily_reports').upsert({
        id: 'monthly_scrap_report',
        report_type: 'scrap',
        report_data: reports,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[storage] Lưu monthly_scrap lên Supabase:', error.message || error);
      broadcastTableUpdate('daily_reports');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu monthly_scrap:', err?.message || err);
    }
  }
}

export async function getWeeklyScrapReport(): Promise<WeeklyScrapReport[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('report_data')
        .eq('id', 'weekly_scrap_report')
        .maybeSingle();

      if (!error && data?.report_data) {
        setLocal(STORAGE_KEYS.WEEKLY_SCRAP, data.report_data);
        return data.report_data as WeeklyScrapReport[];
      }
    } catch (err) {
      console.warn('[storage] Không thể tải weekly_scrap từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<WeeklyScrapReport[]>(STORAGE_KEYS.WEEKLY_SCRAP, WEEKLY_SCRAP_REPORT);
}

export async function saveWeeklyScrapReport(reports: WeeklyScrapReport[]): Promise<void> {
  setLocal(STORAGE_KEYS.WEEKLY_SCRAP, reports);
  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('daily_reports').upsert({
        id: 'weekly_scrap_report',
        report_type: 'scrap',
        report_data: reports,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[storage] Lưu weekly_scrap lên Supabase:', error.message || error);
      broadcastTableUpdate('daily_reports');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu weekly_scrap:', err?.message || err);
    }
  }
}

export async function getWeeklyDclrErrorRate(): Promise<WeeklyDclreErrorRate[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('report_data')
        .eq('id', 'weekly_dclr_error')
        .maybeSingle();

      if (!error && data?.report_data) {
        setLocal(STORAGE_KEYS.WEEKLY_DCLR_ERROR, data.report_data);
        return data.report_data as WeeklyDclreErrorRate[];
      }
    } catch (err) {
      console.warn('[storage] Không thể tải weekly_dclr_error từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<WeeklyDclreErrorRate[]>(STORAGE_KEYS.WEEKLY_DCLR_ERROR, WEEKLY_DCLR_ERROR_RATE);
}

export async function saveWeeklyDclrErrorRate(reports: WeeklyDclreErrorRate[]): Promise<void> {
  setLocal(STORAGE_KEYS.WEEKLY_DCLR_ERROR, reports);
  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('daily_reports').upsert({
        id: 'weekly_dclr_error',
        report_type: 'dclr_error',
        report_data: reports,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[storage] Lưu weekly_dclr_error lên Supabase:', error.message || error);
      broadcastTableUpdate('daily_reports');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu weekly_dclr_error:', err?.message || err);
    }
  }
}

export async function getMonthlyDclrErrorRate(): Promise<MonthlyDclreErrorRate[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('report_data')
        .eq('id', 'monthly_dclr_error')
        .maybeSingle();

      if (!error && data?.report_data) {
        setLocal(STORAGE_KEYS.MONTHLY_DCLR_ERROR, data.report_data);
        return data.report_data as MonthlyDclreErrorRate[];
      }
    } catch (err) {
      console.warn('[storage] Không thể tải monthly_dclr_error từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<MonthlyDclreErrorRate[]>(STORAGE_KEYS.MONTHLY_DCLR_ERROR, MONTHLY_DCLR_ERROR_RATE);
}

export async function saveMonthlyDclrErrorRate(reports: MonthlyDclreErrorRate[]): Promise<void> {
  setLocal(STORAGE_KEYS.MONTHLY_DCLR_ERROR, reports);
  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('daily_reports').upsert({
        id: 'monthly_dclr_error',
        report_type: 'dclr_error',
        report_data: reports,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[storage] Lưu monthly_dclr_error lên Supabase:', error.message || error);
      broadcastTableUpdate('daily_reports');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu monthly_dclr_error:', err?.message || err);
    }
  }
}

// ==========================================
// 9. QUẢN LÝ IMEI, GIAO DỊCH & CHẤT LƯỢNG (TRANSACTIONS, LABELS, INVENTORY)
// ==========================================
export async function getDeclaredImeis(): Promise<any[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('report_data')
        .eq('id', 'declared_imeis')
        .maybeSingle();

      if (!error && data?.report_data) {
        setLocal(STORAGE_KEYS.DECLARED_IMEIS, data.report_data);
        return data.report_data as any[];
      }
    } catch (err) {
      console.warn('[storage] Không thể tải declared_imeis từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<any[]>(STORAGE_KEYS.DECLARED_IMEIS, []);
}

export async function saveDeclaredImeis(records: any[]): Promise<void> {
  setLocal(STORAGE_KEYS.DECLARED_IMEIS, records);
  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('daily_reports').upsert({
        id: 'declared_imeis',
        report_type: 'imei',
        report_data: records,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[storage] Lưu declared_imeis lên Supabase:', error.message || error);
      broadcastTableUpdate('daily_reports');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu declared_imeis:', err?.message || err);
    }
  }
}

export async function getScannedImeis(): Promise<any[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('report_data')
        .eq('id', 'scanned_imeis')
        .maybeSingle();

      if (!error && data?.report_data) {
        setLocal(STORAGE_KEYS.SCANNED_IMEIS, data.report_data);
        return data.report_data as any[];
      }
    } catch (err) {
      console.warn('[storage] Không thể tải scanned_imeis từ Supabase, dùng local fallback:', err);
    }
  }
  return getLocal<any[]>(STORAGE_KEYS.SCANNED_IMEIS, []);
}

export async function saveScannedImeis(records: any[]): Promise<void> {
  setLocal(STORAGE_KEYS.SCANNED_IMEIS, records);
  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('daily_reports').upsert({
        id: 'scanned_imeis',
        report_type: 'imei',
        report_data: records,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[storage] Lưu scanned_imeis lên Supabase:', error.message || error);
      broadcastTableUpdate('daily_reports');
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu scanned_imeis:', err?.message || err);
    }
  }
}

// Bảng nhật ký giao dịch (Transactions) - Giới hạn 100 bản ghi mới nhất để tiết kiệm tối đa Egress
export async function getTransactions(limit: number = 100): Promise<any[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, type, amount, status, reference_id, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) return data;
    } catch (err) {
      console.warn('[storage] Không thể tải transactions:', err);
    }
  }
  return [];
}

// Bảng nhật ký nhãn/tem (Labels) - Giới hạn 100 bản ghi mới nhất để tiết kiệm tối đa Egress
export async function getLabels(limit: number = 100): Promise<any[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('labels')
        .select('id, imei, product_id, status, print_date, batch_number')
        .order('print_date', { ascending: false })
        .limit(limit);

      if (!error && data) return data;
    } catch (err) {
      console.warn('[storage] Không thể tải labels:', err);
    }
  }
  return [];
}

// Bảng tồn kho (Inventory) - Chỉ chọn các cột cần thiết
export async function getInventory(): Promise<any[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, product_id, quantity, warehouse, updated_at')
        .order('updated_at', { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn('[storage] Không thể tải inventory:', err);
    }
  }
  return [];
}

// Bảng lệnh sản xuất (Production Orders) - Giới hạn 100 bản ghi gần nhất
export async function getProductionOrders(limit: number = 100): Promise<any[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('production_orders')
        .select('id, order_code, product_id, target_quantity, status, start_date, end_date')
        .order('start_date', { ascending: false })
        .limit(limit);

      if (!error && data) return data;
    } catch (err) {
      console.warn('[storage] Không thể tải production_orders:', err);
    }
  }
  return [];
}

// ==========================================
// 9B. BẢN NHÁP FORM NHẬT KÝ CA (FORM DRAFTS & LIVE SYNC)
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
  const localData = getLocal<FormDraftData | null>(localKey, null);

  if (supabase && isSupabaseConfigured) {
    try {
      const draftId = `draft_${date}_${shift.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const { data, error } = await supabase
        .from('daily_reports')
        .select('report_data')
        .eq('id', draftId)
        .maybeSingle();

      if (!error && data?.report_data) {
        setLocal(localKey, data.report_data);
        return data.report_data as FormDraftData;
      }
    } catch (err) {
      console.warn('[storage] Không thể tải form draft từ Supabase:', err);
    }
  }
  return localData;
}

export async function saveFormDraft(draft: FormDraftData): Promise<void> {
  const localKey = `sunhouse_draft_${draft.date}_${draft.shift}`;
  setLocal(localKey, draft);
  setLocal('sunhouse_last_active_form_draft', draft);

  if (supabase && isSupabaseConfigured) {
    try {
      const draftId = `draft_${draft.date}_${draft.shift.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const { error } = await supabase.from('daily_reports').upsert({
        id: draftId,
        report_type: 'form_draft',
        report_data: draft,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('[storage] Lưu form draft lên Supabase:', error.message || error);
    } catch (err: any) {
      console.warn('[storage] Trạng thái kết nối khi lưu form draft:', err?.message || err);
    }
  }
}

export async function clearFormDraft(date: string, shift: string): Promise<void> {
  const localKey = `sunhouse_draft_${date}_${shift}`;
  try {
    localStorage.removeItem(localKey);
    localStorage.removeItem('sunhouse_last_active_form_draft');
  } catch (e) {}

  if (supabase && isSupabaseConfigured) {
    try {
      const draftId = `draft_${date}_${shift.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await supabase.from('daily_reports').delete().eq('id', draftId);
    } catch (err) {
      console.warn('[storage] Xóa form draft thất bại:', err);
    }
  }
}

export function sendLiveFormBroadcast(draft: Partial<FormDraftData>): void {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    const ch = getSharedBroadcastChannel();
    if (!ch) return;
    ch.send({
      type: 'broadcast',
      event: 'form_cell_change',
      payload: { ...draft, senderId: CLIENT_SESSION_ID, timestamp: Date.now() },
    });
  } catch (err) {
    console.warn('[storage] Gửi broadcast thất bại:', err);
  }
}

// ==========================================
// 10. REALTIME SUBSCRIPTION (LẮNG NGHE THAY ĐỔI TỐI ƯU)
// ==========================================
export interface RealtimeCallbacks {
  // Các bảng dữ liệu biến động liên tục (ưu tiên hàng đầu)
  onProductionLogsChange?: (payload: any) => void;
  onAttendanceChange?: (payload: any) => void;
  onTransactionsChange?: (payload: any) => void;
  onInventoryChange?: (payload: any) => void;
  onProductionOrdersChange?: (payload: any) => void;

  // Các bảng danh mục và kế hoạch
  onWorkersChange?: (payload: any) => void;
  onProductsChange?: (payload: any) => void;
  onMonthlyPlanChange?: (payload: any) => void;
  onMonthlyTargetsChange?: (payload: any) => void;
  onMonthlyMetricsChange?: (payload: any) => void;
  onDailyReportsChange?: (payload: any) => void;
  onLiveFormChange?: (payload: any) => void;
  onTableSyncChange?: (table: string, payload: any) => void;
}

/**
 * Đăng ký lắng nghe Realtime tối ưu băng thông (Egress) và Connection Quota:
 * - Chỉ tạo event listener cho đúng các bảng có callback thực tế.
 * - Cung cấp hàm cleanup (unsubscribe) đảm bảo không bị trùng lặp kết nối khi component re-render.
 */
export function subscribeToRealtime(callbacks: RealtimeCallbacks): () => void {
  if (!supabase || !isSupabaseConfigured) {
    return () => {};
  }

  try {
    const channelName = `sunhouse_realtime_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    let channel = supabase.channel(channelName);

    // 1. Lắng nghe các bảng biến động liên tục
    if (callbacks.onProductionLogsChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'production_logs' },
        (payload) => {
          callbacks.onProductionLogsChange?.(payload);
        }
      );
    }

    if (callbacks.onAttendanceChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_records' },
        (payload) => {
          callbacks.onAttendanceChange?.(payload);
        }
      );
    }

    if (callbacks.onTransactionsChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          callbacks.onTransactionsChange?.(payload);
        }
      );
    }

    if (callbacks.onInventoryChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          callbacks.onInventoryChange?.(payload);
        }
      );
    }

    if (callbacks.onProductionOrdersChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'production_orders' },
        (payload) => {
          callbacks.onProductionOrdersChange?.(payload);
        }
      );
    }

    // 2. Lắng nghe các bảng cấu hình / danh mục / kế hoạch
    if (callbacks.onWorkersChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workers' },
        (payload) => {
          callbacks.onWorkersChange?.(payload);
        }
      );
    }

    if (callbacks.onProductsChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          callbacks.onProductsChange?.(payload);
        }
      );
    }

    if (callbacks.onMonthlyPlanChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_plan' },
        (payload) => {
          callbacks.onMonthlyPlanChange?.(payload);
        }
      );
    }

    if (callbacks.onMonthlyTargetsChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_targets' },
        (payload) => {
          callbacks.onMonthlyTargetsChange?.(payload);
        }
      );
    }

    if (callbacks.onMonthlyMetricsChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_metrics' },
        (payload) => {
          callbacks.onMonthlyMetricsChange?.(payload);
        }
      );
    }

    if (callbacks.onDailyReportsChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_reports' },
        (payload) => {
          callbacks.onDailyReportsChange?.(payload);
        }
      );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Kênh đồng bộ postgres_changes đã sẵn sàng');
      }
    });

    // 3. Đăng ký phòng Broadcast chung (sunhouse_live_form_room) để đồng bộ tức thì các tab/thiết bị
    let broadcastRoom = getSharedBroadcastChannel();
    if (broadcastRoom) {
      if (callbacks.onLiveFormChange) {
        broadcastRoom.on(
          'broadcast',
          { event: 'form_cell_change' },
          (payload: any) => {
            // Lọc bỏ tin nhắn do chính tab này gửi ra để tránh gián đoạn nhập liệu
            if (payload?.payload?.senderId === CLIENT_SESSION_ID) return;
            callbacks.onLiveFormChange?.(payload);
          }
        );
      }

      if (callbacks.onTableSyncChange) {
        broadcastRoom.on(
          'broadcast',
          { event: 'table_sync_event' },
          (payload: any) => {
            if (payload?.payload?.senderId === CLIENT_SESSION_ID) return;
            const tbl = payload?.payload?.table;
            if (tbl) {
              callbacks.onTableSyncChange?.(tbl, payload.payload);
            }
          }
        );
      }
    }

    // Cleanup function để hủy kết nối channel khi unmount
    return () => {
      try {
        supabase?.removeChannel(channel);
      } catch (err) {
        console.warn('[Realtime] Lỗi dọn dẹp kênh kết nối:', err);
      }
    };
  } catch (err) {
    console.warn('[Realtime] Không thể kết nối kênh Realtime:', err);
    return () => {};
  }
}
