import { Placement, Container } from '../../types';
import { EPSILON } from '../../constants';
import { boxesOverlap } from '../../utils';

/**
 * Analytically identifies layering opportunities and fills them optimally.
 * Prioritizes following the rotation patterns from the bottom layer.
 */
export function addAnalyticalLayers(
  placements: Placement[],
  container: Container,
): Placement[] {
  console.log('🔍 Starting analytical layering with', placements.length, 'existing placements');
  
  const newPlacements: Placement[] = [];
  const allPlacements = [...placements];
  
  // Find the bottom layer (y = 0 or close to it)
  const bottomLayer = placements.filter(p => p.position.y < EPSILON * 10);
  console.log('📦 Bottom layer has', bottomLayer.length, 'boxes');
  
  if (bottomLayer.length === 0) {
    console.log('❌ No bottom layer found');
    return newPlacements;
  }
  
  // Find the dominant rotation in the bottom layer
  const dominantRotation = findDominantRotation(bottomLayer);
  console.log('🔄 Dominant rotation:', dominantRotation);
  
  // Find the height of the bottom layer
  const bottomLayerHeight = Math.max(...bottomLayer.map(p => p.rotation[1]));
  const secondLayerY = bottomLayerHeight;
  
  console.log('📏 Bottom layer height:', bottomLayerHeight, 'Second layer Y:', secondLayerY);
  
  // Check if there's room for a second layer
  if (secondLayerY + dominantRotation[1] > container.height + EPSILON) {
    console.log('❌ No room for second layer');
    return newPlacements;
  }
  
  // Try to place boxes on the second layer using the same pattern as bottom layer
  const secondLayerBoxes = createSecondLayer(bottomLayer, dominantRotation, secondLayerY, container, allPlacements);
  
  console.log('✅ Created', secondLayerBoxes.length, 'boxes for second layer');
  
  // Validate and add the new boxes
  for (const newBox of secondLayerBoxes) {
    let hasOverlap = false;
    
    for (const existing of allPlacements) {
      if (boxesOverlap(newBox, existing)) {
        hasOverlap = true;
        console.log('⚠️ Overlap detected, skipping box at', newBox.position);
        break;
      }
    }
    
    if (!hasOverlap) {
      newPlacements.push(newBox);
      allPlacements.push(newBox);
    }
  }
  
  console.log('🎯 Final analytical layering result:', newPlacements.length, 'new boxes added');
  return newPlacements;
}

/**
 * Finds the most common rotation pattern in a layer of boxes.
 */
function findDominantRotation(boxes: Placement[]): [number, number, number] {
  const rotationCounts = new Map<string, { rotation: [number, number, number], count: number }>();
  
  for (const box of boxes) {
    const key = `${box.rotation[0].toFixed(3)}-${box.rotation[1].toFixed(3)}-${box.rotation[2].toFixed(3)}`;
    
    if (rotationCounts.has(key)) {
      rotationCounts.get(key)!.count++;
    } else {
      rotationCounts.set(key, { rotation: [...box.rotation] as [number, number, number], count: 1 });
    }
  }
  
  // Find the rotation with the highest count
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
  
  // For each box in the bottom layer, try to place a corresponding box in the second layer
  for (const bottomBox of bottomLayer) {
    // Check if there's adequate support for a box at this position
    const supportArea = calculateSupportArea(bottomBox, bottomLayer);
    const boxArea = dominantRotation[0] * dominantRotation[2];
    
    // Require at least 80% support
    if (supportArea >= boxArea * 0.8) {
      const newBox: Placement = {
        position: {
          x: bottomBox.position.x,
          y: layerY,
          z: bottomBox.position.z
        },
        rotation: dominantRotation
      };
      
      // Check if the new box fits within container bounds
      if (
        newBox.position.x + dominantRotation[0] <= container.length + EPSILON &&
        newBox.position.y + dominantRotation[1] <= container.height + EPSILON &&
        newBox.position.z + dominantRotation[2] <= container.width + EPSILON
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
    
    // Calculate overlap area
    const overlapX = Math.max(0, Math.min(targetArea.x2, supportArea.x2) - Math.max(targetArea.x1, supportArea.x1));
    const overlapZ = Math.max(0, Math.min(targetArea.z2, supportArea.z2) - Math.max(targetArea.z1, supportArea.z1));
    
    totalSupportArea += overlapX * overlapZ;
  }
  
  return totalSupportArea;
}