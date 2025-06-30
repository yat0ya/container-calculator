import { Container, Placement } from './types';
import { boxesOverlap } from './utils'; // updated import path

export function buildWall(container: Container, orientations: [number, number, number][]): Placement[] {
  const allOrientations: [number, number, number][] = Array.from(
    new Set(
      orientations.flatMap(([l, h, w]) =>
        [
          [l, h, w], [l, w, h], [h, l, w],
          [h, w, l], [w, l, h], [w, h, l],
        ].map(o => JSON.stringify(o))
      )
    )
  ).map(s => JSON.parse(s) as [number, number, number]);

  const TIME_LIMIT = 1000; // ms
  const MAX_DEPTH = 30;
  const start = Date.now();
  const memo = new Set<string>();
  let best: [number, number, number][] = [];

  const scoreLayout = (layout: [number, number, number][]) =>
    layout.reduce((sum, [, h, w]) => sum + h * w, 0); // mm² coverage

  function layoutKey(layout: [number, number, number][]) {
    return layout.map(([, h, w]) => `${h}x${w}`).join('|');
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

  for (const box of sortedLayout) {
    const w = box[2];
    const column = findBestStack(allOrientations, container.height, w);
    const localCounts = new Map<string, number>();

    for (const rot of column) {
      const key = JSON.stringify(rot);
      localCounts.set(key, (localCounts.get(key) || 0) + 1);
    }

    const sortedColumn = column.slice().sort((a, b) => {
      const countA = localCounts.get(JSON.stringify(a)) || 0;
      const countB = localCounts.get(JSON.stringify(b)) || 0;
      return countA - countB;
    }).reverse();

    let y = 0;
    for (const [l2, h2, w2] of sortedColumn) {
      const newPlacement: Placement = {
        position: { x: 0, y, z },
        rotation: [l2, h2, w2] as [number, number, number]
      };

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

function findBestStack(
  orientations: [number, number, number][],
  height: number,
  width: number
): [number, number, number][] {
  const fits = orientations.filter(([, h, w]) => w === width && h <= height);
  let bestStack: [number, number, number][] = [];
  let bestScore = 0;

  function recurse(remaining: number, stack: [number, number, number][]) {
    for (const box of fits) {
      const [, h] = box;
      if (h > remaining) continue;

      const next = [...stack, box];
      const score = next.reduce((sum, [, h, w]) => sum + h * w, 0);
      if (score > bestScore) {
        bestStack = next;
        bestScore = score;
      }

      recurse(remaining - h, next);
    }
  }

  recurse(height, []);
  return bestStack;
}
