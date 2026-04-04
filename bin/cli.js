#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { fetchUrl } from "../src/fetcher.js";
import { extract } from "../src/extractor.js";
import { validate } from "../src/validator.js";
import { generatePreviews } from "../src/previewer.js";
import { formatTable, formatJSON, formatMarkdown } from "../src/reporter.js";

// ── Argument parsing ───────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes("-h") || args.includes("--help") || args.length === 0) {
  printHelp();
  process.exit(0);
}

if (args.includes("-v") || args.includes("--version")) {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));
  console.log(pkg.version);
  process.exit(0);
}

const flags = {
  format: getFlag(["-f", "--format"]) || "table",
  output: getFlag(["-o", "--output"]),
  timeout: parseInt(getFlag(["-t", "--timeout"]) || "15000", 10),
  userAgent: getFlag(["--user-agent"]),
  quiet: args.includes("-q") || args.includes("--quiet"),
  noPreviews: args.includes("--no-previews"),
};

const flagsWithValues = new Set(["-f", "--format", "-o", "--output", "-t", "--timeout", "--user-agent"]);
const allFlags = new Set([...flagsWithValues, "-q", "--quiet", "--no-previews", "-h", "--help", "-v", "--version"]);

let urls = [];
for (let i = 0; i < args.length; i++) {
  if (flagsWithValues.has(args[i])) { i++; continue; }
  if (allFlags.has(args[i])) continue;

  const arg = args[i];
  if (existsSync(arg) && !arg.startsWith("http")) {
    const content = readFileSync(arg, "utf-8");
    urls.push(...content.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")));
  } else {
    urls.push(arg);
  }
}

urls = urls.map((u) => (!u.startsWith("http://") && !u.startsWith("https://")) ? `https://${u}` : u);

if (urls.length === 0) {
  console.error("Error: No URL provided. Run with --help for usage.\n");
  process.exit(1);
}

const validFormats = ["table", "json", "markdown", "md"];
if (!validFormats.includes(flags.format)) {
  console.error(`Error: Invalid format "${flags.format}". Valid: ${validFormats.join(", ")}\n`);
  process.exit(1);
}
if (flags.format === "md") flags.format = "markdown";

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  if (!flags.quiet) {
    console.log("");
    console.log("  meta-inspector — analyzing...");
    console.log(`  ${urls.length === 1 ? urls[0] : `${urls.length} URLs`}`);
    console.log("");
  }

  let allReports = [];

  for (const url of urls) {
    if (!flags.quiet && urls.length > 1) {
      console.log(`  Fetching: ${url}`);
    }

    try {
      // 1. Fetch
      const fetchResult = await fetchUrl(url, {
        timeout: flags.timeout,
        userAgent: flags.userAgent,
      });

      // 2. Extract
      const data = extract(fetchResult.html, fetchResult.finalUrl);

      // 3. Validate
      const validation = validate(data, fetchResult.finalUrl);

      // 4. Generate previews
      const previews = flags.noPreviews ? {} : generatePreviews(data, fetchResult.finalUrl);

      const report = {
        fetchInfo: {
          url,
          finalUrl: fetchResult.finalUrl,
          statusCode: fetchResult.statusCode,
          timing: fetchResult.timing,
          redirectChain: fetchResult.redirectChain,
        },
        data,
        validation,
        previews,
      };

      allReports.push(report);

    } catch (err) {
      console.error(`  Error: ${url} — ${err.message}`);
    }
  }

  if (allReports.length === 0) {
    console.error("  No successful fetches. Exiting.");
    process.exit(2);
  }

  // 5. Format
  let output;
  if (allReports.length === 1) {
    output = formatReport(allReports[0], flags.format);
  } else {
    output = allReports.map((r) => formatReport(r, flags.format)).join("\n\n---\n\n");
  }

  // 6. Output
  if (flags.output) {
    const outPath = resolve(flags.output);
    writeFileSync(outPath, stripAnsi(output), "utf-8");
    if (!flags.quiet) console.log(`  Report saved to: ${outPath}`);
  } else {
    console.log(output);
  }

  // Exit non-zero if overall score is below 50
  const worst = Math.min(...allReports.map((r) => r.validation.scores.overall));
  process.exit(worst < 50 ? 1 : 0);
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(2);
});

// ── Helpers ────────────────────────────────────────────────────────────

function formatReport(report, format) {
  switch (format) {
    case "table": return formatTable(report);
    case "json": return formatJSON(report);
    case "markdown": return formatMarkdown(report);
    default: return formatTable(report);
  }
}

function getFlag(names) {
  for (const name of names) {
    const idx = args.indexOf(name);
    if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  }
  return null;
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

function printHelp() {
  console.log(`
  meta-inspector — Meta tags, Open Graph, Twitter Cards, schema, and social previews

  USAGE
    meta-inspector <url> [options]
    meta-inspector <url1> <url2> ... [options]
    meta-inspector urls.txt [options]

  ARGUMENTS
    <url>         Website URL to inspect (https:// added if missing)
    <file>        Text file with one URL per line (batch mode)

  OPTIONS
    -f, --format <type>      Output: table, json, markdown           [default: table]
    -o, --output <file>      Save report to file
    -t, --timeout <ms>       Request timeout                         [default: 15000]
    --user-agent <string>    Custom User-Agent header
    --no-previews            Skip social preview generation
    -q, --quiet              Suppress progress messages
    -h, --help               Show this help
    -v, --version            Show version

  EXAMPLES
    meta-inspector example.com
    meta-inspector example.com -f markdown -o report.md
    meta-inspector example.com other.com -f json
    meta-inspector urls.txt -o results.json -f json

  EXIT CODES
    0   Score >= 50 (acceptable)
    1   Score < 50 (needs work)
    2   Fatal error
`);
}
