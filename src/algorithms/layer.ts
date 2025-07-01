import { BoxDimensions, CalculationResult, Container, Placement } from '../types';

interface Layer {
  height: number;
  boxes: Placement[];
}

export function layerAlgorithm(boxDim: BoxDimensions, container: Container): CalculationResult {
  const boxInMeters = {
    length: boxDim.length / 100,
    width: boxDim.width / 100,
    height: boxDim.height / 100,
  };

  // All possible rotations of the box
  const rotations: [number, number, number][] = [
    [boxInMeters.length, boxInMeters.height, boxInMeters.width],
    [boxInMeters.width, boxInMeters.height, boxInMeters.length],
    [boxInMeters.length, boxInMeters.width, boxInMeters.height],
    [boxInMeters.height, boxInMeters.width, boxInMeters.length],
    [boxInMeters.width, boxInMeters.length, boxInMeters.height],
    [boxInMeters.height, boxInMeters.length, boxInMeters.width],
  ];

  function tryLayerRotation(
    layerHeight: number,
    availableLength: number,
    availableWidth: number,
    rotation: [number, number, number]
  ): { count: number; placements: Placement[] } {
    const lengthFit = Math.floor(availableLength / rotation[0]);
    const widthFit = Math.floor(availableWidth / rotation[2]);
    const placements: Placement[] = [];
    
    for (let l = 0; l < lengthFit; l++) {
      for (let w = 0; w < widthFit; w++) {
        placements.push({
          position: {
            x: l * rotation[0],
            y: layerHeight,
            z: w * rotation[2],
          },
          rotation,
        });
      }
    }
    
    return { count: lengthFit * widthFit, placements };
  }

  function findBestLayerArrangement(
    layerHeight: number,
    availableLength: number,
    availableWidth: number
  ): { count: number; placements: Placement[] } {
    let bestCount = 0;
    let bestPlacements: Placement[] = [];

    rotations.forEach((rotation) => {
      if (rotation[1] <= container.height - layerHeight) {
        // Try normal orientation
        const result1 = tryLayerRotation(layerHeight, availableLength, availableWidth, rotation);
        if (result1.count > bestCount) {
          bestCount = result1.count;
          bestPlacements = result1.placements;
        }

        // Try swapped length/width orientation
        const swappedRotation: [number, number, number] = [rotation[2], rotation[1], rotation[0]];
        const result2 = tryLayerRotation(layerHeight, availableLength, availableWidth, swappedRotation);
        if (result2.count > bestCount) {
          bestCount = result2.count;
          bestPlacements = result2.placements;
        }
      }
    });

    return { count: bestCount, placements: bestPlacements };
  }

  const layers: Layer[] = [];
  let currentHeight = 0;
  let totalBoxes = 0;
  const allPlacements: Placement[] = [];

  while (currentHeight < container.height) {
    const { count, placements } = findBestLayerArrangement(
      currentHeight,
      container.length,
      container.width
    );

    if (count === 0) break;

    const layerHeight = placements[0].rotation[1];
    layers.push({ height: layerHeight, boxes: placements });
    currentHeight += layerHeight;
    totalBoxes += count;
    allPlacements.push(...placements);
  }

  return {
    totalBoxes,
    boxInMeters,
    placements: allPlacements,
    lengthFit: 0,
    widthFit: 0,
    heightFit: 0,
  };
}