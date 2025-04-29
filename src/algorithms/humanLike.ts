import { BoxDimensions, CalculationResult, Container, BoxPlacement } from '../types';

interface CrossSectionConfig {
  mainRotation: [number, number, number];
  columnRotation: [number, number, number] | null;
  boxesPerWidth: number;
  boxesPerHeight: number;
  crossSectionArea: number;
}

export function humanLikeAlgorithm(boxDim: BoxDimensions, container: Container): CalculationResult {
  const boxInMeters = {
    length: boxDim.length / 100,
    width: boxDim.width / 100,
    height: boxDim.height / 100,
  };

  const rotations: [number, number, number][] = [
    [boxInMeters.length, boxInMeters.height, boxInMeters.width],
    [boxInMeters.width, boxInMeters.height, boxInMeters.length],
    [boxInMeters.length, boxInMeters.width, boxInMeters.height],
    [boxInMeters.height, boxInMeters.width, boxInMeters.length],
    [boxInMeters.width, boxInMeters.length, boxInMeters.height],
    [boxInMeters.height, boxInMeters.length, boxInMeters.width],
  ];

  function calculateCrossSectionArea(
    mainRotation: [number, number, number],
    boxesPerWidth: number,
    boxesPerHeight: number,
    columnRotation: [number, number, number] | null
  ): number {
    const mainWidth = boxesPerWidth * mainRotation[2];
    const mainHeight = boxesPerHeight * mainRotation[1];
    
    let totalArea = 0;
    totalArea += mainWidth * (container.height - mainHeight);
    
    if (columnRotation) {
      const columnStartZ = mainWidth;
      const columnBoxesHeight = Math.floor(container.height / columnRotation[1]);
      const columnHeight = columnBoxesHeight * columnRotation[1];
      
      totalArea += columnRotation[2] * (container.height - columnHeight);
      totalArea += container.height * (container.width - (mainWidth + columnRotation[2]));
    } else {
      totalArea += container.height * (container.width - mainWidth);
    }
    
    return totalArea;
  }

  // Find optimal cross-section configuration
  let bestConfig: CrossSectionConfig | null = null;

  rotations.forEach(mainRot => {
    const boxesPerWidth = Math.floor((container.width - Math.min(...Object.values(boxInMeters))) / mainRot[2]);
    const boxesPerHeight = Math.floor(container.height / mainRot[1]);
    
    if (boxesPerWidth === 0 || boxesPerHeight === 0) return;

    rotations.forEach(colRot => {
      const remainingWidth = container.width - (boxesPerWidth * mainRot[2]);
      if (colRot[2] <= remainingWidth) {
        const area = calculateCrossSectionArea(mainRot, boxesPerWidth, boxesPerHeight, colRot);
        
        if (!bestConfig || area < bestConfig.crossSectionArea) {
          bestConfig = {
            mainRotation: mainRot,
            columnRotation: colRot,
            boxesPerWidth,
            boxesPerHeight,
            crossSectionArea: area
          };
        }
      }
    });
  });

  if (!bestConfig) {
    return {
      totalBoxes: 0,
      boxInMeters,
      placements: [],
      lengthFit: 0,
      widthFit: 0,
      heightFit: 0,
    };
  }

  const placements: BoxPlacement[] = [];
  
  // Calculate how many boxes fit along length for main section
  const mainBoxesLength = Math.floor(container.length / bestConfig.mainRotation[0]);
  
  // Place boxes continuously along length
  for (let h = 0; h < bestConfig.boxesPerHeight; h++) {
    for (let w = 0; w < bestConfig.boxesPerWidth; w++) {
      for (let l = 0; l < mainBoxesLength; l++) {
        placements.push({
          position: {
            x: l * bestConfig.mainRotation[0],
            y: h * bestConfig.mainRotation[1],
            z: w * bestConfig.mainRotation[2],
          },
          rotation: bestConfig.mainRotation,
        });
      }
    }
  }

  // Place column boxes continuously
  if (bestConfig.columnRotation) {
    const columnStartZ = bestConfig.boxesPerWidth * bestConfig.mainRotation[2];
    const columnBoxesHeight = Math.floor(container.height / bestConfig.columnRotation[1]);
    const columnBoxesLength = Math.floor(container.length / bestConfig.columnRotation[0]);
    
    for (let h = 0; h < columnBoxesHeight; h++) {
      for (let l = 0; l < columnBoxesLength; l++) {
        placements.push({
          position: {
            x: l * bestConfig.columnRotation[0],
            y: h * bestConfig.columnRotation[1],
            z: columnStartZ,
          },
          rotation: bestConfig.columnRotation,
        });
      }
    }
  }

  return {
    totalBoxes: placements.length,
    boxInMeters,
    placements,
    lengthFit: mainBoxesLength,
    widthFit: bestConfig.boxesPerWidth + (bestConfig.columnRotation ? 1 : 0),
    heightFit: bestConfig.boxesPerHeight,
  };
}