import { BoxDimensions, CalculationResult, Container } from '../types';

export function skylineAlgorithm(boxDim: BoxDimensions, container: Container): CalculationResult {
  // Convert box dimensions from cm to meters
  const boxInMeters = {
    length: boxDim.length / 100,
    width: boxDim.width / 100,
    height: boxDim.height / 100,
  };

  // Try all possible rotations and take the best result
  const rotations = [
    [boxInMeters.length, boxInMeters.width, boxInMeters.height],
    [boxInMeters.width, boxInMeters.length, boxInMeters.height],
    [boxInMeters.length, boxInMeters.height, boxInMeters.width],
    [boxInMeters.height, boxInMeters.length, boxInMeters.width],
    [boxInMeters.width, boxInMeters.height, boxInMeters.length],
    [boxInMeters.height, boxInMeters.width, boxInMeters.length],
  ];

  let maxBoxes = 0;
  let bestFit = { lengthFit: 0, widthFit: 0, heightFit: 0 };

  rotations.forEach(([l, w, h]) => {
    const lengthFit = Math.floor(container.length / l);
    const widthFit = Math.floor(container.width / w);
    const heightFit = Math.floor(container.height / h);
    
    const totalBoxes = lengthFit * widthFit * heightFit;
    
    if (totalBoxes > maxBoxes) {
      maxBoxes = totalBoxes;
      bestFit = { lengthFit, widthFit, heightFit };
    }
  });

  return {
    ...bestFit,
    totalBoxes: maxBoxes,
    boxInMeters,
  };
}