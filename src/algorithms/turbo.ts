import { BoxDimensions, Container, CalculationResult, Placement } from '../types';
import { convertToMeters } from '../utils';

const EPSILON = 1e-3;
const MIN_VOLUME = 1e-3;
const MAX_ITERATIONS = 10;

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  const boxInMeters = convertToMeters(box);
  const orientations = generateOrientations(boxInMeters);
  const placements = packBoxes(container, orientations);

  // applyPull(placements, 'down');
  // applyPull(placements, 'left');
  // applyPull(placements, 'back');

  // placements.push(...greedyResidualFill(placements, container, orientations));

  // let oneMore = tryPlaceOneFinalBox(placements, container, orientations);
  // if (oneMore) placements.push(oneMore);

  // placements.push(...finalInsertionSweep(placements, container, orientations));

  // optimizeOrientations(placements, container, orientations);

  // applyPull(placements, 'down');
  // applyPull(placements, 'left');
  // applyPull(placements, 'back');
  // placements.push(...finalInsertionSweep(placements, container, orientations));

  // applyPull(placements, 'down');
  // applyPull(placements, 'left');
  // applyPull(placements, 'back');

  // oneMore = tryPlaceOneFinalBox(placements, container, orientations);
  // if (oneMore) placements.push(oneMore);
  // applyPull(placements, 'down');
  // applyPull(placements, 'left');
  // applyPull(placements, 'back');

  return {
    totalBoxes: placements.length,
    placements,
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



export function packBoxes(container: Container, orientations: [number, number, number][]): Placement[] {
  const allOrientations: [number, number, number][] = orientations.flatMap(([l, h, w]) => ([
    [l, h, w],
    [l, w, h],
    [h, l, w],
    [h, w, l],
    [w, l, h],
    [w, h, l],
  ]));

  const containerWidth = container.width;
  const containerHeight = container.height;

  let bestLayout: {
    layout: [number, number, number][],
    score: number
  } | null = null;

  function generateColumnLayouts(current: [number, number, number][], remainingWidth: number) {
    const totalWidth = current.reduce((sum, [, , w]) => sum + w, 0);

    if (totalWidth <= containerWidth && current.length > 0) {
      const totalArea = current.reduce((sum, [, h, w]) => {
        const fit = Math.floor(containerHeight / h);
        return sum + fit * h * w;
      }, 0);

      // grouping score: +1 per adjacent column of same width
      let groupingBonus = 0;
      for (let i = 1; i < current.length; i++) {
        if (current[i][2] === current[i - 1][2]) groupingBonus += 1;
      }

      const score = totalArea + groupingBonus * 0.01; // small bonus to prefer grouping visually

      if (!bestLayout || score > bestLayout.score) {
        bestLayout = { layout: [...current], score };
      }
    }

    for (const orientation of allOrientations) {
      const [, , w] = orientation;

      if (remainingWidth >= w) {
        generateColumnLayouts([...current, orientation], remainingWidth - w);
      }
    }
  }

  generateColumnLayouts([], containerWidth);

  if (!bestLayout) return [];

  const placements: Placement[] = [];
  let z = 0;

  for (const [l, h, w] of bestLayout.layout) {
    const countH = Math.floor(containerHeight / h);

    for (let i = 0; i < countH; i++) {
      placements.push({
        position: { x: 0, y: i * h, z },
        rotation: [l, h, w],
      });
    }

    z += w;
  }

  return placements;
}




type Axis = 'x' | 'y' | 'z';
type PullDirection = 'down' | 'up' | 'left' | 'right' | 'back' | 'forward';

const directionMap: Record<PullDirection, { axis: Axis; sign: -1 | 1 }> = {
  down: { axis: 'y', sign: -1 },
  up: { axis: 'y', sign: 1 },
  left: { axis: 'x', sign: -1 },
  right: { axis: 'x', sign: 1 },
  back: { axis: 'z', sign: -1 },
  forward: { axis: 'z', sign: 1 },
};

function applyPull(placements: Placement[], direction: PullDirection): void {
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


function greedyResidualFill(basePlacements: Placement[], container: Container, boxDims: [number, number, number][]): Placement[] {
  const newPlacements: Placement[] = [];
  const occupied = [...basePlacements];

  const step = Math.min(...boxDims.map(d => Math.min(...d))) / 4;
  const sorted = [...boxDims].sort((a, b) => b[0] * b[1] * b[2] - a[0] * a[1] * a[2]);

  const isFree = (x: number, y: number, z: number, l: number, h: number, w: number) =>
    !occupied.some(p =>
      x < p.position.x + p.rotation[0] &&
      x + l > p.position.x &&
      y < p.position.y + p.rotation[1] &&
      y + h > p.position.y &&
      z < p.position.z + p.rotation[2] &&
      z + w > p.position.z
    );

  for (let y = 0; y + step <= container.height; y += step) {
    for (let x = 0; x + step <= container.length; x += step) {
      for (let z = 0; z + step <= container.width; z += step) {
        for (const [l, h, w] of sorted) {
          if (
            x + l <= container.length + EPSILON &&
            y + h <= container.height + EPSILON &&
            z + w <= container.width + EPSILON &&
            isFree(x, y, z, l, h, w)
          ) {
            const placement: Placement = { position: { x, y, z }, rotation: [l, h, w] };
            newPlacements.push(placement);
            occupied.push(placement);
          }
        }
      }
    }
  }

  return newPlacements;
}

function tryPlaceOneFinalBox(occupied: Placement[], container: Container, orientations: [number, number, number][]): Placement | null {
  const step = Math.min(...orientations.map(d => Math.min(...d))) / 10;
  const sorted = [...orientations].sort((a, b) => b[0] * b[1] * b[2] - a[0] * a[1] * a[2]);

  const isFree = (x: number, y: number, z: number, l: number, h: number, w: number) =>
    !occupied.some(p =>
      x < p.position.x + p.rotation[0] &&
      x + l > p.position.x &&
      y < p.position.y + p.rotation[1] &&
      y + h > p.position.y &&
      z < p.position.z + p.rotation[2] &&
      z + w > p.position.z
    );

  for (let y = 0; y <= container.height; y += step) {
    for (let x = 0; x <= container.length; x += step) {
      for (let z = 0; z <= container.width; z += step) {
        for (const [l, h, w] of sorted) {
          if (
            x + l <= container.length + EPSILON &&
            y + h <= container.height + EPSILON &&
            z + w <= container.width + EPSILON &&
            isFree(x, y, z, l, h, w)
          ) {
            return { position: { x, y, z }, rotation: [l, h, w] };
          }
        }
      }
    }
  }

  return null;
}

function finalInsertionSweep(placements: Placement[], container: Container, orientations: [number, number, number][]): Placement[] {
  const occupied = [...placements];
  const newPlacements: Placement[] = [];

  const step = Math.min(...orientations.map(d => Math.min(...d))) / 4;

  const isFree = (x: number, y: number, z: number, l: number, h: number, w: number) =>
    !occupied.some(p =>
      x < p.position.x + p.rotation[0] &&
      x + l > p.position.x &&
      y < p.position.y + p.rotation[1] &&
      y + h > p.position.y &&
      z < p.position.z + p.rotation[2] &&
      z + w > p.position.z
    );

  for (let y = 0; y + step <= container.height; y += step) {
    for (let x = 0; x + step <= container.length; x += step) {
      for (let z = 0; z + step <= container.width; z += step) {
        for (const [l, h, w] of orientations) {
          if (
            x + l <= container.length + EPSILON &&
            y + h <= container.height + EPSILON &&
            z + w <= container.width + EPSILON &&
            isFree(x, y, z, l, h, w)
          ) {
            const placement: Placement = { position: { x, y, z }, rotation: [l, h, w] };
            occupied.push(placement);
            newPlacements.push(placement);
            break;
          }
        }
      }
    }
  }

  return newPlacements;
}

function optimizeOrientations(placements: Placement[], container: Container, orientations: [number, number, number][]) {
  for (let i = 0; i < placements.length; i++) {
    const current = placements[i];

    for (const [l, h, w] of orientations) {
      if (l === current.rotation[0] && h === current.rotation[1] && w === current.rotation[2]) continue;

      if (
        current.position.x + l <= container.length + EPSILON &&
        current.position.y + h <= container.height + EPSILON &&
        current.position.z + w <= container.width + EPSILON
      ) {
        const rotated: Placement = {
          position: current.position,
          rotation: [l, h, w]
        };

        const noOverlap = placements.every((p, idx) =>
          idx === i || !intersects(rotated, p)
        );

        if (noOverlap) {
          placements[i] = rotated;
          break;
        }
      }
    }
  }
}

function intersects(a: Placement, b: Placement) {
  return (
    a.position.x < b.position.x + b.rotation[0] &&
    a.position.x + a.rotation[0] > b.position.x &&
    a.position.y < b.position.y + b.rotation[1] &&
    a.position.y + a.rotation[1] > b.position.y &&
    a.position.z < b.position.z + b.rotation[2] &&
    a.position.z + a.rotation[2] > b.position.z
  );
}
