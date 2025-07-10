import { Placement, Container, TailArea } from './types';
import { boxesOverlap } from '../turboHelpers/utils';

function getAllRotations([a, b, c]: [number, number, number]): [number, number, number][] {
  const perms: [number, number, number][] = [
    [a, b, c], [a, c, b],
    [b, a, c], [b, c, a],
    [c, a, b], [c, b, a],
  ];
  const unique = new Set<string>();
  return perms.filter(p => {
    const key = p.join(',');
    if (unique.has(key)) return false;
    unique.add(key);
    return true;
  });
}

export function fillTailArea(
  tail: TailArea,
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
  const minBoxEdge = Math.min(...orientations.flat().filter(x => x > 0));
  const GRID_SIZE = Math.max(5, Math.min(50, Math.floor(minBoxEdge / 4)));

  const allRotations = Array.from(
    new Set(orientations.flatMap(getAllRotations).map(r => r.join(',')))
  ).map(r => r.split(',').map(Number) as [number, number, number]);

  const sortedOrients = allRotations.sort(
    (a, b) => (b[0] * b[1] * b[2]) - (a[0] * a[1] * a[2])
  );

  const stepSize = Math.max(1, Math.floor(minBoxEdge / 8));

  const candidateYs = new Set<number>([0]);

  const canPlace = (
    x: number, y: number, z: number,
    l: number, h: number, w: number,
    occupied: Placement[]
  ): boolean => {
    if (
      x + l > container.length ||
      y + h > container.height ||
      z + w > container.width ||
      x < tail.startX
    ) return false;

    const zStep = Math.max(1, Math.floor(GRID_SIZE / 2));
    const yStep = Math.max(1, Math.floor(GRID_SIZE / 2));

    for (let zi = z; zi < z + w; zi += zStep) {
      for (let yi = y; yi < y + h; yi += yStep) {
        const gridY = Math.floor(yi / 10) * 10;
        const gridZ = Math.floor(zi / 10) * 10;
        const key = `${gridY},${gridZ}`;
        const clearance = tail.heightMap.get(key) || 0;
        if (x < tail.startX + clearance) return false;
      }
    }

    const newBox: Placement = { position: { x, y, z }, rotation: [l, h, w] };
    return !occupied.some(p => boxesOverlap(newBox, p));
  };

  // Step 1: Place boxes in known gaps
  let occupied: Placement[] = [];
  let placements: Placement[] = [];

  for (const gap of tail.gaps) {
    for (const [l, h, w] of sortedOrients) {
      if (l <= gap.length && h <= gap.height && w <= gap.width) {
        const pos = { x: gap.x, y: gap.y, z: gap.z };
        if (canPlace(pos.x, pos.y, pos.z, l, h, w, occupied)) {
          const placed: Placement = { position: pos, rotation: [l, h, w] };
          placements = [...placements, placed];
          occupied = [...occupied, placed];
          break;
        }
      }
    }
  }

  // Step 2: Sweep fill from back to front
  for (let x = container.length - stepSize; x >= tail.startX; x -= stepSize) {
    // Calculate available length at current x position
    const availableLength = container.length - x;
    
    // Filter orientations that can fit in the available length
    const validOrients = sortedOrients.filter(([l]) => l <= availableLength);
    
    // Skip if no orientations can fit
    if (validOrients.length === 0) continue;

    for (let z = 0; z < container.width; z += stepSize) {
      for (const y of Array.from(candidateYs).sort((a, b) => a - b)) {
        let bestPlacement: Placement | null = null;
        let bestCount = -1;

        for (const [l, h, w] of validOrients) {
          if (!canPlace(x, y, z, l, h, w, occupied)) continue;

          let simX = x;
          let count = 0;
          let tempOccupied = [...occupied];

          while (
            simX >= tail.startX &&
            canPlace(simX, y, z, l, h, w, tempOccupied)
          ) {
            tempOccupied = [...tempOccupied, {
              position: { x: simX, y, z },
              rotation: [l, h, w]
            }];
            count++;
            simX -= l;
          }

          if (count > bestCount) {
            bestCount = count;
            bestPlacement = {
              position: { x, y, z },
              rotation: [l, h, w]
            };
          }
        }

        if (bestPlacement) {
          placements = [...placements, bestPlacement];
          occupied = [...occupied, bestPlacement];
          candidateYs.add(bestPlacement.position.y + bestPlacement.rotation[1]);
        }
      }
    }
  }

  return placements;
}
