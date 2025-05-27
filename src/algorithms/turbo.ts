import { BoxDimensions, Container, CalculationResult, Placement } from '../types';
import { convertToMeters } from '../utils';

const EPSILON = 1e-3;
const MIN_VOLUME = 1e-3;
const MAX_ITERATIONS = 10;

export function turboAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  const boxInMeters = convertToMeters(box);
  const orientations = generateOrientations(boxInMeters);
  const placements = packBoxes(container, orientations);

  applyPull(placements, 'down');
  applyPull(placements, 'left');
  applyPull(placements, 'back');

  placements.push(...greedyResidualFill(placements, container, orientations));

  let oneMore = tryPlaceOneFinalBox(placements, container, orientations);
  if (oneMore) placements.push(oneMore);

  placements.push(...finalInsertionSweep(placements, container, orientations));

  optimizeOrientations(placements, container, orientations);

  applyPull(placements, 'down');
  applyPull(placements, 'left');
  applyPull(placements, 'back');
  placements.push(...finalInsertionSweep(placements, container, orientations));

  applyPull(placements, 'down');
  applyPull(placements, 'left');
  applyPull(placements, 'back');

  oneMore = tryPlaceOneFinalBox(placements, container, orientations);
  if (oneMore) placements.push(oneMore);
  applyPull(placements, 'down');
  applyPull(placements, 'left');
  applyPull(placements, 'back');

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

function packBoxes(container: Container, orientations: [number, number, number][]): Placement[] {
  const memo = new Map<string, Placement[]>();

  function recurse(
    origin: { x: number; y: number; z: number },
    space: { length: number; height: number; width: number }
  ): Placement[] {
    const volume = space.length * space.height * space.width;
    if (volume < MIN_VOLUME) return [];

    const key = createMemoKey(origin, space);
    if (memo.has(key)) return memo.get(key)!;

    let best: Placement[] = [];

    for (const [l, h, w] of orientations) {
      if (l > space.length + EPSILON || h > space.height + EPSILON || w > space.width + EPSILON) continue;

      const basePlacement: Placement = { position: { ...origin }, rotation: [l, h, w] };
      const next: Placement[] = [basePlacement];

      if (space.length - l > EPSILON)
        next.push(...recurse({ x: origin.x + l, y: origin.y, z: origin.z }, { length: space.length - l, height: h, width: w }));

      if (space.height - h > EPSILON)
        next.push(...recurse({ x: origin.x, y: origin.y + h, z: origin.z }, { length: space.length, height: space.height - h, width: w }));

      if (space.width - w > EPSILON)
        next.push(...recurse({ x: origin.x, y: origin.y, z: origin.z + w }, { length: space.length, height: space.height, width: space.width - w }));

      if (next.length > best.length) best = next;
    }

    memo.set(key, best);
    return best;
  }

  return recurse({ x: 0, y: 0, z: 0 }, container);
}

function createMemoKey(origin: { x: number; y: number; z: number }, space: { length: number; height: number; width: number }): string {
  const round = (n: number) => Math.round(n * 100); // reduced precision from *1000
  return [
    round(origin.x),
    round(origin.y),
    round(origin.z),
    round(space.length),
    round(space.height),
    round(space.width),
  ].join(',');
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
