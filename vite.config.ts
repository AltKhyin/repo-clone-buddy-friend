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
}));
