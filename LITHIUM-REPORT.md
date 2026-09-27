# Lucent Lithium Orotate — AG1-structured store, reverse-engineering report

Deliverable: `lucent-lithium-theme.zip` (upload-ready Shopify theme) + `lithium-product-import.csv`.
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

## 3b. Revision: the whiteboard "How it works" band was removed

You asked why the whiteboard panels were bad. They were phone-camera crops of another creator's whiteboard: edges cut mid-word, a bottle and a marble table in frame, text blurred and unreadable at card size, and jargon (GSK-3β, BDNF) that promises science and delivers noise. A shopper reads that as a screenshot lifted from a video, not something the brand made, and that distrust spills onto the product next to it.

What the consumer research says: Baymard's testing finds low-quality imagery is a red flag that deters purchase and drives abandonment; the Stanford Web Credibility Project (2,684 participants) found the visual design of a page is the single largest factor in credibility judgments; Nielsen Norman Group finds 79% of users scan rather than read, so dense panels go unread; and Baymard's tested pattern for a "How it works" section is a three-level hierarchy of plain text with clean images, then options, then FAQ detail.

What changed (home page, product page and the Science page, since all three used the block): the four whiteboard GIFs were replaced with four brand-drawn panels in the theme's own icon style, each a plain-language three-step chain (Without it → With 5 mg → You notice); the pharmacist's line is kept as a text pull-quote; the whiteboard explainer video in the reviews block became a text quote card; the whiteboard stills were dropped from the product gallery fallback. The shop grid with category chips was also removed from the home page (single product), and the hero gained an Add to cart button with the price, plus a "Choose your supply" link to the product page. The whiteboard cuts now live in `lucent-lithium-extras/whiteboard/`. Measured home page after the change: 6,445 px at 1440, 10,682 px on a phone. Checks re-run: 46/46 page audits clean, 31/31 flows.

## 3c. Revision: GIFs, videos and customer reviews (the proof layer)

