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
  const prDateStart = startOfDay(prDate)

  for (const stay of stays) {
    const days = eachDayOfInterval({ start: stay.arrival, end: stay.departure })
    for (const day of days) {
      if (isBefore(day, prDateStart)) {
        beforePR++
      } else {
        afterPR++
      }
    }
  }

  return { total, beforePR, afterPR, currentlyInUS }
}
