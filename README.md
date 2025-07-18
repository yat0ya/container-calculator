# Container Calculator

[Live Version](https://tos21.tcn.toya.pl/calculator/)

## Description

Container Calculator is a powerful web application that helps users optimize cargo loading by calculating the maximum number of boxes that can fit into standard shipping containers. It features a 3D visualization of the loading pattern and supports multiple container types with an advanced calculation algorithm.

Key features:
- Multiple container type support (20', 40', 40'HC, 45'HC)
- Advanced Toya Turbo algorithm for optimal packing
- 3D visualization of box arrangement with enhanced graphics
- Weight and value calculations
- Real-time results
- Interactive 3D viewer with instanced rendering for performance

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

## Toya Turbo Algorithm

The **Toya Turbo** algorithm is a packing solution, designed for optimal container utilization with exceptional performance. It combines multiple advanced techniques to achieve superior packing density while maintaining computational efficiency.

### Algorithm Overview

The Toya Turbo algorithm employs a multi-phase approach that maximizes container space utilization through:

1. **Strategic Wall Building** - Creates optimal foundation patterns
2. **Pattern Repetition** - Extends successful arrangements
3. **Analytical Layering** - Builds vertical layers with support analysis
4. **Tail Area Optimization** - Fills remaining spaces efficiently
5. **Gap Patching** - Addresses small leftover spaces
6. **Alignment Optimization** - Ensures tight, stable arrangements
7. **Weight Constraint Enforcement** - Adjusts results to honor max load
8. **Exception Handling** - Catches and reports algorithmic edge cases