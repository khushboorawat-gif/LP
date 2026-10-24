(function () {
  'use strict';

  function formatCount(n) {
    return String(n);
  }

  function setCartCount(n) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = formatCount(n);
      el.setAttribute('data-empty', n === 0 ? 'true' : 'false');
    });
  }

  // Mobile menu
  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-menu-toggle]');
    if (toggle) {
      var nav = document.getElementById('main-nav');
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  });

  // Quantity steppers
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-qty-step]');
    if (!btn) return;
    var input = btn.parentElement.querySelector('input[type="number"]');
    if (!input) return;
    var next = Math.max(parseInt(input.min || '1', 10), (parseInt(input.value, 10) || 1) + parseInt(btn.getAttribute('data-qty-step'), 10));
    input.value = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Gallery thumbnails
  document.addEventListener('click', function (e) {
    var thumb = e.target.closest('[data-thumb]');
    if (!thumb) return;
    var main = document.querySelector('[data-gallery-main]');
    if (!main) return;
    var src = thumb.getAttribute('data-thumb');
    var img = main.querySelector('img');
    if (img) { img.src = src; img.removeAttribute('srcset'); img.alt = thumb.getAttribute('data-alt') || ''; }
    document.querySelectorAll('[data-thumb]').forEach(function (t) { t.setAttribute('aria-current', t === thumb ? 'true' : 'false'); });
  });

  // Variant selection: keep id, price and button state in sync without a page reload
  var form = document.querySelector('[data-product-form]');
  if (form) {
    var variants = JSON.parse(document.getElementById('product-variants-json').textContent);
    var idInput = form.querySelector('[name="id"]');
    var addBtn = form.querySelector('[data-add-to-cart]');
    var priceEls = document.querySelectorAll('[data-product-price]');
    var money = function (cents) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: form.getAttribute('data-currency') || 'INR', maximumFractionDigits: 0 }).format(cents / 100);
    };
    var update = function () {
      var chosen = Array.prototype.map.call(form.querySelectorAll('[data-option]:checked, select[data-option]'), function (el) { return el.value; });
      var match = variants.find(function (v) { return v.options.join('|') === chosen.join('|'); });
      if (!match) { addBtn.disabled = true; addBtn.textContent = 'Unavailable'; return; }
      idInput.value = match.id;
      priceEls.forEach(function (el) { el.textContent = money(match.price); });
      addBtn.disabled = !match.available;
      addBtn.textContent = match.available ? 'Add to cart' : 'Sold out';
      var url = new URL(window.location.href);
      url.searchParams.set('variant', match.id);
      window.history.replaceState({}, '', url);
    };
    form.addEventListener('change', function (e) { if (e.target.matches('[data-option]')) update(); });

    // Ajax add to cart with a clear success or error message
    form.addEventListener('submit', function (e) {
      if (e.submitter && e.submitter.name === 'checkout') return;
      if (!addBtn || e.submitter !== addBtn) return;
      e.preventDefault();
      var status = document.querySelector('[data-cart-status]');
      addBtn.disabled = true;
      var original = addBtn.textContent;
      addBtn.textContent = 'Adding...';
      fetch('/cart/add.js', { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.json.description || res.json.message || 'Could not add to cart');
          return fetch('/cart.js').then(function (r) { return r.json(); });
        })
        .then(function (cart) {
          setCartCount(cart.item_count);
          if (status) { status.className = 'notice notice-ok'; status.innerHTML = 'Added to your cart. <a href="/cart"><strong>View cart</strong></a>'; }
        })
        .catch(function (err) {
          if (status) { status.className = 'notice notice-error'; status.textContent = err.message; }
        })
        .finally(function () { addBtn.disabled = false; addBtn.textContent = original; });
    });
  }

  // Auto-submit sort and filter controls
  document.querySelectorAll('[data-auto-submit]').forEach(function (el) {
    el.addEventListener('change', function () { el.form.submit(); });
  });
})();
