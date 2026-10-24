/**
 * Timkolas Order Management Dashboard: Google Apps Script backend.
 *
 * Shopify stays the permanent system of record for orders. This script mirrors every order into a
 * Google Sheet, upserting by Shopify order id so webhook retries never create duplicates.
 *
 * Script Properties required (Project Settings > Script properties):
 *   SHARED_SECRET   random string, same value as the Worker secret
 *   SHOP_DOMAIN     yourstore.myshopify.com        (needed for reconcile and refund events)
 *   ADMIN_TOKEN     Admin API access token, read_orders scope (needed for reconcile and refund events)
 *
 * Run setup() once to create the tabs. Then deploy as Web app: execute as Me, access Anyone.
 * The SHARED_SECRET check keeps strangers out; the Worker is the only caller that knows it.
 */

var TABS = {
  orders: 'All Orders',
  items: 'Order Items',
  sales: 'Product Sales',
  recon: 'Payment Reconciliation',
  dash: 'Dashboard',
  log: 'Sync Log',
};

var ORDER_HEADERS = [
  'Order', 'Shopify ID', 'Created At', 'Customer', 'Email', 'Phone', 'Address', 'City', 'State', 'PIN',
  'Items', 'Subtotal', 'Discount', 'Shipping', 'Tax', 'Total', 'Payment Method', 'Payment Status',
  'Order Status', 'Fulfilment Status', 'Carrier', 'Tracking No', 'Tracking URL', 'Cancelled At',
  'Refunded', 'Customer Note', 'COD', 'Transaction Ref', 'Tags', 'Last Synced',
];
var ITEM_HEADERS = ['Order', 'Shopify ID', 'Product', 'SKU', 'Variant', 'Qty', 'Unit Price', 'Discount', 'Line Total'];
var RECON_HEADERS = [
  'Order', 'Shopify ID', 'Provider', 'Transaction Ref', 'Expected Amount', 'Confirmed Amount',
  'Payment Status', 'Refund Amount', 'Reconciliation',
];
var LOG_HEADERS = ['Time', 'Level', 'Topic', 'Order', 'Message'];

function col_(headers, name) {
  var i = headers.indexOf(name);
  if (i < 0) throw new Error('Unknown column ' + name);
  var n = i + 1, s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/* ---------- one-time setup ---------- */

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.rename('Timkolas Order Management Dashboard');
  ensureTab_(ss, TABS.orders, ORDER_HEADERS);
  ensureTab_(ss, TABS.items, ITEM_HEADERS);
  ensureTab_(ss, TABS.recon, RECON_HEADERS);
  ensureTab_(ss, TABS.log, LOG_HEADERS);
  buildProductSales_(ss);
  buildDashboard_(ss);
  var first = ss.getSheetByName('Sheet1');
  if (first && ss.getSheets().length > 1) ss.deleteSheet(first);
}

function ensureTab_(ss, name, headers) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#0E1424').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  }
  return sh;
}

function buildProductSales_(ss) {
  var sh = ss.getSheetByName(TABS.sales) || ss.insertSheet(TABS.sales);
  sh.clear();
  var q = "=QUERY('" + TABS.items + "'!A:I," +
    "\"select C, sum(F), sum(I), sum(H) where C is not null group by C order by sum(I) desc " +
    "label sum(F) 'Units sold', sum(I) 'Gross sales', sum(H) 'Discounts'\",1)";
  sh.getRange('A1').setFormula(q);
  sh.getRange('F1').setValue('Note: refunds are tracked per order on All Orders and Payment Reconciliation, not per product.');
}

