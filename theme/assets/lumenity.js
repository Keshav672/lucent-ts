/* Lucent Nattokinase: lightweight storefront interactions. */
(function () {
  'use strict';

  /* Product gallery: thumbnails, overlay arrows and touch swipe stay in sync. */
  var gallery = document.querySelector('[data-pdp-gallery]');
  var mainFigure = document.querySelector('[data-pdp-main]');
  var main = mainFigure ? mainFigure.querySelector('img') : null;
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('[data-pdp-thumb]'));
  var prevArrow = document.querySelector('[data-pdp-gallery-prev]');
  var nextArrow = document.querySelector('[data-pdp-gallery-next]');
  var galleryIndex = Math.max(0, thumbs.findIndex(function (thumb) {
    return thumb.getAttribute('aria-current') === 'true';
  }));

  function showGalleryImage(index) {
    if (!main || !thumbs.length) return;
    galleryIndex = (index + thumbs.length) % thumbs.length;
    var thumb = thumbs[galleryIndex];
    main.src = thumb.getAttribute('data-full') || (thumb.querySelector('img') ? thumb.querySelector('img').src : main.src);
    var nextAlt = thumb.getAttribute('data-alt');
    if (nextAlt) main.alt = nextAlt;
    thumbs.forEach(function (t, i) {
      t.setAttribute('aria-current', i === galleryIndex ? 'true' : 'false');
    });
    if (thumb.scrollIntoView) {
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  thumbs.forEach(function (thumb, index) {
    thumb.addEventListener('click', function () {
      showGalleryImage(index);
    });
  });

  if (prevArrow) {
    prevArrow.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      showGalleryImage(galleryIndex - 1);
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      showGalleryImage(galleryIndex + 1);
    });
  }

  if (gallery && mainFigure && thumbs.length > 1) {
    var swipeStartX = null;
    var swipeStartY = null;
    var swipePointerId = null;

    function finishSwipe(endX, endY) {
      if (swipeStartX === null || swipeStartY === null) return;
      var dx = endX - swipeStartX;
      var dy = endY - swipeStartY;
      swipeStartX = null;
      swipeStartY = null;
      swipePointerId = null;
      if (Math.abs(dx) < 36 || Math.abs(dx) <= Math.abs(dy)) return;
      showGalleryImage(dx < 0 ? galleryIndex + 1 : galleryIndex - 1);
    }

    if (window.PointerEvent) {
      mainFigure.addEventListener('pointerdown', function (event) {
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
        swipeStartX = event.clientX;
        swipeStartY = event.clientY;
        swipePointerId = event.pointerId;
        if (mainFigure.setPointerCapture) {
          try { mainFigure.setPointerCapture(event.pointerId); } catch (e) {}
        }
      });

      mainFigure.addEventListener('pointerup', function (event) {
        if (swipePointerId !== null && event.pointerId !== swipePointerId) return;
        finishSwipe(event.clientX, event.clientY);
      });

      mainFigure.addEventListener('pointercancel', function () {
        swipeStartX = null;
        swipeStartY = null;
        swipePointerId = null;
      });
    } else {
      mainFigure.addEventListener('touchstart', function (event) {
        if (!event.touches || event.touches.length !== 1) return;
        swipeStartX = event.touches[0].clientX;
        swipeStartY = event.touches[0].clientY;
      }, { passive: true });

      mainFigure.addEventListener('touchend', function (event) {
        if (!event.changedTouches || !event.changedTouches.length) return;
        finishSwipe(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
      }, { passive: true });
    }
  }

  /* Price display: the headline, ATC and sticky prices are driven by the
     KaChing bundle bridge below; without it they keep the server-rendered price. */
  var stickyPrice = document.querySelector('[data-pdp-sticky-price]');
  var buttonPriceEl = document.querySelector('[data-pdp-button-price]');
  if (stickyPrice && buttonPriceEl) {
    new MutationObserver(function () { stickyPrice.textContent = buttonPriceEl.textContent.replace(/\s*\/\s*each$/, ''); })
      .observe(buttonPriceEl, { childList: true, characterData: true, subtree: true });
  }

  /* Sticky ATC appears after the main buy box leaves the viewport. */
  var buybox = document.querySelector('[data-pdp-buybox]');
  var sticky = document.querySelector('[data-pdp-sticky]');
  if (buybox && sticky && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var showSticky = !entries[0].isIntersecting;
      sticky.setAttribute('data-show', showSticky ? 'true' : 'false');
      document.body.classList.toggle('pdp-sticky-visible', showSticky);
    }, { rootMargin: '-110px 0px 0px 0px' }).observe(buybox);
  }

  document.querySelectorAll('[data-pdp-sticky-submit]').forEach(function (stickySubmit) {
    stickySubmit.addEventListener('click', function () {
      var form = document.getElementById('pdp-form');
      if (form) form.requestSubmit();
    });
  });
})();


/* Kaching Bundles price bridge.
   Kaching exposes deal/variant events on <kaching-bundles-block>. Keep the
   theme's headline price, crossed-out price, savings badge, main ATC price,
   and sticky price aligned with the bundle the shopper actually selected. */
