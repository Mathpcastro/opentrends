import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Em produção, a Vercel serve automaticamente as funções em /api
        // Em dev, você pode usar 'vercel dev' ou configurar um proxy manual
      },
    },
  },
})
