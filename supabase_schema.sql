-- ====================================================================
-- SUNHOUSE MES - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Hệ thống điều hành sản xuất DCLR (Máy lọc nước RO & Bếp Gas)
-- Sao chép toàn bộ mã này dán vào: Supabase Dashboard -> SQL Editor -> Run
-- ====================================================================

-- 1. BẢNG QUẢN LÝ NHÂN SỰ (WORKERS)
CREATE TABLE IF NOT EXISTS public.workers (
    id TEXT PRIMARY KEY,                       -- Mã nhân viên (ví dụ: 'NV001', '600000806')
    name TEXT NOT NULL,                        -- Họ và tên
    division TEXT NOT NULL,                    -- Bộ phận ('RO', 'BG', 'RMA')
    type TEXT NOT NULL,                        -- Loại lao động ('OFFICIAL', 'SEASONAL', 'PROBATION')
    qr_code TEXT NOT NULL,                     -- Mã quét QR Code
    image_url TEXT,                            -- Đường dẫn ảnh đại diện
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG NHẬT KÝ ĐIỂM DANH (ATTENDANCE RECORDS)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,                       -- Khóa chính duy nhất
    worker_id TEXT NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    date TEXT NOT NULL,                        -- Ngày làm việc định dạng YYYY-MM-DD
    slot TEXT,                                 -- Tên ca / slot
    check_in_time TEXT NOT NULL,               -- Thời gian vào (ISO string hoặc timestamp)
    check_out_time TEXT,                       -- Thời gian ra (ISO string hoặc timestamp)
    scanned_division TEXT,                     -- Bộ phận quét ('RO', 'BG', 'RMA')
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chỉ mục tối ưu truy vấn điểm danh theo ngày & nhân viên
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_worker_id ON public.attendance_records(worker_id);

-- 3. BẢNG DANH MỤC SẢN PHẨM & HỆ SỐ QUY ĐỔI (PRODUCTS)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,                       -- ID sản phẩm
    name TEXT NOT NULL,                        -- Tên sản phẩm
    "group" TEXT NOT NULL,                     -- Chủng loại ('MLN', 'BG', 'RMA')
    code TEXT NOT NULL,                        -- Mã sản phẩm (ví dụ: 'SH-RO01')
    factor NUMERIC NOT NULL DEFAULT 1.0,       -- Hệ số quy đổi năng suất
    description TEXT DEFAULT '',               -- Mô tả chi tiết
    price NUMERIC,                             -- Giá bán (VND)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG NHẬT KÝ SẢN XUẤT CA LÀM VIỆC (PRODUCTION LOGS)
CREATE TABLE IF NOT EXISTS public.production_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, -- ID bản ghi
    work_date TEXT,                            -- Ngày làm việc (YYYY-MM-DD)
    department TEXT DEFAULT 'RO',              -- Bộ phận ('RO', 'BG', 'RMA')
    product_code TEXT,                         -- Mã model sản phẩm (ví dụ: 'MH8896L')
    shift TEXT,                                -- Ca / Khung giờ (ví dụ: '8H-9H')
    quantity NUMERIC NOT NULL DEFAULT 0,       -- Số lượng sản phẩm
    status TEXT DEFAULT 'OK',                  -- Trạng thái ('OK')
    date TEXT,                                 -- Cột tương thích cũ (YYYY-MM-DD)
    line_id TEXT,                              -- ID dây chuyền
    line_name TEXT,                            -- Tên dây chuyền ('DCRO', 'DCBG',...)
    product_id TEXT,                           -- ID sản phẩm lắp ráp
    product_name TEXT,                         -- Tên sản phẩm
    product_group TEXT,                        -- Nhóm sản phẩm ('MLN', 'BG', 'RMA')
    actual_units NUMERIC NOT NULL DEFAULT 0,   -- Sản lượng thực tế (cái)
    workers_count NUMERIC NOT NULL DEFAULT 0,  -- Số công lao động
    official_workers NUMERIC DEFAULT 0,        -- Số công chính thức
    seasonal_workers NUMERIC DEFAULT 0,        -- Số công thời vụ
    equivalent_factor NUMERIC NOT NULL DEFAULT 1.0, -- Hệ số quy đổi
    equivalent_products NUMERIC NOT NULL DEFAULT 0, -- Sản lượng quy đổi = actual_units * factor
    labor_productivity_percent NUMERIC NOT NULL DEFAULT 0, -- NSLĐ (%)
    technician_name TEXT,                      -- Tên KSV / Kỹ thuật viên
    hourly_actuals JSONB DEFAULT '{}'::jsonb,  -- Sản lượng theo từng khung giờ { "08:00 - 09:00": 25, ... }
    hourly_workers JSONB DEFAULT '{}'::jsonb,  -- Số công theo từng khung giờ
    hourly_official_workers JSONB DEFAULT '{}'::jsonb,
    hourly_seasonal_workers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tự động bổ sung các cột nếu bảng production_logs đã được tạo từ trước
ALTER TABLE public.production_logs ADD COLUMN IF NOT EXISTS work_date TEXT;
ALTER TABLE public.production_logs ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'RO';
ALTER TABLE public.production_logs ADD COLUMN IF NOT EXISTS product_code TEXT;
ALTER TABLE public.production_logs ADD COLUMN IF NOT EXISTS shift TEXT;
ALTER TABLE public.production_logs ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 0;
ALTER TABLE public.production_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OK';

-- Tạo Unique Constraint trên (work_date, product_code, shift) để phục vụ lệnh UPSERT onConflict
CREATE UNIQUE INDEX IF NOT EXISTS idx_prod_logs_workdate_product_shift 
ON public.production_logs (work_date, product_code, shift);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'production_logs_work_date_product_code_shift_key'
    ) THEN
        ALTER TABLE public.production_logs 
        ADD CONSTRAINT production_logs_work_date_product_code_shift_key 
        UNIQUE USING INDEX idx_prod_logs_workdate_product_shift;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_production_logs_date ON public.production_logs(date);
