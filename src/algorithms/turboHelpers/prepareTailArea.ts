import { Container, Placement, Gap, TailArea } from './types';

export function prepareTailArea(placements: Placement[], container: Container): TailArea {
  const GRID_SIZE = 10; // 10 mm grid

  // Create a copy to avoid modifying the original array
  let workingPlacements = [...placements];

  if (workingPlacements.length === 0) {
    return {
      startX: 0,
      length: container.length,
      heightMap: new Map(),
      gaps: []
    };
  }

  // 1. Collect all unique endX values and sort them
  const endXValues = new Set<number>();
  for (const p of workingPlacements) {
    const endX = p.position.x + p.rotation[0];
    endXValues.add(endX);
  }

  const sortedEndXs = Array.from(endXValues).sort((a, b) => b - a);
  const maxX = sortedEndXs[0] || 0;
  const secondMaxX = sortedEndXs[1] || 0;

  // Count boxes at maxX
  let countAtMax = 0;
  for (const p of workingPlacements) {
    const endX = p.position.x + p.rotation[0];
    if (endX === maxX) countAtMax++;
  }

  // 2. Decide tailStart (remove protrusions if minor)
  let tailStart = maxX;
  const threshold = 0.2 * container.length; // Remove Math.round for precision
  if (countAtMax <= 2 || (maxX - secondMaxX) > threshold) {
    tailStart = secondMaxX || maxX;
  }

  // 3. Remove protruding boxes and isolate them
  const tailBoxes = workingPlacements.filter(p => (p.position.x + p.rotation[0]) >= tailStart);
  workingPlacements = workingPlacements.filter(p => (p.position.x + p.rotation[0]) < tailStart);

  // 4. Use precise tailStart as startX (no grid snapping)
  const startX = tailStart;
  const tailLength = container.length - startX;

  // 5. Initialize heightMap with grid-based keys
  const heightMap = new Map<string, number>();
  for (let z = 0; z < container.width; z += GRID_SIZE) {
    for (let y = 0; y < container.height; y += GRID_SIZE) {
      heightMap.set(`${y},${z}`, 0);
    }
  }

  // 6. Add overhangs and gaps from tail boxes
  const gaps: Gap[] = [];

  for (const p of tailBoxes) {
    const endX = p.position.x + p.rotation[0];
    const overhang = endX - startX;

    // Grid-align the box coverage for heightMap updates
    const zStart = Math.floor(p.position.z / GRID_SIZE) * GRID_SIZE;
    const zEnd = Math.ceil((p.position.z + p.rotation[2]) / GRID_SIZE) * GRID_SIZE;
    const yStart = Math.floor(p.position.y / GRID_SIZE) * GRID_SIZE;
    const yEnd = Math.ceil((p.position.y + p.rotation[1]) / GRID_SIZE) * GRID_SIZE;

    // Update heightMap for all grid cells covered by this box
    for (let z = zStart; z < zEnd && z < container.width; z += GRID_SIZE) {
      for (let y = yStart; y < yEnd && y < container.height; y += GRID_SIZE) {
        const key = `${y},${z}`;
        const current = heightMap.get(key) || 0;
        heightMap.set(key, Math.max(current, overhang));
      }
    }

    // Add gap below the box if it's elevated
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