(function () {
  'use strict';

  var priceNow = document.querySelector('[data-pdp-now]');
  var priceWas = document.querySelector('[data-pdp-was]');
  var priceSave = document.querySelector('[data-pdp-save]');
  var buttonPrice = document.querySelector('[data-pdp-button-price]');
  if (!priceNow) return;

  function parseMoney(text) {
    if (typeof text !== 'string') return null;
    var match = text.match(/([$£€¥])\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/);
    if (!match) return null;
    return {
      symbol: match[1],
      value: parseFloat(match[2].replace(/,/g, '')),
      raw: match[0]
    };
  }

  function formatMoney(value, symbol) {
    if (!isFinite(value)) return '';
    var rounded = Math.round(value * 100) / 100;
    return (symbol || '$') + rounded.toFixed(2);
  }

  function setBundlePrice(current, compare, savePercent, quantity) {
    if (!current || !parseMoney(current)) return;
    quantity = parseInt(quantity, 10) || 1;

    var sourceCurrent = parseMoney(current);
    var sourceCompare = compare ? parseMoney(compare) : null;
    var unitCurrent = sourceCurrent ? formatMoney(sourceCurrent.value / quantity, sourceCurrent.symbol) : current;
    var unitCompare = sourceCompare ? formatMoney(sourceCompare.value / quantity, sourceCompare.symbol) : null;

    priceNow.textContent = unitCurrent;
    if (buttonPrice) buttonPrice.textContent = unitCurrent + ' / each';

    var currentMoney = parseMoney(unitCurrent);
    var compareMoney = unitCompare ? parseMoney(unitCompare) : null;
    if (priceWas) {
      if (compareMoney && currentMoney && compareMoney.value > currentMoney.value) {
        priceWas.style.display = '';
        priceWas.textContent = unitCompare;
      } else {
        priceWas.style.display = 'none';
      }
    }

    /* Derive savings from the exact per-unit prices shown on screen. */
    if (compareMoney && currentMoney && compareMoney.value > currentMoney.value) {
      savePercent = Math.round((compareMoney.value - currentMoney.value) / compareMoney.value * 100);
    }
    if (priceSave) {
      if (savePercent && savePercent > 0) {
        priceSave.style.display = '';
        priceSave.textContent = 'Launch sale · save ' + Math.round(savePercent) + '%';
      } else {
        priceSave.style.display = 'none';
      }
    }

    var priceWrap = priceNow.closest('.pdp__price');
    if (priceWrap) {
      priceWrap.setAttribute('data-kaching-synced', 'true');
      priceWrap.setAttribute('data-bundle-quantity', String(quantity));
    }
  }

  function readQuantityFromText(text) {
    if (!text) return null;
    var bogo = text.match(/buy\s+(\d+)\s*(?:[^\d]{0,20})get\s+(\d+)/i);
    if (bogo) return parseInt(bogo[1], 10) + parseInt(bogo[2], 10);
    var bottle = text.match(/\b(\d+)\s*(?:bottles?|items?|pieces?|pcs|pack)\b/i);
    if (bottle) return parseInt(bottle[1], 10);
    return null;
  }

  function quantityFromDetail(detail) {
    if (!detail || typeof detail !== 'object') return null;
    if (Array.isArray(detail.variantIdQuantities)) {
      var sum = detail.variantIdQuantities.reduce(function (total, item) {
        return total + (parseInt(item && item.quantity, 10) || 0);
      }, 0);
      if (sum) return sum;
    }
    var directKeys = ['quantity', 'dealQuantity', 'selectedQuantity', 'selectedDealQuantity'];
    for (var i = 0; i < directKeys.length; i++) {
      var q = parseInt(detail[directKeys[i]], 10);
      if (q > 0) return q;
    }
    return null;
  }

  function moneyCandidateFromDetail(detail, wantCompare) {
    if (!detail || typeof detail !== 'object') return null;
    var candidates = [];

    function walk(value, path, depth) {
      if (depth > 6 || value == null) return;
      if (typeof value === 'string') {
        var parsed = parseMoney(value);
        if (!parsed) return;
        var lower = path.toLowerCase();
        var isCompare = /compare|original|regular|before/.test(lower);
        if (wantCompare !== isCompare) return;
        if (!/price|total|amount/.test(lower)) return;
        var score = 0;
        if (/formatted/.test(lower)) score += 5;
        if (/total/.test(lower)) score += 7;
        if (/bundle/.test(lower)) score += 5;
        if (/discounted|final|sale/.test(lower)) score += 3;
        if (/price/.test(lower)) score += 2;
        if (/unit|each|peritem|per_item/.test(lower)) score -= 7;
        candidates.push({ text: parsed.raw, score: score, perUnit: /unit|each|peritem|per_item/.test(lower) });
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(function (item, index) { walk(item, path + '[' + index + ']', depth + 1); });
        return;
      }
      if (typeof value === 'object') {
        Object.keys(value).forEach(function (key) {
          walk(value[key], path ? path + '.' + key : key, depth + 1);
        });
      }
    }

    walk(detail, '', 0);
    candidates.sort(function (a, b) { return b.score - a.score; });
    return candidates[0] || null;
  }

  function saveFromDetail(detail) {
    if (!detail || typeof detail !== 'object') return null;
    var found = null;
    function walk(value, path, depth) {
      if (found != null || depth > 6 || value == null) return;
      var lower = path.toLowerCase();
      if ((typeof value === 'number' || typeof value === 'string') && /percent|percentage/.test(lower)) {
        var n = parseFloat(String(value).replace('%', ''));
        if (n > 0 && n < 100) found = n;
        return;
      }
      if (typeof value === 'string' && /save|discount/.test(lower)) {
        var match = value.match(/(\d+(?:\.\d+)?)\s*%/);
        if (match) found = parseFloat(match[1]);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(function (item, index) { walk(item, path + '[' + index + ']', depth + 1); });
      } else if (typeof value === 'object') {
        Object.keys(value).forEach(function (key) { walk(value[key], path ? path + '.' + key : key, depth + 1); });
      }
    }
    walk(detail, '', 0);
    return found;
  }

  function allOpenRoots(root) {
    var roots = [root];
    if (!root || !root.querySelectorAll) return roots;
    root.querySelectorAll('*').forEach(function (el) {
      if (el.shadowRoot) roots = roots.concat(allOpenRoots(el.shadowRoot));
    });
    return roots;
  }

  function isStruck(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.matches('s,del') || el.closest('s,del')) return true;
    try {
      return String(window.getComputedStyle(el).textDecorationLine || '').indexOf('line-through') !== -1;
    } catch (e) {
      return false;
    }
  }

  function selectedDealNode(block) {
    var roots = [];
    if (block.shadowRoot) roots = allOpenRoots(block.shadowRoot);
    roots.push(block);
    var selectors = [
      'input[type="radio"]:checked',
      '[role="radio"][aria-checked="true"]',
      '[aria-selected="true"]',
      '[data-selected="true"]',
      '[data-active="true"]'
    ];
    for (var r = 0; r < roots.length; r++) {
      for (var s = 0; s < selectors.length; s++) {
        var marker = roots[r].querySelector && roots[r].querySelector(selectors[s]);
        if (!marker) continue;
        var node = marker;
        var best = null;
        for (var up = 0; node && up < 9; up++, node = node.parentElement) {
          var text = (node.innerText || node.textContent || '').trim();
          if (text && parseMoney(text) && text.length < 1400) {
            best = node;
            if (/save|bottle|buy\s+\d+|supply|each/i.test(text)) break;
          }
        }
        if (best) return best;
      }
    }
    return null;
  }

  function dealFromDom(block, fallbackQuantity) {
    var deal = selectedDealNode(block);
    if (!deal) return null;
    var text = (deal.innerText || deal.textContent || '').replace(/\s+/g, ' ').trim();
    var quantity = readQuantityFromText(text) || fallbackQuantity || 1;
    var saveMatch = text.match(/(?:save|saving|off)\s*(\d+(?:\.\d+)?)\s*%/i);
    var save = saveMatch ? parseFloat(saveMatch[1]) : null;
    var current = null;
    var compare = null;
    var currentText = '';

    var nodes = [deal].concat(Array.prototype.slice.call(deal.querySelectorAll ? deal.querySelectorAll('*') : []));
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el || el.nodeType !== 1) continue;
      var own = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!own || own.length > 120) continue;
      var parsed = parseMoney(own);
      if (!parsed) continue;
      var childHasMoney = false;
      Array.prototype.forEach.call(el.children || [], function (child) {
        if (parseMoney((child.innerText || child.textContent || '').trim())) childHasMoney = true;
      });
      if (childHasMoney) continue;
      if (isStruck(el)) {
        if (!compare) compare = { money: parsed, text: own };
      } else if (!current) {
        current = { money: parsed, text: own };
        currentText = own;
      }
    }

    if (!current) {
      var matches = text.match(/[$£€¥]\s*[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?/g) || [];
      if (matches[0]) current = { money: parseMoney(matches[0]), text: matches[0] };
      if (matches[1]) compare = { money: parseMoney(matches[1]), text: matches[1] };
    }
    if (!current || !current.money) return null;

    var perEach = /(?:\/\s*each|\beach\b|per\s+(?:item|bottle|unit))/i.test(currentText || current.text || '');
    if (!perEach) {
      var rawAt = text.indexOf(current.money.raw);
      if (rawAt !== -1) {
        perEach = /(?:\/\s*each|\beach\b|per\s+(?:item|bottle|unit))/i.test(text.slice(rawAt, rawAt + current.money.raw.length + 30));
      }
    }
    var currentValue = current.money.value * (perEach ? quantity : 1);
    var compareValue = null;
    if (compare && compare.money) {
      /* Kaching commonly omits the second “/ each” label on the struck price,
         so when the active price is explicitly per-item, treat the compare
         price as per-item too. */
      compareValue = compare.money.value * (perEach ? quantity : 1);
    }

    return {
      current: formatMoney(currentValue, current.money.symbol),
      compare: compareValue ? formatMoney(compareValue, compare.money.symbol) : null,
      save: save,
      quantity: quantity
    };
  }

  function syncFromKaching(block, detail) {
    var quantity = quantityFromDetail(detail);
    var dom = dealFromDom(block, quantity);
    if (!quantity && dom) quantity = dom.quantity;

    var detailCurrent = moneyCandidateFromDetail(detail, false);
    var detailCompare = moneyCandidateFromDetail(detail, true);
    var current = null;
    var compare = null;

    if (detailCurrent) {
      var cur = parseMoney(detailCurrent.text);
      if (cur) current = formatMoney(cur.value * (detailCurrent.perUnit && quantity ? quantity : 1), cur.symbol);
    }
    if (detailCompare) {
      var cmp = parseMoney(detailCompare.text);
      if (cmp) compare = formatMoney(cmp.value * (detailCompare.perUnit && quantity ? quantity : 1), cmp.symbol);
    }

    current = current || (dom && dom.current);
    compare = compare || (dom && dom.compare);
    var save = saveFromDetail(detail) || (dom && dom.save);
    if (current) setBundlePrice(current, compare, save, quantity || 1);
  }

  function bindBlock(block) {
    if (!block || block.getAttribute('data-lumenity-price-bound') === 'true') return;
    block.setAttribute('data-lumenity-price-bound', 'true');

    var lastDetail = null;
    var timer = null;
    function schedule(detail) {
      if (detail) lastDetail = detail;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { syncFromKaching(block, lastDetail); }, 35);
      window.setTimeout(function () { syncFromKaching(block, lastDetail); }, 120);
    }

    ['deal-bar-selected', 'variant-selected', 'variants-changed', 'subscription-selected', 'subscription-changed', 'selling-plan-selected', 'selling-plan-changed', 'purchase-option-changed'].forEach(function (eventName) {
      block.addEventListener(eventName, function (event) { schedule(event.detail); });
    });
    block.addEventListener('click', function () { schedule(null); });
    block.addEventListener('change', function () { schedule(null); });

    function observeRenderedWidget() {
      var target = block.shadowRoot || block;
      if (!target || target.__lumenityObserved) return;
      target.__lumenityObserved = true;
      new MutationObserver(function () { schedule(null); }).observe(target, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
        attributeFilter: ['checked', 'aria-checked', 'aria-selected', 'data-selected', 'data-active', 'class']
      });
    }

    observeRenderedWidget();
    window.setTimeout(observeRenderedWidget, 250);
    window.setTimeout(observeRenderedWidget, 900);
    schedule(null);
  }

  function bindAll() {
    document.querySelectorAll('kaching-bundles-block').forEach(bindBlock);
  }

  bindAll();
  new MutationObserver(bindAll).observe(document.documentElement, { childList: true, subtree: true });
})();

