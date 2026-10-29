# LMTY Wellness Drops: one prompt for ChatGPT

Paste everything inside the box into a new ChatGPT chat (a model with image generation and file downloads). If it stops partway, reply **"continue with the next image"** until all 13 are done, then **"now build the zip"**.

---

```
You are a senior e-commerce product photographer and retoucher. Create the complete image set for a Shopify product page, then give me ONE downloadable .zip containing every image.

PRODUCT
LMTY Wellness Drops: lemon-flavored wellness drops you add to hot or cold water. 60 ml (2 fl oz) amber glass Boston-round dropper bottle with a black rubber-bulb dropper cap. Cream matte paper label printed with, top to bottom:
- "LMTY" (large, bold, black sans-serif)
- a thin gold line
- "WELLNESS DROPS" (small bold black capitals)
- "Lemon flavor" (warm amber)
- a small round gold seal reading "ZERO SUGAR"
- "2 FL OZ · 60 mL · 30 SERVINGS" (small, bottom)
Brand palette: warm cream #FAF3E6, honey #F5CD8B, lemon/amber #E39617, espresso brown #2B1A0D. Mood: cozy, warm, comforting, premium wellness (think AG1, Pinemoor).

REALISM RULES (apply to every image)
- Must look like a real photo shot on a full-frame camera with an 85mm or 100mm macro lens, natural depth of field, true-to-life glass reflections and refraction, real paper texture on the label, soft natural shadows, subtle surface imperfections.
- Real light: soft late-afternoon window light or a large softbox. No glowing edges, no plastic or CGI look, no oversaturated colors, no AI "sheen".
- Hands must look natural: five fingers, correct proportions, realistic skin texture and nails.
- Label text must be spelled exactly as above, sharp and legible. Never invent other words or logos.
- The bottle must be IDENTICAL in every image (same shape, cap, label layout). Use image 1 as the reference for all later images.
- No watermarks, no borders, no text overlays unless an image below asks for text.

IMAGES (generate one at a time, in this order; show me each one before moving on)
1. lmty-drops-main.jpg (1:1): the bottle upright, centered, facing camera, on a warm cream stone surface; a fresh lemon cut in half with a mint sprig to the right; a white ceramic mug of steaming tea softly out of focus to the left; smooth cream-to-butter-yellow background.
2. lmty-life-mug.jpg (1:1): a hand holding the black dropper over a cream ceramic mug of steaming hot water with a thin lemon slice floating; golden drops falling in; mug on a chunky knitted cream blanket on a sofa; an open paperback and the LMTY bottle beside it; warm evening lamp light.
3. lmty-life-drop.jpg (4:5 portrait): a hand squeezing the black dropper above a tall clear glass of iced water; one golden-yellow drop falling in, the water turning pale lemon; ice, condensation, lemon wedge on the rim; bright cream kitchen counter; morning window light.
4. lmty-drops-3pack.jpg (1:1): three identical LMTY bottles side by side in a slight arc, middle one forward, labels readable; warm cream seamless background; soft studio light.
5. lmty-drops-6pack.jpg (1:1): six identical LMTY bottles in two neat rows of three, back row slightly raised; warm cream seamless background.
6. lmty-drops-benefits.jpg (1:1): left half the bottle, large; right half three stacked rows, each a dark-brown circle icon with bold dark text: coffee cup "Café-Style Comfort", crossed-out sugar cube "Zero Added Sugar", water drop "30 Servings Per Bottle"; cream-to-honey gradient background.
7. lmty-drops-directions.jpg (1:1): cream background; headline "Directions for Use", small orange capitals "SIMPLE. DAILY. TWO SECONDS."; four white rounded cards with dark-brown icons: "1. Shake well: Give the bottle a quick shake." / "2. One full dropper: About 2 mL, once a day." / "3. Into your mug: Hot water, cold water or your tea." / "4. Stir & sip: Warm and cozy, or over ice."; the bottle on the right.
8. lmty-drops-compare.jpg (1:1): espresso-brown background; small honey capitals "THE COZY CUP, WITHOUT THE CAFÉ"; big cream headline "Skip the drive-thru."; table with columns "LMTY Drops" (honey highlight) | "Tea bag + honey" | "Café cup" and rows: Ready in seconds ✓ ✗ ✗ · No steeping, no line ✓ ✗ ✗ · Zero added sugar ✓ ✗ ✗ · Hot or iced ✓ ✓ ✓ · Fits in your bag ✓ ✗ ✗ · Cost per cup: Under $1 / ~$1 / $5+; small bottle top-right.
9. lmty-drops-guarantee.jpg (1:1): cream background, centered; large dark-brown circle with a cream shield-check icon; headline "Damage-Free Delivery Guarantee"; line "Arrives damaged? Email us a photo and we'll send a replacement, free."; outlined pill "Plus 30-day returns on unopened bottles".
10. blend-lemon.jpg (1:1): tight close-up of a halved lemon with a small mint sprig on a cream surface.
11. blend-tea.jpg (1:1): tight close-up of loose green tea leaves on a cream ceramic plate.
12. blend-cup.jpg (1:1): tight close-up of a cream mug of steaming lemon tea with a lemon slice, on a knitted blanket.
13. blend-drop.jpg (1:1): extreme macro of a black glass dropper tip with one golden drop about to fall, soft blurred cream background.

QUALITY CHECK (before moving to the next image)
Look at each image and regenerate it if: the label is misspelled or different from image 1, a hand looks wrong, the bottle shape changed, any extra text or logo appears, or it looks CGI/plastic.

FINAL FILE
When all 13 are approved, use Python to:
- save each image with the exact file name above, as high-quality JPG (quality 92)
- size: 1080 x 1080 for 1:1 images; 1080 x 1350 for image 3
- put all 13 into one folder named "lmty-drops-images" and zip it as "lmty-drops-images.zip"
- give me the download link to the .zip, plus a list of the files inside it.
```

---

When you have the zip, send it back in this chat and the images go straight into the theme.
