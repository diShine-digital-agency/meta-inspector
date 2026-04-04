# meta-inspector

**See exactly how your page looks when someone shares it on Google, Facebook, LinkedIn, Twitter/X, Slack, or WhatsApp.**

You spend time writing a great blog post, then someone shares it on LinkedIn and it shows up with a broken image, a truncated title, or worse -- the wrong description entirely. This tool fetches a URL, extracts every meta tag it can find (Open Graph, Twitter Cards, JSON-LD schema, the lot), validates them against each platform's requirements, and shows you a simulated preview of how the link will actually render. It also tells you what's missing and gives you the exact HTML to fix it.

No headless browser needed -- it's a plain HTTP fetch, so it runs in about 400ms per page.

Built by [diShine](https://dishine.it)

---

## Quick start

```bash
# Install globally
npm install -g @dishine/meta-inspector

# Inspect a URL
meta-inspector example.com

# Save a Markdown report
meta-inspector example.com -f markdown -o report.md

# Batch inspect
meta-inspector site1.com site2.com site3.com -f json -o results.json
```

Or run it without installing:

```bash
npx @dishine/meta-inspector example.com
```

---

## What the output looks like

```
  Meta Inspector Report
  https://stripe.com -- 4 Apr 2026
  Stripe | Financial Infrastructure to Grow Your Revenue

  Scores
  Overall:      [###################-] 96/100
  SEO:          [###################-] 97/100
  Open Graph:   [#################---] 87/100
  Twitter Card: [####################] 100/100
  Schema.org:   [####################] 100/100

  Meta Tags
  title          Stripe | Financial Infrastructure to Grow Your Revenue (54 chars)
  description    Stripe is a financial services platform that helps all... (148 chars)
  canonical      https://stripe.com/en-it

  Open Graph
  og:title       Stripe | Financial Infrastructure to Grow Your Revenue
  og:description Stripe is a financial services platform...
  og:image       https://images.stripeassets.com/.../Stripe.jpg
  og:url         https://stripe.com/en-it/
  og:type        website

  Social Previews

  Google Search
  Stripe | Financial Infrastructure to Grow Your Revenue
  stripe.com/en-it
  Stripe is a financial services platform that helps all...

  Facebook / Meta
  +--------------------------------------------+
  |              [IMAGE 1200x630]              |
  +--------------------------------------------+
  | STRIPE.COM                                 |
  | Stripe | Financial Infrastructure to Gr... |
  | Stripe is a financial services platform... |
  +--------------------------------------------+

  LinkedIn
  +--------------------------------------------+
  |              [IMAGE 1200x627]              |
  +--------------------------------------------+
  | Stripe | Financial Infrastructure to Gr... |
  | stripe.com                                 |
  +--------------------------------------------+
```

---

## What it does, step by step

1. Fetches the page (follows redirects, reports the chain)
2. Extracts everything it can find: title, description, canonical, OG tags, Twitter Cards, JSON-LD schema, icons, hreflang, headings
3. Validates each area against platform requirements and scores SEO, Open Graph, Twitter Card, and Schema separately (0-100)
4. Simulates social previews showing how your link renders on 6 platforms
5. Reports issues with the exact HTML fix you can copy-paste into your `<head>`

---

## What it validates

### Scoring areas (0-100 each)

| Area | What it checks |
|------|----------------|
| **SEO** | title (length + presence), description, canonical, viewport, lang, charset, h1 count |
| **Open Graph** | og:title, og:description, og:image (absolute URL, dimensions, alt), og:url, og:type, og:site_name, og:locale |
| **Twitter Card** | card type, title, description, image, twitter:site handle |
| **Schema.org** | JSON-LD presence, @type declarations, Organization/WebSite coverage |

### Issue severity

| Level | Examples |
|-------|----------|
| **critical** | missing title tag, missing viewport |
| **high** | no OG tags at all, no Twitter Card and no OG fallback, missing meta description |
| **medium** | missing og:image, missing canonical, no JSON-LD, title too short |
| **low** | missing og:locale, title truncation risk, missing og:image:alt |

Every issue comes with the exact HTML snippet to fix it.

### Social preview simulation

Shows how your link will appear on:
- **Google Search** -- title (60 chars), URL, description (155 chars)
- **Facebook / Meta** -- image, domain, title, description
- **Twitter / X** -- image, title, description, domain
- **LinkedIn** -- image, title, domain
- **Slack** -- site name, title, description
- **WhatsApp** -- image, domain, title, description

This is genuinely useful for catching things like images that are the wrong aspect ratio for Facebook, or titles that get cut off on LinkedIn. You see the problem before your audience does.

---

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-f, --format` | output: `table`, `json`, `markdown` | `table` |
| `-o, --output` | save report to file | stdout |
| `-t, --timeout` | request timeout in ms | `15000` |
| `--user-agent` | custom User-Agent string | meta-inspector/1.0 |
| `--no-previews` | skip social preview generation | off |
| `-q, --quiet` | suppress progress messages | off |

---

## Batch mode

Inspect multiple URLs in one go:

```bash
# Multiple arguments
meta-inspector example.com other.com third.com

# From a file (one URL per line)
meta-inspector urls.txt -f json -o audit.json
```

---

## Programmatic usage

```javascript
import { fetchUrl, extract, validate, generatePreviews, formatMarkdown } from "@dishine/meta-inspector";

const page = await fetchUrl("https://example.com");
const data = extract(page.html, page.finalUrl);
const validation = validate(data, page.finalUrl);
const previews = generatePreviews(data, page.finalUrl);

console.log(formatMarkdown({ fetchInfo: page, data, validation, previews }));
```

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | overall score >= 50 |
| `1` | overall score < 50 (needs work) |
| `2` | fatal error (fetch failed) |

---

## Requirements

- **Node.js** 18 or later
- No headless browser needed -- it's pure HTTP fetch + HTML parsing

---

## License

MIT License -- see [LICENSE](LICENSE) for details.

Copyright (c) 2026 [diShine](https://dishine.it)
