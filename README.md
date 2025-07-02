# Container Calculator

[Live Version](https://tos21.tcn.toya.pl/calculator/)

## Description

Container Calculator is a powerful web application that helps users optimize cargo loading by calculating the maximum number of boxes that can fit into standard shipping containers. It features a 3D visualization of the loading pattern and supports multiple container types with an advanced calculation algorithm.

Key features:
- Multiple container type support (20', 40', 45' etc.)
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
- Lucide React (icons)

## Toya Turbo Algorithm

The **Toya Turbo** algorithm is our flagship packing solution, designed for optimal container utilization with exceptional performance. It combines multiple advanced techniques to achieve superior packing density while maintaining computational efficiency.

### Algorithm Overview

The Toya Turbo algorithm employs a multi-phase approach that maximizes container space utilization through:

1. **Strategic Wall Building** - Creates optimal foundation patterns
2. **Pattern Repetition** - Extends successful arrangements
3. **Analytical Layering** - Builds vertical layers with support analysis
4. **Tail Area Optimization** - Fills remaining spaces efficiently
5. **Gap Patching** - Addresses small leftover spaces
6. **Alignment Optimization** - Ensures tight, stable arrangements

### Key Features

#### 🏗️ **Wall Building Phase**
- Analyzes all possible box orientations
- Uses backtracking to find optimal wall configurations
- Prioritizes arrangements that maximize cross-sectional area coverage
- Considers both height and width utilization

#### 🔄 **Pattern Repetition**
- Identifies successful packing patterns from the wall phase
- Extends these patterns along the container length
- Maintains structural integrity while maximizing repetition

#### 📐 **Analytical Layering**
- Automatically detects layering opportunities
- Calculates support requirements (minimum 80% support area)
- Creates stable vertical arrangements
- Handles mixed orientations within layers

#### 🎯 **Tail Area Optimization**
- Identifies and maps remaining unpacked spaces
- Uses height maps to track clearance requirements
- Fills gaps with optimal box orientations
- Handles irregular remaining spaces efficiently

#### 🔧 **Gap Patching**
- Performs final sweep for small remaining spaces
- Uses surface mapping to identify placement opportunities
- Adds boxes on top of existing arrangements where stable
- Maximizes utilization of leftover volume

#### ⚡ **Performance Optimizations**
- Millimeter-precision calculations for accuracy
- Grid-based spatial indexing for fast collision detection
- Memoization of repeated calculations
- Time-limited operations to prevent excessive computation

### Algorithm Workflow

```
1. Input Processing
   ├── Convert box dimensions (cm → mm)
   ├── Generate all 6 orientations
   └── Validate container constraints

2. Wall Building
   ├── Backtrack through orientation combinations
   ├── Score layouts by area coverage
   ├── Select optimal wall configuration
   └── Create initial placement pattern

3. Pattern Extension
   ├── Repeat wall pattern along length
   ├── Check for overlaps and boundaries
   └── Build primary packing structure

4. Analytical Layering
   ├── Detect bottom layer pattern
   ├── Calculate support requirements
   ├── Stack layers with 80% support rule
   └── Handle mixed orientations

5. Tail Area Processing
   ├── Identify remaining spaces
   ├── Create height maps for clearance
   ├── Fill gaps with optimal orientations
   └── Handle irregular geometries

6. Final Optimization
   ├── Patch small remaining gaps
   ├── Align boxes for stability
   ├── Remove any overlapping boxes
   └── Apply weight constraints

7. Result Generation
   ├── Calculate final box count
   ├── Generate 3D placement data
   ├── Compute weight and value totals
   └── Prepare visualization data
```

### Technical Implementation

#### Coordinate System
- **Units**: Millimeters for precision, converted to meters for visualization
- **Origin**: Container corner (0,0,0)
- **Axes**: X=length, Y=height, Z=width

#### Box Orientations
The algorithm considers all 6 possible axis-aligned orientations:
```typescript
[length, height, width]  // Standard orientation
[length, width, height]  // Rotated around X-axis
[width, length, height]  // Rotated around Z-axis
[width, height, length]  // Rotated around Y-axis
[height, length, width]  // Rotated around Y then X
[height, width, length]  // Rotated around X then Z
```

#### Collision Detection
- Uses axis-aligned bounding box (AABB) intersection tests
- Millimeter precision prevents floating-point errors
- Grid-based spatial indexing for O(1) average case performance

#### Support Calculation
For layered arrangements, boxes require minimum 80% support area:
```typescript
supportArea = overlapArea / boxBaseArea
isSupported = supportArea >= 0.8
```

### Performance Characteristics

- **Time Complexity**: O(n log n) average case for most containers
- **Space Complexity**: O(n) where n is the number of placed boxes
- **Typical Performance**: 
  - Small containers (20'): < 100ms
  - Large containers (45'HC): < 2000ms
  - Complex arrangements: < 5000ms

### Advantages

✅ **High Packing Density** - Typically achieves 85-95% space utilization  
✅ **Structural Stability** - Ensures proper support for stacked arrangements  
✅ **Fast Computation** - Optimized for real-time web applications  
✅ **Flexible Orientations** - Considers all possible box rotations  
✅ **Weight Handling** - Respects container weight limits  
✅ **Gap Minimization** - Efficiently fills irregular remaining spaces  

### Use Cases

The Toya Turbo algorithm is particularly effective for:
- **Regular box shapes** with consistent dimensions
- **Mixed orientation scenarios** where boxes can be rotated
- **High-density packing** requirements
- **Real-time applications** needing fast results
- **Visualization purposes** with detailed placement data

### Testing

The algorithm is thoroughly tested with:
- Unit tests for core functions
- Integration tests with real container data
- Performance benchmarks
- Edge case validation

Example test case:
```typescript
// 40'HC container with 79.4×49.1×87cm boxes
expect(result.totalBoxes).toEqual(207);
expect(timeMs).toBeLessThan(5000);
```

This comprehensive approach ensures the Toya Turbo algorithm delivers optimal results for a wide range of container loading scenarios while maintaining excellent performance characteristics.