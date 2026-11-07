# Halo 3 Emblem Generator

Design a Halo 3 emblem in the browser and download it as a 512×512 PNG. Pick any of the 80 Halo 3 emblems
and 48 backgrounds, then colour the primary, secondary and background layers from 112 palettes
(hand-picked, art, film, design, retro, code themes, full spectrum) or a free colour picker.

## Develop

Needs Node 24+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test
npm run typecheck
npm run lint       # ESLint with eslint-rules/, then scripts/check-exports.ts
npm run check      # all of the above + build, same as CI
```

| Path | What |
| --- | --- |
| `src/model/` | App logic with no DOM: state, catalog, palettes, the design ⇄ URL format. Runs in the Node tests |
| `src/ui/` | One component per panel. Each gets the store and its elements, nothing else |
| `src/catalog.ts` | Everything on offer: artwork from `src/assets/`, palettes from `src/data/` |
| `src/render.ts` | Draws the emblem: each layer is a mask filled with its colour |
| `src/assets/` | Artwork as white-on-alpha masks, 512 px plus a 112 px thumbnail each |
| `src/data/palettes.json` | Palette categories, one palette per line. The first palette is shown first |
| `src/data/emblem-order.json` | Emblem display order (Halo 3's). Unlisted emblems go last, A–Z |
| `index.html` | Page, SEO tags and the text below the tool. `{{placeholders}}` are filled by `vite.config.ts` |
| `public/` | Social preview image and favicons, copied as-is |

### Links

The address bar always holds the design on screen, e.g.
`?emblem=sol&background=circle&colors=1e3d2b-6a994e-f2e8cf` (primary, secondary, background; `&secondary=off`
when that layer is hidden). Names are the emblem and background names in lowercase with dashes, so renaming an
asset folder breaks old links to it.

Saved PNGs carry the same query in a `halo3-emblem` text chunk (`src/model/png-text.ts`). Dropping one on the
page, or "Open PNG", loads it. Sites that re-encode uploads (some chat apps, social networks) strip it.

### Adding things

- **Palette:** add a line to `src/data/palettes.json`. Names must be unique; colours are `["Name", "#rrggbb"]`
  (lowercase). `npm test` checks both.
- **Emblem or background:** a folder in `src/assets/emblems/` (`primary.png`, optional `secondary.png`) or
  `src/assets/backgrounds/` (`mask.png`). Each PNG is a 512 px white-on-alpha mask with a 112 px
  `<name>.thumb.png` beside it. `npm test` checks the files and sizes.

The artwork came from the *Halo 3 High Resolution Emblem Pack* by SK CRISIS, converted with
`scripts/import_pack.py`. `scripts/make_site_images.py` draws the social preview image and favicons. Both are
one-off Python tools (Pillow, numpy), not part of the build.

## Release

GitHub Pages deploys on every push to `main` (`.github/workflows/pages.yml`):
typecheck → lint → test → build → deploy. Any failure stops the deploy. Pull requests run the checks only.

One-time setup:

1. Repo Settings → Pages → Source: **GitHub Actions**.
2. Analytics (optional): create a website in [Umami](https://umami.is), then add its id as a repository
   variable `UMAMI_WEBSITE_ID` (Settings → Secrets and variables → Actions → Variables). Without it the site
   builds without analytics.
3. After the first deploy, submit `<site>/sitemap.xml` in Google Search Console.

The build reads these from the environment (CI) or a local `.env`:

| Variable | Default | What |
| --- | --- | --- |
| `SITE_URL` | set by CI from GitHub Pages | Public URL for canonical, social-preview and sitemap links |
| `UMAMI_WEBSITE_ID` | none (analytics off) | Umami website id |
| `UMAMI_SCRIPT_URL` | Umami Cloud | Only for self-hosted Umami |

Analytics is cookie-free and anonymous: page views plus `download` (emblem, background, palette),
`randomize`, `copy-link` and `open-image` events. The design in the URL is left out of page views. It only counts visits on the real domain and honours Do Not Track.

Halo is a trademark of Microsoft. This is a fan-made tool, not affiliated with Microsoft, Bungie or Halo Studios.
