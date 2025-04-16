import { BoxDimensions } from './types';
import containers from './data/containers.json';

// Generate a slightly varied color based on a base color
export function generateVariedColor(baseHue: number, index: number): string {
  const hue = (baseHue + index * 5) % 360;
  const saturation = 60 + (index % 20);
  const lightness = 50 + (index % 10);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function calculateBoxFit(boxDim: BoxDimensions) {
  const defaultContainer = containers.find(c => c.id === '20ST');
  if (!defaultContainer) {
    throw new Error('Default container (20ST) not found in containers.json');
  }

  // Convert box dimensions from cm to meters
  const boxInMeters = {
    length: boxDim.length / 100,
    width: boxDim.width / 100,
    height: boxDim.height / 100,
  };

  // Calculate how many boxes fit in each dimension
  const lengthFit = Math.floor(defaultContainer.length / boxInMeters.length);
  const widthFit = Math.floor(defaultContainer.width / boxInMeters.width);
  const heightFit = Math.floor(defaultContainer.height / boxInMeters.height);

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