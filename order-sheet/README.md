# Order sheet setup: Timkolas Order Management Dashboard

Shopify remains the permanent order database. The sheet is a live, readable mirror for daily work and reporting. If the sheet fails, no order is lost: Shopify retries the webhook, and a reconcile job refills anything missing.

```
Shopify order event --> Cloudflare Worker (checks signature) --> Apps Script (writes sheet)
                              ^ returns 5xx on any failure, so Shopify retries (up to 48 hours)
```

## Setup

1. **Google Sheet:** create a new Google Sheet. Extensions > Apps Script. Paste `apps-script/Code.gs`. Run `setup()` once and approve permissions. This renames the file "Timkolas Order Management Dashboard" and creates All Orders, Order Items, Product Sales, Payment Reconciliation, Dashboard, Sync Log.
2. **Script properties** (Project settings): `SHARED_SECRET` (any long random string). For refunds and self-healing also `SHOP_DOMAIN` (`yourstore.myshopify.com`) and `ADMIN_TOKEN`.
3. **Admin token:** Shopify admin > Settings > Apps > Develop apps > create app > Admin API scopes `read_orders` only > install > copy the token into the script property. Never put it in the repo.
4. **Deploy:** Apps Script > Deploy > New deployment > Web app > Execute as: Me, Access: Anyone. Copy the URL.
5. **Worker:** `cd order-sheet/worker && npx wrangler deploy`, then set secrets: `wrangler secret put SHOPIFY_WEBHOOK_SECRET`, `APPS_SCRIPT_URL`, `SHARED_SECRET`.
6. **Webhooks:** Shopify admin > Settings > Notifications > Webhooks (JSON): `Order creation`, `Order payment`, `Order update`, `Order cancellation`, `Refund create` (and `Order fulfillment` if shown), all pointing at the Worker URL. Copy the signing secret shown on that page into `SHOPIFY_WEBHOOK_SECRET`.
7. **Self-heal:** in the sheet, menu Timkolas > Install hourly auto re-check. Use "Re-check last 3 days" any time.
8. **Lock it down:** share the sheet only with named staff (Editor). Anyone with edit access can see customer details.

## How statuses map

| Sheet "Order Status" | Comes from |
|---|---|
| Payment Pending | Shopify payment pending/authorized (includes COD until collected) |
| Payment Failed | payment voided |
| Payment Confirmed | paid, not yet worked on |
| Processing / Packed | staff add tag `processing` or `packed` on the order |
| Shipped | order fulfilled (with carrier and tracking) |
| Delivered | courier shipment status delivered |
| Cancelled / Refunded | cancelled or fully refunded |
| Return Requested / Completed | tag `return-requested` / `return-completed` |

"Total order value" counts every order. "Collected revenue" counts only gateway-confirmed paid orders. Pending, failed and cancelled orders are never counted as sales.

## Tested vs untested

- TESTED (mock sheet, `node order-sheet/tests/sheet-logic.test.js`): wrong secret rejected, retried webhooks do not duplicate rows, items rewritten correctly, status mapping, COD flag, reconciliation state.
- NOT TESTED: real Google Sheets execution, QUERY formulas on the Dashboard, deployed Worker, real Shopify webhook delivery, Admin API calls. Do a test order before relying on it.

## Known limits

- Refunds are tracked per order, not per product line.
- The Worker returns an error if the sheet is down; Shopify then retries, so brief outages self-correct. Long outages are fixed by "Re-check last 3 days".
- Apps Script quotas are fine for hundreds of orders a day. If you grow far beyond that, move the mirror to a database.
