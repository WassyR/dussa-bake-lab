import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { getPageSeo } from './seo'
import { safeJson } from './seoHtml'
function meta(attr, key, value) {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attr, key); document.head.appendChild(tag) }
  tag.content = value
}
/** Metadata stays consistent between pre-rendered HTML and client navigation. */
export default function usePageMeta({ title, description, product, image, noindex, unresolved } = {}) {
  const { pathname } = useLocation()
  const { products, brand, contact } = useCatalog()
  const seo = useMemo(() => getPageSeo(pathname, { title, description, image, noindex, products, brand, contact,
    ...(product !== undefined ? { product } : {}) }), [pathname, title, description, product, image, noindex, products, brand, contact])
  useEffect(() => {
    if (unresolved) return
    document.title = seo.title
    for (const [key, value] of Object.entries({ description: seo.description, robots: seo.robots, 'twitter:card': seo.card,
      'twitter:title': seo.title, 'twitter:description': seo.description, 'twitter:image': seo.image, 'twitter:image:alt': seo.imageAlt })) meta('name', key, value)
    for (const [key, value] of Object.entries({ 'og:title': seo.title, 'og:description': seo.description, 'og:url': seo.url,
      'og:type': 'website', 'og:image': seo.image, 'og:image:alt': seo.imageAlt })) meta('property', key, value)
    let canonical = document.querySelector('link[rel="canonical"]')
    if (seo.canonical) {
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
      canonical.href = seo.canonical
    } else canonical?.remove()
    let data = document.getElementById('dussa-seo-data')
    if (seo.structuredData) {
      if (!data) { data = document.createElement('script'); data.id = 'dussa-seo-data'; data.type = 'application/ld+json'; document.head.appendChild(data) }
      data.textContent = safeJson(seo.structuredData)
    } else data?.remove()
  }, [seo, unresolved])
}
