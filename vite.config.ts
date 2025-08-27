import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  cacheDir: '/tmp/vite-cache',
  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@packages': path.resolve(__dirname, './packages'),
    },
  },
  build: {
    // Enhanced cache busting - Vite already does this well, just ensure it's enabled
    rollupOptions: {
      output: {
        // Use Vite's built-in hash-based cache busting (more reliable)
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js', 
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Generate source maps for better debugging
    sourcemap: mode === 'production' ? false : true,
  },
}));
