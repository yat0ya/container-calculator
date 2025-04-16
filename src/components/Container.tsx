import { Container as ContainerType } from '../types';

interface ContainerProps {
  container: ContainerType;
}

export function Container({ container }: ContainerProps) {
  return (
    <mesh position={[container.length/2, container.height/2, container.width/2]}>
      <boxGeometry args={[container.length, container.height, container.width]} />
      <meshStandardMaterial color="#666666" transparent opacity={0.1} wireframe />
    </mesh>
  );
}