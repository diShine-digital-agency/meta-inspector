// Test suite for meta-inspector.
//
// Plain Node.js assertions — no framework. Covers extractor, validator,
// previewer, reporter, and the public API surface. fetcher.js is excluded
// because it requires network access; run `node bin/cli.js example.com` for
// a live smoke test.
//
// Usage: npm test   (or: node test/run.js)

import assert from "node:assert/strict";
import {
  extract,
  validate,
  generatePreviews,
  renderPreviews,
  formatTable,
  formatJSON,
  formatMarkdown,
  fetchUrl,
} from "../src/index.js";
import { renderPreviewsPlain } from "../src/previewer.js";

let passed = 0;
let failed = 0;
const failures = [];

function suite(name, fn) {
  console.log(`\n  ${name}`);
  fn();
}

function test(name, fn) {
  try {
    fn();
    console.log(`    ok  ${name}`);
    passed++;
  } catch (err) {
    console.log(`    FAIL  ${name}`);
    console.log(`         ${err.message}`);
    failures.push({ name, err });
    failed++;
  }
}

// ── Fixtures ────────────────────────────────────────────────────────────

const PAGE_URL = "https://example.com/article";

const RICH_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rich test page — meta-inspector</title>
  <meta name="description" content="A fully tagged page used for unit tests of meta-inspector's extractor, validator, and previewer.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index, follow">
  <meta name="author" content="diShine">
  <meta name="generator" content="Jekyll 4.3">
  <meta name="theme-color" content="#0a0a0a">
  <meta name="keywords" content="seo, meta, test">
  <link rel="canonical" href="https://example.com/article">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <link rel="alternate" hreflang="fr" href="https://example.com/fr/article">
  <link rel="alternate" hreflang="it" href="https://example.com/it/article">
  <link rel="alternate" type="application/rss+xml" title="Feed" href="/feed.xml">
  <link rel="manifest" href="/manifest.json">
  <link rel="preconnect" href="https://fonts.gstatic.com">

  <meta property="og:title" content="Rich OG title">
  <meta property="og:description" content="Rich OG description for the share preview.">
  <meta property="og:image" content="https://example.com/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Cover image">
  <meta property="og:url" content="https://example.com/article">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Example">
  <meta property="og:locale" content="en_US">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Rich Twitter title">
  <meta name="twitter:description" content="Rich Twitter description.">
  <meta name="twitter:image" content="https://example.com/tw.jpg">
  <meta name="twitter:site" content="@example">

  <meta property="article:published_time" content="2026-04-01T10:00:00Z">
  <meta property="article:author" content="Jane Doe">
  <meta property="article:tag" content="seo">
  <meta property="article:tag" content="metadata">

  <meta property="fb:app_id" content="1234567890">
  <meta name="p:domain_verify" content="abcdef1234567890">
  <meta name="DC.creator" content="Jane Doe">
  <meta name="DC.title" content="Dublin title">

  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="msapplication-TileColor" content="#ffffff">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">

  <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
  <meta name="referrer" content="no-referrer-when-downgrade">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "name": "Example", "url": "https://example.com", "logo": "https://example.com/logo.png" },
      { "@type": "WebSite", "name": "Example", "url": "https://example.com" },
      { "@type": "Article", "headline": "Rich test page", "datePublished": "2026-04-01", "author": { "@type": "Person", "name": "Jane Doe" } },
      { "@type": "BreadcrumbList" }
    ]
  }
  </script>
</head>
<body>
  <h1>Rich test page</h1>
  <h2>Section one</h2>
  <h2>Section two</h2>
</body>
</html>`;

const MINIMAL_HTML = `<!DOCTYPE html><html><head></head><body></body></html>`;

const NO_OG_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Plain page</title>
  <meta name="description" content="Just enough to score something in SEO but nothing else.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="https://example.com/plain">
</head>
<body><h1>Plain</h1></body>
</html>`;

// ── Extractor ───────────────────────────────────────────────────────────

