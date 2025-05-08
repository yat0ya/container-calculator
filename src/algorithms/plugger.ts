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

  return {
    totalBoxes: placements.length,
    placements,
    boxInMeters,
  };
}
