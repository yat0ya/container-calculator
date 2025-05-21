# Container Calculator

[Live Version](http://tos21.tcn.toya.pl:8080/container-calculator/)

## Description

Container Calculator is a powerful web application that helps users optimize cargo loading by calculating the maximum number of boxes that can fit into standard shipping containers. It features a 3D visualization of the loading pattern and supports multiple container types and 2 calculation algorithms.

Key features:
- Multiple container type support (20', 40', 45' etc.)
- Two calculation algorithms (Basic and Recursive)
- 3D visualization of box arrangement
- Weight and value calculations
- Real-time results
- Interactive 3D viewer

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/container-calculator.git
cd container-calculator
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

## Tech Stack

- React 18
- TypeScript
- Vite
- Three.js with React Three Fiber
- Tailwind CSS
- Lucide React (icons)

## Recursive Algorithm (Toya Plugger)

The recursive algorithm—internally called the "Toya Plugger"—employs a divide-and-conquer strategy to maximize box placements within a container. It recursively partitions the container space to tightly fit as many boxes as possible, considering all valid rotations and physical constraints.

### How It Works

1. **Initial Placement**:
   - The algorithm starts by trying to place a box at a given origin (starting with `(0, 0, 0)`).
   - It attempts every valid orientation (length × width × height permutations) and checks if the box fits in the remaining space.

2. **Best Orientation Selection**:
   - For each fitting orientation, it calculates how many boxes can be placed in a grid pattern.
   - The orientation yielding the maximum number of boxes is selected.

3. **Recursive Subdivision**:
   - After placing boxes, the remaining unfilled volume is split into three new subspaces:
     - Space to the right of the placed boxes
     - Space in front of the placed boxes
     - Space above the placed boxes
   - The algorithm recurses into each subspace to continue placing boxes.

4. **Boundary Checks**:
   - The algorithm ensures that no boxes exceed the container’s dimensions.
   - It skips subdivisions where dimensions are zero or negative to prevent unnecessary recursion.

5. **Weight Handling**:
   - Post-placement, if the total weight exceeds the container’s max load, the result is trimmed to the allowed limit.
   - This ensures safety and feasibility of the final arrangement.

This approach offers an effective trade-off between simplicity and packing efficiency. It is particularly well-suited for scenarios where tight, grid-aligned packing is desired.
