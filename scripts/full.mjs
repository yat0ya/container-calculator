import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs, { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { Worker } from 'worker_threads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load turbo algorithm fallback (not used directly, used in workers)
let turboAlgorithm;
try {
  const { turboAlgorithm: ta } = await import('../dist/turbo-algorithm.js');
  turboAlgorithm = ta;
  console.log('✅ Loaded turbo algorithm');
} catch (e) {
  console.error('❌ Failed to import turbo algorithm:', e.message);
  process.exit(1);
}

// Run turboAlgorithm in a worker thread
function runTurboInWorker(box, container) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(join(__dirname, './worker.mjs'), {
      type: 'module',
      workerData: { box, container }
    });

    worker.on('message', result => {
      if (result?.error) reject(new Error(result.error));
      else resolve(result);
    });

    worker.on('error', reject);
    worker.on('exit', code => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    });
  });
}

// Load container data from JSON
function loadContainerData() {
  const filePath = join(process.cwd(), 'src/data/containers.json');
  if (!existsSync(filePath)) throw new Error(`containers.json not found at ${filePath}`);
  const json = JSON.parse(readFileSync(filePath, 'utf8'));
  const containers = {};
  json.containers.forEach(c => (containers[c.id] = c));
  return containers;
}

// Calculate packing result with worker + weight check
async function calculateBoxesInContainer(box, container, qty, cache) {
  const key = `${box.length}-${box.width}-${box.height}-${box.weight}-${container.id}`;
  let res = cache.get(key);
  if (!res) {
    res = await runTurboInWorker(box, container);
    cache.set(key, res);
  }

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

// Ensure output dir exists
function ensureOutputDirectory() {
  const dir = 'output';
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log('📁 Created output directory');
  }
  return dir;
}

// Snapshot logic
function shouldSnapshotAtRow(row) {
  const early = [6050, 6100, 6200, 6500, 7000];
  return early.includes(row) || row % 1000 === 0;
}

// Main runner
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
  const cache = new Map();
  const startRow = 2;
  const endRow = ws.rowCount;
  const totalRows = endRow - startRow + 1;
  const startTime = Date.now();
  const pendingSnapshots = [];

  const BATCH_SIZE = Math.min(8, totalRows);

  for (let r = startRow; r <= endRow; r += BATCH_SIZE) {
    const calcTasks = [];

    for (let i = 0; i < BATCH_SIZE && r + i <= endRow; i++) {
      const rowNum = r + i;
      const row = ws.getRow(rowNum);
      const vals = row.values;

      const qty = parse(vals[5]);
      const height = parse(vals[6]);
      const width = parse(vals[7]);
      const length = parse(vals[8]);
      const weight = parse(vals[10]);

      if ([qty, height, width, length, weight].some(n => isNaN(n) || n <= 0)) {
        console.log(`❌ Row ${rowNum}: Invalid or incomplete box data – skipping.`);
        continue;
      }

      const box = { length, width, height, weight };
      console.log(`📍 Processing Row ${rowNum}: ${length}×${width}×${height} cm, ${weight} kg, qty: ${qty}`);

      calcTasks.push(
        (async () => {
          const results = {
            K20: await calculateBoxesInContainer(box, containers.K20, qty, cache),
            K40: await calculateBoxesInContainer(box, containers.K40, qty, cache),
            K40HC: await calculateBoxesInContainer(box, containers.K40HC, qty, cache)
          };

          const candidateKeys = ['K20', 'K40', 'K40HC'];
          const unrestricted = candidateKeys
            .filter(k => results[k] && !results[k].isWeightRestricted)
            .sort((a, b) => results[b].totalBoxes - results[a].totalBoxes);

          const bestContainer = unrestricted[0] || 'K20';
          const rawBoxes = results[bestContainer].totalBoxes / qty;
          const boxInMeters = {
            length: length / 100,
            width: width / 100,
            height: height / 100
          };
          const boxVolumeM3 = boxInMeters.length * boxInMeters.width * boxInMeters.height;
          const totalBoxVolume = boxVolumeM3 * rawBoxes;
          const containerVolume = containers[bestContainer]?.volume ?? 1;
          const utilization = containerVolume > 0 ? (totalBoxVolume / containerVolume) * 100 : 0;

          return {
            rowNum,
            results,
            bestContainer,
            reason: results[bestContainer].isWeightRestricted ? 'WAGA' : 'OBJĘTOŚĆ',
            utilization: Math.round(utilization * 10) / 10
          };
        })()
      );
    }

    const rowResults = await Promise.all(calcTasks);

    for (const result of rowResults) {
      const row = ws.getRow(result.rowNum);
      const { results, bestContainer, reason, utilization } = result;

      for (const key of Object.keys(results)) {
        const { totalBoxes, isWeightRestricted } = results[key];
        const capCol = colMap[key];
        const flagCol = flagMap[key];

        const capCell = row.getCell(capCol);
        if (capCell.value !== totalBoxes) capCell.value = totalBoxes;
        capCell.numFmt = numFmt;

        const flag = isWeightRestricted ? 'W' : 'O';
        const flagCell = row.getCell(flagCol);
        if (flagCell.value !== flag) flagCell.value = flag;
      }

      row.getCell(27).value = bestContainer;
      row.getCell(28).value = reason;
      row.getCell(29).value = utilization;
      row.getCell(29).numFmt = '0.0';

      processedCount++;

      if (shouldSnapshotAtRow(result.rowNum)) {
        const checkpointPath = join(outputDir, `checkpoint_${result.rowNum}.xlsx`);
        const snapshotPromise = workbook.xlsx.writeFile(checkpointPath).then(() => {
          console.log(`💾 Checkpoint snapshot saved: ${checkpointPath}`);
        });
        pendingSnapshots.push(snapshotPromise);
      }
    }

    const now = Date.now();
    const timeSinceLast = now - (global.lastLogTime || 0);
    if (processedCount === totalRows || timeSinceLast > 10000) {
      global.lastLogTime = now;
      const elapsedMs = now - startTime;
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

  // Wait for all snapshot saves to finish
  await Promise.all(pendingSnapshots);

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
