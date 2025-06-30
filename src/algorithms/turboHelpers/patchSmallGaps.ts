import { Placement, Container } from './types';
import { boxesOverlap } from '../turboHelpers/utils';

/**
 * Greedily fills leftover tail space from bottom up using all orientations.
 * Only places on top of solid surfaces (floor or box).
 */
export function patchSmallGaps(
  existing: Placement[],
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
  const GRID = 10; // mm resolution
  const newPlacements: Placement[] = [];
  const all = [...existing];

  const snap = (v: number) => Math.round(v / GRID) * GRID;

  // Detect start of tail based on densest X region
  const xCount = new Map<number, number>();
  for (const p of existing) {
    const x = snap(p.position.x);
    xCount.set(x, (xCount.get(x) || 0) + 1);
  }

  const likelyWallEnd = [...xCount.entries()]
    .filter(([, count]) => count > 1)
    .map(([x]) => x)
    .sort((a, b) => b - a)[0] ?? 0;

  const tailStartX = snap(likelyWallEnd);

  // Patch only tail region
  for (let x = tailStartX; x < container.length; x += GRID) {
    for (let z = 0; z < container.width; z += GRID) {
      const supportHeights = getSupportHeightsAt(x, z, all);

      for (const y of supportHeights) {
        for (const [l, h, w] of orientations) {
          const pos = {
            x: snap(x),
            y,
            z: snap(z)
          };

          if (
            pos.x + l > container.length ||
            pos.y + h > container.height ||
            pos.z + w > container.width
          ) continue;

          const newBox: Placement = {
            position: pos,
            rotation: [l, h, w]
          };

          if (!all.some(p => boxesOverlap(newBox, p))) {
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

    const coversX = x >= px && x < px + pl;
    const coversZ = z >= pz && z < pz + pw;

    if (coversX && coversZ) {
      heights.add(p.position.y + p.rotation[1]);
    }
  }

  return Array.from(heights).sort((a, b) => a - b);
}
