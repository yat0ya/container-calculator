import { BoxDimensions, Container, CalculationResult, Placement } from '../types';
import { convertToMeters, generateOrientations } from '../utils';
import { EPSILON, MIN_VOLUME, MAX_ITERATIONS } from '../constants';
import { boxesOverlap } from '../utils';

import { sortLinesVertically } from './turboHelpers/sortLinesVertically';
import { removeOverlappingBoxes } from './turboHelpers/removeOverlappingBoxes';
import { buildWall } from './turboHelpers/buildWall';
import { repeatPattern } from './turboHelpers/repeatPattern';
import { prepareTailArea, TailArea } from './turboHelpers/prepareTailArea';
import { fillTailArea } from './turboHelpers/fillTailArea';
import { applyPull } from './turboHelpers/applyPull';



export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  // ─── Stage 1: Preprocessing ──────────────────────────────
  const boxInMeters = convertToMeters(box);
  const orientations = generateOrientations(boxInMeters);

  // ─── Stage 2: Build Initial Wall ─────────────────────────
  const initialWall = buildWall(container, orientations);

  // ─── Stage 3: Repeat Wall Along Container ────────────────
  const repeated = repeatPattern(initialWall, container);

  // ─── Stage 4: Vertical Sorting for Layering ──────────────
  const sortedVertically = sortLinesVertically(repeated, container);

  // ─── Stage 5: Apply Gravity Pull ─────────────────────────
  applyPull(sortedVertically, 'down');
  applyPull(sortedVertically, 'left');
  applyPull(sortedVertically, 'back');

  // ─── Stage 6: Prepare & Fill Tail Area ───────────────────
  const sortedPlacements = [...sortedVertically].sort((a, b) => 
    (a.position.x + a.rotation[0]) - (b.position.x + b.rotation[0])
  );
  const tailArea = prepareTailArea(sortedPlacements, container);
  const filledTail = fillTailArea(tailArea, container, orientations);

  // ─── Stage 7: Final Validation ───────────────────────────
  const allPlacements = [...sortedVertically, ...filledTail];
  const validPlacements = removeOverlappingBoxes(allPlacements);

  return {
    totalBoxes: validPlacements.length,
    placements: validPlacements,
    boxInMeters
  };
}
