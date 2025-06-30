import { Placement } from './types';
import { boxesOverlap } from '../turboHelpers/utils';

/**
 * Builds a support map indicating which boxes are stacked on top of others.
 */
function buildSupportMap(placements: Placement[]): Map<Placement, Placement[]> {
  const supportMap = new Map<Placement, Placement[]>();

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
 * Iteratively removes overlapping boxes and their dependent stack.
 */
export function removeOverlappingBoxes(placements: Placement[]): Placement[] {
  const remaining = new Set(placements);
  const supportMap = buildSupportMap(placements);

  while (true) {
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

    // Pick the box causing the most overlaps
    const [worstBox] = Array.from(overlapCount.entries())
      .sort(([, countA], [, countB]) => countB - countA)[0];

    // Remove it and all boxes that depend on it
    const toRemove = new Set<Placement>();
    gatherDependentBoxes(worstBox, supportMap, toRemove);
    for (const box of toRemove) {
      remaining.delete(box);
    }
  }

  return Array.from(remaining);
}
