import { Placement, Container } from './types';
import { boxesOverlap } from './utils';

export function repeatPattern(placements: Placement[], container: Container): Placement[] {
  const repeated: Placement[] = [];

  for (const { position, rotation } of placements) {
    const [length, height, width] = rotation;

    for (let currentX = position.x; currentX + length <= container.length; currentX += length) {
      const newPlacement: Placement = {
        position: { x: currentX, y: position.y, z: position.z },
        rotation: [length, height, width]
      };

      const overlaps = repeated.some(existing => boxesOverlap(newPlacement, existing));
      if (!overlaps) {
        repeated.push(newPlacement);
      }
    }
  }

  return repeated;
}
