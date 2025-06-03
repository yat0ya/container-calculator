import { BoxDimensions, Container, CalculationResult, Placement } from '../types';
import { convertToMeters } from '../utils';

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  const boxInMeters = convertToMeters(box);
  const orientations = generateOrientations(boxInMeters);
  const initialWall = buildWall(container, orientations);
  const repeated = repeatPattern(initialWall, container);

  const tailArea = prepareTailArea(repeated, container);
  const filledTail = fillTailArea(tailArea, container, orientations);

  return { totalBoxes: repeated.length + filledTail.length, placements: [...repeated, ...filledTail], boxInMeters };
}

function generateOrientations({ length, width, height }: BoxDimensions): [number, number, number][] {
  return [
    [length, width, height], [length, height, width],
    [width, length, height], [width, height, length],
    [height, length, width], [height, width, length],
  ];
}

export function buildWall(container: Container, orientations: [number, number, number][]): Placement[] {
  const allOrientations = Array.from(new Set(
    orientations.flatMap(([l, h, w]) => [
      [l, h, w], [l, w, h], [h, l, w],
      [h, w, l], [w, l, h], [w, h, l],
    ].map(JSON.stringify))
  )).map(s => JSON.parse(s));

  const TIME_LIMIT = 1000;
  const MAX_DEPTH = 30;
  const start = Date.now();
  const memo = new Set<string>();
  let best: [number, number, number][] = [];

  const scoreLayout = (layout: [number, number, number][]) =>
    layout.reduce((sum, [, h, w]) => sum + h * w, 0);

  function layoutKey(layout: [number, number, number][]) {
    return layout.map(([, h, w]) => `${h.toFixed(2)}x${w.toFixed(2)}`).join('|');
  }

  function backtrack(layout: [number, number, number][], widthLeft: number, depth: number) {
    if (Date.now() - start > TIME_LIMIT || depth > MAX_DEPTH) return;
    const key = layoutKey(layout);
    if (memo.has(key)) return;
    memo.add(key);

    if (scoreLayout(layout) > scoreLayout(best)) best = [...layout];

    const candidates = allOrientations
      .filter(([, , w]) => w <= widthLeft)
      .sort((a, b) => b[2] - a[2]);

    for (const o of candidates) {
      backtrack([...layout, o], widthLeft - o[2], depth + 1);
    }
  }

  backtrack([], container.width, 0);
  if (!best.length) return [];

  const rotationCounts = new Map<string, number>();
  for (const rot of best) {
    const key = JSON.stringify(rot);
    rotationCounts.set(key, (rotationCounts.get(key) || 0) + 1);
  }

  const sortedLayout = best.slice().sort((a, b) => {
    const countA = rotationCounts.get(JSON.stringify(a)) || 0;
    const countB = rotationCounts.get(JSON.stringify(b)) || 0;
    return countB - countA;
  });

  const placements: Placement[] = [];
  let z = 0;

  for (const [l, h, w] of sortedLayout) {
    const stack = stackColumn(allOrientations, container.height, w);
    const localCounts = new Map<string, number>();
    
    for (const rot of stack) {
      const key = JSON.stringify(rot);
      localCounts.set(key, (localCounts.get(key) || 0) + 1);
    }

    const sortedStack = stack.slice().sort((a, b) => {
      const countA = localCounts.get(JSON.stringify(a)) || 0;
      const countB = localCounts.get(JSON.stringify(b)) || 0;
      return countA - countB;
    }).reverse();

    let y = 0;
    for (const [l2, h2, w2] of sortedStack) {
      placements.push({ position: { x: 0, y, z }, rotation: [l2, h2, w2] });
      y += h2;
    }
    z += w;
  }

  return placements;
}

function stackColumn(orientations: [number, number, number][], height: number, width: number): [number, number, number][] {
  const fits = orientations.filter(([, h, w]) => w === width && h <= height);
  let bestStack: [number, number, number][] = [], bestScore = 0;

  function recurse(remaining: number, stack: [number, number, number][]) {
    for (const box of fits) {
      const [, h] = box;
      if (h > remaining) continue;

      const next = [...stack, box];
      const score = next.reduce((sum, [, h, w]) => sum + h * w, 0);
      if (score > bestScore) [bestStack, bestScore] = [next, score];

      recurse(remaining - h, next);
    }
  }

  recurse(height, []);
  return bestStack;
}

