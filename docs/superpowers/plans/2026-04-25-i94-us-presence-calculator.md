# I-94 US Presence Calculator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained, privacy-first React web app that parses a pasted I-94 travel history table and produces a detailed breakdown of physical presence in the United States (per-stay, per-year, per-month, custom range, PR split, SPT estimate).

**Architecture:** All computation runs entirely in the browser — no backend, no data transmission. Pure utility functions in `src/utils/` handle parsing and calculation; React components in `src/components/` handle display. The root `<I94Calculator />` component is exported so it can be dropped into any future React site, and a `?embed=true` URL param strips chrome for iframe embedding. GitHub Pages deployment is handled by a `vite build` + `gh-pages` publish step.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, date-fns 3, Recharts 2, Vitest 1 + @testing-library/react

---

## File Map

| Path | Responsibility |
|---|---|
| `src/utils/parser.js` | Raw I-94 text → `Entry[]` (parse + validate) |
| `src/utils/calculator.js` | `Entry[]` → all stats (stays, totals, by-year, by-month, range, PR split, SPT, absences) |
| `src/utils/exporter.js` | Stats → CSV string |
| `src/utils/parser.test.js` | Unit tests for parser |
| `src/utils/calculator.test.js` | Unit tests for calculator |
| `src/utils/exporter.test.js` | Unit tests for exporter |
| `src/components/I94Calculator.jsx` | Top-level exportable component; owns all state |
| `src/components/InputPanel.jsx` | Textarea + optional fields + Calculate button |
| `src/components/SummaryBanner.jsx` | Key stats summary card |
| `src/components/StaysTable.jsx` | Numbered list of individual stays with anomaly warnings |
| `src/components/YearBreakdown.jsx` | Year-by-year table + stacked bar chart |
| `src/components/MonthBreakdown.jsx` | Per-month accordion grouped by year |
| `src/components/CustomRange.jsx` | Date-range picker + days-in-range result |
| `src/components/BonusPanel.jsx` | IRS SPT estimate + longest stay/absence |
| `src/components/ExportButton.jsx` | Triggers CSV download |
| `src/App.jsx` | Wraps `<I94Calculator />`, handles `?embed=true` |
| `src/main.jsx` | Vite entry point |
| `src/styles/index.css` | Tailwind directives |
| `index.html` | Vite HTML template |
| `vite.config.js` | Build config with configurable base path |
| `tailwind.config.js` | Tailwind content paths |
| `vitest.config.js` | Vitest config |
| `package.json` | Dependencies + deploy scripts |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `vitest.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/styles/index.css`
- Create: `src/main.jsx`
- Create: `src/App.jsx`

- [ ] **Step 1: Initialize project and install dependencies**

```bash
cd C:/Users/Jeffery/Desktop/USDays
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install date-fns recharts
npx tailwindcss init -p
```

- [ ] **Step 2: Configure Vite**

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
})
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.js`:

```js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
  },
})
```

Create `src/test-setup.js`:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Configure Tailwind**

Replace `tailwind.config.js` with:

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Replace `src/styles/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Create minimal App and main entry**

`src/main.jsx`:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

`src/App.jsx`:
```jsx
import I94Calculator from './components/I94Calculator'

export default function App() {
  const embed = new URLSearchParams(window.location.search).get('embed') === 'true'
  return (
    <div className={embed ? '' : 'min-h-screen bg-gray-50'}>
      {!embed && (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">I-94 U.S. Presence Calculator</h1>
          <p className="text-sm text-gray-500 mt-1">
            Estimate your physical presence in the United States from your I-94 travel history.
          </p>
        </header>
      )}
      <main className={embed ? '' : 'max-w-4xl mx-auto px-4 py-8'}>
        <I94Calculator />
      </main>
      {!embed && (
        <footer className="border-t border-gray-200 px-6 py-6 mt-12 text-xs text-gray-500 max-w-4xl mx-auto">
          <p className="font-semibold mb-1">Disclaimer</p>
          <p>
            This tool is a personal record-review aid only. It does not store, transmit, or share any
            information you enter — all processing happens locally in your browser. Calculated totals
            are estimates derived from the travel events you paste; they may differ from official
            government records. This tool does not constitute legal, immigration, or tax advice. For
            decisions involving residency status, naturalization eligibility, or tax filing, consult a
            qualified attorney or licensed tax professional. Always verify results against your own
            passport stamps, boarding passes, and any correspondence from USCIS or CBP.
          </p>
          <p className="mt-2">
            Official resources:{' '}
            <a className="underline" href="https://i94.cbp.dhs.gov/search/history-search" target="_blank" rel="noreferrer">
              CBP I-94 History Search
            </a>{' '}
            ·{' '}
            <a className="underline" href="https://www.dhs.gov/i-94-information" target="_blank" rel="noreferrer">
              DHS I-94 Information
            </a>{' '}
            ·{' '}
            <a className="underline" href="https://www.irs.gov/individuals/international-taxpayers/determining-alien-tax-status" target="_blank" rel="noreferrer">
              IRS: Alien Tax Status
            </a>
          </p>
        </footer>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Update package.json with deploy script**

Add to the `scripts` block in `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "deploy": "npm run build && npx gh-pages -d dist"
}
```

Install gh-pages:
```bash
npm install -D gh-pages
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server at `http://localhost:5173`, blank page with header visible.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "feat: project scaffolding — Vite + React + Tailwind + Vitest"
```

---

## Task 2: Parser Utility

**Files:**
- Create: `src/utils/parser.js`
- Create: `src/utils/parser.test.js`

The parser converts raw pasted text from the I-94 website into a structured array of entries. Each line may use tabs or multiple spaces as separators. The I-94 site lists entries **newest first**; the parser sorts them **oldest first** for downstream processing.

### Data types (used throughout all tasks)

```js
// Entry — one row from the I-94 table
// { date: Date, type: 'Arrival' | 'Departure', port: string }

// Stay — one continuous US presence period
// { arrival: Date, departure: Date | null, isOngoing: boolean }
// isOngoing = true when the last entry is Arrival (still in US)

// YearStats — { year: number, days: number, stays: number }
// MonthStats — { year: number, month: number, days: number }
// Totals — { total: number, beforePR: number | null, afterPR: number | null, currentlyInUS: boolean }
// SPTResult — { year: number, score: number, isResident: boolean }
// AbsenceInfo — { start: Date, end: Date, days: number }
```

- [ ] **Step 1: Write failing tests for parser**

Create `src/utils/parser.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { parseI94Text } from './parser'

