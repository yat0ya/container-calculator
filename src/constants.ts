import { Container } from './types';
import containersData from './data/containers.json';

export const CONTAINERS: Container[] = containersData.containers.map(container => ({
  ...container,
  // Convert mm to m
  length: container.length / 1000,
  width: container.width / 1000,
  height: container.height / 1000
}));

export const DEFAULT_CONTAINER = CONTAINERS[0];

export const ALGORITHMS = [
  {
    id: 'turbo',
    name: 'Toya Turbo',
    description: 'Optimized for speed',
  },
  {
    id: 'plugger',
    name: 'Toya Plugger',
    description: 'Recursive best-fit placement using all orientations.',
  },
  {
    id: 'humanLike',
    name: 'Human-Like Packing',
    description: 'Packs boxes in layers like a human would, optimizing for minimal wall space',
  },
  {
    id: 'recursive',
    name: 'Recursive',
    description: 'Recursively fills spaces with optimal box arrangements',
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Simple algorithm that calculates box fit without rotations',
  }
];

export const EPSILON = 1e-3;
export const MIN_VOLUME = 1e-3;
export const MAX_ITERATIONS = 10;