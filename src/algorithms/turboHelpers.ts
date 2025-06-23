import { Container, Placement } from '../types';
import { EPSILON, MAX_ITERATIONS } from '../constants';
import { boxesOverlap } from '../utils';

export interface TailArea {
  startX: number;
  length: number;
  heightMap: Map<string, number>;
  gaps: Gap[];
}

export interface Gap {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

export type Axis = 'x' | 'y' | 'z';
export type PullDirection = 'down' | 'up' | 'left' | 'right' | 'back' | 'forward';

export const directionMap: Record<PullDirection, { axis: Axis; sign: -1 | 1 }> = {
  down: { axis: 'y', sign: -1 },
  up: { axis: 'y', sign: 1 },
  left: { axis: 'x', sign: -1 },
  right: { axis: 'x', sign: 1 },
  back: { axis: 'z', sign: -1 },
  forward: { axis: 'z', sign: 1 },
};

export function sortLinesVertically(placements: Placement[], container: Container): Placement[] {
  // Group boxes by their z-coordinate first (depth layers)
  const depthLayers = new Map<number, Placement[]>();
  
  placements.forEach(placement => {
    const z = Math.round(placement.position.z / EPSILON) * EPSILON;
    if (!depthLayers.has(z)) {
      depthLayers.set(z, []);
    }
    depthLayers.get(z)!.push(placement);
  });

  const result: Placement[] = [];

  // Process each depth layer separately
  depthLayers.forEach((layerPlacements, z) => {
    // Group boxes by their y-coordinate (height level)
    const lineGroups = new Map<number, Placement[]>();
    
    layerPlacements.forEach(placement => {
      const y = Math.round(placement.position.y / EPSILON) * EPSILON;
      if (!lineGroups.has(y)) {
        lineGroups.set(y, []);
      }
      lineGroups.get(y)!.push(placement);
    });

    // Calculate the effective length of each line
    const lineLengths = new Map<number, number>();
    lineGroups.forEach((boxes, y) => {
      const maxX = Math.max(...boxes.map(b => b.position.x + b.rotation[0]));
      const minX = Math.min(...boxes.map(b => b.position.x));
      lineLengths.set(y, maxX - minX);
    });

    // Sort lines by length (descending)
    const sortedYLevels = Array.from(lineGroups.keys()).sort((a, b) => 
      lineLengths.get(b)! - lineLengths.get(a)!
    );

    // Redistribute boxes vertically while maintaining relative horizontal positions
    let currentY = 0;
    
    sortedYLevels.forEach(originalY => {
      const line = lineGroups.get(originalY)!;
      
      // Sort boxes within the line by x position
      const sortedLine = [...line].sort((a, b) => a.position.x - b.position.x);
      
      sortedLine.forEach(box => {
        result.push({
          position: {
            x: box.position.x,
            y: currentY,
            z: box.position.z
          },
          rotation: box.rotation
        });
      });
      
      // Move to next vertical position based on maximum box height in this line
      const lineHeight = Math.max(...line.map(b => b.rotation[1]));
      currentY += lineHeight;
    });
  });

  return result;
}

export function removeOverlappingBoxes(placements: Placement[]): Placement[] {
  const result: Placement[] = [];

  for (const placement of placements) {
    let hasOverlap = false;
    
    // Check if this placement overlaps with any existing valid placement
    for (const existing of result) {
      if (boxesOverlap(placement, existing)) {
        hasOverlap = true;
        break;
      }
    }

    // Also verify the placement is within container bounds
    if (!hasOverlap &&
        placement.position.x >= -EPSILON &&
        placement.position.y >= -EPSILON &&
        placement.position.z >= -EPSILON) {
      result.push(placement);
    }
  }

  return result;
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
      const newPlacement = { position: { x: 0, y, z }, rotation: [l2, h2, w2] };
      
      let hasOverlap = false;
      for (const existing of placements) {
        if (boxesOverlap(newPlacement, existing)) {
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap) {
        placements.push(newPlacement);
        y += h2;
      }
    }
    z += w;
  }

  return placements;
}

