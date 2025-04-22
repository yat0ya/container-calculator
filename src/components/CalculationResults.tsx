import React from 'react';
import { Package, Eye } from 'lucide-react';
import { Algorithm, CalculationResult, Container } from '../types';

interface CalculationResultsProps {
  result: CalculationResult;
  onVisualize: () => void;
  selectedAlgorithm: Algorithm;
  container: Container;
}

export function CalculationResults({ result, onVisualize, selectedAlgorithm, container }: CalculationResultsProps) {
  return (
    <div className="bg-blue-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-700">Results for {container.name}</h2>
        </div>
        {(selectedAlgorithm === 'basic' || selectedAlgorithm === 'greedy' || selectedAlgorithm === 'recursive') && (
          <button
            onClick={onVisualize}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View 3D Layout</span>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Box Distribution</h3>
          <ul className="space-y-2 text-gray-700">
            <li>Length: {result.lengthFit} boxes</li>
            <li>Width: {result.widthFit} boxes</li>
            <li>Height: {result.heightFit} boxes</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Capacity</h3>
          <p className="text-3xl font-bold text-blue-600">{result.totalBoxes} boxes</p>
        </div>
      </div>
    </div>
  );
}