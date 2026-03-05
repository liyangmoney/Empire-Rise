import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 13001,
    host: true,
    allowedHosts: ['myjghy.myds.me', 'localhost']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