export function stackColumn(orientations: [number, number, number][], height: number, width: number): [number, number, number][] {
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

export function repeatPattern(placements: Placement[], container: Container): Placement[] {
  const repeated: Placement[] = [];

  for (const { position, rotation } of placements) {
    const [l, h, w] = rotation;
    for (let x = position.x; x + l <= container.length + EPSILON; x += l) {
      const newPlacement = { 
        position: { x, y: position.y, z: position.z }, 
        rotation: [l, h, w] 
      };
      
      let hasOverlap = false;
      for (const existing of repeated) {
        if (boxesOverlap(newPlacement, existing)) {
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap) {
        repeated.push(newPlacement);
      }
    }
  }

  return repeated;
}

export function prepareTailArea(placements: Placement[], container: Container): TailArea {
  const GRID_SIZE = 0.1;

  let maxX = 0;
  for (const p of placements) {
    const endX = p.position.x + p.rotation[0];
    if (endX > maxX) maxX = endX;
  }

  const startX = Math.floor(maxX / GRID_SIZE) * GRID_SIZE;
  const heightMap = new Map<string, number>();
  const gaps: Gap[] = [];

  for (let z = 0; z < container.width; z += GRID_SIZE) {
    for (let y = 0; y < container.height; y += GRID_SIZE) {
      const key = `${y.toFixed(3)},${z.toFixed(3)}`;
      heightMap.set(key, 0);
    }
  }

  for (const p of placements) {
    const endX = p.position.x + p.rotation[0];
    if (endX > startX - EPSILON) {
      const overhang = endX - startX;
      
      if (overhang > EPSILON) {
        for (let z = p.position.z; z < p.position.z + p.rotation[2]; z += GRID_SIZE) {
          for (let y = p.position.y; y < p.position.y + p.rotation[1]; y += GRID_SIZE) {
            const key = `${y.toFixed(3)},${z.toFixed(3)}`;
            heightMap.set(key, Math.max(heightMap.get(key) || 0, overhang));
          }
        }

        if (p.position.y > EPSILON) {
          gaps.push({
            x: startX,
            y: 0,
            z: p.position.z,
            width: p.rotation[2],
            height: p.position.y,
            depth: overhang
          });
        }
      }
    }
  }

  for (let z = 0; z < container.width; z += GRID_SIZE) {
    let maxHeight = 0;
    for (let y = container.height - GRID_SIZE; y >= 0; y -= GRID_SIZE) {
      const key = `${y.toFixed(3)},${z.toFixed(3)}`;
      const height = heightMap.get(key) || 0;
      maxHeight = Math.max(maxHeight, height);
      heightMap.set(key, maxHeight);
    }
  }

  return {
    startX,
    length: container.length - startX,
    heightMap,
    gaps
  };
}

export function fillTailArea(tail: TailArea, container: Container, orientations: [number, number, number][]): Placement[] {
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

export function applyPull(placements: Placement[], direction: PullDirection): void {
  const { axis, sign } = directionMap[direction];
  const axisIdx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  const orthogonalAxes = ['x', 'y', 'z'].filter(a => a !== axis) as Axis[];
  const orthoIdx = orthogonalAxes.map(a => (a === 'x' ? 0 : a === 'y' ? 1 : 2));

  let moved: boolean;
  let iterations = 0;

  do {
    moved = false;
    iterations++;

    for (const box of placements) {
      const currentPos = box.position[axis];
      let targetPos = sign === -1 ? 0 : Number.POSITIVE_INFINITY;

      for (const other of placements) {
        if (other === box) continue;

        const overlaps = orthoIdx.every(i => {
          const ortho = ['x', 'y', 'z'][i] as Axis;
          return !(box.position[ortho] + box.rotation[i] <= other.position[ortho] ||
            other.position[ortho] + other.rotation[i] <= box.position[ortho]);
        });

        if (!overlaps) continue;

        const otherEdge = sign === -1
          ? other.position[axis] + other.rotation[axisIdx]
          : other.position[axis];

        if (sign === -1 && otherEdge <= currentPos + EPSILON && otherEdge > targetPos) {
          targetPos = otherEdge;
        } else if (sign === 1 && otherEdge >= currentPos - EPSILON && otherEdge < targetPos) {
          targetPos = otherEdge;
        }
      }

      if (Math.abs(currentPos - targetPos) > EPSILON) {
        box.position[axis] = targetPos;
        moved = true;
      }
    }
  } while (moved && iterations < MAX_ITERATIONS);
}