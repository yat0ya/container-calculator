import { BoxDimensions, Container, CalculationResult, Placement } from '../types';
import { convertToMeters } from '../utils';

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  const boxInMeters = convertToMeters(box);
  const orientations = generateOrientations(boxInMeters);
  const initialWall = buildWall(container, orientations);
  const repeated = repeatPattern(initialWall, container);

  const variants = generateTailRepackVariants(repeated, container, orientations, 5);
  const best = variants.reduce((a, b) => (b.length > a.length ? b : a));

  return { totalBoxes: best.length, placements: best, boxInMeters };
}

function generateOrientations({ length, width, height }: BoxDimensions): [number, number, number][] {
  return [
    [length, width, height], [length, height, width],
    [width, length, height], [width, height, length],
    [height, length, width], [height, width, length],
  ];
}

function generateTailRepackVariants(
  placements: Placement[],
  container: Container,
  orientations: [number, number, number][],
  maxVariants: number
): Placement[][] {
  const epsilon = 1e-4;
  const ends = [...new Set(placements.map(p => p.position.x + p.rotation[0]))].sort((a, b) => b - a);
  const variants: Placement[][] = [placements];

  for (let i = 0; i < Math.min(maxVariants, ends.length); i++) {
    const cutoff = ends[i];
    const preserved = placements.filter(p => p.position.x < cutoff - epsilon);
    const repacked = repackTailLayered(preserved, container, orientations, cutoff);
    variants.push([...preserved, ...repacked]);
  }

  return variants;
}

function repackTailLayered(
  preserved: Placement[],
  container: Container,
  orientations: [number, number, number][],
  minX: number
): Placement[] {
  const epsilon = 1e-4;
  const repacked: Placement[] = [];
  const sorted = [...orientations].sort((a, b) => a[0] - b[0]);

  for (let x = minX; x < container.length + epsilon; x += 0.01) {
    for (const [l, h, w] of sorted) {
      if (x + l > container.length + epsilon) continue;

      const yMax = Math.floor(container.height / h);
      const zMax = Math.floor(container.width / w);

      for (let zi = 0; zi <= zMax; zi++) {
        const z = zi * w;
        if (z + w > container.width + epsilon) continue;

        for (let yi = 0; yi <= yMax; yi++) {
          const y = yi * h;
          if (y + h > container.height + epsilon) continue;

          const candidate: Placement = { position: { x, y, z }, rotation: [l, h, w] };
          const allPlaced = [...preserved, ...repacked];

          const supported = y === 0 || allPlaced.some(b =>
            Math.abs(b.position.y + b.rotation[1] - y) < epsilon * 10 &&
            b.position.x < x + l - epsilon && b.position.x + b.rotation[0] > x + epsilon &&
            b.position.z < z + w - epsilon && b.position.z + b.rotation[2] > z + epsilon
          );

          const collides = allPlaced.some(b => boxesOverlap(b, candidate, epsilon));

          if (!collides && supported) repacked.push(candidate);
        }
      }
    }
  }

  return repacked;
}

