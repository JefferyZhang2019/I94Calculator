# I-94 Calculator — Phase 2 Improvements Design

## Overview

Five targeted improvements to the existing I-94 U.S. Presence Calculator:

1. Replace example format in InputPanel (original fictitious data, not copied)
2. Full visual redesign — Design A (Dark Hero Dashboard), wider layout, better typography
3. Additional statistics: continuous residence, 5-year rolling window, averages, next milestone
4. Multi-language support: English + Simplified Chinese, built-in strings (no API)
5. SPT year dropdown fix: range from earliest data year through current year

---

## 1. App Shell & Layout

### Header

Full-width dark gradient header (`from-[#1e3a5f] to-[#2563eb]`):
- Left: App title + subtitle ("Physical presence tracker · Data stays in your browser")
- Right: Language toggle buttons (EN / 中文)
- Bottom of header: four Tab buttons — Overview / Stays / By Year / Analysis

Active tab style: white background, dark text pill.
Inactive tab style: semi-transparent white text.

### Content Area

`max-w-7xl mx-auto px-4 py-6` — significantly wider than current `max-w-4xl`.

Footer retained with disclaimer text (bilingual).

### Navigation Behavior

- Default state (no data): open to **Stays** tab, input panel visible and prominent
- After Calculate: automatically switch to **Overview** tab
- Tab state: `useState` in App or I94Calculator root component

---

## 2. Tab Content

### Overview Tab

**Row 1 — 4 stat cards** (same as mockup):
- Total Days in U.S.
- Number of Visits (stays)
- Currently in U.S. (Yes/No, green/gray)
- First Visit Year

**Row 1b — Pre/Post PR split** (only shown when user provided a PR approval date):
- Days before PR approval | Days after PR approval — shown as a secondary row beneath the 4 main cards

**Row 2 — Two side-by-side panels:**

*Continuous Residence Status*
Based on the longest single absence since the first arrival. Shows:
- 🟢 No qualifying absences (all gaps < 180 days)
- 🟡 Longest absence ≥ 180 days — may interrupt continuous residence
- 🔴 Longest absence ≥ 365 days — continuous residence likely interrupted

*Naturalization Milestone*
- Shows days accumulated in rolling past-5-year window
- Target: 913 days (standard naturalization threshold)
- If met: "✓ 5-year threshold met"
- If not: "Need X more days in last 5 years"

**Row 3 — Year progress bars**
Horizontal bar per year showing days/365. Click any bar to jump to By Year tab.

---

### Stays Tab

- InputPanel at top (with new example format)
- StaysTable below (hidden until data calculated)
- Export CSV button adjacent to StaysTable header

---

### By Year Tab

- YearBreakdown bar chart (existing, unchanged)
- MonthBreakdown (existing, unchanged)

---

### Analysis Tab

Five accordion sections, each with a header that toggles open/closed:

```
▼ IRS Substantial Presence Estimate  [default: open]
  └ Year dropdown (fixed range: min data year → max(current year, max data year))
  └ 4 breakdown cells (days Y, ⅓ of Y-1, ⅙ of Y-2, SPT score)
  └ Result banner (resident/non-resident)
  └ Disclaimer note

▼ Residence Continuity               [default: open]
  └ Longest single stay (highlighted card)
  └ Absence table (up to 10, with 180d/365d risk flags)

▼ 5-Year Rolling Window              [default: open]
  └ Table: Year | Days in rolling 5-year window
  └ Threshold indicator (913 days)

▼ Custom Date Range                  [default: open]
  └ Start date / End date inputs
  └ Days in U.S. within that range
  └ (existing CustomRange component, unchanged logic)

▼ Visit Summary                      [default: collapsed]
  └ Average visit duration (days)
  └ Average gap between visits (days)
  └ Shortest stay / Longest stay
  └ Total visit count
```

---

## 3. New Statistics

### Continuous Residence Status

Computed from `computeAbsences(stays)` output (already exists). Find the longest absence:
- < 180 days → green
- 180–364 days → amber
- ≥ 365 days → red

Display in Overview and expanded in Analysis → Residence Continuity.

### 5-Year Rolling Window

For each year Y from min to current year:
- Count days in stays that fall within [Jan 1 of Y-4, Dec 31 of Y]
- Compare against 913-day naturalization threshold

New function: `computeRolling5Year(stays, currentYear)` → array of `{ year, days, meetsThreshold }`

### Visit Averages

New function: `computeVisitStats(stays)` → `{ avgDuration, avgGap, minDuration, maxDuration, count }`

