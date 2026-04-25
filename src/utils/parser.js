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
    const parts = line.split(/\s{2,}|\t/).map(p => p.trim()).filter(Boolean)
    const typeIndex = parts.findIndex(p => /^(arrival|departure)$/i.test(p))
    const port = typeIndex >= 0 && typeIndex + 1 < parts.length
      ? parts[typeIndex + 1]
      : ''
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
