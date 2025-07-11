import { BoxDimensions, Container, CalculationResult, Placement } from './types';

export function handleEdgeCases(box: BoxDimensions, container: Container): CalculationResult | null {
  const volumeMm3 = box.length * box.width * box.height;
  const volumeDm3 = volumeMm3 / 1_000_000;

  if (volumeDm3 > 10) return null;

  console.log(`📦 Small volume box (${volumeDm3.toFixed(2)} dm³) – performing analytical fit.`);

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
    const fitX = Math.floor(container.length / l);
    const fitY = Math.floor(container.height / h); // Y axis = height
    const fitZ = Math.floor(container.width / w);
    const total = fitX * fitY * fitZ;

    if (total > bestFit.count) {
      bestFit = {
        count: total,
        dims: [l, h, w], // map to [X, Y (height), Z]
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