export function buildWall(container: Container, orientations: [number, number, number][]): Placement[] {
  const allOrientations = Array.from(new Set(
    orientations.flatMap(([l, h, w]) => [
      [l, h, w], [l, w, h], [h, l, w],
      [h, w, l], [w, l, h], [w, h, l],
    ].map(JSON.stringify))
  )).map(s => JSON.parse(s) as [number, number, number]);

  const startTime = Date.now();
  const memo = new Set<string>();
  const TIME_LIMIT = 1000;
  const MAX_DEPTH = 30;
  let best: { layout: [number, number, number][], score: number } | null = null;

  const columnCache = new Map<string, { score: number; stack: [number, number, number][] }>();

  const scoreLayout = (layout: [number, number, number][]): number =>
    layout.reduce((sum, [, h, w]) => sum + h * w, 0);

  function layoutKey(layout: [number, number, number][]) {
    return layout.map(([, h, w]) => `${h.toFixed(2)}x${w.toFixed(2)}`).join('|');
  }

  function findBestColumnPacking(height: number, width: number) {
    const cacheKey = `${height.toFixed(2)}-${width.toFixed(2)}`;
    if (columnCache.has(cacheKey)) return columnCache.get(cacheKey)!;

    const fits = allOrientations.filter(([, h, w]) => w === width && h <= height);
    let bestStack: [number, number, number][] = [], bestScore = 0;

    function recurse(remaining: number, stack: [number, number, number][]) {
      for (const box of fits) {
        const [, h] = box;
        if (h > remaining) continue;

        const nextStack = [...stack, box];
        const score = nextStack.reduce((s, [, h, w]) => s + h * w, 0);
        if (score > bestScore) [bestStack, bestScore] = [nextStack, score];

        recurse(remaining - h, nextStack);
      }
    }

    recurse(height, []);

    const grouped = new Map<string, [number, number, number][]>();
    for (const box of bestStack) {
      const key = JSON.stringify(box);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(box);
    }

    const sorted = [...grouped.values()].sort((a, b) => b.length - a.length).flat();
    const result = { score: bestScore, stack: sorted };
    columnCache.set(cacheKey, result);
    return result;
  }

  function backtrack(layout: [number, number, number][], widthLeft: number, depth: number) {
    if (Date.now() - startTime > TIME_LIMIT || depth > MAX_DEPTH) return;

    const key = layoutKey(layout);
    if (memo.has(key)) return;
    memo.add(key);

    if (layout.length > 0) {
      const score = scoreLayout(layout);
      if (!best || score > best.score) best = { layout: [...layout], score };
    }

    const sorted = allOrientations
      .filter(([, , w]) => w > 0.01 && w <= widthLeft)
      .sort((a, b) => b[2] - a[2]);

    for (const orientation of sorted) {
      const [, , w] = orientation;
      backtrack([...layout, orientation], widthLeft - w, depth + 1);
    }
  }

  backtrack([], container.width, 0);

  if (!best) return [];

  // Count how often each rotation occurs
  const rotationCounts = new Map<string, number>();
  for (const rot of best.layout) {
    const key = JSON.stringify(rot);
    rotationCounts.set(key, (rotationCounts.get(key) || 0) + 1);
  }

  // Sort layout by frequency descending
  const sortedLayout = best.layout.slice().sort((a, b) => {
    const countA = rotationCounts.get(JSON.stringify(a)) || 0;
    const countB = rotationCounts.get(JSON.stringify(b)) || 0;
    return countB - countA;
  });

  const placements: Placement[] = [];
  let z = 0;

  for (const [l, h, w] of sortedLayout) {
    const { stack } = findBestColumnPacking(container.height, w);

    // Count rotation frequencies in the column stack
    const localCounts = new Map<string, number>();
    for (const rot of stack) {
      const key = JSON.stringify(rot);
      localCounts.set(key, (localCounts.get(key) || 0) + 1);
    }

    // Sort so frequent orientations go to the bottom (placed first)
    const sortedStack = stack.slice().sort((a, b) => {
      const countA = localCounts.get(JSON.stringify(a)) || 0;
      const countB = localCounts.get(JSON.stringify(b)) || 0;
      return countB - countA;
    });

    let y = 0;
    for (const [l2, h2, w2] of sortedStack) {
      placements.push({ position: { x: 0, y, z }, rotation: [l2, h2, w2] });
      y += h2;
    }

    z += w;
  }


  return placements;
}


function repeatPattern(placements: Placement[], container: Container): Placement[] {
  const repeated: Placement[] = [];

  for (const { position, rotation } of placements) {
    const [l, h, w] = rotation;
    for (let x = position.x; x + l <= container.length; x += l) {
      repeated.push({ position: { x, y: position.y, z: position.z }, rotation: [l, h, w] });
    }
  }

  return repeated;
}

function boxesOverlap(a: Placement, b: Placement, epsilon = 1e-6): boolean {
  return !(
    a.position.x + a.rotation[0] <= b.position.x + epsilon ||
    a.position.x >= b.position.x + b.rotation[0] - epsilon ||
    a.position.y + a.rotation[1] <= b.position.y + epsilon ||
    a.position.y >= b.position.y + b.rotation[1] - epsilon ||
    a.position.z + a.rotation[2] <= b.position.z + epsilon ||
    a.position.z >= b.position.z + b.rotation[2] - epsilon
  );
}
