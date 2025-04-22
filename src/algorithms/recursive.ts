import { BoxDimensions, CalculationResult, Container, BoxPlacement } from '../types';
import { basicAlgorithm } from './basic';

interface Space {
  position: {
    x: number;
    y: number;
    z: number;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface PackingResult {
  totalBoxes: number;
  placements: BoxPlacement[];
}

export function recursiveAlgorithm(boxDim: BoxDimensions, container: Container): CalculationResult {
  const boxInMeters = {
    length: boxDim.length / 100,
    width: boxDim.width / 100,
    height: boxDim.height / 100,
  };

  const rotations: [number, number, number][] = [
    [boxInMeters.length, boxInMeters.height, boxInMeters.width],
    [boxInMeters.width, boxInMeters.height, boxInMeters.length],
    [boxInMeters.length, boxInMeters.width, boxInMeters.height],
    [boxInMeters.height, boxInMeters.width, boxInMeters.length],
    [boxInMeters.width, boxInMeters.length, boxInMeters.height],
    [boxInMeters.height, boxInMeters.length, boxInMeters.width],
  ];

  function tryRotation(space: Space, rotation: [number, number, number]): PackingResult {
    const lengthFit = Math.floor(space.dimensions.length / rotation[0]);
    const heightFit = Math.floor(space.dimensions.height / rotation[1]);
    const widthFit = Math.floor(space.dimensions.width / rotation[2]);
    
    const totalBoxes = lengthFit * heightFit * widthFit;
    if (totalBoxes === 0) return { totalBoxes: 0, placements: [] };

    const placements: BoxPlacement[] = [];
    for (let l = 0; l < lengthFit; l++) {
      for (let h = 0; h < heightFit; h++) {
        for (let w = 0; w < widthFit; w++) {
          placements.push({
            position: {
              x: space.position.x + (l * rotation[0]),
              y: space.position.y + (h * rotation[1]),
              z: space.position.z + (w * rotation[2]),
            },
            rotation,
          });
        }
      }
    }

    return { totalBoxes, placements };
  }

  function packSpace(space: Space): PackingResult {
    // Try all rotations in the current space
    let bestResult: PackingResult = { totalBoxes: 0, placements: [] };

    for (const rotation of rotations) {
      const mainResult = tryRotation(space, rotation);
      if (mainResult.totalBoxes === 0) continue;

      const usedSpace = {
        length: Math.floor(space.dimensions.length / rotation[0]) * rotation[0],
        height: Math.floor(space.dimensions.height / rotation[1]) * rotation[1],
        width: Math.floor(space.dimensions.width / rotation[2]) * rotation[2],
      };

      // Calculate remaining spaces
      const remainingSpaces: Space[] = [];

      // Space above
      if (space.dimensions.height - usedSpace.height >= Math.min(...rotations.map(r => Math.min(...r)))) {
        remainingSpaces.push({
          position: {
            x: space.position.x,
            y: space.position.y + usedSpace.height,
            z: space.position.z,
          },
          dimensions: {
            length: usedSpace.length,
            width: usedSpace.width,
            height: space.dimensions.height - usedSpace.height,
          },
        });
      }

      // Space to the right
      if (space.dimensions.length - usedSpace.length >= Math.min(...rotations.map(r => Math.min(...r)))) {
        remainingSpaces.push({
          position: {
            x: space.position.x + usedSpace.length,
            y: space.position.y,
            z: space.position.z,
          },
          dimensions: {
            length: space.dimensions.length - usedSpace.length,
            width: usedSpace.width,
            height: usedSpace.height,
          },
        });
      }

      // Space to the front
      if (space.dimensions.width - usedSpace.width >= Math.min(...rotations.map(r => Math.min(...r)))) {
        remainingSpaces.push({
          position: {
            x: space.position.x,
            y: space.position.y,
            z: space.position.z + usedSpace.width,
          },
          dimensions: {
            length: usedSpace.length,
            width: space.dimensions.width - usedSpace.width,
            height: usedSpace.height,
          },
        });
      }

      // Try to fill remaining spaces
      let totalBoxesWithRemaining = mainResult.totalBoxes;
      const additionalPlacements: BoxPlacement[] = [];

      for (const remainingSpace of remainingSpaces) {
        const remainingResult = packSpace(remainingSpace);
        totalBoxesWithRemaining += remainingResult.totalBoxes;
        additionalPlacements.push(...remainingResult.placements);
      }

      // Update best result if current rotation yields more boxes
      if (totalBoxesWithRemaining > bestResult.totalBoxes) {
        bestResult = {
          totalBoxes: totalBoxesWithRemaining,
          placements: [...mainResult.placements, ...additionalPlacements],
        };
      }
    }

    return bestResult;
  }

  // Start with the entire container
  const result = packSpace({
    position: { x: 0, y: 0, z: 0 },
    dimensions: {
      length: container.length,
      width: container.width,
      height: container.height,
    },
  });

  return {
    totalBoxes: result.totalBoxes,
    boxInMeters,
    placements: result.placements,
    lengthFit: 0,  // These are not used when placements are provided
    widthFit: 0,
    heightFit: 0,
  };
}