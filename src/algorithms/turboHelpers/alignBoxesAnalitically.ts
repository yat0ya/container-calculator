import { Placement } from '../../types';
import { EPSILON } from '../../constants';

/**
 * Aligns all boxes downward (Y) and backward/leftward (X, Z) to eliminate floating and gaps.
 */
export function alignBoxesAnalytically(placements: Placement[]): void {
  const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];

  for (const axis of axes) {
    const [axisIndex, other1, other2] =
      axis === 'x' ? [0, 'y', 'z'] :
      axis === 'y' ? [1, 'x', 'z'] :
                     [2, 'x', 'y'];

    for (const box of placements) {
      const pos = box.position[axis];
      const size = box.rotation[axisIndex];

      const base1 = box.position[other1];
      const size1 = box.rotation[axisMapIndex(other1)];
      const base2 = box.position[other2];
      const size2 = box.rotation[axisMapIndex(other2)];

      let maxSnap = 0;

      for (const other of placements) {
        if (other === box) continue;

        const otherSize = other.rotation[axisIndex];
        const otherEnd = other.position[axis] + otherSize;

        const overlaps1 =
          base1 + size1 > other.position[other1] + EPSILON &&
          base1 < other.position[other1] + other.rotation[axisMapIndex(other1)] - EPSILON;

        const overlaps2 =
          base2 + size2 > other.position[other2] + EPSILON &&
          base2 < other.position[other2] + other.rotation[axisMapIndex(other2)] - EPSILON;

        if (overlaps1 && overlaps2 && otherEnd <= pos + EPSILON) {
          maxSnap = Math.max(maxSnap, otherEnd);
        }
      }

      // Snap down/back/left to structure or wall
      box.position[axis] = maxSnap;
    }
  }
}

function axisMapIndex(axis: 'x' | 'y' | 'z'): 0 | 1 | 2 {
  return axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
}
