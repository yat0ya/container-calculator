import { BoxDimensions, Placement } from './types';

/**
 * Checks if two boxes overlap using integer millimeter coordinates.
 */
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

/**
 * Generates unique valid orientations of a box based on dimension equality
 * and container size constraints.
 */
export function generateOrientations(
  { length, width, height }: BoxDimensions,
  container: { length: number; width: number; height: number }
): [number, number, number][] {
  const permutations: [number, number, number][] = [
    [length, width, height],
    [length, height, width],
    [width, length, height],
    [width, height, length],
    [height, length, width],
    [height, width, length],
  ];

  const unique = new Set<string>();
  const valid: [number, number, number][] = [];

  for (const [l, w, h] of permutations) {
    if (
      (l > container.length && l > container.width) ||
      (w > container.length && w > container.width) ||
      h > container.height
    ) continue;

    const key = [l, w, h].join('x');
    if (!unique.has(key)) {
      unique.add(key);
      valid.push([l, w, h]);
    }
  }

  return valid;
}

/**
 * Assigns a color for visualization based on index.
 */
export function generateVariedColor(baseHue: number, index: number): string {
  const hue = (baseHue + index * 37) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Converts box dimensions from centimeters to millimeters.
 */
export function convertToMillimeters(box: BoxDimensions): BoxDimensions {
  return {
    length: Math.round(box.length * 10),
    width: Math.round(box.width * 10),
    height: Math.round(box.height * 10),
    weight: box.weight,
    value: box.value,
  };
}

/**
 * Sorts placements left-to-right (smallest x + width first).
 * Used before tail area preparation.
 */
export function sortForTailArea(placements: Placement[]): Placement[] {
  return [...placements].sort((a, b) =>
    (a.position.x + a.rotation[0]) - (b.position.x + b.rotation[0])
  );
}
