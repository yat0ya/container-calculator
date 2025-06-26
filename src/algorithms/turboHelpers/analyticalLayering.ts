import { Placement, Container } from './types';
import { boxesOverlap } from '../turboHelpers/utils';

/**
 * Analytically identifies layering opportunities and fills them optimally.
 * Prioritizes following the rotation patterns from the bottom layer.
 */
export function addAnalyticalLayers(
  placements: Placement[],
  container: Container,
): Placement[] {
  const newPlacements: Placement[] = [];
  const allPlacements = [...placements];

  // Find the bottom layer (y = 0)
  const bottomLayer = placements.filter(p => p.position.y === 0);
  if (bottomLayer.length === 0) return newPlacements;

  const dominantRotation = findDominantRotation(bottomLayer);
  const bottomLayerHeight = Math.max(...bottomLayer.map(p => p.rotation[1]));
  const secondLayerY = bottomLayerHeight;

  if (secondLayerY + dominantRotation[1] > container.height) {
    return newPlacements;
  }

  const secondLayerBoxes = createSecondLayer(bottomLayer, dominantRotation, secondLayerY, container, allPlacements);

  for (const newBox of secondLayerBoxes) {
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
 * Creates a second layer by replicating the bottom layer pattern at a higher Y level.
 */
function createSecondLayer(
  bottomLayer: Placement[],
  dominantRotation: [number, number, number],
  layerY: number,
  container: Container,
  existingPlacements: Placement[]
): Placement[] {
  const secondLayerBoxes: Placement[] = [];

  for (const bottomBox of bottomLayer) {
    const supportArea = calculateSupportArea(bottomBox, bottomLayer);
    const boxArea = dominantRotation[0] * dominantRotation[2];

    if (supportArea >= boxArea * 0.8) {
      const newBox: Placement = {
        position: {
          x: bottomBox.position.x,
          y: layerY,
          z: bottomBox.position.z
        },
        rotation: dominantRotation
      };

      if (
        newBox.position.x + dominantRotation[0] <= container.length &&
        newBox.position.y + dominantRotation[1] <= container.height &&
        newBox.position.z + dominantRotation[2] <= container.width
      ) {
        secondLayerBoxes.push(newBox);
      }
    }
  }

  return secondLayerBoxes;
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
