// utils.ts

import { BoxDimensions } from './types';

/**
 * Converts box dimensions from centimeters to meters.
 * Preserves optional fields (weight, value).
 */
export function convertToMeters(box: BoxDimensions): BoxDimensions {
  return {
    length: box.length / 100,
    width: box.width / 100,
    height: box.height / 100,
    weight: box.weight,
    value: box.value,
  };
}

/**
 * Generates a visually distinct color based on a base hue and index.
 */
export function generateVariedColor(baseHue: number, index: number): string {
  const hue = (baseHue + index * 37) % 360; // Spread hues evenly
  return `hsl(${hue}, 70%, 60%)`;
}