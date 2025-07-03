import { Container, Placement, Gap, TailArea } from './types';

export function prepareTailArea(placements: Placement[], container: Container): TailArea {
  const GRID_SIZE = 10;

  if (placements.length === 0) {
    return {
      startX: 0,
      length: container.length,
      heightMap: new Map(),
      gaps: []
    };
  }

  // 1. Extract endX values
  const endXValues = new Set<number>();
  for (const p of placements) {
    endXValues.add(p.position.x + p.rotation[0]);
  }

  const sortedEndXs = Array.from(endXValues).sort((a, b) => b - a);
  const maxX = sortedEndXs[0] || 0;
  const secondMaxX = sortedEndXs[1] || 0;

  const countAtMax = placements.filter(p => p.position.x + p.rotation[0] === maxX).length;

  // 2. Decide tailStart
  const threshold = 0.2 * container.length;
  const tailStart = (countAtMax <= 2 || (maxX - secondMaxX) > threshold)
    ? (secondMaxX || maxX)
    : maxX;

  // 3. Partition placements into wall and tail
  const tailBoxes = placements.filter(p => p.position.x + p.rotation[0] >= tailStart);
  const startX = tailStart;
  const tailLength = container.length - startX;

  // 4. Initialize heightMap
  let heightMap = new Map<string, number>();
  for (let z = 0; z < container.width; z += GRID_SIZE) {
    for (let y = 0; y < container.height; y += GRID_SIZE) {
      heightMap.set(`${y},${z}`, 0);
    }
  }

  // 5. Compute gaps and update heightMap immutably
  const gaps: Gap[] = [];
  for (const p of tailBoxes) {
    const endX = p.position.x + p.rotation[0];
    const overhang = endX - startX;

    const zStart = Math.floor(p.position.z / GRID_SIZE) * GRID_SIZE;
    const zEnd = Math.ceil((p.position.z + p.rotation[2]) / GRID_SIZE) * GRID_SIZE;
    const yStart = Math.floor(p.position.y / GRID_SIZE) * GRID_SIZE;
    const yEnd = Math.ceil((p.position.y + p.rotation[1]) / GRID_SIZE) * GRID_SIZE;

    const newEntries: [string, number][] = [];

    for (let z = zStart; z < zEnd && z < container.width; z += GRID_SIZE) {
      for (let y = yStart; y < yEnd && y < container.height; y += GRID_SIZE) {
        const key = `${y},${z}`;
        const current = heightMap.get(key) || 0;
        newEntries.push([key, Math.max(current, overhang)]);
      }
    }

    heightMap = new Map([...heightMap, ...newEntries]);

    if (p.position.y > 0) {
      gaps.push({
        x: p.position.x,
        y: 0,
        z: p.position.z,
        width: p.rotation[2],
        height: p.position.y,
        length: overhang
      });
    }
  }

  return {
    startX,
    length: tailLength,
    heightMap,
    gaps
  };
}
