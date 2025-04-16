import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Box } from './Box';
import { Container } from './Container';
import { BoxDimensions, CalculationResult, Container as ContainerType } from '../types';
import { generateVariedColor } from '../utils';

interface SceneProps {
  result: CalculationResult;
  boxDimensions: BoxDimensions;
  container: ContainerType;
}

export function Scene({ result, boxDimensions, container }: SceneProps) {
  const boxes = [];
  const { boxInMeters } = result;
  const baseHue = 210; // Base blue hue

  // Calculate the optimal box dimensions based on container dimensions
  const rotations = [
    [boxInMeters.length, boxInMeters.width, boxInMeters.height],
    [boxInMeters.width, boxInMeters.length, boxInMeters.height],
    [boxInMeters.length, boxInMeters.height, boxInMeters.width],
    [boxInMeters.height, boxInMeters.length, boxInMeters.width],
    [boxInMeters.width, boxInMeters.height, boxInMeters.length],
    [boxInMeters.height, boxInMeters.width, boxInMeters.length],
  ];

  // Find the rotation that matches our result
  const optimalRotation = rotations.find(([l, w, h]) => {
    const lengthFit = Math.floor(container.length / l);
    const widthFit = Math.floor(container.width / w);
    const heightFit = Math.floor(container.height / h);
    return lengthFit === result.lengthFit && 
           widthFit === result.widthFit && 
           heightFit === result.heightFit;
  }) || rotations[0];

  // Create boxes using the optimal rotation
  let boxIndex = 0;
  for (let l = 0; l < result.lengthFit; l++) {
    for (let w = 0; w < result.widthFit; w++) {
      for (let h = 0; h < result.heightFit; h++) {
        boxes.push(
          <Box
            key={`${l}-${w}-${h}`}
            position={[
              l * optimalRotation[0] + optimalRotation[0]/2,
              h * optimalRotation[1] + optimalRotation[1]/2,
              w * optimalRotation[2] + optimalRotation[2]/2,
            ]}
            size={optimalRotation}
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
      <Container container={container} />
      {boxes}
      <OrbitControls />
      <PerspectiveCamera makeDefault position={[8, 8, 8]} />
    </>
  );
}