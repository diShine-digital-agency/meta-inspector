/**
 * Generates text-based social preview simulations.
 * Shows how a URL will appear when shared on each platform.
 */

const isColorEnabled = process.stdout.isTTY && !process.env.NO_COLOR;
const c = {
  bold:    (s) => isColorEnabled ? `\x1b[1m${s}\x1b[0m` : s,
  dim:     (s) => isColorEnabled ? `\x1b[2m${s}\x1b[0m` : s,
  blue:    (s) => isColorEnabled ? `\x1b[34m${s}\x1b[0m` : s,
  green:   (s) => isColorEnabled ? `\x1b[32m${s}\x1b[0m` : s,
  cyan:    (s) => isColorEnabled ? `\x1b[36m${s}\x1b[0m` : s,
  gray:    (s) => isColorEnabled ? `\x1b[90m${s}\x1b[0m` : s,
  magenta: (s) => isColorEnabled ? `\x1b[35m${s}\x1b[0m` : s,
};

export function generatePreviews(data, pageUrl) {
  return {
    google: googlePreview(data, pageUrl),
    facebook: facebookPreview(data, pageUrl),
    twitter: twitterPreview(data, pageUrl),
    linkedin: linkedinPreview(data, pageUrl),
    slack: slackPreview(data, pageUrl),
    whatsapp: whatsappPreview(data, pageUrl),
  };
}

