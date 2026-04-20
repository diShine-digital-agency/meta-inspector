# ⚡️ meta-inspector, the no headless browser URL fetcher for meta tags

<div align="center">
  
[![diShine Logo](https://dishine.it/favicon.ico)](https://dishine.it/)

***Transform. Automate. Shine!***

[![Website](https://img.shields.io/badge/Website-dishine.it-blue)](https://dishine.it/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-diShine-blue)](https://linkedin.com/company/100682596)
[![Location](https://img.shields.io/badge/Location-Milan%2C%20Italy-green)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

<p align="center">
  <img src="images/meta_inspector_v3_01_hero_terminal_portrait.webp" alt="Meta Inspector - Markdown export" width="85%">
</p>

*A command-line tool that fetches a URL, extracts its meta tags (Open Graph, Twitter Cards, JSON-LD, Dublin Core, and more), validates them against platform requirements, and simulates how the link will appear when shared on Google, Facebook, LinkedIn, Twitter/X, Slack, and WhatsApp.*

***No headless browser: it runs a plain HTTP fetch and parses the HTML. Typical response time is under 500ms per page.***

Built by [diShine Digital Agency](https://dishine.it).

</div>

<p align="center">
  <img src="images/meta_inspector_refined_02_issues_closeup.webp" alt="Meta Inspector issue closeup" width="49%">
  <img src="images/meta_inspector_refined_04_export_workflow.webp" alt="Meta Inspector workflow" width="49%">
</p>

<p align="center">
  <img src="images/meta_inspector_05_markdown_export.webp" alt="Meta Inspector - Markdown export" width="65%">
</p>

---

## Install

```bash
npm install -g @dishine/meta-inspector
```

Or run without installing:

```bash
npx @dishine/meta-inspector example.com
```

Requires Node.js 18 or later.

---

## Usage

```bash
# Inspect a single URL
meta-inspector example.com

# Save a Markdown report
meta-inspector example.com -f markdown -o report.md

# Inspect multiple URLs
meta-inspector site1.com site2.com site3.com

# Inspect URLs from a file (one per line)
meta-inspector urls.txt -f json -o results.json
```

---

## What it extracts

| Category | Details |
|----------|---------|
| **Basic SEO** | title, description, canonical, viewport, robots, charset, lang, author, generator, theme-color, keywords |
| **Open Graph** | og:title, og:description, og:image (with dimensions and alt), og:url, og:type, og:site_name, og:locale |
| **Twitter Card** | twitter:card, twitter:title, twitter:description, twitter:image, twitter:site |
| **Schema.org** | JSON-LD blocks with @type detection (Organization, WebSite, Article, Product, BreadcrumbList, FAQ, etc.) |
| **Article** | article:published_time, article:modified_time, article:author, article:section, article:tag |
| **Facebook** | fb:app_id, fb:admins, fb:pages |
| **Pinterest** | p:domain_verify |
| **Dublin Core** | DC.title, DC.creator, DC.subject, DCTERMS.* (common in academic/government sites) |
| **Apple** | apple-mobile-web-app-capable, apple-itunes-app, touch startup images |
| **Microsoft** | msapplication-TileColor, msapplication-config, X-UA-Compatible |
| **Security** | Content-Security-Policy, referrer policy, Permissions-Policy (from meta tags) |
| **Links** | canonical, hreflang, RSS/Atom feeds, icons, preconnect, manifest, AMP |
| **Headings** | h1 and h2 hierarchy |

---

## What it validates

### Scoring areas (0-100 each)

| Area | What it checks |
|------|----------------|
| **SEO** | title (presence + length), description (presence + length), canonical (presence + HTTPS), viewport, lang, charset, h1 count, favicon, robots noindex, HTTPS |
| **Open Graph** | og:title, og:description, og:image (absolute URL, dimensions, alt), og:url, og:type, og:site_name, og:locale |
| **Twitter Card** | card type (validity), title, description, image, twitter:site handle, OG fallback detection |
| **Schema.org** | JSON-LD presence, @type declarations, required fields per type (Organization, Article, Product), coverage bonus |

### Issue severity

| Level | Examples |
|-------|----------|
| **critical** | missing title tag |
| **high** | missing viewport, no OG tags, missing meta description, robots noindex, page on HTTP |
| **medium** | missing og:image, missing canonical, no JSON-LD, title too short, canonical on HTTP |
| **low** | missing og:locale, title truncation risk, missing og:image:alt, missing favicon |

Every issue includes a description and, where applicable, the exact HTML snippet to fix it.

### Social preview simulation

Shows how the link will appear on:

- **Google Search**: title (60 chars), URL, description (155 chars)
- **Facebook / Meta**: image, domain, title, description
- **Twitter / X**: image, title, description, domain
- **LinkedIn**: image, title, domain
- **Slack**: site name, title, description
- **WhatsApp**: image, domain, title, description

---

## Output example

```
  Meta Inspector Report
  https://example.com — 6 Apr 2026
  Example Domain

  Scores
  Overall:      [###################-] 96/100
  SEO:          [###################-] 97/100
  Open Graph:   [#################---] 87/100
  Twitter Card: [####################] 100/100
  Schema.org:   [####################] 100/100

  Meta Tags
  title          Example Domain (14 chars)
  description    This domain is for use in illustrative examples... (93 chars)
  canonical      https://example.com

  Open Graph
  og:title       Example Domain
  og:description This domain is for use in illustrative...
  og:image       https://example.com/image.jpg
  og:url         https://example.com
  og:type        website

  Issues (2)
   MEDIUM    [schema] No JSON-LD structured data found
              <script type="application/ld+json">
              { "@context": "https://schema.org", ... }
              </script>
     LOW     [open-graph] Missing og:locale
              <meta property="og:locale" content="en_US">

  Social Previews
  Google Search
  Example Domain
  example.com
  This domain is for use in illustrative examples...
```

---

## CLI options

| Flag | Description | Default |
|------|-------------|---------|
| `-f, --format` | Output format: `table`, `json`, `markdown` | `table` |
| `-o, --output` | Save report to file | stdout |
| `-t, --timeout` | Request timeout in ms | `15000` |
| `--user-agent` | Custom User-Agent string | meta-inspector/1.0 |
| `--no-previews` | Skip social preview simulation | off |
| `-q, --quiet` | Suppress progress messages | off |
| `-h, --help` | Show help | |
| `-v, --version` | Show version | |

---

## Programmatic API

```javascript
import { fetchUrl, extract, validate, generatePreviews, formatMarkdown } from "@dishine/meta-inspector";

const page = await fetchUrl("https://example.com");
const data = extract(page.html, page.finalUrl);
const validation = validate(data, page.finalUrl);
const previews = generatePreviews(data, page.finalUrl);

console.log(formatMarkdown({ fetchInfo: page, data, validation, previews }));

// Access individual fields:
// data.og          — Open Graph tags
// data.twitter     — Twitter Card tags
// data.schema      — JSON-LD blocks
// data.article     — Article metadata
// data.facebook    — fb:app_id, fb:admins
// data.dublin      — Dublin Core tags
// data.security    — CSP, referrer policy
// validation.scores — { overall, seo, openGraph, twitterCard, schema }
// validation.issues — array of issues with severity and fix
```

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Overall score >= 50 |
| `1` | Overall score < 50 |
| `2` | Fatal error (fetch failed) |

Use exit codes for CI/CD integration — the tool returns non-zero when a page needs attention.

---

## Project structure

```
bin/cli.js          CLI entry point
src/index.js        Public API exports
src/fetcher.js      HTTP fetch with redirect following
src/extractor.js    HTML parsing and meta tag extraction
src/validator.js    Validation rules and scoring
src/previewer.js    Social preview simulation
src/reporter.js     Output formatters (table, JSON, Markdown)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

---

## License

MIT — see [LICENSE](LICENSE) for details.

Copyright (c) 2026 [diShine](https://dishine.it)

---

## About diShine

[diShine](https://dishine.it) is a creative tech agency based in Milan. We create digital strategies, design process and build tools for clients, help businesses with AI strategy and MarTech architecture, and open-source some things we wish existed.

- Web: [dishine.it](https://dishine.it)
- GitHub: [github.com/diShine-digital-agency](https://github.com/diShine-digital-agency)
- Contact: kevin@dishine.it
