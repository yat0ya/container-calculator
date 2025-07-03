import { Placement } from './types';

export function sortLinesVertically(placements: Placement[]): Placement[] {
  const depthLayers = new Map<number, Placement[]>();

  for (const placement of placements) {
    const z = placement.position.z;
    const existing = depthLayers.get(z) || [];
    depthLayers.set(z, [...existing, placement]);
  }

  let result: Placement[] = [];

  for (const layerPlacements of depthLayers.values()) {
    const lineGroups = new Map<number, Placement[]>();

    for (const placement of layerPlacements) {
      const y = placement.position.y;
      const existing = lineGroups.get(y) || [];
      lineGroups.set(y, [...existing, placement]);
    }

    const lineLengths = new Map<number, number>();
    for (const [y, boxes] of lineGroups.entries()) {
      const maxX = Math.max(...boxes.map(b => b.position.x + b.rotation[0]));
      const minX = Math.min(...boxes.map(b => b.position.x));
      lineLengths.set(y, maxX - minX);
    }

    const sortedYLevels = Array.from(lineGroups.keys()).sort(
      (a, b) => (lineLengths.get(b)! - lineLengths.get(a)!)
    );

    let currentY = 0;

    for (const originalY of sortedYLevels) {
      const line = lineGroups.get(originalY)!;
      const sortedLine = [...line].sort((a, b) => a.position.x - b.position.x);

      const adjustedLine = sortedLine.map(box => ({
        position: {
          x: box.position.x,
          y: currentY,
          z: box.position.z
        },
        rotation: box.rotation
      }));

      result = [...result, ...adjustedLine];

      const lineHeight = Math.max(...line.map(b => b.rotation[1]));
      currentY += lineHeight;
    }
  }

  return result;
}
