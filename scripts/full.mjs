// full.mjs
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load turbo algorithm
let turboAlgorithm;
try {
  const { turboAlgorithm: ta } = await import('../dist/turbo-algorithm.js');
  turboAlgorithm = ta;
  console.log('✅ Loaded turbo algorithm');
} catch (e) {
  console.error('❌ Failed to import turbo algorithm:', e.message);
  process.exit(1);
}

// Load container data
function loadContainerData() {
  const filePath = join(process.cwd(), 'src/data/containers.json');
  if (!existsSync(filePath)) throw new Error(`containers.json not found at ${filePath}`);
  const json = JSON.parse(readFileSync(filePath, 'utf8'));
  const containers = {};
  json.containers.forEach(c => (containers[c.id] = c));
  return containers;
}

// Run turbo calculation for one container
function calculateBoxesInContainer(box, container, qty) {
  const res = turboAlgorithm(box, container);
  let totalBoxes = res.totalBoxes;
  let isWeightRestricted = false;

  if (box.weight != null) {
    const totalWeight = totalBoxes * box.weight;
    if (totalWeight > container.maxLoad) {
      totalBoxes = Math.floor(container.maxLoad / box.weight);
      isWeightRestricted = true;
    }
  }

  return { totalBoxes: totalBoxes * qty, isWeightRestricted };
}

// Edge case detector
function isFlatBox(box) {
  const dims = [box.length, box.width, box.height].sort((a, b) => a - b);
  const [min, , max] = dims;
  return min / max < 0.1;
}

// Ensure output dir
function ensureOutputDirectory() {
  const dir = 'output';
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log('📁 Created output directory');
  }
  return dir;
}

// Determine whether to snapshot at a row
function shouldSnapshotAtRow(row) {
  const early = [5, 10, 20, 50, 100, 200, 500, 1000];
  return early.includes(row) || row % 1000 === 0;
}

// Main processor
async function processRows() {
  const containers = loadContainerData();
  const outputDir = ensureOutputDirectory();

  const sourcePath = join(process.cwd(), 'src/data/source2.xlsx');
  if (!existsSync(sourcePath)) throw new Error(`source2.xlsx not found at: ${sourcePath}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(sourcePath);
  const ws = workbook.getWorksheet(1);
  console.log(`✅ Loaded worksheet: ${ws.name}`);

  const colMap = { K20: 19, K40: 21, K40HC: 23 };
  const flagMap = { K20: 20, K40: 22, K40HC: 24 };
  const numFmt = '_-* # ##0_-;-* # ##0_-;_-* "-"??_-;_-@_-';
  const parse = v => Number(String(v).replace(',', '.'));

  let processedCount = 0;

  const startRow = 2;
  const endRow = ws.rowCount;
  const totalRows = endRow - startRow + 1;
  const startTime = Date.now();

  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    const vals = row.values;

    const qty = parse(vals[5]);
    const height = parse(vals[6]);
    const width = parse(vals[7]);
    const length = parse(vals[8]);
    const weight = parse(vals[10]);

    if ([qty, height, width, length, weight].some(n => isNaN(n) || n <= 0)) {
      console.log(`❌ Row ${r}: Invalid or incomplete box data – skipping.`);
      continue;
    }

    const box = { length, width, height, weight };

    // Edge case logging (once per row)
    const volumeDm3 = (length * width * height) / 1000;
    if (volumeDm3 <= 10 && !isFlatBox(box)) {
      console.log('📦 VERY SMALL box detected');
    } else if (isFlatBox(box) || volumeDm3 <= 20) {
      console.log('📏 SMALL/FLAT/LONG box detected');
    }

    const item = vals[2]; // Column B
    console.log(`📍 Processing Row ${r}: ${item}, ${length}×${width}×${height} cm, ${weight} kg, qty: ${qty}`);

    const results = {
      K20:   calculateBoxesInContainer(box, containers.K20, qty),
      K40:   calculateBoxesInContainer(box, containers.K40, qty),
      K40HC: calculateBoxesInContainer(box, containers.K40HC, qty)
    };

    for (const [key, { totalBoxes, isWeightRestricted }] of Object.entries(results)) {
      const capCol = colMap[key];
      const flagCol = flagMap[key];

      row.getCell(capCol).value = totalBoxes;
      row.getCell(capCol).numFmt = numFmt;
      row.getCell(flagCol).value = isWeightRestricted ? 'W' : 'O';
    }

    const candidateKeys = ['K20', 'K40', 'K40HC'];
    const unrestricted = candidateKeys
      .filter(k => results[k] && !results[k].isWeightRestricted)
      .sort((a, b) => results[b].totalBoxes - results[a].totalBoxes);

    const bestContainer = unrestricted[0] || 'K20';
    row.getCell(27).value = bestContainer;
    row.getCell(28).value = results[bestContainer].isWeightRestricted ? 'WAGA' : 'OBJĘTOŚĆ';

    const baseResult = turboAlgorithm(box, containers[bestContainer]);
    const rawBoxes = baseResult?.totalBoxes || 0;

    const boxInMeters = {
      length: length / 100,
      width: width / 100,
      height: height / 100
    };
    const boxVolumeM3 = boxInMeters.length * boxInMeters.width * boxInMeters.height;
    const totalBoxVolume = boxVolumeM3 * rawBoxes;
    const containerVolume = containers[bestContainer]?.volume ?? 1;
    const utilization = containerVolume > 0 ? (totalBoxVolume / containerVolume) * 100 : 0;

    row.getCell(29).value = Math.round(utilization * 10) / 10;
    row.getCell(29).numFmt = '0.0';

    row.commit();
    processedCount++;

    // 💾 Snapshot checkpoint at specific rows
    if (shouldSnapshotAtRow(r)) {
      const checkpointPath = join(outputDir, `checkpoint_${r}.xlsx`);
      await workbook.xlsx.writeFile(checkpointPath);
      console.log(`💾 Checkpoint snapshot saved: ${checkpointPath}`);
    }

    // ⏱ Log progress
    if (processedCount % 10 === 0) {
      const elapsedMs = Date.now() - startTime;
      const avgTimePerRow = elapsedMs / processedCount;
      const remainingRows = totalRows - processedCount;
      const remainingMs = avgTimePerRow * remainingRows;

      const formatTime = ms => {
        const sec = Math.floor(ms / 1000);
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
      };

      console.log(`⏱ Elapsed: ${formatTime(elapsedMs)} | Estimated Remaining: ${formatTime(remainingMs)}`);
    }
  }

  // ✅ Final full output
  const outPath = join(outputDir, 'full.xlsx');
  const tempPath = outPath + '.tmp';
  await workbook.xlsx.writeFile(tempPath);
  writeFileSync(join(outputDir, 'last_row.txt'), String(endRow));
  await fs.promises.rename(tempPath, outPath);
  console.log(`✅ Final output saved to: ${outPath}`);
}

processRows().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
