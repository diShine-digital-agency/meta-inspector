# Contributing to meta-inspector

Contributions are welcome. This document explains how to get involved.

## Getting started

1. Fork the repository.
2. Clone your fork: `git clone https://github.com/<your-username>/meta-inspector.git`
3. Install dependencies: `npm install`
4. Run the tool locally: `node bin/cli.js https://example.com`

## Project structure

```
bin/cli.js          CLI entry point and argument parsing
src/index.js        Public API — re-exports all modules
src/fetcher.js      HTTP fetch with redirect following
src/extractor.js    HTML parsing and meta tag extraction (cheerio)
src/validator.js    Validation rules and scoring
src/previewer.js    Social preview simulation (text-based)
src/reporter.js     Output formatters (table, JSON, Markdown)
```

## Making changes

- Keep changes focused. One pull request per feature or fix.
- Follow the existing code style (no semicolons at line ends are fine — the project uses them, keep that consistent).
- Test your changes against several real URLs before submitting.
- Update `CHANGELOG.md` under an `[Unreleased]` section.

## Adding new extraction

To add support for a new meta tag family:

1. Add an extraction function in `src/extractor.js` following the existing pattern.
2. Add the field to the return object in `extract()`.
3. If validation rules apply, add them in `src/validator.js`.
4. Update `src/reporter.js` to display the new data in all three formats (table, JSON, Markdown).
5. Update `README.md` if the change is user-facing.

## Adding new validation rules

Each validation rule in `src/validator.js` follows this pattern:

1. Check a condition on the extracted data.
2. Push an issue with severity (`critical`, `high`, `medium`, `low`), category, title, detail, and an optional HTML fix snippet.
3. Adjust the score.

## Reporting bugs

Open an issue with:

- The URL you inspected (if applicable).
- The command you ran.
- The output you got.
- What you expected instead.

## Code of conduct

Be respectful and constructive. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
