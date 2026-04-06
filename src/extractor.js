import { load } from "cheerio";

/**
 * Extracts all meta information from HTML.
 *
 * Returns a structured object with:
 *   basic     — title, description, canonical, language, charset, viewport
 *   og        — Open Graph tags (og:*)
 *   twitter   — Twitter Card tags (twitter:*)
 *   schema    — JSON-LD structured data
 *   meta      — All other meta tags
 *   links     — Canonical, alternate, hreflang, RSS, icons
 *   images    — og:image, twitter:image with resolved URLs
 *   headings  — h1/h2 hierarchy (for SEO context)
 *   dublin    — Dublin Core metadata (DC.*)
 *   apple     — Apple-specific meta tags
 *   ms        — Microsoft/IE meta tags (msapplication-*)
 *   facebook  — Facebook-specific tags (fb:*)
 *   article   — Article OG tags (article:*)
 *   security  — Security-related meta (CSP, referrer, permissions-policy)
 */
export function extract(html, pageUrl) {
  const $ = load(html);

  return {
    basic: extractBasic($, pageUrl),
    og: extractOpenGraph($),
    twitter: extractTwitterCard($),
    schema: extractSchema($),
    meta: extractAllMeta($),
    links: extractLinks($, pageUrl),
    images: extractImages($, pageUrl),
    headings: extractHeadings($),
    dublin: extractDublinCore($),
    apple: extractApple($),
    ms: extractMicrosoft($),
    facebook: extractFacebook($),
    pinterest: extractPinterest($),
    article: extractArticle($),
    security: extractSecurity($),
  };
}

// ── Basic page info ────────────────────────────────────────────────────

function extractBasic($, pageUrl) {
  const title = $("title").first().text().trim() || null;
  const description = getMeta($, "description");
  const canonical = $('link[rel="canonical"]').attr("href") || null;
  const lang = $("html").attr("lang") || getMeta($, "language") || null;
  const charset = $('meta[charset]').attr("charset") ||
    $('meta[http-equiv="Content-Type"]').attr("content")?.match(/charset=([^\s;]+)/)?.[1] || null;
  const viewport = getMeta($, "viewport");
  const robots = getMeta($, "robots");
  const author = getMeta($, "author");
  const generator = getMeta($, "generator");
  const themeColor = getMeta($, "theme-color");
  const keywords = getMeta($, "keywords");

  return {
    title,
    titleLength: title ? title.length : 0,
    description,
    descriptionLength: description ? description.length : 0,
    canonical,
    canonicalMatchesUrl: canonical ? normalizeUrl(canonical) === normalizeUrl(pageUrl) : null,
    lang,
    charset,
    viewport,
    robots,
    author,
    generator,
    themeColor,
    keywords,
  };
}

// ── Open Graph ─────────────────────────────────────────────────────────

function extractOpenGraph($) {
  const og = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr("property").replace("og:", "");
    const content = $(el).attr("content");
    if (content) {
      // Handle multiple values (e.g., og:image can appear multiple times)
      if (og[prop]) {
        if (Array.isArray(og[prop])) og[prop].push(content);
        else og[prop] = [og[prop], content];
      } else {
        og[prop] = content;
      }
    }
  });

  // Also check name attribute (some sites use name= instead of property=)
  $('meta[name^="og:"]').each((_, el) => {
    const prop = $(el).attr("name").replace("og:", "");
    const content = $(el).attr("content");
    if (content && !og[prop]) og[prop] = content;
  });

  return Object.keys(og).length > 0 ? og : null;
}

// ── Twitter Card ───────────────────────────────────────────────────────

function extractTwitterCard($) {
  const tw = {};
  $('meta[name^="twitter:"], meta[property^="twitter:"]').each((_, el) => {
    const name = ($(el).attr("name") || $(el).attr("property")).replace("twitter:", "");
    const content = $(el).attr("content");
    if (content) tw[name] = content;
  });

  return Object.keys(tw).length > 0 ? tw : null;
}

// ── Schema.org / JSON-LD ───────────────────────────────────────────────

function extractSchema($) {
  const schemas = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (raw) {
        const parsed = JSON.parse(raw);
        // Handle @graph arrays
        if (parsed["@graph"]) {
          schemas.push(...parsed["@graph"]);
        } else if (Array.isArray(parsed)) {
          schemas.push(...parsed);
        } else {
          schemas.push(parsed);
        }
      }
    } catch { /* invalid JSON-LD, skip */ }
  });

  return schemas.length > 0 ? schemas : null;
}

