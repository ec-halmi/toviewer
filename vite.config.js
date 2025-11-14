// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig( {
  server: {
    port: 3322,
  },
  base: '/viewer/', // This base URL will apply to both dev and build

  optimizeDeps: { // <-- Moved to top level
    include: [ '@thatopen/components', 'three', 'web-ifc' ],
  },

  build: { // This section is ONLY used when running 'npm run build'
    minify: false,
    // sourcemap: true, 
    outDir: 'dist', // Default directory for build output
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'assets/main.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks: ( id ) =>
        {
          if ( id.includes( '@thatopen/components' ) )
          {
            return 'components';
          }
          if ( id.includes( 'fileLoader' ) )
          {
            return 'fileLoader';
          }
          if ( id.includes( 'three' ) )
          {
            return 'three';
          }
          if ( id.includes( 'web-ifc' ) )
          {
            return 'webifc';
          }
          if ( id.includes( 'node_modules' ) )
          {
            return 'vendor';
          }
        },
      },
    },
  },
} );
