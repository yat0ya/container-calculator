import React, { useState } from 'react';
import { BoxDimensionsForm } from './components/BoxDimensionsForm';
import { CalculationResults } from './components/CalculationResults';
import { VisualizationModal } from './components/VisualizationModal';
import { Algorithm, BoxDimensions } from './types';
import { basicAlgorithm } from './algorithms/basic';
import { skylineAlgorithm } from './algorithms/skyline';
import { guillotineAlgorithm } from './algorithms/guillotine';

function App() {
  const [boxDimensions, setBoxDimensions] = useState<BoxDimensions>({
    length: 50,
    width: 40,
    height: 30,
  });
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('basic');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const calculateResult = () => {
    switch (selectedAlgorithm) {
      case 'skyline':
        return skylineAlgorithm(boxDimensions);
      case 'guillotine':
        return guillotineAlgorithm(boxDimensions);
      default:
        return basicAlgorithm(boxDimensions);
    }
  };

  const result = calculateResult();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBoxDimensions(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAlgorithm(e.target.value as Algorithm);
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
          />
          <CalculationResults
            result={result}
            onVisualize={() => setIsModalOpen(true)}
          />
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