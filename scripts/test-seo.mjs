import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PRODUCTS } from '../src/data/catalog.js'
import { getPageSeo, indexablePaths, SITE_URL } from '../src/lib/seo.js'
import { renderSeoHead } from '../src/lib/seoHtml.js'

const read = file => readFile(`dist/${file}`, 'utf8')
const builtCatalog = JSON.parse((await read('index.html')).match(/<script id="dussa-initial-catalog" type="application\/json">([\s\S]*?)<\/script>/)[1])
const builtOptions = { products: builtCatalog.products, brand: builtCatalog.settings.brand, contact: builtCatalog.settings.contact }
const schema = html => JSON.parse(html.match(/<script id="dussa-seo-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])

test('every public page has a unique title, canonical URL and local description', () => {
  const pages = indexablePaths().map(path => getPageSeo(path))
  assert.equal(new Set(pages.map(p => p.title)).size, pages.length)
  assert.equal(new Set(pages.map(p => p.canonical)).size, pages.length)
  for (const page of pages) {
    assert.match(page.title, /Kigali/)
    assert(page.description.length <= 160)
    assert(!page.noindex)
    assert.match(page.image, /^https:\/\//)
  }
})

test('query strings and trailing slashes consolidate to the public canonical', () => {
  assert.equal(getPageSeo('/creations/?category=cakes&utm_source=test').canonical, `${SITE_URL}/creations`)
  assert.equal(getPageSeo('/?version=seo').canonical, `${SITE_URL}/`)
})

test('private flows and unknown pages never publish indexable product data', () => {
  for (const path of ['/admin', '/order', '/order/confirmed/DBL-PRIVATE', '/track', '/track/DBL-PRIVATE', '/unknown', '/creations/not-a-product']) {
    const page = getPageSeo(path)
    assert(page.noindex, path)
    assert.equal(page.canonical, null)
    assert.equal(page.structuredData, null)
    assert.match(page.robots, /noindex/)
  }
})

test('product schema reflects real size prices and includes no invented reviews or address', () => {
  const p = PRODUCTS[0]
  const graph = getPageSeo(`/creations/${p.slug}`).structuredData['@graph']
  const product = graph.find(x => x['@type'] === 'Product')
  assert.equal(product.offers.lowPrice, Math.min(...p.sizes.map(s => s.price)))
  assert.equal(product.offers.highPrice, Math.max(...p.sizes.map(s => s.price)))
  assert.equal(product.offers.priceCurrency, 'RWF')
  assert(!product.aggregateRating && !product.review)
  const bakery = graph.find(x => x['@type'] === 'Bakery')
  assert.equal(bakery.address.addressLocality, 'Kigali')
  assert(!bakery.address.streetAddress && !bakery.geo)
})

test('merchant-provided names cannot inject HTML through metadata or JSON-LD', () => {
  const product = { ...PRODUCTS[0], name: '</script><script>alert(1)</script>', description: 'A "cake" & a gift' }
  const head = renderSeoHead(getPageSeo(`/creations/${product.slug}`, { product }))
  assert(!head.includes('</script><script>alert(1)'))
  assert.equal(schema(head)['@graph'].find(x => x['@type'] === 'Product').name, product.name)
  assert.match(head, /&lt;\/script&gt;/)
})

test('built public pages contain their own visible content without streaming-JS fallbacks', async () => {
  for (const path of indexablePaths(builtCatalog.products)) {
    const html = await read(path === '/' ? 'index.html' : `${path.slice(1)}.html`)
    const seo = getPageSeo(path, builtOptions)
    assert(html.includes('data-prerendered="true"'), path)
    assert.match(html, /<h1[\s>]/, path)
    assert(!html.includes('<!--$?-->') && !/<div hidden/.test(html), path)
    assert(html.includes(`href="${seo.canonical}"`), path)
    assert.equal(schema(html)['@graph'].find(x => /Page$/.test(x['@type'])).url, seo.url)
    const p = builtCatalog.products.find(p => path.endsWith(`/${p.slug}`))
    if (p) assert(html.includes(p.name) && html.includes(p.description), path)
  }
})

test('sitemap and robots are real files listing only the canonical public pages', async () => {
  const sitemap = await read('sitemap.xml')
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1])
  assert.deepEqual(locations, indexablePaths(builtCatalog.products).map(p => getPageSeo(p, builtOptions).canonical))
  assert.match(sitemap, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/)
  assert.match(await read('robots.txt'), /Sitemap: https:\/\/www.dussabakelab.com\/sitemap.xml/)
  assert(!locations.some(u => /\/(admin|order|track)(\/|$)/.test(u)))
  assert.match(await read('404.html'), /content="noindex, nofollow"/)
  for (const name of ['order', 'track', 'admin']) assert.match(await read(`${name}.html`), /content="noindex, nofollow"/)
})

// Isolate API checks from any database bindings on the developer's machine.
for (const name of ['DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL']) delete process.env[name]
const { default: handler } = await import('../api/page.js')
const { saveProduct, deleteProduct } = await import('../api/_lib/db.js')
async function request(slug, method = 'GET') {
  const result = { status: 200, headers: {}, body: '' }
  const res = {
    setHeader(k,v) { result.headers[k] = v },
    status(code) { result.status = code; return this },
    end(body = '') { result.body = body; return this },
  }
  await handler({ method, query: { slug } }, res)
  return result
}

test('products added after a build get crawlable HTML and correct metadata', async () => {
  const product = { ...PRODUCTS[0], slug: 'seo-new-product', name: 'Passion Fruit Test Cake', active: true }
  await saveProduct(product)
  try {
    const result = await request(product.slug)
    assert.equal(result.status, 200)
    assert.match(result.headers['Content-Type'], /text\/html/)
    assert(result.body.includes(`<h1 class="mt-6 text-4xl text-espresso">${product.name}</h1>`))
    assert.equal(schema(result.body)['@graph'].find(x => x['@type'] === 'Product').name, product.name)
    assert(result.body.includes(`href="${SITE_URL}/creations/${product.slug}"`))
    const head = await request(product.slug, 'HEAD')
    assert.equal(head.status, 200)
    assert.equal(head.body, '')
  } finally { await deleteProduct(product.slug) }
})

test('unknown and hidden products return real 404 responses; writes are rejected', async () => {
  const hidden = { ...PRODUCTS[0], slug: 'seo-hidden-product', name: 'Hidden Test Draft', active: false }
  await saveProduct(hidden)
  try {
    for (const slug of ['not-a-product', hidden.slug, '../bad-slug']) {
      const result = await request(slug)
      assert.equal(result.status, 404)
      assert.match(result.headers['X-Robots-Tag'], /noindex/)
      assert(!result.body.includes(hidden.name))
    }
    assert.equal((await request(PRODUCTS[0].slug, 'POST')).status, 405)
  } finally { await deleteProduct(hidden.slug) }
})
