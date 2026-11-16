# Search visibility for Dussa BakeLab

The canonical site is https://www.dussabakelab.com. The site targets made-to-order cakes, birthday and wedding cakes, cupcakes, cookies and treats in Kigali, Rwanda. Rankings depend on competition, relevance, reputation and Google's indexing; technical audit scores do not guarantee a position.

## What the build publishes

- Readable HTML for the home, menu, story, contact and public product pages, before JavaScript runs.
- Unique local titles/descriptions, canonical links, absolute social images, and Bakery, WebSite, Product, ItemList and BreadcrumbList JSON-LD as appropriate.
- A real `/robots.txt`, `/sitemap.xml` and 404 page. Checkout, confirmation, tracking and admin pages carry `noindex` directives.
- A public catalogue snapshot, used by both server rendering and client hydration. The build reads the public `/api/catalog` endpoint. If it is unavailable, it uses the same checked-in menu the app uses as its fallback and logs that decision. It never reads customer orders or dashboard credentials.
- Products created after a build remain accessible through the public page handler with server-visible product content, metadata and status codes. Hidden and missing products return 404. Redeploy after menu/brand changes to refresh the static pages and sitemap. If the catalogue is unavailable during a build, restore its connection before expecting dashboard edits to appear in the generated snapshot.

`src/lib/seo.js` is the shared metadata and schema source. Business defaults live in `src/data/site.js`; product defaults live in `src/data/catalog.js`. Only the confirmed city/country is included in the business address. Add a public street address, map location or business-profile URL only after the owner confirms it.

## Owner actions after deployment

1. Verify the domain in [Google Search Console](https://search.google.com/search-console), preferably with the DNS TXT record Google supplies. Submit `https://www.dussabakelab.com/sitemap.xml`. Inspect the homepage, menu and a product URL, then request indexing. Do the same in [Bing Webmaster Tools](https://www.bing.com/webmasters/).
2. Create or claim the [Google Business Profile](https://www.google.com/business/) for Dussa BakeLab. Use the correct bakery category, phone, website, collection/service-area details and opening hours. If the kitchen does not accept walk-in customers, use the profile settings appropriate to the actual business rather than publishing an unconfirmed address.
3. Add photographs of actual Dussa cakes and accurate product details through the dashboard. Ask customers for honest reviews on the verified profile and keep the menu, contact details and opening hours current across the site and profile.
4. Use Search Console to track indexed pages, impressions, clicks and search terms over the following weeks. Improve pages based on actual customer searches and orders. Publishing code does not submit the site to Search Console or create/verify a business profile.

## Validation

```sh
npm ci
npm run build
npm run test:seo
npm run lint
npm run dev:api
# In another terminal:
npm run preview -- --host 0.0.0.0 --strictPort
BASE_URL=http://127.0.0.1:4173 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
BASE_URL=http://127.0.0.1:4173 CHROMIUM_PATH=/usr/bin/chromium npm run test:admin
BASE_URL=http://127.0.0.1:4173 CHROMIUM_PATH=/usr/bin/chromium npm run test:film
```

The browser suites use the existing Playwright setup. Run dashboard fixtures only against a local, in-memory API; they edit menu data. Restart that API after validation. No live customer records are needed for SEO tests.
