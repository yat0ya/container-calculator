import { Placement } from './types';

export function snapBoxesTightly(placements: Placement[]): Placement[] {
  const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
  let updatedPlacements = [...placements];

  for (const axis of axes) {
    // Sort for current axis without mutating original
    updatedPlacements = [...updatedPlacements].sort(
      (a, b) => a.position[axis] - b.position[axis]
    );

    const newPlacements: Placement[] = [];

    for (let i = 0; i < updatedPlacements.length; i++) {
      const box = updatedPlacements[i];
      let maxEndBefore = 0;

      for (let j = 0; j < i; j++) {
        const other = newPlacements[j];

        const [a1, a2] = axes.filter(a => a !== axis);
        const axisIndex = axes.indexOf(axis);
        const a1Index = axes.indexOf(a1);
        const a2Index = axes.indexOf(a2);

        const boxA1Min = box.position[a1];
        const boxA1Max = boxA1Min + box.rotation[a1Index];
        const otherA1Min = other.position[a1];
        const otherA1Max = otherA1Min + other.rotation[a1Index];

        const boxA2Min = box.position[a2];
        const boxA2Max = boxA2Min + box.rotation[a2Index];
        const otherA2Min = other.position[a2];
        const otherA2Max = otherA2Min + other.rotation[a2Index];

        const overlapsInOtherAxes =
          boxA1Min < otherA1Max && boxA1Max > otherA1Min &&
          boxA2Min < otherA2Max && boxA2Max > otherA2Min;

        if (overlapsInOtherAxes) {
          const otherEnd = other.position[axis] + other.rotation[axisIndex];
          maxEndBefore = Math.max(maxEndBefore, otherEnd);
        }
      }

      // Return a new placement with updated position
      const snappedBox: Placement = {
        ...box,
        position: {
          ...box.position,
          [axis]: maxEndBefore
        }
      };

      newPlacements.push(snappedBox);
    }

    updatedPlacements = newPlacements;
  }

  return updatedPlacements;
}
