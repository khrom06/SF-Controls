# Changelog

## [1.0.1]
### Changed
- The file HACS loads (`dist/`) is now minified at build time (esbuild): ~16% smaller raw. No behaviour change — `src/` stays the readable source of truth; all 535 render checks pass unchanged.
- The loaded file now prints its version to the console (`SF-CONTROLS v1.0.1`) and warns, instead of silently redefining the cards, if the resource is declared twice (HACS + a manual file) — same pattern as SF-Cards. Verified in a real browser: `sf-fan-card`, `sf-bar-card` and `sf-todo-card` all still register, second load is ignored with a clear warning, version banner confirmed.
- `test/lint.js` (new, run by `./test/run.sh`): reliability rules from SF-Cards, adapted — every `setInterval` kept in `this.X` has a matching `clearInterval`, and no hard-coded colour outside the theme tokens (`00-kit.js`). No existing violation; verified with a mutation test (a hard-coded colour injected in a scratch copy is caught).

## [1.0.0] — 2026-11-04
### Added
- `sf-fan-card`, `sf-bar-card`, `sf-todo-card`: light and dark themes, en/fr/de/es, render tests in headless Chrome.
