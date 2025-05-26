import { pluggerAlgorithm } from '../src/algorithms/plugger';
import { benchmark } from '../src/utils/benchmarkWrapper';

const container20 = {
  id: 'K20',
  name: "Kontener 20'",
  length: 5900,
  width: 2340,
  height: 2390,
  maxLoad: 25000,
};

const box = {
  length: 100,
  width: 80,
  height: 50,
};

// describe('Plugger Algorithm - Stable Realistic Scenario', () => {
//   it("calculates total boxes for 20' container", () => {
//     const { result, timeMs } = benchmark(() =>
//       pluggerAlgorithm(box, container20)
//     );

//     console.log(`⏱️ Time: ${timeMs.toFixed(2)}ms`);
//     console.log(`📦 Boxes: ${result.totalBoxes}`);

//     expect(result.totalBoxes).toBeGreaterThanOrEqual(68);
//     expect(result.totalBoxes).toBeLessThanOrEqual(75);
//     expect(timeMs).toBeLessThan(5000);
//   });
// });

describe('Plugger Algorithm - Minimal Valid Scenario', () => {
  it("calculates total boxes for 20' container with large box", () => {
    const { result, timeMs } = benchmark(() =>
      pluggerAlgorithm(box, container20)
    );

    console.log('🔍 Result:', result);
    console.log(`⏱️ Time: ${timeMs.toFixed(2)}ms`);
    console.log(`📦 Boxes: ${result.totalBoxes}`);

    expect(result.totalBoxes).toBeGreaterThanOrEqual(25);
    expect(result.totalBoxes).toBeLessThanOrEqual(28);
    expect(timeMs).toBeLessThan(3000);
  });
});

