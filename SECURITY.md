# Security Policy

## Reporting a vulnerability

If you find a security vulnerability in meta-inspector, please report it responsibly.

**Do not open a public issue.** Instead, email [hello@dishine.it](mailto:hello@dishine.it) with:

- A description of the vulnerability.
- Steps to reproduce it.
- The impact you believe it has.

We will acknowledge your report within 48 hours and aim to release a fix within 7 days for critical issues.

## Scope

meta-inspector is a CLI tool that makes HTTP requests to user-specified URLs and parses the HTML response. Security considerations include:

- **Server-Side Request Forgery (SSRF):** The tool fetches URLs provided by the user. It does not restrict which URLs can be fetched. If you run meta-inspector in a server environment, ensure you validate and restrict input URLs.
- **HTML parsing:** The tool uses [cheerio](https://github.com/cheeriojs/cheerio) for HTML parsing, which does not execute JavaScript. It does not render pages in a browser context.
- **No data persistence:** meta-inspector does not store, cache, or transmit fetched data to any third party. All output goes to stdout or a local file.

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.2.x   | Yes       |
| 1.1.x   | Security fixes only |
| < 1.1   | No        |
