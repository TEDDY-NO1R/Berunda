/* Focus stage — phones only, home page only.
 *
 * Pins the featured product row to the middle of the screen and dims the rest
 * of the page behind it, so the row has the screen to itself.
 *
 * Deliberately NOT a scroll lock. The section is simply taller than the
 * viewport with a sticky child, so scrolling stays native the whole way
 * through: nothing here calls preventDefault, nothing sets overflow:hidden on
 * the body, and no wheel or touch event is swallowed. Carrying on in either
 * direction leaves the section, which means a script error can never strand
 * someone inside it. The only job of this file is to arm the layout on the
 * right screens and fade a backdrop in and out with scroll position.
 */

(function () {
    'use strict';

    var stage = document.querySelector('.focus-stage');
    if (!stage) { return; }

    var phone = window.matchMedia('(max-width: 767px)');
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* How much of the runway is spent fading in at the start and out at the
       end. The middle stretch sits at full strength. */
    var RAMP = 0.18;

    var veil = null;
    var armed = false;
    var lit = false;

    function makeVeil() {
        if (veil) { return; }
        veil = document.createElement('div');
        veil.className = 'focus-veil';
        veil.setAttribute('aria-hidden', 'true');
        document.body.appendChild(veil);
    }

    /* Arming changes the padding inside the stage, which narrows the carousel.
       Owl measures its item widths once and caches them, so without a nudge it
       keeps sizing slides to the old, wider container: each slide then settles
       wider than the visible slot and the card is pushed off and clipped.
       Owl's resize handler compares the carousel's own width, so a plain
       resize event is enough to make it re-measure — no owl API needed here.
       Only fired when the armed state actually flips, so it cannot loop. */
    function remeasureCarousels() {
        window.setTimeout(function () {
            window.dispatchEvent(new Event('resize'));
        }, 0);
    }

    function arm() {
        if (armed) { return; }
        stage.classList.add('is-armed');
        makeVeil();
        armed = true;
        remeasureCarousels();
    }

    function disarm() {
        if (!armed) { return; }
        stage.classList.remove('is-armed');
        armed = false;
        douse();
        remeasureCarousels();
    }

    function douse() {
        if (veil) { veil.style.opacity = '0'; }
        if (lit) {
            document.body.classList.remove('focus-on');
            lit = false;
        }
    }

    /* 0 while the top of the runway is level with the viewport top, 1 at the
       bottom of it. Outside the runway the stage is not pinned. */
    function strength() {
        var box = stage.getBoundingClientRect();
        var runway = box.height - window.innerHeight;
        if (runway <= 0) { return 0; }

        var travelled = -box.top / runway;
        if (travelled <= 0 || travelled >= 1) { return 0; }

        if (travelled < RAMP) { return travelled / RAMP; }
        if (travelled > 1 - RAMP) { return (1 - travelled) / RAMP; }
        return 1;
    }

    function update() {
        /* Re-checked on every scroll rather than trusting the last resize.
           If the stage were left armed on a wide screen, an ordinary section
           taller than the viewport still yields a positive runway, and the
           backdrop would fade in over the desktop layout. */
        if (!phone.matches || calm.matches) {
            disarm();
            return;
        }
        if (!armed) { return; }

        var s = strength();
        veil.style.opacity = String(s);

        /* Flip the text to light only once the backdrop is dark enough to
           carry it, rather than on the first pixel of the ramp. */
        var shouldLight = s > 0.5;
        if (shouldLight !== lit) {
            document.body.classList.toggle('focus-on', shouldLight);
            lit = shouldLight;
        }
    }

    function evaluate() {
        if (phone.matches && !calm.matches) {
            arm();
            update();
        } else {
            disarm();
        }
    }

    /* Passive: this only reads a rect and writes one style, and must never
       block or cancel the scroll it is listening to. */
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', evaluate, { passive: true });
    window.addEventListener('orientationchange', evaluate, { passive: true });

    if (phone.addEventListener) {
        phone.addEventListener('change', evaluate);
        calm.addEventListener('change', evaluate);
    } else if (phone.addListener) {
        phone.addListener(evaluate);
        calm.addListener(evaluate);
    }

    evaluate();
}());
