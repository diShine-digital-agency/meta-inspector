/**
 * Output formatters for meta-inspector reports.
 */

import { renderPreviews, renderPreviewsPlain } from "./previewer.js";

const isColorEnabled = process.stdout.isTTY && !process.env.NO_COLOR;
const c = {
  bold:    (s) => isColorEnabled ? `\x1b[1m${s}\x1b[0m` : s,
  dim:     (s) => isColorEnabled ? `\x1b[2m${s}\x1b[0m` : s,
  red:     (s) => isColorEnabled ? `\x1b[31m${s}\x1b[0m` : s,
  green:   (s) => isColorEnabled ? `\x1b[32m${s}\x1b[0m` : s,
  yellow:  (s) => isColorEnabled ? `\x1b[33m${s}\x1b[0m` : s,
  blue:    (s) => isColorEnabled ? `\x1b[34m${s}\x1b[0m` : s,
  cyan:    (s) => isColorEnabled ? `\x1b[36m${s}\x1b[0m` : s,
  gray:    (s) => isColorEnabled ? `\x1b[90m${s}\x1b[0m` : s,
  bgRed:   (s) => isColorEnabled ? `\x1b[41m\x1b[37m${s}\x1b[0m` : s,
};

// ── Table (terminal) ───────────────────────────────────────────────────

export function formatTable(report) {
  const { data, validation, previews, fetchInfo } = report;
  const lines = [];

  // Header
  lines.push("");
  lines.push(c.bold("  Meta Inspector Report"));
  lines.push(c.dim(`  ${fetchInfo.url} — ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}`));
  if (data.basic.title) lines.push(c.dim(`  ${data.basic.title}`));
  lines.push("");

  // Scores
  const { scores } = validation;
  lines.push(c.bold("  Scores"));
  lines.push(`  Overall:      ${scoreBar(scores.overall)}`);
  lines.push(`  SEO:          ${scoreBar(scores.seo)}`);
  lines.push(`  Open Graph:   ${scoreBar(scores.openGraph)}`);
  lines.push(`  Twitter Card: ${scoreBar(scores.twitterCard)}`);
  lines.push(`  Schema.org:   ${scoreBar(scores.schema)}`);
  lines.push("");

  // Fetch info
  lines.push(c.bold("  Page Info"));
  lines.push(`  Status: ${fetchInfo.statusCode}  |  Load: ${fetchInfo.timing}ms  |  Charset: ${data.basic.charset || "?"}`);
  if (fetchInfo.redirectChain.length > 0) {
    lines.push(`  Redirects: ${fetchInfo.redirectChain.map((r) => `${r.statusCode} ${r.url}`).join(" -> ")}`);
  }
  lines.push(`  Language: ${data.basic.lang || "not set"}  |  Generator: ${data.basic.generator || "not detected"}`);
  lines.push("");

  // Basic meta
  lines.push(c.bold("  Meta Tags"));
  printKV(lines, "title", data.basic.title, `(${data.basic.titleLength} chars)`);
  printKV(lines, "description", data.basic.description, `(${data.basic.descriptionLength} chars)`);
  printKV(lines, "canonical", data.basic.canonical);
  printKV(lines, "viewport", data.basic.viewport);
  printKV(lines, "robots", data.basic.robots);
  printKV(lines, "author", data.basic.author);
  printKV(lines, "theme-color", data.basic.themeColor);
  lines.push("");

  // Open Graph
  if (data.og) {
    lines.push(c.bold("  Open Graph"));
    for (const [key, val] of Object.entries(data.og)) {
      const display = Array.isArray(val) ? val.join(", ") : val;
      printKV(lines, `og:${key}`, display);
    }
    lines.push("");
  }

  // Twitter Card
  if (data.twitter) {
    lines.push(c.bold("  Twitter Card"));
    for (const [key, val] of Object.entries(data.twitter)) {
      printKV(lines, `twitter:${key}`, val);
    }
    lines.push("");
  }

  // Schema
  if (data.schema) {
    lines.push(c.bold(`  Schema.org / JSON-LD (${data.schema.length} ${data.schema.length === 1 ? "block" : "blocks"})`));
    for (const schema of data.schema) {
      const type = schema["@type"] || "Unknown";
      const name = schema.name || schema.headline || "";
      lines.push(`  ${c.cyan(type)}${name ? ` — ${truncate(name, 60)}` : ""}`);
    }
    lines.push("");
  }

  // Article metadata
  if (data.article) {
    lines.push(c.bold("  Article Metadata"));
    for (const [key, val] of Object.entries(data.article)) {
      const display = Array.isArray(val) ? val.join(", ") : val;
      printKV(lines, `article:${key}`, display);
    }
    lines.push("");
  }

  // Facebook / Platform IDs
  if (data.facebook) {
    lines.push(c.bold("  Facebook / Platform"));
    for (const [key, val] of Object.entries(data.facebook)) {
      const display = Array.isArray(val) ? val.join(", ") : val;
      printKV(lines, `fb:${key}`, display);
    }
    lines.push("");
  }

  // Icons
  if (data.links.icons.length > 0) {
    lines.push(c.bold("  Icons"));
    for (const icon of data.links.icons) {
      lines.push(`  ${c.dim(icon.rel)} ${icon.href}${icon.sizes ? ` (${icon.sizes})` : ""}`);
    }
    lines.push("");
  }

  // Hreflang
  if (data.links.hreflang.length > 0) {
    lines.push(c.bold("  Hreflang"));
    for (const hl of data.links.hreflang) {
      lines.push(`  ${c.dim(hl.lang)} ${hl.url}`);
    }
    lines.push("");
  }

  // Headings
  if (data.headings.h1.length > 0) {
    lines.push(c.bold("  Headings"));
    for (const h of data.headings.h1) lines.push(`  ${c.cyan("h1")} ${truncate(h, 70)}`);
    for (const h of data.headings.h2.slice(0, 5)) lines.push(`  ${c.dim("h2")} ${truncate(h, 70)}`);
    if (data.headings.h2.length > 5) lines.push(`  ${c.dim(`... +${data.headings.h2.length - 5} more h2`)}`);
    lines.push("");
  }

  // Security meta
  if (data.security) {
    lines.push(c.bold("  Security"));
    for (const [key, val] of Object.entries(data.security)) {
      printKV(lines, key, truncate(val, 70));
    }
    lines.push("");
  }

  // Issues
  if (validation.issues.length > 0) {
    lines.push(c.bold(`  Issues (${validation.issues.length})`));
    lines.push("");
    for (const issue of validation.issues) {
      const label = severityLabel(issue.severity);
      lines.push(`  ${label} ${c.dim(`[${issue.category}]`)} ${issue.title}`);
      if (issue.fix) {
        const fixLines = issue.fix.split("\n");
        for (const fl of fixLines) {
          lines.push(`  ${" ".repeat(12)}${c.green(fl)}`);
        }
      }
    }
    lines.push("");
  }

  // Social previews
  lines.push(c.bold("  Social Previews"));
  lines.push("");
  lines.push(renderPreviews(previews));

  return lines.join("\n");
}

