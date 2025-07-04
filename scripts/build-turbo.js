import { build } from 'vite';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

async function buildTurboAlgorithm() {
  try {
    console.log('🔨 Building turbo algorithm for Node.js...');
    
    // Ensure scripts directory exists
    if (!existsSync('scripts')) {
      mkdirSync('scripts', { recursive: true });
    }
    
    // Build the turbo algorithm as a standalone module
    await build({
      build: {
        lib: {
          entry: 'src/algorithms/turbo.ts',
          name: 'TurboAlgorithm',
          fileName: 'turbo-algorithm',
          formats: ['es']
        },
        outDir: 'scripts/dist',
        rollupOptions: {
          external: [], // Bundle all dependencies
          output: {
            format: 'es'
          }
        }
      }
    });
    
    console.log('✅ Turbo algorithm built successfully');
    
    // Create a simple wrapper for easier import
    const wrapperContent = `
import { turboAlgorithm } from './dist/turbo-algorithm.js';
export { turboAlgorithm };
`;
    
    writeFileSync('scripts/turbo.js', wrapperContent);
    console.log('✅ Created turbo.js wrapper');
    
  } catch (error) {
    console.error('❌ Error building turbo algorithm:', error);
    throw error;
  }
}

buildTurboAlgorithm();