function buildDashboard_(ss) {
  var sh = ss.getSheetByName(TABS.dash) || ss.insertSheet(TABS.dash);
  sh.clear();
  var O = "'" + TABS.orders + "'!";
  var S = col_(ORDER_HEADERS, 'Order Status'), P = col_(ORDER_HEADERS, 'Payment Status'),
      T = col_(ORDER_HEADERS, 'Total'), C = col_(ORDER_HEADERS, 'Created At'),
      R = col_(ORDER_HEADERS, 'Refunded'), A = col_(ORDER_HEADERS, 'Order');
  function rng(c) { return O + c + '2:' + c; }
  var rows = [
    ['Metric', 'Value', 'Meaning'],
    ['Total orders', '=COUNTA(' + rng(A) + ')', 'Every order placed, any status'],
    ['Orders received today', '=COUNTIFS(' + rng(C) + ',">="&TODAY(),' + rng(C) + ',"<"&TODAY()+1)', 'Created today'],
    ['Awaiting payment', '=COUNTIF(' + rng(S) + ',"Payment Pending")', 'Includes cash on delivery until collected'],
    ['Paid orders', '=COUNTIF(' + rng(P) + ',"paid")+COUNTIF(' + rng(P) + ',"partially_refunded")', 'Payment confirmed by the gateway'],
    ['Awaiting dispatch', '=COUNTIF(' + rng(S) + ',"Payment Confirmed")+COUNTIF(' + rng(S) + ',"Processing")+COUNTIF(' + rng(S) + ',"Packed")', 'Paid but not shipped'],
    ['Shipped', '=COUNTIF(' + rng(S) + ',"Shipped")', 'With the courier'],
    ['Delivered', '=COUNTIF(' + rng(S) + ',"Delivered")', 'Courier confirmed delivery'],
    ['Cancelled', '=COUNTIF(' + rng(S) + ',"Cancelled")', 'Not counted as sales'],
    ['Orders with refunds', '=COUNTIF(' + rng(R) + ',">0")', 'Any refund recorded'],
    ['Total order value', '=SUM(' + rng(T) + ')', 'All orders including pending and cancelled. NOT revenue'],
    ['Collected revenue', '=SUMIFS(' + rng(T) + ',' + rng(P) + ',"paid")+SUMIFS(' + rng(T) + ',' + rng(P) + ',"partially_refunded")', 'Only orders the gateway confirmed as paid'],
    ['Refunds on collected orders', '=SUMIFS(' + rng(R) + ',' + rng(P) + ',"partially_refunded")', 'Partial refunds'],
    ['Net sales', '=B12-B13', 'Collected revenue minus partial refunds'],
    ['Average order value', '=IFERROR(B12/(COUNTIF(' + rng(P) + ',"paid")+COUNTIF(' + rng(P) + ',"partially_refunded")),0)', 'Collected revenue per paid order'],
  ];
  sh.getRange(1, 1, rows.length, 3).setValues(rows.map(function (r, i) { return i === 0 ? r : [r[0], '', r[2]]; }));
  for (var i = 1; i < rows.length; i++) sh.getRange(i + 1, 2).setFormula(rows[i][1]);
  sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#0E1424').setFontColor('#FFFFFF');
  sh.getRange('B11:B15').setNumberFormat('#,##0');
  sh.getRange('A19').setValue('Best-selling products (by units)').setFontWeight('bold');
  sh.getRange('A20').setFormula("=QUERY('" + TABS.items + "'!A:I,\"select C, sum(F) where C is not null group by C order by sum(F) desc limit 5 label sum(F) 'Units'\",1)");
  sh.setColumnWidth(1, 240); sh.setColumnWidth(2, 140); sh.setColumnWidth(3, 460);
}

/* ---------- webhook entry ---------- */

