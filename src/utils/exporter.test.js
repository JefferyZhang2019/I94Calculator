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

  it('includes monthly summary section', () => {
    const csv = buildCSV({
      stays: [],
      byYear: [],
      byMonth: [{ year: 2024, month: 3, days: 15 }],
    })
    expect(csv).toContain('Year,Month,Days in U.S.')
    expect(csv).toContain('2024,Mar,15')
  })

  it('returns empty sections when no data', () => {
    const csv = buildCSV({ stays: [], byYear: [], byMonth: [] })
    expect(csv).toContain('INDIVIDUAL STAYS')
    expect(csv).toContain('YEARLY SUMMARY')
    expect(csv).toContain('MONTHLY SUMMARY')
  })

  it('quotes port fields containing commas', () => {
    const stays = [{
      arrival: d('2025-01-01'),
      departure: d('2025-01-10'),
      days: 10,
      port: 'Newark, NJ',
      isOngoing: false,
    }]
    const csv = buildCSV({ stays, byYear: [], byMonth: [] })
    expect(csv).toContain('"Newark, NJ"')
  })
})
