import { BoxDimensions, CalculationResult } from '../types';
import { CONTAINER_20FT } from '../constants';

export function skylineAlgorithm(boxDim: BoxDimensions): CalculationResult {
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
    const lengthFit = Math.floor(CONTAINER_20FT.length / l);
    const widthFit = Math.floor(CONTAINER_20FT.width / w);
    const heightFit = Math.floor(CONTAINER_20FT.height / h);
    
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