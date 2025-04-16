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
  ];

  let maxBoxes = 0;
  let bestFit = { lengthFit: 0, widthFit: 0, heightFit: 0 };

  rotations.forEach(([l, h, w]) => {
    const lengthFit = Math.floor(container.length / l);
    const heightFit = Math.floor(container.height / h);
    const widthFit = Math.floor(container.width / w);
    
    const totalBoxes = lengthFit * heightFit * widthFit;
    
    if (totalBoxes > maxBoxes) {
      maxBoxes = totalBoxes;
      bestFit = { lengthFit, heightFit, widthFit };
    }
  });

  return {
    ...bestFit,
    totalBoxes: maxBoxes,
    boxInMeters,
  };
}