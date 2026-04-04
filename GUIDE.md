# meta-inspector — User Guide

**A step-by-step guide to inspecting meta tags, Open Graph data, and social previews for any URL.**

No technical expertise required. This guide walks you through everything.

---

## Table of Contents

1. [What Does This Tool Do?](#1-what-does-this-tool-do)
2. [Installation](#2-installation)
3. [Your First Inspection](#3-your-first-inspection)
4. [Understanding the Report](#4-understanding-the-report)
5. [Saving Reports](#5-saving-reports)
6. [Batch Inspecting Multiple URLs](#6-batch-inspecting-multiple-urls)
7. [All Options Explained](#7-all-options-explained)
8. [Social Preview Simulations](#8-social-preview-simulations)
9. [Common Issues and How to Fix Them](#9-common-issues-and-how-to-fix-them)
10. [Using in Code (Programmatic)](#10-using-in-code-programmatic)
11. [CI/CD Integration](#11-cicd-integration)
12. [Troubleshooting](#12-troubleshooting)
13. [FAQ](#13-faq)

---

## 1. What Does This Tool Do?

When you share a link on social media, messaging apps, or search engines, they display a **preview** of your page — a title, description, and image. These previews are generated from special HTML tags in your page called **meta tags**.

meta-inspector fetches any URL and tells you:

- **What meta tags are present** — title, description, Open Graph, Twitter Cards, JSON-LD schema
- **How your link will look** when shared on Google, Facebook, Twitter/X, LinkedIn, Slack, and WhatsApp
- **What's missing or misconfigured** — with severity levels and exact HTML code to fix it
- **An overall score** for SEO, Open Graph, Twitter Card, and Schema.org compliance

### Why does this matter?

- A missing `og:image` means your link shows up with no image on Facebook and LinkedIn — dramatically reducing click-through rates
- A title that's too long gets cut off in Google search results
- Missing Twitter Card tags mean your link looks plain on Twitter/X
- No JSON-LD schema means search engines can't show rich results (star ratings, FAQs, etc.)

meta-inspector replaces 4-5 separate debugger tools (Facebook Sharing Debugger, Twitter Card Validator, Google Rich Results Test, etc.) with one command.

---

## 2. Installation

### What you need

- **Node.js 18 or later** installed on your computer
  - Check: open a terminal and run `node --version`
  - If not installed: download from [nodejs.org](https://nodejs.org) (choose the LTS version)

### Install meta-inspector

```bash
npm install -g @dishine/meta-inspector
```

This installs it globally so you can run it from anywhere.

### Alternative: Run without installing

```bash
npx @dishine/meta-inspector example.com
```

---

## 3. Your First Inspection

### Basic inspection

```bash
meta-inspector example.com
```

That's it. The tool will:
1. Fetch the page (follows redirects automatically)
2. Parse all meta tags, Open Graph tags, Twitter Card tags, and JSON-LD schema
3. Validate everything against platform requirements
4. Simulate how the link appears on 6 social platforms
5. Print the full report in your terminal

### What you'll see

```
  Meta Inspector Report
  https://example.com — 4 Apr 2026
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
  ...

  Social Previews

  Google Search
  Example Domain
  example.com
  This domain is for use in illustrative examples...

  Facebook / Meta
  +--------------------------------------------+
  |              [IMAGE 1200x630]              |
  +--------------------------------------------+
  | EXAMPLE.COM                                |
  | Example Domain                             |
  | This domain is for use in illustrative...  |
  +--------------------------------------------+
  ...
```

---

## 4. Understanding the Report

### Scores (0-100)

The report gives you four area scores plus an overall score:

| Score | What it measures |
|-------|-----------------|
| **SEO** | Title tag (presence, length), meta description, canonical URL, viewport, language, charset, heading structure |
| **Open Graph** | og:title, og:description, og:image (URL, dimensions, alt text), og:url, og:type, og:site_name, og:locale |
| **Twitter Card** | Card type, title, description, image, twitter:site handle |
| **Schema.org** | JSON-LD presence, @type declarations, Organization/WebSite coverage |
| **Overall** | Weighted average of all four areas |

**Score interpretation:**

| Range | Rating | Action |
|-------|--------|--------|
| 90-100 | Excellent | Minor tweaks only |
| 70-89 | Good | A few improvements needed |
| 50-69 | Fair | Several issues to address |
| 0-49 | Poor | Major issues — fix before sharing |

### Issue Severity Levels

| Severity | What it means | Examples |
|----------|--------------|---------|
| **Critical** | Must fix — your page won't display properly | Missing title tag, missing viewport meta |
| **High** | Should fix — major impact on how your link appears | No OG tags, no Twitter Card + no OG fallback, missing meta description |
| **Medium** | Good to fix — noticeable improvement | Missing og:image, no canonical URL, no JSON-LD schema |
| **Low** | Nice to have — minor polish | Missing og:locale, title slightly too long, missing og:image:alt |

### What Each Section Shows

**Meta Tags** — The basic HTML meta tags:
- `title`: Page title (shown in browser tab and search results)
- `description`: Summary shown in search results
- `canonical`: The "official" URL for this page (prevents duplicate content)
- `viewport`: Mobile responsiveness setting
- `robots`: Instructions for search engine crawlers

**Open Graph** — Tags that control how your link appears on Facebook, LinkedIn, WhatsApp:
- `og:title`: Title shown in the preview
- `og:description`: Description shown below the title
- `og:image`: The preview image (ideally 1200x630 pixels)
- `og:url`: The canonical URL for sharing
- `og:type`: Content type (website, article, product, etc.)

**Twitter Card** — Tags that control how your link appears on Twitter/X:
- `twitter:card`: Card type (summary, summary_large_image)
- `twitter:title`: Title (falls back to og:title if missing)
- `twitter:description`: Description
- `twitter:image`: Preview image
- `twitter:site`: Your Twitter handle

**Schema.org / JSON-LD** — Structured data that enables rich search results:
- Organization, WebSite, Article, Product, FAQ, etc.
- Powers Google's rich snippets (star ratings, FAQ accordions, breadcrumbs)

---

## 5. Saving Reports

### Save to a file

```bash
# Save as Markdown (great for client reports and documentation)
meta-inspector example.com -f markdown -o report.md

# Save as JSON (for processing in other tools or dashboards)
meta-inspector example.com -f json -o report.json
```

### Output format comparison

| Format | Best for | Opens with |
|--------|----------|------------|
| **table** (default) | Quick review in terminal | Terminal only |
| **markdown** | Client reports, documentation, sharing | Any text editor, Notion, GitHub |
| **json** | Dashboards, automated processing | Code editors, jq |

### Creating a client-ready report

```bash
meta-inspector clientsite.com -f markdown -o "ClientName - Meta Audit - 2026-04-04.md"
```

Open the file, copy into Google Docs or Word, add your branding, and send to the client.

---

## 6. Batch Inspecting Multiple URLs

### Multiple URLs from the command line

```bash
meta-inspector page1.com page2.com page3.com -f json -o all-results.json
```

### From a text file

Create a file with one URL per line:

```
# urls.txt
https://example.com
https://example.com/about
https://example.com/blog/my-post
https://example.com/products
```

```bash
meta-inspector urls.txt -f markdown -o full-report.md
```

### Batch use cases

- **Pre-launch checklist:** Check all key pages before a website goes live
- **Content audit:** Verify meta tags across all blog posts
- **Multi-site portfolio:** Monthly check across all client websites
- **Migration verification:** Ensure meta tags survived a site redesign

---

## 7. All Options Explained

| Flag | Long form | What it does | Default |
|------|-----------|-------------|---------|
| `-f` | `--format` | Output format: `table`, `json`, `markdown` | `table` |
| `-o` | `--output` | Save to a file | Print to screen |
| `-t` | `--timeout` | Request timeout in milliseconds | `15000` (15 sec) |
| | `--user-agent` | Custom User-Agent string for the request | `meta-inspector/1.0` |
| | `--no-previews` | Skip social preview generation | Off (previews shown) |
| `-q` | `--quiet` | Suppress progress messages | Off |
| `-h` | `--help` | Show help text | |
| `-v` | `--version` | Show version number | |

### Examples

```bash
# Basic inspection
meta-inspector example.com

# Save as Markdown
meta-inspector example.com -f markdown -o report.md

# Longer timeout for slow sites
meta-inspector slowsite.com -t 30000

# Skip social previews (faster output)
meta-inspector example.com --no-previews

# Use a specific User-Agent (some sites block default agents)
meta-inspector example.com --user-agent "Mozilla/5.0 (compatible; AuditBot/1.0)"

# Quiet mode — only the report, no progress messages
meta-inspector example.com -q

# Batch scan with JSON output
meta-inspector urls.txt -f json -o batch-results.json
```

---

## 8. Social Preview Simulations

The most visual part of the report — it shows you exactly how your link will render on each platform.

### Google Search

```
Example Domain
example.com
This domain is for use in illustrative examples in documents...
```

- Title is truncated at **60 characters**
- Description is truncated at **155 characters**
- URL shows the clean domain path

### Facebook / Meta

```
+--------------------------------------------+
|              [IMAGE 1200x630]              |
+--------------------------------------------+
| EXAMPLE.COM                                |
| Example Domain                             |
| This domain is for use in illustrative...  |
+--------------------------------------------+
```

- Requires `og:image` (recommended: 1200x630 pixels)
- Shows domain in UPPERCASE
- Title and description from `og:title` and `og:description`

### Twitter / X

```
+--------------------------------------------+
|              [IMAGE]                       |
+--------------------------------------------+
| Example Domain                             |
| This domain is for use in illustrative...  |
| example.com                                |
+--------------------------------------------+
```

- Uses `twitter:card` type: `summary` (small image) or `summary_large_image` (large image)
- Falls back to OG tags if Twitter-specific tags are missing

### LinkedIn

```
+--------------------------------------------+
|              [IMAGE 1200x627]              |
+--------------------------------------------+
| Example Domain                             |
| example.com                                |
+--------------------------------------------+
```

- Uses OG tags (doesn't have its own meta tag system)
- Recommended image: 1200x627 pixels

### Slack

```
| Example Site
| Example Domain
| This domain is for use in illustrative examples...
```

- Shows as an inline unfurl with a colored left border
- Uses `og:site_name` for the header

### WhatsApp

```
  +--------------------------------------+
  | example.com                          |
  | Example Domain                       |
  | This domain is for use in illustr... |
  +--------------------------------------+
```

- Compact card format
- Uses OG tags

### Optimizing your previews

For the best possible appearance across all platforms:

1. **Set all OG tags** — `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
2. **Use a 1200x630 image** — this size works on all platforms
3. **Add Twitter Card tags** — at minimum `twitter:card` and `twitter:image`
4. **Keep titles under 60 characters** — prevents truncation everywhere
5. **Keep descriptions under 155 characters** — readable on all platforms
6. **Add `og:site_name`** — shows your brand name in Slack unfurls

---

## 9. Common Issues and How to Fix Them

Every issue in the report includes the exact HTML code to fix it. Here are the most common ones:

### Missing og:image

**Impact:** Your link appears with no image on Facebook, LinkedIn, and WhatsApp.
**Fix:** Add to your page's `<head>`:
```html
<meta property="og:image" content="https://example.com/images/share.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### Title too long

**Impact:** Gets cut off in Google search results and social previews.
**Fix:** Keep it under 60 characters. Front-load the important keywords.

### Missing meta description

**Impact:** Google may generate its own description from page content — often not ideal.
**Fix:**
```html
<meta name="description" content="Your concise page summary here (under 155 characters)" />
```

### No canonical URL

**Impact:** Search engines may index duplicate URLs (www vs non-www, with/without trailing slash).
**Fix:**
```html
<link rel="canonical" href="https://example.com/page" />
```

### Missing JSON-LD schema

**Impact:** No rich results in Google (no star ratings, FAQ accordions, breadcrumbs).
**Fix:** Add structured data in a `<script>` tag:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Example",
  "url": "https://example.com"
}
</script>
```

### No Twitter Card tags

**Impact:** Your link appears as a plain URL on Twitter/X instead of a rich card.
**Fix:**
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Your Title" />
<meta name="twitter:description" content="Your description" />
<meta name="twitter:image" content="https://example.com/images/share.jpg" />
```

---

## 10. Using in Code (Programmatic)

```javascript
import { fetchUrl, extract, validate, generatePreviews, formatMarkdown } from "@dishine/meta-inspector";

// 1. Fetch the page
const page = await fetchUrl("https://example.com");

// 2. Extract all meta data
const data = extract(page.html, page.finalUrl);

// 3. Validate against platform requirements
const validation = validate(data, page.finalUrl);

// 4. Generate social preview simulations
const previews = generatePreviews(data, page.finalUrl);

// 5. Format as Markdown
console.log(formatMarkdown({ fetchInfo: page, data, validation, previews }));

// Or access raw data:
console.log(data.og);           // Open Graph tags
console.log(data.twitter);     // Twitter Card tags
console.log(data.schema);      // JSON-LD schema blocks
console.log(validation.scores); // { overall, seo, openGraph, twitterCard, schema }
console.log(validation.issues); // Array of issues with severity and fix instructions
```

---

## 11. CI/CD Integration

meta-inspector returns different exit codes:

| Exit code | Meaning |
|-----------|---------|
| `0` | Overall score >= 50 (acceptable) |
| `1` | Overall score < 50 (needs work) |
| `2` | Fatal error (fetch failed) |

### Example: GitHub Actions

```yaml
- name: Check meta tags
  run: |
    npx @dishine/meta-inspector https://staging.example.com -q
    # Fails the build if score is below 50
```

### Example: Pre-deploy hook

```bash
#!/bin/bash
meta-inspector "$STAGING_URL" -q -f json -o /tmp/meta-check.json
if [ $? -eq 1 ]; then
  echo "Meta tag check FAILED (score below 50). Fix before deploying."
  exit 1
fi
```

---

## 12. Troubleshooting

### "Fetch failed" or timeout error

**Cause:** The website is unreachable, too slow, or blocking the request.
**Fix:**
```bash
# Try with a longer timeout
meta-inspector example.com -t 30000

# Try with a browser-like User-Agent
meta-inspector example.com --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
```

### Empty or incomplete results

**Cause:** The site may render content with JavaScript (SPA/React/Vue) that plain HTTP fetch can't see.
**Note:** meta-inspector uses a simple HTTP fetch, not a headless browser. If a site's meta tags are injected by JavaScript, the tool may not see them.
**Workaround:** Check the page's source code directly (`View Source` in your browser, not `Inspect Element`) — meta tags should be in the initial HTML.

### "Permission denied" on install

**Fix:**
```bash
sudo npm install -g @dishine/meta-inspector
```
Or use `npx` (no global install):
```bash
npx @dishine/meta-inspector example.com
```

### Reports look messy in the terminal

**Cause:** Terminal window is too narrow.
**Fix:** Widen your terminal to at least 80 columns. The social preview boxes need ~50 columns minimum.

---

## 13. FAQ

**Q: Does this tool use a headless browser?**
A: No. It uses a simple HTTP fetch — much faster (~400ms per page) and no Chromium download needed. The tradeoff is that it can't see meta tags injected by JavaScript.

**Q: How is this different from the Facebook Sharing Debugger?**
A: Facebook's debugger only shows Facebook-specific tags. meta-inspector shows everything (SEO, OG, Twitter, Schema) and simulates previews for 6 platforms in one command. Plus it works offline (no Facebook login needed) and can batch-scan multiple URLs.

**Q: Can I use this for client audits?**
A: Yes. Save the report as Markdown (`-f markdown -o report.md`), add your agency branding, and share with clients. The tool is MIT licensed — use it freely for commercial work.

**Q: How often should I run meta inspections?**
A: Before every page launch, after CMS updates, and monthly for high-traffic pages. Meta tags sometimes get lost during deployments.

**Q: Does it check pages behind a login?**
A: No. It can only inspect publicly accessible URLs.

**Q: Can I add custom validation rules?**
A: Yes. Edit `src/validator.js` to add custom checks. Each check is a simple function that receives the extracted data and returns issues.

---

*Built by [diShine Digital Agency](https://dishine.it). MIT License.*
