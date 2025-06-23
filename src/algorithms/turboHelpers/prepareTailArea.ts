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

  let maxX = 0;
  for (const p of placements) {
    const endX = p.position.x + p.rotation[0];
    if (endX > maxX) maxX = endX;
  }

  const startX = Math.floor(maxX / GRID_SIZE) * GRID_SIZE;
  const heightMap = new Map<string, number>();
  const gaps: Gap[] = [];

  for (let z = 0; z < container.width; z += GRID_SIZE) {
    for (let y = 0; y < container.height; y += GRID_SIZE) {
      const key = `${y.toFixed(3)},${z.toFixed(3)}`;
      heightMap.set(key, 0);
    }
  }

  for (const p of placements) {
    const endX = p.position.x + p.rotation[0];
    if (endX > startX - EPSILON) {
      const overhang = endX - startX;

      if (overhang > EPSILON) {
        for (let z = p.position.z; z < p.position.z + p.rotation[2]; z += GRID_SIZE) {
          for (let y = p.position.y; y < p.position.y + p.rotation[1]; y += GRID_SIZE) {
            const key = `${y.toFixed(3)},${z.toFixed(3)}`;
            heightMap.set(key, Math.max(heightMap.get(key) || 0, overhang));
          }
        }

        if (p.position.y > EPSILON) {
          gaps.push({
            x: startX,
            y: 0,
            z: p.position.z,
            width: p.rotation[2],
            height: p.position.y,
            depth: overhang
          });
        }
      }
    }
  }

  for (let z = 0; z < container.width; z += GRID_SIZE) {
    let maxHeight = 0;
    for (let y = container.height - GRID_SIZE; y >= 0; y -= GRID_SIZE) {
      const key = `${y.toFixed(3)},${z.toFixed(3)}`;
      const height = heightMap.get(key) || 0;
      maxHeight = Math.max(maxHeight, height);
      heightMap.set(key, maxHeight);
    }
  }

  return {
    startX,
    length: container.length - startX,
    heightMap,
    gaps
  };
}
