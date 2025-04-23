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

  if (result.placements) {
    // Use explicit placements (for greedy algorithm)
    result.placements.forEach((placement, index) => {
      // Check if box is within container bounds
      if (
        placement.position.x + placement.rotation[0] <= container.length &&
        placement.position.y + placement.rotation[1] <= container.height &&
        placement.position.z + placement.rotation[2] <= container.width
      ) {
        // Center the position relative to container
        const xPos = placement.position.x - (container.length / 2) + (placement.rotation[0] / 2);
        const yPos = placement.position.y - (container.height / 2) + (placement.rotation[1] / 2);
        const zPos = placement.position.z - (container.width / 2) + (placement.rotation[2] / 2);

        boxes.push(
          <Box
            key={`box-${index}`}
            position={[xPos, yPos, zPos] as [number, number, number]}
            size={placement.rotation}
            color={generateVariedColor(baseHue, index)}
          />
        );
      }
    });
  } else {
    // Use grid-based layout (for basic algorithm)
    const rotations: [number, number, number][] = [
      [boxInMeters.length, boxInMeters.height, boxInMeters.width],
      [boxInMeters.width, boxInMeters.height, boxInMeters.length],
      [boxInMeters.length, boxInMeters.width, boxInMeters.height],
      [boxInMeters.height, boxInMeters.width, boxInMeters.length],
      [boxInMeters.width, boxInMeters.length, boxInMeters.height],
      [boxInMeters.height, boxInMeters.length, boxInMeters.width],
    ];

    const optimalRotation = rotations.find(([l, h, w]) => {
      const lengthFit = Math.floor(container.length / l);
      const heightFit = Math.floor(container.height / h);
      const widthFit = Math.floor(container.width / w);
      return lengthFit === result.lengthFit && 
             heightFit === result.heightFit && 
             widthFit === result.widthFit;
    }) || rotations[0];

    let boxIndex = 0;
    for (let l = 0; l < result.lengthFit; l++) {
      for (let h = 0; h < result.heightFit; h++) {
        for (let w = 0; w < result.widthFit; w++) {
          const xPos = (l * optimalRotation[0]) - (container.length / 2) + (optimalRotation[0] / 2);
          const yPos = (h * optimalRotation[1]) - (container.height / 2) + (optimalRotation[1] / 2);
          const zPos = (w * optimalRotation[2]) - (container.width / 2) + (optimalRotation[2] / 2);

          if (
            xPos + optimalRotation[0]/2 <= container.length/2 &&
            yPos + optimalRotation[1]/2 <= container.height/2 &&
            zPos + optimalRotation[2]/2 <= container.width/2
          ) {
            boxes.push(
              <Box
                key={`${l}-${h}-${w}`}
                position={[xPos, yPos, zPos] as [number, number, number]}
                size={optimalRotation}
                color={generateVariedColor(baseHue, boxIndex)}
              />
            );
            boxIndex++;
          }
        }
      }
    }
  }

  // Calculate camera distance based on container size
  const maxDimension = Math.max(container.length, container.width, container.height);
  const cameraDistance = maxDimension*0.8;

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