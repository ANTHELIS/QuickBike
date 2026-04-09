import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy Socket.io FIRST (order matters for ws upgrade)
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
        // Suppress noisy proxy errors in console
        configure: (proxy) => {
          proxy.on('error', () => {});
        },
      },
      // Proxy API requests to backend
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/captains': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/maps': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/rides': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
