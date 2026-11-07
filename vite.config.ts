import { readFileSync, readdirSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import type { HtmlTagDescriptor, Plugin } from 'vite'

const UMAMI_CLOUD_SCRIPT = 'https://cloud.umami.is/script.js'

// Settings come from the environment (CI) or a local .env file:
//   SITE_URL          public URL of the site, e.g. https://you.github.io/halo-emblem-generator/
//   UMAMI_WEBSITE_ID  Umami website id; analytics is off without it
//   UMAMI_SCRIPT_URL  only for self-hosted Umami
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: './', // works at a domain root and under a GitHub Pages project path
    build: { assetsInlineLimit: 0 }, // keep every mask a cacheable file instead of inlining small ones into the JS
    plugins: [siteMeta(siteSettings(env, command))],
  }
})

interface Site {
  url: string
  umamiId: string
  umamiScript: string
}

function siteSettings(env: Record<string, string>, command: 'build' | 'serve'): Site {
  if (command === 'build' && !env.SITE_URL) {
    console.warn('[site] SITE_URL is not set: canonical and social-preview URLs will point at localhost.')
  }
  const fallback = command === 'serve' ? 'http://localhost:5173/' : 'http://localhost:4173/'
  return {
    url: (env.SITE_URL || fallback).replace(/\/?$/, '/'),
    umamiId: env.UMAMI_WEBSITE_ID ?? '',
    umamiScript: env.UMAMI_SCRIPT_URL || UMAMI_CLOUD_SCRIPT,
  }
}

// Fills {{placeholders}} in index.html, adds the analytics script, and writes robots.txt + sitemap.xml.
function siteMeta(site: Site): Plugin {
  const fields: Record<string, string> = { site_url: escapeHtml(site.url), ...catalogCounts() }
  return {
    name: 'site-meta',
    transformIndexHtml(html) {
      const filled = html.replace(/\{\{(\w+)\}\}/g, (placeholder, key: string) => {
        if (!(key in fields)) throw new Error(`index.html: unknown placeholder ${placeholder}`)
        return fields[key]
      })
      return { html: filled, tags: analyticsTags(site) }
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${site.url}sitemap.xml\n` })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(site.url) })
    },
  }
}

// Counts quoted in the page text, read from the same files the app loads.
function catalogCounts() {
  const folders = (path: string) =>
    readdirSync(new URL(path, import.meta.url), { withFileTypes: true }).filter((entry) => entry.isDirectory()).length
  const categories = JSON.parse(readFileSync(new URL('./src/data/palettes.json', import.meta.url), 'utf8')) as
    { palettes: unknown[] }[]
  return {
    emblem_count: String(folders('./src/assets/emblems/')),
    background_count: String(folders('./src/assets/backgrounds/')),
    palette_count: String(categories.reduce((total, category) => total + category.palettes.length, 0)),
  }
}

// Umami: cookie-free page views. Counts only on the real domain (not localhost) and honours Do Not Track.
// The query string (the design, see src/model/permalink.ts) is left out, so editing an emblem isn't a page view.
function analyticsTags(site: Site): HtmlTagDescriptor[] {
  if (!site.umamiId) return []
  return [{
    tag: 'script',
    injectTo: 'head',
    attrs: {
      'defer': true,
      'src': site.umamiScript,
      'data-website-id': site.umamiId,
      'data-domains': new URL(site.url).hostname,
      'data-do-not-track': 'true',
      'data-exclude-search': 'true',
    },
  }]
}

function sitemap(url: string) {
  const today = new Date().toISOString().slice(0, 10)
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${escapeHtml(url)}</loc><lastmod>${today}</lastmod></url>
</urlset>
`
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
