import { BoxDimensions, Container, CalculationResult, Placement } from '../types';
import { convertToMeters } from '../utils';

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  const boxInMeters = convertToMeters(box);
  const orientations = generateOrientations(boxInMeters);
  let placements = buildWall(container, orientations);
  const basePlacements = repeatPattern(placements, container);

  const repackVariants = generateTailRepackVariants(basePlacements, container, orientations, 5);
  const best = repackVariants.reduce((best, current) =>
    current.length > best.length ? current : best
  );

  return {
    totalBoxes: best.length,
    placements: best,
    boxInMeters,
  };
}

function generateOrientations(box: BoxDimensions): [number, number, number][] {
  const { length, width, height } = box;
  return [
    [length, width, height],
    [length, height, width],
    [width, length, height],
    [width, height, length],
    [height, length, width],
    [height, width, length],
  ];
}

function generateTailRepackVariants(
  placements: Placement[],
  container: Container,
  orientations: [number, number, number][],
  maxVariants: number
): Placement[][] {
  const epsilon = 1e-4;

  // Collect and sort box end positions (x + length)
  const ends = placements.map(p => p.position.x + p.rotation[0]);
  const uniqueEnds = [...new Set(ends)].sort((a, b) => b - a);

  const variants: Placement[][] = [placements]; // Always include base version

  for (let i = 0; i < Math.min(maxVariants, uniqueEnds.length); i++) {
    const cutoff = uniqueEnds[i];

    const preserved = placements.filter(
      p => p.position.x < cutoff - epsilon
    );


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

  const sortedOrientations = [...orientations].sort((a, b) => a[0] - b[0]);

  for (let x = minX; x < container.length + epsilon; x += 0.01) {
    for (const [l, h, w] of sortedOrientations) {
      if (x + l > container.length + epsilon) continue;

      const ySteps = Math.floor(container.height / h);
      const zSteps = Math.floor(container.width / w);

      for (let zi = 0; zi <= zSteps; zi++) {
        const z = zi * w;
        if (z + w > container.width + epsilon) continue;

        for (let yi = 0; yi <= ySteps; yi++) {
          const y = yi * h;
          if (y + h > container.height + epsilon) continue;

          const candidate: Placement = {
            position: { x, y, z },
            rotation: [l, h, w],
          };

          const supported =
            y === 0 ||
            [...preserved, ...repacked].some(b =>
              Math.abs(b.position.y + b.rotation[1] - y) < epsilon * 10 &&
              b.position.x < x + l - epsilon &&
              b.position.x + b.rotation[0] > x + epsilon &&
              b.position.z < z + w - epsilon &&
              b.position.z + b.rotation[2] > z + epsilon
            );

          const collides = [...preserved, ...repacked].some(existing =>
            boxesOverlap(existing, candidate, epsilon)
          );

          if (!collides && supported) {
            repacked.push(candidate);
          }
        }
      }
    }
  }

  return repacked;
}









export function buildWall(
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
  const containerWidth = container.width;
  const containerHeight = container.height;

  const allOrientations: [number, number, number][] = Array.from(
    new Set(
      orientations
        .flatMap(([l, h, w]) => [
          [l, h, w],
          [l, w, h],
          [h, l, w],
          [h, w, l],
          [w, l, h],
          [w, h, l],
        ])
        .map(o => JSON.stringify(o))
    )
  ).map(s => JSON.parse(s) as [number, number, number]);

  type LayoutResult = { layout: [number, number, number][]; score: number };
  let bestLayout: LayoutResult | null = null;
  const startTime = Date.now();
  const TIME_LIMIT_MS = 1000;
  const MAX_DEPTH = 30;
  const memo = new Set<string>();

  function layoutKey(layout: [number, number, number][]): string {
    return layout.map(([, , w]) => w.toFixed(3)).join(',');
  }

  function calcScore(layout: [number, number, number][]): number {
    return layout.reduce((total, [, h, w]) => {
      const { score } = findBestColumnPacking(h, w);
      return total + score;
    }, 0);
  }

  function findBestColumnPacking(
  heightLimit: number,
  width: number
): { score: number; stack: [number, number, number][] } {
  const fits = allOrientations.filter(([, h, w]) => w === width && h <= heightLimit);

  let bestStack: [number, number, number][] = [];
  let bestScore = 0;

  function recurse(
    remainingHeight: number,
    stack: [number, number, number][]
  ): void {
    for (const box of fits) {
      const [, h] = box;
      if (h > remainingHeight) continue;

      const newStack = [...stack, box];
      const newScore = newStack.reduce((sum, [, h2, w2]) => sum + h2 * w2, 0);

      if (newScore > bestScore) {
        bestStack = newStack;
        bestScore = newScore;
      }

      recurse(remainingHeight - h, newStack);
    }
  }

  recurse(heightLimit, []);

  // Group identical orientations
  const groups = new Map<string, [number, number, number][]>();

  for (const box of bestStack) {
    const key = JSON.stringify(box);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(box);
  }

  // Sort by group size so bigger blocks go on the bottom
  const sortedGroups = [...groups.values()].sort((a, b) => b.length - a.length);

  const reorderedStack: [number, number, number][] = sortedGroups.flat();

  return {
    score: bestScore,
    stack: reorderedStack,
  };
}


  function backtrack(
    currentLayout: [number, number, number][],
    remainingWidth: number,
    depth: number
  ): void {
    if (Date.now() - startTime > TIME_LIMIT_MS || depth > MAX_DEPTH) return;

    const key = layoutKey(currentLayout);
    if (memo.has(key)) return;
    memo.add(key);

    if (currentLayout.length > 0) {
      const score = calcScore(currentLayout);
      if (!bestLayout || score > bestLayout.score) {
        bestLayout = { layout: [...currentLayout], score };
      }
    }

    for (const orientation of allOrientations) {
      const [, , w] = orientation;
      if (w <= 0.01 || remainingWidth < w) continue;

      backtrack([...currentLayout, orientation], remainingWidth - w, depth + 1);
    }
  }

  backtrack([], containerWidth, 0);

  if (!bestLayout) return [];

  const placements: Placement[] = [];
  let z = 0;

  for (const [_, _h, w] of bestLayout.layout) {
    const column = findBestColumnPacking(containerHeight, w);

    let y = 0;
    for (const [l2, h2, w2] of column.stack) {
      placements.push({
        position: { x: 0, y, z },
        rotation: [l2, h2, w2],
      });
      y += h2;
    }

    z += w;
  }

  return placements;
}

function repeatPattern(
  placements: Placement[],
  container: Container
): Placement[] {
  const repeatedPlacements: Placement[] = [];

  for (const placement of placements) {
    const { position, rotation } = placement;
    const [boxLength, boxHeight, boxWidth] = rotation;

    let offsetX = position.x;

    while (offsetX + boxLength <= container.length) {
      repeatedPlacements.push({
        position: {
          x: offsetX,
          y: position.y,
          z: position.z,
        },
        rotation: [boxLength, boxHeight, boxWidth],
      });
      offsetX += boxLength;
    }
  }

  return repeatedPlacements;
}

function boxesOverlap(a: Placement, b: Placement, epsilon = 1e-6): boolean {
  const ax1 = a.position.x;
  const ax2 = ax1 + a.rotation[0];
  const ay1 = a.position.y;
  const ay2 = ay1 + a.rotation[1];
  const az1 = a.position.z;
  const az2 = az1 + a.rotation[2];

  const bx1 = b.position.x;
  const bx2 = bx1 + b.rotation[0];
  const by1 = b.position.y;
  const by2 = by1 + b.rotation[1];
  const bz1 = b.position.z;
  const bz2 = bz1 + b.rotation[2];

  return !(
    ax2 <= bx1 + epsilon ||
    ax1 >= bx2 - epsilon ||
    ay2 <= by1 + epsilon ||
    ay1 >= by2 - epsilon ||
    az2 <= bz1 + epsilon ||
    az1 >= bz2 - epsilon
  );
}
