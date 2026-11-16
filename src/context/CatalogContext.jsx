import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CATEGORIES, OCCASIONS } from '../data/catalog'
import { BRAND_ASSETS } from '../data/site'
import { DEFAULT_CATALOG } from '../data/siteCatalog'

const CatalogContext = createContext(null)

/**
 * Serves the live menu from /api/catalog, falling back to the menu bundled in
 * the build. The storefront therefore renders correctly on the very first paint
 * and keeps working if the API is unavailable — the bakery's edits simply
 * replace the defaults once they load.
 */
export function CatalogProvider({ children, initialCatalog = DEFAULT_CATALOG }) {
  const [products, setProducts] = useState(initialCatalog.products)
  const [settings, setSettings] = useState(initialCatalog.settings)
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog')
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()

      if (Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products)
        setLive(true)
      }
      if (data.settings) setSettings((current) => ({ ...current, ...data.settings }))
    } catch {
      // Static build data is already on screen; nothing to report to the visitor.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  /** Use the supplied monogram by default, including after a custom logo is cleared. */
  useEffect(() => {
    const url = settings?.brand?.logoUrl || BRAND_ASSETS.mark
    const link = document.querySelector("link[rel='icon']") || document.createElement('link')
    link.rel = 'icon'
    // Uploaded files may be PNG, JPEG, WebP or SVG; let the browser detect the type.
    link.removeAttribute('type')
    link.href = url
    if (!link.parentNode) document.head.appendChild(link)
  }, [settings?.brand?.logoUrl])

  const value = useMemo(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]))
    const usedCategories = new Set(products.map((p) => p.category))

    return {
      products,
      settings,
      live,
      loading,
      refresh,
      /** Only categories that actually have something in them. */
      categories: CATEGORIES.filter((c) => usedCategories.has(c.id)),
      occasions: OCCASIONS,
      getProduct: (slug) => bySlug.get(slug) || null,
      productsByCategory: (id) => (id === 'all' ? products : products.filter((p) => p.category === id)),
      productsForOccasion: (id) => products.filter((p) => p.occasions?.includes(id)),
      bestsellers: () => products.filter((p) => p.bestseller),
      contact: settings.contact,
      fulfilment: settings.fulfilment,
      hours: settings.hours,
      gallery: settings.gallery || [],
      brand: settings.brand,
    }
  }, [products, settings, live, loading, refresh])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return context
}
