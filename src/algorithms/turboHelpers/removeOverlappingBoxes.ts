import { Placement } from '../../types';
import { EPSILON } from '../../constants';
import { boxesOverlap } from '../../utils';

export function removeOverlappingBoxes(placements: Placement[]): Placement[] {
  const result: Placement[] = [];

  for (const placement of placements) {
    let hasOverlap = false;

    for (const existing of result) {
      if (boxesOverlap(placement, existing)) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap &&
        placement.position.x >= -EPSILON &&
        placement.position.y >= -EPSILON &&
        placement.position.z >= -EPSILON) {
      result.push(placement);
    }
  }

  return result;
}
