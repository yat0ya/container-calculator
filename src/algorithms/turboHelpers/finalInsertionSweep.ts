import { Placement, Container } from '../../types';

export function finalInsertionSweep(
  placements: Placement[],
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
  const occupied = [...placements];
  const newPlacements: Placement[] = [];

  const minEdge = Math.min(...orientations.flat().filter(x => x > 0));
  const step = Math.max(5, Math.floor(minEdge / 4)); // conservative, avoid over-sampling

  // Estimate where the repeated wall ends
  const xCounts = new Map<number, number>();
  for (const p of placements) {
    const x = p.position.x;
    xCounts.set(x, (xCounts.get(x) || 0) + 1);
  }

  const wallAlignedXs = Array.from(xCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([x]) => x)
    .sort((a, b) => a - b);

  const wallEndX = wallAlignedXs.length ? wallAlignedXs[wallAlignedXs.length - 1] : 0;

  const tailLength = container.length - wallEndX;
  const minBoxLength = Math.min(...orientations.map(o => o[0]));
  if (tailLength < minBoxLength) return [];

  const doesNotOverlap = (x: number, y: number, z: number, l: number, h: number, w: number) =>
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
            x + l <= container.length &&
            y + h <= container.height &&
            z + w <= container.width &&
            doesNotOverlap(x, y, z, l, h, w)
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
