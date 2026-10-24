# Shopify plan for Timkolas

What I can and cannot do from here: I have no Shopify store, no API access token and no payment gateway account in this environment, so I cannot create the store or take payments. This repo can hold the theme files, product import CSV and automation scripts. The owner creates the store and gives access.

## Owner setup steps (about 1 hour)

1. Create a Shopify store (Basic plan is enough to start). Settings > Store details: add the legal business name and address.
2. Settings > Payments: activate Shopify Payments if eligible in India, otherwise add Razorpay or Cashfree from the app store. Complete KYC. Enable UPI, cards, net banking, wallets only as the provider allows.
3. Settings > Shipping and delivery: set rates or free shipping threshold. Add a courier app (Shiprocket) if wanted.
4. Settings > Policies: paste the returns, shipping, privacy and terms text once the owner approves it. Do not publish invented policies.
5. Settings > Apps > Develop apps: create a custom app with read/write scope for products, orders, customers. Share the Admin API token via a secret store, never in the repo.
6. Create the theme: start from the free Dawn theme and replace sections with the design in the canvas.

## How each requirement maps to Shopify

| Requirement | Approach |
|---|---|
| Catalog, variants, inventory | Native Shopify products and inventory |
| Cart, checkout, guest checkout | Native checkout |
| Payments and webhooks | Gateway app, server-verified, no card data on our side |
| COD | Native manual payment method, tagged COD, owner decision |
| Order records and statuses | Shopify Orders plus fulfilment status and tags. Admin search, filters and CSV export are built in |
| Google Sheet "Timkolas Order Management Dashboard" | Shopify Flow or a small webhook worker writing to Google Sheets. Idempotent on order ID so retries never duplicate. Failures retried and logged |
| Product reviews with Verified Purchase | Use a reviews app that supports verified buyers and moderation (for example Judge.me or Shopify's own Product Reviews if available). Avoids building and securing a custom system |
| Analytics | Shopify customer events, Meta pixel and Google channel apps, consent banner |
| SEO | Native sitemap, robots, canonicals. Add Product JSON-LD in theme from real data only |

## Build order

1. Confirm product data (see docs/research).
2. Product import CSV with placeholders marked DRAFT (not published).
3. Theme sections: header, hero, collections, product page, compare page, FAQ.
4. Policies and support pages with owner-approved text.
5. Payments in test mode, then test orders.
6. Sheet sync, reviews app, analytics, launch checklist.
