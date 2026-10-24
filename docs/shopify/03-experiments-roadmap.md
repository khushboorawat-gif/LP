# Conversion experiment roadmap (run after launch, with real traffic)

Do not run tests until there is enough traffic: roughly 100+ purchases per variant for a conversion test; otherwise use qualitative methods first. Measure profit, not clicks.

Global guardrails for every test: return rate, refund rate, contribution margin per order (price minus product cost, shipping, payment fee, ad cost), support tickets per 100 orders.

| # | Hypothesis | Change | Audience | Primary metric | Secondary | Tracking needed | Method |
|---|---|---|---|---|---|---|---|
| 1 | A clearer "what is it and how do I use it" hero beats a generic hero for cold Meta traffic | Hero headline/image variants: "Bring game night back" vs "Plug in. Pick up a controller. Play." | New mobile visitors from Meta | Purchase conversion rate | Add-to-cart rate, bounce | GA4 + Meta purchase events | A/B via Shopify theme duplicates or an A/B app, 2-4 weeks |
| 2 | Showing box contents high on the page lowers hesitation | Move "What is in the box" above the fold on mobile | Product page visitors | Add-to-cart rate | Purchase rate, returns | AddToCart, ViewContent | Split by product template |
| 3 | A short comparison before the product list helps indecisive visitors | Show compare CTA on collection pages | Collection viewers | Compare-page to purchase rate | Time to purchase | Page views, purchase | Time-boxed A/B |
| 4 | Two-controller models sell better as gifts with a gift collection | Gift collection in nav vs hidden | Gift buyers | Gift collection revenue | AOV | Collection views, purchase | Sequential test around a festival |
| 5 | Prepaid discount may beat COD (if COD enabled) by cutting returns to origin | Small prepaid incentive | Checkout starters | Net margin per order | Conversion rate, RTO rate | Payment method on order | Compare cohorts over 4 weeks |
| 6 | Sticky add-to-cart on mobile raises add-to-cart | Toggle the sticky bar | Mobile product viewers | Add-to-cart rate | Purchase rate | AddToCart | A/B |
| 7 | Real reviews raise conversion more than any copy change | Post-delivery review request, show rating on cards | All | Conversion rate on products with 5+ reviews | Review volume | Review count | Observational |
| 8 | Fewer checkout fields reduce abandonment | Turn on Shop Pay/accelerated checkouts, minimize optional fields | Checkout starters | Checkout completion rate | Payment failures | InitiateCheckout, Purchase | Before/after with seasonality caution |

Order of work: 2, 6, 1, 3, 8, then 4, 5, 7 as data accumulates.