function doGet() {
  return json_({ ok: true, service: 'timkolas-order-sheet' });
}

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var msg;
  try {
    msg = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad json' });
  }
  if (!msg || msg.secret !== props.getProperty('SHARED_SECRET')) return json_({ ok: false, error: 'forbidden' });

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    handle_(msg.topic || '', msg.payload || {});
    return json_({ ok: true });
  } catch (err) {
    log_('ERROR', msg.topic, (msg.payload && (msg.payload.name || msg.payload.id)) || '', String(err));
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function handle_(topic, payload) {
  var order = payload;
  var props = PropertiesService.getScriptProperties();
  var haveApi = props.getProperty('SHOP_DOMAIN') && props.getProperty('ADMIN_TOKEN');

  if (topic.indexOf('refunds/') === 0) {
    if (!haveApi) throw new Error('Refund event received but SHOP_DOMAIN/ADMIN_TOKEN are not set');
    order = fetchOrder_(payload.order_id);
  } else if (haveApi && payload.id) {
    // Prefer fresh data from Shopify so out-of-order retries cannot overwrite newer rows.
    order = fetchOrder_(payload.id);
  }
  var tx = haveApi ? fetchTransactions_(order.id) : [];
  upsertOrder_(order, tx);
  log_('INFO', topic, order.name, 'synced');
}

/* ---------- Shopify Admin API (read only) ---------- */

function api_(path) {
  var p = PropertiesService.getScriptProperties();
  var url = 'https://' + p.getProperty('SHOP_DOMAIN') + '/admin/api/2025-01/' + path;
  var res = UrlFetchApp.fetch(url, { headers: { 'X-Shopify-Access-Token': p.getProperty('ADMIN_TOKEN') }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Shopify API ' + res.getResponseCode() + ' for ' + path);
  return JSON.parse(res.getContentText());
}
function fetchOrder_(id) { return api_('orders/' + id + '.json').order; }
function fetchTransactions_(id) { return api_('orders/' + id + '/transactions.json').transactions || []; }

/* ---------- mapping ---------- */

function deriveStatus_(o) {
  var tags = (o.tags || '').toLowerCase().split(',').map(function (t) { return t.trim(); });
  if (o.cancelled_at) return 'Cancelled';
  if (o.financial_status === 'refunded') return 'Refunded';
  var delivered = (o.fulfillments || []).some(function (f) { return f.shipment_status === 'delivered'; });
  if (delivered) return 'Delivered';
  if (o.fulfillment_status === 'fulfilled') return 'Shipped';
  if (o.financial_status === 'pending' || o.financial_status === 'authorized') return 'Payment Pending';
  if (o.financial_status === 'voided') return 'Payment Failed';
  if (tags.indexOf('packed') >= 0) return 'Packed';
  if (tags.indexOf('processing') >= 0) return 'Processing';
  if (tags.indexOf('return-requested') >= 0) return 'Return Requested';
  if (tags.indexOf('return-completed') >= 0) return 'Return Completed';
  return 'Payment Confirmed';
}

function refundTotal_(o, tx) {
  var sum = 0;
  (tx || []).forEach(function (t) { if (t.kind === 'refund' && t.status === 'success') sum += Number(t.amount); });
  if (!tx || !tx.length) (o.refunds || []).forEach(function (r) { (r.transactions || []).forEach(function (t) { sum += Number(t.amount); }); });
  return sum;
}

function upsertOrder_(o, tx) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ship = o.shipping_address || {};
  var f = (o.fulfillments || [])[0] || {};
  var gateways = (o.payment_gateway_names || []).join(', ');
  var isCod = /cash on delivery|cod/i.test(gateways);
  var sale = (tx || []).filter(function (t) { return (t.kind === 'sale' || t.kind === 'capture') && t.status === 'success'; })[0];
  var ref = sale ? (sale.authorization || sale.receipt && sale.receipt.payment_id || String(sale.id)) : '';
  var refunded = refundTotal_(o, tx);
  var shippingCharge = (o.total_shipping_price_set && o.total_shipping_price_set.shop_money && o.total_shipping_price_set.shop_money.amount) || 0;

  var row = [
    o.name, String(o.id), new Date(o.created_at),
    ((ship.first_name || '') + ' ' + (ship.last_name || '')).trim() || (o.customer ? (o.customer.first_name + ' ' + o.customer.last_name).trim() : ''),
    o.email || (o.customer && o.customer.email) || '', ship.phone || o.phone || (o.customer && o.customer.phone) || '',
    [ship.address1, ship.address2].filter(Boolean).join(', '), ship.city || '', ship.province || '', ship.zip || '',
    (o.line_items || []).map(function (l) { return l.quantity + ' x ' + l.title; }).join('; '),
    Number(o.subtotal_price), Number(o.total_discounts), Number(shippingCharge), Number(o.total_tax), Number(o.total_price),
    gateways, o.financial_status, deriveStatus_(o), o.fulfillment_status || 'unfulfilled',
    f.tracking_company || '', f.tracking_number || '', f.tracking_url || '', o.cancelled_at ? new Date(o.cancelled_at) : '',
    refunded, o.note || '', isCod ? 'Yes' : 'No', ref, o.tags || '', new Date(),
  ];
  upsertRow_(ss.getSheetByName(TABS.orders), String(o.id), 2, row);

  // Line items: remove this order's rows and rewrite so edits and cancellations stay correct.
  var items = ss.getSheetByName(TABS.items);
  deleteRowsFor_(items, String(o.id), 2);
  var itemRows = (o.line_items || []).map(function (l) {
    var disc = Number(l.total_discount || 0);
    var unit = Number(l.price);
    return [o.name, String(o.id), l.title, l.sku || '', l.variant_title || '', l.quantity, unit, disc, unit * l.quantity - disc];
  });
  if (itemRows.length) items.getRange(items.getLastRow() + 1, 1, itemRows.length, ITEM_HEADERS.length).setValues(itemRows);

  var confirmed = (tx || []).filter(function (t) { return (t.kind === 'sale' || t.kind === 'capture') && t.status === 'success'; })
    .reduce(function (a, t) { return a + Number(t.amount); }, 0);
  if (!tx || !tx.length) confirmed = (o.financial_status === 'paid' || o.financial_status === 'partially_refunded') ? Number(o.total_price) : 0;
  var reconStatus = reconcileState_(o, Number(o.total_price), confirmed, refunded);
  upsertRow_(ss.getSheetByName(TABS.recon), String(o.id), 2,
    [o.name, String(o.id), gateways, ref, Number(o.total_price), confirmed, o.financial_status, refunded, reconStatus]);
}

function reconcileState_(o, expected, confirmed, refunded) {
  if (o.cancelled_at && confirmed === 0) return 'Cancelled, nothing collected';
  if (o.financial_status === 'pending' || o.financial_status === 'authorized') return 'Awaiting payment';
  if (o.financial_status === 'refunded') return 'Refunded';
  if (refunded > 0) return 'Partly refunded';
  if (Math.abs(confirmed - expected) < 0.01) return 'Matched';
  return 'MISMATCH: check gateway';
}

function upsertRow_(sheet, key, keyCol, row) {
  var last = sheet.getLastRow();
  var rowNum = -1;
  if (last >= 2) {
    var keys = sheet.getRange(2, keyCol, last - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) if (String(keys[i][0]) === key) { rowNum = i + 2; break; }
  }
  if (rowNum < 0) rowNum = last + 1;
  sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
}

function deleteRowsFor_(sheet, key, keyCol) {
  var last = sheet.getLastRow();
  if (last < 2) return;
  var keys = sheet.getRange(2, keyCol, last - 1, 1).getValues();
  for (var i = keys.length - 1; i >= 0; i--) if (String(keys[i][0]) === key) sheet.deleteRow(i + 2);
}

function log_(level, topic, order, message) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TABS.log);
  if (sh) sh.appendRow([new Date(), level, topic || '', order || '', message]);
}

