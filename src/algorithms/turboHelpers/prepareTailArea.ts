import { Container, Placement, Gap, TailArea } from './types';

export function prepareTailArea(placements: Placement[], container: Container): TailArea {
  if (placements.length === 0) {
    return {
      startX: 0,
      length: container.length,
      heightMap: new Map(),
      gaps: []
    };
  }

  // Calculate dynamic grid size based on minimum box dimension
  const minBoxDim = Math.min(
    ...placements.flatMap(p => p.rotation).filter(dim => dim > 0)
  );
  const effectiveGridSize = Math.max(5, Math.min(50, Math.floor(minBoxDim / 4)));

  // Build density map to find the main packed volume
  const xDensity = new Map<number, number>();
  
  for (const p of placements) {
    // Use the start position of each box for density calculation
    const xGrid = Math.floor(p.position.x / effectiveGridSize) * effectiveGridSize;
    xDensity.set(xGrid, (xDensity.get(xGrid) || 0) + 1);
  }

  // Find the x-grid with maximum density (main packed volume)
  let maxDensityX = 0;
  let maxDensity = 0;
  
  for (const [xGrid, density] of xDensity.entries()) {
    if (density > maxDensity) {
      maxDensity = density;
      maxDensityX = xGrid;
    }
  }

  // Set startX after the main packed volume
  const startX = maxDensityX + effectiveGridSize;
  const tailLength = container.length - startX;

  // Initialize heightMap for the entire container space
  const heightMap = new Map<string, number>();
  
  // Initialize all grid points to zero
  for (let x = 0; x < container.length; x += effectiveGridSize) {
    for (let z = 0; z < container.width; z += effectiveGridSize) {
      const key = `${x},${z}`;
      heightMap.set(key, 0);
    }
  }

  // Update heightMap with actual top surfaces of ALL placements
  for (const p of placements) {
    const topY = p.position.y + p.rotation[1]; // Top surface of the box
    
    // Calculate grid coverage for this box
    const xStart = Math.floor(p.position.x / effectiveGridSize) * effectiveGridSize;
    const xEnd = Math.ceil((p.position.x + p.rotation[0]) / effectiveGridSize) * effectiveGridSize;
    const zStart = Math.floor(p.position.z / effectiveGridSize) * effectiveGridSize;
    const zEnd = Math.ceil((p.position.z + p.rotation[2]) / effectiveGridSize) * effectiveGridSize;

    // Update heightMap for all grid points covered by this box
    for (let x = xStart; x < xEnd && x < container.length; x += effectiveGridSize) {
      for (let z = zStart; z < zEnd && z < container.width; z += effectiveGridSize) {
        const key = `${x},${z}`;
        const currentHeight = heightMap.get(key) || 0;
        heightMap.set(key, Math.max(currentHeight, topY));
      }
    }
  }

  // Filter tail boxes (only those that extend into or beyond the tail area)
  const tailBoxes = placements.filter(p => p.position.x + p.rotation[0] > startX);

  // Generate gaps from tail boxes
  const gaps: Gap[] = [];
  for (const p of tailBoxes) {
    // Only create gaps for boxes that have space underneath (y > 0)
    if (p.position.y > 0) {
      const gapLength = Math.min(p.rotation[0], (p.position.x + p.rotation[0]) - startX);
      
      gaps.push({
        x: Math.max(p.position.x, startX),
        y: 0,
        z: p.position.z,
        width: p.rotation[2],
        height: p.position.y,
        length: gapLength
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