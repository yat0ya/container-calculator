import React, { useState } from 'react';
import { BoxDimensionsForm } from './components/BoxDimensionsForm';
import { CalculationResults } from './components/CalculationResults';
import { VisualizationModal } from './components/VisualizationModal';
import { BoxDimensions, Container, CalculationResult } from './types';
import { basicAlgorithm } from './algorithms/basic';
import { recursiveAlgorithm } from './algorithms/recursive';
import { humanLikeAlgorithm } from './algorithms/humanLike';
import { pluggerAlgorithm } from './algorithms/plugger';
import { DEFAULT_CONTAINER, CONTAINERS } from './constants';
import { Algorithm } from './types';


function App() {
  const [boxDimensions, setBoxDimensions] = useState<BoxDimensions>({
    length: 79.4,
    width: 49.1,
    height: 87.0,
    weight: undefined,
    value: undefined,
  });
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('plugger');
  const [selectedContainer, setSelectedContainer] = useState<Container>(DEFAULT_CONTAINER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateResult = () => {
    let algorithm;
    switch (selectedAlgorithm) {
      case 'basic':
        algorithm = basicAlgorithm;
        break;
      case 'humanLike':
        algorithm = humanLikeAlgorithm;
        break;
      case 'plugger':
        algorithm = pluggerAlgorithm;
        break;
      case 'recursive':
        algorithm = recursiveAlgorithm;
        break;
      default:
        algorithm = pluggerAlgorithm;
    }
    
    const newResult = algorithm(boxDimensions, selectedContainer);
    
    // Add weight and value calculations
    if (boxDimensions.weight !== undefined) {
      newResult.totalWeight = newResult.totalBoxes * boxDimensions.weight;
      // Calculate max possible boxes based on weight
      newResult.maxPossibleBoxes = newResult.totalBoxes;
      // Adjust total boxes if weight limit is exceeded
      if (newResult.totalWeight > selectedContainer.maxLoad) {
        const maxBoxes = Math.floor(selectedContainer.maxLoad / boxDimensions.weight);
        newResult.totalBoxes = maxBoxes;
        newResult.totalWeight = maxBoxes * boxDimensions.weight;
        if (newResult.placements) {
          newResult.placements = newResult.placements.slice(0, maxBoxes);
        }
      }
    }
    
    if (boxDimensions.value !== undefined) {
      newResult.totalValue = newResult.totalBoxes * boxDimensions.value;
    }
    
    setResult(newResult);
    setIsCalculating(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
    setBoxDimensions(prev => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAlgorithm(e.target.value as Algorithm);
    setResult(null);
  };

  const handleContainerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const containerId = e.target.value;
    const container = CONTAINERS.find(c => c.id === containerId) || DEFAULT_CONTAINER;
    setSelectedContainer(container);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <BoxDimensionsForm
            boxDimensions={boxDimensions}
            onDimensionsChange={handleInputChange}
            selectedAlgorithm={selectedAlgorithm}
            onAlgorithmChange={handleAlgorithmChange}
            selectedContainer={selectedContainer}
            onContainerChange={handleContainerChange}
            onCalculate={() => {
              setIsCalculating(true);
              // Add a small delay to allow the UI to update
              setTimeout(calculateResult, 100);
            }}
            isCalculating={isCalculating}
          />
          {result && !isCalculating && (
            <CalculationResults
              result={result}
              onVisualize={() => setIsModalOpen(true)}
              selectedAlgorithm={selectedAlgorithm}
              container={selectedContainer}
            />
          )}
        </div>
      </div>

      {result && (
        <VisualizationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          result={result}
          boxDimensions={boxDimensions}
          container={selectedContainer}
        />
      )}
    </div>
  );
}

export default App