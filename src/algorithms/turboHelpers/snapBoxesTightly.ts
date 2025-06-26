import { Placement } from '../../types';

export function snapBoxesTightly(placements: Placement[]): void {
  const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];

  for (const axis of axes) {
    // Sort placements by position along current axis
    placements.sort((a, b) => a.position[axis] - b.position[axis]);

    for (let i = 0; i < placements.length; i++) {
      const box = placements[i];
      let maxEndBefore = 0;

      for (let j = 0; j < i; j++) {
        const other = placements[j];

        // Check overlap in the two other axes
        const otherAxes = axes.filter(a => a !== axis) as ('x' | 'y')[];
        let overlaps = true;

        for (const a of otherAxes) {
          const aMin = box.position[a];
          const aMax = aMin + box.rotation[axes.indexOf(a)];
          const bMin = other.position[a];
          const bMax = bMin + other.rotation[axes.indexOf(a)];

          if (aMax <= bMin || aMin >= bMax) {
            overlaps = false;
            break;
          }
        }

        if (overlaps) {
          const otherEnd = other.position[axis] + other.rotation[axes.indexOf(axis)];
          maxEndBefore = Math.max(maxEndBefore, otherEnd);
        }
      }

      // Snap to maximum blocking end
      box.position[axis] = maxEndBefore;
    }
  }
}
