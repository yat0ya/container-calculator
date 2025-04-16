import { BoxDimensions } from './types';

// Generate a slightly varied color based on a base color
export function generateVariedColor(baseHue: number, index: number): string {
  const hue = (baseHue + index * 5) % 360;
  const saturation = 60 + (index % 20);
  const lightness = 50 + (index % 10);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}