#!/usr/bin/env python3
"""Builds downloads/products_dummy.csv: INVENTED test data so a beginner can see a filled store.
Every title starts with [DUMMY], every value is made up, products are DRAFT, no images.
Replace all of it with real, confirmed data before selling anything."""
import csv, os
OUT = os.path.join(os.path.dirname(__file__), '..', 'downloads', 'products_dummy.csv')
HEAD = ['Handle','Title','Body (HTML)','Vendor','Product Category','Type','Tags','Published','Option1 Name','Option1 Value',
 'Variant SKU','Variant Grams','Variant Inventory Tracker','Variant Inventory Qty','Variant Inventory Policy',
 'Variant Fulfillment Service','Variant Price','Variant Compare At Price','Variant Requires Shipping','Variant Taxable',
 'Image Src','Image Position','Image Alt Text','Gift Card','SEO Title','SEO Description','Variant Weight Unit','Status']

def body(summary, rows, box):
    spec = ''.join('<tr><th align="left">%s</th><td>%s</td></tr>' % r for r in rows)
    items = ''.join('<li>%s</li>' % b for b in box)
    return ('<p><em>DUMMY TEXT FOR TESTING ONLY. Not real product information.</em></p><p>%s</p>'
            '<h3>Key details</h3><table>%s</table><h3>What is in the box</h3><ul>%s</ul>'
            '<h3>Before you buy</h3><p>Needs a TV or monitor with a free HDMI port (dummy note).</p>' % (summary, spec, items))

P = [
 ('dummy-tv-stick-duo','[DUMMY] Retro TV Game Stick Duo','TV game stick','tv-stick, two-player, gift','DUMMY-TV-DUO',1499,
  'A plug-in game stick for the TV that comes with two wireless controllers, so two people can play together.',
  [('Type','TV game stick'),('Controllers','2 wireless'),('Storage','32 GB'),('Video output','HDMI'),('Power','USB cable to TV or adapter'),('Warranty','6 months (dummy)')],
  ['Game stick','2 wireless controllers','2 USB receivers','HDMI extender cable','USB power cable','Quick start guide']),
 ('dummy-tv-stick-solo','[DUMMY] Retro TV Game Stick Solo','TV game stick','tv-stick','DUMMY-TV-SOLO',1099,
  'A simple starter stick for one player. Plug it in, pair the controller and play.',
  [('Type','TV game stick'),('Controllers','1 wireless'),('Storage','16 GB'),('Video output','HDMI'),('Power','USB cable'),('Warranty','6 months (dummy)')],
  ['Game stick','1 wireless controller','1 USB receiver','USB power cable','Quick start guide']),
 ('dummy-tv-stick-plus','[DUMMY] Retro TV Game Stick Plus','TV game stick','tv-stick, two-player, gift','DUMMY-TV-PLUS',2499,
  'A larger-storage stick with two controllers for families who want more room for games.',
  [('Type','TV game stick'),('Controllers','2 wireless'),('Storage','64 GB'),('Video output','HDMI'),('Power','USB cable'),('Warranty','12 months (dummy)')],
  ['Game stick','2 wireless controllers','2 USB receivers','HDMI extender cable','USB power cable','Quick start guide']),
 ('dummy-mini-arcade','[DUMMY] Mini Arcade Console','Mini arcade','mini-arcade, two-player, gift','DUMMY-ARCADE',2999,
  'A compact arcade-style console that connects to the TV and includes two controllers.',
  [('Type','Mini arcade'),('Controllers','2 wireless'),('Storage','32 GB'),('Video output','HDMI'),('Power','USB-C adapter'),('Warranty','6 months (dummy)')],
  ['Mini arcade console','2 wireless controllers','USB-C power cable','HDMI cable','Quick start guide']),
 ('dummy-handheld','[DUMMY] Pocket Handheld Console','Handheld console','handheld, travel','DUMMY-HAND',3499,
  'A pocket-size handheld with its own screen for playing on the go. No TV needed.',
  [('Type','Handheld console'),('Display','3.5 inch screen'),('Battery','2000 mAh rechargeable'),('Storage','64 GB'),('Charging','USB-C'),('Warranty','6 months (dummy)')],
  ['Handheld console','USB-C charging cable','Quick start guide']),
 ('dummy-controller-pair','[DUMMY] Extra Wireless Controller Pair','Accessory','accessory, two-player','DUMMY-PAD2',799,
  'A spare pair of wireless controllers for compatible Timkolas TV sticks. Check compatibility first.',
  [('Type','Accessory'),('Controllers','2'),('Connection','2.4 GHz wireless'),('Power','2 AAA batteries each (not included)'),('Warranty','3 months (dummy)')],
  ['2 wireless controllers','2 USB receivers']),
]

with open(OUT, 'w', newline='', encoding='utf-8') as fh:
    w = csv.writer(fh); w.writerow(HEAD)
    for h, t, ty, tags, sku, price, summ, rows, box in P:
        w.writerow([h, t, body(summ, rows, box), 'Timkolas', 'Electronics > Video Game Consoles', ty, tags, 'FALSE', 'Title', 'Default Title',
                    sku, 350, 'shopify', 10, 'deny', 'manual', price, '', 'TRUE', 'TRUE', '', '', '', 'FALSE',
                    t + ' (dummy)', 'Dummy test product. Replace before selling.', 'g', 'draft'])
print('wrote', len(P), 'dummy products')
