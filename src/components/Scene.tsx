import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Box } from './Box';
import { Container } from './Container';
import { BoxDimensions, CalculationResult } from '../types';
import { generateVariedColor } from '../utils';

interface SceneProps {
  result: CalculationResult;
  boxDimensions: BoxDimensions;
}

export function Scene({ result, boxDimensions }: SceneProps) {
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