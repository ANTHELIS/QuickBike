import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Socket.io WebSocket proxy (must be first)
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', () => {});
        },
      },
      // API routes proxy
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
