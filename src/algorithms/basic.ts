import { BoxDimensions, CalculationResult } from '../types';
import { CONTAINER_20FT } from '../constants';

export function basicAlgorithm(boxDim: BoxDimensions): CalculationResult {
  // Convert box dimensions from cm to meters
  const boxInMeters = {
    length: boxDim.length / 100,
    width: boxDim.width / 100,
    height: boxDim.height / 100,
  };

  // Calculate how many boxes fit in each dimension without rotation
  const lengthFit = Math.floor(CONTAINER_20FT.length / boxInMeters.length);
  const widthFit = Math.floor(CONTAINER_20FT.width / boxInMeters.width);
  const heightFit = Math.floor(CONTAINER_20FT.height / boxInMeters.height);

  // Calculate total boxes
  const totalBoxes = lengthFit * widthFit * heightFit;

  return {
    lengthFit,
    widthFit,
    heightFit,
    totalBoxes,
    boxInMeters,
  };
}