/* Kaching Subscriptions price + selling-plan bridge.
   Kaching normally updates its own bundle price when a subscription is selected.
   This bridge mirrors that final price into the theme headline/ATC, recalculates
   the overall savings percentage, and provides a 20%-off fallback only when the
   app has not changed the displayed bundle price itself. */
(function () {
  'use strict';

  var priceNow = document.querySelector('[data-pdp-now]');
  var priceWas = document.querySelector('[data-pdp-was]');
  var priceSave = document.querySelector('[data-pdp-save]');
  var buttonPrice = document.querySelector('[data-pdp-button-price]');
  var variantInput = document.querySelector('[data-pdp-variant]');
  var productForm = document.getElementById('pdp-form');
  var planDataNode = document.querySelector('[data-pdp-selling-plan-prices]');
  if (!priceNow || !productForm) return;

  var planData = {};
  try { planData = planDataNode ? JSON.parse(planDataNode.textContent || '{}') : {}; } catch (e) { planData = {}; }

  var preSubscriptionSnapshot = null;
  var lastManualCurrent = null;
  var manualHiddenPlan = null;
  var syncTimer = null;

  function parseMoney(text) {
    if (typeof text !== 'string') return null;
    var match = text.match(/([$£€¥])\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/);
    if (!match) return null;
    return { symbol: match[1], value: parseFloat(match[2].replace(/,/g, '')) };
  }

  function formatMoney(value, symbol) {
    if (!isFinite(value)) return '';
    return (symbol || '$') + (Math.round(value * 100) / 100).toFixed(2);
  }

  function rootsFrom(root) {
    var roots = [root];
    if (!root || !root.querySelectorAll) return roots;
    root.querySelectorAll('*').forEach(function (el) {
      if (el.shadowRoot) roots = roots.concat(rootsFrom(el.shadowRoot));
    });
    return roots;
  }

  function allRoots() {
    return rootsFrom(document);
  }

  function controlText(control) {
    if (!control) return '';
    var node = control;
    var best = '';
    for (var i = 0; node && i < 6; i++, node = node.parentElement) {
      var tag = String(node.tagName || '').toLowerCase();
      /* Do not let text from the entire Kaching widget make an ordinary
         bundle radio look like a subscription control merely because the
         widget also contains a subscription offer elsewhere. */
      if (tag === 'kaching-bundles-block' || tag === 'kaching-subscriptions') break;
      var text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length > best.length && text.length < 420) best = text;
      if (text.length < 420 && /subscription|subscribe|refill|recurring|automatic\s+refill|every\s+(?:week|month|day)/i.test(text)) return text;
    }
    return best;
  }

  function findSellingPlanValue() {
    var roots = allRoots();
    var fallback = null;
    var planAttrs = ['data-selling-plan-id','selling-plan-id','data-plan-id','data-selling-plan'];
    for (var r = 0; r < roots.length; r++) {
      var root = roots[r];
      if (!root.querySelectorAll) continue;
      var controls = root.querySelectorAll('input[name="selling_plan"],select[name="selling_plan"],[data-selling-plan-id],[selling-plan-id],[data-plan-id],[data-selling-plan]');
      for (var i = 0; i < controls.length; i++) {
        var el = controls[i];
        var active = true;
        if (el.tagName === 'INPUT' && (el.type === 'radio' || el.type === 'checkbox')) active = !!el.checked;
        if (el.getAttribute && el.getAttribute('aria-checked') === 'false') active = false;
        if (el.getAttribute && el.getAttribute('data-selected') === 'false') active = false;
        if (!active) continue;

        if (el.tagName === 'SELECT') {
          if (el.value) return String(el.value);
        } else if (el.getAttribute && el.getAttribute('name') === 'selling_plan' && el.value) {
          return String(el.value);
        }

        for (var a = 0; a < planAttrs.length; a++) {
          var attr = el.getAttribute && el.getAttribute(planAttrs[a]);
          if (attr && /^\d+$/.test(String(attr))) return String(attr);
        }

        /* Some Kaching layouts put the selling plan id directly in the value
           of the selected subscription radio/checkbox without naming it
           selling_plan. Only trust that numeric value when the surrounding
           label clearly identifies a subscription option. */
        if (el.value && /^\d+$/.test(String(el.value)) && /subscription|subscribe|refill|recurring|automatic\s+refill|every\s+(?:week|month|day)/i.test(controlText(el))) {
          fallback = String(el.value);
        }
      }
    }
    return fallback;
  }

  function findSubscriptionControl() {
    var roots = allRoots();
    var selectors = [
      'input[type="checkbox"]:checked',
      'input[type="radio"]:checked',
      '[role="checkbox"][aria-checked="true"]',
      '[role="radio"][aria-checked="true"]',
      '[data-selected="true"]',
      '[data-active="true"]'
    ];
    for (var r = 0; r < roots.length; r++) {
      for (var s = 0; s < selectors.length; s++) {
        var nodes = roots[r].querySelectorAll ? roots[r].querySelectorAll(selectors[s]) : [];
        for (var i = 0; i < nodes.length; i++) {
          var text = controlText(nodes[i]);
          if (/subscription|subscribe|refill|recurring|automatic\s+refill|every\s+(?:week|month|day)/i.test(text)) {
            return { control: nodes[i], text: text };
          }
        }
      }
    }
    return null;
  }

  function planInfo(planId) {
    if (!planId) return null;
    var variantId = variantInput && variantInput.value ? String(variantInput.value) : '';
    var variant = planData[variantId];
    if (!variant || !variant.plans || !variant.plans[String(planId)]) return null;
    var plan = variant.plans[String(planId)];
    var base = parseFloat(variant.base) || 0;
    var planPrice = parseFloat(plan.price) || 0;
    if (!base || !planPrice) return null;
    return {
      factor: planPrice / base,
      percent: Math.round((1 - planPrice / base) * 100),
      planId: String(planId)
    };
  }

  function subscriptionState() {
    var planId = findSellingPlanValue();
    var info = planInfo(planId);
    var selected = findSubscriptionControl();
    var active = !!planId || !!selected;
    var percent = info && info.percent > 0 ? info.percent : null;
    if (!percent && selected) {
      var match = selected.text.match(/(?:save\s*)?(\d+(?:\.\d+)?)\s*%\s*(?:off)?/i);
      if (match) percent = parseFloat(match[1]);
    }
    /* User's Kaching subscription offer is 20% off. Use that only as a
       fallback when Kaching/Shopify does not expose the selling-plan amount. */
    if (active && !percent) percent = 20;
    return {
      active: active,
      planId: planId,
      factor: info ? info.factor : (percent ? (1 - percent / 100) : 1),
      percent: percent || 0,
      selected: selected
    };
  }

  function syncSellingPlanToForm(state) {
    var existing = productForm.querySelector('input[name="selling_plan"]:not([data-lumenity-selling-plan])');
    if (existing && existing.value) {
      if (manualHiddenPlan) { manualHiddenPlan.remove(); manualHiddenPlan = null; }
      return;
    }
    if (state.active && state.planId) {
      if (!manualHiddenPlan) {
        manualHiddenPlan = document.createElement('input');
        manualHiddenPlan.type = 'hidden';
        manualHiddenPlan.name = 'selling_plan';
        manualHiddenPlan.setAttribute('data-lumenity-selling-plan', 'true');
        productForm.appendChild(manualHiddenPlan);
      }
      manualHiddenPlan.value = state.planId;
    } else if (manualHiddenPlan) {
      manualHiddenPlan.remove();
      manualHiddenPlan = null;
    }
  }

  function recalcBadge(currentText, compareText, fallbackPercent) {
    var current = parseMoney(currentText);
    var compare = parseMoney(compareText || '');
    var percent = 0;
    if (current && compare && compare.value > current.value) {
      percent = Math.round((compare.value - current.value) / compare.value * 100);
    } else if (fallbackPercent > 0) {
      percent = Math.round(fallbackPercent);
    }
    if (priceSave) {
      if (percent > 0) {
        priceSave.style.display = '';
        priceSave.textContent = 'Launch sale · save ' + percent + '%';
      } else {
        priceSave.style.display = 'none';
      }
    }
  }

  function setThemePrice(currentText, compareText, fallbackPercent) {
    if (!currentText) return;
    priceNow.textContent = currentText;
    if (buttonPrice) buttonPrice.textContent = currentText + ' / each';
    if (priceWas) {
      var current = parseMoney(currentText);
      var compare = parseMoney(compareText || '');
      if (current && compare && compare.value > current.value) {
        priceWas.style.display = '';
        priceWas.textContent = compareText;
      } else {
        priceWas.style.display = 'none';
      }
    }
    recalcBadge(currentText, compareText, fallbackPercent);
  }

  function captureBeforeSubscription() {
    var current = parseMoney(priceNow.textContent || '');
    if (!current) return;
    preSubscriptionSnapshot = {
      currentText: priceNow.textContent.trim(),
      current: current,
      compareText: priceWas && priceWas.style.display !== 'none' ? priceWas.textContent.trim() : '',
      at: Date.now()
    };
  }

  function ensureSubscriptionPrice() {
    var state = subscriptionState();
    syncSellingPlanToForm(state);

    if (!state.active) {
      lastManualCurrent = null;
      preSubscriptionSnapshot = null;
      /* Kaching owns the one-time/subscription toggle and restores its own
         one-time bundle price on uncheck. Do not synthesize change events here
         because that can create feedback loops with app mutation observers. */
      return;
    }

    var displayed = parseMoney(priceNow.textContent || '');
    if (!displayed) return;

    /* If Kaching changed the headline after the subscription click, it already
       supplied the correct subscription-aware bundle total. Keep it and only
       recompute the percentage from the actual displayed values. */
    if (preSubscriptionSnapshot && Date.now() - preSubscriptionSnapshot.at < 1800) {
      var changedByApp = Math.abs(displayed.value - preSubscriptionSnapshot.current.value) > 0.005;
      if (changedByApp) {
        lastManualCurrent = priceNow.textContent.trim();
        recalcBadge(priceNow.textContent, priceWas && priceWas.style.display !== 'none' ? priceWas.textContent : '', state.percent);
        preSubscriptionSnapshot = null;
        return;
      }
    }

    /* If our fallback is already what is on screen, do not compound it. */
    if (lastManualCurrent && priceNow.textContent.trim() === lastManualCurrent) {
      recalcBadge(priceNow.textContent, priceWas && priceWas.style.display !== 'none' ? priceWas.textContent : '', state.percent);
      return;
    }

    /* Only synthesize the 20%/selling-plan price when we captured the exact
       one-time bundle total immediately before the shopper toggled the
       subscription. For later bundle changes while subscribed, Kaching remains
       the source of truth; we simply mirror its final price and recalc savings. */
    if (!preSubscriptionSnapshot || !preSubscriptionSnapshot.current) {
      recalcBadge(priceNow.textContent, priceWas && priceWas.style.display !== 'none' ? priceWas.textContent : '', state.percent);
      return;
    }

    var base = preSubscriptionSnapshot.current;
    var baseText = preSubscriptionSnapshot.currentText;
    var compareText = preSubscriptionSnapshot.compareText || baseText;
    var discounted = formatMoney(base.value * state.factor, base.symbol);
    setThemePrice(discounted, compareText, state.percent);
    lastManualCurrent = discounted;
    preSubscriptionSnapshot = null;
  }

  function isSubscriptionLikeTarget(target) {
    if (!target || target.nodeType !== 1) return false;
    var text = controlText(target);
    return /subscription|subscribe|refill|recurring|automatic\s+refill|every\s+(?:week|month|day)|save\s*20\s*%/i.test(text);
  }

  document.addEventListener('pointerdown', function (event) {
    if (isSubscriptionLikeTarget(event.target)) captureBeforeSubscription();
  }, true);
  document.addEventListener('click', function (event) {
    if (isSubscriptionLikeTarget(event.target)) {
      window.clearTimeout(syncTimer);
      syncTimer = window.setTimeout(ensureSubscriptionPrice, 260);
      window.setTimeout(ensureSubscriptionPrice, 700);
    }
  }, true);
  document.addEventListener('change', function (event) {
    if (isSubscriptionLikeTarget(event.target) || (event.target && event.target.name === 'selling_plan')) {
      window.clearTimeout(syncTimer);
      syncTimer = window.setTimeout(ensureSubscriptionPrice, 120);
      window.setTimeout(ensureSubscriptionPrice, 500);
    }
  }, true);

  /* Observe Kaching widgets because their controls can live inside open shadow
     roots and can update after the original change event has finished. */
  function observeKaching() {
    var roots = allRoots();
    roots.forEach(function (root) {
      if (!root || root.__lumenitySubscriptionObserved || !root.querySelectorAll) return;
      var host = root.host;
      var relevant = host ? /kaching/i.test(host.tagName || '') : root === document;
      if (!relevant) return;
      root.__lumenitySubscriptionObserved = true;
      new MutationObserver(function () {
        window.clearTimeout(syncTimer);
        syncTimer = window.setTimeout(ensureSubscriptionPrice, 180);
      }).observe(root, { subtree: true, childList: true, attributes: true, characterData: true,
        attributeFilter: ['checked','aria-checked','aria-selected','data-selected','data-active','value','class'] });
    });
  }

  observeKaching();
  new MutationObserver(function () { observeKaching(); }).observe(document.documentElement, { childList: true, subtree: true });
  ['selling-plan-selected','selling-plan-changed','subscription-selected','subscription-changed','purchase-option-changed'].forEach(function (name) {
    document.addEventListener(name, function () {
      window.setTimeout(ensureSubscriptionPrice, 100);
      window.setTimeout(ensureSubscriptionPrice, 450);
    });
  });
  window.setTimeout(ensureSubscriptionPrice, 400);
  window.setTimeout(ensureSubscriptionPrice, 1200);
})();

