# Kambu

**Compra lá fora, paga em kwanzas.**
In Angola, importers ("revendedores") run group carts on Shein, Zara, AliExpress, Amazon and others, and let buyers pay in kwanzas at their own exchange rate. Kambu puts those carts in one place: buyers see the Kz rate, when each cart closes, and track the order until pickup.

This repo holds the landing page — plain HTML, CSS and a little JavaScript, no build step. It has light and night themes (follows the system, remembers the visitor's choice). The product and technical plan is in [`docs/product-plan.md`](docs/product-plan.md).

## Structure

| File | Purpose |
|---|---|
| `index.html` | Page markup (Portuguese, pt-AO) |
| `styles.css` | Styles; colour tokens in `:root` (Kambu green + accent orange), light and dark |
| `main.js` | Demo data: hero countdown, open-carts filter, Kz calculator, tracking timeline, theme toggle |
| `favicon.svg` | Icon |
| `vercel.json` | Vercel config (static, clean URLs) |
| `docs/product-plan.md` | Webapp + Android/iOS plan |

All carts, sellers and rates on the page are fictional examples.

## Run locally

```sh
python3 -m http.server 8000
```

## Deploy (Vercel)

1. vercel.com/new → import `42gumball/kambu`.
2. Framework preset: **Other**. Build command: none. Output directory: `.` (root).
3. Deploy. Every push to `main` redeploys automatically.
