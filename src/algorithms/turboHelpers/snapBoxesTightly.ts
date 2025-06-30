import { Placement } from '../../types';

export function snapBoxesTightly(placements: Placement[]): void {
  const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];

  for (const axis of axes) {
    // Sort placements by position along the current axis
    placements.sort((a, b) => a.position[axis] - b.position[axis]);

    for (let i = 0; i < placements.length; i++) {
      const box = placements[i];
      let maxEndBefore = 0;

      for (let j = 0; j < i; j++) {
        const other = placements[j];

        // Check overlap in the two other axes
        const [a1, a2] = axes.filter(a => a !== axis);
        const boxA1Min = box.position[a1];
        const boxA1Max = boxA1Min + box.rotation[axes.indexOf(a1)];
        const otherA1Min = other.position[a1];
        const otherA1Max = otherA1Min + other.rotation[axes.indexOf(a1)];

        const boxA2Min = box.position[a2];
        const boxA2Max = boxA2Min + box.rotation[axes.indexOf(a2)];
        const otherA2Min = other.position[a2];
        const otherA2Max = otherA2Min + other.rotation[axes.indexOf(a2)];

        const overlapsInOtherAxes =
          boxA1Min < otherA1Max && boxA1Max > otherA1Min &&
          boxA2Min < otherA2Max && boxA2Max > otherA2Min;

        if (overlapsInOtherAxes) {
          const otherEnd = other.position[axis] + other.rotation[axes.indexOf(axis)];
          maxEndBefore = Math.max(maxEndBefore, otherEnd);
        }
      }

      // Snap to the nearest valid position along the axis
      box.position[axis] = maxEndBefore;
    }
  }
}