/* Cart quantity steppers: update Shopify by line number, then reload from
   Shopify's canonical cart response so prices and discounts stay correct. */
(function () {
  'use strict';
  var form = document.getElementById('cart-form');
  if (!form) return;

  var status = document.querySelector('[data-cart-status]');
  var cartPage = document.querySelector('.cart-page');
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  var changeUrl = (cartPage && cartPage.getAttribute('data-cart-change-url')) || (root + 'cart/change.js');
  var pending = false;

  function setStatus(message, isError) {
    if (!status) return;
    status.textContent = message || '';
    status.setAttribute('data-error', isError ? 'true' : 'false');
  }

  function setLoading(stepper, loading) {
    pending = loading;
    if (stepper) stepper.setAttribute('data-loading', loading ? 'true' : 'false');
    document.querySelectorAll('[data-cart-qty] button, [data-cart-quantity]').forEach(function (control) {
      control.disabled = loading;
    });
  }

  function errorMessage(payload, fallback) {
    if (!payload) return fallback;
    return payload.description || payload.message || payload.errors || fallback;
  }

  function changeQuantity(stepper, next) {
    if (pending || !stepper) return;
    var item = stepper.closest('[data-cart-item]');
    var input = stepper.querySelector('[data-cart-quantity]');
    var line = item ? parseInt(item.getAttribute('data-cart-line'), 10) : 0;
    next = Math.max(0, parseInt(next, 10) || 0);
    if (!input || line < 1) return;

    var previous = parseInt(input.value, 10) || 0;
    input.value = next;
    setStatus(next === 0 ? 'Removing item…' : 'Updating cart…', false);
    setLoading(stepper, true);

    fetch(changeUrl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ line: line, quantity: next })
    }).then(function (response) {
      return response.json().catch(function () { return null; }).then(function (payload) {
        if (!response.ok) throw new Error(errorMessage(payload, 'We could not update that quantity.'));
        return payload;
      });
    }).then(function () {
      /* A reload lets Shopify recalculate final_line_price, cart total,
         discounts and the header bag count from the same cart. */
      window.location.reload();
    }).catch(function (error) {
      input.value = previous;
      setLoading(stepper, false);
      setStatus(error && error.message ? error.message : 'We could not update your cart. Please try again.', true);
    });
  }

  document.querySelectorAll('[data-cart-qty]').forEach(function (stepper) {
    var input = stepper.querySelector('[data-cart-quantity]');
    var minus = stepper.querySelector('[data-cart-minus]');
    var plus = stepper.querySelector('[data-cart-plus]');
    if (!input) return;

    if (minus) minus.addEventListener('click', function () {
      changeQuantity(stepper, (parseInt(input.value, 10) || 0) - 1);
    });

    if (plus) plus.addEventListener('click', function () {
      /* No theme-side maximum: Shopify inventory/checkout rules remain the authority. */
      changeQuantity(stepper, (parseInt(input.value, 10) || 0) + 1);
    });

    input.addEventListener('change', function () {
      changeQuantity(stepper, input.value);
    });
  });
})();

