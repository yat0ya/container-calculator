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
  // console.log('🚀 Starting Turbo Algorithm');

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
  const orientations = generateOrientations(boxInMillimeters);
  logStage('Stage 1: Preprocessing', 0);

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

  // ─── Stage 9: Patch Small Gaps ───────────────────────────
  const patched = patchSmallGaps(withLayers, container, orientations);
  const withPatches = [...withLayers, ...patched];
  logStage('Stage 9: Patch Small Gaps', withPatches.length);

  // ─── Stage 10: Final Insertion Sweep ─────────────────────
  const finalInserted = finalInsertionSweep(withPatches, container, orientations);
  const withFinalInsert = [...withPatches, ...finalInserted];
  logStage('Stage 10: Final Insertion Sweep', withFinalInsert.length);

  // ─── Stage 11: Final Compaction ──────────────────────────
  const compactedFinal = alignBoxesAnalytically(snapBoxesTightly(withFinalInsert));
  logStage('Stage 11: Final Compaction', compactedFinal.length);

  // ─── Cleanup: Remove Boxes Still Outside Container ────────
  const cleaned = compactedFinal.filter(p => {
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

  const removedCount = compactedFinal.length - cleaned.length;
  if (removedCount > 0) {
    console.warn(`🧹 Removed ${removedCount} box(es) that exceeded container boundaries`);
  }

  const outOfBounds = cleaned.filter(p => {
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

  // ─── Stage 12: Final Validation ──────────────────────────
  const validPlacements = removeOverlappingBoxes(cleaned);
  logStage('Stage 12: Final Validation', validPlacements.length);

  const totalDuration = Math.round(performance.now() - start);
  // console.table(timings);
  // console.log(`🏁 Total time: ${totalDuration} ms`);

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
