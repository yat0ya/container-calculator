import { AlgorithmOption } from './types';

// Standard 20ft container internal dimensions in meters
export const CONTAINER_20FT = {
  length: 5.89,
  width: 2.35,
  height: 2.39,
};

export const ALGORITHMS: AlgorithmOption[] = [
  {
    id: 'basic',
    name: 'Basic (No Rotations)',
    description: 'Simple algorithm that calculates box fit without any rotations',
  },
  {
    id: 'skyline',
    name: 'Skyline',
    description: 'Advanced algorithm that allows individual box rotations for optimal fit',
  },
  {
    id: 'guillotine',
    name: 'Guillotine',
    description: 'Uses guillotine cuts with box rotations for efficient packing',
  },
];