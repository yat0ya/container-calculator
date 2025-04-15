import { BoxDimensions, CalculationResult } from '../types';
import { CONTAINER_20FT } from '../constants';

export function guillotineAlgorithm(boxDim: BoxDimensions): CalculationResult {
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
    const hLengthFit = Math.floor(CONTAINER_20FT.length / l);
    const hWidthFit = Math.floor(CONTAINER_20FT.width / w);
    const hHeightFit = Math.floor(CONTAINER_20FT.height / h);
    
    const hTotalBoxes = hLengthFit * hWidthFit * hHeightFit;
    
    // Try vertical first cut
    const vLengthFit = Math.floor(CONTAINER_20FT.length / w);
    const vWidthFit = Math.floor(CONTAINER_20FT.width / l);
    const vHeightFit = Math.floor(CONTAINER_20FT.height / h);
    
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