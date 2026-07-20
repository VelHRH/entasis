import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // The @/ alias for the client source root (ADR-0003); mirrored in
  // tsconfig.app.json for the type checker.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
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
