import { Placement } from '../../types';
import { EPSILON } from '../../constants';

type Axis = 'x' | 'y' | 'z';
type AxisIndex = 0 | 1 | 2;

export function alignBoxesAnalytically(placements: Placement[]): void {
  const axes: Axis[] = ['x', 'y', 'z'];

  // Estimate where the repeated wall ends
  const xCounts = new Map<number, number>();
  for (const p of placements) {
    const x = Math.round(p.position.x * 1000) / 1000;
    xCounts.set(x, (xCounts.get(x) || 0) + 1);
  }

  const wallXs = Array.from(xCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([x]) => x)
    .sort((a, b) => a - b);
  const wallEndX = wallXs.length ? wallXs[wallXs.length - 1] : 0;

  // Only align boxes in the tail
  const tailBoxes = placements.filter(p => p.position.x >= wallEndX);

  for (const axis of axes) {
    const axisIndex = axisToIndex(axis);
    const [other1, other2] = getOtherAxes(axis);

    for (const box of tailBoxes) {
      const pos = box.position[axis];

      const base1 = box.position[other1];
      const size1 = box.rotation[axisToIndex(other1)];
      const base2 = box.position[other2];
      const size2 = box.rotation[axisToIndex(other2)];

      let maxSnap = 0;

      for (const other of placements) {
        if (other === box) continue;

        const otherSize = other.rotation[axisIndex];
        const otherEnd = other.position[axis] + otherSize;

        const overlaps1 =
          base1 + size1 > other.position[other1] + EPSILON &&
          base1 < other.position[other1] + other.rotation[axisToIndex(other1)] - EPSILON;

        const overlaps2 =
          base2 + size2 > other.position[other2] + EPSILON &&
          base2 < other.position[other2] + other.rotation[axisToIndex(other2)] - EPSILON;

        if (overlaps1 && overlaps2 && otherEnd <= pos + EPSILON) {
          maxSnap = Math.max(maxSnap, otherEnd);
        }
      }

      box.position[axis] = maxSnap;
    }
  }
}

function axisToIndex(axis: Axis): AxisIndex {
  return axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
}

function getOtherAxes(axis: Axis): [Axis, Axis] {
  if (axis === 'x') return ['y', 'z'];
  if (axis === 'y') return ['x', 'z'];
  return ['x', 'y'];
}