export function renderPreviews(previews) {
  const lines = [];

  for (const [platform, preview] of Object.entries(previews)) {
    lines.push(c.bold(`  ${preview.label}`));
    lines.push("");
    for (const line of preview.lines) {
      lines.push(`  ${line}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function renderPreviewsPlain(previews) {
  const lines = [];
  for (const [platform, preview] of Object.entries(previews)) {
    lines.push(`### ${preview.label}`);
    lines.push("```");
    for (const line of preview.lines) {
      lines.push(stripAnsi(line));
    }
    lines.push("```");
    lines.push("");
  }
  return lines.join("\n");
}

// ── Google Search ──────────────────────────────────────────────────────

function googlePreview(data, pageUrl) {
  const title = data.basic.title || "No title";
  const desc = data.basic.description || data.og?.description || "No description available.";
  const displayUrl = formatDisplayUrl(pageUrl);

  // Google truncates title at ~60 chars, description at ~155
  const truncTitle = truncate(title, 60);
  const truncDesc = truncate(desc, 155);

  return {
    label: "Google Search",
    lines: [
      c.blue(truncTitle),
      c.green(displayUrl),
      c.dim(truncDesc),
    ],
  };
}

// ── Facebook / Meta ────────────────────────────────────────────────────

function facebookPreview(data, pageUrl) {
  const og = data.og || {};
  const title = og.title || data.basic.title || "No title";
  const desc = og.description || data.basic.description || "";
  const domain = getDomain(pageUrl).toUpperCase();
  const hasImage = !!(og.image || data.images?.og);

  const boxWidth = 44;
  const lines = [];
  lines.push(c.dim("+" + "-".repeat(boxWidth) + "+"));

  if (hasImage) {
    lines.push(c.dim("|") + centerText("[IMAGE 1200x630]", boxWidth) + c.dim("|"));
    lines.push(c.dim("|") + centerText(c.gray("og:image"), boxWidth) + c.dim("|"));
    lines.push(c.dim("+" + "-".repeat(boxWidth) + "+"));
  }

  lines.push(c.dim("|") + " " + c.gray(truncate(domain, boxWidth - 2)) + " ".repeat(Math.max(0, boxWidth - 1 - domain.length)) + c.dim("|"));
  lines.push(c.dim("|") + " " + c.bold(truncate(title, boxWidth - 2)) + " ".repeat(Math.max(0, boxWidth - 1 - Math.min(title.length, boxWidth - 2))) + c.dim("|"));
  if (desc) {
    const truncDesc = truncate(desc, boxWidth - 2);
    lines.push(c.dim("|") + " " + c.dim(truncDesc) + " ".repeat(Math.max(0, boxWidth - 1 - truncDesc.length)) + c.dim("|"));
  }
  lines.push(c.dim("+" + "-".repeat(boxWidth) + "+"));

  return { label: "Facebook / Meta", lines };
}

// ── Twitter / X ────────────────────────────────────────────────────────

function twitterPreview(data, pageUrl) {
  const tw = data.twitter || {};
  const og = data.og || {};
  const title = tw.title || og.title || data.basic.title || "No title";
  const desc = tw.description || og.description || data.basic.description || "";
  const domain = getDomain(pageUrl);
  const hasImage = !!(tw.image || og.image || data.images?.og || data.images?.twitter);
  const cardType = tw.card || (hasImage ? "summary_large_image" : "summary");

  const boxWidth = 44;
  const lines = [];
  lines.push(c.dim("+" + "-".repeat(boxWidth) + "+"));

  if (hasImage && cardType === "summary_large_image") {
    lines.push(c.dim("|") + centerText("[IMAGE]", boxWidth) + c.dim("|"));
    lines.push(c.dim("+" + "-".repeat(boxWidth) + "+"));
  }

  lines.push(c.dim("|") + " " + padRight(c.bold(truncate(title, boxWidth - 2)), boxWidth - 1) + c.dim("|"));
  if (desc) {
    const truncDesc = truncate(desc, boxWidth - 2);
    lines.push(c.dim("|") + " " + padRight(c.dim(truncDesc), boxWidth - 1) + c.dim("|"));
  }
  lines.push(c.dim("|") + " " + padRight(c.gray(domain), boxWidth - 1) + c.dim("|"));
  lines.push(c.dim("+" + "-".repeat(boxWidth) + "+"));

  return { label: "Twitter / X", lines };
}

// ── LinkedIn ───────────────────────────────────────────────────────────

function linkedinPreview(data, pageUrl) {
  const og = data.og || {};
  const title = og.title || data.basic.title || "No title";
  const domain = getDomain(pageUrl);
  const hasImage = !!(og.image || data.images?.og);

  const boxWidth = 44;
  const lines = [];
  lines.push(c.dim("+" + "-".repeat(boxWidth) + "+"));

  if (hasImage) {
    lines.push(c.dim("|") + centerText("[IMAGE 1200x627]", boxWidth) + c.dim("|"));
    lines.push(c.dim("+" + "-".repeat(boxWidth) + "+"));
  }

  lines.push(c.dim("|") + " " + padRight(c.bold(truncate(title, boxWidth - 2)), boxWidth - 1) + c.dim("|"));
  lines.push(c.dim("|") + " " + padRight(c.gray(domain), boxWidth - 1) + c.dim("|"));
  lines.push(c.dim("+" + "-".repeat(boxWidth) + "+"));

  return { label: "LinkedIn", lines };
}

// ── Slack ──────────────────────────────────────────────────────────────

function slackPreview(data, pageUrl) {
  const og = data.og || {};
  const title = og.title || data.basic.title || "No title";
  const desc = og.description || data.basic.description || "";
  const siteName = og.site_name || getDomain(pageUrl);

  const lines = [];
  lines.push(c.cyan("|") + " " + c.bold(siteName));
  lines.push(c.cyan("|") + " " + c.blue(title));
  if (desc) {
    lines.push(c.cyan("|") + " " + c.dim(truncate(desc, 80)));
  }

  return { label: "Slack", lines };
}

// ── WhatsApp ───────────────────────────────────────────────────────────

function whatsappPreview(data, pageUrl) {
  const og = data.og || {};
  const title = og.title || data.basic.title || pageUrl;
  const desc = og.description || data.basic.description || "";
  const domain = getDomain(pageUrl);
  const hasImage = !!(og.image || data.images?.og);

  const lines = [];
  lines.push(c.dim("  +" + "-".repeat(38) + "+"));
  if (hasImage) {
    lines.push(c.dim("  |") + centerText(c.gray("[IMAGE]"), 38) + c.dim("|"));
    lines.push(c.dim("  +" + "-".repeat(38) + "+"));
  }
  lines.push(c.dim("  |") + " " + padRight(c.gray(domain), 37) + c.dim("|"));
  lines.push(c.dim("  |") + " " + padRight(c.bold(truncate(title, 36)), 37) + c.dim("|"));
  if (desc) {
    lines.push(c.dim("  |") + " " + padRight(c.dim(truncate(desc, 36)), 37) + c.dim("|"));
  }
  lines.push(c.dim("  +" + "-".repeat(38) + "+"));

  return { label: "WhatsApp", lines };
}

// ── Utilities ──────────────────────────────────────────────────────────

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
}

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

function formatDisplayUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    return u.hostname + path;
  } catch { return url; }
}

function centerText(text, width) {
  const visible = text.replace(/\x1b\[[0-9;]*m/g, "");
  const pad = Math.max(0, width - visible.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return " ".repeat(left) + text + " ".repeat(right);
}

function padRight(text, width) {
  const visible = text.replace(/\x1b\[[0-9;]*m/g, "");
  const pad = Math.max(0, width - visible.length);
  return text + " ".repeat(pad);
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}
