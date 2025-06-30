import { Container, Placement, Gap, TailArea } from './types';

export function prepareTailArea(placements: Placement[], container: Container): TailArea {
  const GRID_SIZE = 10; // 10 mm grid

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
    if (endX > maxX) maxX = endX;
  }

  let secondMaxX = 0;
  let countAtMax = 0;
  for (const p of placements) {
    const endX = p.position.x + p.rotation[0];
    if (endX > secondMaxX && endX < maxX) secondMaxX = endX;
    if (endX === maxX) countAtMax++;
  }

  // 2. Decide tailStart (remove protrusions if minor)
  let tailStart = maxX;
  const threshold = Math.round(0.2 * container.length);
  if (countAtMax <= 2 || (maxX - secondMaxX) > threshold) {
    tailStart = secondMaxX || maxX;
  }

  // 3. Remove protruding boxes and isolate them
  const tailBoxes = placements.filter(p => (p.position.x + p.rotation[0]) >= tailStart);
  placements = placements.filter(p => (p.position.x + p.rotation[0]) < tailStart);

  // 4. Align tail start and compute length
  const startX = Math.floor(tailStart / GRID_SIZE) * GRID_SIZE;
  const tailLength = container.length - startX;

  // 5. Init heightMap
  const heightMap = new Map<string, number>();
  for (let z = 0; z < container.width; z += GRID_SIZE) {
    for (let y = 0; y < container.height; y += GRID_SIZE) {
      heightMap.set(`${y},${z}`, 0);
    }
  }

  // 6. Add overhangs and gaps
  const gaps: Gap[] = [];

  for (const p of tailBoxes) {
    const endX = p.position.x + p.rotation[0];
    const overhang = endX - startX;

    for (let z = p.position.z; z < p.position.z + p.rotation[2]; z += GRID_SIZE) {
      for (let y = p.position.y; y < p.position.y + p.rotation[1]; y += GRID_SIZE) {
        const key = `${y},${z}`;
        const current = heightMap.get(key) || 0;
        heightMap.set(key, Math.max(current, overhang));
      }
    }

    if (p.position.y > 0) {
      gaps.push({
        x: p.position.x,
        y: 0,
        z: p.position.z,
        width: p.rotation[2],
        height: p.position.y,
        length: overhang // renamed from 'depth' for dimensional consistency
      });
    }
  }

  return { startX, length: tailLength, heightMap, gaps };
}
