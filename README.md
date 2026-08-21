# Berunda

Storefront for Berunda, a heritage-inspired streetwear label from Sri Lanka.

Static HTML, CSS and vanilla JS. No build step — Netlify serves the repo root
as-is, so anything committed here is live.

**Live:** https://berunda.netlify.app

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home: hero slider, categories, featured products, lookbook, reviews, signup |
| `mens.html` / `womens.html` | Category listings |
| `product-*.html` | One page per product |
| `404.html` | Not found. Netlify serves this automatically for unmatched URLs |

## Stylesheets

`css/style.css` holds the design system — tokens, base type, navbar, buttons,
marquee, footer — and is loaded first on every page, after Bootstrap so it wins
the cascade. Everything else is scoped to what it styles: `home.css`,
`slider.css` (product cards), `product.css`, `cart.css`, `404.css`.

Colours, spacing, radii, shadows and easing all come from custom properties in
`style.css`. Change a token there rather than hardcoding a value in a component.

## Scripts

| File | What it does |
| --- | --- |
| `js/cart.js` | Cart drawer, persisted to localStorage |
| `js/focus-stage.js` | Pins the featured row on phones (see below) |
| `js/lookbook.js` | Lightbox for the lookbook grid |
| `js/signup.js` | Newsletter signup |
| `js/owl.carousel.js` + `js/jquery.min.js` | Vendor, drives the sliders |

## Things worth knowing before you edit

- **The newsletter signup is a placeholder.** `js/signup.js` validates the
  address, clears the field and opens a thank-you dialog. Nothing is sent or
  stored, so nobody who signs up is actually subscribed. Point the submit
  handler at a real provider before relying on it.

- **The owl slider is deliberate, and only on the home page.** It shows one
  product at a time on a phone, which is the point of it. Category pages use a
  plain grid so shoppers can see everything at once.

- **The focus stage is not a scroll lock.** On phones the featured row pins to
  the middle of the screen with the page dimmed behind it. It is a tall section
  with a sticky child, so scrolling stays native throughout — nothing calls
  `preventDefault`, so a script error cannot strand anyone inside it. Two
  things it has to do by hand: nudge owl to re-measure when the stage arms
  (owl caches item widths, and arming changes the container, which otherwise
  leaves slides wider than their slot and clips the card), and measure where
  the label sits, since its position depends on the card height.

- **Card shadows need clearance.** The owl stage clips with `overflow: hidden`,
  so `.product` and `.testi` carry padding sized against the hover shadow. Grow
  the shadow and that padding has to grow with it, or it gets sliced off.

- **The slide artwork carries its own text.** Hero banners and the statement
  band already have headlines and logos baked in, so don't lay copy over them.

- **Paths are case-sensitive on Netlify** even though they are not on Windows.
  `Images/` will 404 in production while working fine locally.

- **`_redirects`** keeps old URLs alive after the blog and standalone gallery
  page were removed and `men.html` was split in two.

## Running it locally

Any static server from the repo root:

```bash
python -m http.server 4000
```
