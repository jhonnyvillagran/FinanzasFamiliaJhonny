import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // IMPORTANTE: Esto permite que funcione en subcarpetas de GitHub Pages
  // Eliminado 'define' manual para process.env para usar el sistema nativo de Vite (import.meta.env)
});