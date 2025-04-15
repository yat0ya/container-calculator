import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { X } from 'lucide-react';
import { Scene } from './Scene';
import { BoxDimensions, CalculationResult } from '../types';
import { CONTAINER_20FT } from '../constants';

interface VisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult;
  boxDimensions: BoxDimensions;
}

export function VisualizationModal({ isOpen, onClose, result, boxDimensions }: VisualizationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-6xl w-full mx-4 h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">3D Container Visualization</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="h-[calc(100%-8rem)]">
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading 3D view...</div>}>
            <Canvas>
              <Scene result={result} boxDimensions={boxDimensions} />
            </Canvas>
          </Suspense>
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Container Specifications</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Box Dimensions:</p>
              <p className="text-sm text-gray-800">
                {boxDimensions.length} × {boxDimensions.width} × {boxDimensions.height} cm
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Container Dimensions:</p>
              <p className="text-sm text-gray-800">
                {CONTAINER_20FT.length} × {CONTAINER_20FT.width} × {CONTAINER_20FT.height} m
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}