/* ---------- self-healing: find orders missing from the sheet ---------- */

/**
 * Re-pulls recent orders from Shopify and upserts them. Run on a time trigger (hourly) or manually
 * from the Timkolas menu. Safe to run repeatedly.
 */
function reconcileRecent(days) {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SHOP_DOMAIN') || !props.getProperty('ADMIN_TOKEN')) throw new Error('Set SHOP_DOMAIN and ADMIN_TOKEN first');
  var since = new Date(Date.now() - (days || 3) * 86400000).toISOString();
  var data = api_('orders.json?status=any&limit=250&updated_at_min=' + encodeURIComponent(since));
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var done = 0;
  try {
    (data.orders || []).forEach(function (o) {
      try { upsertOrder_(o, fetchTransactions_(o.id)); done++; }
      catch (err) { log_('ERROR', 'reconcile', o.name, String(err)); }
    });
  } finally { lock.releaseLock(); }
  log_('INFO', 'reconcile', '', 'checked ' + (data.orders || []).length + ', upserted ' + done);
}

function installHourlyReconcile() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'hourlyReconcile_') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('hourlyReconcile_').timeBased().everyHours(1).create();
}
function hourlyReconcile_() { reconcileRecent(3); }

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Timkolas')
    .addItem('Re-check last 3 days of orders', 'menuReconcile_')
    .addItem('Install hourly auto re-check', 'installHourlyReconcile')
    .addToUi();
}
function menuReconcile_() { reconcileRecent(3); SpreadsheetApp.getActive().toast('Re-check finished. See Sync Log.'); }
