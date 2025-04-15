import { CONTAINER_20FT } from '../constants';

export function Container() {
  return (
    <mesh position={[CONTAINER_20FT.length/2, CONTAINER_20FT.height/2, CONTAINER_20FT.width/2]}>
      <boxGeometry args={[CONTAINER_20FT.length, CONTAINER_20FT.height, CONTAINER_20FT.width]} />
      <meshStandardMaterial color="#666666" transparent opacity={0.1} wireframe />
    </mesh>
  );
}