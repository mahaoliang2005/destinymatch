import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      // Proxy API requests to backend server during development
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      // Proxy image requests to backend server
      '/images': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
