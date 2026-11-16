import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync, createReadStream } from 'node:fs'
import { resolve } from 'node:path'

// Preview the same static pages, dynamic products and private SPA routes
// that Vercel serves; never hydrate a tracking URL with the homepage HTML.
function previewRouting() {
  return {
    name: 'preview-page-routing',
    configurePreviewServer(server) {
      const directory = resolve(server.config.root, server.config.build.outDir)
      server.middlewares.use((req, res, next) => {
        const path = new URL(req.url, 'http://localhost').pathname
        if (path === '/' || path.includes('.') || path.startsWith('/api/') || path.startsWith('/assets/')) return next()
        const file = resolve(directory, `.${path}.html`)
        if (file.startsWith(`${directory}/`) && existsSync(file)) return next()
        const product = path.match(/^\/creations\/([^/]+)$/)
        if (product) req.url = `/api/page?slug=${encodeURIComponent(product[1])}`
        else if (/^\/(order\/confirmed|track)\/[^/]+$/.test(path)) req.url = '/app'
        else {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
          createReadStream(resolve(directory, '404.html')).pipe(res)
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), previewRouting()],
  server: {
    port: 5173,
    proxy: {
      // Lets `vercel dev` API routes work when they run on :3000.
      // Harmless when nothing is listening — the app falls back to local storage.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
