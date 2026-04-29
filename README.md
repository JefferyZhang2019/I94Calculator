# I-94 U.S. Presence Calculator

A browser-based tool for analyzing CBP I-94 travel history to track U.S. physical presence — useful for naturalization eligibility, IRS Substantial Presence Test (SPT), and green card holders monitoring continuous residence.

All processing is local. No data is sent to any server.

## Features

- Total and year-by-year U.S. presence breakdown
- IRS Substantial Presence Test (SPT) estimate
- Naturalization 5-year rolling window tracking
- Continuous residence warnings (180-day / 365-day absences)
- Custom date range calculator
- CSV and PDF report export
- Bilingual UI (English / Chinese)
- Embeddable via `?embed=true` or importable as a React component

## Tech Stack

| Layer | Library |
|-------|---------|
| UI framework | React 19 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| Date math | date-fns |
| Charts | Recharts |
| Map | react-simple-maps |
| PDF export | @react-pdf/renderer |
| Tests | Vitest + Testing Library |

## Local Development

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm test         # run Vitest test suite
npm run build    # production build → dist/
npm run preview  # preview production build locally
```

## Project Structure

```
src/
  components/     React components (I94Calculator, StaysTable, AnalysisTab, ...)
  utils/          Pure logic — parser.js, calculator.js, exporter.js
  i18n/           Bilingual strings (strings.js) + React context (LangContext.jsx)
  App.jsx         App shell: header, tab nav, footer
  index.js        Library entry point (exports I94Calculator)
```

## Embedding and Integration

See [docs/integration.md](docs/integration.md) for details on iframe embed mode and React component import.
