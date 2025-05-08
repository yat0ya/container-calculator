import { BoxDimensions, Container, CalculationResult, Placement } from '../types';
import { convertToMeters } from '../utils';

interface BaseLayer {
  rotation: [number, number, number]; // [length, height, width]
  count: number;
  positions: { x: number; y: number }[];
}

/**
 * Try all 6 axis-aligned orientations and return the one with the most 2D placements.
 */
export function generateOptimal2DLayer(
  box: { length: number; width: number; height: number },
  container: { length: number; width: number }
): BaseLayer | null {
  const orientations = ([
    [box.length, box.width, box.height],
    [box.width, box.length, box.height],
    [box.length, box.height, box.width],
    [box.height, box.length, box.width],
    [box.width, box.height, box.length],
    [box.height, box.width, box.length],
  ] as [number, number, number][]).filter(([l, , w]) => l <= container.length && w <= container.width);

  let bestFit: BaseLayer | null = null;

  for (const [len, hgt, wid] of orientations) {
    const fitLength = Math.floor(container.length / len);
    const fitWidth = Math.floor(container.width / wid);
    const count = fitLength * fitWidth;

    const positions = [];
    for (let i = 0; i < fitLength; i++) {
      for (let j = 0; j < fitWidth; j++) {
        positions.push({ x: i * len, y: j * wid });
      }
    }

    if (!bestFit || count > bestFit.count) {
      bestFit = {
        rotation: [len, hgt, wid],
        count,
        positions,
      };
    }
  }

  return bestFit;
}

/**
 * Stack the 2D layer upward along height, repeating placements at each level.
 */
function repeatEachBoxIndividually(
  baseLayer: BaseLayer,
  container: Container
): Placement[] {
  const placements: Placement[] = [];
  const [len, hgt, wid] = baseLayer.rotation;

  let z = 0;
  while (z + hgt <= container.height) {
    for (const pos of baseLayer.positions) {
      placements.push({
        position: { x: pos.x, y: z, z: pos.y },
        rotation: [len, hgt, wid],
      });
    }
    z += hgt;
  }

  return placements;
}

/**
 * Main packing function using 2D greedy base layer stacking in height.
 */
export function humanLikeAlgorithm(
  box: BoxDimensions,
  container: Container
): CalculationResult {
  const boxInMeters = convertToMeters(box);
  const baseLayer = generateOptimal2DLayer(boxInMeters, container);

  if (!baseLayer) {
    return {
      totalBoxes: 0,
      placements: [],
      boxInMeters,
    };
  }

  const placements = repeatEachBoxIndividually(baseLayer, container);

  return {
    totalBoxes: placements.length,
    placements,
    boxInMeters,
  };
}
