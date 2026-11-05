# Changelog

## [1.0.1]
### Changed
- The file HACS loads (`dist/`) is now minified at build time (esbuild): ~16% smaller raw. No behaviour change — `src/` stays the readable source of truth; all 535 render checks pass unchanged.

## [1.0.0] — 2026-11-04
### Added
- `sf-fan-card`, `sf-bar-card`, `sf-todo-card`: light and dark themes, en/fr/de/es, render tests in headless Chrome.
