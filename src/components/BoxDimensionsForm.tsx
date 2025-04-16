import React from 'react';
import { Calculator } from 'lucide-react';
import { Algorithm, BoxDimensions, Container } from '../types';
import { ALGORITHMS, CONTAINERS } from '../constants';

interface BoxDimensionsFormProps {
  boxDimensions: BoxDimensions;
  selectedAlgorithm: Algorithm;
  selectedContainer: Container;
  onDimensionsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAlgorithmChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onContainerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function BoxDimensionsForm({
  boxDimensions,
  selectedAlgorithm,
  selectedContainer,
  onDimensionsChange,
  onAlgorithmChange,
  onContainerChange
}: BoxDimensionsFormProps) {
  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">Container Loading Calculator</h1>
      </div>

      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Container Type</h2>
          <select
            value={selectedContainer.id}
            onChange={onContainerChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CONTAINERS.map(container => (
              <option key={container.id} value={container.id}>
                {container.name} ({container.length.toFixed(2)}m × {container.width.toFixed(2)}m × {container.height.toFixed(2)}m) - Max Load: {container.maxLoad}kg
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Calculation Algorithm</h2>
          <select
            value={selectedAlgorithm}
            onChange={onAlgorithmChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ALGORITHMS.map(algorithm => (
              <option key={algorithm.id} value={algorithm.id}>
                {algorithm.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-600">
            {ALGORITHMS.find(a => a.id === selectedAlgorithm)?.description}
          </p>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-4">Box Dimensions (cm)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Length</label>
            <input
              type="number"
              name="length"
              value={boxDimensions.length}
              onChange={onDimensionsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Width</label>
            <input
              type="number"
              name="width"
              value={boxDimensions.width}
              onChange={onDimensionsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Height</label>
            <input
              type="number"
              name="height"
              value={boxDimensions.height}
              onChange={onDimensionsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </>
  );
}