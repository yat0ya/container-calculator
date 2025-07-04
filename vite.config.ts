import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  if (mode === 'turbo-only') {
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

  return {
    base: './', // 👈 makes asset paths relative
    plugins: [react()],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    build: {
      rollupOptions: {
        output: {
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
