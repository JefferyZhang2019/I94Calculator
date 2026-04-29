# Changelog

## [1.1.1] - 2026-04-29

### Fixed

- **Port Heat Map white screen crash** — `geoAlbersUsa` returns `null` for coordinates outside its clip region (Guam, Puerto Rico, Aruba, and 7 other US territories in `us_poe_enriched.json`). `react-simple-maps` v3's `Marker` then called `_slicedToArray(null)` which threw `TypeError: Invalid attempt to destructure non-iterable instance`, blanking the entire page. Fixed by introducing `SafeMarker`, which checks the projection result before rendering and silently skips out-of-bounds ports.

## [1.1.0] - 2026-04-27

### Added

- **Port Heat Map** — new accordion in the Analysis tab plots all I-94 ports of entry and exit on a US map using heat-glow circles. Frequency-based color coding (green → yellow → orange → red) shows which ports you use most. Toggle between All / Entry / Exit modes. Ports that cannot be mapped appear in a ranked "Not on map" list below the map.
- **Port coordinates data file** (`src/data/us_poe_enriched.json`) — 416 FAM POE entries with latitude/longitude sourced from US Census Gazetteer and OpenStreetMap. All coordinate maintenance is now centralized in this file.

### Fixed

- **CI: Node.js 24 compatibility** — added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` to the deploy workflow to silence Node.js 20 deprecation errors on GitHub Actions runners.
- **CI: react-simple-maps peer dependency** — added `.npmrc` with `legacy-peer-deps=true` to resolve the React 19 / react-simple-maps@3 peer dependency conflict during `npm ci`.

## [1.0.1] - 2026-04-26

### Fixed

- **Same-day round trip false warnings** — when a user departed and re-entered the US on the same calendar date, the parser incorrectly flagged "consecutive arrivals" and "consecutive departures". Root cause: the sort was date-only, so same-date records stayed in input order (arrival before departure). Added a secondary sort tiebreaker so that on equal dates, Departure always precedes Arrival, matching real-world travel order.

## [1.0.0] - 2026-04-19

### Added

- Initial public release
- Parse CBP I-94 travel history (tab- and space-separated formats)
- Calculate US presence days per trip and per calendar year
- Substantial Presence Test (SPT) analysis with day counts and thresholds
- Year-by-year and month-by-month breakdowns
- Overview tab with total visits, longest stay, and visit frequency chart
- PDF report export
- Embed mode (`?embed=true`) for iframe integration
- English / Chinese (中文) language toggle
- Version number displayed in footer (standalone and embed modes)
