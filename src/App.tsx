import React, { useState } from 'react';
import { BoxDimensionsForm } from './components/BoxDimensionsForm';
import { CalculationResults } from './components/CalculationResults';
import { VisualizationModal } from './components/VisualizationModal';
import { BoxDimensions } from './types';
import { calculateBoxFit } from './utils';

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
          <BoxDimensionsForm
            boxDimensions={boxDimensions}
            onDimensionsChange={handleInputChange}
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