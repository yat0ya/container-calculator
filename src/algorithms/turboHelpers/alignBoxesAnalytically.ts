import { Placement } from './types';

type Axis = 'x' | 'y' | 'z';
type AxisIndex = 0 | 1 | 2;

export function alignBoxesAnalytically(placements: Placement[]): Placement[] {
  const axes: Axis[] = ['x', 'y', 'z'];

  // Detect wall end using precise placement density analysis
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

  let updatedPlacements = placements;

  for (const axis of axes) {
    const axisIndex = axisToIndex(axis);
    const [orth1, orth2] = getOtherAxes(axis);

    const placementMap = new Map<Placement, Placement>();

    for (const box of updatedPlacements) {
      if (box.position.x < wallEndX) {
        placementMap.set(box, box); // No change needed
        continue;
      }

      const pos = box.position[axis];
      const base1 = box.position[orth1];
      const size1 = box.rotation[axisToIndex(orth1)];
      const base2 = box.position[orth2];
      const size2 = box.rotation[axisToIndex(orth2)];

      let maxSnap = 0;

      for (const other of updatedPlacements) {
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

      // Create new placement with updated axis position
      placementMap.set(box, {
        ...box,
        position: {
          ...box.position,
          [axis]: maxSnap
        }
      });
    }

    // Apply all updates
    updatedPlacements = updatedPlacements.map(p => placementMap.get(p)!);
  }

  return updatedPlacements;
}

function axisToIndex(axis: Axis): AxisIndex {
  return axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
}

function getOtherAxes(axis: Axis): [Axis, Axis] {
  if (axis === 'x') return ['y', 'z'];
  if (axis === 'y') return ['x', 'z'];
  return ['x', 'y'];
}