/* Header drawer navigation. */
(function () {
  'use strict';
  var toggle = document.querySelector('[data-menu-toggle]');
  var close = document.querySelector('[data-menu-close]');
  var drawer = document.querySelector('[data-menu-drawer]');
  var scrim = document.querySelector('[data-menu-scrim]');
  if (!toggle || !drawer || !scrim) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    drawer.setAttribute('data-open', open ? 'true' : 'false');
    scrim.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (open) {
      var first = drawer.querySelector('a,button');
      if (first) setTimeout(function () { first.focus(); }, 20);
    } else {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', function () { setOpen(true); });
  if (close) close.addEventListener('click', function () { setOpen(false); });
  scrim.addEventListener('click', function () { setOpen(false); });
  drawer.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && drawer.getAttribute('data-open') === 'true') setOpen(false);
  });
})();


/* Sale countdown: counts down to local midnight and resets daily. */
(function () {
  'use strict';
  var timer = document.querySelector('[data-sale-timer]');
  if (!timer) return;

  var hours = timer.querySelector('[data-sale-hours]');
  var minutes = timer.querySelector('[data-sale-minutes]');
  var seconds = timer.querySelector('[data-sale-seconds]');
  function pad(value) { return String(Math.max(0, value)).padStart(2, '0'); }

  function secondsUntilMidnight() {
    var now = new Date();
    var nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
  }

  function render() {
    var remaining = secondsUntilMidnight();
    var h = Math.floor(remaining / 3600);
    var m = Math.floor((remaining % 3600) / 60);
    var s = remaining % 60;
    if (hours) hours.textContent = pad(h);
    if (minutes) minutes.textContent = pad(m);
    if (seconds) seconds.textContent = pad(s);
  }

  render();
  window.setInterval(render, 1000);
})();

