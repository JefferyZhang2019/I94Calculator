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