describe('parseI94Text', () => {
  it('parses tab-separated lines and returns entries sorted oldest first', () => {
    const input = `1\t2024-12-11\tArrival\tBLA
2\t2024-12-10\tDeparture\t840
3\t2024-12-02\tArrival\tMSE`
    const result = parseI94Text(input)
    expect(result.entries).toHaveLength(3)
    expect(result.entries[0].date.toISOString().slice(0, 10)).toBe('2024-12-02')
    expect(result.entries[0].type).toBe('Arrival')
    expect(result.entries[1].type).toBe('Departure')
    expect(result.entries[2].date.toISOString().slice(0, 10)).toBe('2024-12-11')
  })

  it('parses space-separated lines', () => {
    const input = `1    2024-11-09    Arrival    BLA\n2    2024-11-28    Departure    Unavailable`
    const result = parseI94Text(input)
    expect(result.entries).toHaveLength(2)
  })

  it('skips blank lines', () => {
    const input = `1\t2024-12-11\tArrival\tBLA\n\n\n2\t2024-12-10\tDeparture\t840`
    const result = parseI94Text(input)
    expect(result.entries).toHaveLength(2)
  })

  it('returns warnings for consecutive arrivals', () => {
    const input = `1\t2024-12-11\tArrival\tBLA\n2\t2024-12-10\tArrival\t840`
    const result = parseI94Text(input)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toMatch(/consecutive arrival/i)
  })

  it('returns warnings for consecutive departures', () => {
    const input = `1\t2024-12-11\tDeparture\tBLA\n2\t2024-12-10\tDeparture\t840`
    const result = parseI94Text(input)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('returns error on empty input', () => {
    const result = parseI94Text('   ')
    expect(result.error).toBeTruthy()
    expect(result.entries).toHaveLength(0)
  })

  it('returns error when no valid lines found', () => {
    const result = parseI94Text('hello world\nfoo bar')
    expect(result.error).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: All parser tests FAIL with "Cannot find module './parser'"

- [ ] **Step 3: Implement parser**

Create `src/utils/parser.js`:

```js
/**
 * Parses raw I-94 travel history text into structured entries.
 * @param {string} rawText
 * @returns {{ entries: Array<{date: Date, type: string, port: string}>, warnings: string[], error: string|null }}
 */
export function parseI94Text(rawText) {
  const result = { entries: [], warnings: [], error: null }

  if (!rawText || !rawText.trim()) {
    result.error = 'No input provided. Please paste your I-94 travel history.'
    return result
  }

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const DATE_RE = /(\d{4}-\d{2}-\d{2})\s+(Arrival|Departure)/i

  const parsed = []
  for (const line of lines) {
    const m = line.match(DATE_RE)
    if (!m) continue
    const parts = line.split(/\s{2,}|\t/)
    const port = parts[parts.length - 1]?.trim() || ''
    parsed.push({
      date: new Date(m[1] + 'T12:00:00'),
      type: m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase(),
      port,
    })
  }

  if (parsed.length === 0) {
    result.error = 'No valid travel records found. Check that your paste includes lines with a date and Arrival/Departure.'
    return result
  }

  parsed.sort((a, b) => a.date - b.date)

  for (let i = 1; i < parsed.length; i++) {
    if (parsed[i].type === parsed[i - 1].type) {
      result.warnings.push(
        `Consecutive ${parsed[i].type.toLowerCase()}s detected around ${parsed[i - 1].date.toISOString().slice(0, 10)} and ${parsed[i].date.toISOString().slice(0, 10)}. A record may be missing.`
      )
    }
  }

  result.entries = parsed
  return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All 7 parser tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/parser.js src/utils/parser.test.js
git commit -m "feat: I-94 text parser with validation and anomaly warnings"
```

---

## Task 3: Core Calculator — Stays and Totals

**Files:**
- Create: `src/utils/calculator.js`
- Create: `src/utils/calculator.test.js`

- [ ] **Step 1: Write failing tests for buildStays and computeTotals**

Create `src/utils/calculator.test.js`:

```js
import { describe, it, expect, beforeAll } from 'vitest'
import { buildStays, computeTotals } from './calculator'

function d(str) {
  return new Date(str + 'T12:00:00')
}

const SAMPLE_ENTRIES = [
  { date: d('2019-08-13'), type: 'Arrival',   port: 'ATL' },
  { date: d('2019-12-13'), type: 'Departure', port: 'DAL' },
  { date: d('2020-01-04'), type: 'Arrival',   port: 'DAL' },
  { date: d('2020-09-11'), type: 'Departure', port: 'DMA' },
  { date: d('2021-08-10'), type: 'Arrival',   port: 'DAL' },
  { date: d('2023-01-08'), type: 'Departure', port: 'BOS' },
]

describe('buildStays', () => {
  it('pairs arrivals with departures', () => {
    const stays = buildStays(SAMPLE_ENTRIES, new Date('2026-04-25T12:00:00'))
    expect(stays).toHaveLength(3)
    expect(stays[0].arrival.toISOString().slice(0, 10)).toBe('2019-08-13')
    expect(stays[0].departure.toISOString().slice(0, 10)).toBe('2019-12-13')
    expect(stays[0].isOngoing).toBe(false)
  })

  it('marks the last stay as ongoing when last entry is Arrival', () => {
    const entries = [
      { date: d('2025-12-05'), type: 'Arrival', port: 'NYC' },
    ]
    const today = d('2026-04-25')
    const stays = buildStays(entries, today)
    expect(stays).toHaveLength(1)
    expect(stays[0].isOngoing).toBe(true)
    expect(stays[0].departure.toISOString().slice(0, 10)).toBe('2026-04-25')
  })

  it('counts days inclusively: arrival 2025-12-05 to departure 2025-12-14 = 10 days', () => {
    const entries = [
      { date: d('2025-12-05'), type: 'Arrival',   port: 'NYC' },
      { date: d('2025-12-14'), type: 'Departure', port: 'NYC' },
    ]
    const stays = buildStays(entries, new Date())
    expect(stays[0].days).toBe(10)
  })

  it('counts single-day stay (arrival = departure) as 1 day', () => {
    const entries = [
      { date: d('2025-06-01'), type: 'Arrival',   port: 'NYC' },
      { date: d('2025-06-01'), type: 'Departure', port: 'NYC' },
    ]
    const stays = buildStays(entries, new Date())
    expect(stays[0].days).toBe(1)
  })
})

describe('computeTotals', () => {
  it('sums all stay days', () => {
    const stays = buildStays(SAMPLE_ENTRIES, new Date('2026-04-25T12:00:00'))
    const totals = computeTotals(stays, null)
    // 2019-08-13 to 2019-12-13 = 123 days
    // 2020-01-04 to 2020-09-11 = 252 days
    // 2021-08-10 to 2023-01-08 = 517 days
    expect(totals.total).toBe(123 + 252 + 517)
    expect(totals.currentlyInUS).toBe(false)
    expect(totals.beforePR).toBeNull()
    expect(totals.afterPR).toBeNull()
  })

  it('detects currently in US', () => {
    const entries = [{ date: d('2025-12-05'), type: 'Arrival', port: 'NYC' }]
    const today = d('2026-04-25')
    const stays = buildStays(entries, today)
    const totals = computeTotals(stays, null)
    expect(totals.currentlyInUS).toBe(true)
  })

  it('splits days before and after PR date', () => {
    // Stay from 2025-01-01 to 2025-12-31 (365 days)
    // PR date: 2025-07-01
    // Before: Jan 1 to Jun 30 = 181 days
    // After:  Jul 1 to Dec 31 = 184 days
    const entries = [
      { date: d('2025-01-01'), type: 'Arrival',   port: 'NYC' },
      { date: d('2025-12-31'), type: 'Departure', port: 'NYC' },
    ]
    const today = d('2026-04-25')
    const stays = buildStays(entries, today)
    const totals = computeTotals(stays, d('2025-07-01'))
    expect(totals.total).toBe(365)
    expect(totals.beforePR).toBe(181)
    expect(totals.afterPR).toBe(184)
    expect(totals.beforePR + totals.afterPR).toBe(totals.total)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: All calculator tests FAIL with "Cannot find module './calculator'"

- [ ] **Step 3: Implement buildStays and computeTotals**

Create `src/utils/calculator.js`:

```js
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  isBefore,
  isEqual,
} from 'date-fns'

/**
 * Converts sorted Entry[] into Stay[].
 * @param {Array<{date: Date, type: string, port: string}>} entries - sorted oldest first
 * @param {Date} today
 * @returns {Array<{arrival: Date, departure: Date, days: number, port: string, isOngoing: boolean}>}
 */
export function buildStays(entries, today) {
  const stays = []
  let currentArrival = null
  let currentPort = ''

  for (const entry of entries) {
    if (entry.type === 'Arrival') {
      currentArrival = entry.date
      currentPort = entry.port
    } else if (entry.type === 'Departure' && currentArrival) {
      stays.push({
        arrival: currentArrival,
        departure: entry.date,
        days: differenceInCalendarDays(entry.date, currentArrival) + 1,
        port: currentPort,
        isOngoing: false,
      })
      currentArrival = null
      currentPort = ''
    }
  }

  if (currentArrival) {
    stays.push({
      arrival: currentArrival,
      departure: today,
      days: differenceInCalendarDays(today, currentArrival) + 1,
      port: currentPort,
      isOngoing: true,
    })
  }

  return stays
}

/**
 * Computes summary totals from stays.
 * @param {Array} stays
 * @param {Date|null} prDate
 * @returns {{ total: number, beforePR: number|null, afterPR: number|null, currentlyInUS: boolean }}
 */
export function computeTotals(stays, prDate) {
  const total = stays.reduce((sum, s) => sum + s.days, 0)
  const currentlyInUS = stays.length > 0 && stays[stays.length - 1].isOngoing

  if (!prDate) {
    return { total, beforePR: null, afterPR: null, currentlyInUS }
  }

  let beforePR = 0
  let afterPR = 0

  for (const stay of stays) {
    const days = eachDayOfInterval({ start: stay.arrival, end: stay.departure })
    for (const day of days) {
      if (isBefore(day, prDate)) {
        beforePR++
      } else {
        afterPR++
      }
    }
  }

  return { total, beforePR, afterPR, currentlyInUS }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All buildStays and computeTotals tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/calculator.js src/utils/calculator.test.js
git commit -m "feat: buildStays and computeTotals with PR date split"
```

---

## Task 4: Calculator — Year, Month, Range, SPT, Absences

**Files:**
- Modify: `src/utils/calculator.js`
- Modify: `src/utils/calculator.test.js`

- [ ] **Step 1: Add failing tests for year/month/range/SPT/absences**

Append to `src/utils/calculator.test.js`:

```js
import {
  buildStays, computeTotals,
  computeByYear, computeByMonth, computeForRange,
  computeSPT, computeAbsences, computeLongestStay,
} from './calculator'

describe('computeByYear', () => {
  it('distributes days across calendar years', () => {
    // Stay: 2021-08-10 to 2023-01-08 = 517 days
    const entries = [
      { date: d('2021-08-10'), type: 'Arrival',   port: 'DAL' },
      { date: d('2023-01-08'), type: 'Departure', port: 'BOS' },
    ]
    const stays = buildStays(entries, new Date())
    const byYear = computeByYear(stays)
    const y2021 = byYear.find(y => y.year === 2021)
    const y2022 = byYear.find(y => y.year === 2022)
    const y2023 = byYear.find(y => y.year === 2023)
    // Aug 10 to Dec 31, 2021: 144 days
    expect(y2021.days).toBe(144)
    // All of 2022: 365 days
    expect(y2022.days).toBe(365)
    // Jan 1 to Jan 8, 2023: 8 days
    expect(y2023.days).toBe(8)
    expect(y2021.days + y2022.days + y2023.days).toBe(517)
  })
})

describe('computeByMonth', () => {
  it('distributes days across calendar months', () => {
    const entries = [
      { date: d('2025-11-19'), type: 'Arrival',   port: 'DMA' },
      { date: d('2025-11-23'), type: 'Departure', port: 'NYC' },
    ]
    const stays = buildStays(entries, new Date())
    const byMonth = computeByMonth(stays)
    const nov = byMonth.find(m => m.year === 2025 && m.month === 11)
    expect(nov.days).toBe(5)
  })
})

describe('computeForRange', () => {
  it('counts only days overlapping the given range', () => {
    const entries = [
      { date: d('2025-01-01'), type: 'Arrival',   port: 'NYC' },
      { date: d('2025-12-31'), type: 'Departure', port: 'NYC' },
    ]
    const stays = buildStays(entries, new Date())
    // Range: Jan 1 to Jan 31 = 31 days
    const count = computeForRange(stays, d('2025-01-01'), d('2025-01-31'))
    expect(count).toBe(31)
  })

  it('returns 0 when range has no overlap', () => {
    const entries = [
      { date: d('2025-01-01'), type: 'Arrival',   port: 'NYC' },
      { date: d('2025-03-31'), type: 'Departure', port: 'NYC' },
    ]
    const stays = buildStays(entries, new Date())
    const count = computeForRange(stays, d('2025-05-01'), d('2025-05-31'))
    expect(count).toBe(0)
  })
})

describe('computeSPT', () => {
  it('flags substantial presence when score >= 183', () => {
    // 200 days in target year, 0 in prior years → score = 200 → resident
    const entries = [
      { date: d('2024-01-01'), type: 'Arrival',   port: 'NYC' },
      { date: d('2024-07-18'), type: 'Departure', port: 'NYC' }, // 200 days
    ]
    const stays = buildStays(entries, new Date())
    const result = computeSPT(stays, 2024)
    expect(result.score).toBeGreaterThanOrEqual(183)
    expect(result.isResident).toBe(true)
  })

  it('returns non-resident when score < 183', () => {
    const entries = [
      { date: d('2024-06-01'), type: 'Arrival',   port: 'NYC' },
      { date: d('2024-06-30'), type: 'Departure', port: 'NYC' }, // 30 days
    ]
    const stays = buildStays(entries, new Date())
    const result = computeSPT(stays, 2024)
    expect(result.isResident).toBe(false)
  })
})

describe('computeAbsences', () => {
  it('identifies gaps between stays', () => {
    const entries = [
      { date: d('2020-01-01'), type: 'Arrival',   port: 'NYC' },
      { date: d('2020-03-01'), type: 'Departure', port: 'NYC' },
      { date: d('2020-06-01'), type: 'Arrival',   port: 'NYC' },
      { date: d('2020-09-01'), type: 'Departure', port: 'NYC' },
    ]
    const stays = buildStays(entries, new Date())
    const absences = computeAbsences(stays)
    expect(absences).toHaveLength(1)
    // Mar 2 to May 31 = 91 days
    expect(absences[0].days).toBe(91)
  })
})

describe('computeLongestStay', () => {
  it('returns the stay with the most days', () => {
    const entries = [
      { date: d('2021-08-10'), type: 'Arrival',   port: 'DAL' },
      { date: d('2023-01-08'), type: 'Departure', port: 'BOS' },
      { date: d('2019-08-13'), type: 'Arrival',   port: 'ATL' },
      { date: d('2019-12-13'), type: 'Departure', port: 'DAL' },
    ]
    const stays = buildStays(entries, new Date())
    const longest = computeLongestStay(stays)
    expect(longest.days).toBe(517)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: New tests FAIL with "computeByYear is not a function" (and similar).

- [ ] **Step 3: Implement the remaining calculator functions**

Append to `src/utils/calculator.js`:

```js
/**
 * @param {Array} stays
 * @returns {Array<{year: number, days: number, stays: number}>}
 */
export function computeByYear(stays) {
  const map = new Map()
  for (const stay of stays) {
    const days = eachDayOfInterval({ start: stay.arrival, end: stay.departure })
    for (const day of days) {
      const y = day.getFullYear()
      const prev = map.get(y) || { year: y, days: 0, stays: 0 }
      map.set(y, { ...prev, days: prev.days + 1 })
    }
    // count stays per year (a stay can span years — count in both)
    const years = new Set(
      eachDayOfInterval({ start: stay.arrival, end: stay.departure }).map(d => d.getFullYear())
    )
    years.forEach(y => {
      const prev = map.get(y) || { year: y, days: 0, stays: 0 }
      map.set(y, { ...prev, stays: prev.stays + 1 })
    })
  }
  return Array.from(map.values()).sort((a, b) => a.year - b.year)
}

/**
 * @param {Array} stays
 * @returns {Array<{year: number, month: number, days: number}>}
 */
export function computeByMonth(stays) {
  const map = new Map()
  for (const stay of stays) {
    const days = eachDayOfInterval({ start: stay.arrival, end: stay.departure })
    for (const day of days) {
      const key = `${day.getFullYear()}-${day.getMonth() + 1}`
      const prev = map.get(key) || { year: day.getFullYear(), month: day.getMonth() + 1, days: 0 }
      map.set(key, { ...prev, days: prev.days + 1 })
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  )
}

/**
 * @param {Array} stays
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {number}
 */
export function computeForRange(stays, rangeStart, rangeEnd) {
  let count = 0
  for (const stay of stays) {
    const start = stay.arrival > rangeStart ? stay.arrival : rangeStart
    const end = stay.departure < rangeEnd ? stay.departure : rangeEnd
    if (start <= end) {
      count += differenceInCalendarDays(end, start) + 1
    }
  }
  return count
}

/**
 * IRS Substantial Presence Test for a given tax year.
 * Score = days_in_year + (days_year-1 / 3) + (days_year-2 / 6)
 * @param {Array} stays
 * @param {number} year
 * @returns {{ year: number, daysY: number, daysY1: number, daysY2: number, score: number, isResident: boolean }}
 */
export function computeSPT(stays, year) {
  const byYear = computeByYear(stays)
  const get = y => (byYear.find(r => r.year === y)?.days ?? 0)
  const daysY  = get(year)
  const daysY1 = get(year - 1)
  const daysY2 = get(year - 2)
  const score = daysY + Math.floor(daysY1 / 3) + Math.floor(daysY2 / 6)
  return { year, daysY, daysY1, daysY2, score, isResident: score >= 183 }
}

/**
 * Returns gaps between consecutive stays (time outside the US).
 * @param {Array} stays
 * @returns {Array<{start: Date, end: Date, days: number}>}
 */
export function computeAbsences(stays) {
  const absences = []
  for (let i = 1; i < stays.length; i++) {
    const gapStart = stays[i - 1].departure
    const gapEnd   = stays[i].arrival
    const days = differenceInCalendarDays(gapEnd, gapStart) - 1
    if (days > 0) {
      absences.push({ start: gapStart, end: gapEnd, days })
    }
  }
  return absences.sort((a, b) => b.days - a.days)
}

/**
 * @param {Array} stays
 * @returns {{ arrival: Date, departure: Date, days: number } | null}
 */
export function computeLongestStay(stays) {
  if (stays.length === 0) return null
  return stays.reduce((best, s) => (s.days > best.days ? s : best), stays[0])
}
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: All tests PASS (parser + calculator).

- [ ] **Step 5: Commit**

```bash
git add src/utils/calculator.js src/utils/calculator.test.js
git commit -m "feat: full calculator — year/month/range/SPT/absences/longest stay"
```

---

## Task 5: Exporter Utility

**Files:**
- Create: `src/utils/exporter.js`
- Create: `src/utils/exporter.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/utils/exporter.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { buildCSV } from './exporter'

function d(str) { return new Date(str + 'T12:00:00') }

describe('buildCSV', () => {
  it('produces CSV with header and one stay row', () => {
    const stays = [{
      arrival: d('2025-01-01'),
      departure: d('2025-01-10'),
      days: 10,
      port: 'NYC',
      isOngoing: false,
    }]
    const csv = buildCSV({ stays, byYear: [], byMonth: [] })
    expect(csv).toContain('Arrival,Departure,Days,Port,Status')
    expect(csv).toContain('2025-01-01,2025-01-10,10,NYC,Completed')
  })

  it('marks ongoing stays in the status column', () => {
    const stays = [{
      arrival: d('2025-12-05'),
      departure: d('2026-04-25'),
      days: 142,
      port: 'NYC',
      isOngoing: true,
    }]
    const csv = buildCSV({ stays, byYear: [], byMonth: [] })
    expect(csv).toContain('Ongoing')
  })

  it('includes yearly summary section', () => {
    const csv = buildCSV({
      stays: [],
      byYear: [{ year: 2024, days: 200, stays: 2 }],
      byMonth: [],
    })
    expect(csv).toContain('Year,Days in U.S.,Stays')
    expect(csv).toContain('2024,200,2')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: Exporter tests FAIL with "Cannot find module './exporter'"

- [ ] **Step 3: Implement exporter**

Create `src/utils/exporter.js`:

```js
/**
 * @param {{ stays: Array, byYear: Array, byMonth: Array }} data
 * @returns {string} CSV content
 */
export function buildCSV({ stays, byYear, byMonth }) {
  const fmt = d => d.toISOString().slice(0, 10)
  const lines = []

  lines.push('I-94 U.S. Presence Calculator Export')
  lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`)
  lines.push('')

  lines.push('INDIVIDUAL STAYS')
  lines.push('Arrival,Departure,Days,Port,Status')
  for (const s of stays) {
    lines.push(`${fmt(s.arrival)},${fmt(s.departure)},${s.days},${s.port},${s.isOngoing ? 'Ongoing' : 'Completed'}`)
  }
  lines.push('')

  lines.push('YEARLY SUMMARY')
  lines.push('Year,Days in U.S.,Stays')
  for (const y of byYear) {
    lines.push(`${y.year},${y.days},${y.stays}`)
  }
  lines.push('')

  lines.push('MONTHLY SUMMARY')
  lines.push('Year,Month,Days in U.S.')
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  for (const m of byMonth) {
    lines.push(`${m.year},${MONTHS[m.month - 1]},${m.days}`)
  }

  return lines.join('\r\n')
}

/**
 * Triggers a CSV file download in the browser.
 * @param {string} csvContent
 * @param {string} filename
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/exporter.js src/utils/exporter.test.js
git commit -m "feat: CSV exporter utility"
```

---

## Task 6: InputPanel Component

**Files:**
- Create: `src/components/InputPanel.jsx`

- [ ] **Step 1: Create InputPanel**

Create `src/components/InputPanel.jsx`:

```jsx
import { useState } from 'react'

const EXAMPLE = `1    2024-12-11    Arrival    BLA
2    2024-12-10    Departure    840
3    2024-12-02    Arrival    MSE
4    2024-11-28    Departure    Unavailable
5    2024-11-09    Arrival    BLA`

export default function InputPanel({ onCalculate }) {
  const [rawText, setRawText] = useState('')
  const [prDate, setPrDate] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!rawText.trim()) {
      setError('Please paste your I-94 travel history before calculating.')
      return
    }
    setError('')
    onCalculate({ rawText, prDate: prDate || null })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <details className="text-sm text-gray-600" open>
        <summary className="cursor-pointer font-medium text-gray-700 mb-2">How to use this tool</summary>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>
            Visit{' '}
            <a href="https://i94.cbp.dhs.gov/search/history-search" target="_blank" rel="noreferrer" className="text-blue-600 underline">
              i94.cbp.dhs.gov
            </a>{' '}
            and log in with your information.
          </li>
          <li>Copy the full table under <strong>Travel History Results</strong>.</li>
          <li>Paste it into the text box below.</li>
          <li>Optionally enter your Permanent Resident Approval Date.</li>
          <li>Click <strong>Calculate</strong>. Nothing you enter leaves your device.</li>
        </ol>
        <p className="mt-2 text-xs text-gray-500">
          Example format:
        </p>
        <pre className="bg-gray-50 rounded p-2 text-xs mt-1 overflow-auto">{EXAMPLE}</pre>
      </details>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            I-94 Travel History <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={10}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste your travel history table here…"
            value={rawText}
            onChange={e => setRawText(e.target.value)}
          />
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>

        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Permanent Resident Approval Date{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={prDate}
            onChange={e => setPrDate(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            If provided, totals will be split into pre-PR and post-PR periods.
          </p>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          Calculate
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify visually in dev server**

```bash
npm run dev
```

Open `http://localhost:5173`. You should see the instructions accordion, the textarea, the PR date field, and the Calculate button. No errors in console.

- [ ] **Step 3: Commit**

```bash
git add src/components/InputPanel.jsx
git commit -m "feat: InputPanel component with instructions accordion"
```

---

## Task 7: SummaryBanner Component

**Files:**
- Create: `src/components/SummaryBanner.jsx`

- [ ] **Step 1: Create SummaryBanner**

Create `src/components/SummaryBanner.jsx`:

```jsx
function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-lg p-4 ${highlight ? 'bg-blue-600 text-white' : 'bg-gray-50 border border-gray-200'}`}>
      <p className={`text-xs uppercase tracking-wide font-medium ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}

export default function SummaryBanner({ totals, stays, entries }) {
  const firstEntry = entries[0]
  const lastEntry  = entries[entries.length - 1]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Days in U.S." value={totals.total.toLocaleString()} highlight />
        <Stat label="Total Stays" value={stays.length} />
        <Stat
          label="Currently in U.S."
          value={totals.currentlyInUS ? 'Yes' : 'No'}
        />
        <Stat
          label="First Recorded Entry"
          value={firstEntry ? firstEntry.date.toISOString().slice(0, 10) : '—'}
        />
      </div>

      {totals.beforePR !== null && (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Days Before PR Approval" value={totals.beforePR.toLocaleString()} />
          <Stat label="Days After PR Approval"  value={totals.afterPR.toLocaleString()} />
        </div>
      )}

      {totals.currentlyInUS && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          Your most recent entry is an <strong>Arrival</strong> with no subsequent Departure recorded. The ongoing stay is counted through today.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SummaryBanner.jsx
git commit -m "feat: SummaryBanner with stat cards and PR split display"
```

---

## Task 8: StaysTable Component

**Files:**
- Create: `src/components/StaysTable.jsx`

- [ ] **Step 1: Create StaysTable**

Create `src/components/StaysTable.jsx`:

```jsx
import { useState } from 'react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(d) {
  return `${d.getFullYear()} ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`
}

export default function StaysTable({ stays, warnings }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        className="w-full flex justify-between items-center px-6 py-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-semibold text-gray-900">Individual Stays ({stays.length})</span>
        <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-3">
          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 space-y-1">
              <p className="font-medium">Data warnings — review your travel history:</p>
              {warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Arrival</th>
                  <th className="pb-2 pr-4">Departure</th>
                  <th className="pb-2 pr-4">Days</th>
                  <th className="pb-2 pr-4">Port</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {stays.map((stay, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 text-gray-400">{stays.length - i}</td>
                    <td className="py-2 pr-4 font-mono text-gray-900">{fmtDate(stay.arrival)}</td>
                    <td className="py-2 pr-4 font-mono text-gray-900">
                      {stay.isOngoing ? <span className="text-amber-600">today</span> : fmtDate(stay.departure)}
                    </td>
                    <td className="py-2 pr-4 font-semibold text-gray-900">{stay.days}</td>
                    <td className="py-2 pr-4 text-gray-500">{stay.port || '—'}</td>
                    <td className="py-2">
                      {stay.isOngoing
                        ? <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">Ongoing</span>
                        : <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Completed</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StaysTable.jsx
git commit -m "feat: StaysTable with anomaly warnings and collapsible toggle"
```

---

## Task 9: YearBreakdown Component

**Files:**
- Create: `src/components/YearBreakdown.jsx`

- [ ] **Step 1: Create YearBreakdown with bar chart**

Create `src/components/YearBreakdown.jsx`:

```jsx
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'

export default function YearBreakdown({ byYear }) {
  const [open, setOpen] = useState(true)

  const chartData = byYear.map(y => ({
    year: String(y.year),
    'Days in U.S.': y.days,
    'Days Outside': 365 - y.days > 0 ? 365 - y.days : 0,
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        className="w-full flex justify-between items-center px-6 py-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-semibold text-gray-900">Year-by-Year Breakdown</span>
        <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-6">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Days in U.S." stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Days Outside" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide text-left">
                <th className="pb-2 pr-4">Year</th>
                <th className="pb-2 pr-4">Days in U.S.</th>
                <th className="pb-2 pr-4">Stays</th>
                <th className="pb-2">% of Year</th>
              </tr>
            </thead>
            <tbody>
              {byYear.map(y => (
                <tr key={y.year} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4 font-medium text-gray-900">{y.year}</td>
                  <td className="py-2 pr-4 font-semibold text-gray-900">{y.days}</td>
                  <td className="py-2 pr-4 text-gray-500">{y.stays}</td>
                  <td className="py-2 text-gray-500">{Math.round(y.days / 365 * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/YearBreakdown.jsx
git commit -m "feat: YearBreakdown with stacked bar chart and summary table"
```

---

## Task 10: MonthBreakdown Component

**Files:**
- Create: `src/components/MonthBreakdown.jsx`

- [ ] **Step 1: Create MonthBreakdown**

Create `src/components/MonthBreakdown.jsx`:

```jsx
import { useState } from 'react'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function MonthBreakdown({ byMonth }) {
  const [openYears, setOpenYears] = useState({})
  const [showAll, setShowAll] = useState(false)

  const years = [...new Set(byMonth.map(m => m.year))].sort((a, b) => b - a)
  const displayYears = showAll ? years : years.slice(0, 3)

  function toggle(year) {
    setOpenYears(prev => ({ ...prev, [year]: !prev[year] }))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <span className="font-semibold text-gray-900">Month-by-Month Breakdown</span>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-3">
        {displayYears.map(year => {
          const months = byMonth.filter(m => m.year === year)
          const yearTotal = months.reduce((s, m) => s + m.days, 0)
          const isOpen = openYears[year] ?? year === years[0]

          return (
            <div key={year} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
                onClick={() => toggle(year)}
              >
                <span className="font-medium text-gray-900">{year}</span>
                <span className="text-sm text-gray-500">
                  {yearTotal} days · {months.length} months with presence {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {isOpen && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide text-left">
                      <th className="pb-2 pt-3 px-4 pr-4">Month</th>
                      <th className="pb-2 pt-3 px-4">Days in U.S.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                      const record = months.find(r => r.month === m)
                      return (
                        <tr key={m} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 px-4 text-gray-700">{MONTH_NAMES[m - 1]}</td>
                          <td className="py-2 px-4">
                            {record
                              ? <span className="font-semibold text-gray-900">{record.days}</span>
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}

        {years.length > 3 && (
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setShowAll(v => !v)}
          >
            {showAll ? 'Show fewer years' : `Show all ${years.length} years`}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MonthBreakdown.jsx
git commit -m "feat: MonthBreakdown accordion grouped by year"
```

---

## Task 11: CustomRange Component

**Files:**
- Create: `src/components/CustomRange.jsx`

- [ ] **Step 1: Create CustomRange**

Create `src/components/CustomRange.jsx`:

```jsx
import { useState } from 'react'
import { computeForRange } from '../utils/calculator'

export default function CustomRange({ stays }) {
  const [start, setStart] = useState('')
  const [end,   setEnd]   = useState('')
  const [result, setResult] = useState(null)
  const [error,  setError]  = useState('')

  function calculate() {
    if (!start || !end) {
      setError('Please select both a start and end date.')
      return
    }
    const s = new Date(start + 'T12:00:00')
    const e = new Date(end   + 'T12:00:00')
    if (s > e) {
      setError('Start date must be before end date.')
      return
    }
    setError('')
    const days = computeForRange(stays, s, e)
    const rangeLength = Math.floor((e - s) / 86400000) + 1
    setResult({ days, rangeLength, pct: Math.round(days / rangeLength * 100) })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Custom Date Range</h3>
      <p className="text-sm text-gray-500">
        Calculate how many days you were present in the U.S. within any specific window.
      </p>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input
            type="date"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={start}
            onChange={e => setStart(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input
            type="date"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={end}
            onChange={e => setEnd(e.target.value)}
          />
        </div>
        <button
          onClick={calculate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Calculate
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {result !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4">
          <p className="text-blue-900 font-semibold text-lg">
            {result.days} day{result.days !== 1 ? 's' : ''} in the U.S.
          </p>
          <p className="text-blue-700 text-sm mt-1">
            Out of {result.rangeLength} total days in range — {result.pct}% presence.
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CustomRange.jsx
git commit -m "feat: CustomRange date picker with presence percentage"
```

---

## Task 12: BonusPanel Component

**Files:**
- Create: `src/components/BonusPanel.jsx`

- [ ] **Step 1: Create BonusPanel**

Create `src/components/BonusPanel.jsx`:

```jsx
import { useState } from 'react'
import { computeSPT, computeAbsences, computeLongestStay } from '../utils/calculator'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(d) {
  return `${d.getFullYear()} ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`
}

export default function BonusPanel({ stays }) {
  const currentYear = new Date().getFullYear()
  const [sptYear, setSptYear] = useState(String(currentYear))
  const spt = computeSPT(stays, parseInt(sptYear))
  const absences = computeAbsences(stays)
  const longest = computeLongestStay(stays)

  const years = Array.from(
    new Set(stays.flatMap(s => {
      const y = []
      for (let yr = s.arrival.getFullYear(); yr <= s.departure.getFullYear(); yr++) y.push(yr)
      return y
    }))
  ).sort((a, b) => b - a)

  return (
    <div className="space-y-4">
      {/* IRS Substantial Presence Test */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">IRS Substantial Presence Estimate</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Score = days(year) + ⌊days(year−1) ÷ 3⌋ + ⌊days(year−2) ÷ 6⌋. Score ≥ 183 may indicate resident alien tax status.
            </p>
          </div>
          <select
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sptYear}
            onChange={e => setSptYear(e.target.value)}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Days in {spt.year}</p>
            <p className="font-bold text-gray-900 text-lg">{spt.daysY}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">⅓ of days in {spt.year - 1}</p>
            <p className="font-bold text-gray-900 text-lg">{Math.floor(spt.daysY1 / 3)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">⅙ of days in {spt.year - 2}</p>
            <p className="font-bold text-gray-900 text-lg">{Math.floor(spt.daysY2 / 6)}</p>
          </div>
          <div className={`rounded-lg p-3 ${spt.isResident ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <p className="text-xs text-gray-500">SPT Score</p>
            <p className={`font-bold text-lg ${spt.isResident ? 'text-orange-700' : 'text-green-700'}`}>
              {spt.score}
            </p>
          </div>
        </div>

        <p className={`text-sm rounded-lg px-4 py-2 ${spt.isResident ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'}`}>
          {spt.isResident
            ? `SPT score of ${spt.score} meets the 183-day threshold. You may qualify as a resident alien for U.S. tax purposes in ${spt.year}. Consult a tax professional to confirm.`
            : `SPT score of ${spt.score} is below 183. You likely do not meet substantial presence for ${spt.year} based on this data alone.`
          }
        </p>

        <p className="text-xs text-gray-400">
          This is an estimate only. Exempt days, treaty positions, and other factors may apply. Consult a licensed tax advisor before making filing decisions.
        </p>
      </div>

      {/* Longest stay / absences */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Notable Periods</h3>

        {longest && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-2xl">🏆</span>
            <div className="text-sm">
              <p className="font-medium text-blue-900">Longest single stay</p>
              <p className="text-blue-700">
                {fmtDate(longest.arrival)} → {longest.isOngoing ? 'today' : fmtDate(longest.departure)} — <strong>{longest.days} days</strong>
              </p>
            </div>
          </div>
        )}

        {absences.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Longest absences from U.S.</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide text-left">
                  <th className="pb-2 pr-4">Departed</th>
                  <th className="pb-2 pr-4">Returned</th>
                  <th className="pb-2 pr-4">Days Away</th>
                  <th className="pb-2">Flag</th>
                </tr>
              </thead>
              <tbody>
                {absences.slice(0, 10).map((a, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 font-mono text-gray-700">{fmtDate(a.start)}</td>
                    <td className="py-2 pr-4 font-mono text-gray-700">{fmtDate(a.end)}</td>
                    <td className="py-2 pr-4 font-semibold text-gray-900">{a.days}</td>
                    <td className="py-2">
                      {a.days > 365
                        ? <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Breaks continuous residence</span>
                        : a.days > 180
                        ? <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">May interrupt continuous residence</span>
                        : null
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BonusPanel.jsx
git commit -m "feat: BonusPanel with SPT calculator and absence table"
```

---

## Task 13: ExportButton Component

**Files:**
- Create: `src/components/ExportButton.jsx`

- [ ] **Step 1: Create ExportButton**

Create `src/components/ExportButton.jsx`:

```jsx
import { buildCSV, downloadCSV } from '../utils/exporter'

export default function ExportButton({ stays, byYear, byMonth }) {
  function handleExport() {
    const csv = buildCSV({ stays, byYear, byMonth })
    const today = new Date().toISOString().slice(0, 10)
    downloadCSV(csv, `i94_presence_${today}.csv`)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Export CSV
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ExportButton.jsx
git commit -m "feat: ExportButton triggers CSV download"
```

---

## Task 14: Assemble I94Calculator Root Component

**Files:**
- Create: `src/components/I94Calculator.jsx`

- [ ] **Step 1: Create I94Calculator**

Create `src/components/I94Calculator.jsx`:

```jsx
import { useState } from 'react'
import { parseI94Text } from '../utils/parser'
import {
  buildStays, computeTotals,
  computeByYear, computeByMonth,
} from '../utils/calculator'

import InputPanel      from './InputPanel'
import SummaryBanner   from './SummaryBanner'
import StaysTable      from './StaysTable'
import YearBreakdown   from './YearBreakdown'
import MonthBreakdown  from './MonthBreakdown'
import CustomRange     from './CustomRange'
import BonusPanel      from './BonusPanel'
import ExportButton    from './ExportButton'

export default function I94Calculator() {
  const [results, setResults] = useState(null)

  function handleCalculate({ rawText, prDate }) {
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    const { entries, warnings, error } = parseI94Text(rawText)

    if (error) {
      setResults({ error })
      return
    }

    const prDateObj = prDate ? new Date(prDate + 'T12:00:00') : null
    const stays   = buildStays(entries, today)
    const totals  = computeTotals(stays, prDateObj)
    const byYear  = computeByYear(stays)
    const byMonth = computeByMonth(stays)

    setResults({ entries, stays, totals, byYear, byMonth, warnings, error: null })
  }

  return (
    <div className="space-y-6">
      <InputPanel onCalculate={handleCalculate} />

      {results?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-800 text-sm">
          <strong>Could not parse input:</strong> {results.error}
        </div>
      )}

      {results && !results.error && (
        <>
          <SummaryBanner
            totals={results.totals}
            stays={results.stays}
            entries={results.entries}
          />

          <div className="flex justify-end">
            <ExportButton
              stays={results.stays}
              byYear={results.byYear}
              byMonth={results.byMonth}
            />
          </div>

          <StaysTable stays={results.stays} warnings={results.warnings} />
          <YearBreakdown byYear={results.byYear} />
          <MonthBreakdown byMonth={results.byMonth} />
          <CustomRange stays={results.stays} />
          <BonusPanel stays={results.stays} />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify full app in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Paste the sample I-94 data:

```
1    2025-12-14    Departure    NYC
2    2025-12-05    Arrival    NYC
3    2025-11-23    Departure    NYC
4    2025-11-19    Arrival    DMA
5    2025-11-09    Departure    NYC
6    2025-11-05    Arrival    DMA
7    2025-10-15    Departure    LOS
8    2025-10-02    Arrival    DMA
9    2025-09-06    Departure    NYC
10    2025-08-30    Arrival    LOS
11    2025-05-18    Departure    SEA
12    2025-03-18    Arrival    VCV
13    2025-03-11    Departure    NYC
14    2025-01-13    Arrival    BOS
15    2025-01-05    Departure    DMA
16    2024-08-27    Arrival    SFR
17    2024-06-10    Departure    BOS
18    2023-09-01    Arrival    BOS
19    2023-05-23    Departure    BOS
20    2023-01-13    Arrival    BOS
21    2023-01-08    Departure    BOS
22    2021-08-10    Arrival    DAL
23    2020-09-11    Departure    DMA
24    2020-01-04    Arrival    DAL
25    2019-12-13    Departure    DAL
26    2019-08-13    Arrival    ATL
```

Expected: Summary banner appears, 13 stays listed, year/month breakdowns rendered, no console errors.

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/I94Calculator.jsx
git commit -m "feat: assemble full I94Calculator root component"
```

---

## Task 15: GitHub Pages Deploy Configuration

**Files:**
- Modify: `vite.config.js`
- Modify: `package.json`
- Create: `.github/workflows/deploy.yml` (optional CI)

- [ ] **Step 1: Add .env support for base path**

Create `.env.example`:

```
# Set this to /your-repo-name/ when deploying to GitHub Pages under a repo path
# Leave empty (or /) for root deployment or custom domain
VITE_BASE_PATH=/
```

- [ ] **Step 2: Add GitHub Actions workflow for auto-deploy**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          VITE_BASE_PATH: ${{ vars.VITE_BASE_PATH || '/' }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 3: Manual deploy option**

In `package.json`, the `deploy` script is already set from Task 1. To deploy manually:

```bash
VITE_BASE_PATH=/your-repo-name/ npm run build
npm run deploy
```

For a custom domain (e.g. `tools.yourdomain.com`):

```bash
VITE_BASE_PATH=/ npm run build
npm run deploy
```

Then in GitHub repo Settings → Pages, set a custom domain and add a `CNAME` file to `public/CNAME` with your domain.

- [ ] **Step 4: Test the build locally**

```bash
npm run build && npm run preview
```

Expected: App loads at `http://localhost:4173` with no 404s on assets.

- [ ] **Step 5: Commit**

```bash
git add .env.example .github/workflows/deploy.yml
git commit -m "feat: GitHub Pages deploy workflow with configurable base path"
```

---

## Task 16: Embed Mode and Exportable Component

**Files:**
- Modify: `src/App.jsx` (already done in Task 1)
- Create: `src/index.js` (component library entry point)

- [ ] **Step 1: Create library entry point for future embedding**

Create `src/index.js`:

```js
export { default as I94Calculator } from './components/I94Calculator'
```

- [ ] **Step 2: Add library build target to vite.config.js**

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  ...(mode === 'lib' ? {
    build: {
      lib: {
        entry: 'src/index.js',
        name: 'I94Calculator',
        fileName: 'i94-calculator',
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: { globals: { react: 'React', 'react-dom': 'ReactDOM' } },
      },
    },
  } : {}),
}))
```

Add to `package.json` scripts:

```json
"build:lib": "MODE=lib vite build"
```

- [ ] **Step 3: Verify embed mode**

```bash
npm run dev
```

Open `http://localhost:5173?embed=true` — header and footer should not be visible, just the calculator.

- [ ] **Step 4: Commit**

```bash
git add src/index.js vite.config.js package.json
git commit -m "feat: library entry point and embed mode for future component reuse"
```

---

## Self-Review Checklist

**Spec coverage:**

| Requirement | Task |
|---|---|
| Parse I-94 pasted text | Task 2 |
| Ongoing stay detection (last entry = Arrival) | Task 3 |
| Total days | Task 3 |
| Pre/post PR split | Task 3 |
| Per-stay breakdown | Task 8 |
| Days by year | Task 4, 9 |
| Days by month | Task 4, 10 |
| Custom date range | Task 4, 11 |
| IRS SPT estimate | Task 4, 12 |
| Longest stay / absence flags | Task 4, 12 |
| CSV export | Task 5, 13 |
| Usage instructions | Task 6 |
| Disclaimer | Task 1 (App.jsx footer) |
| GitHub Pages deploy | Task 15 |
| Embed mode / component export | Task 16 |
| Anomaly warnings | Task 2, 8 |
| Bar chart (yearly) | Task 9 |
| Month accordion | Task 10 |
| No data transmitted (privacy) | All — pure client-side |

All requirements covered. No gaps identified.