suite("extractor — basic meta", () => {
  const data = extract(RICH_HTML, PAGE_URL);

  test("extracts title and its length", () => {
    assert.equal(data.basic.title, "Rich test page — meta-inspector");
    assert.equal(data.basic.titleLength, data.basic.title.length);
  });
  test("extracts description", () => {
    assert.ok(data.basic.description.startsWith("A fully tagged"));
  });
  test("extracts canonical and matches URL", () => {
    assert.equal(data.basic.canonical, "https://example.com/article");
    assert.equal(data.basic.canonicalMatchesUrl, true);
  });
  test("extracts lang, charset, viewport, robots, author, generator, theme-color, keywords", () => {
    assert.equal(data.basic.lang, "en");
    assert.equal(data.basic.charset, "UTF-8");
    assert.ok(data.basic.viewport.includes("width=device-width"));
    assert.equal(data.basic.robots, "index, follow");
    assert.equal(data.basic.author, "diShine");
    assert.equal(data.basic.generator, "Jekyll 4.3");
    assert.equal(data.basic.themeColor, "#0a0a0a");
    assert.equal(data.basic.keywords, "seo, meta, test");
  });
  test("returns null basic fields when tags are missing", () => {
    const d = extract(MINIMAL_HTML, PAGE_URL);
    assert.equal(d.basic.title, null);
    assert.equal(d.basic.description, null);
    assert.equal(d.basic.canonical, null);
    assert.equal(d.basic.lang, null);
    assert.equal(d.basic.viewport, null);
    assert.equal(d.basic.titleLength, 0);
  });
  test("canonicalMatchesUrl is false when canonical differs", () => {
    const d = extract(RICH_HTML.replace("example.com/article", "example.com/other"), PAGE_URL);
    // both occurrences were replaced; point the page URL back at /article so they diverge
    assert.equal(d.basic.canonicalMatchesUrl, false);
  });
});

suite("extractor — Open Graph", () => {
  const data = extract(RICH_HTML, PAGE_URL);

  test("extracts all og:* tags", () => {
    assert.equal(data.og.title, "Rich OG title");
    assert.equal(data.og.description, "Rich OG description for the share preview.");
    assert.equal(data.og.image, "https://example.com/og.jpg");
    assert.equal(data.og.url, "https://example.com/article");
    assert.equal(data.og.type, "article");
    assert.equal(data.og.site_name, "Example");
    assert.equal(data.og.locale, "en_US");
  });
  test("collects multiple og:image into array", () => {
    const html = RICH_HTML + `<meta property="og:image" content="https://example.com/og2.jpg">`;
    const d = extract(html, PAGE_URL);
    assert.ok(Array.isArray(d.og.image));
    assert.equal(d.og.image.length, 2);
  });
  test("returns null og when no og:* tags are present", () => {
    const d = extract(NO_OG_HTML, PAGE_URL);
    assert.equal(d.og, null);
  });
  test("images.og carries width/height/alt", () => {
    assert.equal(data.images.og.width, "1200");
    assert.equal(data.images.og.height, "630");
    assert.equal(data.images.og.alt, "Cover image");
  });
});

suite("extractor — Twitter Card", () => {
  const data = extract(RICH_HTML, PAGE_URL);
  test("extracts twitter:* tags", () => {
    assert.equal(data.twitter.card, "summary_large_image");
    assert.equal(data.twitter.title, "Rich Twitter title");
    assert.equal(data.twitter.image, "https://example.com/tw.jpg");
    assert.equal(data.twitter.site, "@example");
  });
  test("returns null twitter when absent", () => {
    const d = extract(NO_OG_HTML, PAGE_URL);
    assert.equal(d.twitter, null);
  });
});

suite("extractor — JSON-LD schema", () => {
  const data = extract(RICH_HTML, PAGE_URL);
  test("flattens @graph into an array", () => {
    assert.ok(Array.isArray(data.schema));
    assert.equal(data.schema.length, 4);
    const types = data.schema.map((s) => s["@type"]);
    assert.deepEqual(types, ["Organization", "WebSite", "Article", "BreadcrumbList"]);
  });
  test("Article object keeps headline and author", () => {
    const article = data.schema.find((s) => s["@type"] === "Article");
    assert.equal(article.headline, "Rich test page");
    assert.equal(article.author.name, "Jane Doe");
  });
  test("silently skips invalid JSON-LD", () => {
    const html = `<html><head><script type="application/ld+json">{ not json }</script></head></html>`;
    const d = extract(html, PAGE_URL);
    assert.equal(d.schema, null);
  });
  test("accepts a top-level array", () => {
    const html = `<html><head><script type="application/ld+json">[{"@type":"Thing","name":"A"},{"@type":"Thing","name":"B"}]</script></head></html>`;
    const d = extract(html, PAGE_URL);
    assert.equal(d.schema.length, 2);
  });
});

