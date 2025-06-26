import { Placement, Container } from '../../types';
import { EPSILON } from '../../constants';

export function finalInsertionSweep(
  placements: Placement[],
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
  const occupied = [...placements];
  const newPlacements: Placement[] = [];

  const step = Math.min(...orientations.map(d => Math.min(...d))) / 4;
  const minBoxLength = Math.min(...orientations.map(o => o[0]));

  // Estimate where the repeated wall ends using a histogram of X positions
  const xCounts = new Map<number, number>();

  for (const p of placements) {
    const x = Math.round(p.position.x * 1000) / 1000; // bin by mm to avoid float noise
    xCounts.set(x, (xCounts.get(x) || 0) + 1);
  }

  // Find X with highest count — assume these are repeated walls
  const wallXs = Array.from(xCounts.entries())
    .filter(([, count]) => count > 1) // only consider "wall-like" x-layers
    .map(([x]) => x)
    .sort((a, b) => a - b);

  const wallEndX = wallXs.length ? wallXs[wallXs.length - 1] : 0;

  const tailLength = container.length - wallEndX;
  if (tailLength < minBoxLength - EPSILON) {
    return [];
  }

  const isFree = (x: number, y: number, z: number, l: number, h: number, w: number) =>
    !occupied.some(p =>
      x < p.position.x + p.rotation[0] &&
      x + l > p.position.x &&
      y < p.position.y + p.rotation[1] &&
      y + h > p.position.y &&
      z < p.position.z + p.rotation[2] &&
      z + w > p.position.z
    );

  for (let y = 0; y + step <= container.height; y += step) {
    for (let x = wallEndX; x + step <= container.length; x += step) {
      for (let z = 0; z + step <= container.width; z += step) {
        for (const [l, h, w] of orientations) {
          if (
            x + l <= container.length + EPSILON &&
            y + h <= container.height + EPSILON &&
            z + w <= container.width + EPSILON &&
            isFree(x, y, z, l, h, w)
          ) {
            const placement: Placement = { position: { x, y, z }, rotation: [l, h, w] };
            occupied.push(placement);
            newPlacements.push(placement);
            break;
          }
        }
      }
    }
  }

  return newPlacements;
}
