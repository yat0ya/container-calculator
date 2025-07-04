import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'turbo-only') {
    // Special build mode for extracting just the turbo algorithm
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: 'src/algorithms/turbo.ts',
          name: 'TurboAlgorithm',
          fileName: 'turbo-algorithm',
          formats: ['es']
        },
        rollupOptions: {
          external: [],
          output: {
            globals: {}
          }
        },
        outDir: 'dist'
      }
    };
  }

  // Normal build configuration
  return {
    base: "/",
    plugins: [react()],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    build: {
      rollupOptions: {
        output: {
          // Create a separate chunk for the turbo algorithm
          manualChunks: (id) => {
            if (id.includes('src/algorithms/turbo')) {
              return 'turbo-algorithm';
            }
          }
        }
      }
    }
  };
});