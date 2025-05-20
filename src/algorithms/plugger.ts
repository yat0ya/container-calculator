import { BoxDimensions, Container, CalculationResult, Placement } from '../types';
import { convertToMeters } from '../utils';

const EPSILON = 1e-6;
const MIN_VOLUME = 1e-6;

export function pluggerAlgorithm(
  box: BoxDimensions,
  container: Container
): CalculationResult {
  const boxInMeters = convertToMeters(box);
  const orientations: [number, number, number][] = [
    [boxInMeters.length, boxInMeters.width, boxInMeters.height],
    [boxInMeters.length, boxInMeters.height, boxInMeters.width],
    [boxInMeters.width, boxInMeters.length, boxInMeters.height],
    [boxInMeters.width, boxInMeters.height, boxInMeters.length],
    [boxInMeters.height, boxInMeters.length, boxInMeters.width],
    [boxInMeters.height, boxInMeters.width, boxInMeters.length],
  ];

  const memo = new Map<string, Placement[]>();

  function recurse(
    origin: { x: number; y: number; z: number },
    space: { length: number; height: number; width: number }
  ): Placement[] {
    const volume = space.length * space.height * space.width;
    if (volume < MIN_VOLUME) return [];

    const key = [origin.x, origin.y, origin.z, space.length, space.height, space.width]
      .map(n => n.toFixed(3))
      .join('|');

    if (memo.has(key)) return memo.get(key)!;

    let bestResult: Placement[] = [];

    for (const [l, h, w] of orientations) {
      if (l <= space.length + EPSILON && h <= space.height + EPSILON && w <= space.width + EPSILON) {
        const placement: Placement = {
          position: { x: origin.x, y: origin.y, z: origin.z },
          rotation: [l, h, w],
        };

        const totalPlacements: Placement[] = [placement];

        if (space.length - l > EPSILON) {
          totalPlacements.push(...recurse(
            { x: origin.x + l, y: origin.y, z: origin.z },
            { length: space.length - l, height: h, width: w }
          ));
        }

        if (space.height - h > EPSILON) {
          totalPlacements.push(...recurse(
            { x: origin.x, y: origin.y + h, z: origin.z },
            { length: space.length, height: space.height - h, width: w }
          ));
        }

        if (space.width - w > EPSILON) {
          totalPlacements.push(...recurse(
            { x: origin.x, y: origin.y, z: origin.z + w },
            { length: space.length, height: space.height, width: space.width - w }
          ));
        }

        if (totalPlacements.length > bestResult.length) {
          bestResult = totalPlacements;
        }
      }
    }

    memo.set(key, bestResult);
    return bestResult;
  }

     const placements = recurse(
    { x: 0, y: 0, z: 0 },
    {
      length: container.length,
      height: container.height,
      width: container.width,
    }
  );

  applyGravity(placements);
  applySidePull(placements);

  placements.push(...greedyResidualFill(placements, container, orientations));

  const oneMore = tryPlaceOneFinalBox(placements, container, orientations);
  if (oneMore) placements.push(oneMore);

  placements.push(...finalInsertionSweep(placements, container, orientations));

  // 🔁 Only optimize once everything is inserted
  optimizeOrientations(placements, container, orientations);

  // ⬇️ Reapply gravity & pull to settle rotated boxes
  applyGravity(placements);
  applySidePull(placements);

  // 🧠 Final sweep again – rotation may have opened space
  placements.push(...finalInsertionSweep(placements, container, orientations));

  applyGravity(placements);
  applySidePull(placements);
  logFlyingGroups(placements);

  return {
    totalBoxes: placements.length,
    placements,
    boxInMeters,
  };
}

function logFlyingGroups(placements: Placement[]) {
  const isSupported = (box: Placement) => {
    if (Math.abs(box.position.y) < EPSILON) return true;
    return placements.some(other =>
      other !== box &&
      Math.abs(box.position.y - (other.position.y + other.rotation[1])) < EPSILON &&
      !(box.position.x + box.rotation[0] <= other.position.x ||
        other.position.x + other.rotation[0] <= box.position.x ||
        box.position.z + box.rotation[2] <= other.position.z ||
        other.position.z + other.rotation[2] <= box.position.z)
    );
  };

  const flying = placements.filter(p => !isSupported(p));
  console.log(`🚨 Flying box groups detected: ${flying.length}`);
}

function applyGravity(placements: Placement[]) {
  let moved;
  do {
    moved = false;

    for (const box of placements) {
      if (Math.abs(box.position.y) < EPSILON) continue;

      let minY = 0;
      for (const other of placements) {
        if (other === box) continue;

        const xOverlap = !(box.position.x + box.rotation[0] <= other.position.x ||
          other.position.x + other.rotation[0] <= box.position.x);
        const zOverlap = !(box.position.z + box.rotation[2] <= other.position.z ||
          other.position.z + other.rotation[2] <= box.position.z);

        if (xOverlap && zOverlap) {
          const potentialY = other.position.y + other.rotation[1];
          if (potentialY <= box.position.y + EPSILON && potentialY > minY) {
            minY = potentialY;
          }
        }
      }

      if (Math.abs(box.position.y - minY) > EPSILON) {
        box.position.y = minY;
        moved = true;
      }
    }
  } while (moved);
}

function applySidePull(placements: Placement[]) {
  let moved;
  do {
    moved = false;
    for (const axis of ['x', 'z'] as const) {
      const ortho = axis === 'x' ? 'z' : 'x';
      const sizeIdx = axis === 'x' ? 0 : 2;
      const orthoIdx = axis === 'x' ? 2 : 0;

      for (const box of placements) {
        let minPos = 0;
        for (const other of placements) {
          if (other === box) continue;

          const orthoOverlap = !(
            box.position[ortho] + box.rotation[orthoIdx] <= other.position[ortho] ||
            other.position[ortho] + other.rotation[orthoIdx] <= box.position[ortho]
          );

          const yOverlap = !(
            box.position.y + box.rotation[1] <= other.position.y ||
            other.position.y + other.rotation[1] <= box.position.y
          );

          if (orthoOverlap && yOverlap) {
            const otherEnd = other.position[axis] + other.rotation[sizeIdx];
            if (otherEnd <= box.position[axis] + EPSILON && otherEnd > minPos) {
              minPos = otherEnd;
            }
          }
        }

        if (Math.abs(box.position[axis] - minPos) > EPSILON) {
          box.position[axis] = minPos;
          moved = true;
        }
      }
    }
  } while (moved);
}

function greedyResidualFill(
  basePlacements: Placement[],
  container: Container,
  boxDims: [number, number, number][]
): Placement[] {
  const newPlacements: Placement[] = [];
  const occupied = new Set(basePlacements);

  const step = Math.min(...boxDims.map(d => Math.min(...d))) / 4;
  const sorted = [...boxDims].sort((a, b) => b[0] * b[1] * b[2] - a[0] * a[1] * a[2]);

  const isFree = (x: number, y: number, z: number, l: number, h: number, w: number) =>
    ![...occupied].some(p =>
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
            occupied.add(placement);
          }
        }
      }
    }
  }

  return newPlacements;
}

function tryPlaceOneFinalBox(
  occupied: Placement[],
  container: Container,
  orientations: [number, number, number][]
): Placement | null {
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

function finalInsertionSweep(
  placements: Placement[],
  container: Container,
  orientations: [number, number, number][]
): Placement[] {
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
