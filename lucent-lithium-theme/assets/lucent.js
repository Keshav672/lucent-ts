/* Lucent storefront behaviours. No dependencies. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (cents) { return '$' + (Math.round(cents) / 100).toFixed(2); };
  var routes = window.LucentRoutes || { cart: '/cart', cartJs: '/cart.js', add: '/cart/add.js', change: '/cart/change.js' };
  var freeShipCents = parseInt(document.body.getAttribute('data-free-ship') || '0', 10) || 0;

  /* Toast */
  var toastEl = $('[data-toast]'); var toastT;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400); }

  /* Drawers (menu + cart) */
  var scrim = $('[data-scrim]');
  var openDrawer = null;
  function setDrawer(drawer, on) {
    if (!drawer) return;
    drawer.classList.toggle('is-on', on);
    drawer.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (scrim) scrim.classList.toggle('is-on', on);
    document.body.classList.toggle('is-locked', on);
    openDrawer = on ? drawer : null;
    if (on) { var f = $('button,a,input', drawer); if (f) setTimeout(function () { f.focus(); }, 30); }
  }
  var menu = $('[data-menu]'), cart = $('[data-cart]');
  $$('[data-menu-open]').forEach(function (b) { b.addEventListener('click', function () { setDrawer(menu, true); }); });
  $$('[data-cart-open]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); setDrawer(cart, true); refreshCart(); }); });
  $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', function () { setDrawer(b.closest('.drawer'), false); }); });
  if (scrim) scrim.addEventListener('click', function () { setDrawer(openDrawer, false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openDrawer) setDrawer(openDrawer, false); });
  if (menu) $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setDrawer(menu, false); }); });

  /* Cart drawer rendering */
  var linesEl = cart && $('[data-lines]', cart), emptyEl = cart && $('[data-empty]', cart), footEl = cart && $('[data-foot]', cart);
  var totalEl = cart && $('[data-total]', cart), countEls = $$('[data-count]'), statusEl = cart && $('[data-status]', cart);
  var shipEl = cart && $('[data-ship]', cart), upsellEl = cart && $('[data-upsell]', cart);
  var busy = false;
  function status(msg, err) { if (!statusEl) return; statusEl.textContent = msg || ''; statusEl.classList.toggle('is-err', !!err); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function renderCart(c) {
    if (!cart) return;
    countEls.forEach(function (el) { el.textContent = c.item_count; el.hidden = c.item_count === 0; });
    var has = c.item_count > 0;
    if (emptyEl) emptyEl.hidden = has; if (footEl) footEl.hidden = !has;
    if (totalEl) totalEl.textContent = money(c.total_price);
    if (shipEl) {
      if (freeShipCents > 0 && has) {
        shipEl.hidden = false;
        var left = Math.max(0, freeShipCents - c.total_price);
        $('p', shipEl).textContent = left > 0 ? 'Add ' + money(left) + ' more for free shipping' : 'You’ve unlocked free shipping';
        $('.ship__fill', shipEl).style.width = Math.min(100, c.total_price / freeShipCents * 100) + '%';
      } else shipEl.hidden = true;
    }
    if (upsellEl) {
      var upVariant = parseInt(upsellEl.getAttribute('data-variant'), 10);
      var inCart = c.items.some(function (i) { return i.variant_id === upVariant; });
      upsellEl.hidden = !has || inCart || !upVariant;
    }
    if (!linesEl) return;
    linesEl.innerHTML = c.items.map(function (it, idx) {
      var img = it.image ? it.image.replace(/(\.[a-z]+)(\?|$)/i, '_160x160$1$2') : '';
      return '<li class="line" data-line="' + (idx + 1) + '">' +
        (img ? '<img class="line__img" src="' + esc(img) + '" alt="" width="80" height="80">' : '<span class="line__img"></span>') +
        '<div><a class="line__t" href="' + esc(it.url) + '">' + esc(it.product_title) + '</a>' +
        (it.variant_title && it.variant_title !== 'Default Title' ? '<div class="line__v">' + esc(it.variant_title) + '</div>' : '') +
        (it.selling_plan_allocation ? '<div class="line__v">' + esc(it.selling_plan_allocation.selling_plan.name) + '</div>' : '') +
        '<div class="qty" data-qty><button type="button" data-minus aria-label="Decrease quantity">&minus;</button><input type="number" min="0" value="' + it.quantity + '" aria-label="Quantity" data-qinput><button type="button" data-plus aria-label="Increase quantity">+</button></div>' +
        '<div><button type="button" class="line__rm" data-remove>Remove</button></div></div>' +
        '<div class="line__p">' + money(it.final_line_price) + '</div></li>';
    }).join('');
  }
  function refreshCart() {
    if (!cart) return Promise.resolve();
    return fetch(routes.cartJs, { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); }).then(renderCart).catch(function () { status('Could not load your cart.', true); });
  }
  function changeLine(line, qty) {
    if (busy) return; busy = true; status(qty === 0 ? 'Removing…' : 'Updating…');
    fetch(routes.change, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ line: line, quantity: qty }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.description || j.message || 'Could not update cart'); return j; }); })
      .then(function (c) { renderCart(c); status(''); })
      .catch(function (e) { status(e.message, true); })
      .then(function () { busy = false; });
  }
  if (linesEl) linesEl.addEventListener('click', function (e) {
    var li = e.target.closest('[data-line]'); if (!li) return;
    var line = parseInt(li.getAttribute('data-line'), 10), input = $('[data-qinput]', li), q = parseInt(input.value, 10) || 0;
    if (e.target.closest('[data-minus]')) changeLine(line, Math.max(0, q - 1));
    else if (e.target.closest('[data-plus]')) changeLine(line, q + 1);
    else if (e.target.closest('[data-remove]')) changeLine(line, 0);
  });
  if (linesEl) linesEl.addEventListener('change', function (e) {
    var input = e.target.closest('[data-qinput]'); if (!input) return;
    changeLine(parseInt(input.closest('[data-line]').getAttribute('data-line'), 10), Math.max(0, parseInt(input.value, 10) || 0));
  });
  function addToCart(body, btn) {
    if (busy) return Promise.resolve(); busy = true;
    var label = btn && btn.textContent; if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }
    return fetch(routes.add, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.description || j.message || 'Could not add to cart'); return j; }); })
      .then(function () { busy = false; return refreshCart(); })
      .then(function () { setDrawer(cart, true); })
      .catch(function (e) { busy = false; toast(e.message); })
      .then(function () { if (btn) { btn.disabled = false; btn.textContent = label; } });
  }
  /* Any product form with data-ajax posts through the drawer */
  $$('form[data-ajax]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form), body = { items: [{ id: parseInt(fd.get('id'), 10), quantity: parseInt(fd.get('quantity') || '1', 10) }] };
      if (fd.get('selling_plan')) body.items[0].selling_plan = parseInt(fd.get('selling_plan'), 10);
      addToCart(body, form.querySelector('[type=submit]'));
    });
  });
  if (upsellEl) { var ub = $('button', upsellEl); if (ub) ub.addEventListener('click', function () { addToCart({ items: [{ id: parseInt(upsellEl.getAttribute('data-variant'), 10), quantity: 1 }] }, ub); }); }

  /* Shop tabs filter */
  (function () {
    var tabs = $$('[data-tab]'); if (!tabs.length) return;
    var cards = $$('[data-card]');
    tabs.forEach(function (t) { t.addEventListener('click', function () {
      var key = t.getAttribute('data-tab');
      tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
      var shown = 0;
      cards.forEach(function (c) { var on = key === 'all' || (' ' + c.getAttribute('data-tags') + ' ').indexOf(' ' + key + ' ') > -1; c.hidden = !on; if (on) shown++; });
      var none = $('[data-none]'); if (none) none.hidden = shown > 0;
    }); });
  })();

  /* PDP: gallery, purchase options, qty, sticky bar */
  (function () {
    var pdp = $('[data-pdp]'); if (!pdp) return;
    var slides = $$('[data-slide]', pdp), thumbs = $$('[data-thumb]', pdp), i = 0;
    function go(n) {
      if (!slides.length) return; i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === i); var v = s.querySelector('video'); if (v) { if (k === i) v.play().catch(function () {}); else v.pause(); } });
      thumbs.forEach(function (t, k) { t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { go(k); }); });
    var prev = $('[data-prev]', pdp), next = $('[data-next]', pdp);
    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    if (next) next.addEventListener('click', function () { go(i + 1); });
    var sx = null, main = $('.gal__main', pdp);
    if (main) { main.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true }); main.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1); sx = null; }); }

    var form = $('form[data-product-form]', pdp), idInput = form && $('[name=id]', form), planInput = form && $('[name=selling_plan]', form);
    var priceEl = $('[data-price-out]', pdp), cmpEl = $('[data-compare-out]', pdp), saveEl = $('[data-save]', pdp), stickyP = $('[data-sticky-price]');
    var qtyInput = $('[data-qinput]', pdp), qtyMinus = $('[data-minus]', pdp), qtyPlus = $('[data-plus]', pdp);
    function num(el, k) { return parseInt(el.getAttribute(k) || '0', 10) || 0; }
    function sync() {
      var sel = $('input[name=purchase]:checked', pdp); if (!sel) return;
      var per = num(sel, 'data-per') || num(sel, 'data-price'), cper = num(sel, 'data-cper'), pct = num(sel, 'data-pct');
      if (idInput) idInput.value = sel.getAttribute('data-variant');
      if (planInput) planInput.value = sel.getAttribute('data-plan') || '';
      if (priceEl) priceEl.textContent = money(per);
      if (cmpEl) { cmpEl.hidden = !(cper > per); cmpEl.textContent = cper > per ? money(cper) : ''; }
      if (saveEl) { saveEl.hidden = !(pct > 0); if (pct > 0) saveEl.textContent = saveEl.textContent.split('\u00b7')[0].trim() + ' \u00b7 Save ' + pct + '%'; }
      if (stickyP) stickyP.textContent = money(per) + '/bottle';
      var atc = $('[data-atc-total]', pdp); if (atc) atc.textContent = money(per);
      var st = $('[data-sticky-title]'); if (st) st.textContent = st.getAttribute('data-base') + ' · ' + sel.getAttribute('data-label');
    }
    $$('input[name=purchase]', pdp).forEach(function (r) { r.addEventListener('change', sync); });
    if (qtyMinus) qtyMinus.addEventListener('click', function () { qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1); sync(); });
    if (qtyPlus) qtyPlus.addEventListener('click', function () { qtyInput.value = Math.min(20, (parseInt(qtyInput.value, 10) || 1) + 1); sync(); });
    if (qtyInput) qtyInput.addEventListener('change', function () { qtyInput.value = Math.min(20, Math.max(1, parseInt(qtyInput.value, 10) || 1)); sync(); });
    sync();
    var sticky = $('[data-sticky]'), buyBox = $('[data-buy]', pdp);
    if (sticky && buyBox && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { sticky.classList.toggle('is-on', !en[0].isIntersecting && en[0].boundingClientRect.top < 0); }, { threshold: 0 }).observe(buyBox);
      var sb = $('button', sticky); if (sb) sb.addEventListener('click', function () { form.requestSubmit ? form.requestSubmit() : form.querySelector('[type=submit]').click(); });
    }
  })();

  /* Reviews carousel arrows */
  $$('[data-rcar]').forEach(function (wrap) {
    var track = $('.rcar', wrap); if (!track) return;
    var step = function () { var c = track.firstElementChild; return c ? c.getBoundingClientRect().width + 16 : 320; };
    var p = $('[data-rprev]', wrap), n = $('[data-rnext]', wrap);
    if (p) p.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (n) n.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
  });

  /* Video tiles: one plays at a time */
  var vids = $$('.vid');
  vids.forEach(function (tile) {
    var v = $('video', tile), b = $('.vid__play', tile); if (!v || !b) return;
    b.addEventListener('click', function () {
      if (v.paused) { vids.forEach(function (o) { var ov = $('video', o); if (ov && ov !== v) { ov.pause(); o.classList.remove('is-playing'); } }); v.muted = false; v.play(); tile.classList.add('is-playing'); }
      else { v.pause(); tile.classList.remove('is-playing'); }
    });
    v.addEventListener('ended', function () { tile.classList.remove('is-playing'); });
    v.addEventListener('click', function () { b.click(); });
  });

  /* Cart page steppers (full reload keeps Shopify totals authoritative) */
  (function () {
    var page = $('[data-cart-page]'); if (!page) return;
    page.addEventListener('click', function (e) {
      var li = e.target.closest('[data-line]'); if (!li) return;
      var input = $('[data-qinput]', li), q = parseInt(input.value, 10) || 0, line = parseInt(li.getAttribute('data-line'), 10), next = null;
      if (e.target.closest('[data-minus]')) next = Math.max(0, q - 1); else if (e.target.closest('[data-plus]')) next = q + 1; else if (e.target.closest('[data-remove]')) next = 0;
      if (next === null) return;
      e.preventDefault();
      fetch(routes.change, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ line: line, quantity: next }) })
        .then(function (r) { if (!r.ok) throw new Error('Could not update cart'); window.location.reload(); })
        .catch(function (er) { toast(er.message); });
    });
  })();

  /* Newsletter (customer form posts natively; this only shows the state) */
  var news = $('[data-news]'); if (news && /customer_posted=true/.test(location.search)) { var nm = $('[data-news-msg]'); if (nm) nm.hidden = false; }
})();
