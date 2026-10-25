(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';

  var fmtNode = $('[data-money-format]');
  var moneyFormat = fmtNode ? JSON.parse(fmtNode.textContent) : '${{amount}}';
  function money(cents) {
    var n = (cents / 100).toFixed(2);
    return moneyFormat.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, k) {
      if (k === 'amount_no_decimals') return Math.round(cents / 100).toString();
      if (k === 'amount_with_comma_separator') return n.replace('.', ',');
      return n.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    });
  }

  /* panels: menu + cart drawer share open/close/escape handling */
  var lastFocus = null;
  function panel(el, scrim, open) {
    if (!el) return;
    el.classList.toggle('is-open', open);
    el.setAttribute('aria-hidden', String(!open));
    scrim.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { lastFocus = document.activeElement; var f = $('button, a', el); if (f) f.focus(); }
    else if (lastFocus) lastFocus.focus();
  }
  var menu = $('[data-menu]'), menuScrim = $('[data-menu-scrim]'), burger = $('[data-menu-open]');
  function setMenu(o) { panel(menu, menuScrim, o); if (burger) burger.setAttribute('aria-expanded', String(o)); }
  if (burger) burger.addEventListener('click', function () { setMenu(true); });
  $$('[data-menu-close], [data-menu-scrim], [data-menu] a').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });

  var drawer = $('[data-cart-drawer]'), cartScrim = $('[data-cart-scrim]');
  function setCart(o) { panel(drawer, cartScrim, o); }
  $$('[data-cart-open]').forEach(function (b) { b.addEventListener('click', function () { setCart(true); refreshCart(); }); });
  $$('[data-cart-close], [data-cart-scrim]').forEach(function (b) { b.addEventListener('click', function () { setCart(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (drawer && drawer.classList.contains('is-open')) setCart(false);
    if (menu && menu.classList.contains('is-open')) setMenu(false);
  });

  /* cart */
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function renderCart(cart) {
    $$('[data-cart-count]').forEach(function (c) { c.textContent = cart.item_count; c.hidden = cart.item_count === 0; });
    if (!drawer) return;
    var lines = $('[data-cart-lines]', drawer);
    lines.innerHTML = cart.items.map(function (it, i) {
      var img = it.image ? it.image + (it.image.indexOf('?') > -1 ? '&' : '?') + 'width=160' : '';
      return '<li class="line">' +
        (img ? '<img src="' + img + '" alt="" width="72" height="72">' : '<span></span>') +
        '<div><div class="line__t">' + esc(it.product_title) + '</div>' +
        (it.variant_title ? '<div class="line__v">' + esc(it.variant_title) + '</div>' : '') +
        (it.selling_plan_allocation ? '<div class="line__v">' + esc(it.selling_plan_allocation.selling_plan.name) + '</div>' : '') +
        '<div class="qty"><button type="button" data-line="' + (i + 1) + '" data-q="' + (it.quantity - 1) + '" aria-label="Decrease quantity">&minus;</button><span>' + it.quantity + '</span><button type="button" data-line="' + (i + 1) + '" data-q="' + (it.quantity + 1) + '" aria-label="Increase quantity">+</button></div></div>' +
        '<div><div class="line__p">' + money(it.final_line_price) + '</div><button type="button" class="line__rm" data-line="' + (i + 1) + '" data-q="0">Remove</button></div></li>';
    }).join('');
    $('[data-cart-empty]', drawer).hidden = cart.item_count > 0;
    $('[data-cart-foot]', drawer).hidden = cart.item_count === 0;
    $('[data-cart-total]', drawer).textContent = money(cart.total_price);
    var ship = $('[data-ship]', drawer), goal = Number(drawer.getAttribute('data-free-ship') || 0) * 100;
    if (ship && goal > 0 && cart.item_count > 0) {
      var left = goal - cart.total_price;
      ship.hidden = false;
      $('[data-ship-text]', ship).textContent = left > 0 ? money(left) + ' away from free shipping' : 'You’ve unlocked free shipping';
      $('[data-ship-bar]', ship).style.width = Math.min(100, cart.total_price / goal * 100) + '%';
    } else if (ship) ship.hidden = true;
  }
  function refreshCart() { return fetch(root + 'cart.js').then(function (r) { return r.json(); }).then(renderCart).catch(function () {}); }
  if (drawer) drawer.addEventListener('click', function (e) {
    var b = e.target.closest('[data-line]'); if (!b) return;
    b.disabled = true;
    fetch(root + 'cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ line: Number(b.dataset.line), quantity: Number(b.dataset.q) }) })
      .then(function (r) { return r.json(); }).then(renderCart).catch(refreshCart);
  });

  /* buy box */
  var form = $('[data-buy-form]');
  if (form) {
    var idInput = $('[data-variant-id]', form), addBtn = $('[data-add]', form), msg = $('[data-buy-msg]'), qty = $('[data-qty]', form);
    function setPrice(cents) { $$('[data-price-label]').forEach(function (l) { l.textContent = money(cents); }); }
    $$('input[name="steep-variant"]', form).forEach(function (r) {
      r.addEventListener('change', function () {
        idInput.value = r.value; setPrice(Number(r.dataset.price));
        var was = $('.pricerow__was'), pill = $('.pricerow .pill'), cmp = Number(r.dataset.compare), pr = Number(r.dataset.price);
        if (was && pill) { var on = cmp > pr; was.hidden = pill.hidden = !on; if (on) { was.textContent = money(cmp); pill.textContent = 'Save ' + Math.floor((cmp - pr) * 100 / cmp) + '%'; } }
      });
    });
    function clampQty(n) { return Math.max(1, Math.min(20, n || 1)); }
    $('[data-qty-minus]', form).addEventListener('click', function () { qty.value = clampQty(Number(qty.value) - 1); });
    $('[data-qty-plus]', form).addEventListener('click', function () { qty.value = clampQty(Number(qty.value) + 1); });
    qty.addEventListener('change', function () { qty.value = clampQty(Number(qty.value)); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (addBtn.disabled) return;
      var label = addBtn.innerHTML;
      addBtn.disabled = true; addBtn.textContent = 'Adding…'; msg.textContent = '';
      var body = { items: [{ id: Number(idInput.value), quantity: clampQty(Number(qty.value)) }] };
      var plan = $('input[name="selling_plan"]:checked', form);
      if (plan && plan.value) body.items[0].selling_plan = Number(plan.value);
      fetch(root + 'cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw j; return j; }); })
        .then(function () { return refreshCart(); })
        .then(function () { setCart(true); })
        .catch(function (err) { msg.textContent = (err && (err.description || err.message)) || 'Could not add to cart. Please try again.'; })
        .then(function () { addBtn.disabled = false; addBtn.innerHTML = label; });
    });

    var sticky = $('[data-sticky]');
    if (sticky) {
      var stickyAdd = $('[data-sticky-add]', sticky), ticking = false;
      var syncSticky = function () {
        ticking = false;
        var past = form.getBoundingClientRect().bottom < 0;
        sticky.classList.toggle('is-on', past);
        sticky.setAttribute('aria-hidden', String(!past));
        stickyAdd.tabIndex = past ? 0 : -1;
      };
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(syncSticky); } }, { passive: true });
      syncSticky();
      stickyAdd.addEventListener('click', function () { form.requestSubmit ? form.requestSubmit() : addBtn.click(); });
    }
  }

  /* gallery */
  var gal = $('[data-gallery]');
  if (gal) {
    var slides = $$('[data-slide]', gal), thumbs = $$('[data-thumbs] button', gal), cur = 0;
    function show(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.hidden = k !== cur; });
      thumbs.forEach(function (t, k) { if (k === cur) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
    }
    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { show(k); }); });
    $('[data-prev]', gal).addEventListener('click', function () { show(cur - 1); });
    $('[data-next]', gal).addEventListener('click', function () { show(cur + 1); });
    if (slides.length < 2) $$('.gal__nav', gal).forEach(function (b) { b.hidden = true; });
    var x0 = null, main = $('.gal__main', gal);
    main.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  /* reviews carousel */
  var track = $('[data-revs]');
  function slide(dir) { track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: 'smooth' }); }
  if (track && $('[data-rev-next]')) {
    $('[data-rev-next]').addEventListener('click', function () { slide(1); });
    $('[data-rev-prev]').addEventListener('click', function () { slide(-1); });
  }
  var modal = $('[data-rev-modal]'), rform = $('[data-rev-form]');
  if (modal && rform) {
    $('[data-rev-write]').addEventListener('click', function () { $('[data-rev-err]').textContent = ''; modal.showModal(); });
    $('[data-rev-cancel]').addEventListener('click', function () { modal.close(); });
    rform.addEventListener('submit', function (e) {
      var n = rform.name.value.trim(), b = rform.body.value.trim();
      if (!n || b.length < 10) { e.preventDefault(); $('[data-rev-err]').textContent = !n ? 'Please add your name.' : 'Tell us a little more (10+ characters).'; return; }
      var stars = Number(rform.rating.value), card = document.createElement('article');
      card.className = 'rev';
      card.innerHTML = '<div class="stars" aria-label="' + stars + ' out of 5 stars">' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</div><h3>Thanks for sharing!</h3><p>' + esc(b) + '</p><p class="rev__by"><strong>' + esc(n) + '</strong> · Pending approval</p>';
      $('[data-revs]').prepend(card);
      rform.reset();
    });
  }

  /* cart page steppers (native form submit keeps checkout server-side) */
  $$('[data-cart-qty]').forEach(function (s) {
    var input = $('[data-cart-quantity]', s);
    function go(d) { input.value = Math.max(0, Number(input.value) + d); input.form.submit(); }
    $('[data-cart-minus]', s).addEventListener('click', function () { go(-1); });
    $('[data-cart-plus]', s).addEventListener('click', function () { go(1); });
    input.addEventListener('change', function () { input.form.submit(); });
  });

  /* blend: reveal once in view */
  var blend = $('[id="blend"]');
  if (blend) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { blend.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.25 });
      io.observe(blend);
    } else blend.classList.add('is-in');
  }

  /* ad comments: cards rise in as they enter, Like toggles */
  var cards = $$('.fbc__card');
  if (cards.length) {
    if ('IntersectionObserver' in window) {
      var co = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); co.unobserve(x.target); } }); }, { threshold: 0.2 });
      cards.forEach(function (c) { co.observe(c); });
    } else cards.forEach(function (c) { c.classList.add('is-in'); });
  }
  $$('[data-like]').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true', n = $('[data-likes]', b.parentNode);
      b.setAttribute('aria-pressed', String(on));
      if (n) n.textContent = Number(n.textContent) + (on ? 1 : -1);
    });
  });

  /* what to expect: cups fill as each day is picked, auto-advancing until touched */
  var tl = $('[data-expect]');
  if (tl) {
    var days = $$('li', tl), cups = $$('[data-expect-phone] .cups i'), auto = null, at = 0;
    var pick = function (i) {
      at = i;
      days.forEach(function (d, k) { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      var n = Number(days[i].dataset.cups);
      cups.forEach(function (c, k) { c.classList.toggle('on', k < n); });
      $('[data-expect-label]').textContent = $('b', days[i]).textContent;
      $('[data-expect-text]').textContent = $('span', days[i]).textContent;
    };
    days.forEach(function (d, i) { d.addEventListener('click', function () { clearInterval(auto); pick(i); }); });
    pick(0);
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var eo = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { auto = setInterval(function () { pick((at + 1) % days.length); }, 1800); eo.disconnect(); }
      }, { threshold: 0.4 });
      eo.observe(tl);
    }
  }

  /* tea bags vs concentrate toggle */
  $$('[data-tog]').forEach(function (tg) {
    var btns = $$('[data-tog-btn]', tg), panels = $$('[data-tog-panel]', tg);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (o) { o.setAttribute('aria-selected', String(o === b)); });
        panels.forEach(function (pn) { pn.hidden = pn.dataset.togPanel !== b.dataset.togBtn; });
      });
    });
  });

  refreshCart();
})();
