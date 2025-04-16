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
  const rotations: [number, number, number][] = [
    [boxInMeters.length, boxInMeters.height, boxInMeters.width],
    [boxInMeters.width, boxInMeters.height, boxInMeters.length],
    [boxInMeters.length, boxInMeters.width, boxInMeters.height],
    [boxInMeters.height, boxInMeters.width, boxInMeters.length],
    [boxInMeters.width, boxInMeters.length, boxInMeters.height],
    [boxInMeters.height, boxInMeters.length, boxInMeters.width],
  ];

  // Find the rotation that matches our result
  const optimalRotation = rotations.find(([l, h, w]) => {
    const lengthFit = Math.floor(container.length / l);
    const heightFit = Math.floor(container.height / h);
    const widthFit = Math.floor(container.width / w);
    return lengthFit === result.lengthFit && 
           heightFit === result.heightFit && 
           widthFit === result.widthFit;
  }) || rotations[0];

  // Create boxes using the optimal rotation
  let boxIndex = 0;
  for (let l = 0; l < result.lengthFit; l++) {
    for (let h = 0; h < result.heightFit; h++) {
      for (let w = 0; w < result.widthFit; w++) {
        // Calculate position based on container dimensions and box size
        const xPos = (l * optimalRotation[0]) - (container.length / 2) + (optimalRotation[0] / 2);
        const yPos = (h * optimalRotation[1]) - (container.height / 2) + (optimalRotation[1] / 2);
        const zPos = (w * optimalRotation[2]) - (container.width / 2) + (optimalRotation[2] / 2);

        boxes.push(
          <Box
            key={`${l}-${w}-${h}`}
            position={[xPos, yPos, zPos] as [number, number, number]}
            size={optimalRotation as [number, number, number]}
            color={generateVariedColor(baseHue, boxIndex)}
          />
        );
        boxIndex++;
      }
    }
  }

  // Calculate camera distance based on container size
  const maxDimension = Math.max(container.length, container.width, container.height);
  const cameraDistance = maxDimension * 2;

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[cameraDistance, cameraDistance, cameraDistance]} intensity={1} />
      <pointLight position={[-cameraDistance, -cameraDistance, -cameraDistance]} intensity={0.5} />
      <Container container={container} />
      {boxes}
      <OrbitControls enableDamping dampingFactor={0.05} />
      <PerspectiveCamera 
        makeDefault 
        position={[cameraDistance, cameraDistance, cameraDistance] as [number, number, number]} 
        fov={50}
      />
    </>
  );
}