import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function YearBreakdown({ byYear }) {
  const [open, setOpen] = useState(true)

  const chartData = byYear.map(y => ({
    year: String(y.year),
    'Days in U.S.': y.days,
    'Days Outside': Math.max(0, 365 - y.days),
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        className="w-full flex justify-between items-center px-6 py-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-semibold text-gray-900">Year-by-Year Breakdown</span>
        <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-6">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Days in U.S." stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Days Outside" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide text-left">
                <th className="pb-2 pr-4">Year</th>
                <th className="pb-2 pr-4">Days in U.S.</th>
                <th className="pb-2 pr-4">Stays</th>
                <th className="pb-2">% of Year</th>
              </tr>
            </thead>
            <tbody>
              {byYear.map(y => (
                <tr key={y.year} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4 font-medium text-gray-900">{y.year}</td>
                  <td className="py-2 pr-4 font-semibold text-gray-900">{y.days}</td>
                  <td className="py-2 pr-4 text-gray-500">{y.stays}</td>
                  <td className="py-2 text-gray-500">{Math.round(y.days / 365 * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
