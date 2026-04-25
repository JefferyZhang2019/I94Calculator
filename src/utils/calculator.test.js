import { describe, it, expect } from 'vitest'
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
