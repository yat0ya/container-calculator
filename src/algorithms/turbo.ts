import { BoxDimensions, Container, CalculationResult } from '../types';
import { convertToMeters, generateOrientations } from '../utils';
import {
  sortLinesVertically,
  removeOverlappingBoxes,
  buildWall,
  repeatPattern,
  prepareTailArea,
  fillTailArea,
  applyPull
} from './turboHelpers';

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  const boxInMeters = convertToMeters(box);
  const orientations = generateOrientations(boxInMeters);
  const initialWall = buildWall(container, orientations);
  const repeated = repeatPattern(initialWall, container);
  
  // Sort boxes vertically before further processing
  const sortedVertically = sortLinesVertically(repeated, container);

  // Apply gravity to ensure boxes are properly stacked
  applyPull(sortedVertically, 'down');
  applyPull(sortedVertically, 'left');
  applyPull(sortedVertically, 'back');

  // Sort placements by x position to ensure proper tail area preparation
  const sortedPlacements = [...sortedVertically].sort((a, b) => 
    (a.position.x + a.rotation[0]) - (b.position.x + b.rotation[0])
  );

  const tailArea = prepareTailArea(sortedPlacements, container);
  const filledTail = fillTailArea(tailArea, container, orientations);

  // Verify no overlaps in final placement
  const allPlacements = [...sortedVertically, ...filledTail];
  const validPlacements = removeOverlappingBoxes(allPlacements);

  return { 
    totalBoxes: validPlacements.length, 
    placements: validPlacements, 
    boxInMeters 
  };
}