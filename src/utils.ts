// utils.ts

import { BoxDimensions } from './types';
import { Placement } from './types';
import { EPSILON } from './constants';

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

export function generateOrientations({ length, width, height }: BoxDimensions): [number, number, number][] {
  return [
    [length, width, height], [length, height, width],
    [width, length, height], [width, height, length],
    [height, length, width], [height, width, length],
  ];
}

export function boxesOverlap(a: Placement, b: Placement): boolean {
  return !(
    a.position.x + a.rotation[0] <= b.position.x ||
    b.position.x + b.rotation[0] <= a.position.x ||
    a.position.y + a.rotation[1] <= b.position.y ||
    b.position.y + b.rotation[1] <= a.position.y ||
    a.position.z + a.rotation[2] <= b.position.z ||
    b.position.z + b.rotation[2] <= a.position.z
  );
}