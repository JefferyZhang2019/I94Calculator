import { useState } from 'react'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function MonthBreakdown({ byMonth }) {
  const [openYears, setOpenYears] = useState({})
  const [showAll, setShowAll] = useState(false)

  const years = [...new Set(byMonth.map(m => m.year))].sort((a, b) => b - a)
  const displayYears = showAll ? years : years.slice(0, 3)

  function toggle(year) {
    setOpenYears(prev => ({ ...prev, [year]: !prev[year] }))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <span className="font-semibold text-gray-900">Month-by-Month Breakdown</span>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-3">
        {displayYears.map(year => {
          const months = byMonth.filter(m => m.year === year)
          const yearTotal = months.reduce((s, m) => s + m.days, 0)
          const isOpen = openYears[year] ?? year === years[0]

          return (
            <div key={year} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
                onClick={() => toggle(year)}
              >
                <span className="font-medium text-gray-900">{year}</span>
                <span className="text-sm text-gray-500">
                  {yearTotal} days · {months.length} months with presence {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {isOpen && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide text-left">
                      <th className="pb-2 pt-3 px-4 pr-4">Month</th>
                      <th className="pb-2 pt-3 px-4">Days in U.S.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                      const record = months.find(r => r.month === m)
                      return (
                        <tr key={m} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 px-4 text-gray-700">{MONTH_NAMES[m - 1]}</td>
                          <td className="py-2 px-4">
                            {record
                              ? <span className="font-semibold text-gray-900">{record.days}</span>
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}

        {years.length > 3 && (
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setShowAll(v => !v)}
          >
            {showAll ? 'Show fewer years' : `Show all ${years.length} years`}
          </button>
        )}
      </div>
    </div>
  )
}
