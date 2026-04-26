import { describe, it, expect } from 'vitest'
import {
  buildStays, computeTotals,
  computeByYear, computeByMonth, computeForRange,
  computeSPT, computeAbsences, computeLongestStay,
  computeRolling5Year, computeVisitStats,
} from './calculator'
import { computePortStats } from './calculator.js'

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

  it('captures exit port from departure entry', () => {
    const entries = [
      { date: d('2024-03-01'), type: 'Arrival',   port: 'JFK' },
      { date: d('2024-03-15'), type: 'Departure', port: 'LAX' },
    ]
    const stays = buildStays(entries, new Date())
    expect(stays[0].port).toBe('JFK')
    expect(stays[0].exitPort).toBe('LAX')
  })

  it('sets exitPort to empty string for ongoing stays', () => {
    const entries = [
      { date: d('2025-12-05'), type: 'Arrival', port: 'ORD' },
    ]
    const stays = buildStays(entries, d('2026-04-26'))
    expect(stays[0].port).toBe('ORD')
    expect(stays[0].exitPort).toBe('')
    expect(stays[0].isOngoing).toBe(true)
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

describe('computeRolling5Year', () => {
  it('returns empty array for empty stays', () => {
    expect(computeRolling5Year([], 2026)).toEqual([])
  })

  it('produces one entry per year from first arrival year through currentYear', () => {
    const entries = [
      { date: d('2023-06-01'), type: 'Arrival',   port: 'JFK' },
      { date: d('2023-08-31'), type: 'Departure', port: 'JFK' },
    ]
    const stays = buildStays(entries, d('2026-04-26'))
    const result = computeRolling5Year(stays, 2026)
    expect(result.map(r => r.year)).toEqual([2023, 2024, 2025, 2026])
  })

  it('counts days within the rolling [Y-4 … Y] window', () => {
    // Full 2023: 365 days
    const entries = [
      { date: d('2023-01-01'), type: 'Arrival',   port: 'JFK' },
      { date: d('2023-12-31'), type: 'Departure', port: 'JFK' },
    ]
    const stays = buildStays(entries, d('2026-04-26'))
    const result = computeRolling5Year(stays, 2026)
    // 2023 window = [2019-01-01 … 2023-12-31] → includes full 2023 stay
    expect(result.find(r => r.year === 2023).days).toBe(365)
    // 2024 window = [2020-01-01 … 2024-12-31] → same 365 days still in window
    expect(result.find(r => r.year === 2024).days).toBe(365)
  })

  it('sets meetsThreshold true when days >= 913', () => {
    // 3 full years 2020–2022 ≈ 1095 days
    const entries = [
      { date: d('2020-01-01'), type: 'Arrival',   port: 'JFK' },
      { date: d('2022-12-31'), type: 'Departure', port: 'JFK' },
    ]
    const stays = buildStays(entries, d('2026-04-26'))
    const result = computeRolling5Year(stays, 2026)
    // 2024 window = [2020-01-01 … 2024-12-31] → 3 years in window
    expect(result.find(r => r.year === 2024).meetsThreshold).toBe(true)
  })

  it('sets meetsThreshold false when days < 913', () => {
    const entries = [
      { date: d('2025-01-01'), type: 'Arrival',   port: 'JFK' },
      { date: d('2025-03-01'), type: 'Departure', port: 'JFK' }, // 60 days
    ]
    const stays = buildStays(entries, d('2026-04-26'))
    const result = computeRolling5Year(stays, 2026)
    expect(result.find(r => r.year === 2026).meetsThreshold).toBe(false)
  })
})

describe('computeVisitStats', () => {
  it('returns zeros for empty stays', () => {
    expect(computeVisitStats([])).toEqual({
      avgDuration: 0, avgGap: 0, minDuration: 0, maxDuration: 0, count: 0,
    })
  })

  it('computes count, avgDuration, minDuration, maxDuration', () => {
    const entries = [
      { date: d('2024-01-01'), type: 'Arrival',   port: 'JFK' },
      { date: d('2024-01-10'), type: 'Departure', port: 'JFK' }, // 10 days
      { date: d('2024-03-01'), type: 'Arrival',   port: 'LAX' },
      { date: d('2024-03-20'), type: 'Departure', port: 'LAX' }, // 20 days
    ]
    const stays = buildStays(entries, d('2026-04-26'))
    const result = computeVisitStats(stays)
    expect(result.count).toBe(2)
    expect(result.avgDuration).toBe(15)  // (10 + 20) / 2
    expect(result.minDuration).toBe(10)
    expect(result.maxDuration).toBe(20)
  })

  it('computes avgGap between consecutive completed stays', () => {
    // differenceInCalendarDays('2024-03-01', '2024-01-10') = 51; gap = 51 - 1 = 50
    const entries = [
      { date: d('2024-01-01'), type: 'Arrival',   port: 'JFK' },
      { date: d('2024-01-10'), type: 'Departure', port: 'JFK' },
      { date: d('2024-03-01'), type: 'Arrival',   port: 'LAX' },
      { date: d('2024-03-20'), type: 'Departure', port: 'LAX' },
    ]
    const stays = buildStays(entries, d('2026-04-26'))
    expect(computeVisitStats(stays).avgGap).toBe(50)
  })

  it('excludes the ongoing stay from gap calculation', () => {
    const entries = [
      { date: d('2024-01-01'), type: 'Arrival',   port: 'JFK' },
      { date: d('2024-01-10'), type: 'Departure', port: 'JFK' }, // 10 days
      { date: d('2024-03-01'), type: 'Arrival',   port: 'LAX' }, // ongoing
    ]
    const stays = buildStays(entries, d('2026-04-26'))
    const result = computeVisitStats(stays)
    expect(result.count).toBe(2)
    // gap = differenceInCalendarDays(2024-03-01, 2024-01-10) - 1 = 50
    expect(result.avgGap).toBe(50)
  })
})

describe('computePortStats', () => {
  const stays = [
    {
      port: 'New York - John F. Kennedy International Airport',
      exitPort: 'Los Angeles International Airport',
      isOngoing: false,
    },
    {
      port: 'New York - John F. Kennedy International Airport',
      exitPort: '',
      isOngoing: true,
    },
    {
      port: 'Los Angeles International Airport',
      exitPort: 'New York - John F. Kennedy International Airport',
      isOngoing: false,
    },
  ]

  it('counts entry ports in entry mode', () => {
    const result = computePortStats(stays, 'entry')
    expect(result[0].port).toBe('New York - John F. Kennedy International Airport')
    expect(result[0].count).toBe(2)
    expect(result[1].port).toBe('Los Angeles International Airport')
    expect(result[1].count).toBe(1)
  })

  it('skips empty exitPort strings in exit mode', () => {
    const result = computePortStats(stays, 'exit')
    expect(result.every(r => r.port !== '')).toBe(true)
  })

  it('counts exit ports correctly in exit mode', () => {
    const result = computePortStats(stays, 'exit')
    const lax = result.find(r => r.port === 'Los Angeles International Airport')
    expect(lax.count).toBe(1)
    const jfk = result.find(r => r.port === 'New York - John F. Kennedy International Airport')
    expect(jfk.count).toBe(1)
  })

  it('counts all ports in all mode', () => {
    const result = computePortStats(stays, 'all')
    const jfk = result.find(r => r.port === 'New York - John F. Kennedy International Airport')
    expect(jfk.count).toBe(3)
    const lax = result.find(r => r.port === 'Los Angeles International Airport')
    expect(lax.count).toBe(2)
  })

  it('returns matched:true and non-null coords for known ports', () => {
    const result = computePortStats(stays, 'entry')
    expect(result[0].matched).toBe(true)
    expect(result[0].lat).not.toBeNull()
    expect(result[0].lng).not.toBeNull()
  })

  it('returns matched:false and null coords for unknown ports', () => {
    const unknownStays = [{ port: 'Zzz Unknown Port XYZ', exitPort: '', isOngoing: false }]
    const result = computePortStats(unknownStays, 'entry')
    expect(result[0].matched).toBe(false)
    expect(result[0].lat).toBeNull()
    expect(result[0].lng).toBeNull()
  })

  it('returns empty array for empty stays', () => {
    expect(computePortStats([], 'all')).toEqual([])
  })

  it('sorts results by count descending', () => {
    const result = computePortStats(stays, 'all')
    for (let i = 1; i < result.length; i++) {
      expect(result[i].count).toBeLessThanOrEqual(result[i - 1].count)
    }
  })
})
