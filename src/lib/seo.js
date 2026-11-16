import { PRODUCTS, CATEGORIES } from '../data/catalog.js'
import { BRAND, BRAND_ASSETS, CONTACT, CURRENCY } from '../data/site.js'
import { photoFor } from '../data/photography.js'

export const SITE_URL = 'https://www.dussabakelab.com'
export const PUBLIC_PAGES = {
  '/': { title: 'Custom Cakes in Kigali, Rwanda | Dussa BakeLab', name: 'Home', description: 'Order birthday cakes, wedding cakes, cupcakes and cookies from Dussa BakeLab in Kigali, Rwanda. Browse our menu or plan a custom cake.' },
  '/creations': { title: 'Cakes, Cupcakes & Cookies in Kigali | Dussa BakeLab', name: 'Menu', type: 'CollectionPage', description: 'Browse cakes, cupcakes, cookies and sweet treats with sizes and prices. Made to order in Kigali, with delivery and collection options.' },
  '/about': { title: 'About Dussa BakeLab | Cakes Made to Order in Kigali', name: 'Our story', type: 'AboutPage', description: 'Meet Dussa BakeLab, a bakery in Kigali, Rwanda making cakes, cupcakes and treats for birthdays, weddings and everyday celebrations.' },
  '/contact': { title: 'Contact Dussa BakeLab | Cake Orders & Delivery in Kigali', name: 'Contact', type: 'ContactPage', description: 'Ask about cake designs, dates, collection or delivery in Kigali. Call or WhatsApp Dussa BakeLab on 0788 722 064 to discuss your order.' },
}
const PRIVATE_PAGES = { order: 'Place an order', track: 'Track your order', admin: 'Bakery dashboard', app: 'Dussa BakeLab' }
export const absoluteUrl = (path = '/') => new URL(path, SITE_URL).href
export function cleanPath(value = '/') {
  const path = new URL(value, SITE_URL).pathname
  return path === '/' ? '/' : path.replace(/\/+$/, '')
}
function descriptionText(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length <= 160 ? text : `${text.slice(0, 157).replace(/\s+\S*$/, '')}…`
}
export function indexablePaths(products = PRODUCTS) {
  return [...Object.keys(PUBLIC_PAGES), ...products.filter(p => p.active !== false).map(p => `/creations/${p.slug}`)]
}
export function getPageSeo(pathname, options = {}) {
  const path = cleanPath(pathname)
  const products = options.products || PRODUCTS
  const brand = { ...BRAND, ...options.brand }
  const contact = { ...CONTACT, ...options.contact }
  const slug = path.match(/^\/creations\/([^/]+)$/)?.[1]
  const product = Object.hasOwn(options, 'product') ? options.product : products.find(p => p.slug === slug && p.active !== false)
  const page = PUBLIC_PAGES[path]
  const privateName = PRIVATE_PAGES[path.split('/')[1]]
  const indexable = Boolean(page || (slug && product && product.active !== false)) && !options.noindex
  const title = options.title || (product ? `${product.name} in Kigali | Dussa BakeLab` : page?.title || (privateName ? `${privateName} | Dussa BakeLab` : 'Page not found | Dussa BakeLab'))
  const description = descriptionText(options.description || (product ? `Order ${product.name} in Kigali. ${product.description || 'Choose your size and flavour, then arrange collection or delivery.'}` : page?.description || (privateName ? `${privateName} at Dussa BakeLab.` : 'This page could not be found. Browse the Dussa BakeLab menu or contact us in Kigali.')))
  const image = absoluteUrl(options.image || (product ? photoFor({ ...product, seed: product.slug }) : BRAND_ASSETS.logo))
  const url = absoluteUrl(path)
  const bakeryId = `${SITE_URL}/#bakery`
  const graph = []
  if (indexable) {
    graph.push({
      '@type': 'Bakery', '@id': bakeryId, name: brand.name, url: `${SITE_URL}/`, description: brand.description,
      telephone: contact.phoneHref?.replace('tel:', '') || `+${contact.whatsapp}`, email: contact.email,
      logo: absoluteUrl(brand.logoUrl || BRAND_ASSETS.logo), image: absoluteUrl(BRAND_ASSETS.logo),
      address: { '@type': 'PostalAddress', addressLocality: brand.city, addressCountry: 'RW' },
      areaServed: { '@type': 'City', name: 'Kigali' }, currenciesAccepted: CURRENCY.code,
      sameAs: [contact.instagramUrl || `https://www.instagram.com/${contact.instagram}`], servesCuisine: 'Bakery, desserts',
    }, {
      '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: brand.name,
      inLanguage: 'en-RW', publisher: { '@id': bakeryId },
    }, {
      '@type': product ? 'ItemPage' : page?.type || 'WebPage', '@id': `${url}#webpage`, url, name: title, description,
      inLanguage: 'en-RW', isPartOf: { '@id': `${SITE_URL}/#website` }, ...(product ? { mainEntity: { '@id': `${url}#product` } } : {}),
    })
    if (path !== '/') {
      const crumbs = [{ name: 'Home', item: `${SITE_URL}/` }]
      if (product) crumbs.push({ name: 'Menu', item: absoluteUrl('/creations') })
      crumbs.push({ name: product?.name || page.name, item: url })
      graph.push({ '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`, itemListElement: crumbs.map((crumb, i) => ({ '@type': 'ListItem', position: i + 1, ...crumb })) })
    }
    if (product) {
      const prices = product.sizes.map(s => Number(s.price)).filter(Number.isFinite)
      graph.push({
        '@type': 'Product', '@id': `${url}#product`, name: product.name, description: product.description, image: [image], url,
        category: CATEGORIES.find(c => c.id === product.category)?.name || product.category,
        brand: { '@type': 'Brand', name: brand.name },
        ...(prices.length ? { offers: { '@type': 'AggregateOffer', url, priceCurrency: CURRENCY.code,
          lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length, seller: { '@id': bakeryId } } } : {}),
      })
    }
    if (path === '/creations') graph.push({ '@type': 'ItemList', name: 'Dussa BakeLab menu', itemListElement: products.filter(p => p.active !== false).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: absoluteUrl(`/creations/${p.slug}`) })) })
  }
  return { title, description, image, imageAlt: product?.name || brand.name, canonical: indexable ? url : null, url,
    noindex: !indexable, robots: indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow',
    card: product ? 'summary_large_image' : 'summary', structuredData: graph.length ? { '@context': 'https://schema.org', '@graph': graph } : null }
}
