import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true, // Permite acceso desde otros dispositivos
    port: 5175,
    https: false, // Cambiar a true si necesitas HTTPS
  },
  define: {
    global: 'globalThis',
  },
});
