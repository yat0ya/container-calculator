import { BoxDimensions, Container, CalculationResult } from './turboHelpers/types';
import { convertToMillimeters, generateOrientations } from './turboHelpers/utils';

import { sortLinesVertically } from './turboHelpers/sortLinesVertically';
import { removeOverlappingBoxes } from './turboHelpers/removeOverlappingBoxes';
import { buildWall } from './turboHelpers/buildWall';
import { repeatPattern } from './turboHelpers/repeatPattern';
import { prepareTailArea } from './turboHelpers/prepareTailArea';
import { fillTailArea } from './turboHelpers/fillTailArea';
import { snapBoxesTightly } from './turboHelpers/snapBoxesTightly';
import { alignBoxesAnalytically } from './turboHelpers/alignBoxesAnalytically';
import { patchSmallGaps } from './turboHelpers/patchSmallGaps';
import { finalInsertionSweep } from './turboHelpers/finalInsertionSweep';
import { addAnalyticalLayers } from './turboHelpers/analyticalLayering';

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  console.log('🚀 Starting Turbo Algorithm');

  const start = performance.now();
  let prev = start;

  const logTime = (label: string) => {
    const now = performance.now();
    const duration = Math.round(now - prev);
    console.log(`⏱️ ${label}: ${duration} ms`);
    prev = now;
  };

  // ─── Stage 1: Preprocessing ──────────────────────────────
  const boxInMillimeters = convertToMillimeters(box);
  const orientations = generateOrientations(boxInMillimeters);
  console.log('📦 Box in mm:', boxInMillimeters);
  console.log('🔄 Orientations:', orientations); 
  console.log('🔄 Available orientations:', orientations.length);
  logTime('Stage 1: Preprocessing');

  // ─── Stage 2: Build Initial Wall ─────────────────────────
  console.log('📦 Container (mm):', container);
  const initialWall = buildWall(container, orientations);
  console.log('🧱 Initial wall:', initialWall.length, 'boxes');
  logTime('Stage 2: Build Initial Wall');

  // ─── Stage 3: Repeat Wall Along Container ────────────────
  const repeated = repeatPattern(initialWall, container);
  console.log('🔁 After repeat pattern:', repeated.length, 'boxes');
  logTime('Stage 3: Repeat Wall Along Container');

  // ─── Stage 4: Vertical Sorting for Layering ──────────────
  const sortedVertically = sortLinesVertically(repeated);
  // console.log('📊 After vertical sorting:', sortedVertically.length, 'boxes');
  logTime('Stage 4: Vertical Sorting for Layering');

  // ─── Stage 5: Fill Tail Area ─────────────────────────────
  const sortedPlacements = [...sortedVertically].sort((a, b) =>
    (a.position.x + a.rotation[0]) - (b.position.x + b.rotation[0])
  );
  const tailArea = prepareTailArea(sortedPlacements, container);
  const filledTail = fillTailArea(tailArea, container, orientations);
  // console.log('🎯 After tail fill:', filledTail.length, 'boxes');
  logTime('Stage 5: Fill Tail Area');

  // ─── Stage 6: Post-placement Compaction ──────────────────
  const allPlacements = [...sortedVertically, ...filledTail];
  // console.log('📦 Before compaction:', allPlacements.length, 'boxes');
  snapBoxesTightly(allPlacements);
  alignBoxesAnalytically(allPlacements);
  // console.log('🔧 After compaction:', allPlacements.length, 'boxes');
  logTime('Stage 6: Post-placement Compaction');

  // ─── Stage 7: Analytical Layering ────────────────────────
  const analyticalLayers = addAnalyticalLayers(allPlacements, container);
  allPlacements.push(...analyticalLayers);
  // console.log('🎯 After analytical layering:', allPlacements.length, 'boxes (added', analyticalLayers.length, ')');
  logTime('Stage 7: Analytical Layering');

  // ─── Stage 8: Patch Small Gaps ───────────────────────────
  const patched = patchSmallGaps(allPlacements, container, orientations);
  allPlacements.push(...patched);
  // console.log('🩹 After patching:', allPlacements.length, 'boxes (added', patched.length, ')');
  logTime('Stage 8: Patch Small Gaps');

  // ─── Stage 9: Final Insertion Sweep ──────────────────────
  const finalInserted = finalInsertionSweep(allPlacements, container, orientations);
  allPlacements.push(...finalInserted);
  // console.log('🧹 After final sweep:', allPlacements.length, 'boxes (added', finalInserted.length, ')');
  logTime('Stage 9: Final Insertion Sweep');

  // ─── Stage 10: Final Compaction ──────────────────────────
  snapBoxesTightly(allPlacements);
  alignBoxesAnalytically(allPlacements);
  logTime('Stage 10: Final Compaction');

  // ─── Stage 11: Final Validation ──────────────────────────
  const validPlacements = removeOverlappingBoxes(allPlacements);
  // console.log('✅ Final result:', validPlacements.length, 'boxes (removed', allPlacements.length - validPlacements.length, 'overlapping)');
  logTime('Stage 11: Final Validation');

  const totalDuration = Math.round(performance.now() - start);
  console.log(`🏁 Total time: ${totalDuration} ms`);

  return {
    totalBoxes: validPlacements.length,
    placements: validPlacements,
    boxInMeters: {
      length: box.length / 10,
      width: box.width / 10,
      height: box.height / 10,
      weight: box.weight,
      value: box.value
    }
  };
}