function repeatPattern(placements: Placement[], container: Container): Placement[] {
  const repeated: Placement[] = [];
  const EPSILON = 1e-6;

  for (const { position, rotation } of placements) {
    const [l, h, w] = rotation;
    for (let x = position.x; x + l <= container.length + EPSILON; x += l) {
      repeated.push({ position: { x, y: position.y, z: position.z }, rotation: [l, h, w] });
    }
  }

  return repeated;
}

interface TailArea {
  startX: number;
  length: number;
  heightMap: Map<string, number>;
}

function prepareTailArea(placements: Placement[], container: Container): TailArea {
  const EPSILON = 1e-6;
  const GRID_SIZE = 0.1; // 10cm grid for height mapping

  // Find the furthest X extent
  let maxX = 0;
  for (const p of placements) {
    const endX = p.position.x + p.rotation[0];
    if (endX > maxX) maxX = endX;
  }

  // Snap to nearest grid point
  const startX = Math.ceil(maxX / GRID_SIZE) * GRID_SIZE;
  
  // Create height map for the irregular surface
  const heightMap = new Map<string, number>();
  
  // Initialize height map with zero heights
  for (let z = 0; z < container.width; z += GRID_SIZE) {
    for (let y = 0; y < container.height; y += GRID_SIZE) {
      const key = `${y.toFixed(3)},${z.toFixed(3)}`;
      heightMap.set(key, 0);
    }
  }

  // Update height map based on protruding boxes
  for (const p of placements) {
    if (p.position.x + p.rotation[0] > startX - EPSILON) {
      const protrusion = p.position.x + p.rotation[0] - startX;
      if (protrusion > EPSILON) {
        for (let z = p.position.z; z < p.position.z + p.rotation[2]; z += GRID_SIZE) {
          for (let y = p.position.y; y < p.position.y + p.rotation[1]; y += GRID_SIZE) {
            const key = `${y.toFixed(3)},${z.toFixed(3)}`;
            heightMap.set(key, Math.max(heightMap.get(key) || 0, protrusion));
          }
        }
      }
    }
  }

  return {
    startX,
    length: container.length - startX,
    heightMap
  };
}

function fillTailArea(
  tail: TailArea,
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
  const EPSILON = 1e-6;
  const GRID_SIZE = 0.1;
  const placements: Placement[] = [];
  const occupied = new Set<string>();

  function canPlace(x: number, y: number, z: number, l: number, h: number, w: number): boolean {
    if (x + l > container.length + EPSILON ||
        y + h > container.height + EPSILON ||
        z + w > container.width + EPSILON) return false;

    // Check if space is already occupied
    for (let dx = 0; dx < l; dx += GRID_SIZE) {
      for (let dy = 0; dy < h; dy += GRID_SIZE) {
        for (let dz = 0; dz < w; dz += GRID_SIZE) {
          const key = `${(x + dx).toFixed(3)},${(y + dy).toFixed(3)},${(z + dz).toFixed(3)}`;
          if (occupied.has(key)) return false;
        }
      }
    }

    // Check if box fits with the height map
    if (x < tail.startX + EPSILON) {
      for (let z = 0; z < w; z += GRID_SIZE) {
        for (let y = 0; y < h; y += GRID_SIZE) {
          const key = `${y.toFixed(3)},${z.toFixed(3)}`;
          const minX = tail.heightMap.get(key) || 0;
          if (x < tail.startX + minX - EPSILON) return false;
        }
      }
    }

    return true;
  }

  function markOccupied(x: number, y: number, z: number, l: number, h: number, w: number) {
    for (let dx = 0; dx < l; dx += GRID_SIZE) {
      for (let dy = 0; dy < h; dy += GRID_SIZE) {
        for (let dz = 0; dz < w; dz += GRID_SIZE) {
          const key = `${(x + dx).toFixed(3)},${(y + dy).toFixed(3)},${(z + dz).toFixed(3)}`;
          occupied.add(key);
        }
      }
    }
  }

  // Sort orientations by volume for greedy placement
  const sorted = [...orientations].sort((a, b) => b[0] * b[1] * b[2] - a[0] * a[1] * b[2]);

  // Try to place boxes starting from the tail area
  for (let x = tail.startX; x + GRID_SIZE <= container.length; x += GRID_SIZE) {
    for (let y = 0; y + GRID_SIZE <= container.height; y += GRID_SIZE) {
      for (let z = 0; z + GRID_SIZE <= container.width; z += GRID_SIZE) {
        for (const [l, h, w] of sorted) {
          if (canPlace(x, y, z, l, h, w)) {
            placements.push({
              position: { x, y, z },
              rotation: [l, h, w]
            });
            markOccupied(x, y, z, l, h, w);
            break;
          }
        }
      }
    }
  }

  return placements;
}