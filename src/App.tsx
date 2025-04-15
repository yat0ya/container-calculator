import React, { useState, Suspense } from 'react';
import { Calculator, Package, X, Eye } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Edges } from '@react-three/drei';

// Standard 20ft container internal dimensions in meters
const CONTAINER_20FT = {
  length: 5.89,
  width: 2.35,
  height: 2.39,
};

interface BoxDimensions {
  length: number;
  width: number;
  height: number;
}

function calculateBoxFit(boxDim: BoxDimensions) {
  // Convert box dimensions from cm to meters
  const boxInMeters = {
    length: boxDim.length / 100,
    width: boxDim.width / 100,
    height: boxDim.height / 100,
  };

  // Calculate how many boxes fit in each dimension
  const lengthFit = Math.floor(CONTAINER_20FT.length / boxInMeters.length);
  const widthFit = Math.floor(CONTAINER_20FT.width / boxInMeters.width);
  const heightFit = Math.floor(CONTAINER_20FT.height / boxInMeters.height);

  // Calculate total boxes
  const totalBoxes = lengthFit * widthFit * heightFit;

  return {
    lengthFit,
    widthFit,
    heightFit,
    totalBoxes,
    boxInMeters,
  };
}

// Generate a slightly varied color based on a base color
function generateVariedColor(baseHue: number, index: number): string {
  const hue = (baseHue + index * 5) % 360;
  const saturation = 60 + (index % 20);
  const lightness = 50 + (index % 10);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function Box({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} transparent opacity={0.85} />
      <Edges scale={1} threshold={15} color="#000000" />
    </mesh>
  );
}

function Container() {
  return (
    <mesh position={[CONTAINER_20FT.length/2, CONTAINER_20FT.height/2, CONTAINER_20FT.width/2]}>
      <boxGeometry args={[CONTAINER_20FT.length, CONTAINER_20FT.height, CONTAINER_20FT.width]} />
      <meshStandardMaterial color="#666666" transparent opacity={0.1} wireframe />
    </mesh>
  );
}

function Scene({ result, boxDimensions }: { 
  result: ReturnType<typeof calculateBoxFit>;
  boxDimensions: BoxDimensions;
}) {
  const boxes = [];
  const { boxInMeters } = result;
  const baseHue = 210; // Base blue hue

  // Create boxes
  let boxIndex = 0;
  for (let l = 0; l < result.lengthFit; l++) {
    for (let w = 0; w < result.widthFit; w++) {
      for (let h = 0; h < result.heightFit; h++) {
        boxes.push(
          <Box
            key={`${l}-${w}-${h}`}
            position={[
              l * boxInMeters.length + boxInMeters.length/2,
              h * boxInMeters.height + boxInMeters.height/2,
              w * boxInMeters.width + boxInMeters.width/2,
            ]}
            size={[boxInMeters.length, boxInMeters.height, boxInMeters.width]}
            color={generateVariedColor(baseHue, boxIndex)}
          />
        );
        boxIndex++;
      }
    }
  }

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <Container />
      {boxes}
      <OrbitControls />
      <PerspectiveCamera makeDefault position={[8, 8, 8]} />
    </>
  );
}

function VisualizationModal({ isOpen, onClose, result, boxDimensions }: {
  isOpen: boolean;
  onClose: () => void;
  result: ReturnType<typeof calculateBoxFit>;
  boxDimensions: BoxDimensions;
}) {
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

function App() {
  const [boxDimensions, setBoxDimensions] = useState<BoxDimensions>({
    length: 50,
    width: 40,
    height: 30,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const result = calculateBoxFit(boxDimensions);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBoxDimensions(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Container Loading Calculator</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Box Dimensions (cm)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Length</label>
                <input
                  type="number"
                  name="length"
                  value={boxDimensions.length}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Width</label>
                <input
                  type="number"
                  name="width"
                  value={boxDimensions.width}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Height</label>
                <input
                  type="number"
                  name="height"
                  value={boxDimensions.height}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-700">Results for 20ft Container</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View 3D Layout</span>
              </button>
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
        </div>
      </div>

      <VisualizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={result}
        boxDimensions={boxDimensions}
      />
    </div>
  );
}

export default App;