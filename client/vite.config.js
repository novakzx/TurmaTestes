import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Turma+ — Estudantes de Portugal',
        short_name: 'Turma+',
        description:
          'Feed, calendário oficial (feriados e greves), mensagens de turma e apoio ao estudo gratuito — feito para estudantes em Portugal.',
        lang: 'pt-PT',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#16A34A',
        background_color: '#F6F7F9',
        categories: ['education', 'social'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Calendário', url: '/calendario', description: 'Feriados, férias e greves' },
          { name: 'Apoio', url: '/apoio', description: 'Fichas de estudo e ferramentas' },
          { name: 'Mensagens', url: '/mensagens', description: 'Conversas e grupos' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
