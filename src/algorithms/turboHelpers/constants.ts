import { Container } from './types';
import containersData from '../../data/containers.json';

export const CONTAINERS: Container[] = containersData.containers.map(container => ({
  ...container,
  // Keep dimensions in millimeters (no conversion)
  length: container.length,
  width: container.width,
  height: container.height
}));

// Constants in millimeters
export const EPSILON_MM = 1; // 1mm tolerance
export const MIN_VOLUME_MM3 = 1e3; // 1 cm³ = 1000 mm³
export const MAX_ITERATIONS = 10;
