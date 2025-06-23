import { Placement } from '../../types';
import { EPSILON, MAX_ITERATIONS } from '../../constants';

type Axis = 'x' | 'y' | 'z';
export type PullDirection = 'down' | 'up' | 'left' | 'right' | 'back' | 'forward';

const directionMap: Record<PullDirection, { axis: Axis; sign: -1 | 1 }> = {
  down: { axis: 'y', sign: -1 },
  up: { axis: 'y', sign: 1 },
  left: { axis: 'x', sign: -1 },
  right: { axis: 'x', sign: 1 },
  back: { axis: 'z', sign: -1 },
  forward: { axis: 'z', sign: 1 },
};

export function applyPull(placements: Placement[], direction: PullDirection): void {
  const { axis, sign } = directionMap[direction];
  const axisIdx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  const orthogonalAxes = ['x', 'y', 'z'].filter(a => a !== axis) as Axis[];
  const orthoIdx = orthogonalAxes.map(a => (a === 'x' ? 0 : a === 'y' ? 1 : 2));

  let moved: boolean;
  let iterations = 0;

  do {
    moved = false;
    iterations++;

    for (const box of placements) {
      const currentPos = box.position[axis];
      let targetPos = sign === -1 ? 0 : Number.POSITIVE_INFINITY;

      for (const other of placements) {
        if (other === box) continue;

        const overlaps = orthoIdx.every(i => {
          const ortho = ['x', 'y', 'z'][i] as Axis;
          return !(box.position[ortho] + box.rotation[i] <= other.position[ortho] ||
                   other.position[ortho] + other.rotation[i] <= box.position[ortho]);
        });

        if (!overlaps) continue;

        const otherEdge = sign === -1
          ? other.position[axis] + other.rotation[axisIdx]
          : other.position[axis];

        if (sign === -1 && otherEdge <= currentPos + EPSILON && otherEdge > targetPos) {
          targetPos = otherEdge;
        } else if (sign === 1 && otherEdge >= currentPos - EPSILON && otherEdge < targetPos) {
          targetPos = otherEdge;
        }
      }

      if (Math.abs(currentPos - targetPos) > EPSILON) {
        box.position[axis] = targetPos;
        moved = true;
      }
    }
  } while (moved && iterations < MAX_ITERATIONS);
}
