import { Container } from '../../types';
import containersData from '../../data/containers.json';

export const CONTAINERS: Container[] = containersData.containers.map(container => ({
  ...container,
  // Keep dimensions in millimeters (no conversion)
  length: container.length,
  width: container.width,
  height: container.height
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

// Constants in millimeters
export const EPSILON_MM = 1; // 1mm tolerance
export const MIN_VOLUME_MM3 = 1e3; // 1 cm³ = 1000 mm³
export const MAX_ITERATIONS = 10;
