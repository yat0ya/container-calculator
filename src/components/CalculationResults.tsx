import { Package, Eye } from 'lucide-react';
import { Algorithm, CalculationResult, Container } from '../types';

interface CalculationResultsProps {
  result: CalculationResult;
  onVisualize: () => void;
  selectedAlgorithm: Algorithm;
  container: Container;
}

export function CalculationResults({ result, onVisualize, container }: CalculationResultsProps) {
  const isWeightRestricted = result.maxPossibleBoxes !== undefined && 
    result.totalBoxes < result.maxPossibleBoxes;

  return (
    <div className="bg-blue-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-700">Results for {container.name}</h2>
        </div>
        <button
          onClick={onVisualize}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>View 3D Layout</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Capacity</h3>
          <p className={`text-3xl font-bold ${isWeightRestricted ? 'text-red-600' : 'text-blue-600'}`}>
            {result.totalBoxes} boxes
          </p>
          {isWeightRestricted && result.maxPossibleBoxes && (
            <p className="text-sm text-gray-500">Max without weight limit: {result.maxPossibleBoxes} boxes</p>
          )}
        </div>
        
        {result.totalWeight !== undefined && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Weight</h3>
            <p className={`text-3xl font-bold ${isWeightRestricted ? 'text-red-600' : 'text-blue-600'}`}>
              {Math.round(result.totalWeight)} kg
            </p>
            <p className="text-sm text-gray-500">Max: {container.maxLoad} kg</p>
          </div>
        )}
        
        {result.totalValue !== undefined && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Value</h3>
            <p className="text-3xl font-bold text-blue-600">{result.totalValue.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}