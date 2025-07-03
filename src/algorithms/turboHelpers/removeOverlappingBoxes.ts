import { Placement } from './types';
import { boxesOverlap } from '../turboHelpers/utils';

/**
 * Builds a support map indicating which boxes are stacked on top of others.
 */
function buildSupportMap(placements: Placement[]): Map<Placement, Placement[]> {
  const supportPairs: [Placement, Placement][] = [];

  for (const base of placements) {
    const baseTopY = base.position.y + base.rotation[1];

    for (const box of placements) {
      if (box === base) continue;

      const alignedAbove =
        box.position.y === baseTopY &&
        box.position.x >= base.position.x &&
        box.position.x < base.position.x + base.rotation[0] &&
        box.position.z >= base.position.z &&
        box.position.z < base.position.z + base.rotation[2];

      if (alignedAbove) {
        supportPairs.push([base, box]);
      }
    }
  }

  const supportMap = new Map<Placement, Placement[]>();
  for (const [base, box] of supportPairs) {
    const existing = supportMap.get(base) || [];
    supportMap.set(base, [...existing, box]);
  }

  return supportMap;
}

/**
 * Recursively collects all boxes supported by the given root box.
 */
function gatherDependentBoxes(
  root: Placement,
  supportMap: Map<Placement, Placement[]>,
  visited: Set<Placement>
): void {
  if (visited.has(root)) return;
  visited.add(root);

  const dependents = supportMap.get(root) || [];
  for (const child of dependents) {
    gatherDependentBoxes(child, supportMap, visited);
  }
}

/**
 * Removes overlapping boxes and their dependent stack using precise overlap detection.
 */
export function removeOverlappingBoxes(placements: Placement[]): Placement[] {
  let remaining = new Set(placements);
  const supportMap = buildSupportMap(placements);

  let iterationCount = 0;
  const maxIterations = placements.length;

  while (iterationCount < maxIterations) {
    const current = Array.from(remaining);
    const overlapCount = new Map<Placement, number>();
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

    const sortedOverlaps = Array.from(overlapCount.entries())
      .sort(([, countA], [, countB]) => countB - countA);

    if (sortedOverlaps.length === 0) break;

    const [worstBox] = sortedOverlaps[0];
    const toRemove = new Set<Placement>();
    gatherDependentBoxes(worstBox, supportMap, toRemove);

    remaining = new Set(Array.from(remaining).filter(p => !toRemove.has(p)));

    iterationCount++;
  }

  return Array.from(remaining);
}
