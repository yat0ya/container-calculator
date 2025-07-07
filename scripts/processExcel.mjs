// process.mjs
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load turbo algorithm
let turboAlgorithm;
try {
  const { turboAlgorithm: ta } = await import('../dist/turbo-algorithm.js');
  turboAlgorithm = ta;
  console.log('✅ Successfully imported turbo algorithm from compiled bundle');
} catch (e) {
  console.error('❌ Failed to import turbo algorithm:', e.message);
  console.error('💡 Make sure to run "npm run build-turbo" first to compile the turbo algorithm');
  process.exit(1);
}

function loadContainerData() {
  try {
    const p = join(process.cwd(), 'src/data/containers.json');
    console.log(`🔍 Looking for containers.json at: ${p}`);
    if (!existsSync(p)) throw new Error(`containers.json not found at: ${p}`);
    const cd = JSON.parse(readFileSync(p, 'utf8'));
    console.log('✅ Successfully loaded container data from containers.json');
    console.log('📐 Container dimensions kept in millimeters for turbo algorithm compatibility\n');
    const cont = {};
    cd.containers.forEach(c => (cont[c.id] = c));
    return cont;
  } catch (err) {
    console.error('❌ Error loading container data:', err.message);
    throw err;
  }
}

function calculateBoxesInContainer(boxData, container, qty) {
  try {
    console.log(`  Running turbo algorithm for ${container.id}...`);
    console.log(`  📦 Box: ${boxData.length}×${boxData.width}×${boxData.height}cm, Weight: ${boxData.weight}kg`);
    console.log(`  📦 Container: ${container.name} (${container.length}×${container.width}×${container.height}mm, Max: ${container.maxLoad}kg)`);
    console.log(`  📦 Quantity per MC: ${qty}`);
    const res = turboAlgorithm(boxData, container);

    let totalBoxes = res.totalBoxes;
    let isWeightRestricted = false;
    if (boxData.weight != null) {
      const totalWeight = res.totalBoxes * boxData.weight;
      if (totalWeight > container.maxLoad) {
        totalBoxes = Math.floor(container.maxLoad / boxData.weight);
        isWeightRestricted = true;
        console.log(`  ⚠️ Weight restriction applied: ${res.totalBoxes} → ${totalBoxes} boxes`);
      }
    }

    console.log(`  ✅ Turbo result: ${totalBoxes} boxes${isWeightRestricted ? ' (weight restricted)' : ''}`);
    console.log(`  ✅ Final result (×${qty}): ${totalBoxes * qty} total items`);

    return { totalBoxes: totalBoxes * qty, isWeightRestricted };
  } catch (err) {
    console.error(`  Error calculating for container ${container.id}:`, err.message);
    throw err;
  }
}

function getToyaTurboSimulationValue(containerType, k20Value, k40Value, k40HCValue) {
  // Handle K40HC_AND exception - return empty/null
  if (containerType === 'K40HC_AND') {
    return null;
  }
  
  // Map container types to their corresponding values
  switch (containerType) {
    case 'K20':
      return k20Value;
    case 'K40':
      return k40Value;
    case 'K40HC':
      return k40HCValue;
    default:
      return null;
  }
}

function calculatePercentageDifference(simulationValue, originalValue) {
  if (simulationValue === null || simulationValue === undefined || 
      originalValue === null || originalValue === undefined || originalValue === 0) {
    return null;
  }
  
  const difference = ((simulationValue - originalValue) / originalValue) * 100;
  return Math.round(difference * 100) / 100; // Round to 2 decimal places
}

function ensureOutputDirectory() {
  const dir = 'output';
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log('📁 Created output directory');
  }
  return dir;
}

