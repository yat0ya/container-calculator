import { BoxDimensions, Container, CalculationResult, Placement } from '../types';

// Add missing util
const cmToMeters = (cm: number) => cm / 100;

interface Position {
  x: number;
  y: number;
  z: number;
}

const getRotations = (box: BoxDimensions): [number, number, number][] => {
  const l = cmToMeters(box.length);
  const w = cmToMeters(box.width);
  const h = cmToMeters(box.height);

  return [
    [l, w, h],
    [l, h, w],
    [w, l, h],
    [w, h, l],
    [h, l, w],
    [h, w, l],
  ];
};

const fits = (position: Position, rotation: [number, number, number], container: Container): boolean => {
  return (
    position.x + rotation[0] <= container.length &&
    position.y + rotation[1] <= container.height &&
    position.z + rotation[2] <= container.width
  );
};

const overlaps = (a: Position, sizeA: [number, number, number], b: Position, sizeB: [number, number, number]): boolean => {
  return !(
    a.x + sizeA[0] <= b.x || b.x + sizeB[0] <= a.x ||
    a.y + sizeA[1] <= b.y || b.y + sizeB[1] <= a.y ||
    a.z + sizeA[2] <= b.z || b.z + sizeB[2] <= a.z
  );
};

const canPlace = (position: Position, rotation: [number, number, number], placed: Placement[], container: Container): boolean => {
  if (!fits(position, rotation, container)) return false;
  return placed.every(p => !overlaps(position, rotation, p.position, p.rotation));
};

const placeBoxes = (
  container: Container,
  box: BoxDimensions,
  placed: Placement[],
  candidates: Position[]
): Placement[] => {
  const rotations = getRotations(box);

  for (const pos of candidates) {
    for (const rot of rotations) {
      if (canPlace(pos, rot, placed, container)) {
        const nextPlaced = [...placed, { position: pos, rotation: rot }];
        const newCandidates: Position[] = [
          { x: pos.x + rot[0], y: pos.y, z: pos.z },
          { x: pos.x, y: pos.y + rot[1], z: pos.z },
          { x: pos.x, y: pos.y, z: pos.z + rot[2] },
        ];

        const result = placeBoxes(container, box, nextPlaced, [...candidates, ...newCandidates]);
        return result.length > placed.length ? result : placed;
      }
    }
  }

  return placed;
};

export const recursiveAlgorithm = (box: BoxDimensions, container: Container): CalculationResult => {
  const placements = placeBoxes(container, box, [], [{ x: 0, y: 0, z: 0 }]);

  // Optional: derive bounding fit
  let lengthFit = 0, heightFit = 0, widthFit = 0;
  for (const p of placements) {
    lengthFit = Math.max(lengthFit, Math.ceil((p.position.x + p.rotation[0]) / cmToMeters(box.length)));
    heightFit = Math.max(heightFit, Math.ceil((p.position.y + p.rotation[1]) / cmToMeters(box.height)));
    widthFit = Math.max(widthFit, Math.ceil((p.position.z + p.rotation[2]) / cmToMeters(box.width)));
  }

  return {
    totalBoxes: placements.length,
    placements,
    boxInMeters: {
      length: cmToMeters(box.length),
      width: cmToMeters(box.width),
      height: cmToMeters(box.height),
    },
    lengthFit,
    heightFit,
    widthFit,
  };
};
