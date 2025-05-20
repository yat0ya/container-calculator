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

    const key = `${origin.x.toFixed(3)}|${origin.y.toFixed(3)}|${origin.z.toFixed(3)}|${space.length.toFixed(3)}|${space.height.toFixed(3)}|${space.width.toFixed(3)}`;
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
  applyGravity(placements);
  logFlyingGroups(placements);

  const residuals = greedyResidualFill(placements, container, orientations);
  placements.push(...residuals);
  const oneMore = tryPlaceOneFinalBox(placements, container, orientations);
  if (oneMore) {
    placements.push(oneMore);
  }

  return {
    totalBoxes: placements.length,
    placements,
    boxInMeters,
  };
}

function logFlyingGroups(placements: Placement[]) {
  const epsilon = EPSILON;

  function overlaps2D(a: Placement, b: Placement) {
    return !(
      a.position.x + a.rotation[0] <= b.position.x ||
      b.position.x + b.rotation[0] <= a.position.x ||
      a.position.z + a.rotation[2] <= b.position.z ||
      b.position.z + b.rotation[2] <= a.position.z
    );
  }

  function isSupported(box: Placement) {
    if (Math.abs(box.position.y) < epsilon) return true;
    return placements.some(other => {
      if (other === box) return false;
      const top = other.position.y + other.rotation[1];
      const dy = box.position.y - top;
      return Math.abs(dy) < epsilon && overlaps2D(box, other);
    });
  }

  const flying = placements.filter(p => !isSupported(p));
  const groupCount = flying.length;
  console.log(`🚨 Flying box groups detected: ${groupCount}`);
}

function applyGravity(placements: Placement[]) {
  const epsilon = EPSILON;

  function isSupported(box: Placement, others: Placement[]) {
    if (Math.abs(box.position.y) < epsilon) return true;
    return others.some(other => {
      if (other === box) return false;
      const top = other.position.y + other.rotation[1];
      const xOverlap = !(box.position.x + box.rotation[0] <= other.position.x ||
        other.position.x + other.rotation[0] <= box.position.x);
      const zOverlap = !(box.position.z + box.rotation[2] <= other.position.z ||
        other.position.z + other.rotation[2] <= box.position.z);
      return xOverlap && zOverlap && Math.abs(box.position.y - top) < epsilon;
    });
  }

  let moved;
  do {
    moved = false;

    for (const box of placements) {
      if (isSupported(box, placements)) continue;

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

      const newY = minY;
      if (Math.abs(box.position.y - newY) > epsilon) {
        box.position.y = newY;
        moved = true;
      }
    }
  } while (moved);
}

function applySidePull(placements: Placement[]) {
  const epsilon = EPSILON;

  function moveBox(box: Placement, others: Placement[], axis: 'x' | 'z') {
    let minPos = 0;

    for (const other of others) {
      if (other === box) continue;

      const orthoAxis = axis === 'x' ? 'z' : 'x';
      const boxOrthoStart = box.position[orthoAxis];
      const boxOrthoEnd = boxOrthoStart + box.rotation[axis === 'x' ? 2 : 0];
      const otherOrthoStart = other.position[orthoAxis];
      const otherOrthoEnd = otherOrthoStart + other.rotation[axis === 'x' ? 2 : 0];
      const orthoOverlap = !(boxOrthoEnd <= otherOrthoStart || otherOrthoEnd <= boxOrthoStart);

      const yOverlap = !(box.position.y + box.rotation[1] <= other.position.y ||
        other.position.y + other.rotation[1] <= box.position.y);

      if (orthoOverlap && yOverlap) {
        const otherEnd = other.position[axis] + other.rotation[axis === 'x' ? 0 : 2];
        if (otherEnd <= box.position[axis] + EPSILON && otherEnd > minPos) {
          minPos = otherEnd;
        }
      }
    }

    const newPos = minPos;
    if (Math.abs(box.position[axis] - newPos) > epsilon) {
      box.position[axis] = newPos;
      return true;
    }
    return false;
  }

  let moved;
  do {
    moved = false;
    for (const axis of ['x', 'z'] as const) {
      for (const box of placements) {
        if (moveBox(box, placements, axis)) {
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
  const occupied = [...basePlacements];

  const step = Math.min(...boxDims.map(d => Math.min(...d))) / 4;

  function isFree(x: number, y: number, z: number, l: number, h: number, w: number) {
    return !occupied.some(p =>
      x < p.position.x + p.rotation[0] &&
      x + l > p.position.x &&
      y < p.position.y + p.rotation[1] &&
      y + h > p.position.y &&
      z < p.position.z + p.rotation[2] &&
      z + w > p.position.z
    );
  }

  // ✅ Sort orientations by volume descending (largest/flat ones first)
  const orientations = [...boxDims].sort((a, b) =>
    (b[0] * b[1] * b[2]) - (a[0] * a[1] * a[2])
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
            const newPlacement: Placement = {
              position: { x, y, z },
              rotation: [l, h, w],
            };
            newPlacements.push(newPlacement);
            occupied.push(newPlacement);
            // ✅ No break — continue checking other orientations
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

  function isFree(x: number, y: number, z: number, l: number, h: number, w: number) {
    return !occupied.some(p =>
      x < p.position.x + p.rotation[0] &&
      x + l > p.position.x &&
      y < p.position.y + p.rotation[1] &&
      y + h > p.position.y &&
      z < p.position.z + p.rotation[2] &&
      z + w > p.position.z
    );
  }

  const sorted = [...orientations].sort((a, b) =>
    (b[0] * b[1] * b[2]) - (a[0] * a[1] * a[2])
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
            return {
              position: { x, y, z },
              rotation: [l, h, w],
            };
          }
        }
      }
    }
  }

  return null;
}

