# Lucent Nattokinase 4-in-1 — Shopify theme

A full rebuild of the live `shoplucent.net` Marine Collagen theme (`lucent-marine-collagen-theme-7`),
re-pointed at **Lucent Nattokinase 4-in-1 Cardio Complex** with every section, interaction and
page carried over, the KaChing Bundles app-block slot and price bridge kept, and all media
re-cut from the TikTok ads.

`lucent-nattokinase-theme.zip` is the upload-ready theme. `product-import.csv` creates the product.

## Install (10 minutes)

1. **Product** — already created in the store as `lucent-nattokinase` (single variant, $39.96,
   compare-at $59.99, 9 gallery images). `product-import.csv` recreates it if ever needed.
2. **Theme** — Online Store → Themes → Add theme → Upload zip → `lucent-nattokinase-theme.zip`.
3. **KaChing** — Theme editor → product page → *Nattokinase PDP* section → Add block → KaChing
   Bundles. The headline price, savings badge, add-to-cart and sticky bar sync to the selected deal.
4. **Theme settings** → *Store* → pick the featured product (only needed if the handle is not
   `lucent-nattokinase`), set the support email, favicon, and the sale bar text.
5. **Pages** — create `contact` (template `page.contact`) and `shipping-returns`
   (template `page.shipping-returns`). Optional campaign landers: create pages using
   `page.glow-trend` (advertorial: "Why is nobody talking about this?") and `page.ranked-guide`
   (the ranked buyer's guide). Product URLs also accept `?view=glow-trend` / `?view=ranked-guide`.
6. **Publish.**

## What's in the zip

| Area | Files |
|---|---|
| Layout | `layout/theme.liquid`, `layout/password.liquid` |
| Product page | `sections/main-product.liquid` (gallery, buy box, KaChing app-block slot, jump nav, 3 ad videos, trust marquee, GIF band, animated stats, why-it-works, testimonials, second GIF band, compare table, what's-inside, reviews + write-a-review modal, FAQ, final CTA, sticky add-to-cart) |
| Home | `sections/lucent-home.liquid` |
| Campaign landers | `sections/campaign-glow-trend.liquid`, `sections/campaign-ranked-guide.liquid` + `snippets/campaign-*.liquid` |
| Chrome | `snippets/site-header.liquid` (sale countdown, drawer nav, cart bag), `snippets/site-footer.liquid`, `snippets/cart-drawer.liquid` (AJAX cart) |
| Templates | product, index, cart, contact, shipping-returns, 404, search, collection, list-collections, page, blog, article, password, gift card, customers/* |
| Assets | `lumenity.css`, `lumenity.js`, 9 product images, 3 GIFs + posters, 4 demo videos + posters |

## Media notes (read this)

* **GIFs and videos are cut straight from your ads.** The bottle in that footage is the original
  supplier's bottle: at GIF size the brand emblem is a few pixels and unreadable, but it is there.
  Every spoken "Black Forest" mention was cut out of the audio (ad 1 at 0:32, ad 2 at 1:04, ad 4 at
  0:58; ad 3 has none). If you want footage with a Lucent-labelled bottle, that needs regenerated
  clips (Higgsfield) — I could not reach Higgsfield from this environment and there is no API key.
* **Gallery images**: image 1 is the Lucent hero you supplied. Images 2–9 are the infographic
  panels from the source supplier's listing (the ones with no brand mark) plus a Lucent-made
  5× FU compare panel in the same style. The supplier's compare panel and bottle shot carried
  their brand and were not used. Those seven panels are the supplier's artwork — make sure you
  have the right to use them before going live.
* Your hero says "1 month supply / 30 servings"; the supplement-facts panel (and the label) says
  1 capsule, 60 servings. The theme copy now says 30 capsules / 30 days per your hero and bottle art; update the facts panel if that is the final label.

## Compliance

All benefit copy is written as structure/function claims with the FDA disclaimer in the footer,
on the product description and on both campaign pages. Do not add disease claims
("clears arteries", "removes plaque") from the ads — they will get the TikTok Shop listing pulled.
