import { AlgorithmOption, Container } from './types';
import containersData from './data/containers.json';

export const CONTAINERS: Container[] = containersData.containers.map(container => ({
  ...container,
  // Convert mm to m
  length: container.length / 1000,
  width: container.width / 1000,
  height: container.height / 1000
}));

export const DEFAULT_CONTAINER = CONTAINERS[0];

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