CREATE INDEX IF NOT EXISTS idx_production_logs_work_date ON public.production_logs(work_date);
CREATE INDEX IF NOT EXISTS idx_production_logs_line ON public.production_logs(line_name);

-- 5. BẢNG KẾ HOẠCH SẢN XUẤT THÁNG (MONTHLY PLAN)
CREATE TABLE IF NOT EXISTS public.monthly_plan (
    id TEXT PRIMARY KEY DEFAULT 'default_plan',
    month_key TEXT,                            -- YYYY-MM
    plan_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Cấu trúc { [yearMonth]: { [productId]: { [day]: qty } } }
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG MỤC TIÊU NĂNG SUẤT THÁNG (MONTHLY TARGETS)
CREATE TABLE IF NOT EXISTS public.monthly_targets (
    id TEXT PRIMARY KEY DEFAULT 'default_targets',
    targets_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Cấu trúc { "2026-6": 110, ... }
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BẢNG SỐ LIỆU TỔNG HỢP THEO THÁNG (MONTHLY METRICS 2025 / 2026)
CREATE TABLE IF NOT EXISTS public.monthly_metrics (
    id TEXT PRIMARY KEY,                       -- 'metrics_2025' hoặc 'metrics_2026'
    year INTEGER NOT NULL,
    metrics_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BẢNG BÁO CÁO HÀNG NGÀY CHI TIẾT (DAILY REPORTS)
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id TEXT PRIMARY KEY,                       -- 'gas_daily_reports' hoặc 'assembly_daily_reports'
    report_type TEXT NOT NULL,                 -- 'gas' hoặc 'assembly'
    report_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- CẤU HÌNH BẢO MẬT ROW LEVEL SECURITY (RLS)
-- Cho phép ứng dụng đọc / ghi dữ liệu qua Anon Key
-- ====================================================================

-- Bật RLS
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Tạo Policies cho phép toàn quyền truy cập (Dành cho phân xưởng nội bộ qua Anon Key)
CREATE POLICY "Cho phep doc ghi workers" ON public.workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phep doc ghi attendance" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phep doc ghi products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phep doc ghi production_logs" ON public.production_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phep doc ghi monthly_plan" ON public.monthly_plan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phep doc ghi monthly_targets" ON public.monthly_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phep doc ghi monthly_metrics" ON public.monthly_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cho phep doc ghi daily_reports" ON public.daily_reports FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- KÍCH HOẠT SUPABASE REALTIME (Tự động đồng bộ giữa các máy tính)
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.workers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_plan;
