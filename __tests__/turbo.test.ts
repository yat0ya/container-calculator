import { turboAlgorithm } from '../src/algorithms/turbo';
import { benchmark } from '../src/utils/benchmarkWrapper';

const container40HC_mm = {
  id: 'K40HC',
  name: "Kontener 40'HC",
  length: 12030, // mm
  width: 2340,
  height: 2700,
  maxLoad: 28600,
};

const box_cm = {
  length: 79.4, // cm
  width: 49.1,
  height: 87,
};

// Convert container from mm to meters
const container40HC_m = {
  ...container40HC_mm,
  length: container40HC_mm.length / 1000,
  width: container40HC_mm.width / 1000,
  height: container40HC_mm.height / 1000,
};

describe('Turbo Algorithm - K40HC with realistic box', () => {
  it("calculates total boxes for 40'HC container", () => {
    const { result, timeMs } = benchmark(() =>
      turboAlgorithm(box_cm, container40HC_m)
    );

    // console.log('🔍 Result:', result);
    // console.log(`⏱️ Time: ${timeMs.toFixed(2)}ms`);
    // console.log(`📦 Boxes: ${result.totalBoxes}`);

    // Adjust these bounds if needed depending on actual packing
    expect(result.totalBoxes).toEqual(207)
    expect(timeMs).toBeLessThan(5000);
  });
});
