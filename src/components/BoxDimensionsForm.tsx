import React from 'react';
import { Calculator, Loader2, Server } from 'lucide-react';
import { Algorithm, BoxDimensions, Container } from '../types';
import { ALGORITHMS, CONTAINERS } from '../constants';
import { version } from '../../package.json';

interface BoxDimensionsFormProps {
  boxDimensions: BoxDimensions;
  selectedAlgorithm: Algorithm;
  selectedContainer: Container;
  onDimensionsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAlgorithmChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onContainerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCalculate: () => void;
  onCalculateApi: () => void;
  isCalculating: boolean;
}

export function BoxDimensionsForm({
  boxDimensions,
  selectedAlgorithm,
  selectedContainer,
  onDimensionsChange,
  onAlgorithmChange,
  onContainerChange,
  onCalculate,
  onCalculateApi,
  isCalculating
}: BoxDimensionsFormProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Container Loading Calculator</h1>
        </div>
        <div className="text-sm text-gray-500">v{version}</div>
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

        <h2 className="text-lg font-semibold text-gray-700 mb-4">Box Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Length (cm)</label>
            <input
              type="number"
              name="length"
              value={boxDimensions.length}
              onChange={onDimensionsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Width (cm)</label>
            <input
              type="number"
              name="width"
              value={boxDimensions.width}
              onChange={onDimensionsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Height (cm)</label>
            <input
              type="number"
              name="height"
              value={boxDimensions.height}
              onChange={onDimensionsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Weight (kg, optional)</label>
            <input
              type="number"
              name="weight"
              value={boxDimensions.weight || ''}
              onChange={onDimensionsChange}
              placeholder="Enter box weight"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Value (optional)</label>
            <input
              type="number"
              name="value"
              value={boxDimensions.value || ''}
              onChange={onDimensionsChange}
              placeholder="Enter box value"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCalculate}
            disabled={isCalculating}
            className="flex-1 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isCalculating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Calculator className="w-5 h-5" />
            )}
            {isCalculating ? 'Calculating...' : 'Calculate'}
          </button>
          
          <button
            onClick={onCalculateApi}
            disabled={isCalculating}
            className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            title="Calculate via API"
          >
            {isCalculating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Server className="w-5 h-5" />
            )}
            {isCalculating ? 'Calculating...' : 'API'}
          </button>
        </div>
      </div>
    </>
  );
}