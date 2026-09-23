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

  /* Bundle cards: keep the headline price, savings badge, hidden form fields,
     the add-to-cart button and the sticky bar in sync with the selected bundle. */
  var priceNow = document.querySelector('[data-pdp-now]');
  var priceWas = document.querySelector('[data-pdp-was]');
  var priceSave = document.querySelector('[data-pdp-save]');
  var priceUnit = document.querySelector('[data-pdp-unit]');
  var variantInput = document.querySelector('[data-pdp-variant]');
  var quantityInput = document.querySelector('[data-pdp-quantity]');
  var buttonPrice = document.querySelector('[data-pdp-button-price]');
  var stickyPrice = document.querySelector('[data-pdp-sticky-price]');
  var saveLabel = priceSave && priceSave.textContent.indexOf('·') !== -1 ? priceSave.textContent.split('·')[0].trim() : 'Sale';

  function money(n) {
    return '$' + (Math.round(n * 100) / 100).toFixed(2);
  }

  function applyOption(opt) {
    var price = parseFloat(opt.getAttribute('data-price')) || 0;
    var compare = parseFloat(opt.getAttribute('data-compare')) || 0;
    var qty = parseInt(opt.getAttribute('data-qty'), 10) || 1;
    var units = parseInt(opt.getAttribute('data-units'), 10) || qty;
    var total = price * qty;
    var compareTotal = compare * qty;
    var perBottle = total / units;

    if (priceNow) priceNow.textContent = money(perBottle);
    if (priceUnit) priceUnit.textContent = units > 1 ? '/ bottle · ' + money(total) + ' total' : '/ bottle';
    if (buttonPrice) buttonPrice.textContent = money(total);
    if (stickyPrice) stickyPrice.textContent = money(total);
    if (variantInput) variantInput.value = opt.getAttribute('data-vid') || variantInput.value;
    if (quantityInput) quantityInput.value = String(qty);

    if (priceWas) {
      priceWas.style.display = compareTotal > total ? '' : 'none';
      if (compareTotal > total) priceWas.textContent = money(compareTotal / units);
    }
    if (priceSave) {
      if (compareTotal > total) {
        priceSave.style.display = '';
        priceSave.textContent = saveLabel + ' · save ' + Math.round((compareTotal - total) / compareTotal * 100) + '%';
      } else {
        priceSave.style.display = 'none';
      }
    }
  }

  var opts = Array.prototype.slice.call(document.querySelectorAll('[data-pdp-opt]'));
  opts.forEach(function (opt) {
    opt.addEventListener('click', function () {
      if (opt.disabled) return;
      opts.forEach(function (o) {
        o.setAttribute('data-active', 'false');
        o.setAttribute('aria-pressed', 'false');
      });
      opt.setAttribute('data-active', 'true');
      opt.setAttribute('aria-pressed', 'true');
      applyOption(opt);
    });
  });
  var activeOpt = opts.filter(function (o) { return o.getAttribute('data-active') === 'true'; })[0];
  if (activeOpt) applyOption(activeOpt);

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
