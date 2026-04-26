import {
  differenceInCalendarDays,
  eachDayOfInterval,
  isBefore,
  startOfDay,
} from 'date-fns'

/**
 * Converts sorted Entry[] into Stay[].
 * @param {Array<{date: Date, type: string, port: string}>} entries - sorted oldest first
 * @param {Date} today
 * @returns {Array<{arrival: Date, departure: Date, days: number, port: string, exitPort: string, isOngoing: boolean}>}
 */
export function buildStays(entries, today) {
  const stays = []
  let currentArrival = null
  let currentPort = ''

  for (const entry of entries) {
    if (entry.type === 'Arrival') {
      currentArrival = entry.date
      currentPort = entry.port
    // Departure with no preceding Arrival is skipped — the parser
    // already flags consecutive/leading Departure events as warnings.
    } else if (entry.type === 'Departure' && currentArrival) {
      stays.push({
        arrival: currentArrival,
        departure: entry.date,
        days: differenceInCalendarDays(entry.date, currentArrival) + 1,
        port: currentPort,
        exitPort: entry.port,
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
      exitPort: '',
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
  const prDateStart = startOfDay(prDate)

  for (const stay of stays) {
    // Re-enumerate each day to classify before/after PR date.
    // This intentionally re-derives rather than using s.days so that
    // PR date splits are always based on actual calendar days.
    const days = eachDayOfInterval({ start: stay.arrival, end: stay.departure })
    for (const day of days) {
      if (isBefore(day, prDateStart)) {
        beforePR++
      } else {
        afterPR++ // PR date itself and all later days count as after-PR
      }
    }
  }

  return { total, beforePR, afterPR, currentlyInUS }
}

/**
 * Distributes stay days across calendar years.
 * @param {Array} stays
 * @returns {Array<{year: number, days: number, stays: number}>}
 */
export function computeByYear(stays) {
  const map = new Map()
  for (const stay of stays) {
    const days = eachDayOfInterval({ start: stay.arrival, end: stay.departure })
    const yearsInStay = new Set()
    for (const day of days) {
      const y = day.getFullYear()
      const prev = map.get(y) || { year: y, days: 0, stays: 0 }
      map.set(y, { ...prev, days: prev.days + 1 })
      yearsInStay.add(y)
    }
    // Count this stay once per calendar year it spans
    yearsInStay.forEach(y => {
      const prev = map.get(y) || { year: y, days: 0, stays: 0 }
      map.set(y, { ...prev, stays: prev.stays + 1 })
    })
  }
  return Array.from(map.values()).sort((a, b) => a.year - b.year)
}

/**
 * Distributes stay days across calendar months.
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
 * Counts days in US during a specific date range.
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
 * Score = days(year) + floor(days(year-1) / 3) + floor(days(year-2) / 6).
 * Score >= 183 indicates likely resident alien tax status.
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
 * Returns gaps between consecutive stays, sorted by duration (longest first).
 * @param {Array} stays
 * @returns {Array<{start: Date, end: Date, days: number}>}
 */
export function computeAbsences(stays) {
  const absences = []
  for (let i = 1; i < stays.length; i++) {
    const gapStart = stays[i - 1].departure
    const gapEnd   = stays[i].arrival
    // Gap days = days between departure and next arrival, exclusive of both endpoints
    const days = differenceInCalendarDays(gapEnd, gapStart) - 1
    if (days > 0) {
      absences.push({ start: gapStart, end: gapEnd, days })
    }
  }
  return absences.sort((a, b) => b.days - a.days)
}

/**
 * @param {Array} stays
 * @returns {Stay | null}
 */
export function computeLongestStay(stays) {
  if (stays.length === 0) return null
  return stays.reduce((best, s) => (s.days > best.days ? s : best), stays[0])
}

/**
 * For each year from first arrival year through currentYear,
 * counts days in the rolling 5-year window [Jan 1 of (year-4), Dec 31 of year].
 * @param {Array} stays
 * @param {number} currentYear
 * @returns {Array<{year: number, days: number, meetsThreshold: boolean}>}
 */
export function computeRolling5Year(stays, currentYear) {
  if (stays.length === 0) return []
  const minYear = stays[0].arrival.getFullYear()
  const results = []
  for (let y = minYear; y <= currentYear; y++) {
    const windowStart = new Date(`${y - 4}-01-01T12:00:00`)
    const windowEnd   = new Date(`${y}-12-31T12:00:00`)
    const days = computeForRange(stays, windowStart, windowEnd)
    results.push({ year: y, days, meetsThreshold: days >= 913 })
  }
  return results
}

/**
 * Computes aggregate visit statistics across all stays.
 * @param {Array} stays
 * @returns {{ avgDuration: number, avgGap: number, minDuration: number, maxDuration: number, count: number }}
 */
export function computeVisitStats(stays) {
  const count = stays.length
  if (count === 0) return { avgDuration: 0, avgGap: 0, minDuration: 0, maxDuration: 0, count: 0 }

  const durations = stays.map(s => s.days)
  const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / count)
  const minDuration = Math.min(...durations)
  const maxDuration = Math.max(...durations)

  // Gap = days strictly between consecutive stays (exclusive of both endpoints).
  // Only count gaps after a completed (non-ongoing) stay.
  const gaps = []
  for (let i = 1; i < stays.length; i++) {
    if (!stays[i - 1].isOngoing) {
      const gap = differenceInCalendarDays(stays[i].arrival, stays[i - 1].departure) - 1
      if (gap >= 0) gaps.push(gap)
    }
  }
  const avgGap = gaps.length > 0
    ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
    : 0

  return { avgDuration, avgGap, minDuration, maxDuration, count }
}
