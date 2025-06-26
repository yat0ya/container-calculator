export type Algorithm = 'turbo' | 'basic' | 'humanLike' | 'plugger' | 'recursive';

export interface BoxDimensions {
  length: number; // originally in cm, converted to mm
  width: number;
  height: number;
  weight?: number; // in kg
  value?: number;
}

export interface Container {
  id: string;
  name: string;
  length: number; // in mm
  width: number;  // in mm
  height: number; // in mm
  maxLoad: number; // in kg
}

export interface Placement {
  position: {
    x: number; // in mm
    y: number; // in mm
    z: number; // in mm
  };
  rotation: [number, number, number]; // [length, height, width] in mm
}

export interface CalculationResult {
  totalBoxes: number;
  placements: Placement[];
  boxInMeters: BoxDimensions; // this can stay in meters if you want for output

  totalWeight?: number;
  totalValue?: number;
  maxPossibleBoxes?: number;

  lengthFit?: number;
  heightFit?: number;
  widthFit?: number;
}

export interface CalculationInput {
  boxDimensions: BoxDimensions; // input in cm
  container: Container;         // input from JSON in mm
  algorithm: Algorithm;
}
