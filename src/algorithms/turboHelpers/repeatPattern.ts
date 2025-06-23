import { Placement, Container } from '../../types';
import { EPSILON } from '../../constants';
import { boxesOverlap } from '../../utils';

export function repeatPattern(placements: Placement[], container: Container): Placement[] {
  const repeated: Placement[] = [];

  for (const { position, rotation } of placements) {
    const [l, h, w] = rotation;

    for (let x = position.x; x + l <= container.length + EPSILON; x += l) {
      const newPlacement = {
        position: { x, y: position.y, z: position.z },
        rotation: [l, h, w]
      };

      let hasOverlap = false;
      for (const existing of repeated) {
        if (boxesOverlap(newPlacement, existing)) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        repeated.push(newPlacement);
      }
    }
  }

  return repeated;
}
