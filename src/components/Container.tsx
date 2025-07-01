import { EdgesGeometry, LineSegments, LineBasicMaterial, BoxGeometry } from 'three';
import { extend } from '@react-three/fiber';
import { Container as ContainerType } from '../types';

// Extend R3F with the required Three.js components
extend({ EdgesGeometry, LineSegments, LineBasicMaterial });

interface ContainerProps {
  container: ContainerType;
}

export function Container({ container }: ContainerProps) {
  return (
    <group>
      {/* Container wireframe - very transparent */}
      <mesh>
        <boxGeometry args={[container.length, container.height, container.width]} />
        <meshStandardMaterial color="#666666" transparent opacity={0} wireframe={false} />
      </mesh>
      
      {/* Prominent container edges - thick and dark */}
      <lineSegments>
        <edgesGeometry args={[new BoxGeometry(container.length, container.height, container.width)]} />
        <lineBasicMaterial color="#000000" linewidth={2} />
      </lineSegments>
    </group>
  );
}