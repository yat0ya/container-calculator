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
  // Use precise grid size based on smallest box dimension
  const minBoxEdge = Math.min(...orientations.flat().filter(x => x > 0));
  const GRID_SIZE = Math.max(5, Math.min(50, Math.floor(minBoxEdge / 4))); // Adaptive grid: 5-50mm

  const placements: Placement[] = [];
  const occupied: Placement[] = [];

  const allRotations = Array.from(
    new Set(orientations.flatMap(getAllRotations).map(r => r.join(',')))
  ).map(r => r.split(',').map(Number) as [number, number, number]);

  const sortedOrients = allRotations.sort(
    (a, b) => (b[0] * b[1] * b[2]) - (a[0] * a[1] * a[2])
  );

  function canPlace(
    x: number, y: number, z: number,
    l: number, h: number, w: number,
    occupiedCheck: Placement[] = occupied
  ): boolean {
    // Precise boundary checks (no epsilon needed in mm)
    if (
      x + l > container.length ||
      y + h > container.height ||
      z + w > container.width
    ) return false;

    // Must be in tail area
    if (x < tail.startX) return false;

    // Check height clearance using precise grid sampling
    const zStep = Math.max(1, Math.floor(GRID_SIZE / 2));
    const yStep = Math.max(1, Math.floor(GRID_SIZE / 2));
    
    for (let zi = z; zi < z + w; zi += zStep) {
      for (let yi = y; yi < y + h; yi += yStep) {
        // Use precise grid coordinates for heightMap lookup
        const gridY = Math.floor(yi / 10) * 10; // heightMap uses 10mm grid
        const gridZ = Math.floor(zi / 10) * 10;
        const key = `${gridY},${gridZ}`;
        const clearance = tail.heightMap.get(key) || 0;
        if (x < tail.startX + clearance) return false;
      }
    }

    // Check overlap with existing boxes
    const newPlacement: Placement = {
      position: { x, y, z },
      rotation: [l, h, w]
    };

    return !occupiedCheck.some(p => boxesOverlap(newPlacement, p));
  }

  // Step 1: Fill known gaps with precise positioning
  for (const gap of tail.gaps) {
    for (const [l, h, w] of sortedOrients) {
      if (l <= gap.length && h <= gap.height && w <= gap.width) {
        // Use precise gap coordinates
        const pos = {
          x: gap.x,
          y: gap.y,
          z: gap.z
        };
        if (canPlace(pos.x, pos.y, pos.z, l, h, w)) {
          const placement: Placement = {
            position: pos,
            rotation: [l, h, w]
          };
          placements.push(placement);
          occupied.push(placement);
          break;
        }
      }
    }
  }

  // Step 2: Systematic fill from back to front with adaptive stepping
  const candidateYs = new Set<number>([0]);

  // Use adaptive step size based on smallest box dimension
  const stepSize = Math.max(1, Math.floor(minBoxEdge / 8));

  for (let x = container.length - stepSize; x >= tail.startX; x -= stepSize) {
    for (let z = 0; z < container.width; z += stepSize) {
      for (const y of Array.from(candidateYs).sort((a, b) => a - b)) {
        let bestPlacement: Placement | null = null;
        let bestCount = -1;

        for (const [l, h, w] of sortedOrients) {
          if (!canPlace(x, y, z, l, h, w)) continue;

          // Simulate forward repetition to find best orientation
          let simX = x;
          let count = 0;
          const tempOccupied = occupied.slice();

          while (
            simX >= tail.startX &&
            canPlace(simX, y, z, l, h, w, tempOccupied)
          ) {
            tempOccupied.push({
              position: { x: simX, y, z },
              rotation: [l, h, w]
            });
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
          placements.push(bestPlacement);
          occupied.push(bestPlacement);
          // Add next Y level candidate
          candidateYs.add(bestPlacement.position.y + bestPlacement.rotation[1]);
        }
      }
    }
  }

  return placements;
}