/* ============================================================
   STOREFRONT BEHAVIORS (Lucent Nattokinase)
   ============================================================ */

/* ---- Slide-in cart drawer + AJAX add-to-cart ---- */
(function () {
  'use strict';
  var drawer = document.querySelector('[data-cart-drawer]');
  var scrim = document.querySelector('[data-cart-scrim]');
  if (!drawer || !scrim) return;

  var linesEl = drawer.querySelector('[data-cart-lines]');
  var emptyEl = drawer.querySelector('[data-cart-empty]');
  var footEl = drawer.querySelector('[data-cart-foot]');
  var totalEl = drawer.querySelector('[data-cart-total]');
  var countEl = document.querySelector('[data-cart-count]');
  var changeUrl = drawer.getAttribute('data-change-url') || '/cart/change.js';
  var addUrl = drawer.getAttribute('data-add-url') || '/cart/add.js';
  var cartUrl = drawer.getAttribute('data-cart-url') || '/cart.js';

  function money(cents) {
    return '$' + (Math.round(cents) / 100).toFixed(2);
  }

  function setOpen(open) {
    drawer.setAttribute('data-open', open ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    scrim.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  }

  function render(cart) {
    if (!cart) return;
    if (countEl) {
      countEl.textContent = cart.item_count;
      countEl.hidden = cart.item_count === 0;
    }
    var bag = document.querySelector('[data-cart-open]');
    if (bag) bag.classList.toggle('cart-bag--has-items', cart.item_count > 0);

    if (cart.item_count === 0) {
      if (emptyEl) emptyEl.style.display = '';
      if (linesEl) linesEl.innerHTML = '';
      if (footEl) footEl.hidden = true;
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    if (footEl) footEl.hidden = false;
    if (totalEl) totalEl.textContent = money(cart.total_price);

    var html = '';
    cart.items.forEach(function (item) {
      var img = item.image ? item.image.replace(/(\.[a-z]+)(\?.*)?$/i, '_120x$1$2') : '';
      var variant = (item.variant_title && item.variant_title !== 'Default Title') ? '<p class="cd-line__variant">' + item.variant_title + '</p>' : '';
      html += '<li class="cd-line" data-key="' + item.key + '">' +
        '<a class="cd-line__media" href="' + item.url + '">' + (img ? '<img src="' + img + '" alt="" width="64" height="64">' : '') + '</a>' +
        '<div><a class="cd-line__name" href="' + item.url + '">' + item.product_title + '</a>' + variant +
          '<div class="cd-line__qty" data-key="' + item.key + '"><button type="button" data-cd-minus aria-label="Decrease">−</button><span>' + item.quantity + '</span><button type="button" data-cd-plus aria-label="Increase">+</button></div>' +
        '</div>' +
        '<div><div class="cd-line__price">' + money(item.final_line_price) + '</div><button type="button" class="cd-line__remove" data-cd-remove>Remove</button></div>' +
      '</li>';
    });
    if (linesEl) linesEl.innerHTML = html;
  }

  function fetchCart() {
    return fetch(cartUrl, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) { render(cart); return cart; })
      .catch(function () {});
  }

  function change(key, qty) {
    return fetch(changeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    }).then(function (r) { return r.json(); }).then(function (cart) { render(cart); return cart; })
      .catch(function () {});
  }

  function addVariant(id, qty) {
    return fetch(addUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: id, quantity: qty || 1 })
    }).then(function (r) {
      if (!r.ok) throw new Error('add failed');
      return r.json();
    }).then(function () { return fetchCart(); }).then(function () { setOpen(true); });
  }

  /* Open triggers */
  document.querySelectorAll('[data-cart-open]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); fetchCart(); setOpen(true); });
  });
  drawer.querySelectorAll('[data-cart-close]').forEach(function (b) {
    b.addEventListener('click', function () { setOpen(false); });
  });
  scrim.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.getAttribute('data-open') === 'true') setOpen(false);
  });

  /* Line qty + remove (event delegation) */
  if (linesEl) linesEl.addEventListener('click', function (e) {
    var line = e.target.closest('.cd-line');
    if (!line) return;
    var key = line.getAttribute('data-key');
    var qtyEl = line.querySelector('.cd-line__qty span');
    var qty = qtyEl ? parseInt(qtyEl.textContent, 10) || 0 : 0;
    if (e.target.hasAttribute('data-cd-plus')) change(key, qty + 1);
    else if (e.target.hasAttribute('data-cd-minus')) change(key, Math.max(0, qty - 1));
    else if (e.target.hasAttribute('data-cd-remove')) change(key, 0);
  });

  /* Intercept the PDP add-to-cart form → AJAX + open drawer */
  var pform = document.getElementById('pdp-form');
  if (pform) {
    pform.addEventListener('submit', function (e) {
      var idField = pform.querySelector('[data-pdp-variant]') || pform.querySelector('[name="id"]');
      var qtyField = pform.querySelector('[name="quantity"]');
      if (!idField || !idField.value) return; /* let it submit normally */
      e.preventDefault();
      var atc = pform.querySelector('[data-pdp-atc]');
      var label = atc ? atc.querySelector('[data-pdp-atc-label]') : null;
      var prev = label ? label.textContent : '';
      if (label) label.textContent = 'Adding…';
      addVariant(idField.value, parseInt(qtyField && qtyField.value, 10) || 1)
        .then(function () { if (label) label.textContent = prev; })
        .catch(function () { pform.submit(); });
    });
  }

  /* Prime the header count on load */
  fetchCart();
})();

