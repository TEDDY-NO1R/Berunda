/* Newsletter signup — placeholder behaviour.
   The address is never sent, stored or logged anywhere. Submitting only
   validates the field and opens the confirmation dialog. Swap the submit
   handler for a real endpoint when there is one. */

(function () {
    'use strict';

    var form = document.getElementById('signup-form');
    var modal = document.getElementById('signup-modal');
    if (!form || !modal) { return; }

    var input = form.querySelector('input[type="email"]');
    var closeBtn = modal.querySelector('.modal-close');
    var okBtn = modal.querySelector('.modal-ok');
    var lastFocused = null;

    function open() {
        lastFocused = document.activeElement;
        modal.removeAttribute('hidden');
        /* Force a reflow so the transition has a starting state to animate from.
           Synchronous, unlike requestAnimationFrame, which a backgrounded tab
           will not run — the dialog would then sit at opacity 0 over the page. */
        void modal.offsetWidth;
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        okBtn.focus();
    }

    function close() {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
        window.setTimeout(function () {
            modal.setAttribute('hidden', 'hidden');
        }, 300);
        if (lastFocused && lastFocused.focus) { lastFocused.focus(); }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        /* novalidate is on the form so the browser bubble does not fight the
           dialog; check it here instead. */
        if (!input.value || !input.checkValidity()) {
            input.focus();
            input.reportValidity();
            return;
        }

        form.reset();
        open();
    });

    closeBtn.addEventListener('click', close);
    okBtn.addEventListener('click', close);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) { close(); }
    });

    document.addEventListener('keydown', function (e) {
        if (modal.hasAttribute('hidden')) { return; }

        if (e.key === 'Escape') {
            close();
        } else if (e.key === 'Tab') {
            /* Keep focus inside the dialog while it is open. */
            var focusable = modal.querySelectorAll('button');
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
