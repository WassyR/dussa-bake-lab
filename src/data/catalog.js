/** Owner-confirmed menu and RWF prices supplied on 16 November 2026. */
export const MENU_VERSION = 'dussa-owner-menu-2026-11-16'

/** Retire the original sample catalogue without deleting its stored records. */
export const RETIRED_SAMPLE_SLUGS = [
  'signature-chocolate-drip', 'velvet-celebration-cake', 'ivory-tier-cake',
  'passion-citrus-cake', 'midnight-slice-box', 'classic-cupcake-box',
  'chocolate-hazelnut-cupcakes', 'garden-party-cupcakes',
  'brown-butter-chocolate-chip', 'iced-sugar-cookies', 'fudge-brownie-slab',
  'macaron-collection', 'glazed-doughnuts', 'baked-cheesecake',
  'bespoke-design-cake', 'corporate-dessert-table',
]

export const CATEGORIES = [
  { id: 'cakes', name: 'Birthday cakes', blurb: 'for your celebration',
    description: 'Birthday cakes start from RWF 15,000. The final price depends on the size and design.',
    art: 'celebrationCake', flavorArt: 'vanilla' },
  { id: 'cupcakes', name: 'Cupcakes', blurb: 'classic or decorated',
    description: 'Classic cupcakes at RWF 500 each, or decorated cupcakes at RWF 1,500 each.',
    art: 'cupcake', flavorArt: 'vanilla' },
  { id: 'cookies', name: 'Cookies', blurb: 'a little treat',
    description: 'One cookie for RWF 300, or a pack of four for RWF 1,000.',
    art: 'cookieStack', flavorArt: 'caramel' },
  { id: 'treats', name: 'Cake loaflets', blurb: 'your own little cake',
    description: 'Individual cake loaflets at RWF 2,500 each. Choose how many you would like.',
    art: 'cakeSlice', flavorArt: 'vanilla' },
  { id: 'custom', name: 'Wedding cakes', blurb: 'made for your day',
    description: 'Custom wedding cakes planned around your celebration. Contact us to discuss the design and price.',
    art: 'tieredCake', flavorArt: 'ivory' },
]

const NO_EXTRAS = { flavors: [], frostings: [], addons: [], allowsMessage: false }

export const PRODUCTS = [
  {
    ...NO_EXTRAS, slug: 'cookies', name: 'Cookies', category: 'cookies',
    tagline: 'One for you, or four to share',
    description: 'Cookies at RWF 300 each, or RWF 1,000 for a pack of four.',
    art: 'cookieStack', flavorArt: 'caramel', bestseller: true, leadDays: 2,
    tags: ['Single pieces', 'Pack of 4'],
    occasions: ['birthday', 'thanks', 'justbecause', 'corporate'],
    sizes: [
      { id: 'single', label: '1 piece', serves: '1 cookie', price: 300 },
      { id: 'pack-4', label: '4 pieces', serves: '4 cookies', price: 1000 },
    ],
  },
  {
    ...NO_EXTRAS, slug: 'classic-cupcakes', name: 'Classic Cupcakes', category: 'cupcakes',
    tagline: 'A little cake for any day',
    description: 'Classic cupcakes at RWF 500 each. Order a few for yourself or enough to share.',
    art: 'cupcake', flavorArt: 'vanilla', bestseller: true, leadDays: 2,
    tags: ['Classic', 'Per piece'],
    occasions: ['birthday', 'thanks', 'justbecause', 'corporate', 'baby'],
    sizes: [{ id: 'single', label: '1 piece', serves: '1 cupcake', price: 500 }],
  },
  {
    ...NO_EXTRAS, slug: 'decorated-cupcakes', name: 'Decorated Cupcakes', category: 'cupcakes',
    tagline: 'Something special for the occasion',
    description: 'Decorated cupcakes at RWF 1,500 each. Contact us about the decoration you have in mind before ordering.',
    art: 'cupcake', flavorArt: 'strawberry', bestseller: true, leadDays: 2,
    tags: ['Decorated', 'Per piece'],
    occasions: ['birthday', 'wedding', 'baby', 'graduation', 'anniversary', 'corporate'],
    sizes: [{ id: 'single', label: '1 piece', serves: '1 cupcake', price: 1500 }],
  },
  {
    ...NO_EXTRAS, slug: 'cake-loaflets', name: 'Cake Loaflets', category: 'treats',
    tagline: 'A little cake of your own',
    description: 'Individual cake loaflets at RWF 2,500 each. Order one or choose a quantity to share.',
    art: 'cakeSlice', flavorArt: 'vanilla', bestseller: true, leadDays: 2,
    tags: ['Individual cakes', 'Per piece'],
    occasions: ['thanks', 'justbecause', 'corporate', 'birthday'],
    sizes: [{ id: 'single', label: '1 piece', serves: '1 loaflet', price: 2500 }],
  },
  {
    ...NO_EXTRAS, slug: 'birthday-cake', name: 'Birthday Cake', category: 'cakes',
    tagline: 'Made for their special day',
    description: 'Birthday cakes start from RWF 15,000. The final price depends on your chosen size and design. Tell us your date and ideas for a quote.',
    pricing: 'quote', startingPrice: 15000,
    art: 'celebrationCake', flavorArt: 'vanilla', bestseller: true, leadDays: 0,
    tags: ['Birthday', 'Size and design to discuss'],
    occasions: ['birthday', 'graduation', 'baby', 'anniversary'],
    sizes: [], customBrief: true, allowsMessage: true,
  },
  {
    ...NO_EXTRAS, slug: 'wedding-cake', name: 'Custom Wedding Cake', category: 'custom',
    tagline: 'A cake for your wedding day',
    description: 'A custom wedding cake planned with you. Share your date, guest count and design ideas so we can discuss the details and prepare a quote.',
    pricing: 'quote',
    art: 'tieredCake', flavorArt: 'ivory', bestseller: true, leadDays: 0,
    tags: ['Wedding', 'Custom design'], occasions: ['wedding', 'anniversary'],
    sizes: [], customBrief: true,
  },
]

