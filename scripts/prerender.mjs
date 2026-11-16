import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import * as http from 'node:http'
import { DEFAULT_CATALOG } from '../src/data/siteCatalog.js'
import { MENU_VERSION } from '../src/data/catalog.js'
import { SITE_URL, absoluteUrl, getPageSeo, indexablePaths } from '../src/lib/seo.js'
import { withSeoHead, escapeHtml, safeJson } from '../src/lib/seoHtml.js'

process.env.NODE_ENV = 'production'
const { render } = await import('../dist-ssr/entry-server.js')
let catalog = DEFAULT_CATALOG
// Public read only. A failed catalogue must not break a production build.
try {
  http.setGlobalProxyFromEnv?.()
  const response = await fetch(`${SITE_URL}/api/catalog`, { signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error('Catalogue unavailable')
  const data = await response.json()
  if (data.menuVersion !== MENU_VERSION || !Array.isArray(data.products) || !data.products.length || !data.settings) throw new Error('Current catalogue unavailable')
  catalog = { products: data.products.filter(p => p.active !== false), settings: data.settings }
  console.log(`Using ${catalog.products.length} products from the public catalogue.`)
} catch {
  console.log('Public catalogue unavailable; using the same checked-in menu as the storefront fallback.')
}
const source = await readFile('dist/index.html', 'utf8')
const template = source.replace('<div id="root"></div>', () => `<div id="root"></div><script id="dussa-initial-catalog" type="application/json">${safeJson(catalog)}</script>`)
const options = { products: catalog.products, brand: catalog.settings.brand, contact: catalog.settings.contact }
// A lightweight shell for checkout/tracking and products added after this build.
await writeFile('dist/app.html', withSeoHead(template, getPageSeo('/app')))
const paths = indexablePaths(catalog.products)
for (const path of [...paths, '/404']) {
  const body = await render(path, catalog)
  const seo = getPageSeo(path, options)
  let html = withSeoHead(template, seo).replace('<div id="root"></div>', () => `<div id="root" data-prerendered="true">${body}</div>`)
  if (path !== '/') html = html.replace(/<link\s+rel="preload"\s+as="image"[\s\S]*?\/>/, '')
  const file = path === '/' ? 'dist/index.html' : join('dist', `${path}.html`)
  await mkdir(file.slice(0, file.lastIndexOf('/')), { recursive: true })
  await writeFile(file, html)
}
for (const path of ['/order', '/track', '/admin']) {
  await writeFile(join('dist', `${path}.html`), withSeoHead(template, getPageSeo(path, options)))
}
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(path => `  <url><loc>${escapeHtml(absoluteUrl(path))}</loc></url>`).join('\n')}\n</urlset>\n`)
console.log(`Pre-rendered ${paths.length} public pages, a 404 page, robots.txt and sitemap.xml.`)
