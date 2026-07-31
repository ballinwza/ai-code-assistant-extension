import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-webview',
    rollupOptions: {
      input: path.resolve(import.meta.dirname, 'src/webview/index.html'),
      output: {
        entryFileNames: 'sidebar.js',
        assetFileNames: 'sidebar.[ext]'
      }
    },
    chunkSizeWarningLimit: 2000
  },
});