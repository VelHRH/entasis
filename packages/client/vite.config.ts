import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    // The client only ever uses relative URLs; proxying the API and the
    // WebSocket path makes the session cookie first-party in development.
    proxy: {
      '/api': 'http://localhost:3222',
      '/ws': {
        target: 'ws://localhost:3222',
        ws: true,
      },
    },
  },
})
