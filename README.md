# Container Calculator

[Live Demo](http://tos21.tcn.toya.pl:8080/container-calculator/)

## Description

Container Calculator is a powerful web application that helps users optimize cargo loading by calculating the maximum number of boxes that can fit into standard shipping containers. It features a 3D visualization of the loading pattern and supports multiple container types and calculation algorithms.

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

## Recursive Algorithm

The recursive algorithm (Toya Plugger) implements a space-filling approach to maximize container utilization. Here's how it works:

1. **Space Analysis**: The algorithm starts with the entire container as a single space and recursively:
   - Attempts to fill the main space with boxes in the most efficient orientation
   - Identifies remaining unfilled spaces
   - Continues filling these spaces until no more boxes can fit

2. **Rotation Optimization**: For each space, the algorithm:
   - Tests all possible box rotations (6 possible orientations)
   - Selects the orientation that yields the highest box count
   - Ensures boxes are packed tightly without gaps

3. **Space Division**: After filling a space, the algorithm:
   - Divides the remaining space into smaller sections
   - Processes these sections in three directions:
     - Length (right)
     - Width (front)
     - Height (top)

4. **Weight Constraints**: The algorithm:
   - Considers container weight limits
   - Adjusts the total box count if weight limits are exceeded
   - Maintains the optimal arrangement while respecting weight restrictions

This approach typically yields better results than the basic algorithm, especially for complex loading scenarios with varied box dimensions.