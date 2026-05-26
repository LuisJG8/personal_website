import { defineConfig } from 'vite'

export default defineConfig({
  // Custom domains are served from the site root.
  base: '/',
  build: {
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    open: true,
  },
})
