import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  build: { rollupOptions: { input: {
    portfolio: fileURLToPath(new URL('./index.html', import.meta.url)),
    forma: fileURLToPath(new URL('./forma.html', import.meta.url)),
    grabroy: fileURLToPath(new URL('./grabroy.html', import.meta.url)),
    cryproyDemo: fileURLToPath(new URL('./cryproy-demo.html', import.meta.url)),
    cryproy: fileURLToPath(new URL('./cryproy.html', import.meta.url)),
  } } },
});
