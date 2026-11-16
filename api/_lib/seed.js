import { PRODUCTS, MENU_VERSION, RETIRED_SAMPLE_SLUGS } from '../../src/data/catalog.js'
import { BRAND, CONTACT, FULFILMENT, HOURS } from '../../src/data/site.js'
import { getProduct, getSetting, saveProduct, saveSetting } from './db.js'

export const SETTINGS_KEY = 'business'
export const MENU_VERSION_KEY = 'menu-version'

/** The shape the site and the admin settings form both read. */
export function defaultSettings() {
  return {
    brand: {
      name: BRAND.name,
      tagline: BRAND.tagline,
      script: BRAND.script,
      description: BRAND.description,
      city: BRAND.city,
      country: BRAND.country,
      founded: BRAND.founded,
    },
    contact: { ...CONTACT },
    hours: HOURS.map((h) => ({ ...h })),
    fulfilment: {
      leadDays: { ...FULFILMENT.leadDays },
      deliveryFee: FULFILMENT.deliveryFee,
      freeDeliveryOver: FULFILMENT.freeDeliveryOver,
      depositPercent: FULFILMENT.depositPercent,
      deliveryZones: [...FULFILMENT.deliveryZones],
      payments: [...FULFILMENT.payments],
    },
    /** Photos for the "fresh from the oven" strip. Empty means use the drawings. */
    gallery: [],
  }
}

/**
 * Apply the owner-confirmed menu once. Archive the old sample rows, preserve
 * unrelated products, and leave later dashboard edits/deletions intact.
 */
export async function seedIfEmpty() {
  const seeded = { products: 0, archived: 0, settings: false }

  if ((await getSetting(MENU_VERSION_KEY)) !== MENU_VERSION) {
    for (const slug of RETIRED_SAMPLE_SLUGS) {
      const old = await getProduct(slug)
      if (old && old.active !== false) {
        await saveProduct({ ...old, active: false })
        seeded.archived += 1
      }
    }
    for (let i = 0; i < PRODUCTS.length; i += 1) {
      if (!(await getProduct(PRODUCTS[i].slug))) {
        await saveProduct({ ...PRODUCTS[i], position: i * 10, active: true })
        seeded.products += 1
      }
    }
    await saveSetting(MENU_VERSION_KEY, MENU_VERSION)
  }

  if (!(await getSetting(SETTINGS_KEY))) {
    await saveSetting(SETTINGS_KEY, defaultSettings())
    seeded.settings = true
  }

  return seeded
}

/** Restores a single product to the version shipped in the repo. */
export function factoryProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null
}
