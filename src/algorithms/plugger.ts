import { BoxDimensions, Container, CalculationResult, Placement } from '../types';
import { convertToMeters } from '../utils';

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

  function recurse(
    origin: { x: number; y: number; z: number },
    space: { length: number; height: number; width: number }
  ): Placement[] {
    let bestResult: Placement[] = [];

    for (const [l, h, w] of orientations) {
      if (l <= space.length && h <= space.height && w <= space.width) {
        const placement: Placement = {
          position: { x: origin.x, y: origin.y, z: origin.z },
          rotation: [l, h, w],
        };

        const right = recurse(
          { x: origin.x + l, y: origin.y, z: origin.z },
          { length: space.length - l, height: h, width: w }
        );
        const above = recurse(
          { x: origin.x, y: origin.y + h, z: origin.z },
          { length: space.length, height: space.height - h, width: w }
        );
        const front = recurse(
          { x: origin.x, y: origin.y, z: origin.z + w },
          { length: space.length, height: space.height, width: space.width - w }
        );

        const totalPlacements = [placement, ...right, ...above, ...front];

        if (totalPlacements.length > bestResult.length) {
          bestResult = totalPlacements;
        }
      }
    }

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

  logFlyingGroups(placements); // Optional: logs before fix
  applyGravity(placements);
  logFlyingGroups(placements); // Optional: logs after fix

  return {
    totalBoxes: placements.length,
    placements,
    boxInMeters,
  };
}

function logFlyingGroups(placements: Placement[]) {
  const epsilon = 0.01;

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
  const epsilon = 0.001;

  function overlaps(a: Placement, b: Placement): boolean {
    return !(
      a.position.x + a.rotation[0] <= b.position.x ||
      b.position.x + b.rotation[0] <= a.position.x ||
      a.position.y + a.rotation[1] <= b.position.y ||
      b.position.y + b.rotation[1] <= a.position.y ||
      a.position.z + a.rotation[2] <= b.position.z ||
      b.position.z + b.rotation[2] <= a.position.z
    );
  }

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
          if (potentialY <= box.position.y && potentialY > minY) {
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
