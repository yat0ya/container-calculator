import { readFile, writeFile, utils } from 'xlsx';
import { recursiveAlgorithm } from '../src/algorithms/recursive.js';

// Container definitions (in meters)
const containers = {
  K20: {
    length: 5.758,
    width: 2.352,
    height: 2.385,
    maxLoad: 28200,
  },
  K40: {
    length: 12.032,
    width: 2.352,
    height: 2.385,
    maxLoad: 26600,
  },
  K40HC: {
    length: 12.117,
    width: 2.388,
    height: 2.694,
    maxLoad: 29600,
  },
};

function calculateBoxesInContainer(row, container) {
  const boxDimensions = {
    length: parseFloat(row['Długość MC (cm)']),
    width: parseFloat(row['Szerokość MC (cm)']),
    height: parseFloat(row['Wysokość MC (cm)']),
    weight: parseFloat(row['Waga brutto MC (kg)']),
  };

  const result = recursiveAlgorithm(boxDimensions, container);
  return result.totalBoxes * parseInt(row['Ilość w MC']);
}

// Read the source file
const workbook = readFile('data/source.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = utils.sheet_to_json(worksheet);

// Process each row
const processedData = data.map(row => {
  const toyaK20 = calculateBoxesInContainer(row, containers.K20);
  const toyaK40 = calculateBoxesInContainer(row, containers.K40);
  const toyaK40HC = calculateBoxesInContainer(row, containers.K40HC);

  // Calculate differences
  const diffK20 = Math.abs(toyaK20 - row['Estymowane ilości w K20']) / row['Estymowane ilości w K20'];
  const diffK40 = Math.abs(toyaK40 - row['Estymowane ilości w K40']) / row['Estymowane ilości w K40'];
  const diffK40HC = Math.abs(toyaK40HC - row['Estymowane ilości w K40HC']) / row['Estymowane ilości w K40HC'];

  return {
    ...row,
    'Estymowane ilości (TOYA PLUGGER) w K20': toyaK20,
    'Estymowane ilości (TOYA PLUGGER) w K40': toyaK40,
    'Estymowane ilości (TOYA PLUGGER) w K40HC': toyaK40HC,
    '_diffK20': diffK20 > 0.1,
    '_diffK40': diffK40 > 0.1,
    '_diffK40HC': diffK40HC > 0.1,
  };
});

// Create a new workbook
const newWorkbook = utils.book_new();
const newWorksheet = utils.json_to_sheet(processedData);

// Add red background to cells with >10% difference
const redFill = { fgColor: { rgb: "FFFF0000" } };
processedData.forEach((row, index) => {
  if (row._diffK20) {
    newWorksheet[utils.encode_cell({ r: index + 1, c: utils.decode_range(newWorksheet['!ref']).e.c - 2 })].s = { fill: redFill };
  }
  if (row._diffK40) {
    newWorksheet[utils.encode_cell({ r: index + 1, c: utils.decode_range(newWorksheet['!ref']).e.c - 1 })].s = { fill: redFill };
  }
  if (row._diffK40HC) {
    newWorksheet[utils.encode_cell({ r: index + 1, c: utils.decode_range(newWorksheet['!ref']).e.c })].s = { fill: redFill };
  }
});

// Remove helper columns
processedData.forEach(row => {
  delete row._diffK20;
  delete row._diffK40;
  delete row._diffK40HC;
});

utils.book_append_sheet(newWorkbook, newWorksheet, "Results");
writeFile(newWorkbook, 'result.xlsx');