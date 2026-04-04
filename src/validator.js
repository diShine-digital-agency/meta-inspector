/**
 * Validates extracted meta data for completeness, correctness, and platform requirements.
 *
 * Returns platform-specific scores and issues with actionable fixes.
 */
export function validate(data, pageUrl) {
  const issues = [];
  const scores = {};

  // ── Basic / SEO ──────────────────────────────────────────────────────
  scores.seo = validateSEO(data, issues);

  // ── Open Graph (Facebook, LinkedIn, WhatsApp, Slack) ─────────────────
  scores.openGraph = validateOpenGraph(data, pageUrl, issues);

  // ── Twitter Card ─────────────────────────────────────────────────────
  scores.twitterCard = validateTwitterCard(data, pageUrl, issues);

  // ── Schema.org / JSON-LD ─────────────────────────────────────────────
  scores.schema = validateSchema(data, issues);

  // ── Overall ──────────────────────────────────────────────────────────
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const max = Object.keys(scores).length * 100;
  scores.overall = Math.round(total / max * 100);

  return { scores, issues };
}

// ── SEO validation ─────────────────────────────────────────────────────

function validateSEO(data, issues) {
  let score = 100;
  const b = data.basic;

  // Title
  if (!b.title) {
    issues.push(issue("critical", "seo", "Missing <title> tag", "Every page needs a title tag for search results and browser tabs.", 'Add <title>Your Page Title</title> to the <head> section.'));
    score -= 30;
  } else {
    if (b.titleLength < 15) {
      issues.push(issue("medium", "seo", `Title too short (${b.titleLength} chars)`, "Short titles miss ranking opportunities. Aim for 50-60 characters.", null));
      score -= 10;
    } else if (b.titleLength > 60) {
      issues.push(issue("low", "seo", `Title may be truncated in search results (${b.titleLength} chars)`, "Google typically shows 50-60 characters. Current title may be cut off.", null));
      score -= 5;
    }
  }

  // Meta description
  if (!b.description) {
    issues.push(issue("high", "seo", "Missing meta description", "Search engines use this for the snippet below the title. Without it, they auto-generate one.", '<meta name="description" content="Your page description (120-155 chars)">'));
    score -= 20;
  } else {
    if (b.descriptionLength < 70) {
      issues.push(issue("low", "seo", `Meta description is short (${b.descriptionLength} chars)`, "Aim for 120-155 characters to maximize search snippet space.", null));
      score -= 5;
    } else if (b.descriptionLength > 160) {
      issues.push(issue("low", "seo", `Meta description may be truncated (${b.descriptionLength} chars)`, "Google typically shows 120-155 characters.", null));
      score -= 3;
    }
  }

  // Canonical
  if (!b.canonical) {
    issues.push(issue("medium", "seo", "Missing canonical URL", "Without a canonical tag, search engines may index duplicate versions of this page.", `<link rel="canonical" href="${data._pageUrl || 'https://example.com/page'}">`));
    score -= 10;
  } else if (b.canonicalMatchesUrl === false) {
    issues.push(issue("low", "seo", "Canonical URL differs from page URL", `Canonical points to ${b.canonical}. This is intentional if this page is a duplicate.`, null));
  }

  // Language
  if (!b.lang) {
    issues.push(issue("medium", "seo", "Missing lang attribute on <html>", "Helps search engines and screen readers identify the page language.", '<html lang="en">'));
    score -= 5;
  }

  // Viewport
  if (!b.viewport) {
    issues.push(issue("high", "seo", "Missing viewport meta tag", "Required for mobile rendering. Without it, mobile users see a desktop-scaled page.", '<meta name="viewport" content="width=device-width, initial-scale=1">'));
    score -= 15;
  }

  // H1
  if (data.headings.h1.length === 0) {
    issues.push(issue("medium", "seo", "No <h1> heading found", "Every page should have exactly one H1 tag for accessibility and SEO.", null));
    score -= 10;
  } else if (data.headings.h1.length > 1) {
    issues.push(issue("low", "seo", `Multiple <h1> headings (${data.headings.h1.length})`, "Best practice is one H1 per page. Multiple H1s dilute heading hierarchy.", null));
    score -= 3;
  }

  // Charset
  if (!b.charset) {
    issues.push(issue("low", "seo", "Missing charset declaration", "Declare character encoding to avoid rendering issues.", '<meta charset="UTF-8">'));
    score -= 3;
  }

  return Math.max(0, score);
}

