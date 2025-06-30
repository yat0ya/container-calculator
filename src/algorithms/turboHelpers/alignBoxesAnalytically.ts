import { Placement } from './types';

type Axis = 'x' | 'y' | 'z';
type AxisIndex = 0 | 1 | 2;

export function alignBoxesAnalytically(placements: Placement[]): void {
  const axes: Axis[] = ['x', 'y', 'z'];

  // Estimate where the repeated wall ends
  const xCounts = new Map<number, number>();
  for (const p of placements) {
    const x = p.position.x;
    xCounts.set(x, (xCounts.get(x) || 0) + 1);
  }

  const wallAlignedXs = Array.from(xCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([x]) => x)
    .sort((a, b) => a - b);

  const wallEndX = wallAlignedXs.length ? wallAlignedXs[wallAlignedXs.length - 1] : 0;

  // Only align boxes in the tail
  const tailBoxes = placements.filter(p => p.position.x >= wallEndX);

  for (const axis of axes) {
    const axisIndex = axisToIndex(axis);
    const [orth1, orth2] = getOtherAxes(axis);

    for (const box of tailBoxes) {
      const pos = box.position[axis];
      const base1 = box.position[orth1];
      const size1 = box.rotation[axisToIndex(orth1)];
      const base2 = box.position[orth2];
      const size2 = box.rotation[axisToIndex(orth2)];

      let maxSnap = 0;

      for (const other of placements) {
        if (other === box) continue;

        const otherEnd = other.position[axis] + other.rotation[axisIndex];

        const overlapsOrth1 =
          base1 < other.position[orth1] + other.rotation[axisToIndex(orth1)] &&
          base1 + size1 > other.position[orth1];

        const overlapsOrth2 =
          base2 < other.position[orth2] + other.rotation[axisToIndex(orth2)] &&
          base2 + size2 > other.position[orth2];

        if (overlapsOrth1 && overlapsOrth2 && otherEnd <= pos) {
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
