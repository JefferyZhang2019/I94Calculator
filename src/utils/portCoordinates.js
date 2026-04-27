import poeData from '../data/us_poe_enriched.json'

// Primary lookup: FAM POE code (uppercase) → {lat, lng}
const BY_CODE = Object.fromEntries(
  poeData.map(e => [e.fam_poe_code, { lat: e.latitude, lng: e.longitude }])
)

// Secondary lookup: normalized city/name substrings, sorted longest-first for specificity
const BY_NAME = poeData
  .flatMap(e => {
    const coords = { lat: e.latitude, lng: e.longitude }
    const keys = new Set()
    if (e.city) keys.add(normalize(e.city))
    if (e.name) keys.add(normalize(e.name))
    return [...keys].map(key => ({ key, coords }))
  })
  .filter(({ key }) => key.length >= 4)
  .sort((a, b) => b.key.length - a.key.length)

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Looks up coordinates for a port name or FAM POE code.
 * Tries direct code match first, then city/name substring matching.
 * @param {string} portName
 * @returns {{ lat: number, lng: number } | null}
 */
export function lookupPort(portName) {
  if (!portName) return null
  const trimmed = portName.trim()
  if (!trimmed) return null

  // 1. Direct FAM POE code lookup (e.g. "BLA", "NYC", "SEA")
  if (BY_CODE[trimmed.toUpperCase()]) return BY_CODE[trimmed.toUpperCase()]

  // 2. City/name substring lookup for full port name strings
  const n = normalize(trimmed)
  if (!n) return null
  for (const { key, coords } of BY_NAME) {
    if (n.includes(key)) return coords
  }

  return null
}
