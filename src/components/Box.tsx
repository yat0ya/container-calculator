import { EdgesGeometry, LineSegments, LineBasicMaterial, BoxGeometry } from 'three';
import { extend } from '@react-three/fiber';

// Extend R3F with the required Three.js components
extend({ EdgesGeometry, LineSegments, LineBasicMaterial });

interface BoxProps {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

export function Box({ position, size, color }: BoxProps) {
  return (
    <group position={position}>
      {/* Main solid box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Subtle edges - thin and light gray */}
      <lineSegments>
        <edgesGeometry args={[new BoxGeometry(...size)]} />
        <lineBasicMaterial color="#565656" linewidth={2} />
      </lineSegments>
    </group>
  );
}