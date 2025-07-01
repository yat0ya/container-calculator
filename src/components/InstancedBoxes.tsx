import React, { useMemo, useRef } from 'react';
import { InstancedMesh, Object3D, Matrix4, Color, BoxGeometry, EdgesGeometry, LineSegments, LineBasicMaterial } from 'three';
import { extend } from '@react-three/fiber';
import { Placement } from '../types';
import { generateVariedColor } from '../algorithms/turboHelpers/utils';

// Extend R3F with the required Three.js components
extend({ EdgesGeometry, LineSegments, LineBasicMaterial });

interface InstancedBoxesProps {
  placements: Placement[];
  containerLength: number;
  containerHeight: number;
  containerWidth: number;
}

const tempObject = new Object3D();
const tempColor = new Color();

export function InstancedBoxes({ 
  placements, 
  containerLength, 
  containerHeight, 
  containerWidth
}: InstancedBoxesProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const baseHue = 210;

  // Convert mm to meters
  const mm = (v: number) => v / 1000;

  // Memoize the instance data to avoid recalculation on every render
  const instanceData = useMemo(() => {
    const matrices: Matrix4[] = [];
    const colors: Color[] = [];

    placements.forEach((placement, index) => {
      // Check bounds
      if (
        placement.position.x + placement.rotation[0] <= containerLength &&
        placement.position.y + placement.rotation[1] <= containerHeight &&
        placement.position.z + placement.rotation[2] <= containerWidth
      ) {
        // Calculate position (center the container at origin)
        const xPos = mm(placement.position.x - containerLength / 2 + placement.rotation[0] / 2);
        const yPos = mm(placement.position.y - containerHeight / 2 + placement.rotation[1] / 2);
        const zPos = mm(placement.position.z - containerWidth / 2 + placement.rotation[2] / 2);

        // Calculate scale
        const scaleX = mm(placement.rotation[0]);
        const scaleY = mm(placement.rotation[1]);
        const scaleZ = mm(placement.rotation[2]);

        // Set up the temporary object for main boxes
        tempObject.position.set(xPos, yPos, zPos);
        tempObject.scale.set(scaleX, scaleY, scaleZ);
        tempObject.updateMatrix();
        matrices.push(tempObject.matrix.clone());

        // Generate color
        const colorString = generateVariedColor(baseHue, index);
        tempColor.setStyle(colorString);
        colors.push(tempColor.clone());
      }
    });

    return { matrices, colors };
  }, [placements, containerLength, containerHeight, containerWidth]);

  // Update the instanced mesh when data changes
  React.useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const { matrices, colors } = instanceData;

    // Update instance count
    mesh.count = matrices.length;

    // Update matrices
    matrices.forEach((matrix, i) => {
      mesh.setMatrixAt(i, matrix);
    });

    // Update colors
    colors.forEach((color, i) => {
      mesh.setColorAt(i, color);
    });

    // Mark for update
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [instanceData]);

  if (instanceData.matrices.length === 0) {
    return null;
  }

  return (
    <group>
      {/* Main instanced boxes - solid, no transparency */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, instanceData.matrices.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          roughness={0.8}
          metalness={0.1}
        />
      </instancedMesh>
      
      {/* Individual edges for each box - subtle and light */}
      {instanceData.matrices.map((matrix, index) => {
        // Extract position and scale from matrix
        const position = matrix.elements;
        const scaleX = Math.sqrt(position[0] * position[0] + position[1] * position[1] + position[2] * position[2]);
        const scaleY = Math.sqrt(position[4] * position[4] + position[5] * position[5] + position[6] * position[6]);
        const scaleZ = Math.sqrt(position[8] * position[8] + position[9] * position[9] + position[10] * position[10]);
        const posX = position[12];
        const posY = position[13];
        const posZ = position[14];
        
        return (
          <lineSegments key={`edges-${index}`} position={[posX, posY, posZ]}>
            <edgesGeometry args={[new BoxGeometry(scaleX, scaleY, scaleZ)]} />
            <lineBasicMaterial color="#565656" linewidth={2} />
          </lineSegments>
        );
      })}
    </group>
  );
}