import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/issues/',
  server: {
    proxy: {
      '/api': 'http://localhost:5050'
    }
  },
  build: {
    outDir: '../backend/static',
    emptyOutDir: true
  }
})