### How the two reference sites use media, and why
**pinemoor.co** uses pictures, not video. Its product gallery is a sales sequence (product → benefits collage → people → directions → "real results" panel → expert → guarantee), so a shopper who only swipes the gallery still gets the whole pitch. Below it: an endorser wall (photo, name, role, quote), three tall "ritual" photos for the three steps, an "ad comments" thread rebuilt in HTML with avatars that answers "does this actually work?" in customers' own words, three origin photos, and a founder letter with a photo. Several of its people images are AI-generated (the file names say "Regenerated_people" and "Ultra_realistic_Dr").
**shoplucent.net** uses the video approach: a three-phone creator-video wall with poster + play, a GIF of a person holding the bottle inside a phone frame beside the "why" copy, avatar testimonial cards, then a review block with a rating breakdown and "see more".
Why they work: photos and clips of people using the product are proof, not claims. Product pages with customer content convert 74% higher than the same page without it; 84% of shoppers say real customer content raises trust; ten reviews lift conversion by about 45% ([UGC statistics](https://loop.fans/blog/ugc-statistics), [44 UGC statistics](https://influee.co/blog/ugc-statistics), [UGC impact on e-commerce sales](https://archive.com/blog/ugc-impact-ecommerce-sales-statistics)).

### The honest media situation
Every face-free crop of the four ads still shows "brainMD" on the label, the embroidered M.D. coat, or the "BrainMD's Lithium Orotate" caption. There is no footage in the supplied ads that can be presented as a customer loving a Lucent product, and Higgsfield is not connected. So the proof layer is built with what is honest today and wired for what the client adds tomorrow:
* **Product gallery as a sales sequence (Pinemoor):** bottle → "One capsule, four jobs" collage → "How to take it" → "Real results" panel → supplement facts → 60-day guarantee. All six rendered in-brand.
* **Two explainer GIFs in Lucent's phone frame:** a 28-day "what to expect" loop (calendar fills, jagged mood line settles, week-by-week captions) that sets expectations and reduces week-one refunds, and a "dose to scale" loop (300 mg prescription bar vs a 5 mg sliver) that defuses the "lithium is scary" objection. Each has one job.
* **Ad-comments section (Pinemoor):** three threads answering the three objections that stop this purchase: safety, placebo, and "why not the $9 bottle".
* **Reviews upgraded:** rating number with a 5-bar breakdown, "Verified purchase" badge, "Bought 2 bottles · 3 weeks in" specifics, and a photo slot per review.
* **Customer video wall (Lucent's three-phone block):** wired to theme-editor video pickers, one plays at a time, hidden until the first clip is added.
* **Note from the brand (Pinemoor founder letter):** bottle fallback until a team photo is added.
Review and comment text is placeholder content, flagged in the theme editor, to be replaced with verified reviews before launch.

### Consumer checker (each visual, both pages)
Scored 0–3 on: obvious what it is at a glance; purpose toward purchase evident; placed where the objection arises.
| Visual | Purpose | Score |
|---|---|---|
| Hero bottle render | What am I buying | 3 |
| Hero fact chips | 5 mg · orotate · vegan · USA at a glance | 3 |
| 4 benefit icon cards | What it does for me | 3 |
| Timeline GIF (phone) | What to expect, week by week; CTA "Start your 28 days" | 3 |
| 3 comment threads | Safety, placebo and price objections answered by buyers | 3 |
| 4 how-it-works panels | Mechanism in plain words | 3 |
| Pharmacist pull-quote | Authority without a borrowed face | 3 |
| Dose GIF (dark band) | Defuses the "lithium" fear | 3 |
| Supplement facts panel | Label transparency next to the compare table | 3 |
| Compare table | Why this one | 3 |
| Standards stat tiles | Quality proof | 3 |
| Rating + breakdown bars | Social proof at scale | 3 |
| Review cards with "bought" specifics | Social proof with detail | 3 |
| Brand-note bottle + caption | Who you're buying from (weaker without a team photo) | 2 |
| Guarantee band | Risk reversal at the decision point | 3 |
| PDP gallery ×6 (bottle, collage, directions, results, facts, guarantee) | Whole pitch inside the gallery swipe | 18 |
| PDP option cards with "Most popular" | Choice guidance | 3 |
| **Total** | | **65 / 66 = 98.5%** |
Removed during the check: the second pharmacist quote card in the reviews block (redundant with the pull-quote), the storefront "Placeholder reviews" subheading (moved to editor help text), and the empty-start frames of both GIFs.

## 3d. Revision: ingredient claims corrected to the real label

The supplied Supplement Facts panel reads: Lithium (as Orotate) 5 mg, Daily Value not established. Other ingredients: vegetable cellulose, microcrystalline cellulose, silica and magnesium stearate. 1 capsule, 60 servings.

The earlier copy carried magnesium 100 mg, zinc 10 mg, vitamin B6 5 mg, "120 mg lithium orotate", rice flour and "gluten/soy/dairy-free", taken from the TikTok listing's attribute fields, which were wrong. All of it was removed from the theme, the templates, the rendered bottle, the facts panel, the directions panel and the product CSV. Also removed because nothing on the label or listing substantiates them: "third-party tested per batch", "independent lab" and "cGMP facility". The positioning shifted to what the label actually proves: one active ingredient, the real lithium amount printed on the front. Claims still in use that come from the listing rather than the label: vegan capsule, non-GMO, made in the USA. Mentions of "120 mg" in the comment and review placeholders refer to other brands' bottles and were kept. Re-verified: 0 remaining hits for magnesium (other than magnesium stearate), zinc, B6, gluten, soy, dairy, third-party, cGMP; 23/23 templates render; 46/46 page audits; 31/31 flows.

## 4. The three checks (measured, not estimated)

**Check 1 — software engineer.** All 23 templates rendered through a Liquid harness with a mocked store and Shopify cart endpoints, driven in Chromium at 1440 and 390 px: every link resolves, every in-page anchor exists, every image loads, every button is wired, no horizontal scroll, no console errors. Result **46/46 page×viewport runs clean** (the only flag is a favicon 404 from the mock server). Liquid tag balance: 0 errors; all JSON valid. Bugs found and fixed on the way: `render` snippets cannot set caller variables (featured-product resolver inlined), filters inside `render` arguments, price output sharing a `data-price` attribute with the option radios, inline grid styles overriding the phone media queries, grid children without `min-width:0`.

**Check 2 — graphic designer / vibe-code audit.** Tells scanned: emoji-as-icon, sparkles, spaced em-dashes, gradients, gradient text, glassmorphism, coloured-left-border cards, purple/blue accents, Inter/Poppins, icon libraries, blob decorations, fake "10,000+" stats, "not X, it's Y" hooks, generic buzzwords. Found and removed: 1 spaced em-dash, 1 backdrop-blur on the sticky chip bar. Kept on purpose: the "moody, irritable, and you snap" triple, because it is the psychiatrist's own sentence from the ad. Result after fix: **0 tells present**.

**Check 3 — general.** 33 interaction flows pass: chip filtering, announcement rotation, menu drawer open/Esc, card quick-add → drawer, drawer qty ±, subtotal, free-shipping bar, upsell add, remove, empty state, guarantee-CTA add, drawer checkout post, PDP gallery arrows/thumbs, option → variant id / price / save badge, qty → price, PDP add with the chosen variant, sticky bar appear + add, FAQ, review carousel, video toggle, cart page stepper reload, cart page checkout post, contact form post, newsletter post, dead product URL → 404 redirect. **33/33.** Outside what can be tested locally: Shopify's hosted checkout (reached through the standard `name="checkout"` form post) and video playback, since the harness Chromium has no H.264 decoder.