// ── JSON ───────────────────────────────────────────────────────────────

export function formatJSON(report) {
  const clean = {
    url: report.fetchInfo.url,
    finalUrl: report.fetchInfo.finalUrl,
    statusCode: report.fetchInfo.statusCode,
    timing: report.fetchInfo.timing,
    redirectChain: report.fetchInfo.redirectChain,
    scores: report.validation.scores,
    basic: report.data.basic,
    openGraph: report.data.og,
    twitterCard: report.data.twitter,
    schema: report.data.schema,
    article: report.data.article,
    facebook: report.data.facebook,
    images: report.data.images,
    links: report.data.links,
    headings: report.data.headings,
    dublin: report.data.dublin,
    apple: report.data.apple,
    ms: report.data.ms,
    security: report.data.security,
    issues: report.validation.issues,
  };
  return JSON.stringify(clean, null, 2);
}

// ── Markdown ───────────────────────────────────────────────────────────

export function formatMarkdown(report) {
  const { data, validation, previews, fetchInfo } = report;
  const lines = [];

  lines.push("# Meta Inspector Report");
  lines.push("");
  lines.push(`**URL:** ${fetchInfo.url}  `);
  lines.push(`**Final URL:** ${fetchInfo.finalUrl}  `);
  lines.push(`**Status:** ${fetchInfo.statusCode} | **Load:** ${fetchInfo.timing}ms  `);
  if (data.basic.title) lines.push(`**Title:** ${data.basic.title}  `);
  lines.push("");

  // Scores
  lines.push("## Scores");
  lines.push("");
  lines.push("| Area | Score |");
  lines.push("|------|-------|");
  lines.push(`| Overall | ${validation.scores.overall}/100 |`);
  lines.push(`| SEO | ${validation.scores.seo}/100 |`);
  lines.push(`| Open Graph | ${validation.scores.openGraph}/100 |`);
  lines.push(`| Twitter Card | ${validation.scores.twitterCard}/100 |`);
  lines.push(`| Schema.org | ${validation.scores.schema}/100 |`);
  lines.push("");

  // Meta tags
  lines.push("## Meta Tags");
  lines.push("");
  lines.push("| Tag | Value |");
  lines.push("|-----|-------|");
  lines.push(`| title | ${mdEsc(data.basic.title || "-")} (${data.basic.titleLength} chars) |`);
  lines.push(`| description | ${mdEsc(truncate(data.basic.description || "-", 80))} (${data.basic.descriptionLength} chars) |`);
  lines.push(`| canonical | ${mdEsc(data.basic.canonical || "-")} |`);
  lines.push(`| lang | ${data.basic.lang || "-"} |`);
  lines.push(`| viewport | ${mdEsc(data.basic.viewport || "-")} |`);
  lines.push(`| robots | ${data.basic.robots || "-"} |`);
  lines.push(`| charset | ${data.basic.charset || "-"} |`);
  lines.push(`| generator | ${mdEsc(data.basic.generator || "-")} |`);
  lines.push("");

  // OG
  if (data.og) {
    lines.push("## Open Graph");
    lines.push("");
    lines.push("| Property | Value |");
    lines.push("|----------|-------|");
    for (const [k, v] of Object.entries(data.og)) {
      const val = Array.isArray(v) ? v.join(", ") : v;
      lines.push(`| og:${k} | ${mdEsc(truncate(val, 80))} |`);
    }
    lines.push("");
  }

  // Twitter
  if (data.twitter) {
    lines.push("## Twitter Card");
    lines.push("");
    lines.push("| Property | Value |");
    lines.push("|----------|-------|");
    for (const [k, v] of Object.entries(data.twitter)) {
      lines.push(`| twitter:${k} | ${mdEsc(truncate(v, 80))} |`);
    }
    lines.push("");
  }

  // Schema
  if (data.schema) {
    lines.push(`## Schema.org / JSON-LD (${data.schema.length} blocks)`);
    lines.push("");
    for (const s of data.schema) {
      lines.push(`- **${s["@type"] || "Unknown"}**${s.name ? `: ${s.name}` : ""}`);
    }
    lines.push("");
  }

  // Article
  if (data.article) {
    lines.push("## Article Metadata");
    lines.push("");
    lines.push("| Property | Value |");
    lines.push("|----------|-------|");
    for (const [k, v] of Object.entries(data.article)) {
      const val = Array.isArray(v) ? v.join(", ") : v;
      lines.push(`| article:${k} | ${mdEsc(truncate(val, 80))} |`);
    }
    lines.push("");
  }

  // Facebook
  if (data.facebook) {
    lines.push("## Facebook / Platform");
    lines.push("");
    lines.push("| Property | Value |");
    lines.push("|----------|-------|");
    for (const [k, v] of Object.entries(data.facebook)) {
      const val = Array.isArray(v) ? v.join(", ") : v;
      lines.push(`| fb:${k} | ${mdEsc(truncate(val, 80))} |`);
    }
    lines.push("");
  }

  // Hreflang
  if (data.links.hreflang.length > 0) {
    lines.push("## Hreflang");
    lines.push("");
    for (const hl of data.links.hreflang) {
      lines.push(`- \`${hl.lang}\` — ${hl.url}`);
    }
    lines.push("");
  }

  // Issues
  if (validation.issues.length > 0) {
    lines.push(`## Issues (${validation.issues.length})`);
    lines.push("");
    for (const issue of validation.issues) {
      lines.push(`### [${issue.severity.toUpperCase()}] ${issue.title}`);
      lines.push(`**Category:** ${issue.category}  `);
      lines.push(issue.detail);
      if (issue.fix) {
        lines.push("");
        lines.push("**Fix:**");
        lines.push("```html");
        lines.push(issue.fix);
        lines.push("```");
      }
      lines.push("");
    }
  }

  // Previews
  lines.push("## Social Previews");
  lines.push("");
  lines.push(renderPreviewsPlain(previews));

  lines.push("---");
  lines.push(`*Generated by [meta-inspector](https://github.com/diShine-digital-agency/meta-inspector)*`);

  return lines.join("\n");
}

// ── Utilities ──────────────────────────────────────────────────────────

function scoreBar(score) {
  const width = 20;
  const filled = Math.round((score / 100) * width);
  const bar = "#".repeat(filled) + " ".repeat(width - filled);
  const colorFn = score >= 80 ? c.green : score >= 50 ? c.yellow : c.red;
  return colorFn(`[${bar}]`) + ` ${score}/100`;
}

function severityLabel(sev) {
  const labels = {
    critical: c.bgRed(" CRITICAL "),
    high:     c.red("   HIGH   "),
    medium:   c.yellow(" MEDIUM   "),
    low:      c.dim("   LOW    "),
  };
  return labels[sev] || `   ${sev}   `;
}

function printKV(lines, key, value, suffix = "") {
  if (!value) return;
  const display = truncate(value, 80);
  lines.push(`  ${c.dim(padRight(key, 14))} ${display}${suffix ? " " + c.dim(suffix) : ""}`);
}

function padRight(str, len) {
  return str.length < len ? str + " ".repeat(len - str.length) : str;
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
}

function mdEsc(str) {
  return (str || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
