# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-06

### Added

- **Dublin Core extraction** — extracts `DC.*` and `DCTERMS.*` meta tags (common in academic and government sites).
- **Apple meta extraction** — detects `apple-mobile-web-app-capable`, `apple-itunes-app`, and touch startup images.
- **Microsoft meta extraction** — detects `msapplication-*` tags and `X-UA-Compatible`.
- **Facebook platform extraction** — extracts `fb:app_id`, `fb:admins`, `fb:pages`, and Pinterest `p:domain_verify`.
- **Article metadata extraction** — extracts `article:published_time`, `article:modified_time`, `article:author`, `article:section`, `article:tag`.
- **Security meta extraction** — detects Content-Security-Policy, referrer policy, and Permissions-Policy from meta tags.
- **New SEO validation checks:**
  - Canonical URL using HTTP instead of HTTPS.
  - Page served over HTTP.
  - `robots` noindex detection (informational warning).
  - Missing explicit favicon link tag.
- **Expanded Schema.org validation:**
  - Validates required fields on Organization schemas (`name`, `url`, `logo`).
  - Validates required fields on Article/BlogPosting/NewsArticle schemas (`headline`, `datePublished`, `author`).
  - Validates Product schema (`name`).
  - Handles `@type` arrays (e.g., `["WebPage", "ItemPage"]`).
  - Bonus scoring for WebPage/Article type coverage.
- **JSON output** now includes `article`, `facebook`, `dublin`, `apple`, `ms`, and `security` fields.
- **Table output** now shows Article Metadata, Facebook/Platform, and Security sections when present.
- **Markdown output** now includes Article Metadata and Facebook/Platform sections.
- `CHANGELOG.md` (this file).
- `CONTRIBUTING.md` with contribution guidelines.
- `SECURITY.md` with vulnerability reporting instructions.

### Fixed

- Canonical URL validation now uses the actual page URL instead of a placeholder when suggesting a fix.

### Changed

- Updated `package.json` keywords to include `dublin-core`, `seo-audit`, and `meta-inspector`.

## [1.0.0] - 2026-04-04

### Added

- Initial release.
- Fetch any URL with redirect following (up to 10 hops).
- Extract meta tags: title, description, canonical, viewport, robots, author, generator, theme-color, keywords.
- Extract Open Graph tags (`og:*`).
- Extract Twitter Card tags (`twitter:*`).
- Extract JSON-LD structured data (Schema.org).
- Extract link tags: canonical, alternate, hreflang, feeds, icons, preconnect, manifest, AMP.
- Extract image metadata: og:image, twitter:image, favicon.
- Extract heading hierarchy (h1, h2).
- Validate SEO, Open Graph, Twitter Card, and Schema.org with scoring (0-100 each).
- Generate social preview simulations for Google, Facebook, Twitter/X, LinkedIn, Slack, and WhatsApp.
- CLI with table, JSON, and Markdown output formats.
- Batch mode for multiple URLs.
- File input (one URL per line).
- Programmatic API with named exports.
- Exit codes for CI/CD integration.

[1.1.0]: https://github.com/diShine-digital-agency/meta-inspector/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/diShine-digital-agency/meta-inspector/releases/tag/v1.0.0
