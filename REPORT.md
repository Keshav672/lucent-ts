# Lucent site rebuild — reverse-engineering report

Source: `https://shoplucent.net/products/lucent-marine-collagen` (live theme `lucent-marine-collagen-theme-7`,
pulled file-by-file through the Shopify Admin API) plus full-page Chromium captures on 2026-09-23.

## 1. The original site, feature by feature

### Page lengths (measured, full-page render)
| Page | Desktop 1440px | Mobile 390px |
|---|---|---|
| Product page | 9,879 px (~11 screens) | 13,069 px (~15 screens) |
| Home page | 4,033 px | — |
| Cart / contact / shipping / 404 | 1,000–1,400 px | 1,500–2,400 px |

### Product page, top to bottom (17 blocks)
1. Sale countdown bar (counts to local midnight, resets daily) · 49 px
2. Sticky header: hamburger drawer nav, centred wordmark, cart bag with live count
3. Buy box: 6-image gallery (arrows, thumbs, touch swipe) + rating line + "bottles shipped" pill + eyebrow + H1 + lead + 3 check bullets + price / compare / save badge + **KaChing bundle app block** + ship bar + add-to-cart (AJAX → drawer) + 3 guarantee badges + 3 accordions
4. Jump nav (6 anchors)
5. Three-phone video section (poster + custom play button, one plays at a time) + CTA
6. "Featured on" press marquee (marie claire / Glamour / Strategist)
7. How-it-works band: GIF phone (260×462, 5 s, 10 fps) + copy + sign-off
8. Animated stat counters (94 / 89 / 97 %) on dark band
9. Why-it-works: 3 icon cards
10. Testimonials: 3 avatar cards
11. Second GIF band (dark) + CTA
12. Compare table (Lucent vs powders & gummies)
13. What's-inside ingredient list + allergen `<details>`
14. Reviews: 4.9 big number, 5-bar breakdown, 3 review cards, "See more" (adds 3), "Write a review" modal (name / stars / text / validation)
15. FAQ (6 `<details>`)
16. Final dark CTA (submits the product form)
17. Sticky add-to-cart bar (IntersectionObserver on the buy box)
Plus: slide-in AJAX cart drawer (qty ± / remove / secure checkout / payment logos), write-a-review modal.

### Other pages / features
Home (hero + promise strip + GIF teaser + why + testimonials + press + CTA + sticky quick-shop), cart page (line steppers via `/cart/change.js`, reload), contact form, shipping & returns, 404 with auto-redirect of dead product URLs, search, collection, password, two hidden advertorial landers (`glow-trend` "aged backwards" story, `ranked-guide` 5-format ranking) with their own header/footer, gift card + customer templates. Fonts Fraunces + Hanken Grotesk; palette plum `#3B2145` / mauve `#A0527E` / gold `#E9C983` / bone `#F7F2EC`.

## 2. What was rebuilt (`lucent-nattokinase-theme.zip`)

Every block above is present. Changes on purpose:
* **KaChing app block → native bundle picker** (1 / 2 / 3 bottles). Reads real variants when they exist (see `product-import.csv`), else quantity tiers. Price, badge, button, sticky bar and hidden form fields all update; the 700-line KaChing DOM-scraping bridge was deleted.
* **Palette re-tuned** to the product (ink `#15161B`, garnet `#8E2C2C`, gold `#E7C873`, cream `#F6F2EA`); fonts, grid, spacing, radius scale and section order unchanged.
* **Press marquee → trust marquee** (10,800 FU · third-party tested · made in USA · enteric-coated · soy-free · non-GMO). The original's fake magazine logos are a liability for a supplement brand.
* Settings schema added (featured product, favicon, support email, sale bar) — the original referenced settings that didn't exist.
* Cart drawer not rendered on campaign pages (it had no opener there).
* All brand strings → Lucent. Zero occurrences of the supplier brand in any file.

### Copy: what was borrowed from the ads and comparable listings (paraphrased, not copied)
Japan longevity + natto-for-generations framing · "at least 10,000 FU" threshold → "10,800 FU per capsule" · "five or six servings of natto" · natto's acquired taste / smell · enteric-coated "makes it through the stomach" · soy-free, third-party tested, made in USA · "flying off the shelves" → "bottles shipped this month" · one capsule replaces a four-bottle stack. Comparable Amazon/DTC nattokinase listings all lead with FU count, fibrin balance, circulation, delayed-release and per-batch testing, which is the vocabulary used in the buy box and compare table. Disease claims from the ads ("clears 95% of the pipes", "reduces plaque 36%") were deliberately **not** carried over.

### Media
| Asset | Source | Placement (matches original) |
|---|---|---|
| `gif-how-to.gif` | Ad 1, 0:32–0:37 (man holding bottle) | How-it-works band |
| `gif-glow.gif` | Ad 3, 1:01–1:06 (woman with bottle) + burned caption | Second dark band |
| `gif-hero-teaser.gif` | Ad 1, 0:59–1:04 (capsule in hand) + caption | Home teaser |
| `demo-creator-review.mp4` | Ad 1, brand mention cut at 0:32 | Video 1 |
| `demo-quick-demo.mp4` | Ad 3 (no brand mention) | Video 2 |
| `demo-pop.mp4` | Ad 2, brand mention cut at 1:04 | Video 3 + viral-clip lander |
| `demo-before-after.mp4` | Ad 4, brand mention cut at 0:58 | Ranked-guide lander |
| 10 product images | Original Lucent-branded renders: hero (badge layout per client reference), four actives, how-to-take with titration, 5× FU compare, 4-in-1 natto, enteric coated, capsule-to-bloodstream, generations of natto, survey stats, supplement facts. Same gallery concepts as the source listing, no copied assets. | Gallery |

**Honest limitation:** the ad footage shows the supplier's physical bottle. At 260 px the emblem is unreadable but present. Higgsfield could not be reached from this environment (no connector, no API key), so no AI-generated replacement clips were made. The ads *do* look as good as the originals' creator GIFs (same selfie/phone format), so they are usable as-is.

## 3. The three checks (measured, not estimated)

**Check 1 — software engineer.** Every page rendered locally through a Liquid harness with mocked Shopify cart endpoints and driven in Chromium at 1440 px and 390 px: every in-page anchor resolves, every button has a handler or a form, every image loads, menu/cart drawers open and close, bundle cards update price/qty/variant, add-to-cart → drawer → qty ± → remove, final CTA and sticky bar submit the form, checkout form posts `checkout` to `/cart`, review modal validates and submits, "see more" adds 3 reviews, videos play, stat counters animate, no horizontal scroll, no console errors. Result: **28/28 page×viewport runs clean (100 %)** in both 3-variant and single-variant product modes. Liquid tag balance and JSON validity: 0 errors.

**Check 2 — graphic designer / vibe-code audit.** Tells checked: emoji-as-icon, sparkle/rocket, spaced em-dashes, purple-blue gradients, gradient text, glassmorphism, colored-left-border cards, gradient initial avatars, icon-library dependence, "it's not X, it's Y" copy, generic buzzwords. Found and removed: 4 colored-left-border rules, gradient avatars, gradient sale bar, fake-magazine marquee styling, unstyled campaign header. Remaining pill radii and 3-card grids are the template's own idiom and kept. Result after fix: **0 tells present**.

**Check 3 — general.** Add-to-cart, drawer, cart page steppers, checkout submission, contact form, password form, 404 redirect and all nav/footer links verified in the same run. One real-store step is outside what can be tested locally: Shopify's hosted checkout itself, which the theme reaches through the standard `name="checkout"` form post.
