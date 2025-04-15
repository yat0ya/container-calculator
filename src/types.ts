export interface BoxDimensions {
  length: number;
  width: number;
  height: number;
}

export interface CalculationResult {
  lengthFit: number;
  widthFit: number;
  heightFit: number;
  totalBoxes: number;
  boxInMeters: BoxDimensions;
}

export type Algorithm = 'basic' | 'skyline' | 'guillotine';

export interface AlgorithmOption {
  id: Algorithm;
  name: string;
  description: string;
}