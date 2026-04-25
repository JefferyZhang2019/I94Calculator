import { describe, it, expect } from 'vitest'
import {
  buildStays, computeTotals,
  computeByYear, computeByMonth, computeForRange,
  computeSPT, computeAbsences, computeLongestStay,
} from './calculator'

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

  it('skips a leading Departure with no preceding Arrival', () => {
    const entries = [
      { date: d('2025-01-01'), type: 'Departure', port: 'NYC' },
      { date: d('2025-06-01'), type: 'Arrival',   port: 'NYC' },
      { date: d('2025-06-30'), type: 'Departure', port: 'NYC' },
    ]
    const stays = buildStays(entries, d('2026-04-25'))
    // First Departure is ignored; only the Arrival→Departure pair is counted
    expect(stays).toHaveLength(1)
    expect(stays[0].arrival.toISOString().slice(0, 10)).toBe('2025-06-01')
    expect(stays[0].days).toBe(30)
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

  it('PR date itself is counted as after-PR', () => {
    // Arrival and PR approval on the same day — that day is after-PR
    const entries = [
      { date: d('2025-06-01'), type: 'Arrival',   port: 'NYC' },
      { date: d('2025-06-30'), type: 'Departure', port: 'NYC' },
    ]
    const today = d('2026-04-25')
    const stays = buildStays(entries, today)
    const totals = computeTotals(stays, d('2025-06-01'))
    // All 30 days (Jun 1–30) should be after-PR because prDate = arrival date
    expect(totals.beforePR).toBe(0)
    expect(totals.afterPR).toBe(30)
    expect(totals.total).toBe(30)
  })
})

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
    // 200 days in target year → score = 200 → resident
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

  it('returns null for empty stays array', () => {
    expect(computeLongestStay([])).toBeNull()
  })
})
