const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/**
 * Builds a CSV string from calculation results.
 * @param {{ stays: Array, byYear: Array, byMonth: Array }} data
 * @returns {string} CSV content with \r\n line endings
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