// ── All meta tags (raw) ────────────────────────────────────────────────

function extractAllMeta($) {
  const metas = [];
  $("meta").each((_, el) => {
    const attrs = {};
    const raw = $(el).attr("name") || $(el).attr("property") || $(el).attr("http-equiv");
    if (raw) attrs.key = raw;
    const content = $(el).attr("content");
    if (content) attrs.value = content;
    const charset = $(el).attr("charset");
    if (charset) { attrs.key = "charset"; attrs.value = charset; }
    if (attrs.key) metas.push(attrs);
  });
  return metas;
}

// ── Link tags ──────────────────────────────────────────────────────────

function extractLinks($, pageUrl) {
  const links = {
    canonical: $('link[rel="canonical"]').attr("href") || null,
    alternate: [],
    hreflang: [],
    feeds: [],
    icons: [],
    preconnect: [],
    manifest: $('link[rel="manifest"]').attr("href") || null,
    amphtml: $('link[rel="amphtml"]').attr("href") || null,
  };

  $('link[rel="alternate"]').each((_, el) => {
    const entry = {
      href: $(el).attr("href"),
      hreflang: $(el).attr("hreflang") || null,
      type: $(el).attr("type") || null,
      title: $(el).attr("title") || null,
    };
    if (entry.hreflang) {
      links.hreflang.push({ lang: entry.hreflang, url: entry.href });
    } else if (entry.type && (entry.type.includes("rss") || entry.type.includes("atom"))) {
      links.feeds.push({ url: entry.href, type: entry.type, title: entry.title });
    } else {
      links.alternate.push(entry);
    }
  });

  // Icons (favicon, apple-touch-icon, etc.)
  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').each((_, el) => {
    links.icons.push({
      rel: $(el).attr("rel"),
      href: resolveUrl($(el).attr("href"), pageUrl),
      sizes: $(el).attr("sizes") || null,
      type: $(el).attr("type") || null,
    });
  });

  // Preconnect
  $('link[rel="preconnect"], link[rel="dns-prefetch"]').each((_, el) => {
    links.preconnect.push({
      rel: $(el).attr("rel"),
      href: $(el).attr("href"),
    });
  });

  return links;
}

// ── Images ─────────────────────────────────────────────────────────────

function extractImages($, pageUrl) {
  const images = {};

  // OG image
  const ogImage = $('meta[property="og:image"]').first().attr("content");
  if (ogImage) {
    images.og = {
      url: resolveUrl(ogImage, pageUrl),
      width: $('meta[property="og:image:width"]').attr("content") || null,
      height: $('meta[property="og:image:height"]').attr("content") || null,
      alt: $('meta[property="og:image:alt"]').attr("content") || null,
      type: $('meta[property="og:image:type"]').attr("content") || null,
    };
  }

  // Twitter image
  const twImage = $('meta[name="twitter:image"], meta[property="twitter:image"]').first().attr("content");
  if (twImage) {
    images.twitter = {
      url: resolveUrl(twImage, pageUrl),
      alt: $('meta[name="twitter:image:alt"], meta[property="twitter:image:alt"]').attr("content") || null,
    };
  }

  // Favicon
  const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').first().attr("href");
  if (favicon) {
    images.favicon = resolveUrl(favicon, pageUrl);
  } else {
    images.favicon = resolveUrl("/favicon.ico", pageUrl);
  }

  return Object.keys(images).length > 0 ? images : null;
}

// ── Headings ───────────────────────────────────────────────────────────

function extractHeadings($) {
  const h1s = [];
  $("h1").each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1s.push(text);
  });

  const h2s = [];
  $("h2").each((_, el) => {
    const text = $(el).text().trim();
    if (text) h2s.push(text);
  });

  return { h1: h1s, h2: h2s.slice(0, 10) }; // limit h2 to 10
}

// ── Dublin Core ────────────────────────────────────────────────────────

