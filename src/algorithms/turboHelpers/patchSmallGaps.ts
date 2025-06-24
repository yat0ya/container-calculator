import { Placement, Container } from '../../types';
import { boxesOverlap } from '../../utils';
import { EPSILON } from '../../constants';

/**
 * Greedily fills leftover tail space from bottom up using all orientations.
 * Only places on top of solid surfaces (floor or box).
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

  // Determine tailStartX from current placements
  let tailStartX = 0;
  for (const p of existing) {
    const endX = p.position.x + p.rotation[0];
    if (endX > tailStartX + EPSILON) {
      tailStartX = endX;
    }
  }
  tailStartX = snap(tailStartX);

  // Limit patching only to tail region
  for (let x = tailStartX; x + EPSILON < container.length; x += GRID) {
    for (let z = 0; z + EPSILON < container.width; z += GRID) {
      const supportHeights = getSupportHeightsAt(x, z, all);

      for (const y of supportHeights) {
        for (const [l, h, w] of orientations) {
          const pos = {
            x: snap(x),
            y,
            z: snap(z)
          };

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
  heights.add(0); // always try the floor

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
