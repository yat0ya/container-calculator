import { Placement, Container } from '../../types';
import { boxesOverlap } from '../../utils';
import { EPSILON } from '../../constants';

/**
 * Attempts to place additional boxes in unused space from bottom up.
 * Only places on floor or on top of other boxes.
 */
export function patchSmallGaps(
  existing: Placement[],
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
  const GRID = 0.01; // 1cm resolution
  const newPlacements: Placement[] = [];
  const all = [...existing];

  const snap = (v: number) => Math.round(v / GRID) * GRID;

  for (let x = 0; x + EPSILON < container.length; x += GRID) {
    for (let z = 0; z + EPSILON < container.width; z += GRID) {
      // For each x,z column, get all supported Y levels (top surfaces)
      const supportHeights = getSupportHeightsAt(x, z, all);

      for (const y of supportHeights) {
        for (const [l, h, w] of orientations) {
          const pos = {
            x: snap(x),
            y,
            z: snap(z)
          };

          // Ensure box fits within container
          if (
            pos.x + l > container.length + EPSILON ||
            pos.y + h > container.height + EPSILON ||
            pos.z + w > container.width + EPSILON
          ) continue;

          const newBox: Placement = {
            position: pos,
            rotation: [l, h, w]
          };

          const overlaps = all.some(p => boxesOverlap(newBox, p));
          if (!overlaps) {
            newPlacements.push(newBox);
            all.push(newBox);
          }
        }
      }
    }
  }

  return newPlacements;
}

function getSupportHeightsAt(x: number, z: number, placements: Placement[]): number[] {
  const heights = new Set<number>();
  heights.add(0); // floor

  for (const p of placements) {
    const px = p.position.x;
    const pz = p.position.z;
    const pl = p.rotation[0];
    const pw = p.rotation[2];

    const coversX = x >= px - EPSILON && x <= px + pl + EPSILON;
    const coversZ = z >= pz - EPSILON && z <= pz + pw + EPSILON;

    if (coversX && coversZ) {
      const top = p.position.y + p.rotation[1];
      heights.add(top);
    }
  }

  return Array.from(heights).sort((a, b) => a - b);
}
