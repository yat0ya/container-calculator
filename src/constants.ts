import { Container } from './types';
import containersData from './data/containers.json';

export const CONTAINERS: Container[] = containersData.containers.map(container => ({
  ...container,
  // Convert mm to m
  length: container.length / 1000,
  width: container.width / 1000,
  height: container.height / 1000
}));

export const EPSILON = 1e-3;
export const MIN_VOLUME = 1e-3;
export const MAX_ITERATIONS = 10;