# Turn on Subscribe & Save (5 minutes)

The theme is already built for it: when the page opens, **Buy 3 Get 3 FREE** is selected and **Subscribe & Save** is ticked.
The Subscribe & Save box stays hidden until a subscription plan exists, because Shopify only lets a subscription app create plans.

## 1. Install the app
Shopify admin → Apps → search **Shopify Subscriptions** (free, made by Shopify) → Install.
It needs Shopify Payments (or another payment provider that supports subscriptions) turned on.

## 2. Create 3 plans, one per bundle
Each bundle gets its own plan so every subscription price ends in .99.

| Plan name | Product / variant | Delivery | Discount | Subscription price | Per bottle |
|---|---|---|---|---|---|
| Subscribe & Save | LMTY Wellness Drops: **1 Pack only** | Every 1 month | Amount off: **$5.00** | $24.99 | $24.99 |
| Subscribe & Save | LMTY Wellness Drops: **3 Pack only** | Every 1 month | Amount off: **$6.00** | $41.97 | $13.99 |
| Subscribe & Save | LMTY Wellness Drops: **6 Pack only** | Every 1 month | Amount off: **$12.00** | $59.94 | $9.99 |

Shopify Subscriptions → Plans → Create plan → set Delivery frequency to every 1 month → set Discount to the amount above → under Products, add the product and select **only that one variant**.
Then do the same for the other two variants.

Important: don't put all three variants in one plan. One shared discount can't land every bundle on .99.

## 3. Check it
Open the product page. You should see:
- Buy 3 Get 3 FREE selected, Subscribe & Save ticked, **$9.99/bottle**
- Untick Subscribe & Save: **$11.99/bottle**
- Buy 2 Get 1 FREE with subscription: **$13.99/bottle**; without: **$15.99/bottle**
- Buy One with subscription: **$24.99**; without: **$29.99**

If the app can't select single variants, or the prices don't match, add `?lmty-debug=1` to the product page URL and send a screenshot.
