// types.ts

export type Algorithm = 'turbo' | 'basic' | 'humanLike' | 'plugger' | 'recursive';

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
  totalValue?: number;
  maxPossibleBoxes?: number;

  // Used only by grid-based/basic algorithm
  lengthFit?: number;
  heightFit?: number;
  widthFit?: number;
}

export interface CalculationInput {
  boxDimensions: BoxDimensions;
  container: Container;
  algorithm: Algorithm;
}