import { Placement, Container } from '../../types';
import { EPSILON } from '../../constants';
import { boxesOverlap } from '../../utils';

interface Gap {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

interface TailArea {
  startX: number;
  length: number;
  heightMap: Map<string, number>;
  gaps: Gap[];
}

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
  const MIN_GRID = 0.02;
  const MAX_GRID = 0.1;
  const minBoxEdge = Math.min(...orientations.flat().filter(x => x > 0));
  const GRID_SIZE = Math.min(MAX_GRID, Math.max(MIN_GRID, minBoxEdge));

  const placements: Placement[] = [];
  const occupied: Placement[] = [];

  const allRotations = Array.from(
    new Set(orientations.flatMap(getAllRotations).map(r => r.join(',')))
  ).map(r => r.split(',').map(Number) as [number, number, number]);

  const sortedOrients = [...allRotations].sort(
    (a, b) => (b[0] * b[1] * b[2]) - (a[0] * a[1] * a[2])
  );

  const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

  function canPlace(
    x: number, y: number, z: number,
    l: number, h: number, w: number,
    occupiedCheck: Placement[] = occupied
  ): boolean {
    if (
      x + l > container.length + EPSILON ||
      y + h > container.height + EPSILON ||
      z + w > container.width + EPSILON
    ) return false;

    if (x < tail.startX - EPSILON) return false;

    for (let zi = z; zi < z + w - EPSILON; zi += GRID_SIZE) {
      for (let yi = y; yi < y + h - EPSILON; yi += GRID_SIZE) {
        const key = `${yi.toFixed(3)},${zi.toFixed(3)}`;
        const clearance = tail.heightMap.get(key) || 0;
        if (x < tail.startX + clearance - EPSILON) return false;
      }
    }

    const newPlacement: Placement = {
      position: { x: snap(x), y: snap(y), z: snap(z) },
      rotation: [l, h, w] as [number, number, number]
    };

    return !occupiedCheck.some(p => boxesOverlap(newPlacement, p));
  }

  // Step 1: Fill known gaps first
  for (const gap of tail.gaps) {
    for (const [l, h, w] of sortedOrients) {
      if (l <= gap.depth + EPSILON && h <= gap.height + EPSILON && w <= gap.width + EPSILON) {
        const pos = {
          x: snap(gap.x),
          y: snap(gap.y),
          z: snap(gap.z)
        };
        if (canPlace(pos.x, pos.y, pos.z, l, h, w)) {
          const placement: Placement = {
            position: pos,
            rotation: [l, h, w] as [number, number, number]
          };
          placements.push(placement);
          occupied.push(placement);
          break;
        }
      }
    }
  }

  // Step 2: Fill tail area from back to wall
  const candidateYs = new Set<number>([0]);

  for (let x = container.length - GRID_SIZE; x >= tail.startX; x -= GRID_SIZE) {
    for (let z = 0; z < container.width + EPSILON; z += GRID_SIZE) {
      for (const y of Array.from(candidateYs).sort((a, b) => a - b)) {
        const snapped = { x: snap(x), y: snap(y), z: snap(z) };

        let bestPlacement: Placement | null = null;
        let bestCount = -1;

        for (const [l, h, w] of sortedOrients) {
          if (!canPlace(snapped.x, snapped.y, snapped.z, l, h, w)) continue;

          let simX = snapped.x;
          let count = 0;
          const tempOccupied = occupied.slice();

          while (
            simX >= tail.startX - EPSILON &&
            canPlace(simX, snapped.y, snapped.z, l, h, w, tempOccupied)
          ) {
            tempOccupied.push({
              position: { x: simX, y: snapped.y, z: snapped.z },
              rotation: [l, h, w] as [number, number, number]
            });
            count++;
            simX -= l;
          }

          if (count > bestCount) {
            bestCount = count;
            bestPlacement = {
              position: snapped,
              rotation: [l, h, w] as [number, number, number]
            };
          }
        }

        if (bestPlacement) {
          placements.push(bestPlacement);
          occupied.push(bestPlacement);
          candidateYs.add(snap(bestPlacement.position.y + bestPlacement.rotation[1]));
        }
      }
    }
  }

  return placements;
}
