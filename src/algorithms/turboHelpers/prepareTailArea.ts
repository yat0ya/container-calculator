import { Container, Placement } from '../../types';
import { EPSILON } from '../../constants';

export interface Gap {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

export interface TailArea {
  startX: number;
  length: number;
  heightMap: Map<string, number>;
  gaps: Gap[];
}

export function prepareTailArea(placements: Placement[], container: Container): TailArea {
  const GRID_SIZE = 0.1;

  if (placements.length === 0) {
    return {
      startX: 0,
      length: container.length,
      heightMap: new Map(),
      gaps: []
    };
  }

  // 1. Find maxX and secondMaxX
  let maxX = 0;
  for (const p of placements) {
    const endX = p.position.x + p.rotation[0];
    if (endX > maxX + EPSILON) maxX = endX;
  }

  let secondMaxX = 0;
  let countAtMax = 0;
  for (const p of placements) {
    const endX = p.position.x + p.rotation[0];
    if (endX > secondMaxX + EPSILON && endX < maxX - EPSILON) {
      secondMaxX = endX;
    }
    if (Math.abs(endX - maxX) < EPSILON) {
      countAtMax++;
    }
  }

  // 2. Decide tailStart (remove protrusions if minor)
  let tailStart = maxX;
  const threshold = 0.2 * container.length;
  if (countAtMax <= 2 || (maxX - secondMaxX) > threshold) {
    tailStart = secondMaxX || maxX;
  }

  // 3. Remove protruding boxes and isolate them for heightMap/gaps
  const tailBoxes = placements.filter(p => (p.position.x + p.rotation[0]) >= tailStart - EPSILON);
  placements = placements.filter(p => (p.position.x + p.rotation[0]) < tailStart - EPSILON);

  // 4. Align tail start and compute length
  const startX = Math.floor(tailStart / GRID_SIZE) * GRID_SIZE;
  const tailLength = container.length - startX;

  // 5. Init heightMap
  const heightMap = new Map<string, number>();
  for (let z = 0; z < container.width + EPSILON; z += GRID_SIZE) {
    for (let y = 0; y < container.height + EPSILON; y += GRID_SIZE) {
      const key = `${y.toFixed(3)},${z.toFixed(3)}`;
      heightMap.set(key, 0);
    }
  }

  // 6. Add overhangs to heightMap and define gaps under elevated boxes
  const gaps: Gap[] = [];
  for (const p of tailBoxes) {
    const endX = p.position.x + p.rotation[0];
    const overhang = endX - startX;

    for (let z = p.position.z; z < p.position.z + p.rotation[2] - EPSILON; z += GRID_SIZE) {
      for (let y = p.position.y; y < p.position.y + p.rotation[1] - EPSILON; y += GRID_SIZE) {
        const key = `${y.toFixed(3)},${z.toFixed(3)}`;
        const current = heightMap.get(key) || 0;
        heightMap.set(key, Math.max(current, overhang));
      }
    }

    if (p.position.y > EPSILON) {
      gaps.push({
        x: p.position.x,
        y: 0,
        z: p.position.z,
        width: p.rotation[2],
        height: p.position.y,
        depth: overhang
      });
    }
  }

  return { startX, length: tailLength, heightMap, gaps };
}
