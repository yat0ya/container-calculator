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
  const ends = [...new Set(placements.map(p => p.position.x + p.rotation[0]))].sort((a, b) => b - a);
  const variants: Placement[][] = [placements];

  for (let i = 0; i < Math.min(maxVariants, ends.length); i++) {
    const cutoff = ends[i];
    const preserved = placements.filter(p => p.position.x + p.rotation[0] <= cutoff);
    const removedCount = placements.length - preserved.length;
    const repacked = repackTailLayered(preserved, container, orientations, cutoff);
    const repackedCount = repacked.length;
    const result = [...preserved, ...repacked];

    console.log(`Variant ${i + 1}:`);
    console.log(` - Removed boxes: ${removedCount}`);
    console.log(` - Repacked boxes: ${repackedCount}`);
    console.log(` - Total after repack: ${result.length} boxes`);

    variants.push(result);
  }

  return variants;
}

function repackTailLayered(
  preserved: Placement[],
  container: Container,
  orientations: [number, number, number][],
  minX: number
): Placement[] {
  const repacked: Placement[] = [];
  const sorted = [...orientations].sort((a, b) => a[0] - b[0]);

  for (let x = minX; x + sorted[0][0] <= container.length; x += 0.01) {
    for (const [l, h, w] of sorted) {
      if (x + l > container.length) continue;
      for (let z = 0; z + w <= container.width; z += w) {
        for (let y = 0; y + h <= container.height; y += h) {
          const candidate: Placement = { position: { x, y, z }, rotation: [l, h, w] };
          const all = [...preserved, ...repacked];

          const supported = y === 0 || all.some(b =>
            b.position.y + b.rotation[1] === y &&
            b.position.x < x + l && b.position.x + b.rotation[0] > x &&
            b.position.z < z + w && b.position.z + b.rotation[2] > z
          );

          const collides = all.some(b => boxesOverlap(b, candidate));

          if (!collides && supported) {
            repacked.push(candidate);
          }
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

  // Count orientation frequency in wall layout
  const rotationCounts = new Map<string, number>();
  for (const rot of best) {
    const key = JSON.stringify(rot);
    rotationCounts.set(key, (rotationCounts.get(key) || 0) + 1);
  }

  // Sort wall layout: more frequent orientations first (i.e. less frequent to air gaps)
  const sortedLayout = best.slice().sort((a, b) => {
    const countA = rotationCounts.get(JSON.stringify(a)) || 0;
    const countB = rotationCounts.get(JSON.stringify(b)) || 0;
    return countB - countA;
  });

  const placements: Placement[] = [];
  let z = 0;

  for (const [l, h, w] of sortedLayout) {
    const stack = stackColumn(allOrientations, container.height, w);

    // Count frequency in stack for sorting top-down
    const localCounts = new Map<string, number>();
    for (const rot of stack) {
      const key = JSON.stringify(rot);
      localCounts.set(key, (localCounts.get(key) || 0) + 1);
    }

    // Sort stack: less frequent on top
    const sortedStack = stack.slice().sort((a, b) => {
      const countA = localCounts.get(JSON.stringify(a)) || 0;
      const countB = localCounts.get(JSON.stringify(b)) || 0;
      return countA - countB; // least frequent last
    }).reverse(); // So we stack bottom-up, least frequent ends up on top

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

  for (const { position, rotation } of placements) {
    const [l, h, w] = rotation;
    for (let x = position.x; x + l <= container.length; x += l) {
      repeated.push({ position: { x, y: position.y, z: position.z }, rotation: [l, h, w] });
    }
  }

  return repeated;
}

function boxesOverlap(a: Placement, b: Placement): boolean {
  return !(
    a.position.x + a.rotation[0] <= b.position.x ||
    b.position.x + b.rotation[0] <= a.position.x ||
    a.position.y + a.rotation[1] <= b.position.y ||
    b.position.y + b.rotation[1] <= a.position.y ||
    a.position.z + a.rotation[2] <= b.position.z ||
    b.position.z + b.rotation[2] <= a.position.z
  );
}
