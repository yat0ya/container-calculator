import { BoxDimensions, CalculationResult, Container, BoxPlacement } from '../types';

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

  const minBoxDimension = Math.min(
    boxInMeters.length,
    boxInMeters.width,
    boxInMeters.height
  );

  function isSpaceUsable(space: Space): boolean {
    return (
      space.dimensions.length >= minBoxDimension &&
      space.dimensions.width >= minBoxDimension &&
      space.dimensions.height >= minBoxDimension
    );
  }

  function tryRotation(space: Space, rotation: [number, number, number]): PackingResult {
    if (
      rotation[0] > space.dimensions.length ||
      rotation[1] > space.dimensions.height ||
      rotation[2] > space.dimensions.width
    ) {
      return { totalBoxes: 0, placements: [] };
    }

    const lengthFit = Math.floor(space.dimensions.length / rotation[0]);
    const heightFit = Math.floor(space.dimensions.height / rotation[1]);
    const widthFit = Math.floor(space.dimensions.width / rotation[2]);
    
    let totalBoxes = lengthFit * heightFit * widthFit;
    if (totalBoxes === 0) return { totalBoxes: 0, placements: [] };

    const placements: BoxPlacement[] = [];
    
    // Pack boxes tightly without gaps
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

    // Calculate remaining spaces more precisely
    const usedLength = lengthFit * rotation[0];
    const usedHeight = heightFit * rotation[1];
    const usedWidth = widthFit * rotation[2];

    const remainingSpaces: Space[] = [];

    // Space to the right
    if (space.dimensions.length - usedLength >= minBoxDimension) {
      remainingSpaces.push({
        position: {
          x: space.position.x + usedLength,
          y: space.position.y,
          z: space.position.z,
        },
        dimensions: {
          length: space.dimensions.length - usedLength,
          width: space.dimensions.width,
          height: space.dimensions.height,
        },
      });
    }

    // Space above
    if (space.dimensions.height - usedHeight >= minBoxDimension) {
      remainingSpaces.push({
        position: {
          x: space.position.x,
          y: space.position.y + usedHeight,
          z: space.position.z,
        },
        dimensions: {
          length: usedLength,
          width: space.dimensions.width,
          height: space.dimensions.height - usedHeight,
        },
      });
    }

    // Space in front
    if (space.dimensions.width - usedWidth >= minBoxDimension) {
      remainingSpaces.push({
        position: {
          x: space.position.x,
          y: space.position.y,
          z: space.position.z + usedWidth,
        },
        dimensions: {
          length: usedLength,
          width: space.dimensions.width - usedWidth,
          height: usedHeight,
        },
      });
    }

    // Try to fill remaining spaces
    for (const remainingSpace of remainingSpaces) {
      if (isSpaceUsable(remainingSpace)) {
        const result = packSpace(remainingSpace);
        totalBoxes += result.totalBoxes;
        placements.push(...result.placements);
      }
    }

    return { totalBoxes, placements };
  }

  function packSpace(space: Space): PackingResult {
    if (!isSpaceUsable(space)) {
      return { totalBoxes: 0, placements: [] };
    }

    let bestResult: PackingResult = { totalBoxes: 0, placements: [] };

    // Try all possible rotations
    for (const rotation of rotations) {
      const result = tryRotation(space, rotation);
      if (result.totalBoxes > bestResult.totalBoxes) {
        bestResult = result;
      }
    }

    return bestResult;
  }

  const initialSpace: Space = {
    position: { x: 0, y: 0, z: 0 },
    dimensions: {
      length: container.length,
      width: container.width,
      height: container.height,
    },
  };

  const result = packSpace(initialSpace);

  // Apply weight restrictions if needed
  let finalBoxCount = result.totalBoxes;
  let maxPossibleBoxes = result.totalBoxes;
  let totalWeight: number | undefined;

  if (boxDim.weight !== undefined) {
    totalWeight = result.totalBoxes * boxDim.weight;
    if (totalWeight > container.maxLoad) {
      finalBoxCount = Math.floor(container.maxLoad / boxDim.weight);
      totalWeight = finalBoxCount * boxDim.weight;
      result.placements = result.placements.slice(0, finalBoxCount);
    }
  }

  return {
    totalBoxes: finalBoxCount,
    boxInMeters,
    placements: result.placements,
    lengthFit: 0,
    widthFit: 0,
    heightFit: 0,
    totalWeight,
    maxPossibleBoxes,
  };
}

interface PackingResult {
  totalBoxes: number;
  placements: BoxPlacement[];
}