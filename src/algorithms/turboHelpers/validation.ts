import { Container, Placement } from './types';

export function cleanOutOfBoundsBoxes(placements: Placement[], container: Container): Placement[] {
  const cleaned = placements.filter(p => {
    const endX = p.position.x + p.rotation[0];
    const endY = p.position.y + p.rotation[1];
    const endZ = p.position.z + p.rotation[2];
    return (
      p.position.x >= 0 && p.position.y >= 0 && p.position.z >= 0 &&
      endX <= container.length &&
      endY <= container.height &&
      endZ <= container.width
    );
  });

  const removedCount = placements.length - cleaned.length;
  if (removedCount > 0) {
    // console.warn(`🧹 Removed ${removedCount} box(es) that exceeded container boundaries`);
  }

  return cleaned;
}
