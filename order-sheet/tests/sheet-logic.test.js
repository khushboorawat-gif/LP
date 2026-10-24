// Mock Google Sheets and run the real Code.gs to check idempotency and status mapping.
const fs = require('fs');
const vm = require('vm');

function makeSheet(name) {
  const rows = [];
  return {
    name, rows,
    getLastRow: () => rows.length,
    getRange(r, c, n, m) {
      return {
        getValues: () => rows.slice(r - 1, r - 1 + n).map((x) => x.slice(c - 1, c - 1 + (m || 1))),
        setValues: (v) => { v.forEach((x, i) => { rows[r - 1 + i] = x.slice(); }); return { setFontWeight() { return this; }, setBackground() { return this; }, setFontColor() { return this; } }; },
      };
    },
    deleteRow: (n) => rows.splice(n - 1, 1),
    appendRow: (x) => rows.push(x),
  };
}
const sheets = {};
['All Orders', 'Order Items', 'Payment Reconciliation', 'Sync Log'].forEach((n) => { sheets[n] = makeSheet(n); });
// header rows
sheets['All Orders'].rows.push(['h']); sheets['Order Items'].rows.push(['h']); sheets['Payment Reconciliation'].rows.push(['h']);

const props = { SHARED_SECRET: 's3cret' };
const ctx = {
  console, Date, JSON, Math, String, Number, Array, Object, Error, encodeURIComponent,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => sheets[n] }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] || null }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ t, setMimeType() { return this; } }) },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../apps-script/Code.gs', 'utf8'), ctx);

const order = (over) => Object.assign({
  id: 1001, name: '#1001', created_at: '2026-10-24T10:00:00Z', email: 'a@b.c', total_price: '1899.00', subtotal_price: '1899.00',
  total_discounts: '0.00', total_tax: '0.00', financial_status: 'pending', fulfillment_status: null, payment_gateway_names: ['Cash on Delivery (COD)'],
  shipping_address: { first_name: 'Asha', last_name: 'K', address1: '1 Road', city: 'Pune', province: 'MH', zip: '411001', phone: '9999999999' },
  line_items: [{ title: 'M15 Stick', sku: 'TK-M15', variant_title: null, quantity: 2, price: '949.50', total_discount: '0.00' }], tags: '', fulfillments: [],
}, over);
const post = (topic, payload, secret) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ secret: secret || 's3cret', topic, payload }) } }).t);

let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

ok(post('orders/create', order(), 'wrong').ok === false, 'wrong secret rejected');
ok(post('orders/create', order()).ok === true, 'create accepted');
post('orders/create', order()); post('orders/create', order());
ok(sheets['All Orders'].rows.length === 2, 'retried webhook leaves ONE order row (got ' + (sheets['All Orders'].rows.length - 1) + ')');
ok(sheets['Order Items'].rows.length === 2, 'items not duplicated');
ok(sheets['All Orders'].rows[1][18] === 'Payment Pending', 'COD/pending shows Payment Pending');
ok(sheets['All Orders'].rows[1][26] === 'Yes', 'COD flagged');
post('orders/paid', order({ financial_status: 'paid' }));
ok(sheets['All Orders'].rows.length === 2 && sheets['All Orders'].rows[1][17] === 'paid', 'paid updates same row');
ok(sheets['All Orders'].rows[1][18] === 'Payment Confirmed', 'status Payment Confirmed');
post('orders/updated', order({ financial_status: 'paid', tags: 'Packed' }));
ok(sheets['All Orders'].rows[1][18] === 'Packed', 'tag packed -> Packed');
post('orders/updated', order({ financial_status: 'paid', fulfillment_status: 'fulfilled', fulfillments: [{ tracking_number: 'T1', tracking_company: 'X', shipment_status: null }] }));
ok(sheets['All Orders'].rows[1][18] === 'Shipped' && sheets['All Orders'].rows[1][21] === 'T1', 'fulfilled -> Shipped with tracking');
post('orders/updated', order({ financial_status: 'paid', fulfillment_status: 'fulfilled', fulfillments: [{ shipment_status: 'delivered' }] }));
ok(sheets['All Orders'].rows[1][18] === 'Delivered', 'delivered');
post('orders/cancelled', order({ cancelled_at: '2026-10-25T10:00:00Z', financial_status: 'voided' }));
ok(sheets['All Orders'].rows[1][18] === 'Cancelled', 'cancelled');
post('orders/create', order({ id: 1002, name: '#1002', financial_status: 'paid', payment_gateway_names: ['razorpay'] }));
ok(sheets['All Orders'].rows.length === 3, 'second order adds a row');
ok(sheets['Payment Reconciliation'].rows[2][8] === 'Matched', 'recon Matched for paid without API');
ok(sheets['Sync Log'].rows.length > 0, 'sync log written');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
process.exit(fails ? 1 : 0);
