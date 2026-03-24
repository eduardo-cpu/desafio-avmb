import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',          // expõe fora do container
    proxy: {
      '/api': {
        target: 'http://backend:3000',   // nome do serviço Docker
        changeOrigin: true,
      },
    },
  },
});
