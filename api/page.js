import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getProduct } from './_lib/db.js'
import { seedIfEmpty } from './_lib/seed.js'
import { getPageSeo } from '../src/lib/seo.js'
import { escapeHtml, withSeoHead } from '../src/lib/seoHtml.js'

/** Crawlable responses for menu items created in the dashboard after a build. */
export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).end()
  }
  const template = await readFile(join(process.cwd(), 'dist/app.html'), 'utf8')
  const snapshot = JSON.parse(template.match(/<script id="dussa-initial-catalog" type="application\/json">([\s\S]*?)<\/script>/)[1])
  const slug = String(req.query?.slug || '')
  let product = null
  let status = 404
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 160) {
    try {
      await seedIfEmpty()
      product = await getProduct(slug)
      if (product?.active === false) product = null
      if (product) status = 200
    } catch {
      product = snapshot.products.find(p => p.slug === slug && p.active !== false) || null
      status = product ? 200 : 503
    }
  }
  const seo = getPageSeo(`/creations/${slug}`, { product, brand: snapshot.settings.brand, contact: snapshot.settings.contact,
    ...(status === 503 ? { title: 'Menu temporarily unavailable | Dussa BakeLab', description: 'Please try again shortly or contact Dussa BakeLab in Kigali about your order.' } : {}) })
  const e = escapeHtml
  const body = product ? `<main class="container-x bg-cream py-32">
    <nav aria-label="Breadcrumb"><a href="/">Dussa BakeLab</a> · <a href="/creations">Menu</a></nav>
    <h1 class="mt-6 text-4xl text-espresso">${e(product.name)}</h1>
    <p class="mt-5 text-cocoa">${e(product.description)}</p>
    <p class="mt-4">Made to order in Kigali, Rwanda.</p>
    <ul class="mt-6">${product.sizes.map(size => `<li>${e(size.label)} — RWF ${e(Number(size.price).toLocaleString('en-US'))}</li>`).join('')}</ul>
    <p class="mt-6"><a href="/contact">Ask about this order</a> · <a href="/creations">Browse the menu</a></p>
  </main>` : `<main class="container-x py-32"><h1>${status === 503 ? 'The menu is temporarily unavailable' : 'Product not found'}</h1><p><a href="/creations">Browse our menu</a> or <a href="/contact">contact us</a>.</p></main>`
  const html = withSeoHead(template, seo).replace('<div id="root"></div>', () => `<div id="root">${body}</div>`)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('X-Robots-Tag', seo.robots)
  res.setHeader('Cache-Control', 'no-store')
  if (status === 503) res.setHeader('Retry-After', '60')
  return res.status(status).end(req.method === 'HEAD' ? '' : html)
}
