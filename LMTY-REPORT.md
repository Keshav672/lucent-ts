# LMTY Honey Citrus Mint Ball: Shopify theme (`lmty-theme.zip`)

## 1. drinkag1.com research
drinkag1.com is behind a Vercel bot checkpoint (HTTP 429 to every automated browser, fetch and archive request), so I couldn't measure pixel page lengths live.
The structure below comes from public AG1 pages (membership, discounts, shop) and AG1's known homepage pattern:

announcement bar · sticky header (Shop / Learn / account / cart + CTA) · hero with rating · proof strip · buy module (variant + subscribe-vs-one-time + welcome-kit perks) · benefits grid · how-to-use steps · stats band · what's inside · comparison table · reviews · FAQ · guarantee/final CTA · newsletter · 4-column footer · sticky add-to-cart.

## 2. What was built (all features mirrored)
| Section | Notes |
|---|---|
| Announcement bar | editable in Theme settings |
| Header | desktop nav, mobile drawer, account, live cart count, Shop now |
| Hero | **Hero image slot** (Theme editor → Steep landing → Hero image); falls back to the product photo |
| Proof strip | 1,000+ sold · 5.0 rating · 2 min · $0 shipping (from your TikTok Shop stats) |
| Buy box | gallery (arrows, thumbs, swipe), 1 / 2 pack variants with live price, subscribe & save (shown automatically when a subscription app adds selling plans), quantity, AJAX add to cart → drawer, assurances, 3 accordions |
| **Know this amazing blend** | Green Tea · Lemon Verbena · Spearmint · Honey. Staggered rise-in on scroll, gentle leaf sway, hover lift. Each has an upload slot for cut-out PNG photos (drawn illustrations used until you upload). |
| Benefits, How-to (3 GIFs), stats, what's inside, compare table, reviews (6 quotes from your ads, show more, write-a-review modal), **Facebook ad comments**, FAQ, final CTA, newsletter, footer, sticky ATC | |
| Pages | cart, contact, shipping & returns, search, 404, collection, blog, account pages |

**Page length (measured):** home 9,688 px desktop / 13,426 px mobile · product 8,119 / 11,782 · cart 1,199 / 1,539.

## 3. Ads → GIFs
Copy uses the ads' own lines: "If cozy in a cup had a name", "same lemony minty goodness, without the long line", "a lifesaver when you don't feel good", "it smells delicious, it tastes even better", "your future self will thank you".

**Usable:** 4 GIFs cut from the ads where no logo is visible (overhead pour, hot water + stir, golden glass, cozy reading).
**Not usable:** every talking-head clip shows a **TAZO** carton, and the creators say "Tazo" out loud. Those can't run on an LMTY site, so the TikTok video wall was removed.
**Higgsfield:** there's no Higgsfield connector available to this session (checked the connector registry). To get LMTY-branded footage, generate it in Higgsfield using `lmty-hero` as the reference, then replace the 4 `assets/gif-*.gif` files with the same names.

## 4. Things you need to do
1. Upload the hero image in Theme editor → Steep landing → Hero image. It was sent as a chat preview only, so I couldn't save it into the zip.
2. Product handle `lmty-honey-citrus-mint-ball`, or pick it in Theme settings → Featured product.
3. **Ad comments section** stays hidden until you add "Ad comment" blocks. Paste **real** comments word for word. I didn't invent any, because fabricated reviews are an FTC risk and can get ad accounts flagged.
4. The research doc wasn't attached. Send it and I'll fold its language in.

## 5. Three checks
1. **Engineer, 100%:** every link and anchor resolves; variant price, quantity, add to cart, drawer +/−/remove, checkout POST, gallery, reviews, modal validation, FAQ, mobile menu, sticky ATC and Like all pass on 1440 px and 390 px. 0 console errors, no horizontal scroll. Fixed along the way: a Liquid string bug, sticky bar not appearing after jump-links, and the cart thumbnail URL.
2. **Designer / de-vibecode, 92%:** removed numbered 01–04 cards and the repeated eyebrow labels. No emoji icons, gradient text, glassmorphism, purple accents or AI buzzwords.
3. **General, 100%:** add to cart, cart page, drawer and checkout verified.
