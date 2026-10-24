# Tracking, ads readiness and SEO

## Tracking (use Shopify's built-in tools, not custom scripts)

The theme loads no third-party tracking code. This avoids duplicate events and keeps privacy consent in one place.

| Need | How |
|---|---|
| Meta pixel and Conversions API | Install the "Facebook & Instagram" sales channel. It sends ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase through Shopify's customer events and server-side, with deduplication |
| Google Analytics 4 and Google Ads | Install the "Google & YouTube" channel. It sends view_item, add_to_cart, begin_checkout, purchase |
| Merchant Center feed | The same Google channel syncs products. Needs identifiers (GTIN or "no identifier"), brand, price, availability and policy pages |
| Consent | Settings > Customer privacy: enable the cookie banner for regions that need it. Pixels respect it |
| Search events | Meta/Google channels do not cover on-site search; add later via Shopify Customer Events if wanted |

**Verify before trusting it** (not done yet): use Meta Events Manager "Test Events" and GA4 DebugView, place a test order, and confirm one Purchase event with the right order value and no duplicate. Do not claim tracking works until this is checked.

Campaign URLs: link ads straight to the product or collection with UTM parameters, for example `/products/timkolas-j36s-handheld?utm_source=meta&utm_medium=paid&utm_campaign=handheld_oct`. A handheld ad must land on the handheld product or collection, never the homepage.

## SEO built into the theme

- Unique `<title>` and meta description from product/collection/page SEO fields (fill them in admin)
- Canonical URL on every page, Open Graph tags, a "noindex" switch in theme settings
- Product structured data (name, image, sku, brand, price, currency, availability) from visible data only
- BreadcrumbList structured data on product pages, FAQPage on pages with a FAQ section
- Breadcrumbs, semantic headings, image alt text from each image's alt field (fill them in)
- Shopify generates `sitemap.xml` and `robots.txt` automatically

**Deliberately absent:** `aggregateRating`/`Review` markup. The reviews app adds its own only when real reviews exist, so we never publish fake ratings.

## Content rules to keep

- No game titles, logos or box art. No "PS5/PSP/Switch compatible" claims. Say "retro games" and list supported systems only once verified.
- Say "HDMI output up to 4K" only if confirmed, and never "4K gaming".
- One honest selling price. Use Compare-at price only when you can document that it was a real previous price.
- No fake scarcity ("only few left") or countdowns.
