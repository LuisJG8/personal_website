import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const pages = ['index.html', 'experience/index.html', 'talks/index.html', 'projects/index.html', 'blog/index.html']
const layoutFile = new URL('./src/layout.html', import.meta.url)
const contentMarker = '<!-- Page content -->'

export default defineConfig({
  // Custom domains are served from the site root.
  base: '/',
  appType: 'mpa',
  plugins: [
    {
      name: 'portfolio-layout',
      transformIndexHtml: {
        order: 'pre',
        handler(html, { path }) {
          if (!html.includes(contentMarker)) return

          const [metadata, content] = html.split(contentMarker)
          const route = path.replace(/index\.html$/, '')
          return readFileSync(layoutFile, 'utf8')
            .replaceAll(`href="${route}" class="nav-link`, `href="${route}" aria-current="page" class="nav-link`)
            .replace('<!-- Page metadata -->', () => metadata.trim())
            .replace(contentMarker, () => content.trim())
        },
      },
    },
  ],
  build: {
    cssMinify: true,
    rolldownOptions: {
      input: pages.map((page) => resolve(import.meta.dirname, page)),
    },
  },
  server: {
    open: true,
  },
})
