import { defineConfig } from 'vite'

export default defineConfig({
  // Custom domains are served from the site root.
  base: '/',
  build: {
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  server: {
    open: true,
  },
})
