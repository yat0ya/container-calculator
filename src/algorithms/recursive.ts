import { BoxDimensions, Container, CalculationResult, BoxPlacement as Placement } from '../types';

interface Space {
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
}

const getRotations = (box: BoxDimensions): [number, number, number][] => [
  [box.length, box.width, box.height],
  [box.length, box.height, box.width],
  [box.width, box.length, box.height],
  [box.width, box.height, box.length],
  [box.height, box.length, box.width],
  [box.height, box.width, box.length],
];

const canFit = (space: Space, dims: [number, number, number]) => {
  return (
    dims[0] <= space.length &&
    dims[1] <= space.height &&
    dims[2] <= space.width
  );
};

function fillWithPattern(space: Space, rotation: [number, number, number]): Placement[] {
  const placements: Placement[] = [];
  const [dx, dy, dz] = rotation;
  const xCount = Math.floor(space.length / dx);
  const yCount = Math.floor(space.height / dy);
  const zCount = Math.floor(space.width / dz);

  for (let xi = 0; xi < xCount; xi++) {
    for (let yi = 0; yi < yCount; yi++) {
      for (let zi = 0; zi < zCount; zi++) {
        placements.push({
          position: {
            x: space.x + xi * dx,
            y: space.y + yi * dy,
            z: space.z + zi * dz,
          },
          rotation,
        });
      }
    }
  }

  return placements;
}

function subtractSpace(space: Space, placements: Placement[]): Space[] {
  const remainingSpaces: Space[] = [space];

  for (const placement of placements) {
    const nextSpaces: Space[] = [];
    for (const region of remainingSpaces) {
      const px = placement.position.x;
      const py = placement.position.y;
      const pz = placement.position.z;
      const pl = placement.rotation[0];
      const ph = placement.rotation[1];
      const pw = placement.rotation[2];

      const ix = Math.max(region.x, px);
      const iy = Math.max(region.y, py);
      const iz = Math.max(region.z, pz);
      const ax = Math.min(region.x + region.length, px + pl);
      const ay = Math.min(region.y + region.height, py + ph);
      const az = Math.min(region.z + region.width, pz + pw);

      const intersects = ax > ix && ay > iy && az > iz;

      if (!intersects) {
        nextSpaces.push(region);
        continue;
      }

      const xSlices = [region.x, px, px + pl, region.x + region.length].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
      const ySlices = [region.y, py, py + ph, region.y + region.height].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
      const zSlices = [region.z, pz, pz + pw, region.z + region.width].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

      for (let xi = 0; xi < xSlices.length - 1; xi++) {
        for (let yi = 0; yi < ySlices.length - 1; yi++) {
          for (let zi = 0; zi < zSlices.length - 1; zi++) {
            const sx = xSlices[xi], sy = ySlices[yi], sz = zSlices[zi];
            const sl = xSlices[xi + 1] - sx;
            const sh = ySlices[yi + 1] - sy;
            const sw = zSlices[zi + 1] - sz;

            const insidePlaced =
              sx >= px && sx + sl <= px + pl &&
              sy >= py && sy + sh <= py + ph &&
              sz >= pz && sz + sw <= pz + pw;

            if (sl > 0 && sh > 0 && sw > 0 && !insidePlaced) {
              nextSpaces.push({ x: sx, y: sy, z: sz, length: sl, height: sh, width: sw });
            }
          }
        }
      }
    }
    remainingSpaces.length = 0;
    remainingSpaces.push(...nextSpaces);
  }

  return remainingSpaces;
}

export function recursiveAlgorithm(box: BoxDimensions, container: Container): CalculationResult {
  const boxMeters = {
    length: box.length / 100,
    width: box.width / 100,
    height: box.height / 100,
  };

  const rotations = getRotations(boxMeters);
  let bestPlacements: Placement[] = [];
  let bestRotation: [number, number, number] = rotations[0];

  // Stage 1: Try each rotation and pick the one that fits the most
  for (const rotation of rotations) {
    const placements = fillWithPattern({
      x: 0,
      y: 0,
      z: 0,
      length: container.length,
      width: container.width,
      height: container.height,
    }, rotation);
    if (placements.length > bestPlacements.length) {
      bestPlacements = placements;
      bestRotation = rotation;
    }
  }

  let totalPlacements = [...bestPlacements];

  // Stage 2: Divide remaining space into Top, Front, Side blocks and recursively fill
  const divideSpace = (origin: Space, fillRegion: Space): Space[] => {
    const filledX = fillRegion.x + fillRegion.length;
    const filledY = fillRegion.y + fillRegion.height;
    const filledZ = fillRegion.z + fillRegion.width;

    const top: Space = {
      x: origin.x,
      y: filledY,
      z: origin.z,
      length: origin.length,
      height: origin.height - (filledY - origin.y),
      width: origin.width,
    };
    const front: Space = {
      x: filledX,
      y: origin.y,
      z: origin.z,
      length: origin.length - (filledX - origin.x),
      height: filledY - origin.y,
      width: origin.width,
    };
    const side: Space = {
      x: origin.x,
      y: origin.y,
      z: filledZ,
      length: filledX - origin.x,
      height: filledY - origin.y,
      width: origin.width - (filledZ - origin.z),
    };
    return [top, front, side].filter(s => s.length > 0 && s.height > 0 && s.width > 0);
  };

  const fillRecursively = (space: Space): Placement[] => {
    const allFills: Placement[][] = [];
    for (const rotation of rotations) {
      const placements = fillWithPattern(space, rotation);
      allFills.push(placements);
    }
    const best = allFills.reduce((max, curr) => curr.length > max.length ? curr : max, []);
    if (best.length === 0) return [];

    const filledRegion: Space = {
      x: best[0].position.x,
      y: best[0].position.y,
      z: best[0].position.z,
      length: best[0].rotation[0] * Math.floor(space.length / best[0].rotation[0]),
      height: best[0].rotation[1] * Math.floor(space.height / best[0].rotation[1]),
      width: best[0].rotation[2] * Math.floor(space.width / best[0].rotation[2]),
    };

    const subSpaces = divideSpace(space, filledRegion);
    const recursiveFills = subSpaces.flatMap(s => fillRecursively(s));

    return [...best, ...recursiveFills];
  };

  const containerSpace: Space = {
    x: 0,
    y: 0,
    z: 0,
    length: container.length,
    height: container.height,
    width: container.width,
  };

  const stage2Placements = fillRecursively(containerSpace).filter(p =>
    !totalPlacements.some(e =>
      e.position.x === p.position.x &&
      e.position.y === p.position.y &&
      e.position.z === p.position.z
    )
  );

  totalPlacements.push(...stage2Placements);

  const lengthFit = Math.floor(container.length / bestRotation[0]);
  const heightFit = Math.floor(container.height / bestRotation[1]);
  const widthFit = Math.floor(container.width / bestRotation[2]);

  return {
    totalBoxes: totalPlacements.length,
    placements: totalPlacements,
    boxInMeters: boxMeters,
    lengthFit,
    heightFit,
    widthFit,
  };
}