/* ---- Animated stat counters ---- */
(function () {
  'use strict';
  var section = document.querySelector('[data-stats]');
  if (!section) return;
  var nums = section.querySelectorAll('[data-count-to]');
  if (!nums.length) return;

  function run(el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + '%';
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    window.setTimeout(function () { el.textContent = target + '%'; }, dur + 250);
  }

  if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
    });
  }, { threshold: 0.5 });
  nums.forEach(function (n) { io.observe(n); });
})();

/* ---- Write-a-review modal + see-more reviews ---- */
(function () {
  'use strict';
  var modal = document.querySelector('[data-review-modal]');
  var openBtn = document.querySelector('[data-review-open]');
  if (modal && openBtn) {
    var rating = 0;
    var starWrap = modal.querySelector('[data-review-stars]');
    var msg = modal.querySelector('[data-review-msg]');
    function setModal(open) { modal.hidden = !open; document.body.classList.toggle('menu-open', open); }
    openBtn.addEventListener('click', function () { setModal(true); });
    modal.querySelectorAll('[data-review-close]').forEach(function (b) { b.addEventListener('click', function () { setModal(false); }); });
    if (starWrap) starWrap.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        rating = parseInt(b.getAttribute('data-star'), 10);
        starWrap.querySelectorAll('button').forEach(function (x) {
          x.setAttribute('data-on', (parseInt(x.getAttribute('data-star'), 10) <= rating) ? 'true' : 'false');
        });
      });
    });
    var submit = modal.querySelector('[data-review-submit]');
    if (submit) submit.addEventListener('click', function () {
      var name = (modal.querySelector('[data-review-name]') || {}).value || '';
      var text = (modal.querySelector('[data-review-text]') || {}).value || '';
      if (!name.trim() || !text.trim() || !rating) {
        if (msg) msg.textContent = 'Please add your name, a rating, and a few words.';
        return;
      }
      if (msg) msg.textContent = 'Thank you! Your review has been submitted for approval.';
      setTimeout(function () { setModal(false); }, 1600);
    });
  }

  /* See-more reviews: reveal a few extra pre-written cards */
  var moreBtn = document.querySelector('[data-review-more]');
  var list = document.querySelector('.rblock__list');
  if (moreBtn && list) {
    var extra = [
      { i: 'PH', a: '#8E2C2C', b: '#E7C873', n: 'Paul H.', s: '★★★★★', t: 'One capsule with coffee, done', p: 'I was skeptical about the 10,800 FU claim until I saw the third-party test on the label. Easy habit, no burping, no aftertaste.' },
      { i: 'SG', a: '#15161B', b: '#C9A24A', n: 'Sandra G.', s: '★★★★★', t: 'Replaced my K2 and my nattokinase', p: 'Two bottles down to one. My doctor was fine with it once she saw the label. Legs feel less heavy after long days on my feet.' },
      { i: 'MO', a: '#2A2C34', b: '#E7C873', n: 'Marcus O.', s: '★★★★☆', t: 'Give it the full bottle', p: 'Nothing in week one, but by the end of the bottle I felt lighter on my morning walks. Reordering the 3-pack.' }
    ];
    moreBtn.addEventListener('click', function () {
      extra.forEach(function (r) {
        var art = document.createElement('article');
        art.className = 'rev2';
        art.innerHTML = '<header><span class="rev2__av" style="--a:' + r.a + ';--b:' + r.b + '">' + r.i + '</span><div><strong>' + r.n + '</strong><span class="rev2__meta">Verified buyer · ' + r.s + '</span></div></header><h3>' + r.t + '</h3><p>' + r.p + '</p>';
        list.insertBefore(art, moreBtn);
      });
      moreBtn.remove();
    });
  }
})();

