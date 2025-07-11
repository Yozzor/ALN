import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['alnicon.jpg', 'alnlogo.png'],
      manifest: {
        name: 'About Last Night',
        short_name: 'ALN',
        description: 'Wedding photo sharing app',
        theme_color: '#ec4899',
        background_color: '#ffffff',
        icons: [
          {
            src: 'alnicon.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'alnicon.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    https: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