function extractDublinCore($) {
  const dc = {};
  $('meta[name^="DC."], meta[name^="dc."], meta[name^="DCTERMS."], meta[name^="dcterms."]').each((_, el) => {
    const name = $(el).attr("name");
    const content = $(el).attr("content");
    if (name && content) {
      const key = name.replace(/^(?:DC|dc|DCTERMS|dcterms)\./, "");
      if (dc[key]) {
        if (Array.isArray(dc[key])) dc[key].push(content);
        else dc[key] = [dc[key], content];
      } else {
        dc[key] = content;
      }
    }
  });

  return Object.keys(dc).length > 0 ? dc : null;
}

// ── Apple-specific ────────────────────────────────────────────────────

function extractApple($) {
  const apple = {};
  const names = [
    "apple-mobile-web-app-capable",
    "apple-mobile-web-app-title",
    "apple-mobile-web-app-status-bar-style",
    "apple-itunes-app",
    "format-detection",
  ];

  for (const name of names) {
    const content = $(`meta[name="${name}"]`).attr("content");
    if (content) apple[name] = content;
  }

  // Apple touch startup images
  const startupImages = [];
  $('link[rel="apple-touch-startup-image"]').each((_, el) => {
    startupImages.push({
      href: $(el).attr("href"),
      media: $(el).attr("media") || null,
    });
  });
  if (startupImages.length > 0) apple["touch-startup-images"] = startupImages;

  return Object.keys(apple).length > 0 ? apple : null;
}

// ── Microsoft / IE ────────────────────────────────────────────────────

function extractMicrosoft($) {
  const ms = {};
  $('meta[name^="msapplication-"]').each((_, el) => {
    const name = $(el).attr("name");
    const content = $(el).attr("content");
    if (name && content) {
      const key = name.replace("msapplication-", "");
      ms[key] = content;
    }
  });

  // X-UA-Compatible
  const uaCompat = $('meta[http-equiv="X-UA-Compatible"]').attr("content");
  if (uaCompat) ms["X-UA-Compatible"] = uaCompat;

  return Object.keys(ms).length > 0 ? ms : null;
}

// ── Facebook (fb:*) ───────────────────────────────────────────────────

function extractFacebook($) {
  const fb = {};
  $('meta[property^="fb:"]').each((_, el) => {
    const prop = $(el).attr("property").replace("fb:", "");
    const content = $(el).attr("content");
    if (content) {
      if (fb[prop]) {
        if (Array.isArray(fb[prop])) fb[prop].push(content);
        else fb[prop] = [fb[prop], content];
      } else {
        fb[prop] = content;
      }
    }
  });

  return Object.keys(fb).length > 0 ? fb : null;
}

// ── Pinterest ─────────────────────────────────────────────────────────

function extractPinterest($) {
  const pinterest = $('meta[name="p:domain_verify"]').attr("content");
  return pinterest ? { domainVerify: pinterest } : null;
}

// ── Article OG tags (article:*) ───────────────────────────────────────

function extractArticle($) {
  const article = {};
  $('meta[property^="article:"]').each((_, el) => {
    const prop = $(el).attr("property").replace("article:", "");
    const content = $(el).attr("content");
    if (content) {
      if (article[prop]) {
        if (Array.isArray(article[prop])) article[prop].push(content);
        else article[prop] = [article[prop], content];
      } else {
        article[prop] = content;
      }
    }
  });

  return Object.keys(article).length > 0 ? article : null;
}

// ── Security meta ─────────────────────────────────────────────────────

function extractSecurity($) {
  const security = {};

  const csp = $('meta[http-equiv="Content-Security-Policy"]').attr("content");
  if (csp) security.csp = csp;

  const cspReport = $('meta[http-equiv="Content-Security-Policy-Report-Only"]').attr("content");
  if (cspReport) security.cspReportOnly = cspReport;

  const referrer = getMeta($, "referrer");
  if (referrer) security.referrer = referrer;

  const permissionsPolicy = $('meta[http-equiv="Permissions-Policy"]').attr("content");
  if (permissionsPolicy) security.permissionsPolicy = permissionsPolicy;

  return Object.keys(security).length > 0 ? security : null;
}

// ── Utility ────────────────────────────────────────────────────────────

function getMeta($, name) {
  return $(`meta[name="${name}"]`).attr("content") ||
    $(`meta[name="${name}" i]`).attr("content") ||
    $(`meta[property="${name}"]`).attr("content") || null;
}

function resolveUrl(href, base) {
  if (!href) return null;
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}
