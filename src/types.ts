import { Vector3 } from 'three';

export interface BoxDimensions {
  length: number;
  width: number;
  height: number;
}

export interface Container {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  maxLoad: number;
}

export interface BoxPlacement {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: [number, number, number];
}

export interface CalculationResult {
  lengthFit: number;
  widthFit: number;
  heightFit: number;
  totalBoxes: number;
  boxInMeters: BoxDimensions;
  placements?: BoxPlacement[];
}

export type Algorithm = 'basic' | 'skyline' | 'guillotine' | 'greedy' | 'recursive';

export interface AlgorithmOption {
  id: Algorithm;
  name: string;
  description: string;
}