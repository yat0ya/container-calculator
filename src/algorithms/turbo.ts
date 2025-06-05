import { BoxDimensions, Container, CalculationResult, Placement } from '../types';
import { convertToMeters } from '../utils';

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  const boxInMeters = convertToMeters(box);
  const orientations = generateOrientations(boxInMeters);
  const initialWall = buildWall(container, orientations);
  const repeated = repeatPattern(initialWall, container);

  const sortedPlacements = [...repeated].sort((a, b) =>
    (a.position.x + a.rotation[0]) - (b.position.x + b.rotation[0])
  );

  const tailArea = prepareTailArea(sortedPlacements, container, boxInMeters);
  const filledTail = fillTailArea(tailArea, container, orientations);

  const allPlacements = [...repeated, ...filledTail];
  const validPlacements = removeOverlappingBoxes(allPlacements);

  return {
    totalBoxes: validPlacements.length,
    placements: validPlacements,
    boxInMeters
  };
}

function generateOrientations({ length, width, height }: BoxDimensions): [number, number, number][] {
  return [
    [length, width, height], [length, height, width],
    [width, length, height], [width, height, length],
    [height, length, width], [height, width, length],
  ];
}

function boxesOverlap(a: Placement, b: Placement): boolean {
  const epsilon = 1e-6;
  return !(
    a.position.x + a.rotation[0] <= b.position.x + epsilon ||
    b.position.x + b.rotation[0] <= a.position.x + epsilon ||
    a.position.y + a.rotation[1] <= b.position.y + epsilon ||
    b.position.y + b.rotation[1] <= a.position.y + epsilon ||
    a.position.z + a.rotation[2] <= b.position.z + epsilon ||
    b.position.z + b.rotation[2] <= a.position.z + epsilon
  );
}

function removeOverlappingBoxes(placements: Placement[]): Placement[] {
  const result: Placement[] = [];
  const epsilon = 1e-6;

  for (const placement of placements) {
    let hasOverlap = false;

    for (const existing of result) {
      if (boxesOverlap(placement, existing)) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap &&
        placement.position.x >= -epsilon &&
        placement.position.y >= -epsilon &&
        placement.position.z >= -epsilon) {
      result.push(placement);
    }
  }

  return result;
}

function buildWall(container: Container, orientations: [number, number, number][]): Placement[] {
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
      repeated.push({
        position: { x, y: position.y, z: position.z },
        rotation: [l, h, w]
      });
    }
  }

  return repeated;
}


interface TailArea {
  startX: number;
  length: number;
  heightMap: Map<string, number>;
  gaps: {
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    depth: number;
  }[];
}

function prepareTailArea(placements: Placement[], container: Container, box: BoxDimensions): TailArea {
  const EPSILON = 1e-6;
  const GRID_SIZE = 0.1;

  let maxX = 0;
  for (const p of placements) {
    const endX = p.position.x + p.rotation[0];
    if (endX > maxX) maxX = endX;
  }

  const startX = Math.floor(maxX / GRID_SIZE) * GRID_SIZE;
  const heightMap = new Map<string, number>();
  const gaps: TailArea["gaps"] = [];

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

function fillTailArea(tail: TailArea, container: Container, orientations: [number, number, number][]): Placement[] {
  const EPSILON = 1e-6;
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
        const required = tail.heightMap.get(key) || 0;
        if (x < tail.startX + required - EPSILON) return false;
      }
    }

    const newPlacement = { position: { x, y, z }, rotation: [l, h, w] };
    return !placements.some(p => boxesOverlap(newPlacement, p));
  }

  const sorted = [...orientations].sort((a, b) => b[0] * b[1] * b[2] - a[0] * a[1] * a[2]);

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