// ── Open Graph validation ──────────────────────────────────────────────

function validateOpenGraph(data, pageUrl, issues) {
  let score = 100;
  const og = data.og;

  if (!og) {
    issues.push(issue("high", "open-graph", "No Open Graph tags found", "Links shared on Facebook, LinkedIn, WhatsApp, and Slack will show a generic preview without OG tags.", ogTemplate(data, pageUrl)));
    return 0;
  }

  // Required: og:title
  if (!og.title) {
    issues.push(issue("high", "open-graph", "Missing og:title", "The share preview title will fall back to <title> or be empty.", `<meta property="og:title" content="${escHtml(data.basic.title || "Page Title")}">`));
    score -= 25;
  } else if (og.title.length > 90) {
    issues.push(issue("low", "open-graph", `og:title is long (${og.title.length} chars)`, "May be truncated on some platforms. Aim for under 60-90 characters.", null));
    score -= 3;
  }

  // Required: og:description
  if (!og.description) {
    issues.push(issue("medium", "open-graph", "Missing og:description", "The share preview will show no description or auto-extract one.", `<meta property="og:description" content="${escHtml(data.basic.description || "Page description")}">`));
    score -= 15;
  }

  // Required: og:image
  if (!og.image) {
    issues.push(issue("high", "open-graph", "Missing og:image", "Links shared without an image get dramatically lower engagement. Add a 1200x630 image.", `<meta property="og:image" content="https://example.com/image.jpg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">`));
    score -= 30;
  } else {
    const imgUrl = Array.isArray(og.image) ? og.image[0] : og.image;
    if (imgUrl && !imgUrl.startsWith("http")) {
      issues.push(issue("high", "open-graph", "og:image must be an absolute URL", `Current value: ${imgUrl}. Facebook and LinkedIn require a full URL starting with https://.`, `<meta property="og:image" content="${resolveUrl(imgUrl, pageUrl)}">`));
      score -= 15;
    }

    // Image dimensions
    const img = data.images?.og;
    if (img && !img.width && !img.height) {
      issues.push(issue("low", "open-graph", "Missing og:image:width and og:image:height", "Specifying dimensions helps platforms render the preview faster.", `<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">`));
      score -= 5;
    }

    // Image alt
    if (img && !img.alt) {
      issues.push(issue("low", "open-graph", "Missing og:image:alt", "Accessibility: provides alt text for screen readers on social platforms.", `<meta property="og:image:alt" content="Description of the image">`));
      score -= 3;
    }
  }

  // Required: og:url
  if (!og.url) {
    issues.push(issue("medium", "open-graph", "Missing og:url", "Should be the canonical URL of the page.", `<meta property="og:url" content="${pageUrl}">`));
    score -= 10;
  }

  // Required: og:type
  if (!og.type) {
    issues.push(issue("low", "open-graph", "Missing og:type", "Defaults to 'website'. Set explicitly for better categorization.", '<meta property="og:type" content="website">'));
    score -= 5;
  }

  // Recommended: og:site_name
  if (!og.site_name) {
    issues.push(issue("low", "open-graph", "Missing og:site_name", "Shown above the title on Facebook/LinkedIn. Identifies your brand.", '<meta property="og:site_name" content="Your Brand">'));
    score -= 3;
  }

  // Recommended: og:locale
  if (!og.locale) {
    issues.push(issue("low", "open-graph", "Missing og:locale", "Defaults to en_US. Set to match your content language.", '<meta property="og:locale" content="en_US">'));
    score -= 2;
  }

  return Math.max(0, score);
}

// ── Twitter Card validation ────────────────────────────────────────────

