export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
export const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
export function renderSeoHead(seo) {
  const meta = (attr, key, value) => `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`
  return [
    `<title>${escapeHtml(seo.title)}</title>`, meta('name', 'description', seo.description), meta('name', 'robots', seo.robots),
    ...(seo.canonical ? [`<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`] : []),
    meta('property', 'og:type', 'website'), meta('property', 'og:site_name', 'Dussa BakeLab'),
    meta('property', 'og:title', seo.title), meta('property', 'og:description', seo.description), meta('property', 'og:url', seo.url),
    meta('property', 'og:image', seo.image), meta('property', 'og:image:alt', seo.imageAlt), meta('property', 'og:locale', 'en_RW'),
    meta('name', 'twitter:card', seo.card), meta('name', 'twitter:title', seo.title), meta('name', 'twitter:description', seo.description),
    meta('name', 'twitter:image', seo.image), meta('name', 'twitter:image:alt', seo.imageAlt),
    ...(seo.structuredData ? [`<script id="dussa-seo-data" type="application/ld+json">${safeJson(seo.structuredData)}</script>`] : []),
  ].join('\n    ')
}
export function withSeoHead(html, seo) {
  return html.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, () => `<!-- seo:start -->\n    ${renderSeoHead(seo)}\n    <!-- seo:end -->`)
}
