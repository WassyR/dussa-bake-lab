import { PRODUCTS } from './catalog.js'
import { BRAND, CONTACT, FULFILMENT, HOURS } from './site.js'

/** The menu and settings bundled with the build, used until the API answers. */
export const DEFAULT_CATALOG = {
  products: PRODUCTS,
  settings: {
    brand: {
      name: BRAND.name,
      tagline: BRAND.tagline,
      script: BRAND.script,
      description: BRAND.description,
      city: BRAND.city,
      country: BRAND.country,
      founded: BRAND.founded,
      logoUrl: BRAND.logoUrl,
      logoHasName: BRAND.logoHasName,
    },
    contact: { ...CONTACT },
    hours: HOURS,
    fulfilment: {
      leadDays: { ...FULFILMENT.leadDays },
      deliveryFee: FULFILMENT.deliveryFee,
      freeDeliveryOver: FULFILMENT.freeDeliveryOver,
      depositPercent: FULFILMENT.depositPercent,
      deliveryZones: [...FULFILMENT.deliveryZones],
      payments: [...FULFILMENT.payments],
    },
    gallery: [],
  },
}