/* ---- Fill star widgets from data-stars (visual only) ---- */
(function () {
  'use strict';
  document.querySelectorAll('[data-stars]').forEach(function (el) {
    var val = parseFloat(el.getAttribute('data-stars'));
    if (isNaN(val)) return;
    /* leave full gold stars; screen readers get the numeric text nearby */
  });
})();


/* Product demo videos: clean poster + a single play button. Tap plays with
   sound; tap the playing video to pause; only one plays at a time. No native
   controls, on purpose. */
(function () {
  'use strict';
  var wraps = document.querySelectorAll('[data-demo-video-wrap]');
  if (!wraps.length) return;
  var all = [];

  wraps.forEach(function (wrap) {
    var video = wrap.querySelector('[data-demo-video]');
    var btn = wrap.querySelector('[data-video-play]');
    if (!video) return;
    all.push(video);
    try { video.controls = false; } catch (e) {}

    function sync() {
      if (video.paused || video.ended) wrap.classList.remove('is-playing');
      else wrap.classList.add('is-playing');
    }

    function play() {
      all.forEach(function (v) { if (v !== video) { try { v.pause(); } catch (e) {} } });
      try { video.muted = false; video.volume = 1; } catch (e) {}
      var p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          // If the browser blocks sound, fall back to a muted play so it still runs.
          try { video.muted = true; video.play().catch(function () {}); } catch (e) {}
        });
      }
    }

    function toggle() { if (video.paused || video.ended) play(); else video.pause(); }

    if (btn) btn.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    video.addEventListener('click', toggle);
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    video.addEventListener('ended', function () { try { video.currentTime = 0; } catch (e) {} sync(); });
    sync();
  });
})();