- `avgDuration`: mean of `stay.days` across all stays
- `avgGap`: mean of gap (days between departure of stay N and arrival of stay N+1), only between consecutive stays, excluding ongoing stay if present

### Naturalization Milestone

Derived from the most recent 5-year rolling window entry:
- `daysInLast5Years = computeRolling5Year(stays, currentYear).find(r => r.year === currentYear).days`
- `remaining = Math.max(0, 913 - daysInLast5Years)`

---

## 4. Multi-Language System

### Files

```
src/
  i18n/
    strings.js       ← all UI text, keyed by language
    LangContext.jsx  ← React context, useLang() hook
```

### strings.js Shape

```js
export const strings = {
  en: { appTitle: 'I-94 U.S. Presence Calculator', ... },
  zh: { appTitle: 'I-94 美国居留天数计算器', ... }
}
```

### LangContext.jsx

```js
export const LangContext = createContext()

export function LangProvider({ children }) {
  const defaultLang = navigator.language.startsWith('zh') ? 'zh' : 'en'
  const [lang, setLang] = useState(
    () => localStorage.getItem('i94-lang') || defaultLang
  )
  const t = key => strings[lang][key] ?? key
  const switchLang = l => { setLang(l); localStorage.setItem('i94-lang', l) }
  return <LangContext.Provider value={{ lang, t, switchLang }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
```

### Date Formatting

A `fmtDate(date, lang)` utility:
- `en`: `Dec 5, 2025`
- `zh`: `2025年12月5日`

### Scope

All user-visible strings: labels, buttons, error messages, placeholders, disclaimers, section headings, stat card titles, flag text (risk labels), tooltip text.

Calculation results (numbers, years) are language-neutral.

---

## 5. Remaining Specific Fixes

### New Example Format (InputPanel)

Replace the existing `EXAMPLE` constant with fictitious data using major US ports (JFK, LAX, ORD, SFO, MIA), years 2023–2025:

```
1	2025-03-15	Arrival	JFK
2	2025-01-08	Departure	LAX
3	2024-11-22	Arrival	ORD
4	2024-09-04	Departure	SFO
5	2024-09-03	Arrival	MIA
6	2024-06-17	Departure	JFK
7	2023-12-28	Arrival	LAX
8	2023-08-10	Departure	ORD
```

### SPT Year Dropdown Fix (BonusPanel)

```js
const currentYear = new Date().getFullYear()
const dataYears = stays.flatMap(s => {
  const y = []
  for (let yr = s.arrival.getFullYear(); yr <= s.departure.getFullYear(); yr++) y.push(yr)
  return y
})
const minYear = Math.min(...dataYears)
const maxYear = Math.max(currentYear, Math.max(...dataYears))
const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)
```

Current year (2026) always appears even when no 2026 data exists.

---

## 6. File Structure Changes

**New files:**
- `src/i18n/strings.js`
- `src/i18n/LangContext.jsx`
- `src/utils/calculator.js` — add `computeRolling5Year`, `computeVisitStats`

**Modified files:**
- `src/App.jsx` — new header, tab navigation, LangProvider wrapper
- `src/components/I94Calculator.jsx` — tab state, auto-switch to Overview on calculate
- `src/components/InputPanel.jsx` — new example, bilingual labels
- `src/components/BonusPanel.jsx` — SPT year fix, accordion structure, bilingual, new stats sections
- `src/components/SummaryBanner.jsx` — bilingual, wider layout
- `src/components/StaysTable.jsx` — bilingual
- `src/components/YearBreakdown.jsx` — bilingual
- `src/components/MonthBreakdown.jsx` — bilingual
- `src/components/ExportButton.jsx` — bilingual

**New components:**
- `src/components/OverviewTab.jsx` — stat cards, pre/post PR row, continuous residence panel, milestone panel, year bars
- `src/components/AnalysisTab.jsx` — accordion wrapper containing BonusPanel sections, CustomRange, and new stats

**Removed from I94Calculator.jsx direct render:**
- SummaryBanner, ExportButton, StaysTable → moved to Stays tab
- YearBreakdown, MonthBreakdown → moved to By Year tab
- BonusPanel, CustomRange → moved to AnalysisTab
- SummaryBanner stat cards → moved to OverviewTab

---

## 7. Out of Scope

- No backend, no API calls
- No third-party i18n library
- No languages beyond EN and Simplified Chinese
- No route changes (single-page app)
- No changes to parser.js, exporter.js
- No changes to existing test files (new functions will get new tests)
