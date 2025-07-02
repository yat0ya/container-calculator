import { Placement, Container } from './types';
import { boxesOverlap } from '../turboHelpers/utils';

/**
 * Fills leftover tail space by adding boxes on top of final stack surfaces.
 * Uses only tail area and avoids full-volume scans.
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

  const sortedXs = [...xCount.entries()].sort((a, b) => b[1] - a[1]);
  const wallAlignedX = sortedXs.find(([, count]) => count > 1)?.[0] ?? 0;
  const tailStartX = snap(wallAlignedX + 10);

  // Pre-filter usable orientations
  const filteredOrients = orientations.filter(([l, h, w]) =>
    l <= container.length &&
    h <= container.height &&
    w <= container.width
  );

  // Build a top surface map: (x,z) → max Y
  const topSurfaces = new Map<string, number>();

  for (const p of all) {
    const topY = p.position.y + p.rotation[1];
    const xStart = snap(p.position.x);
    const xEnd = snap(p.position.x + p.rotation[0]);
    const zStart = snap(p.position.z);
    const zEnd = snap(p.position.z + p.rotation[2]);

    for (let x = xStart; x < xEnd; x += GRID) {
      if (x < tailStartX) continue;

      for (let z = zStart; z < zEnd; z += GRID) {
        const key = `${x},${z}`;
        const current = topSurfaces.get(key) ?? 0;
        topSurfaces.set(key, Math.max(current, topY));
      }
    }
  }

  // Attempt placement at each top surface position
  for (const [key, y] of topSurfaces.entries()) {
    const [x, z] = key.split(',').map(Number);

    for (const [l, h, w] of filteredOrients) {
      const pos = {
        x: snap(x),
        y: snap(y),
        z: snap(z)
      };

      if (
        snap(pos.x + l) > container.length ||
        snap(pos.y + h) > container.height ||
        snap(pos.z + w) > container.width
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

  return newPlacements;
}
