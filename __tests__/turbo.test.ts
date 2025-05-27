import { turboAlgorithm } from '../src/algorithms/turbo';
import { benchmark } from '../src/utils/benchmarkWrapper';

const container40HC = {
  id: 'K40HC',
  name: "Kontener 40'HC",
  length: 12030,
  width: 2340,
  height: 2700,
  maxLoad: 28600,
};

const box = {
  length: 79.4,
  width: 49.1,
  height: 87,
};

describe('Plugger Algorithm - K40HC with realistic box', () => {
  it("calculates total boxes for 40'HC container", () => {
    const { result, timeMs } = benchmark(() =>
      turboAlgorithm(box, container40HC)
    );

    console.log('🔍 Result:', result);
    console.log(`⏱️ Time: ${timeMs.toFixed(2)}ms`);
    console.log(`📦 Boxes: ${result.totalBoxes}`);

    // Adjust bounds based on expected fill — tweak if needed
    expect(result.totalBoxes).toBeGreaterThanOrEqual(9);
    expect(result.totalBoxes).toBeLessThanOrEqual(120);
    expect(timeMs).toBeLessThan(3000);
  });
});
