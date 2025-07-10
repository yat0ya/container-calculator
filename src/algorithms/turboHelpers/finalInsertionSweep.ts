import { Placement, Container } from './types';

export function finalInsertionSweep(
  placements: Placement[],
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
  const existing = [...placements];
  let occupied = [...existing];
  const newPlacements: Placement[] = [];

  // Detect wall end using precise placement analysis
  const xPositions = new Map<number, number>();
  for (const p of existing) {
    const x = p.position.x;
    xPositions.set(x, (xPositions.get(x) || 0) + 1);
  }

  const wallAlignedXs = Array.from(xPositions.entries())
    .filter(([, count]) => count > 1)
    .map(([x]) => x)
    .sort((a, b) => a - b);

  const wallEndX = wallAlignedXs.length ? wallAlignedXs[wallAlignedXs.length - 1] : 0;
  const tailLength = container.length - wallEndX;
  const minBoxLength = Math.min(...orientations.map(o => o[0]));
  if (tailLength < minBoxLength) return [];

  // Calculate minimum box dimensions across all orientations for early exit conditions
  const minBoxHeight = Math.min(...orientations.map(o => o[1])); // height is always index 1
  const minBoxWidth = Math.min(...orientations.map(o => o[2]));  // width is always index 2

  const doesNotOverlap = (x: number, y: number, z: number, l: number, h: number, w: number) =>
    !occupied.some(p =>
      x < p.position.x + p.rotation[0] &&
      x + l > p.position.x &&
      y < p.position.y + p.rotation[1] &&
      y + h > p.position.y &&
      z < p.position.z + p.rotation[2] &&
      z + w > p.position.z
    );

  const minDim = Math.min(...orientations.flat().filter(v => v > 0));
  const step = Math.max(1, Math.floor(minDim / 8));

  // Sort orientations by volume (largest first) for better space utilization
  const sortedOrients = orientations
    .slice()
    .sort((a, b) => (b[0] * b[1] * b[2]) - (a[0] * a[1] * a[2]));

  for (let x = wallEndX; x + step <= container.length; x += step) {
    // Calculate available length at current x position
    const availableLength = container.length - x;
    
    // Filter orientations that can fit in the available length
    const validOrients = sortedOrients.filter(([l]) => l <= availableLength);
    
    // Skip if no orientations can fit
    if (validOrients.length === 0) continue;

    for (let y = 0; y + step <= container.height; y += step) {
      // Early exit: if remaining height is less than minimum box height, skip
      if (y + minBoxHeight > container.height) break;

      for (let z = 0; z + step <= container.width; z += step) {
        // Early exit: if remaining width is less than minimum box width, skip
        if (z + minBoxWidth > container.width) break;

        for (const [l, h, w] of validOrients) {
          if (
            x + l <= container.length &&
            y + h <= container.height &&
            z + w <= container.width &&
            doesNotOverlap(x, y, z, l, h, w)
          ) {
            const placement: Placement = { position: { x, y, z }, rotation: [l, h, w] };
            newPlacements.push(placement);
            occupied = [...occupied, placement]; // immutable add
            break;
          }
        }
      }
    }
  }

  return newPlacements;
}