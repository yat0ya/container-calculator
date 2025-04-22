import React, { useState } from 'react';
import { BoxDimensionsForm } from './components/BoxDimensionsForm';
import { CalculationResults } from './components/CalculationResults';
import { VisualizationModal } from './components/VisualizationModal';
import { Algorithm, BoxDimensions, Container, CalculationResult } from './types';
import { basicAlgorithm } from './algorithms/basic';
import { skylineAlgorithm } from './algorithms/skyline';
import { guillotineAlgorithm } from './algorithms/guillotine';
import { greedyAlgorithm } from './algorithms/greedy';
import { recursiveAlgorithm } from './algorithms/recursive';
import { DEFAULT_CONTAINER, CONTAINERS } from './constants';

function App() {
  const [boxDimensions, setBoxDimensions] = useState<BoxDimensions>({
    length: 50,
    width: 40,
    height: 30,
  });
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('basic');
  const [selectedContainer, setSelectedContainer] = useState<Container>(DEFAULT_CONTAINER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateResult = () => {
    const algorithm = (() => {
      switch (selectedAlgorithm) {
        case 'skyline':
          return skylineAlgorithm;
        case 'guillotine':
          return guillotineAlgorithm;
        case 'greedy':
          return greedyAlgorithm;
        case 'recursive':
          return recursiveAlgorithm;
        default:
          return basicAlgorithm;
      }
    })();

    const newResult = algorithm(boxDimensions, selectedContainer);
    setResult(newResult);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBoxDimensions(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
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
            onCalculate={calculateResult}
          />
          {result && (
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

export default App;