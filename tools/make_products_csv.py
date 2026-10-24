#!/usr/bin/env python3
"""Generates shopify-data/products_draft.csv, the Shopify product import.

Every product is imported as DRAFT so nothing goes live until the owner confirms data.
Prices are PLACEHOLDERS taken from the marketplace selling prices seen in research
(docs/research/02-flipkart-listing-catalog.md). Replace them with your own prices.

Spec metafields are left blank unless the owner's pasted listing stated them, because blank rows
are hidden by the theme and unverified claims must not show as fact.
Run: python3 tools/make_products_csv.py
"""
import csv
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'shopify-data', 'products_draft.csv')

META = [
    ('format', 'single_line_text_field'),
    ('card_summary', 'single_line_text_field'),
    ('best_for', 'single_line_text_field'),
    ('key_points', 'multi_line_text_field'),
    ('controllers', 'single_line_text_field'),
    ('storage', 'single_line_text_field'),
    ('preloaded_games', 'single_line_text_field'),
    ('supported_systems', 'single_line_text_field'),
    ('video_output', 'single_line_text_field'),
    ('display', 'single_line_text_field'),
    ('connectivity', 'single_line_text_field'),
    ('power', 'single_line_text_field'),
    ('battery', 'single_line_text_field'),
    ('dimensions', 'single_line_text_field'),
    ('warranty', 'single_line_text_field'),
    ('in_the_box', 'multi_line_text_field'),
    ('setup_steps', 'multi_line_text_field'),
    ('compatibility', 'multi_line_text_field'),
]

BASE = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published',
    'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker',
    'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price',
    'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable', 'Image Src',
    'Image Position', 'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description',
    'Variant Weight Unit', 'Status',
]

TBC = '<p><strong>[Replace with model-specific copy after you confirm the specifications.]</strong></p>'

PRODUCTS = [
    dict(handle='timkolas-m15-game-stick', title='Timkolas M15 TV Game Stick', sku='TK-M15', price='1899', type='TV game stick',
         tags='tv-stick, two-player, gift', seo='Timkolas M15 TV Game Stick with Wireless Controllers',
         seo_d='HDMI plug-in retro game stick with two wireless controllers. Check specs, box contents and TV needs before you buy.',
         meta=dict(format='TV game stick', card_summary='Plug-in retro stick for the TV, two controllers [confirm]', controllers='2 wireless [confirm]')),
    dict(handle='timkolas-23-emulator-game-stick', title='Timkolas 23-Emulator TV Game Stick', sku='TK-E23', price='1659', type='TV game stick',
         tags='tv-stick', seo='Timkolas TV Game Stick with 23 Emulators',
         seo_d='Retro TV game stick. Review supported systems, storage and controllers on this page before ordering.',
         meta=dict(format='TV game stick', card_summary='Entry retro stick for the TV [confirm controllers]')),
    dict(handle='timkolas-max-plush-game-stick', title='Timkolas Max Plush TV Game Stick', sku='TK-MAXP', price='4399', type='TV game stick',
         tags='tv-stick, two-player, gift', seo='Timkolas Max Plush TV Game Stick with Two Controllers',
         seo_d='Higher-tier Timkolas TV game stick with two wireless controllers. Full specs and box contents below.',
         meta=dict(format='TV game stick', card_summary='Higher-tier TV stick, two controllers [confirm]', controllers='2 wireless [confirm]')),
    dict(handle='timkolas-gs5-pro-game-stick', title='Timkolas GS5 Pro TV Game Stick', sku='TK-GS5P', price='4999', type='TV game stick',
         tags='tv-stick, two-player, gift', seo='Timkolas GS5 Pro TV Game Stick with Two Controllers',
         seo_d='Timkolas GS5 Pro TV game stick with two wireless controllers. Read confirmed specs and what is in the box.',
         meta=dict(format='TV game stick', card_summary='GS5 Pro stick for the TV, two controllers [confirm]', controllers='2 wireless [confirm]')),
    dict(handle='timkolas-m66-mini-arcade', title='Timkolas M66 Mini Arcade Console', sku='TK-M66', price='3599', type='Mini arcade',
         tags='mini-arcade, two-player, gift', seo='Timkolas M66 Mini Arcade Console with Two Wireless Controllers',
         seo_d='Compact arcade-style Timkolas console with two wireless controllers. Check specs and requirements here.',
         meta=dict(format='Mini arcade', card_summary='Compact arcade-style console, two controllers [confirm]', controllers='2 wireless [confirm]')),
    dict(handle='timkolas-j36s-handheld', title='Timkolas J36S Handheld Console', sku='TK-J36S', price='4799', type='Handheld console',
         tags='handheld, travel', seo='Timkolas J36S Handheld Retro Console',
         seo_d='Portable Timkolas handheld console. See display, battery, storage and supported systems once confirmed.',
         meta=dict(format='Handheld console', card_summary='Pocket handheld with built-in screen [confirm specs]')),
]


def main():
    header = BASE + ['Metafield: custom.%s [%s]' % (k, t) for k, t in META]
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh)
        w.writerow(header)
        for p in PRODUCTS:
            base = {
                'Handle': p['handle'], 'Title': p['title'], 'Body (HTML)': TBC, 'Vendor': 'Timkolas',
                'Product Category': 'Electronics > Video Game Consoles', 'Type': p['type'], 'Tags': p['tags'],
                'Published': 'FALSE', 'Option1 Name': 'Title', 'Option1 Value': 'Default Title', 'Variant SKU': p['sku'],
                'Variant Grams': '', 'Variant Inventory Tracker': 'shopify', 'Variant Inventory Qty': '0',
                'Variant Inventory Policy': 'deny', 'Variant Fulfillment Service': 'manual', 'Variant Price': p['price'],
                'Variant Compare At Price': '', 'Variant Requires Shipping': 'TRUE', 'Variant Taxable': 'TRUE',
                'Image Src': '', 'Image Position': '', 'Image Alt Text': '', 'Gift Card': 'FALSE',
                'SEO Title': p['seo'], 'SEO Description': p['seo_d'], 'Variant Weight Unit': 'g', 'Status': 'draft',
            }
            row = [base[c] for c in BASE]
            row += [p['meta'].get(k, '') for k, _ in META]
            w.writerow(row)
    print('wrote', os.path.abspath(OUT), len(PRODUCTS), 'products')


if __name__ == '__main__':
    main()
