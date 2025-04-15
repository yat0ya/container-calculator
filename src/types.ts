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