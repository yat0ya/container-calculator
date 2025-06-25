import { BoxDimensions, Container, CalculationResult } from '../types';
import { convertToMeters, generateOrientations } from '../utils';

import { sortLinesVertically } from './turboHelpers/sortLinesVertically';
import { removeOverlappingBoxes } from './turboHelpers/removeOverlappingBoxes';
import { buildWall } from './turboHelpers/buildWall';
import { repeatPattern } from './turboHelpers/repeatPattern';
import { prepareTailArea } from './turboHelpers/prepareTailArea';
import { fillTailArea } from './turboHelpers/fillTailArea';
import { snapBoxesTightly } from './turboHelpers/snapBoxesTightly';
import { alignBoxesAnalytically } from './turboHelpers/alignBoxesAnalitically';
import { patchSmallGaps } from './turboHelpers/patchSmallGaps';
import { finalInsertionSweep } from './turboHelpers/finalInsertionSweep';
import { addAnalyticalLayers } from './turboHelpers/analyticalLayering';

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  console.log('🚀 Starting Turbo Algorithm');
  
  // ─── Stage 1: Preprocessing ──────────────────────────────
  const boxInMeters = convertToMeters(box);
  const orientations = generateOrientations(boxInMeters);
  console.log('📦 Box dimensions (m):', boxInMeters);
  console.log('🔄 Available orientations:', orientations.length);

  // ─── Stage 2: Build Initial Wall ─────────────────────────
  const initialWall = buildWall(container, orientations);
  console.log('🧱 Initial wall:', initialWall.length, 'boxes');

  // ─── Stage 3: Repeat Wall Along Container ────────────────
  const repeated = repeatPattern(initialWall, container);
  console.log('🔁 After repeat pattern:', repeated.length, 'boxes');

  // ─── Stage 4: Vertical Sorting for Layering ──────────────
  const sortedVertically = sortLinesVertically(repeated);
  console.log('📊 After vertical sorting:', sortedVertically.length, 'boxes');

  // ─── Stage 5: Fill Tail Area ─────────────────────────────
  const sortedPlacements = [...sortedVertically].sort((a, b) =>
    (a.position.x + a.rotation[0]) - (b.position.x + b.rotation[0])
  );
  const tailArea = prepareTailArea(sortedPlacements, container);
  const filledTail = fillTailArea(tailArea, container, orientations);
  console.log('🎯 After tail fill:', filledTail.length, 'boxes');

  // ─── Stage 6: Post-placement Compaction ──────────────────
  const allPlacements = [...sortedVertically, ...filledTail];
  console.log('📦 Before compaction:', allPlacements.length, 'boxes');
  
  snapBoxesTightly(allPlacements);
  alignBoxesAnalytically(allPlacements);
  console.log('🔧 After compaction:', allPlacements.length, 'boxes');

  // ─── Stage 7: Analytical Layering ────────────────────────
  const analyticalLayers = addAnalyticalLayers(allPlacements, container, orientations);
  allPlacements.push(...analyticalLayers);
  console.log('🎯 After analytical layering:', allPlacements.length, 'boxes (added', analyticalLayers.length, ')');

  // ─── Stage 8: Patch Small Gaps ───────────────────────────
  const patched = patchSmallGaps(allPlacements, container, orientations);
  allPlacements.push(...patched);
  console.log('🩹 After patching:', allPlacements.length, 'boxes (added', patched.length, ')');

  // ─── Stage 9: Final Insertion Sweep ──────────────────────
  const finalInserted = finalInsertionSweep(allPlacements, container, orientations);
  allPlacements.push(...finalInserted);
  console.log('🧹 After final sweep:', allPlacements.length, 'boxes (added', finalInserted.length, ')');

  // ─── Stage 10: Final Compaction ──────────────────────────
  snapBoxesTightly(allPlacements);
  alignBoxesAnalytically(allPlacements);

  // ─── Stage 11: Final Validation ──────────────────────────
  const validPlacements = removeOverlappingBoxes(allPlacements);
  console.log('✅ Final result:', validPlacements.length, 'boxes (removed', allPlacements.length - validPlacements.length, 'overlapping)');

  return {
    totalBoxes: validPlacements.length,
    placements: validPlacements,
    boxInMeters
  };
}