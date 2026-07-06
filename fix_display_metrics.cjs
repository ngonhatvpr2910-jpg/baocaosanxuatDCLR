const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const replacement = `
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
      } else {
`;

// we need to replace the broken part from `      const workdays = Object.values(uniqueShiftWorkersMap).reduce((acc, val) => acc + val, 0);\n\n        const addedEqQty` to `      } else {`
code = code.replace(
  /const workdays = Object\.values\(uniqueShiftWorkersMap\)\.reduce\(\(acc, val\) => acc \+ val, 0\);\s+const addedEqQty[\s\S]*?\} else \{/,
  `const workdays = Object.values(uniqueShiftWorkersMap).reduce((acc, val) => acc + val, 0);\n${replacement}`
);

fs.writeFileSync('App.tsx', code);
