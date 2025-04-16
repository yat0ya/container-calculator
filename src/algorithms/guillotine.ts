import { BoxDimensions, CalculationResult, Container } from '../types';

export function guillotineAlgorithm(boxDim: BoxDimensions, container: Container): CalculationResult {
  // Convert box dimensions from cm to meters
  const boxInMeters = {
    length: boxDim.length / 100,
    width: boxDim.width / 100,
    height: boxDim.height / 100,
  };

  // Try horizontal and vertical cuts with rotations
  const rotations = [
    [boxInMeters.length, boxInMeters.width, boxInMeters.height],
    [boxInMeters.width, boxInMeters.length, boxInMeters.height],
  ];

  let maxBoxes = 0;
  let bestFit = { lengthFit: 0, widthFit: 0, heightFit: 0 };

  rotations.forEach(([l, w, h]) => {
    // Try horizontal first cut
    const hLengthFit = Math.floor(container.length / l);
    const hWidthFit = Math.floor(container.width / w);
    const hHeightFit = Math.floor(container.height / h);
    
    const hTotalBoxes = hLengthFit * hWidthFit * hHeightFit;
    
    // Try vertical first cut
    const vLengthFit = Math.floor(container.length / w);
    const vWidthFit = Math.floor(container.width / l);
    const vHeightFit = Math.floor(container.height / h);
    
    const vTotalBoxes = vLengthFit * vWidthFit * vHeightFit;
    
    if (hTotalBoxes > maxBoxes) {
      maxBoxes = hTotalBoxes;
      bestFit = { lengthFit: hLengthFit, widthFit: hWidthFit, heightFit: hHeightFit };
    }
    
    if (vTotalBoxes > maxBoxes) {
      maxBoxes = vTotalBoxes;
      bestFit = { lengthFit: vLengthFit, widthFit: vWidthFit, heightFit: vHeightFit };
    }
  });

  return {
    ...bestFit,
    totalBoxes: maxBoxes,
    boxInMeters,
  };
}