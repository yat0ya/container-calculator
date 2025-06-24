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

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  // ─── Stage 1: Preprocessing ──────────────────────────────
  const boxInMeters = convertToMeters(box);
  const orientations = generateOrientations(boxInMeters);

  // ─── Stage 2: Build Initial Wall ─────────────────────────
  const initialWall = buildWall(container, orientations);

  // ─── Stage 3: Repeat Wall Along Container ────────────────
  const repeated = repeatPattern(initialWall, container);

  // ─── Stage 4: Vertical Sorting for Layering ──────────────
  const sortedVertically = sortLinesVertically(repeated);

  // ─── Stage 5: Fill Tail Area ─────────────────────────────
  const sortedPlacements = [...sortedVertically].sort((a, b) =>
    (a.position.x + a.rotation[0]) - (b.position.x + b.rotation[0])
  );
  const tailArea = prepareTailArea(sortedPlacements, container);
  const filledTail = fillTailArea(tailArea, container, orientations);

  // ─── Stage 6: Post-placement Compaction ──────────────────
  const allPlacements = [...sortedVertically, ...filledTail];
  snapBoxesTightly(allPlacements);
  alignBoxesAnalytically(allPlacements);

  // ─── Stage 7: Patch Small Gaps ───────────────────────────
  const patched = patchSmallGaps(allPlacements, container, orientations);
  allPlacements.push(...patched);

  // ─── Stage 8: Final Validation ───────────────────────────
  // const validPlacements = allPlacements;
  const validPlacements = removeOverlappingBoxes(allPlacements);

  return {
    totalBoxes: validPlacements.length,
    placements: validPlacements,
    boxInMeters
  };
}
