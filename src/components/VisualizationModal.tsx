import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { X } from 'lucide-react';
import { Scene } from './Scene';
import { BoxDimensions, CalculationResult, Container } from '../algorithms/turboHelpers/types';

interface VisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult;
  boxDimensions: BoxDimensions;
  container: Container;
}

export function VisualizationModal({ isOpen, onClose, result, boxDimensions, container }: VisualizationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 md:p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">3D Container Visualization</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading 3D view...</div>}>
            <Canvas>
              <Scene result={result} boxDimensions={boxDimensions} container={container} />
            </Canvas>
          </Suspense>
          
          {/* Helper image for desktop users - shows mouse interaction guide */}
          <div className="absolute bottom-4 right-4 z-10 hidden md:block">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-200">
              {/* Mouse with orbit arrows - Rotate */}
              <div className="flex items-center justify-center mb-3">
                <div className="relative">
                  {/* Mouse body */}
                  <div className="w-10 h-14 bg-gray-100 rounded-t-full rounded-b-xl border-2 border-gray-300 relative shadow-md">
                    {/* Left click highlight */}
                    <div className="absolute top-1 left-1 w-4 h-5 bg-blue-500 rounded-tl-full opacity-90 shadow-sm"></div>
                    {/* Mouse wheel */}
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-1.5 h-4 bg-gray-400 rounded-full"></div>
                  </div>
                  
                  {/* Orbit arrows around mouse */}
                  <div className="absolute -top-3 -left-3 w-16 h-20">
                    {/* Circular orbit path */}
                    <div className="absolute inset-0 border-2 border-dashed border-blue-500 rounded-full opacity-80"></div>
                    {/* Rotation arrows */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-blue-600 text-lg font-bold">↻</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-blue-600 text-lg font-bold">↺</div>
                  </div>
                </div>
              </div>
              
              {/* Mouse with scroll wheel - Zoom */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  {/* Mouse body */}
                  <div className="w-10 h-14 bg-gray-100 rounded-t-full rounded-b-xl border-2 border-gray-300 relative shadow-md">
                    {/* Scroll wheel highlight */}
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-3 h-5 bg-green-500 rounded-full opacity-90 shadow-sm"></div>
                  </div>
                  
                  {/* Zoom indicators */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-green-600 text-lg font-bold animate-pulse">↑</div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-green-600 text-lg font-bold animate-pulse">↓</div>
                  
                  {/* Zoom symbols */}
                  <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 text-green-600 text-xl font-bold bg-green-100 rounded-full w-6 h-6 flex items-center justify-center">+</div>
                  <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-green-600 text-xl font-bold bg-green-100 rounded-full w-6 h-6 flex items-center justify-center">−</div>
                </div>
              </div>
              
              {/* Mouse with right click - Pan */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  {/* Mouse body */}
                  <div className="w-10 h-14 bg-gray-100 rounded-t-full rounded-b-xl border-2 border-gray-300 relative shadow-md">
                    {/* Right click highlight */}
                    <div className="absolute top-1 right-1 w-4 h-5 bg-orange-500 rounded-tr-full opacity-90 shadow-sm"></div>
                  </div>
                  
                  {/* Pan arrows */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-orange-600 text-lg font-bold bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center">↑</div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-orange-600 text-lg font-bold bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center">↓</div>
                  <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 text-orange-600 text-lg font-bold bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center">←</div>
                  <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-orange-600 text-lg font-bold bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center">→</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-b-xl border-t">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 sm:gap-4">
            <div>
              <p className="text-base font-medium text-gray-600 mb-0.5">Box Dimensions [cm×cm×cm]</p>
              <p className="text-lg text-gray-800">
                {boxDimensions.length} × {boxDimensions.width} × {boxDimensions.height}
              </p>
            </div>
            <div>
              <p className="text-base font-medium text-gray-600 mb-0.5">Container Dimensions [m×m×m]</p>
              <p className="text-lg text-gray-800">
                {(container.length / 1000).toFixed(2)} × {(container.width / 1000).toFixed(2)} × {(container.height / 1000).toFixed(2)} m
              </p>
            </div>
            <div>
              <p className="text-base font-medium text-gray-600 mb-0.5">Total Capacity [boxes]</p>
              <p className="text-lg text-gray-800">
                {result.totalBoxes}
              </p>
            </div>
            <div>
              <p className="text-base font-medium text-gray-600 mb-0.5">Volume Utilization [%]</p>
              <p className="text-lg text-gray-800">
                {(() => {
                  if (!result.boxInMeters || result.totalBoxes === 0 || !container.volume) return '0.0%';
                  
                  // Box volume in cubic meters (boxInMeters is already in meters)
                  const boxVolumeM3 = result.boxInMeters.length * result.boxInMeters.width * result.boxInMeters.height;
                  const totalBoxVolume = boxVolumeM3 * result.totalBoxes;
                  
                  // Container volume is already in cubic meters from JSON
                  const containerVolume = container.volume;
                  
                  const volumeUtilization = (totalBoxVolume / containerVolume) * 100;
                  return `${volumeUtilization.toFixed(1)}`;
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}