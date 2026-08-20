/*
 * Berunda cart — floating button, drawer and localStorage persistence.
 *
 * Vanilla JS on purpose: this runs on every page including not-found-page.html,
 * which loads no jQuery or Bootstrap.
 *
 * Products opt in by putting data-cart-add on a button, alongside
 * data-id / data-name / data-price / data-image, and optionally a
 * data-size-from="<selector>" pointing at the checked size input.
 */
(function () {
    'use strict';

    var STORE_KEY = 'berunda-cart-v1';
    var CURRENCY = '$';

    /* ---------- state ---------- */

    function read() {
        try {
            var raw = window.localStorage.getItem(STORE_KEY);
            var parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            // Private mode, disabled storage or corrupt JSON: fall back to an
            // empty cart rather than breaking every page on the site.
            return [];
        }
    }

    function write(items) {
        try {
            window.localStorage.setItem(STORE_KEY, JSON.stringify(items));
        } catch (e) {
            /* nothing useful to do — keep the in-page cart working */
        }
    }

    var items = read();

    function count() {
        return items.reduce(function (n, i) { return n + i.qty; }, 0);
    }

    function total() {
        return items.reduce(function (n, i) { return n + i.price * i.qty; }, 0);
    }

    function money(n) {
        return CURRENCY + n.toFixed(2).replace(/\.00$/, '');
    }

    /* A line is identified by product + size, so an M and an L of the same
       tank are separate lines rather than one lump. */
    function keyOf(item) {
        return item.id + '::' + (item.size || '');
    }

    /* ---------- dom ---------- */

    var fab, badge, drawer, overlay, listEl, totalEl, emptyEl, footEl, lastFocus;

    function el(tag, attrs, html) {
        var n = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
        }
        if (html != null) { n.innerHTML = html; }
        return n;
    }

    function build() {
        // Floating button
        fab = el('button', {
            'class': 'cart-fab',
            'type': 'button',
            'aria-label': 'Open cart',
            'aria-expanded': 'false'
        }, '<i class="fa-solid fa-bag-shopping" aria-hidden="true"></i>');

        badge = el('span', { 'class': 'cart-fab-badge', 'aria-hidden': 'true' }, '0');
        fab.appendChild(badge);

        // Screen readers get the count as text rather than as a bare number.
        var srCount = el('span', { 'class': 'cart-sr-count' }, '');
        fab.appendChild(srCount);
        fab.srCount = srCount;

        overlay = el('div', { 'class': 'cart-overlay', 'hidden': 'hidden' });

        drawer = el('aside', {
            'class': 'cart-drawer',
            'role': 'dialog',
            'aria-modal': 'true',
            'aria-label': 'Shopping cart',
            'hidden': 'hidden'
        });

        var head = el('div', { 'class': 'cart-head' },
            '<h2>Your Cart</h2>' +
            '<button type="button" class="cart-close" aria-label="Close cart">' +
            '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>');

        listEl = el('ul', { 'class': 'cart-list' });
        emptyEl = el('p', { 'class': 'cart-empty' },
            'Your cart is empty.<br><a href="men.html">Browse the shop</a>');

        footEl = el('div', { 'class': 'cart-foot' });
        totalEl = el('div', { 'class': 'cart-total' }, '');
        var checkout = el('a', { 'class': 'cart-checkout', 'href': '#' }, 'Checkout');
        var note = el('p', { 'class': 'cart-note' },
            'Islandwide shipping calculated at checkout.');
        footEl.appendChild(totalEl);
        footEl.appendChild(checkout);
        footEl.appendChild(note);

        drawer.appendChild(head);
        drawer.appendChild(listEl);
        drawer.appendChild(emptyEl);
        drawer.appendChild(footEl);

        document.body.appendChild(fab);
        document.body.appendChild(overlay);
        document.body.appendChild(drawer);

        fab.addEventListener('click', open);
        overlay.addEventListener('click', close);
        head.querySelector('.cart-close').addEventListener('click', close);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !drawer.hasAttribute('hidden')) { close(); }
        });

        // Line-level controls are delegated, since lines come and go.
        listEl.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-act]');
            if (!btn) { return; }
            var key = btn.closest('.cart-line').getAttribute('data-key');
            var act = btn.getAttribute('data-act');
            if (act === 'remove') { removeLine(key); }
            if (act === 'inc') { bump(key, 1); }
            if (act === 'dec') { bump(key, -1); }
        });
    }

    /* ---------- rendering ---------- */

    function render() {
        var n = count();
        badge.textContent = n > 99 ? '99+' : String(n);
        badge.style.display = n ? '' : 'none';
        fab.srCount.textContent = n === 0
            ? 'Cart is empty'
            : 'Cart, ' + n + (n === 1 ? ' item' : ' items');

        listEl.innerHTML = '';

        if (!items.length) {
            emptyEl.style.display = '';
            footEl.style.display = 'none';
            return;
        }

        emptyEl.style.display = 'none';
        footEl.style.display = '';

        items.forEach(function (it) {
            var li = el('li', { 'class': 'cart-line', 'data-key': keyOf(it) });
            li.innerHTML =
                '<div class="cart-thumb"><img src="' + it.image + '" alt=""></div>' +
                '<div class="cart-line-body">' +
                '<a class="cart-line-name" href="' + it.url + '">' + it.name + '</a>' +
                (it.size ? '<div class="cart-line-size">Size ' + it.size + '</div>' : '') +
                '<div class="cart-qty">' +
                '<button type="button" data-act="dec" aria-label="Decrease quantity">&minus;</button>' +
                '<span aria-live="polite">' + it.qty + '</span>' +
                '<button type="button" data-act="inc" aria-label="Increase quantity">+</button>' +
                '</div>' +
                '</div>' +
                '<div class="cart-line-end">' +
                '<div class="cart-line-price">' + money(it.price * it.qty) + '</div>' +
                '<button type="button" class="cart-remove" data-act="remove" ' +
                'aria-label="Remove ' + it.name + '">Remove</button>' +
                '</div>';
            listEl.appendChild(li);
        });

        totalEl.innerHTML = '<span>Subtotal</span><strong>' + money(total()) + '</strong>';
    }

    function persist() {
        write(items);
        render();
    }

    /* ---------- mutations ---------- */

    function add(item) {
        var key = keyOf(item);
        var found = null;
        for (var i = 0; i < items.length; i++) {
            if (keyOf(items[i]) === key) { found = items[i]; break; }
        }
        if (found) {
            found.qty += item.qty;
        } else {
            items.push(item);
        }
        persist();
        open();
    }

    function removeLine(key) {
        items = items.filter(function (i) { return keyOf(i) !== key; });
        persist();
    }

    function bump(key, delta) {
        items.forEach(function (i) {
            if (keyOf(i) === key) { i.qty = Math.max(1, i.qty + delta); }
        });
        persist();
    }

    /* ---------- open/close ---------- */

    function open() {
        lastFocus = document.activeElement;
        drawer.removeAttribute('hidden');
        overlay.removeAttribute('hidden');
        // Next frame, so the transition has a starting state to animate from.
        requestAnimationFrame(function () {
            drawer.classList.add('is-open');
            overlay.classList.add('is-open');
        });
        fab.setAttribute('aria-expanded', 'true');
        document.body.classList.add('cart-locked');
        var first = drawer.querySelector('.cart-close');
        if (first) { first.focus(); }
    }

    function close() {
        drawer.classList.remove('is-open');
        overlay.classList.remove('is-open');
        fab.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('cart-locked');
        window.setTimeout(function () {
            drawer.setAttribute('hidden', 'hidden');
            overlay.setAttribute('hidden', 'hidden');
        }, 300);
        if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    }

    /* ---------- add-to-cart buttons ---------- */

    function wireButtons() {
        document.querySelectorAll('[data-cart-add]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                var size = '';
                var sel = btn.getAttribute('data-size-from');
                if (sel) {
                    var checked = document.querySelector(sel);
                    if (checked) { size = checked.value; }
                }

                var qty = 1;
                var qtySel = btn.getAttribute('data-qty-from');
                if (qtySel) {
                    var q = document.querySelector(qtySel);
                    if (q) { qty = Math.max(1, parseInt(q.value, 10) || 1); }
                }

                add({
                    id: btn.getAttribute('data-id'),
                    name: btn.getAttribute('data-name'),
                    price: parseFloat(btn.getAttribute('data-price')) || 0,
                    image: btn.getAttribute('data-image'),
                    url: btn.getAttribute('data-url') || window.location.pathname.split('/').pop(),
                    size: size,
                    qty: qty
                });
            });
        });
    }

    /* ---------- boot ---------- */

    function init() {
        build();
        wireButtons();
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Other pages/tabs changing the cart should not leave a stale badge.
    window.addEventListener('storage', function (e) {
        if (e.key === STORE_KEY) { items = read(); render(); }
    });

    window.BerundaCart = { add: add, open: open, close: close, items: function () { return items.slice(); } };
}());
