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

  const logTime = (label: string) => {
    const now = performance.now();
    const duration = Math.round(now - prev);
    console.log(`⏱️ ${label}: ${duration} ms`);
    prev = now;
  };

  // ─── Stage 1: Preprocessing ──────────────────────────────
  const boxInMillimeters = convertToMillimeters(box);
  const orientations = generateOrientations(boxInMillimeters);
  logTime('Stage 1: Preprocessing');

  // ─── Stage 2: Build Initial Wall ─────────────────────────
  const initialWall = buildWall(container, orientations);
  logTime('Stage 2: Build Initial Wall');

  // ─── Stage 3: Repeat Wall Along Container ────────────────
  const repeated = repeatPattern(initialWall, container);
  logTime('Stage 3: Repeat Wall Along Container');

  // ─── Stage 4: Vertical Sorting for Layering ──────────────
  const sortedVertically = sortLinesVertically(repeated);
  logTime('Stage 4: Vertical Sorting for Layering');

  // ─── Stage 5: Prepare Tail Area ────────────────────────────
  const sortedPlacements = sortForTailArea(sortedVertically);
  const tailArea = prepareTailArea(sortedPlacements, container);
  logTime('Stage 5: Prepare Tail Area');

  // ─── Stage 6: Fill Tail Area ───────────────────────────────
  const filledTail = fillTailArea(tailArea, container, orientations);
  logTime('Stage 6: Fill Tail Area');

  // ─── Stage 7: Post-placement Compaction ──────────────────
  let allPlacements = [...sortedVertically, ...filledTail];
  snapBoxesTightly(allPlacements);
  alignBoxesAnalytically(allPlacements);
  logTime('Stage 7: Post-placement Compaction');

  // ─── Stage 8: Analytical Layering ────────────────────────
  const analyticalLayers = addAnalyticalLayers(allPlacements, container);
  allPlacements.push(...analyticalLayers);
  logTime('Stage 8: Analytical Layering');

  // ─── Stage 9: Patch Small Gaps ───────────────────────────
  const patched = patchSmallGaps(allPlacements, container, orientations);
  allPlacements.push(...patched);
  logTime('Stage 9: Patch Small Gaps');

  // ─── Stage 10: Final Insertion Sweep ─────────────────────
  const finalInserted = finalInsertionSweep(allPlacements, container, orientations);
  allPlacements.push(...finalInserted);
  logTime('Stage 10: Final Insertion Sweep');

  // ─── Stage 11: Final Compaction ──────────────────────────
  snapBoxesTightly(allPlacements);
  alignBoxesAnalytically(allPlacements);
  logTime('Stage 11: Final Compaction');

  // ─── Cleanup: Remove Boxes Still Outside Container ────────
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

  // ─── Check All Boxes Are Within Container Bounds ──────────
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

  // ─── Stage 12: Final Validation ──────────────────────────
  const validPlacements = removeOverlappingBoxes(allPlacements);
  logTime('Stage 12: Final Validation');

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
