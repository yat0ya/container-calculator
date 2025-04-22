import { BoxDimensions, CalculationResult, Container, BoxPlacement } from '../types';
import { basicAlgorithm } from './basic';

interface Position {
  x: number;
  y: number;
  z: number;
}

interface Space {
  position: Position;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export function greedyAlgorithm(boxDim: BoxDimensions, container: Container): CalculationResult {
  // Convert box dimensions from cm to meters
  const boxInMeters = {
    length: boxDim.length / 100,
    width: boxDim.width / 100,
    height: boxDim.height / 100,
  };

  // First, use basic algorithm for regular packing
  const basicResult = basicAlgorithm(boxDim, container);
  
  // Find optimal rotation from basic algorithm
  const rotations: [number, number, number][] = [
    [boxInMeters.length, boxInMeters.height, boxInMeters.width],
    [boxInMeters.width, boxInMeters.height, boxInMeters.length],
    [boxInMeters.length, boxInMeters.width, boxInMeters.height],
    [boxInMeters.height, boxInMeters.width, boxInMeters.length],
    [boxInMeters.width, boxInMeters.length, boxInMeters.height],
    [boxInMeters.height, boxInMeters.length, boxInMeters.width],
  ];

  const optimalRotation = rotations.find(([l, h, w]) => {
    const lengthFit = Math.floor(container.length / l);
    const heightFit = Math.floor(container.height / h);
    const widthFit = Math.floor(container.width / w);
    return lengthFit === basicResult.lengthFit && 
           heightFit === basicResult.heightFit && 
           widthFit === basicResult.widthFit;
  }) || rotations[0];

  // Calculate the space used by basic packing
  const usedSpace = {
    length: basicResult.lengthFit * optimalRotation[0],
    width: basicResult.widthFit * optimalRotation[2],
    height: basicResult.heightFit * optimalRotation[1],
  };

  // Keep track of occupied spaces
  const occupiedSpaces: BoxPlacement[] = [];

  // Helper function to check if a new box overlaps with any existing boxes
  function checkOverlap(newBox: BoxPlacement): boolean {
    return occupiedSpaces.some(existingBox => {
      const newBoxEnd = {
        x: newBox.position.x + newBox.rotation[0],
        y: newBox.position.y + newBox.rotation[1],
        z: newBox.position.z + newBox.rotation[2],
      };
      
      const existingBoxEnd = {
        x: existingBox.position.x + existingBox.rotation[0],
        y: existingBox.position.y + existingBox.rotation[1],
        z: existingBox.position.z + existingBox.rotation[2],
      };

      return !(
        newBox.position.x >= existingBoxEnd.x ||
        newBoxEnd.x <= existingBox.position.x ||
        newBox.position.y >= existingBoxEnd.y ||
        newBoxEnd.y <= existingBox.position.y ||
        newBox.position.z >= existingBoxEnd.z ||
        newBoxEnd.z <= existingBox.position.z
      );
    });
  }

  // Define remaining spaces
  const remainingSpaces: Space[] = [];

  // Space above regular packing
  if (usedSpace.height < container.height) {
    remainingSpaces.push({
      position: { x: 0, y: usedSpace.height, z: 0 },
      dimensions: {
        length: usedSpace.length,
        width: usedSpace.width,
        height: container.height - usedSpace.height,
      },
    });
  }

  // Space to the right of regular packing
  if (usedSpace.length < container.length) {
    remainingSpaces.push({
      position: { x: usedSpace.length, y: 0, z: 0 },
      dimensions: {
        length: container.length - usedSpace.length,
        width: usedSpace.width,
        height: usedSpace.height,
      },
    });
  }

  // Space to the front of regular packing
  if (usedSpace.width < container.width) {
    remainingSpaces.push({
      position: { x: 0, y: 0, z: usedSpace.width },
      dimensions: {
        length: usedSpace.length,
        width: container.width - usedSpace.width,
        height: usedSpace.height,
      },
    });
  }

  // Helper function to check if a box fits in a space and container
  function doesBoxFit(space: Space, position: Position, rotation: [number, number, number]): boolean {
    const newBox: BoxPlacement = {
      position,
      rotation,
    };

    // Check if box fits within the space
    const fitsInSpace = 
      position.x + rotation[0] <= space.position.x + space.dimensions.length &&
      position.y + rotation[1] <= space.position.y + space.dimensions.height &&
      position.z + rotation[2] <= space.position.z + space.dimensions.width;

    // Check if box fits within container bounds
    const fitsInContainer =
      position.x + rotation[0] <= container.length &&
      position.y + rotation[1] <= container.height &&
      position.z + rotation[2] <= container.width;

    // Check if box overlaps with any existing boxes
    const doesNotOverlap = !checkOverlap(newBox);

    return fitsInSpace && fitsInContainer && doesNotOverlap;
  }

  const additionalPlacements: BoxPlacement[] = [];

  // Try to fill remaining spaces
  for (const space of remainingSpaces) {
    let currentPosition: Position = { ...space.position };
    const minStep = Math.min(
      ...rotations.map(r => Math.min(r[0], r[1], r[2]))
    );

    while (currentPosition.y + minStep <= space.position.y + space.dimensions.height) {
      while (currentPosition.z + minStep <= space.position.z + space.dimensions.width) {
        while (currentPosition.x + minStep <= space.position.x + space.dimensions.length) {
          let bestRotation: [number, number, number] | null = null;
          let bestVolume = 0;

          // Try all rotations at current position
          for (const rotation of rotations) {
            if (doesBoxFit(space, currentPosition, rotation)) {
              const volume = rotation[0] * rotation[1] * rotation[2];
              if (volume > bestVolume) {
                bestVolume = volume;
                bestRotation = rotation;
              }
            }
          }

          if (bestRotation) {
            const newPlacement: BoxPlacement = {
              position: { ...currentPosition },
              rotation: bestRotation,
            };
            additionalPlacements.push(newPlacement);
            occupiedSpaces.push(newPlacement);
            currentPosition.x += bestRotation[0];
          } else {
            currentPosition.x += minStep;
          }
        }
        currentPosition.x = space.position.x;
        currentPosition.z += minStep;
      }
      currentPosition.z = space.position.z;
      currentPosition.y += minStep;
    }
  }

  // Generate placements for basic algorithm boxes
  const basicPlacements: BoxPlacement[] = [];
  for (let l = 0; l < basicResult.lengthFit; l++) {
    for (let h = 0; h < basicResult.heightFit; h++) {
      for (let w = 0; w < basicResult.widthFit; w++) {
        const newPlacement: BoxPlacement = {
          position: {
            x: l * optimalRotation[0],
            y: h * optimalRotation[1],
            z: w * optimalRotation[2],
          },
          rotation: optimalRotation,
        };
        basicPlacements.push(newPlacement);
        occupiedSpaces.push(newPlacement);
      }
    }
  }

  // Combine all placements
  const allPlacements = [...basicPlacements, ...additionalPlacements];

  return {
    ...basicResult,
    totalBoxes: allPlacements.length,
    boxInMeters,
    placements: allPlacements,
  };
}