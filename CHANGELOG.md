# Changelog

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
