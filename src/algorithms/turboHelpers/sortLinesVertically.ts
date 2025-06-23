import { Placement } from '../../types';
import { EPSILON } from '../../constants';

export function sortLinesVertically(placements: Placement[]): Placement[] {
  const depthLayers = new Map<number, Placement[]>();
  
  placements.forEach(placement => {
    const z = Math.round(placement.position.z / EPSILON) * EPSILON;
    if (!depthLayers.has(z)) {
      depthLayers.set(z, []);
    }
    depthLayers.get(z)!.push(placement);
  });

  const result: Placement[] = [];

  depthLayers.forEach(layerPlacements => {
    const lineGroups = new Map<number, Placement[]>();
    
    layerPlacements.forEach(placement => {
      const y = Math.round(placement.position.y / EPSILON) * EPSILON;
      if (!lineGroups.has(y)) {
        lineGroups.set(y, []);
      }
      lineGroups.get(y)!.push(placement);
    });

    const lineLengths = new Map<number, number>();
    lineGroups.forEach((boxes, y) => {
      const maxX = Math.max(...boxes.map(b => b.position.x + b.rotation[0]));
      const minX = Math.min(...boxes.map(b => b.position.x));
      lineLengths.set(y, maxX - minX);
    });

    const sortedYLevels = Array.from(lineGroups.keys()).sort((a, b) => 
      lineLengths.get(b)! - lineLengths.get(a)!
    );

    let currentY = 0;
    sortedYLevels.forEach(originalY => {
      const line = lineGroups.get(originalY)!;
      const sortedLine = [...line].sort((a, b) => a.position.x - b.position.x);

      sortedLine.forEach(box => {
        result.push({
          position: {
            x: box.position.x,
            y: currentY,
            z: box.position.z
          },
          rotation: box.rotation
        });
      });

      const lineHeight = Math.max(...line.map(b => b.rotation[1]));
      currentY += lineHeight;
    });
  });

  return result;
}
