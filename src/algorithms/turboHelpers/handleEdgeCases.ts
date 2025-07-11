import { BoxDimensions, Container, CalculationResult, Placement } from './types';

export function handleEdgeCases(box: BoxDimensions, container: Container): CalculationResult | null {
  const volumeMm3 = box.length * box.width * box.height;
  const volumeDm3 = volumeMm3 / 1_000_000;

  if (volumeDm3 <= 10 && !isFlatBox(box)) {
    console.log('📦 SMALL box detected');
    return handleSmallVolume(box, container, volumeDm3);
  }

  if (isFlatBox(box)) {
    console.log('📏 FLAT/LONG box detected');
    return handleFlatBox(box, container);
  }

  return null;
}

// ─────────────────────────────────────────────────────────────

function handleSmallVolume(box: BoxDimensions, container: Container, volumeDm3: number): CalculationResult {
  const fit = performAnalyticalFit(box, container, true);

  return {
    totalBoxes: fit.placements.length,
    placements: fit.placements,
    boxInMeters: {
      length: box.length / 1000,
      width: box.width / 1000,
      height: box.height / 1000,
      weight: box.weight,
      value: box.value
    }
  };
}

function handleFlatBox(box: BoxDimensions, container: Container): CalculationResult {
  const placements: Placement[] = [];
  const minBoxDim = Math.min(box.length, box.width, box.height);

  const mainFit = performAnalyticalFit(box, container, false);
  const [mainLen, , mainWid] = mainFit.dims;
  const [mainFitX, , mainFitZ] = mainFit.fit;

  const usedX = mainFitX * mainLen;
  const usedZ = mainFitZ * mainWid;

  const queue: {
    origin: { x: number; y: number; z: number };
    space: { length: number; width: number; height: number };
  }[] = [{
    origin: { x: 0, y: 0, z: 0 },
    space: { length: container.length, width: container.width, height: container.height }
  }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.origin.z - b.origin.z);
    const { origin, space } = queue.shift()!;

    const isFirst = placements.length === 0;
    const fit = performAnalyticalFit(box, space, !isFirst);
    if (fit.count === 0) continue;

    const shifted = shiftPlacements(fit.placements, origin.x, origin.y, origin.z);
    placements.push(...shifted);

    const [len, hei, wid] = fit.dims;
    const [fx, fy, fz] = fit.fit;

    const filledX = fx * len;
    const filledY = fy * hei;
    const filledZ = fz * wid;

    const top = space.height - filledY;
    const right = space.length - filledX;
    const back = space.width - filledZ;

    if (top >= minBoxDim) {
      queue.push({
        origin: { x: origin.x, y: origin.y + filledY, z: origin.z },
        space: { length: filledX, width: filledZ, height: top }
      });
    }

    if (right >= minBoxDim) {
      queue.push({
        origin: { x: origin.x + filledX, y: origin.y, z: origin.z },
        space: { length: right, width: filledZ, height: filledY }
      });
    }

    if (back >= minBoxDim) {
      queue.push({
        origin: { x: origin.x, y: origin.y, z: origin.z + filledZ },
        space: { length: filledX, width: back, height: filledY }
      });
    }

    const topGap = space.height - filledY;
    if (filledX < space.length && filledZ < space.width && topGap >= minBoxDim) {
      queue.push({
        origin: { x: origin.x, y: origin.y + filledY, z: origin.z },
        space: { length: space.length, width: space.width, height: topGap }
      });
    }
  }

  const remainingLength = container.length - usedX;
  const remainingWidth = container.width - usedZ;

  if (remainingLength >= minBoxDim && remainingWidth >= minBoxDim) {
    const cornerFit = performAnalyticalFit(box, {
      length: remainingLength,
      width: remainingWidth,
      height: container.height
    }, true);

    const shiftedCorner = shiftPlacements(cornerFit.placements, usedX, 0, usedZ);
    placements.push(...shiftedCorner);

    const stripWidth = container.width - (usedZ + remainingWidth);
    if (stripWidth >= minBoxDim) {
      const stripFit = performAnalyticalFit(box, {
        length: remainingLength,
        width: stripWidth,
        height: container.height
      }, true);

      const shiftedStrip = shiftPlacements(stripFit.placements, usedX, 0, usedZ + remainingWidth);
      placements.push(...shiftedStrip);
    }
  }

  return {
    totalBoxes: placements.length,
    placements,
    boxInMeters: {
      length: box.length / 1000,
      width: box.width / 1000,
      height: box.height / 1000,
      weight: box.weight,
      value: box.value
    }
  };
}

// ─────────────────────────────────────────────────────────────

function shiftPlacements(placements: Placement[], dx: number, dy: number, dz: number): Placement[] {
  return placements.map(p => ({
    ...p,
    position: {
      x: p.position.x + dx,
      y: p.position.y + dy,
      z: p.position.z + dz
    }
  }));
}

function performAnalyticalFit(
  box: BoxDimensions,
  space: { length: number; width: number; height: number },
  allowAllOrientations: boolean
): {
  placements: Placement[];
  count: number;
  dims: [number, number, number];
  fit: [number, number, number];
} {
  const orientations: [number, number, number][] = [
    [box.length, box.width, box.height],
    [box.length, box.height, box.width],
    [box.width, box.length, box.height],
    [box.width, box.height, box.length],
    [box.height, box.length, box.width],
    [box.height, box.width, box.length],
  ];

  let bestFit = {
    count: 0,
    dims: [box.length, box.width, box.height] as [number, number, number],
    fit: [0, 0, 0] as [number, number, number]
  };

  for (const [l, w, h] of orientations) {
    const baseArea = l * w;
    const maxFace = Math.max(l * w, l * h, w * h);
    const minFace = Math.min(l * w, l * h, w * h);

    if (!allowAllOrientations && baseArea === minFace) continue;

    const fitX = Math.floor(space.length / l);
    const fitY = Math.floor(space.height / h);
    const fitZ = Math.floor(space.width / w);
    const total = fitX * fitY * fitZ;

    if (total > bestFit.count) {
      bestFit = {
        count: total,
        dims: [l, h, w],
        fit: [fitX, fitY, fitZ]
      };
    }
  }

  const [len, hei, wid] = bestFit.dims;
  const [fitX, fitY, fitZ] = bestFit.fit;

  const placements: Placement[] = [];

  for (let x = 0; x < fitX; x++) {
    for (let y = 0; y < fitY; y++) {
      for (let z = 0; z < fitZ; z++) {
        placements.push({
          position: {
            x: x * len,
            y: y * hei,
            z: z * wid
          },
          rotation: [len, hei, wid]
        });
      }
    }
  }

  return {
    placements,
    count: placements.length,
    dims: bestFit.dims,
    fit: bestFit.fit
  };
}

// ─────────────────────────────────────────────────────────────

function isFlatBox(box: BoxDimensions): boolean {
  const dims = [box.length, box.width, box.height].sort((a, b) => a - b);
  const [min, , max] = dims;
  return min / max < 0.1;
}
