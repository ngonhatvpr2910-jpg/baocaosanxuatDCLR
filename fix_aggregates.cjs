const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  /return \{\n      totalActualQty,\n      totalEqQty,\n      totalPlanQty,\n      totalRemainingQty,\n      totalActualQtyRO,\n      totalEqQtyRO,\n      totalPlanQtyRO,\n      totalRemainingQtyRO,\n      totalActualQtyRMA,\n      totalEqQtyRMA,\n      totalPlanQtyRMA,\n      totalRemainingQtyRMA,\n      totalActualQtyBG,\n      totalEqQtyBG,\n      totalPlanQtyBG,\n      totalRemainingQtyBG,\n      totalRevenue\n    \};/g,
  `return {
      totalActualQty: totalActualQty || 0,
      totalEqQty: totalEqQty || 0,
      totalPlanQty: totalPlanQty || 0,
      totalRemainingQty: totalRemainingQty || 0,
      totalActualQtyRO: totalActualQtyRO || 0,
      totalEqQtyRO: totalEqQtyRO || 0,
      totalPlanQtyRO: totalPlanQtyRO || 0,
      totalRemainingQtyRO: totalRemainingQtyRO || 0,
      totalActualQtyRMA: totalActualQtyRMA || 0,
      totalEqQtyRMA: totalEqQtyRMA || 0,
      totalPlanQtyRMA: totalPlanQtyRMA || 0,
      totalRemainingQtyRMA: totalRemainingQtyRMA || 0,
      totalActualQtyBG: totalActualQtyBG || 0,
      totalEqQtyBG: totalEqQtyBG || 0,
      totalPlanQtyBG: totalPlanQtyBG || 0,
      totalRemainingQtyBG: totalRemainingQtyBG || 0,
      totalRevenue: totalRevenue || 0
    };`
);

fs.writeFileSync('App.tsx', code);
