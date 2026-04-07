import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  // GitHub Pages serves project sites from /<repo-name>/ in production.
  base: command === 'build' ? '/personal_website/' : '/',
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
}))
