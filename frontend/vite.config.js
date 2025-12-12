import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/jin-akanishi-spotify-dashboard/',
  build: {
    outDir: 'dist'
  }
})
