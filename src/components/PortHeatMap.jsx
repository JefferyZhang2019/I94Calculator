import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { computePortStats } from '../utils/calculator'
import { useLang } from '../i18n/LangContext'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

function portColor(t) {
  if (t < 0.33) return '#22c55e'
  if (t < 0.66) return '#eab308'
  if (t < 0.85) return '#f97316'
  return '#ef4444'
}

function baseRadius(t) {
  return 5 + t * 13
}

export default function PortHeatMap({ stays }) {
  const { t, tpl } = useLang()
  const [mode, setMode] = useState('all')
  const [tooltip, setTooltip] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const stats = computePortStats(stays, mode)
  const matched = stats.filter(s => s.matched)
  const unmatched = stats.filter(s => !s.matched)
  const maxCount = matched.length > 0 ? matched[0].count : 1

  if (stats.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">{t('portHeatMapEmpty')}</p>
  }

  const modes = ['all', 'entry', 'exit']
  const modeLabels = {
    all: t('portHeatMapAll'),
    entry: t('portHeatMapEntry'),
    exit: t('portHeatMapExit'),
  }

  return (
    <div>
      {/* Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {modes.map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 ${
                mode === m
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Map + List */}
      <div className="flex gap-4">
        {/* Map */}
        <div
          className="relative"
          style={{ flex: '0 0 65%' }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <ComposableMap
            projection="geoAlbersUsa"
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#dbeafe"
                    stroke="#bfdbfe"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>
            {matched.map(({ port, count, lat, lng }) => {
              const ratio = count / maxCount
              const color = portColor(ratio)
              const base = baseRadius(ratio)
              return (
                <Marker key={port} coordinates={[lng, lat]}>
                  <g
                    onMouseEnter={() => setTooltip({ port, count })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle r={base * 3} fill={color} fillOpacity={0.15} />
                    <circle r={base * 2} fill={color} fillOpacity={0.25} />
                    <circle r={base} fill={color} fillOpacity={0.70} />
                  </g>
                </Marker>
              )
            })}
          </ComposableMap>

          {tooltip && (
            <div
              className="absolute z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none whitespace-nowrap"
              style={{ left: mousePos.x + 10, top: mousePos.y - 30 }}
            >
              {tooltip.port} — {tpl('portHeatMapVisits', { n: tooltip.count })}
            </div>
          )}

          {matched.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
              No ports could be mapped
            </p>
          )}
        </div>

        {/* Ranked list */}
        <div className="flex-1 overflow-y-auto max-h-72">
          {matched.map(({ port, count }) => {
            const ratio = count / maxCount
            const color = portColor(ratio)
            return (
              <div key={port} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                <span
                  className="inline-block rounded-full flex-shrink-0"
                  style={{ width: 10, height: 10, background: color }}
                />
                <span className="text-sm text-gray-800 flex-1 truncate">{port}</span>
                <span className="text-sm font-semibold text-gray-700 flex-shrink-0">{count}</span>
              </div>
            )
          })}

          {unmatched.length > 0 && (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-wide mt-3 mb-1 pt-2 border-t border-gray-100">
                {t('portHeatMapNotOnMap')}
              </p>
              {unmatched.map(({ port, count }) => (
                <div key={port} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                  <span
                    className="inline-block rounded-full flex-shrink-0 bg-gray-300"
                    style={{ width: 10, height: 10 }}
                  />
                  <span className="text-sm text-gray-500 flex-1 truncate">{port}</span>
                  <span className="text-sm font-semibold text-gray-500 flex-shrink-0">{count}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
