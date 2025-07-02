// turbo.ts
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

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  console.log('🚀 Starting Turbo Algorithm');

  const start = performance.now();
  let prev = start;

  const stageLogs: { stage: string; timeMs: number; boxesAdded: number | null }[] = [];

  const logStage = (
    stage: string,
    beforeCount: number | null,
    afterCount: number | null
  ) => {
    const now = performance.now();
    const timeMs = Math.round(now - prev);
    const boxesAdded = beforeCount !== null && afterCount !== null ? afterCount - beforeCount : null;
    stageLogs.push({ stage, timeMs, boxesAdded });
    prev = now;
  };

  const logStageNoNewBoxes = (stage: string) => logStage(stage, null, null);

  // ─── Stage 1: Preprocessing ──────────────────────────────
  const boxInMillimeters = convertToMillimeters(box);
  const orientations = generateOrientations(boxInMillimeters);
  logStageNoNewBoxes('Stage 1: Preprocessing');

  // ─── Stage 2: Build Initial Wall ─────────────────────────
  const initialWall = buildWall(container, orientations);
  logStage('Stage 2: Build Initial Wall', 0, initialWall.length);

  // ─── Stage 3: Repeat Wall Along Container ────────────────
  const repeated = repeatPattern(initialWall, container);
  logStage('Stage 3: Repeat Wall Along Container', initialWall.length, repeated.length);

  // ─── Stage 4: Vertical Sorting for Layering ──────────────
  const sortedVertically = sortLinesVertically(repeated);
  logStageNoNewBoxes('Stage 4: Vertical Sorting for Layering');

  // ─── Stage 5: Prepare Tail Area ────────────────────────────
  const sortedPlacements = sortForTailArea(sortedVertically);
  const tailArea = prepareTailArea(sortedPlacements, container);
  let allPlacements = [...sortedPlacements];
  const beforeTail = allPlacements.length;
  logStage('Stage 5: Prepare Tail Area', beforeTail, beforeTail); // No new boxes added

  // ─── Stage 6: Early Compaction (optional) ────────────────
  // snapBoxesTightly(allPlacements);
  // logStageNoNewBoxes('Stage 6: Early Compaction');

  // ─── Stage 7: Fill Tail Area ─────────────────────────────
  const beforeFillTail = allPlacements.length;
  const filledTail = fillTailArea(tailArea, container, orientations);
  allPlacements.push(...filledTail);
  logStage('Stage 7: Fill Tail Area', beforeFillTail, allPlacements.length);

  // ─── Stage 8: Final Insertion Sweep ───────────────────────
  const beforeInsert = allPlacements.length;
  const finalInserted = finalInsertionSweep(allPlacements, container, orientations);
  allPlacements.push(...finalInserted);
  logStage('Stage 8: Final Insertion Sweep', beforeInsert, allPlacements.length);

  // ─── Stage 9: Patch Small Gaps ────────────────────────────
  const beforePatch = allPlacements.length;
  const patched = patchSmallGaps(allPlacements, container, orientations);
  allPlacements.push(...patched);
  logStage('Stage 9: Patch Small Gaps', beforePatch, allPlacements.length);

  // ─── Stage 10: Analytical Layering ────────────────────────
  alignBoxesAnalytically(allPlacements);
  const beforeAnalytical = allPlacements.length;
  const analyticalLayers = addAnalyticalLayers(allPlacements, container);
  allPlacements.push(...analyticalLayers);
  logStage('Stage 10: Analytical Layering', beforeAnalytical, allPlacements.length);

  // ─── Stage 11: Final Compaction ───────────────────────────
  snapBoxesTightly(allPlacements);
  alignBoxesAnalytically(allPlacements);
  logStageNoNewBoxes('Stage 11: Final Compaction');

  // ─── Cleanup: Remove Boxes Outside Container ─────────────
  const beforeCleanup = allPlacements.length;
  allPlacements = allPlacements.filter(p => {
    const endX = p.position.x + p.rotation[0];
    const endY = p.position.y + p.rotation[1];
    const endZ = p.position.z + p.rotation[2];
    return (
      p.position.x >= 0 && p.position.y >= 0 && p.position.z >= 0 &&
      endX <= container.length &&
      endY <= container.height &&
      endZ <= container.width
    );
  });
  const removedCount = beforeCleanup - allPlacements.length;
  if (removedCount > 0) {
    console.warn(`🧹 Removed ${removedCount} box(es) that exceeded container boundaries`);
  }

  const outOfBounds = allPlacements.filter(p => {
    const endX = p.position.x + p.rotation[0];
    const endY = p.position.y + p.rotation[1];
    const endZ = p.position.z + p.rotation[2];
    return (
      p.position.x < 0 || p.position.y < 0 || p.position.z < 0 ||
      endX > container.length || endY > container.height || endZ > container.width
    );
  });
  if (outOfBounds.length > 0) {
    console.warn(`🚫 ${outOfBounds.length} boxes exceed container boundaries`);
    console.table(outOfBounds.map(p => ({
      position: p.position,
      rotation: p.rotation,
      endX: p.position.x + p.rotation[0],
      endY: p.position.y + p.rotation[1],
      endZ: p.position.z + p.rotation[2]
    })));
  } else {
    console.log('✅ All boxes fit within container bounds');
  }

  // ─── Stage 12: Final Validation ────────────────────────────
  const beforeValidation = allPlacements.length;
  const validPlacements = removeOverlappingBoxes(allPlacements);
  logStage('Stage 12: Final Validation', beforeValidation, validPlacements.length);

  const totalDuration = Math.round(performance.now() - start);
  console.log(`🏁 Total time: ${totalDuration} ms`);

  // ─── Summary Table ─────────────────────────────────────────
  console.table(stageLogs.map(({ stage, timeMs, boxesAdded }) => ({
    stage,
    'time [ms]': timeMs,
    'boxes added': boxesAdded !== null ? boxesAdded : '-'
  })));

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
