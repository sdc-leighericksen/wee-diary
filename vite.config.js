import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'favicon.ico'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/appwrite\.nimbuscloud\.au/,
          handler: 'NetworkFirst',
          options: { cacheName: 'appwrite-api', networkTimeoutSeconds: 5 }
        }]
      }
    })
  ],
  server: {
    port: 3000
  }
})
