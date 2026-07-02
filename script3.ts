import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/"sunhouse_metrics_2025"/g, '"sunhouse_metrics_2025_v2"');
content = content.replace(/"sunhouse_metrics_2026"/g, '"sunhouse_metrics_2026_v2"');
content = content.replace(/"sunhouse_gas_daily_reports"/g, '"sunhouse_gas_daily_reports_v2"');
content = content.replace(/"sunhouse_assembly_daily_reports"/g, '"sunhouse_assembly_daily_reports_v2"');
content = content.replace(/"sunhouse_products"/g, '"sunhouse_products_v2"');
content = content.replace(/"sunhouse_monthly_plan"/g, '"sunhouse_monthly_plan_v2"');

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('done replacing keys');
