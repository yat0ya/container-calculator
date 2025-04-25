import { BoxDimensions, CalculationResult, Container } from '../types';

export function basicAlgorithm(boxDim: BoxDimensions, container: Container): CalculationResult {
  // Convert box dimensions from cm to meters
  const boxInMeters = {
    length: boxDim.length / 100,
    width: boxDim.width / 100,
    height: boxDim.height / 100,
  };

  // Try all possible rotations and take the best result
  // Order matches Scene.tsx rotations array
  const rotations = [
    [boxInMeters.length, boxInMeters.height, boxInMeters.width],
    [boxInMeters.width, boxInMeters.height, boxInMeters.length],
    [boxInMeters.length, boxInMeters.width, boxInMeters.height],
    [boxInMeters.height, boxInMeters.width, boxInMeters.length],
    [boxInMeters.width, boxInMeters.length, boxInMeters.height],
    [boxInMeters.height, boxInMeters.length, boxInMeters.width],
  ] as [number, number, number][];

  let maxBoxes = 0;
  let bestFit = { lengthFit: 0, widthFit: 0, heightFit: 0 };
  let bestRotation = rotations[0];

  rotations.forEach((rotation) => {
    const [l, h, w] = rotation;
    const lengthFit = Math.floor(container.length / l);
    const heightFit = Math.floor(container.height / h);
    const widthFit = Math.floor(container.width / w);
    
    const totalBoxes = lengthFit * heightFit * widthFit;
    
    if (totalBoxes > maxBoxes) {
      maxBoxes = totalBoxes;
      bestFit = { lengthFit, heightFit, widthFit };
      bestRotation = rotation;
    }
  });

  // Generate placements for visualization
  const placements = [];
  const [l, h, w] = bestRotation;
  
  for (let x = 0; x < bestFit.lengthFit; x++) {
    for (let y = 0; y < bestFit.heightFit; y++) {
      for (let z = 0; z < bestFit.widthFit; z++) {
        placements.push({
          position: {
            x: x * l,
            y: y * h,
            z: z * w,
          },
          rotation: bestRotation,
        });
      }
    }
  }

  // Calculate weight-based restrictions if weight is provided
  let totalBoxes = maxBoxes;
  let totalWeight;
  let maxPossibleBoxes;

  if (boxDim.weight !== undefined) {
    totalWeight = maxBoxes * boxDim.weight;
    maxPossibleBoxes = maxBoxes;

    if (totalWeight > container.maxLoad) {
      maxPossibleBoxes = maxBoxes;
      totalBoxes = Math.floor(container.maxLoad / boxDim.weight);
      totalWeight = totalBoxes * boxDim.weight;
      // Trim placements to match the weight restriction
      placements.length = totalBoxes;
    }
  }

  // Calculate total value if provided
  const totalValue = boxDim.value !== undefined ? totalBoxes * boxDim.value : undefined;

  return {
    ...bestFit,
    totalBoxes,
    boxInMeters,
    placements,
    totalWeight,
    totalValue,
    maxPossibleBoxes,
  };
}