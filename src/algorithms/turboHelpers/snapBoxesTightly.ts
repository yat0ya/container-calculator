import { Placement } from '../../types';
import { EPSILON } from '../../constants';
import { boxesOverlap } from '../../utils';

export function snapBoxesTightly(placements: Placement[]): void {
  const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
  let moved = true;

  while (moved) {
    moved = false;

    for (const axis of axes) {
      // Always sort for consistent compression direction
      placements.sort((a, b) => a.position[axis] - b.position[axis]);

      for (const box of placements) {
        let delta = 0;
        let trial = { ...box.position };
        let step = EPSILON * 5;

        // Try moving in -axis direction as far as possible
        while (true) {
          trial[axis] = box.position[axis] - step - delta;

          if (trial[axis] < 0) break;

          const trialPlacement: Placement = {
            position: trial,
            rotation: [...box.rotation]
          };

          const overlap = placements.some(
            other => other !== box && boxesOverlap(trialPlacement, other)
          );

          if (overlap) break;

          delta += step;
          box.position[axis] = trial[axis];
          moved = true;
        }
      }
    }
  }
}
