import { Placement, Container } from './types';
import { boxesOverlap } from '../turboHelpers/utils';

/**
 * Fills leftover tail space by adding boxes on top of final stack surfaces.
 * Uses precise millimeter coordinates and adaptive grid sizing.
 */
export function patchSmallGaps(
  existing: Placement[],
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
  // Adaptive grid based on smallest box dimension
  const minBoxDim = Math.min(...orientations.flat().filter(x => x > 0));
  const GRID = Math.max(2, Math.min(20, Math.floor(minBoxDim / 10))); // 2-20mm adaptive grid
  
  const newPlacements: Placement[] = [];
  const all = [...existing];

  // Detect start of tail based on placement density analysis
  const xDensity = new Map<number, number>();
  for (const p of existing) {
    const xGrid = Math.floor(p.position.x / (minBoxDim / 2)) * (minBoxDim / 2);
    xDensity.set(xGrid, (xDensity.get(xGrid) || 0) + 1);
  }

  const sortedXs = [...xDensity.entries()].sort((a, b) => b[1] - a[1]);
  const denseX = sortedXs.find(([, count]) => count > 1)?.[0] ?? 0;
  const tailStartX = denseX + minBoxDim; // Start tail after dense region

  // Pre-filter orientations that fit in container
  const validOrients = orientations.filter(([l, h, w]) =>
    l <= container.length &&
    h <= container.height &&
    w <= container.width
  );

  // Build precise top surface map
  const topSurfaces = new Map<string, number>();

  for (const p of all) {
    const topY = p.position.y + p.rotation[1];
    
    // Use precise box boundaries
    const xStart = p.position.x;
    const xEnd = p.position.x + p.rotation[0];
    const zStart = p.position.z;
    const zEnd = p.position.z + p.rotation[2];

    // Grid sample the box surface
    for (let x = xStart; x < xEnd; x += GRID) {
      if (x < tailStartX) continue;

      for (let z = zStart; z < zEnd; z += GRID) {
        const key = `${Math.floor(x / GRID) * GRID},${Math.floor(z / GRID) * GRID}`;
        const current = topSurfaces.get(key) ?? 0;
        topSurfaces.set(key, Math.max(current, topY));
      }
    }
  }

  // Sort orientations by volume (largest first for better space utilization)
  const sortedOrients = validOrients.sort((a, b) => 
    (b[0] * b[1] * b[2]) - (a[0] * a[1] * a[2])
  );

  // Attempt placement at each surface position
  for (const [key, y] of topSurfaces.entries()) {
    const [x, z] = key.split(',').map(Number);

    for (const [l, h, w] of sortedOrients) {
      const pos = { x, y, z };

      // Precise boundary checks
      if (
        pos.x + l > container.length ||
        pos.y + h > container.height ||
        pos.z + w > container.width
      ) continue;

      const newBox: Placement = {
        position: pos,
        rotation: [l, h, w]
      };

      // Check for overlaps with existing boxes
      if (!all.some(p => boxesOverlap(newBox, p))) {
        newPlacements.push(newBox);
        all.push(newBox);
        
        // Update surface map for stacking
        for (let xi = pos.x; xi < pos.x + l; xi += GRID) {
          for (let zi = pos.z; zi < pos.z + w; zi += GRID) {
            const surfaceKey = `${Math.floor(xi / GRID) * GRID},${Math.floor(zi / GRID) * GRID}`;
            topSurfaces.set(surfaceKey, pos.y + h);
          }
        }
        
        break; // Found placement, try next position
      }
    }
  }

  return newPlacements;
}