function validateTwitterCard(data, pageUrl, issues) {
  let score = 100;
  const tw = data.twitter;

  if (!tw) {
    // Twitter falls back to OG tags, so it's not as critical
    if (data.og) {
      issues.push(issue("low", "twitter-card", "No Twitter Card tags — falling back to Open Graph", "Twitter/X will use OG tags as fallback. Add twitter:card for explicit control.", '<meta name="twitter:card" content="summary_large_image">'));
      return 60; // OG fallback gives partial coverage
    }
    issues.push(issue("high", "twitter-card", "No Twitter Card or Open Graph tags", "Links shared on X will show a plain URL with no preview.", twTemplate(data, pageUrl)));
    return 0;
  }

  // Card type
  if (!tw.card) {
    issues.push(issue("medium", "twitter-card", "Missing twitter:card type", "Without this, the card type is undefined. Use 'summary_large_image' for best visibility.", '<meta name="twitter:card" content="summary_large_image">'));
    score -= 20;
  } else {
    const validTypes = ["summary", "summary_large_image", "app", "player"];
    if (!validTypes.includes(tw.card)) {
      issues.push(issue("medium", "twitter-card", `Invalid twitter:card type: "${tw.card}"`, `Valid types: ${validTypes.join(", ")}`, null));
      score -= 15;
    }
  }

  // Title — falls back to og:title
  if (!tw.title && !data.og?.title) {
    issues.push(issue("medium", "twitter-card", "Missing twitter:title (no OG fallback either)", "The card will show no title.", `<meta name="twitter:title" content="${escHtml(data.basic.title || "Page Title")}">`));
    score -= 15;
  }

  // Description — falls back to og:description
  if (!tw.description && !data.og?.description) {
    issues.push(issue("low", "twitter-card", "Missing twitter:description (no OG fallback)", "The card will show no description.", null));
    score -= 5;
  }

  // Image — falls back to og:image
  if (!tw.image && !data.og?.image) {
    issues.push(issue("medium", "twitter-card", "Missing twitter:image (no OG fallback)", "Cards without images get less engagement.", `<meta name="twitter:image" content="https://example.com/image.jpg">`));
    score -= 20;
  }

  // Site handle
  if (!tw.site) {
    issues.push(issue("low", "twitter-card", "Missing twitter:site", "Your @handle won't appear in the card.", '<meta name="twitter:site" content="@yourhandle">'));
    score -= 5;
  }

  return Math.max(0, score);
}

// ── Schema.org validation ──────────────────────────────────────────────

function validateSchema(data, issues) {
  let score = 100;

  if (!data.schema || data.schema.length === 0) {
    issues.push(issue("medium", "schema", "No JSON-LD structured data found", "Structured data helps search engines understand your content and enables rich snippets (ratings, FAQs, breadcrumbs, etc.).", schemaTemplate()));
    return 0;
  }

  const types = data.schema.map((s) => s["@type"]).filter(Boolean);

  // Check for common types
  const hasOrg = types.some((t) => t === "Organization" || t === "LocalBusiness");
  const hasWebSite = types.some((t) => t === "WebSite");
  const hasBreadcrumb = types.some((t) => t === "BreadcrumbList");
  const hasWebPage = types.some((t) => t === "WebPage" || t === "Article" || t === "Product" || t === "BlogPosting");

  if (!hasOrg && !hasWebSite) {
    issues.push(issue("low", "schema", "Missing Organization or WebSite schema", "Helps Google identify your brand and may enable a knowledge panel.", null));
    score -= 15;
  }

  // Validate each schema object for required fields
  for (const schema of data.schema) {
    if (!schema["@type"]) {
      issues.push(issue("low", "schema", "JSON-LD block missing @type", "Every structured data object should declare its type.", null));
      score -= 5;
    }
    if (!schema["@context"] && !data.schema.some((s) => s["@context"])) {
      // Context might be on the parent object
    }
  }

  // Bonus for good coverage
  if (hasOrg) score = Math.min(100, score + 5);
  if (hasBreadcrumb) score = Math.min(100, score + 5);

  return Math.max(0, score);
}

// ── Helpers ────────────────────────────────────────────────────────────

function issue(severity, category, title, detail, fix) {
  return { severity, category, title, detail, fix };
}

function escHtml(str) {
  return (str || "").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function resolveUrl(href, base) {
  try { return new URL(href, base).href; } catch { return href; }
}

function ogTemplate(data, url) {
  return `<meta property="og:title" content="${escHtml(data.basic.title || "Page Title")}">
<meta property="og:description" content="${escHtml(data.basic.description || "Page description")}">
<meta property="og:image" content="https://example.com/image-1200x630.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Your Brand">`;
}

function twTemplate(data, url) {
  return `<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(data.basic.title || "Page Title")}">
<meta name="twitter:description" content="${escHtml(data.basic.description || "Page description")}">
<meta name="twitter:image" content="https://example.com/image.jpg">
<meta name="twitter:site" content="@yourhandle">`;
}

function schemaTemplate() {
  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Brand",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png"
}
</script>`;
}
