import { Placement, Container } from '../../types';
import { EPSILON } from '../../constants';
import { boxesOverlap } from '../../utils';
import { TailArea } from './prepareTailArea';

export function fillTailArea(
  tail: TailArea,
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
  const GRID_SIZE = 0.1;
  const placements: Placement[] = [];

  function canPlace(x: number, y: number, z: number, l: number, h: number, w: number): boolean {
    if (x + l > container.length + EPSILON ||
        y + h > container.height + EPSILON ||
        z + w > container.width + EPSILON ||
        x < 0 || y < 0 || z < 0) return false;

    for (let zi = z; zi < z + w; zi += GRID_SIZE) {
      for (let yi = y; yi < y + h; yi += GRID_SIZE) {
        const key = `${yi.toFixed(3)},${zi.toFixed(3)}`;
        const requiredSpace = tail.heightMap.get(key) || 0;
        if (x < tail.startX + requiredSpace - EPSILON) return false;
      }
    }

    const newPlacement = { position: { x, y, z }, rotation: [l, h, w] };
    return !placements.some(p => boxesOverlap(newPlacement, p));
  }

  const sorted = [...orientations].sort((a, b) => b[0] * b[1] * b[2] - a[0] * a[1] * b[2]);

  for (const gap of tail.gaps) {
    for (const [l, h, w] of sorted) {
      if (h <= gap.height && w <= gap.width) {
        if (canPlace(gap.x, gap.y, gap.z, l, h, w)) {
          placements.push({
            position: { x: gap.x, y: gap.y, z: gap.z },
            rotation: [l, h, w]
          });
          break;
        }
      }
    }
  }

  for (let x = tail.startX; x + GRID_SIZE <= container.length; x += GRID_SIZE) {
    for (let z = 0; z + GRID_SIZE <= container.width; z += GRID_SIZE) {
      for (let y = 0; y + GRID_SIZE <= container.height; y += GRID_SIZE) {
        const key = `${y.toFixed(3)},${z.toFixed(3)}`;
        const minHeight = tail.heightMap.get(key) || 0;

        if (x < tail.startX + minHeight - EPSILON) continue;

        for (const [l, h, w] of sorted) {
          if (canPlace(x, y, z, l, h, w)) {
            placements.push({
              position: { x, y, z },
              rotation: [l, h, w]
            });
            break;
          }
        }
      }
    }
  }

  return placements;
}
