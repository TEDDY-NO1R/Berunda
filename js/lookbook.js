/* Lookbook lightbox.
   The gallery used to be its own page leaning on magnific-popup. It is now a
   section on the home page, so this replaces that dependency with the few
   behaviours actually needed: open, step, close, and keyboard control. */

(function () {
    'use strict';

    var items = [].slice.call(document.querySelectorAll('.look-item'));
    if (!items.length) { return; }

    var sources = items.map(function (a) {
        var img = a.querySelector('img');
        return { src: a.getAttribute('href') || img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
    });

    var index = 0;
    var lastFocused = null;

    /* --- build the lightbox once --- */

    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Lookbook image viewer');
    lb.innerHTML =
        '<button type="button" class="lb-btn lb-close" aria-label="Close">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '<button type="button" class="lb-btn lb-prev" aria-label="Previous image">' +
        '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
        '<img alt="">' +
        '<button type="button" class="lb-btn lb-next" aria-label="Next image">' +
        '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>' +
        '<div class="lb-count" aria-live="polite"></div>';
    document.body.appendChild(lb);

    var imgEl = lb.querySelector('img');
    var countEl = lb.querySelector('.lb-count');
    var closeBtn = lb.querySelector('.lb-close');

    function show(i) {
        index = (i + sources.length) % sources.length;
        imgEl.setAttribute('src', sources[index].src);
        imgEl.setAttribute('alt', sources[index].alt);
        countEl.textContent = (index + 1) + ' / ' + sources.length;
    }

    function open(i) {
        lastFocused = document.activeElement;
        show(i);
        lb.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function close() {
        lb.classList.remove('is-open');
        document.body.style.overflow = '';
        if (lastFocused) { lastFocused.focus(); }
    }

    /* --- wiring --- */

    items.forEach(function (a, i) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            open(i);
        });
    });

    closeBtn.addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(index - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(index + 1); });

    /* Clicking the backdrop closes; clicking the image or a button must not. */
    lb.addEventListener('click', function (e) {
        if (e.target === lb) { close(); }
    });

    document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('is-open')) { return; }
        if (e.key === 'Escape') { close(); }
        else if (e.key === 'ArrowLeft') { show(index - 1); }
        else if (e.key === 'ArrowRight') { show(index + 1); }
        else if (e.key === 'Tab') {
            /* Keep focus inside the dialog while it is open. */
            var focusable = lb.querySelectorAll('button');
            var first = focusable[0];
            var last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
}());
