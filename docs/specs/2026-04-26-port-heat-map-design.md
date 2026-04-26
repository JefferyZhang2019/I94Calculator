# Port Heat Map — Design Spec

**Date:** 2026-04-26
**Feature:** Heat glow map of US ports of entry/exit under the Analysis tab

---

## Overview

Add a "Port Heat Map" accordion to the Analysis tab. It plots a user's I-94 ports of entry and exit on a US map using heat glow circles, with frequency-based color coding (green → red). A ranked port list sits alongside the map.

---

## Data Layer

### `computePortStats(stays, mode)` — added to `src/utils/calculator.js`

**Parameters:**
- `stays` — the existing `Stay[]` array (each stay has `port` and `exitPort` strings)
- `mode` — `'all' | 'entry' | 'exit'`

**Behavior:**
- `'entry'`: collects `stay.port` for all stays
- `'exit'`: collects `stay.exitPort`, skipping empty strings (ongoing stays have no exit)
- `'all'`: collects both `stay.port` and `stay.exitPort`, skipping empty strings

Groups by port name (case-sensitive key from raw data), counts occurrences, then looks up each port in `portCoordinates.js`.

**Returns:** `Array<{ port: string, count: number, lat: number | null, lng: number | null, matched: boolean }>` sorted by `count` descending.

---

### `src/utils/portCoordinates.js`

Hardcoded lookup map: normalized port name (lowercase, punctuation stripped) → `{ lat, lng }`.

**Coverage:** ~300 US ports of entry — international airports, land border crossings (Canada and Mexico), and major seaports.

**Matching strategy (tried in order):**
1. Exact match on normalized name
2. Substring match (port name contains the lookup key or vice versa)
3. First-token match (match on first significant word)

If no match: `matched: false`, `lat: null`, `lng: null`.

---

## Component

### `src/components/PortHeatMap.jsx`

**Layout:** Two-column flex row.
- Left (~65%): US map
- Right (~35%): ranked port list

**Toggle:** 3-segment button group above the full width — "All" | "Entry" | "Exit". Default: "All". Calls `computePortStats(stays, mode)` on change.

#### Map (left column)

- Library: `react-simple-maps`
- `ComposableMap` with `Geographies` rendering US state outlines from `https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json`
- Each matched port renders as 3 concentric SVG circles at its projected lat/lng:
  - Outer ring: `r = base * 3`, opacity `0.15`
  - Mid ring: `r = base * 2`, opacity `0.25`
  - Inner dot: `r = base`, opacity `0.70`
  - `base` scales with count (min 5px, max 18px)
- On hover: tooltip showing port name + visit count
- Empty state (no matched ports): state outlines still render; brief message shown below map

#### Color scale

Normalize `t = count / maxCount` (0–1), interpolate through 4 stops:

| Range | Color | Hex |
|---|---|---|
| `t < 0.33` | Green | `#22c55e` |
| `t < 0.66` | Yellow | `#eab308` |
| `t < 0.85` | Orange | `#f97316` |
| `t ≥ 0.85` | Red | `#ef4444` |

All three rings use the same color; only opacity varies.

#### Ranked list (right column)

- Scrollable list, all ports sorted by count descending
- Each row: colored dot (same color scale) + port name + count
- Matched ports listed first, sorted by count descending within that group
- Unmatched ports (no map coordinates) grouped at bottom under a "Not on map" faint divider, also sorted by count descending within that group
- Empty string ports are never listed

#### Integration

- New `<Accordion title={t('portHeatMapTitle')}>` added to `AnalysisTab.jsx` after the Visit Summary accordion
- `stays` prop passed directly (already available in `AnalysisTab`)
- New i18n strings in `src/i18n/strings.js`:
  - `portHeatMapTitle` — accordion title
  - `portHeatMapAll`, `portHeatMapEntry`, `portHeatMapExit` — toggle labels
  - `portHeatMapTooltip` — tooltip format string `"{port} — {count} visit(s)"`
  - `portHeatMapNotOnMap` — divider label for unmatched ports
  - `portHeatMapEmpty` — message when no port data exists

---

## Dependencies

- **Add:** `react-simple-maps` to `dependencies` in `package.json`
- **Runtime fetch:** US state TopoJSON from `cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json` (cached by browser after first load)

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Empty `port` / `exitPort` string | Silently skipped — not counted, not listed |
| Ongoing stay (no `exitPort`) | Entry port counted for "All" and "Entry"; exit skipped for "Exit" |
| All ports unmatched | Map renders US outline only; all ports appear in "Not on map" section |
| Single port, count = 1 | `t = 1.0`, renders red — still clearly visible |
| No stays at all | Empty state message shown, map and list hidden |

---

## File Summary

| File | Change |
|---|---|
| `src/utils/portCoordinates.js` | New — ~300-port lookup table |
| `src/utils/calculator.js` | Add `computePortStats()` |
| `src/components/PortHeatMap.jsx` | New component |
| `src/components/AnalysisTab.jsx` | Add Port Heat Map accordion |
| `src/i18n/strings.js` | Add new string keys |
| `package.json` | Add `react-simple-maps` dependency |