suite("extractor — article, facebook, pinterest, dublin", () => {
  const data = extract(RICH_HTML, PAGE_URL);
  test("article:tag is collected as an array", () => {
    assert.ok(Array.isArray(data.article.tag));
    assert.deepEqual(data.article.tag, ["seo", "metadata"]);
  });
  test("article published_time and author are extracted", () => {
    assert.equal(data.article.published_time, "2026-04-01T10:00:00Z");
    assert.equal(data.article.author, "Jane Doe");
  });
  test("fb:app_id is extracted", () => {
    assert.equal(data.facebook.app_id, "1234567890");
  });
  test("pinterest domain verify is extracted", () => {
    assert.equal(data.pinterest.domainVerify, "abcdef1234567890");
  });
  test("Dublin Core strips the DC. prefix", () => {
    assert.equal(data.dublin.creator, "Jane Doe");
    assert.equal(data.dublin.title, "Dublin title");
  });
});

suite("extractor — links, icons, hreflang, feeds", () => {
  const data = extract(RICH_HTML, PAGE_URL);
  test("canonical link surfaces in links.canonical", () => {
    assert.equal(data.links.canonical, "https://example.com/article");
  });
  test("hreflang entries are collected", () => {
    assert.equal(data.links.hreflang.length, 2);
    assert.equal(data.links.hreflang[0].lang, "fr");
  });
  test("icons are resolved to absolute URLs", () => {
    assert.ok(data.links.icons.length >= 2);
    assert.ok(data.links.icons[0].href.startsWith("https://example.com/"));
  });
  test("RSS feed is separated from alternate", () => {
    assert.equal(data.links.feeds.length, 1);
    assert.ok(data.links.feeds[0].type.includes("rss"));
  });
  test("manifest link is captured", () => {
    assert.equal(data.links.manifest, "/manifest.json");
  });
});

suite("extractor — headings, apple, ms, security", () => {
  const data = extract(RICH_HTML, PAGE_URL);
  test("h1/h2 are collected", () => {
    assert.deepEqual(data.headings.h1, ["Rich test page"]);
    assert.equal(data.headings.h2.length, 2);
  });
  test("apple tags are namespaced", () => {
    assert.equal(data.apple["apple-mobile-web-app-capable"], "yes");
  });
  test("msapplication-TileColor strips the prefix", () => {
    assert.equal(data.ms.TileColor, "#ffffff");
    assert.equal(data.ms["X-UA-Compatible"], "IE=edge");
  });
  test("CSP and referrer are captured in security", () => {
    assert.equal(data.security.csp, "default-src 'self'");
    assert.equal(data.security.referrer, "no-referrer-when-downgrade");
  });
});

// ── Validator ──────────────────────────────────────────────────────────

suite("validator — well-formed page scores high", () => {
  const data = extract(RICH_HTML, PAGE_URL);
  const { scores, issues } = validate(data, PAGE_URL);
  test("overall score is at least 85", () => {
    assert.ok(scores.overall >= 85, `got ${scores.overall}`);
  });
  test("seo score is at least 90", () => {
    assert.ok(scores.seo >= 90, `got ${scores.seo}`);
  });
  test("open graph score is at least 90", () => {
    assert.ok(scores.openGraph >= 90, `got ${scores.openGraph}`);
  });
  test("no critical issues reported", () => {
    assert.ok(!issues.some((i) => i.severity === "critical"));
  });
});

suite("validator — empty page flags critical SEO problems", () => {
  const data = extract(MINIMAL_HTML, PAGE_URL);
  const { scores, issues } = validate(data, PAGE_URL);
  test("overall score is low", () => {
    assert.ok(scores.overall < 50, `got ${scores.overall}`);
  });
  test("missing title is flagged as critical", () => {
    assert.ok(issues.some((i) => i.severity === "critical" && /title/i.test(i.title)));
  });
  test("missing viewport is flagged as high", () => {
    assert.ok(issues.some((i) => i.severity === "high" && /viewport/i.test(i.title)));
  });
  test("missing og/twitter is flagged", () => {
    assert.ok(issues.some((i) => i.category === "open-graph"));
    assert.ok(issues.some((i) => i.category === "twitter-card"));
  });
  test("schema score is 0 with no JSON-LD", () => {
    assert.equal(scores.schema, 0);
  });
});

