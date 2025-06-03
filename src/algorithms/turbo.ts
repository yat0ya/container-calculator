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

function prepareTailArea(placements: Placement[], container: Container): { x: number, length: number, occupied: Placement[] } {
  // Find furthest X extent using x + l across all placements
  let maxX = 0;
  for (const p of placements) {
    const endX = p.position.x + p.rotation[0];
    if (endX > maxX) maxX = endX;
  }

  // Account for floating-point precision by snapping to nearest cm (0.01m)
  const EPSILON = 1e-6;
  const snappedMaxX = Math.min(container.length, Math.ceil((maxX + EPSILON) * 100) / 100);

  const remainingLength = container.length - snappedMaxX;

  return {
    x: snappedMaxX,
    length: remainingLength,
    occupied: placements
  };
}


function fillTailArea(
  tail: { x: number, length: number, occupied: Placement[] },
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
  const occupied = [...tail.occupied];
  const newPlacements: Placement[] = [];

  const step = Math.min(...orientations.flat()) / 4;
  const sorted = [...orientations].sort((a, b) => b[0] * b[1] * b[2] - a[0] * a[1] * a[2]);

  const EPSILON = 1e-6;

  const isFree = (x: number, y: number, z: number, l: number, h: number, w: number) =>
    !occupied.some(p =>
      x < p.position.x + p.rotation[0] - EPSILON &&
      x + l > p.position.x + EPSILON &&
      y < p.position.y + p.rotation[1] - EPSILON &&
      y + h > p.position.y + EPSILON &&
      z < p.position.z + p.rotation[2] - EPSILON &&
      z + w > p.position.z + EPSILON
    );

  for (let y = 0; y + step <= container.height; y += step) {
    for (let x = 0; x + step <= tail.length; x += step) {
      for (let z = 0; z + step <= container.width; z += step) {
        for (const [l, h, w] of sorted) {
          const absX = x + tail.x;
          if (
            absX + l <= container.length + EPSILON &&
            y + h <= container.height + EPSILON &&
            z + w <= container.width + EPSILON &&
            isFree(absX, y, z, l, h, w)
          ) {
            const placement: Placement = { position: { x: absX, y, z }, rotation: [l, h, w] };
            newPlacements.push(placement);
            occupied.push(placement);
            break; // move to next position after successful placement
          }
        }
      }
    }
  }

  return newPlacements;
}


