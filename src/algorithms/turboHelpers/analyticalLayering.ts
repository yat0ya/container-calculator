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
  const newPlacements: Placement[] = [];
  const allPlacements = [...placements];

  // Find the bottom layer (y = 0)
  let currentLayer = placements.filter(p => p.position.y === 0);
  if (currentLayer.length === 0) return newPlacements;

  const dominantRotation = findDominantRotation(currentLayer);
  const layerHeight = dominantRotation[1];
  let currentY = layerHeight;

  while (currentY + layerHeight <= container.height) {
    const nextLayer = createLayer(currentLayer, dominantRotation, currentY, container, allPlacements);

    if (nextLayer.length === 0) break;

    for (const newBox of nextLayer) {
      let hasOverlap = false;
      for (const existing of allPlacements) {
        if (boxesOverlap(newBox, existing)) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        newPlacements.push(newBox);
        allPlacements.push(newBox);
      }
    }

    currentLayer = nextLayer;
    currentY += layerHeight;
  }

  return newPlacements;
}

/**
 * Finds the most common rotation pattern in a layer of boxes.
 */
function findDominantRotation(boxes: Placement[]): [number, number, number] {
  const rotationCounts = new Map<string, { rotation: [number, number, number], count: number }>();

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
  _dominantRotation: [number, number, number], // unused now
  layerY: number,
  container: Container,
  existingPlacements: Placement[]
): Placement[] {
  const layerBoxes: Placement[] = [];

  for (const belowBox of previousLayer) {
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

    if (supportArea >= boxArea * 0.8) {
      if (
        newBox.position.x + rotation[0] <= container.length &&
        newBox.position.y + rotation[1] <= container.height &&
        newBox.position.z + rotation[2] <= container.width
      ) {
        layerBoxes.push(newBox);
      }
    }
  }

  return layerBoxes;
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