suite("validator — targeted rules", () => {
  test("HTTP page is flagged and penalized", () => {
    const d = extract(RICH_HTML, "http://example.com/article");
    const { issues } = validate(d, "http://example.com/article");
    assert.ok(issues.some((i) => /HTTP/.test(i.title)));
  });
  test("noindex robots is flagged as high severity", () => {
    const html = RICH_HTML.replace('content="index, follow"', 'content="noindex, nofollow"');
    const d = extract(html, PAGE_URL);
    const { issues } = validate(d, PAGE_URL);
    assert.ok(issues.some((i) => i.severity === "high" && /noindex/i.test(i.title)));
  });
  test("missing og:image is flagged as high", () => {
    const html = RICH_HTML.replace(/<meta property="og:image".*?>\s*/g, "");
    const d = extract(html, PAGE_URL);
    const { issues } = validate(d, PAGE_URL);
    assert.ok(issues.some((i) => i.severity === "high" && /og:image/i.test(i.title)));
  });
  test("twitter falls back to OG with partial score", () => {
    // strip all twitter:* tags from RICH_HTML
    const html = RICH_HTML.replace(/<meta name="twitter:[\s\S]*?>\s*/g, "");
    const d = extract(html, PAGE_URL);
    const { scores, issues } = validate(d, PAGE_URL);
    assert.equal(scores.twitterCard, 60);
    assert.ok(issues.some((i) => i.category === "twitter-card"));
  });
  test("short title is flagged as medium", () => {
    const html = RICH_HTML.replace(/<title>.*<\/title>/, "<title>Hi</title>");
    const d = extract(html, PAGE_URL);
    const { issues } = validate(d, PAGE_URL);
    assert.ok(issues.some((i) => i.severity === "medium" && /Title too short/i.test(i.title)));
  });
  test("long title is flagged low (may be truncated)", () => {
    const long = "x".repeat(80);
    const html = RICH_HTML.replace(/<title>.*<\/title>/, `<title>${long}</title>`);
    const d = extract(html, PAGE_URL);
    const { issues } = validate(d, PAGE_URL);
    assert.ok(issues.some((i) => /truncated/i.test(i.title)));
  });
  test("missing H1 is flagged as medium", () => {
    const html = RICH_HTML.replace(/<h1>.*?<\/h1>/, "");
    const d = extract(html, PAGE_URL);
    const { issues } = validate(d, PAGE_URL);
    assert.ok(issues.some((i) => i.severity === "medium" && /h1/i.test(i.title)));
  });
  test("canonical HTTP mismatch is flagged", () => {
    const html = RICH_HTML.replace('href="https://example.com/article"', 'href="http://example.com/article"');
    const d = extract(html, PAGE_URL);
    const { issues } = validate(d, PAGE_URL);
    assert.ok(issues.some((i) => /HTTP/.test(i.title) && i.category === "seo"));
  });
});

suite("validator — schema-specific rules", () => {
  test("Organization without logo/url flags low issues", () => {
    const html = `<html><head><script type="application/ld+json">{"@type":"Organization","name":"X"}</script></head></html>`;
    const d = extract(html, PAGE_URL);
    const { issues } = validate(d, PAGE_URL);
    assert.ok(issues.some((i) => /Organization/.test(i.title) && /logo/.test(i.title)));
    assert.ok(issues.some((i) => /Organization/.test(i.title) && /url/.test(i.title)));
  });
  test("Article without headline/author/date flags issues", () => {
    const html = `<html><head><script type="application/ld+json">{"@type":"Article","name":"x"}</script></head></html>`;
    const d = extract(html, PAGE_URL);
    const { issues } = validate(d, PAGE_URL);
    assert.ok(issues.some((i) => /headline/i.test(i.title)));
    assert.ok(issues.some((i) => /author/i.test(i.title)));
    assert.ok(issues.some((i) => /datePublished/i.test(i.title)));
  });
  test("Product without name flags low issue", () => {
    const html = `<html><head><script type="application/ld+json">{"@type":"Product"}</script></head></html>`;
    const d = extract(html, PAGE_URL);
    const { issues } = validate(d, PAGE_URL);
    assert.ok(issues.some((i) => /Product/.test(i.title) && /name/.test(i.title)));
  });
});

// ── Previewer ──────────────────────────────────────────────────────────

suite("previewer", () => {
  const data = extract(RICH_HTML, PAGE_URL);
  const previews = generatePreviews(data, PAGE_URL);

  test("generates all six platform previews", () => {
    assert.deepEqual(
      Object.keys(previews).sort(),
      ["facebook", "google", "linkedin", "slack", "twitter", "whatsapp"]
    );
  });
  test("each preview has a label and non-empty lines", () => {
    for (const [name, p] of Object.entries(previews)) {
      assert.ok(p.label, `${name} missing label`);
      assert.ok(Array.isArray(p.lines) && p.lines.length > 0, `${name} has no lines`);
    }
  });
  test("Google preview uses page title and description", () => {
    const joined = previews.google.lines.join("\n");
    assert.ok(joined.includes("Rich test page"));
  });
  test("Facebook preview renders domain in uppercase", () => {
    const joined = previews.facebook.lines.join("\n").toUpperCase();
    assert.ok(joined.includes("EXAMPLE.COM"));
  });
  test("renderPreviews returns a string containing each label", () => {
    const out = renderPreviews(previews);
    assert.ok(typeof out === "string");
    for (const p of Object.values(previews)) assert.ok(out.includes(p.label));
  });
  test("renderPreviewsPlain produces fenced code blocks", () => {
    const out = renderPreviewsPlain(previews);
    assert.ok(out.includes("```"));
    assert.ok(out.includes("### Google Search"));
  });
  test("previews degrade gracefully on an empty page", () => {
    const d = extract(MINIMAL_HTML, PAGE_URL);
    const p = generatePreviews(d, PAGE_URL);
    assert.ok(p.google.lines.length > 0);
    assert.ok(p.twitter.lines.length > 0);
  });
});

// ── Reporter ──────────────────────────────────────────────────────────

suite("reporter", () => {
  const data = extract(RICH_HTML, PAGE_URL);
  const validation = validate(data, PAGE_URL);
  const previews = generatePreviews(data, PAGE_URL);
  const report = {
    data,
    validation,
    previews,
    fetchInfo: {
      url: PAGE_URL,
      finalUrl: PAGE_URL,
      statusCode: 200,
      timing: 123,
      redirectChain: [],
    },
  };

  test("formatTable produces a non-empty string with key sections", () => {
    const out = formatTable(report);
    assert.ok(typeof out === "string" && out.length > 0);
    assert.ok(out.includes("Meta Inspector Report"));
    assert.ok(out.includes("Scores"));
    assert.ok(out.includes("Open Graph"));
    assert.ok(out.includes("Social Previews"));
  });
  test("formatJSON returns parseable JSON with scores and issues", () => {
    const out = formatJSON(report);
    const parsed = JSON.parse(out);
    assert.equal(parsed.url, PAGE_URL);
    assert.equal(parsed.statusCode, 200);
    assert.ok(parsed.scores && typeof parsed.scores.overall === "number");
    assert.ok(Array.isArray(parsed.issues));
  });
  test("formatMarkdown emits headings and score table", () => {
    const out = formatMarkdown(report);
    assert.ok(out.startsWith("# Meta Inspector Report"));
    assert.ok(out.includes("## Scores"));
    assert.ok(out.includes("| Overall |"));
    assert.ok(out.includes("## Social Previews"));
  });
  test("formatTable renders redirect chain when present", () => {
    const r = { ...report, fetchInfo: { ...report.fetchInfo, redirectChain: [{ url: "http://example.com", statusCode: 301 }] } };
    assert.ok(formatTable(r).includes("Redirects"));
  });
  test("formatMarkdown escapes pipe characters in values", () => {
    const d = { ...data, basic: { ...data.basic, title: "A | B", titleLength: 5 } };
    const r = { ...report, data: d };
    assert.ok(formatMarkdown(r).includes("A \\| B"));
  });
});

// ── Public API surface ─────────────────────────────────────────────────

suite("public API", () => {
  test("exports the documented functions", () => {
    assert.equal(typeof extract, "function");
    assert.equal(typeof validate, "function");
    assert.equal(typeof generatePreviews, "function");
    assert.equal(typeof renderPreviews, "function");
    assert.equal(typeof formatTable, "function");
    assert.equal(typeof formatJSON, "function");
    assert.equal(typeof formatMarkdown, "function");
    assert.equal(typeof fetchUrl, "function");
  });
});

// ── Summary ────────────────────────────────────────────────────────────

console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("");
  for (const { name, err } of failures) {
    console.log(`  ✗ ${name}: ${err.message}`);
  }
  process.exit(1);
}
