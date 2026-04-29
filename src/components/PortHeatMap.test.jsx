import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LangProvider } from '../i18n/LangContext'
import PortHeatMap from './PortHeatMap'

// Out-of-projection sentinel coordinates (simulating Guam, Puerto Rico, etc.)
const OUT_OF_BOUNDS_LNG = 144.75
const OUT_OF_BOUNDS_LAT = 13.47

vi.mock('react-simple-maps', () => {
  const mockProjection = vi.fn(([lng, lat]) => {
    // Simulate geoAlbersUsa returning null for out-of-bounds coordinates
    if (lng === OUT_OF_BOUNDS_LNG && lat === OUT_OF_BOUNDS_LAT) return null
    return [100, 200]
  })

  return {
    ComposableMap: ({ children }) => <svg data-testid="map">{children}</svg>,
    Geographies: ({ children }) => <>{children({ geographies: [] })}</>,
    Geography: () => null,
    Marker: ({ coordinates, children }) => (
      <g data-testid="marker" data-coords={JSON.stringify(coordinates)}>{children}</g>
    ),
    useMapContext: () => ({ projection: mockProjection }),
  }
})

const makeStay = (port, exitPort = '') => ({
  port,
  exitPort,
  arrival: new Date('2024-01-01'),
  departure: new Date('2024-06-01'),
  days: 152,
  isOngoing: false,
})

function Wrapper({ stays }) {
  return (
    <LangProvider>
      <PortHeatMap stays={stays} />
    </LangProvider>
  )
}

describe('PortHeatMap', () => {
  beforeEach(() => {
    localStorage.setItem('i94-lang', 'en')
  })

  it('shows empty state when no stays are provided', () => {
    render(<Wrapper stays={[]} />)
    expect(screen.getByText(/no port data/i)).toBeInTheDocument()
  })

  it('renders without crashing when all port coordinates are in-projection', () => {
    const stays = [
      makeStay('New York - John F. Kennedy International Airport'),
      makeStay('Los Angeles International Airport'),
    ]
    expect(() => render(<Wrapper stays={stays} />)).not.toThrow()
    expect(screen.getByTestId('map')).toBeInTheDocument()
  })

  it('does not crash when a matched port has out-of-projection coordinates', () => {
    // "Agana, Guam" matches in us_poe_enriched.json with lat=13.47, lng=144.75
    // geoAlbersUsa returns null for those coords — this was the original crash
    const stays = [
      makeStay('New York - John F. Kennedy International Airport'),
      makeStay('Agana, Guam'),
    ]
    expect(() => render(<Wrapper stays={stays} />)).not.toThrow()
  })

  it('renders markers only for in-projection ports', () => {
    const stays = [
      makeStay('New York - John F. Kennedy International Airport'),
      makeStay('Agana, Guam'),
    ]
    render(<Wrapper stays={stays} />)
    // Only JFK should produce a marker; Guam gets filtered out by SafeMarker
    const markers = screen.queryAllByTestId('marker')
    const guamMarker = markers.find(m =>
      JSON.parse(m.dataset.coords ?? '[]')[0] === OUT_OF_BOUNDS_LNG
    )
    expect(guamMarker).toBeUndefined()
  })
})
