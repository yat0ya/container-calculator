import { Placement } from '../../types';
import { boxesOverlap } from '../../utils';
import { EPSILON } from '../../constants';

/**
 * Builds a support map indicating which boxes depend on which.
 */
function buildSupportMap(placements: Placement[]): Map<Placement, Placement[]> {
  const supportMap = new Map<Placement, Placement[]>();

  for (const base of placements) {
    const baseTop = base.position.y + base.rotation[1];
    for (const box of placements) {
      if (box === base) continue;

      const isAbove =
        Math.abs(box.position.y - baseTop) < EPSILON &&
        box.position.x + EPSILON >= base.position.x &&
        box.position.x <= base.position.x + base.rotation[0] + EPSILON &&
        box.position.z + EPSILON >= base.position.z &&
        box.position.z <= base.position.z + base.rotation[2] + EPSILON;

      if (isAbove) {
        if (!supportMap.has(base)) {
          supportMap.set(base, []);
        }
        supportMap.get(base)!.push(box);
      }
    }
  }

  return supportMap;
}

/**
 * Recursively gathers all dependent boxes starting from a root.
 */
function gatherDependentBoxes(root: Placement, supportMap: Map<Placement, Placement[]>, visited: Set<Placement>) {
  if (visited.has(root)) return;
  visited.add(root);
  const dependents = supportMap.get(root) || [];
  for (const child of dependents) {
    gatherDependentBoxes(child, supportMap, visited);
  }
}

/**
 * Removes the smallest number of overlapping boxes, starting with the most destructive ones.
 */
export function removeOverlappingBoxes(placements: Placement[]): Placement[] {
  const remaining = new Set(placements);
  const supportMap = buildSupportMap(placements);

  while (true) {
    const overlapCount = new Map<Placement, number>();

    const current = Array.from(remaining);
    let anyOverlap = false;

    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const a = current[i];
        const b = current[j];
        if (boxesOverlap(a, b)) {
          anyOverlap = true;
          overlapCount.set(a, (overlapCount.get(a) || 0) + 1);
          overlapCount.set(b, (overlapCount.get(b) || 0) + 1);
        }
      }
    }

    if (!anyOverlap) break;

    // Remove the most overlapping box and its dependents
    const [worstBox] = Array.from(overlapCount.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const toRemove = new Set<Placement>();
    gatherDependentBoxes(worstBox, supportMap, toRemove);
    for (const box of toRemove) {
      remaining.delete(box);
    }
  }

  return Array.from(remaining);
}
