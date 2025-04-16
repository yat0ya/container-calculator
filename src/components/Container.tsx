import { Container as ContainerType } from '../types';

interface ContainerProps {
  container: ContainerType;
}

export function Container({ container }: ContainerProps) {
  return (
    <mesh>
      <boxGeometry args={[container.length, container.height, container.width]} />
      <meshStandardMaterial color="#666666" transparent opacity={0.1} wireframe />
    </mesh>
  );
}