export const OCCASIONS = [
  { id: 'birthday', label: 'Birthday', note: 'A birthday cake or decorated cupcakes for the celebration.', art: 'celebrationCake', flavorArt: 'vanilla' },
  { id: 'wedding', label: 'Wedding', note: 'Tell us your date, guest count and cake ideas.', art: 'tieredCake', flavorArt: 'ivory' },
  { id: 'baby', label: 'Baby shower', note: 'Cupcakes or a cake to share with friends and family.', art: 'cupcake', flavorArt: 'strawberry' },
  { id: 'graduation', label: 'Graduation', note: 'Celebrate the achievement with cake or cupcakes.', art: 'celebrationCake', flavorArt: 'vanilla' },
  { id: 'corporate', label: 'At work', note: 'Cookies, cupcakes and loaflets for your team.', art: 'cupcake', flavorArt: 'coffee' },
  { id: 'anniversary', label: 'Anniversary', note: 'A cake or cupcakes to mark the occasion.', art: 'celebrationCake', flavorArt: 'vanilla' },
  { id: 'thanks', label: 'Thank you', note: 'Share a few cookies, cupcakes or cake loaflets.', art: 'cookieStack', flavorArt: 'caramel' },
  { id: 'justbecause', label: 'Just because', note: 'Something sweet, whenever you feel like it.', art: 'cupcake', flavorArt: 'vanilla' },
]

export const isQuoteProduct = product => product?.pricing === 'quote'
export const getProduct = slug => PRODUCTS.find(p => p.slug === slug)
export const getCategory = id => CATEGORIES.find(c => c.id === id)
export const productsByCategory = id => id === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === id)
export const productsForOccasion = id => PRODUCTS.filter(p => p.occasions?.includes(id))
export const bestsellers = () => PRODUCTS.filter(p => p.bestseller)

/** A quote's starting price is informational, never a checkout total. */
export function fromPrice(product) {
  if (isQuoteProduct(product)) return Number(product.startingPrice) > 0 ? Number(product.startingPrice) : null
  const prices = (product.sizes || []).map(s => Number(s.price)).filter(p => Number.isFinite(p) && p > 0)
  return prices.length ? Math.min(...prices) : null
}

export function priceRange() {
  const prices = PRODUCTS.flatMap(p => isQuoteProduct(p) ? [fromPrice(p)] : p.sizes.map(s => s.price)).filter(p => p !== null)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

export function computeLinePrice({ product, sizeId, flavorId, frostingId, addonIds = [], quantity = 1 }) {
  if (!product || isQuoteProduct(product)) return 0
  const size = product.sizes.find(s => s.id === sizeId) || product.sizes[0]
  const flavor = product.flavors?.find(f => f.id === flavorId)
  const frosting = product.frostings?.find(f => f.id === frostingId)
  const addons = (product.addons || []).filter(a => addonIds.includes(a.id))
  const unit = (size?.price || 0) + (flavor?.delta || 0) + (frosting?.delta || 0) + addons.reduce((sum, a) => sum + a.price, 0)
  return unit * Math.max(1, Number(quantity) || 1)
}
