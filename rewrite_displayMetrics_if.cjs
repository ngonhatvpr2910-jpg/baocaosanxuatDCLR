const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const lines = code.split('\n');

const correctBlock = `      const workdays = Object.values(uniqueShiftWorkersMap).reduce((acc, val) => acc + val, 0);

      if (filterDivision === "ALL") {
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
      } else {`;

// Replace lines 1675 to 1698 (0-indexed 1674 to 1697)
lines.splice(1674, 24, correctBlock);

fs.writeFileSync('App.tsx', lines.join('\n'));
