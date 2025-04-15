import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      input: 'index.html', // Ensure this matches the location of your index.html
      output: {
        dir: 'dist',
        entryFileNames: 'assets/main.js',
      },
    },
    optimizeDeps: {
      include: ["@thatopen/components", "three", "web-ifc"],
    },
  },
});
