# Timkolas on Shopify: setup and handover

Status legend: BUILT = code exists in this repo. TESTED = actually run. NEEDS YOU = requires your account or data.

## 1. What is in the repo

| Path | What it is | Status |
|---|---|---|
| `shopify-theme/` | Custom Shopify theme (Online Store 2.0): home, collection with filters and sort, product page, compare page, buying guide, cart, contact/damage report, FAQ, search, 404 | BUILT. Not run on a real store yet, because no store or Shopify CLI is available here. JSON and JS syntax checked only |
| `shopify-data/products_draft.csv` | 6 draft products ready to import | BUILT. Prices are placeholders, products are DRAFT |
| `order-sheet/worker/` | Cloudflare Worker that verifies Shopify's webhook signature and forwards to the sheet | BUILT. Not deployed |
| `order-sheet/apps-script/Code.gs` | Google Sheet backend: tabs, dashboard, upsert by order id, error log, hourly self-check | BUILT. Core logic TESTED against a mock sheet (`order-sheet/tests`), not against real Google Sheets |
| `docs/pages/` | Draft text for About, Shipping, Returns, Warranty, Order tracking with placeholders | BUILT |
| `docs/research/` | Product and listing research | BUILT |

## 2. Setup order (about half a day)

1. **Create the Shopify store.** NEEDS YOU. Settings > Store details: legal name, address, currency INR.
2. **Install Shopify CLI** and from `shopify-theme/` run `shopify theme dev --store yourstore.myshopify.com` to preview, then `shopify theme push` to upload. Or zip the folder and upload it in Online Store > Themes. Run `shopify theme check` and fix anything it flags, since I could not run it here.
3. **Create metafield definitions** (Settings > Custom data > Products). Namespace `custom`, exactly these keys: `format`, `card_summary`, `best_for`, `key_points`, `controllers`, `storage`, `preloaded_games`, `supported_systems`, `video_output`, `display`, `connectivity`, `power`, `battery`, `dimensions`, `warranty`, `in_the_box`, `setup_steps`, `compatibility`. Types are in the CSV header.
4. **Import** `shopify-data/products_draft.csv` (Products > Import). Products stay Draft.
5. **Fill each product** with your confirmed specs, price, photos you own, and inventory. Leave any unconfirmed metafield empty: the theme hides empty rows.
6. **Collections** (Products > Collections), automated by tag/type: TV Gaming Sticks (type = TV game stick), Handheld (type = Handheld console), Mini Arcade (type = Mini arcade), Two-Player Models (tag = two-player), Gifts (tag = gift). Only publish a collection that has products.
7. **Filters:** install the free Shopify Search & Discovery app and add filters (Type, Price, Availability, Controllers, Storage).
8. **Pages** (Online Store > Pages), paste text from `docs/pages/` after you edit it, and assign templates: Contact = `page.contact`, Compare = `page.compare`, Guide = `page.guide`, FAQ = `page.faq`, others = `page`.
9. **Navigation:** main-menu (collections, Compare, Guide), footer (Contact, FAQ, Shipping, Returns, Warranty, Order tracking).
10. **Policies** (Settings > Policies): use Shopify's generator and edit. These appear in the footer and at checkout.
11. **Theme settings:** business details, service promises (only real ones), announcement text.
12. **Payments:** Settings > Payments. Activate Shopify Payments if offered for your business, or add Razorpay/Cashfree. Complete KYC. Test in test mode first. NEEDS YOU.
13. **Shipping:** Settings > Shipping and delivery. Set rates or a free-shipping threshold, and add a courier app if wanted.
14. **COD:** Settings > Payments > Manual payment methods > Cash on Delivery. Optional, see section 5.
15. **Reviews:** install Judge.me (or similar) and add its review block to the product page in the theme editor, in the "Product details" section. Then untick "Show 'No reviews yet' box" in Theme settings.
16. **Order sheet:** follow `order-sheet/README.md`.
17. **Analytics:** see `docs/shopify/02-tracking-and-seo.md`.
18. Remove the storefront password only after the launch checklist is done.

## 3. How to run it day to day

- **Update a price/spec/photo:** Products > the product > edit. Specs are the Metafields section at the bottom.
- **Orders:** Orders in Shopify admin: search by order number, name, email or phone; filter by payment, fulfilment, date, tag; export CSV via Export.
- **Fulfilment status:** mark Packed and Processing by adding the tags `processing` and `packed` to the order. Add tracking when you Fulfil: the sheet picks it up. Delivered comes from the courier app's shipment status.
- **Cancel / refund:** in the order page. Refund amounts flow into the sheet.
- **Reports:** Google Sheet dashboard tab, plus Shopify Analytics.
- **Reconcile payments:** the Payment Reconciliation tab shows Matched, Awaiting payment, Partly refunded, or MISMATCH. Compare mismatches with the gateway dashboard.
- **Moderate reviews:** in the reviews app (hide, reply, publish). Verified Purchase badges come from the app and are based on real Shopify orders.

## 4. Before taking real payments

- [ ] Business details and policies in place, reviewed by you
- [ ] Payment gateway live, a real small order placed and refunded
- [ ] Real prices, specs, photos, warranty and return terms entered
- [ ] Test order in test mode appears in Shopify admin AND in the sheet
- [ ] Shipping rates verified against a real parcel quote
- [ ] Storefront password removed, search engine indexing on
- [ ] Order Sheet reconcile trigger installed

## 5. Cash on delivery: recommendation

Start prepaid-only. COD adds return-to-origin loss on a low-margin item (about Rs 1,700 to 1,900). If you enable it later, charge a COD fee, restrict it by PIN code, and track it in the sheet (the COD column and "Payment Pending" status keep it separate from collected revenue).

## 6. What is NOT done

- Nothing here has run on a real Shopify store, payment gateway, or Google account.
- No PIN-code delivery check (Shopify has none natively; add an app if wanted).
- Product photos, videos, and real copy: waiting on your data.
- Review request emails and photo reviews: provided by the reviews app, not the theme.
- Meta, Google and Merchant Center connections need your accounts.