async function processExcelFile() {
  try {
    console.log('📊 Starting Excel processing with Turbo Algorithm from turbo.ts...\n');

    const containers = loadContainerData();
    console.log('📦 Loaded containers:');
    Object.values(containers).forEach(c =>
      console.log(`  ${c.name}: ${(c.length/1000).toFixed(2)}m × ${(c.width/1000).toFixed(2)}m × ${(c.height/1000).toFixed(2)}m (${c.maxLoad}kg)`)
    );
    console.log('');

    const outputDir = ensureOutputDirectory();

    const excelPath = join(process.cwd(), 'src/data/source.xlsx');
    console.log('📖 Reading source.xlsx file...');
    console.log(`🔍 Looking for source.xlsx at: ${excelPath}`);
    if (!existsSync(excelPath)) throw new Error(`source.xlsx not found at: ${excelPath}`);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(excelPath);

    const ws = wb.getWorksheet(1);
    console.log(`✅ Successfully loaded sheet: "${ws.name}"`);

    // Setup header
    const header = ws.getRow(1);
    const baseCols = header.cellCount;
    ['Toya Turbo K20', 'Toya Turbo K40', 'Toya Turbo K40HC', 'Toya Turbo ilość zamówienia', 'Różnica [%]']
      .forEach((h, idx) => {
        const c = header.getCell(baseCols + 1 + idx);
        c.value = h;
        c.font = { bold: true };
      });
    header.commit();

    const redCells = [];
    const startRow = 2;
    const endRow = ws.actualRowCount;
    const totalRows = endRow - startRow + 1;
    console.log(`📋 Processing rows ${startRow} to ${endRow} (${totalRows} rows total)\n`);

    const startTime = Date.now();
    let processed = 0;

    // Custom number format
    const numFmt = '_-* # ##0_-;-* # ##0_-;_-* "-"??_-;_-@_-';

    for (let r = startRow; r <= endRow; r++) {
    // for (let r = 5; r <= 9; r++) {
      processed++;
      const row = ws.getRow(r);
      const vals = row.values;
      const len = Number(vals[10]), wid = Number(vals[11]);
      const hei = Number(vals[12]), wgt = Number(vals[13]), qty = Number(vals[14]);
      const containerType = vals[3]; // Column C
      const originalValue = Number(vals[4]); // Column D

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const remaining = processed > 1
        ? `${Math.round((elapsed / (processed - 1)) * (totalRows - processed))}s`
        : 'calculating...';

      console.log(`📍 Row ${processed}/${totalRows} (Excel row ${r}), time passed: ${elapsed}s, remaining: ${remaining}`);
      console.log(`  Reading: J${r}=${len}, K${r}=${wid}, L${r}=${hei}, M${r}=${wgt}, N${r}=${qty}`);
      console.log(`  Container type (C${r}): ${containerType}, Original value (D${r}): ${originalValue}`);

      if ([len, wid, hei, wgt, qty].some(n => isNaN(n)) || qty <= 0 || len < 10 || wid < 10 || hei < 10) {
        console.log('  ❌ Invalid or too small data – skipping\n');
        continue;
      }

      console.log(`  ✅ Valid data extracted: ${len}×${wid}×${hei}cm, weight ${wgt}kg, qty ${qty}`);
      const box = { length: len, width: wid, height: hei, weight: wgt };

      const results = [
        calculateBoxesInContainer(box, containers.K20, qty),
        calculateBoxesInContainer(box, containers.K40, qty),
        calculateBoxesInContainer(box, containers.K40HC, qty),
      ];

      // Set the turbo algorithm results (columns O, P, Q)
      results.forEach((res, idx) => {
        const cell = row.getCell(baseCols + 1 + idx);

        // 🔁 Step 1: Fully clear any inherited styles
        cell.style = {}; // clears font, fill, border, alignment, etc.

        // 🔧 Step 2: Set value and number format
        cell.value = res.totalBoxes;
        cell.numFmt = numFmt;

        // 🎯 Step 3: Apply bold red font only to restricted cells
        if (res.isWeightRestricted) {
          cell.font = { bold: true, color: { argb: 'FFFF0000' } };
          console.log(`  🔴 Marked weight-restricted at ${cell.address}`);
        }
      });

      // Calculate and set 'Toya Turbo ilość zamówienia' value (column R)
      const simulationValue = getToyaTurboSimulationValue(
        containerType,
        results[0].totalBoxes, // K20
        results[1].totalBoxes, // K40
        results[2].totalBoxes  // K40HC
      );
      
      const simulationCell = row.getCell(baseCols + 4); // Column R
      simulationCell.style = {};
      if (simulationValue !== null) {
        simulationCell.value = simulationValue;
        simulationCell.numFmt = numFmt;
        console.log(`  📊 Simulation value for ${containerType}: ${simulationValue}`);
      } else {
        simulationCell.value = '';
        console.log(`  📊 Simulation value for ${containerType}: empty (exception or unknown type)`);
      }

      // Calculate and set percentage difference (column S)
      const percentageDiff = calculatePercentageDifference(simulationValue, originalValue);
      const diffCell = row.getCell(baseCols + 5); // Column S
      diffCell.style = {};
      
      if (percentageDiff !== null) {
        diffCell.value = `${percentageDiff > 0 ? '+' : ''}${percentageDiff}%`;
        
        // Color coding: green if simulation is higher, red if lower
        if (percentageDiff > 0) {
          diffCell.font = { color: { argb: 'FF008000' } }; // Green
          console.log(`  📈 Difference: +${percentageDiff}% (higher - green)`);
        } else if (percentageDiff < 0) {
          diffCell.font = { color: { argb: 'FFFF0000' } }; // Red
          console.log(`  📉 Difference: ${percentageDiff}% (lower - red)`);
        } else {
          console.log(`  📊 Difference: ${percentageDiff}% (equal)`);
        }
      } else {
        diffCell.value = '';
        console.log(`  📊 Difference: empty (no simulation value or invalid original value)`);
      }


      row.commit();
      console.log('');
    }

    const outPath = join(outputDir, 'turbo-results.xlsx');
    await wb.xlsx.writeFile(outPath);

    console.log('✅ Successfully created turbo-results.xlsx');
    console.log(`📁 File saved to: ${outPath}`);
    console.log(`⏱️ Completed in ${Math.round((Date.now() - startTime)/1000)}s for ${processed} rows`);

  } catch (err) {
    console.error('❌ Error processing Excel file:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

processExcelFile();
