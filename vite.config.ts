import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages usa subcarpetas (tu-usuario.github.io/repo/)
  // Usar './' permite que el juego funcione en cualquier ruta.
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
