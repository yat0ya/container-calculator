// types.ts

export interface BoxDimensions {
  length: number; // in cm before conversion
  width: number;
  height: number;
  weight?: number; // kg
  value?: number;
}

export interface Container {
  id: string;
  name: string;
  length: number; // in meters
  width: number;
  height: number;
  maxLoad: number; // in kg
}

export type Algorithm = 'basic' | 'humanLike' | 'recursive';

export interface Placement {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: [number, number, number]; // length, height, width in meters
}

export interface CalculationResult {
  totalBoxes: number;
  placements: Placement[];
  boxInMeters: BoxDimensions;

  totalWeight?: number;
  maxPossibleBoxes?: number;
  totalValue?: number;

  // Used only by grid-based/basic algorithm
  lengthFit?: number;
  heightFit?: number;
  widthFit?: number;
}
