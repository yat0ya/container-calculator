// full.mjs
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

// Ensure output dir
function ensureOutputDirectory() {
  const dir = 'output';
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log('📁 Created output directory');
  }
  return dir;
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

  const colMap = { K20: 19, K40: 21, K40HC: 23, K45HC: 25 };
  const flagMap = { K20: 20, K40: 22, K40HC: 24, K45HC: 26 };
  const numFmt = '_-* # ##0_-;-* # ##0_-;_-* "-"??_-;_-@_-';
  const parse = v => Number(String(v).replace(',', '.'));

  for (let r = 6; r <= 10; r++) {
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
    console.log(`📍 Row ${r}`);
    console.log(`📦 Box: ${length}×${width}×${height} cm, ${weight} kg, qty: ${qty}`);

    const results = {
      K20:    calculateBoxesInContainer(box, containers.K20, qty),
      K40:    calculateBoxesInContainer(box, containers.K40, qty),
      K40HC:  calculateBoxesInContainer(box, containers.K40HC, qty),
      K45HC:  calculateBoxesInContainer(box, containers.K45HC, qty)
    };

    for (const [key, { totalBoxes, isWeightRestricted }] of Object.entries(results)) {
      const capCol = colMap[key];
      const flagCol = flagMap[key];

      const capCell = row.getCell(capCol);
      capCell.value = totalBoxes;
      capCell.numFmt = numFmt;

      const flagCell = row.getCell(flagCol);
      flagCell.value = isWeightRestricted ? 'W' : 'O';
    }

    // Best unrestricted container (excluding K45HC)
    const candidateKeys = ['K20', 'K40', 'K40HC'];
    const unrestricted = candidateKeys
      .filter(k => results[k] && !results[k].isWeightRestricted)
      .sort((a, b) => results[b].totalBoxes - results[a].totalBoxes);

    const bestContainer = unrestricted[0] || 'K20';

    const aaCell = row.getCell(27); // AA
    aaCell.value = bestContainer;

    const abCell = row.getCell(28); // AB
    abCell.value = results[bestContainer].isWeightRestricted ? 'W' : 'O';

    // Volume utilization % in AC (29), use raw result before qty multiplication
    const rawResult = turboAlgorithm(box, containers[bestContainer]);
    const rawBoxes = rawResult?.totalBoxes || 0;

    const boxInMeters = {
      length: length / 100,
      width: width / 100,
      height: height / 100
    };

    const boxVolumeM3 = boxInMeters.length * boxInMeters.width * boxInMeters.height;
    const totalBoxVolume = boxVolumeM3 * rawBoxes;
    const containerVolume = containers[bestContainer]?.volume ?? 1;
    const utilization = containerVolume > 0 ? (totalBoxVolume / containerVolume) * 100 : 0;

    const acCell = row.getCell(29); // AC
    acCell.value = Math.round(utilization * 10) / 10;
    acCell.numFmt = '0.0';

    row.commit();
  }

  const outPath = join(outputDir, 'full.xlsx');
  await workbook.xlsx.writeFile(outPath);
  console.log(`✅ Saved to: ${outPath}`);
}

processRows().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
