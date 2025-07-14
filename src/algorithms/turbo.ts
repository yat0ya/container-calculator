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
import { sortForTailArea } from './turboHelpers/utils';
import { cleanOutOfBoundsBoxes } from './turboHelpers/validation';
import { handleEdgeCases } from './turboHelpers/handleEdgeCases';

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  const start = performance.now();
  let prev = start;
  const timings: { stage: string; time: number; newBoxes: number }[] = [];
  let previousBoxCount = 0;

  const logStage = (stage: string, currentPlacements: number) => {
    const now = performance.now();
    const time = Math.round(now - prev);
    const newBoxes = currentPlacements - previousBoxCount;
    timings.push({ stage, time, newBoxes });
    previousBoxCount = currentPlacements;
    prev = now;
  };

  // ─── Stage 1: Preprocessing ──────────────────────────────
  const boxInMillimeters = convertToMillimeters(box);
  const orientations = generateOrientations(boxInMillimeters, container);
  logStage('Stage 1: Preprocessing', 0);

  // ─── Stage 1.5: Handle Edge Cases ─────────────────────────
  const earlyExit = handleEdgeCases(boxInMillimeters, container);
  if (earlyExit) {
    logStage('Stage 1.5: Handle Edge Cases', earlyExit.totalBoxes);
    return earlyExit;
  }

  // ─── Stage 2: Build Initial Wall ─────────────────────────
  const initialWall = buildWall(container, orientations);
  logStage('Stage 2: Build Initial Wall', initialWall.length);

  // ─── Stage 3: Repeat Wall Along Container ────────────────
  const repeated = repeatPattern(initialWall, container);
  logStage('Stage 3: Repeat Wall Along Container', repeated.length);

  // ─── Stage 4: Vertical Sorting for Layering ──────────────
  const sortedVertically = sortLinesVertically(repeated);
  logStage('Stage 4: Vertical Sorting for Layering', sortedVertically.length);

  // ─── Stage 5: Prepare Tail Area ────────────────────────────
  const sortedPlacements = sortForTailArea(sortedVertically);
  const tailArea = prepareTailArea(sortedPlacements, container);
  logStage('Stage 5: Prepare Tail Area', sortedVertically.length);

  // ─── Stage 6: Fill Tail Area ───────────────────────────────
  const filledTail = fillTailArea(tailArea, container, orientations);
  logStage('Stage 6: Fill Tail Area', sortedVertically.length + filledTail.length);

  // ─── Stage 7: Post-placement Compaction ──────────────────
  const basePlacements = [...sortedVertically, ...filledTail];
  const compacted = alignBoxesAnalytically(snapBoxesTightly(basePlacements));
  logStage('Stage 7: Post-placement Compaction', compacted.length);

  // ─── Stage 8: Analytical Layering ────────────────────────
  const analyticalLayers = addAnalyticalLayers(compacted, container);
  const withLayers = [...compacted, ...analyticalLayers];
  logStage('Stage 8: Analytical Layering', withLayers.length);
  
  // ─── Stage 9: Final Insertion Sweep ─────────────────────
  const finalInserted = finalInsertionSweep(withLayers, container, orientations);
  const withFinalInsert = [...withLayers, ...finalInserted];
  logStage('Stage 9: Final Insertion Sweep', withFinalInsert.length);
  
  // ─── Stage 10: Patch Small Gaps ───────────────────────────
  const patched = patchSmallGaps(withLayers, container, orientations);
  const withPatches = [...withFinalInsert, ...patched];
  logStage('Stage 10: Patch Small Gaps', withPatches.length);

  // ─── Stage 11: Final Compaction ──────────────────────────
  const compactedFinal = alignBoxesAnalytically(snapBoxesTightly(withPatches));
  logStage('Stage 11: Final Compaction', compactedFinal.length);

  // ─── Stage 12: Cleanup Invalid Placements ────────────────
  const cleaned = cleanOutOfBoundsBoxes(compactedFinal, container);
  logStage('Stage 12: Cleanup Invalid Placements', cleaned.length);

  // ─── Stage 13: Final Validation ──────────────────────────
  const validPlacements = removeOverlappingBoxes(cleaned);
  logStage('Stage 13: Final Validation', validPlacements.length);

  // const totalDuration = Math.round(performance.now() - start);
  // console.table(timings);
  // console.log(`🏁 Total time: ${totalDuration} ms`);

  return {
    totalBoxes: validPlacements.length,
    placements: validPlacements,
    boxInMeters: {
      length: box.length / 100,
      width: box.width / 100,
      height: box.height / 100,
      weight: box.weight,
      value: box.value
    }
  };
}
