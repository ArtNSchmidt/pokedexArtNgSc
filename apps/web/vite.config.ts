import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Porta do BFF (apps/api). O proxy evita CORS em desenvolvimento: o browser só fala com o Vite. */
const API_ORIGIN = 'http://localhost:3333';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_ORIGIN, changeOrigin: true },
    },
  },
});
