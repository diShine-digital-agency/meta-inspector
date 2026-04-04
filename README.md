# meta-inspector

**Fetch any URL — get meta tags, Open Graph, Twitter Cards, schema markup, and social preview simulations.**

One command shows you exactly how your page looks when shared on Google, Facebook, LinkedIn, Twitter/X, Slack, and WhatsApp.

Built by [diShine Digital Agency](https://dishine.it)

---

## What it does

1. Fetches the page (follows redirects, reports chain)
2. Extracts **everything**: title, description, canonical, OG tags, Twitter Cards, JSON-LD schema, icons, hreflang, headings
3. **Validates** each area against platform requirements — scores SEO, Open Graph, Twitter Card, and Schema separately
4. **Simulates social previews** — shows exactly how your link will render on 6 platforms
5. Reports issues with **exact HTML fixes** you can copy-paste

No headless browser needed — works with a simple HTTP fetch (~400ms per page).

---

## Quick Start

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

Or run without installing:

```bash
npx @dishine/meta-inspector example.com
```

---

## Output Example

```
  Meta Inspector Report
  https://stripe.com — 4 Apr 2026
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

## What it checks

### Scoring (0-100 per area)

| Area | What it validates |
|------|-------------------|
| **SEO** | Title (length, presence), description, canonical, viewport, lang, charset, h1 count |
| **Open Graph** | og:title, og:description, og:image (absolute URL, dimensions, alt), og:url, og:type, og:site_name, og:locale |
| **Twitter Card** | card type, title, description, image, twitter:site handle |
| **Schema.org** | JSON-LD presence, @type declarations, Organization/WebSite coverage |

### Issue severity

| Level | Examples |
|-------|----------|
| **Critical** | Missing title tag, missing viewport |
| **High** | No OG tags, no Twitter Card + no OG fallback, missing meta description |
| **Medium** | Missing og:image, missing canonical, no JSON-LD, short title |
| **Low** | Missing og:locale, long title (truncation risk), missing og:image:alt |

Every issue includes the **exact HTML** to fix it.

### Social preview simulation

Shows how your link will appear on:
- **Google Search** — title (60 chars), URL, description (155 chars)
- **Facebook / Meta** — image, domain, title, description
- **Twitter / X** — image, title, description, domain
- **LinkedIn** — image, title, domain
- **Slack** — site name, title, description
- **WhatsApp** — image, domain, title, description

---

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-f, --format` | Output: `table`, `json`, `markdown` | `table` |
| `-o, --output` | Save report to file | stdout |
| `-t, --timeout` | Request timeout in ms | `15000` |
| `--user-agent` | Custom User-Agent string | meta-inspector/1.0 |
| `--no-previews` | Skip social preview generation | off |
| `-q, --quiet` | Suppress progress messages | off |

---

## Batch mode

Inspect multiple URLs in one command:

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
| `0` | Overall score >= 50 |
| `1` | Overall score < 50 (needs work) |
| `2` | Fatal error (fetch failed) |

---

## Requirements

- **Node.js** 18 or later
- No headless browser needed (pure HTTP fetch + HTML parsing)

---

## License

MIT License — see [LICENSE](LICENSE) for details.

Copyright (c) 2026 [diShine Digital Agency](https://dishine.it)
