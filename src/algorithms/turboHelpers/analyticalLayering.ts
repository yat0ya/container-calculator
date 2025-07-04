import { Placement, Container } from './types';
import { boxesOverlap } from '../turboHelpers/utils';

/**
 * Analytically identifies layering opportunities and fills them optimally.
 * Repeats the pattern upward until there's no room or support.
 */
export function addAnalyticalLayers(
  placements: Placement[],
  container: Container,
): Placement[] {
  let newPlacements: Placement[] = [];
  let allPlacements = [...placements];

  // Find the bottom layer (y = 0)
  let currentLayer = placements.filter(p => p.position.y === 0);
  if (currentLayer.length === 0) return [];

  const dominantRotation = findDominantRotation(currentLayer);
  const layerHeight = dominantRotation[1];
  let currentY = layerHeight;

  while (currentY + layerHeight <= container.height) {
    const nextLayer = createLayer(currentLayer, dominantRotation, currentY, container);

    if (nextLayer.length === 0) break;

    const filtered: Placement[] = nextLayer.filter((newBox: Placement) =>
      !allPlacements.some(existing => boxesOverlap(newBox, existing))
    );

    newPlacements = [...newPlacements, ...filtered];
    allPlacements = [...allPlacements, ...filtered];
    currentLayer = filtered;
    currentY += layerHeight;
  }

  return newPlacements;
}

/**
 * Finds the most common rotation pattern in a layer of boxes.
 */
function findDominantRotation(boxes: Placement[]): [number, number, number] {
  const rotationCounts = new Map<string, { rotation: [number, number, number]; count: number }>();

  for (const box of boxes) {
    const key = `${box.rotation[0]}-${box.rotation[1]}-${box.rotation[2]}`;
    if (rotationCounts.has(key)) {
      rotationCounts.get(key)!.count++;
    } else {
      rotationCounts.set(key, { rotation: [...box.rotation] as [number, number, number], count: 1 });
    }
  }

  let maxCount = 0;
  let dominantRotation: [number, number, number] = boxes[0]?.rotation || [0, 0, 0];

  for (const { rotation, count } of rotationCounts.values()) {
    if (count > maxCount) {
      maxCount = count;
      dominantRotation = rotation;
    }
  }

  return dominantRotation;
}

/**
 * Creates a new layer by replicating the previous layer pattern at a higher Y level.
 */
function createLayer(
  previousLayer: Placement[],
  _dominantRotation: [number, number, number],
  layerY: number,
  container: Container
): Placement[] {
  return previousLayer.flatMap(belowBox => {
    const rotation = belowBox.rotation;
    const boxArea = rotation[0] * rotation[2];

    const newBox: Placement = {
      position: {
        x: belowBox.position.x,
        y: layerY,
        z: belowBox.position.z
      },
      rotation
    };

    const supportArea = calculateSupportArea(newBox, previousLayer);

    const hasSupport = supportArea >= boxArea * 0.8;
    const fitsWithinContainer =
      newBox.position.x + rotation[0] <= container.length &&
      newBox.position.y + rotation[1] <= container.height &&
      newBox.position.z + rotation[2] <= container.width;

    return hasSupport && fitsWithinContainer ? [newBox] : [];
  });
}

/**
 * Calculates how much support area is available for a box position.
 */
function calculateSupportArea(targetBox: Placement, supportingBoxes: Placement[]): number {
  const targetArea = {
    x1: targetBox.position.x,
    x2: targetBox.position.x + targetBox.rotation[0],
    z1: targetBox.position.z,
    z2: targetBox.position.z + targetBox.rotation[2]
  };

  let totalSupportArea = 0;

  for (const support of supportingBoxes) {
    const supportArea = {
      x1: support.position.x,
      x2: support.position.x + support.rotation[0],
      z1: support.position.z,
      z2: support.position.z + support.rotation[2]
    };

    const overlapX = Math.max(0, Math.min(targetArea.x2, supportArea.x2) - Math.max(targetArea.x1, supportArea.x1));
    const overlapZ = Math.max(0, Math.min(targetArea.z2, supportArea.z2) - Math.max(targetArea.z1, supportArea.z1));

    totalSupportArea += overlapX * overlapZ;
  }

  return totalSupportArea;
}
