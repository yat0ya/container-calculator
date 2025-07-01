import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Box } from './Box';
import { InstancedBoxes } from './InstancedBoxes';
import { Container } from './Container';
import { BoxDimensions, CalculationResult, Container as ContainerType } from '../algorithms/turboHelpers/types';
import { generateVariedColor } from '../algorithms/turboHelpers/utils';

interface SceneProps {
  result: CalculationResult;
  boxDimensions: BoxDimensions;
  container: ContainerType;
}

const mm = (v: number) => v / 1000; // ✅ mm → m conversion helper

export function Scene({ result, container }: SceneProps) {
  const { boxInMeters } = result;
  const baseHue = 210;

  // Use instanced rendering for better performance when we have many boxes
  const useInstancedRendering = result.placements && result.placements.length > 50;

  let maxX = 0;
  if (result.placements) {
    for (const p of result.placements) {
      const endX = p.position.x + p.rotation[0];
      if (endX > maxX) maxX = endX;
    }
  }

  const renderBoxes = (): JSX.Element[] => {
    if (result.placements && useInstancedRendering) {
      // Use instanced rendering for better performance
      return [
        <InstancedBoxes
          key="instanced-boxes"
          placements={result.placements}
          containerLength={container.length}
          containerHeight={container.height}
          containerWidth={container.width}
        />
      ];
    } else if (result.placements) {
      // Use individual boxes for smaller counts or fallback
      const boxes: JSX.Element[] = [];
      result.placements.forEach((placement, index) => {
        if (
          placement.position.x + placement.rotation[0] <= container.length &&
          placement.position.y + placement.rotation[1] <= container.height &&
          placement.position.z + placement.rotation[2] <= container.width
        ) {
          const xPos = mm(placement.position.x - container.length / 2 + placement.rotation[0] / 2);
          const yPos = mm(placement.position.y - container.height / 2 + placement.rotation[1] / 2);
          const zPos = mm(placement.position.z - container.width / 2 + placement.rotation[2] / 2);

          boxes.push(
            <Box
              key={`box-${index}`}
              position={[xPos, yPos, zPos]}
              size={[
                mm(placement.rotation[0]),
                mm(placement.rotation[1]),
                mm(placement.rotation[2])
              ]}
              color={generateVariedColor(baseHue, index)}
            />
          );
        }
      });
      return boxes;
    } else {
      // Fallback to grid-based rendering for basic algorithm
      const rotations: [number, number, number][] = [
        [boxInMeters.length, boxInMeters.height, boxInMeters.width],
        [boxInMeters.width, boxInMeters.height, boxInMeters.length],
        [boxInMeters.length, boxInMeters.width, boxInMeters.height],
        [boxInMeters.height, boxInMeters.width, boxInMeters.length],
        [boxInMeters.width, boxInMeters.length, boxInMeters.height],
        [boxInMeters.height, boxInMeters.length, boxInMeters.width],
      ];

      // Provide default values for potentially undefined properties
      const lengthFit = result.lengthFit ?? 0;
      const heightFit = result.heightFit ?? 0;
      const widthFit = result.widthFit ?? 0;

      const optimalRotation = rotations.find(([l, h, w]) => {
        const lFit = Math.floor(container.length / l);
        const hFit = Math.floor(container.height / h);
        const wFit = Math.floor(container.width / w);
        return lFit === lengthFit &&
               hFit === heightFit &&
               wFit === widthFit;
      }) || rotations[0];

      const boxes: JSX.Element[] = [];
      let boxIndex = 0;
      for (let l = 0; l < lengthFit; l++) {
        for (let h = 0; h < heightFit; h++) {
          for (let w = 0; w < widthFit; w++) {
            const xPos = mm(l * optimalRotation[0] - container.length / 2 + optimalRotation[0] / 2);
            const yPos = mm(h * optimalRotation[1] - container.height / 2 + optimalRotation[1] / 2);
            const zPos = mm(w * optimalRotation[2] - container.width / 2 + optimalRotation[2] / 2);

            if (
              xPos + mm(optimalRotation[0]) / 2 <= mm(container.length) / 2 &&
              yPos + mm(optimalRotation[1]) / 2 <= mm(container.height) / 2 &&
              zPos + mm(optimalRotation[2]) / 2 <= mm(container.width) / 2
            ) {
              boxes.push(
                <Box
                  key={`${l}-${h}-${w}`}
                  position={[xPos, yPos, zPos]}
                  size={[
                    mm(optimalRotation[0]),
                    mm(optimalRotation[1]),
                    mm(optimalRotation[2])
                  ]}
                  color={generateVariedColor(baseHue, boxIndex)}
                />
              );
              boxIndex++;
            }
          }
        }
      }
      return boxes;
    }
  };

  const cameraDistance = mm(Math.max(container.length, container.width, container.height)) * 0.8;

  return (
    <>
      {/* Enhanced lighting setup for better visibility */}
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[cameraDistance, cameraDistance, cameraDistance]} 
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight 
        position={[-cameraDistance, cameraDistance, -cameraDistance]} 
        intensity={0.8}
      />
      <directionalLight 
        position={[0, -cameraDistance, 0]} 
        intensity={0.6}
      />
      <pointLight 
        position={[0, cameraDistance * 0.5, 0]} 
        intensity={0.5}
        distance={cameraDistance * 2}
      />
      
      <Container container={{
        ...container,
        length: mm(container.length),
        width: mm(container.width),
        height: mm(container.height)
      }} />
      {renderBoxes()}
      <OrbitControls enableDamping dampingFactor={0.05} />
      <PerspectiveCamera
        makeDefault
        position={[cameraDistance, cameraDistance, cameraDistance]}
        fov={50}
      />
    </>
  );
}