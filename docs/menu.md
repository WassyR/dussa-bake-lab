# Owner-confirmed menu

The owner supplied these prices in chat on 16 November 2026. All amounts are Rwandan francs.

| Product | Confirmed price |
| --- | --- |
| Cookies | 1 piece: RWF 300; 4 pieces: RWF 1,000 |
| Classic cupcakes | RWF 500 per piece |
| Decorated cupcakes | RWF 1,500 per piece |
| Cake loaflets | RWF 2,500 per piece, in vanilla or marble |
| Birthday cake | Starts from RWF 15,000; varies with size and design |
| Custom wedding cake | Quote required; no price supplied |

The four fixed-price products use the basket. Cookie quantities count the selected single or four-piece pack. Birthday and wedding cakes use a WhatsApp enquiry with the date, guest count and design ideas; a starting price is never charged as a final cake price.

The owner subsequently confirmed vanilla and marble for cake loaflets: soft cakes baked in a small loaf shape. Both flavours use the same RWF 2,500 per-piece price. Other specific flavours, fillings, finishes, paid extras, cake weights, diameters, servings and dietary variants remain unconfirmed. The existing standard-order scheduling policy remains in place for fixed-price products; custom cake dates are confirmed with the bakery.

The versioned loaflet update changes only that product’s tagline, description, size row and flavours. It moves the flavour names out of the incorrectly entered size/serving rows, removes the zero-priced Marble row, and preserves its photo, visibility and other settings. It runs once and does not reset later dashboard edits. A separate content-version field prevents an older live snapshot from masking the update during deployment.

`src/data/catalog.js` is the default menu. On the first successful database connection for this menu version, `seedIfEmpty` archives the 16 old sample product records by setting `active: false`, adds missing confirmed products, and records the version. It preserves unrelated products and later dashboard edits, hides and deletions. Archived rows are retained in the dashboard, not deleted. It does not change customer orders or business settings.

The storefront and build use the bundled confirmed menu if the public catalogue is unavailable. Dashboard changes are stored in Postgres when its connection is healthy.

Photos without an owner upload are labelled examples. The previous wedding image showed an interior and has been replaced with a visually checked cake example. A loaflet photo is left as “Photograph coming soon” until the bakery supplies one. Category cards prefer uploaded product photos.

Validation: `npm run build`, `npm run test:menu`, `npm run test:seo`, `npm run test:api`, and the local browser suites documented in `seo.md`.
