# Lucent Lithium Orotate — AG1-structured store, reverse-engineering report

Deliverable: `lucent-lithium-theme.zip` (upload-ready Shopify theme, 7.1 MB) + `lithium-product-import.csv`.
Source product: BrainMD Lithium Orotate, 60 capsules (TikTok Shop listing: 120 mg lithium orotate, magnesium 100 mg, B6 5 mg, zinc 10 mg, vegan, non-GMO, US-made, 24-month shelf life). Rebranded as **Lucent Lithium Orotate**, matching the rest of this repo.
Structural source: `https://drinkag1.com/shop`.

## 1. drinkag1.com/shop — what could and could not be captured

**I could not load the AG1 site from this environment.** Every route was tried: plain fetch (HTTP 429), headless and headed Chromium (stuck on the Vercel Security Checkpoint for 60 s), the jina.ai reader mirror (429), WebFetch (429), the Wayback Machine (April 2026 snapshot exists, but web.archive.org is blocked by this container's egress policy) and archive.ph (connection reset). AG1 is rate-limiting datacenter IPs at the edge.

So the AG1 anatomy below is reconstructed from my own knowledge of the page and public descriptions, not measured. **Page lengths for AG1 are estimates; the lengths of the rebuilt pages are measured.**

### AG1 /shop anatomy (reconstructed)
| # | Block | What it does |
|---|---|---|
| 1 | Announcement bar | rotating offer messages (free Welcome Kit, free shipping, guarantee) with prev/next |
| 2 | Sticky header | logo, nav (Shop / AG1 / AGZ / Science / Learn / About), account, cart with count |
| 3 | Shop hero | H1 + short subhead, product image, rating line |
| 4 | Sticky category chips | All / AG1 / AGZ / Bundles / Accessories, filter the grid in place |
| 5 | Product cards | image with badge, title, stars + count, blurb, price + per-month, "Subscribe & save", Add / Details |
| 6 | Welcome-kit value stack | "what's included" checklist with every first order |
| 7 | Benefits band | 4 icon cards (gut, immune, energy, focus) |
| 8 | Replacement chart | "one scoop replaces…" comparison table |
| 9 | Science / standards | NSF Certified for Sport, third-party tested, stat tiles, ingredient panel |
| 10 | Reviews | big rating number, carousel with arrows, a video |
| 11 | FAQ | accordion |
| 12 | Guarantee CTA | 90-day money-back band with add-to-cart |
| 13 | Footer | Shop / Learn / Support columns, newsletter, legal, FDA disclaimer |
| — | Cart drawer | slide-in, free-shipping progress bar, one-tap upsell, qty ±, remove, checkout, payment logos |
| — | PDP | sticky gallery with thumbs, purchase-option radio cards (subscribe vs one-time, badge on the popular one), qty, ATC with live price, trust row, accordions, sticky add-to-cart bar, then the same benefit/science/review/FAQ sections |

Estimated AG1 lengths: shop page ~7,500–9,000 px at 1440 (about 9 screens), ~13,000–15,000 px on a phone; PDP similar; support pages 1–2 screens.

## 2. What was built (all 13 blocks + drawer + PDP, in the same order)

### Measured lengths of the rebuilt pages
| Page | 1440 px desktop | 390 px phone |
|---|---|---|
| Shop (home) | 8,057 px (9 screens) | 14,804 px |
| Product page | 6,885 px | 11,898 px |
| Science page | 4,184 px | 7,563 px |
| FAQ page | 1,646 px | 2,245 px |
| Collection, cart, contact, shipping, account pages | 1,100–1,400 px | 1,800–2,600 px |

### Files
| Area | Files |
|---|---|
| Layout | `layout/theme.liquid`, `layout/password.liquid` |
| Shop page sections | `shop-hero`, `shop-grid` (chips + one card per pack size + any other product + value stack), `benefits`, `science` (4 GIF panels), `replaces` (compare table + facts panel), `standards` (dark stat band + ingredients), `reviews` (carousel + explainer video), `faq`, `guarantee-cta` |
| PDP | `sections/main-product.liquid`: gallery (arrows, thumbs, swipe), purchase-option cards for every variant, selling-plan cards if a subscription app adds plans, qty stepper, live price / compare / save %, trust row, accordions, sticky bar |
| Chrome | `snippets/announcement`, `header` (desktop nav + mobile drawer), `footer` (newsletter form), `cart-drawer` (AJAX: free-shipping bar, upsell, qty, remove), `product-card`, `icon`, `stars` |
| Templates | index, product, collection, cart, page, page.contact, page.faq, page.science, page.shipping-returns, 404 (redirects dead product URLs), search, list-collections, blog, article, password, gift_card, customers/* (7 real forms) |
| Assets | `lucent.css`, `lucent.js`, bottle renders, supplement-facts panel, 4 whiteboard GIFs + mp4 + posters, explainer video |

Install: upload the zip, import `lithium-product-import.csv` (replace the image URLs after uploading the images from `assets/`), create pages `contact`, `faq`, `science`, `shipping-returns` with those templates, pick the product under Theme settings → Store if the handle is not `lucent-lithium-orotate`.

## 3. Ads, GIFs and the honest media situation

Four ads were supplied and transcribed (Whisper): a psychiatrist in a white coat holding the BrainMD bottle (ads 1 and 4, same footage, 19 s), a physician talking head with the "7UP / Uncola" story plus BrainMD bottle close-ups (ad 2, 61 s), and a pharmacist at a table with four hand-drawn whiteboard explainer cards (ad 3, 58 s).

**What I used:** the four whiteboard cards from ad 3 ("How lithium reduces neurotoxicity / increases creative thinking / increases mood stability / increases stress regulation") are the only footage with no face and no competitor label. They are cut as stills plus slow-push GIF loops (`gif-brain/creative/mood/stress.gif`, ~1.1 MB each, mp4 twins included) and placed in the **How it works** band, which is where AG1 puts its product loops. The 14-second `explainer.mp4` in the reviews block is the same whiteboard footage with the pharmacist's audio, cut before he names the competitor.

**What I deliberately did not put on the page, and why you should not either:** every other clip shows the BrainMD bottle, and three of the four ads feature identifiable doctors. Cutting them into a Lucent-branded store would (a) show a competitor's label and (b) read as those doctors endorsing Lucent, which they do not. These clips are cut anyway and sit in `lucent-lithium-extras/` (compressed ads + `optional-bottle-hands.gif`, `optional-cupboard.gif`) so you can decide, but they are not referenced by the theme.

**Higgsfield:** there is no Higgsfield connector in this session and no API key, so no generated clips. The GIF slots that AG1 fills with lifestyle loops (hero, product cards) currently show a rendered bottle placeholder (`bottle-hero.jpg`, `bottle-white.jpg`), made in code because the only clean product image available is the 200-px listing thumbnail with BrainMD's label. **Real product photography of the Lucent bottle is the one thing this theme is waiting on.**

### Language borrowed from the ads (paraphrased into the site)
"If you find that you're moody, irritable, you snap, and you feel bad about it later" → benefits headline · "more level over time" → "what level feels like", review copy · "the most underused supplement for brain health" → shop hero H1 · "microdosed lithium, 5 milligrams" → eyebrow, stat tiles · "replaces what we've pulled out of our food and water" → hero body · "less neurotoxicity, more stability, plasticity, creative thinking, mood and stress regulation" → the four science panels · "you have to make sure it's lithium orotate, in the elemental form that works" → compare-table intro · "the mineral, not the drug" (7UP story) → compare-table headline and FAQ #1. Research-doc structure (headlines / hooks / objections / FAQ / phrase bank) was used for the FAQ objections and the review angles; there is no Littley/lithium research doc in Drive, only the EVOLVE V5.0 template.

**Compliance:** everything is written as structure/function language with the FDA disclaimer in the footer, standards band and PDP. The ads' "depressed people are deficient in lithium" framing and any disease language were left out on purpose; the compare table also carries a note that prescription lithium is not comparable.

## 4. The three checks (measured, not estimated)

**Check 1 — software engineer.** All 23 templates rendered through a Liquid harness with a mocked store and Shopify cart endpoints, driven in Chromium at 1440 and 390 px: every link resolves, every in-page anchor exists, every image loads, every button is wired, no horizontal scroll, no console errors. Result **46/46 page×viewport runs clean** (the only flag is a favicon 404 from the mock server). Liquid tag balance: 0 errors; all JSON valid. Bugs found and fixed on the way: `render` snippets cannot set caller variables (featured-product resolver inlined), filters inside `render` arguments, price output sharing a `data-price` attribute with the option radios, inline grid styles overriding the phone media queries, grid children without `min-width:0`.

**Check 2 — graphic designer / vibe-code audit.** Tells scanned: emoji-as-icon, sparkles, spaced em-dashes, gradients, gradient text, glassmorphism, coloured-left-border cards, purple/blue accents, Inter/Poppins, icon libraries, blob decorations, fake "10,000+" stats, "not X, it's Y" hooks, generic buzzwords. Found and removed: 1 spaced em-dash, 1 backdrop-blur on the sticky chip bar. Kept on purpose: the "moody, irritable, and you snap" triple, because it is the psychiatrist's own sentence from the ad. Result after fix: **0 tells present**.

**Check 3 — general.** 33 interaction flows pass: chip filtering, announcement rotation, menu drawer open/Esc, card quick-add → drawer, drawer qty ±, subtotal, free-shipping bar, upsell add, remove, empty state, guarantee-CTA add, drawer checkout post, PDP gallery arrows/thumbs, option → variant id / price / save badge, qty → price, PDP add with the chosen variant, sticky bar appear + add, FAQ, review carousel, video toggle, cart page stepper reload, cart page checkout post, contact form post, newsletter post, dead product URL → 404 redirect. **33/33.** Outside what can be tested locally: Shopify's hosted checkout (reached through the standard `name="checkout"` form post) and video playback, since the harness Chromium has no H.264 decoder.
