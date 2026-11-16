import test from 'node:test'
import assert from 'node:assert/strict'
import { PRODUCTS, MENU_VERSION, RETIRED_SAMPLE_SLUGS, fromPrice, computeLinePrice, isQuoteProduct } from '../src/data/catalog.js'
import { getPageSeo } from '../src/lib/seo.js'
import { sanitiseProduct } from '../api/_lib/product.js'

// These tests must never connect to a live merchant database.
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL']) delete process.env[key]
const { saveProduct, getProduct, listProducts, deleteProduct, getSetting } = await import('../api/_lib/db.js')
const { seedIfEmpty, MENU_VERSION_KEY } = await import('../api/_lib/seed.js')
const { default: catalogue } = await import('../api/catalog.js')

const product = slug => PRODUCTS.find(p => p.slug === slug)

test('the catalogue contains exactly the six owner-confirmed offerings', () => {
  assert.deepEqual(PRODUCTS.map(p => p.slug), ['cookies', 'classic-cupcakes', 'decorated-cupcakes', 'cake-loaflets', 'birthday-cake', 'wedding-cake'])
  for (const p of PRODUCTS) {
    assert(!RETIRED_SAMPLE_SLUGS.includes(p.slug))
    assert.deepEqual(p.flavors, [])
    assert.deepEqual(p.frostings, [])
    assert.deepEqual(p.addons, [])
  }
})

test('single cookies and four-piece packs retain their distinct confirmed prices', () => {
  const cookies = product('cookies')
  assert.equal(computeLinePrice({ product: cookies, sizeId: 'single' }), 300)
  assert.equal(computeLinePrice({ product: cookies, sizeId: 'pack-4' }), 1000)
  assert.equal(computeLinePrice({ product: cookies, sizeId: 'pack-4', quantity: 3 }), 3000)
})

test('cupcakes and loaflets charge per piece with no invented box discounts', () => {
  for (const [slug, price] of [['classic-cupcakes', 500], ['decorated-cupcakes', 1500], ['cake-loaflets', 2500]]) {
    assert.equal(fromPrice(product(slug)), price)
    assert.equal(computeLinePrice({ product: product(slug), quantity: 6 }), price * 6)
  }
})

test('a birthday starting price and an unpriced wedding cake cannot become fixed checkout prices', () => {
  assert.equal(fromPrice(product('birthday-cake')), 15000)
  assert.equal(fromPrice(product('wedding-cake')), null)
  for (const slug of ['birthday-cake', 'wedding-cake']) {
    const p = product(slug)
    assert(isQuoteProduct(p))
    assert.equal(computeLinePrice({ product: p, quantity: 2 }), 0)
    assert.deepEqual(p.sizes, [])
    const schema = getPageSeo(`/creations/${slug}`).structuredData['@graph'].find(p => p['@type'] === 'Product')
    assert(!schema.offers, 'A custom quote must not advertise a guaranteed purchasable price')
  }
})

test('the dashboard API can round-trip a quote without manufacturing a zero-price size', () => {
  for (const slug of ['birthday-cake', 'wedding-cake']) {
    const result = sanitiseProduct(product(slug))
    assert(!result.error)
    assert.equal(result.product.pricing, 'quote')
    assert.equal(fromPrice(result.product), fromPrice(product(slug)))
    assert.deepEqual(result.product.sizes, [])
    assert.equal(result.product.leadDays, 0)
  }
  assert(sanitiseProduct({ name: 'Missing fixed price', sizes: [] }).error)
})

test('the menu upgrade archives sample rows and preserves independent products and later edits', async () => {
  const old = { ...product('cookies'), slug: RETIRED_SAMPLE_SLUGS[0], name: 'Original sample', active: true }
  const independent = { ...product('cookies'), slug: 'owner-added-special', name: 'Owner added special', active: true }
  await saveProduct(old)
  await saveProduct(independent)
  const result = await seedIfEmpty()
  assert.equal(result.archived, 1)
  assert.equal(result.products, 6)
  assert.equal((await getProduct(old.slug)).active, false)
  assert.equal((await getProduct(independent.slug)).active, true)
  assert.equal(await getSetting(MENU_VERSION_KEY), MENU_VERSION)
  const edited = { ...product('cookies'), sizes: [{ id: 'single', label: '1 piece', price: 350 }] }
  await saveProduct(edited)
  await deleteProduct('classic-cupcakes')
  await seedIfEmpty()
  assert.equal((await getProduct('cookies')).sizes[0].price, 350)
  assert.equal(await getProduct('classic-cupcakes'), null)
  assert(!(await listProducts()).some(p => p.slug === old.slug))
  await saveProduct(product('cookies'))
  await saveProduct(product('classic-cupcakes'))
})

test('the public API identifies the menu version and hides archived sample products', async () => {
  let body
  const res = { setHeader() {}, status(code) { assert.equal(code, 200); return this }, send(text) { body = JSON.parse(text); return this } }
  await catalogue({ method: 'GET', headers: {} }, res)
  assert.equal(body.menuVersion, MENU_VERSION)
  assert(!body.products.some(p => RETIRED_SAMPLE_SLUGS.includes(p.slug)))
})
