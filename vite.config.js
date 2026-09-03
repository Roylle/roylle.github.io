import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  build: { rollupOptions: { input: {
    portfolio: fileURLToPath(new URL('./index.html', import.meta.url)),
    forma: fileURLToPath(new URL('./forma.html', import.meta.url)),
  } } },
});
