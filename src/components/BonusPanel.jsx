import { useState } from 'react'
import { computeSPT, computeAbsences, computeLongestStay } from '../utils/calculator'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(d) {
  return `${d.getFullYear()} ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`
}

export default function BonusPanel({ stays }) {
  const currentYear = new Date().getFullYear()
  const [sptYear, setSptYear] = useState(String(currentYear))
  const spt = computeSPT(stays, parseInt(sptYear))
  const absences = computeAbsences(stays)
  const longest = computeLongestStay(stays)

  const years = Array.from(
    new Set(stays.flatMap(s => {
      const y = []
      for (let yr = s.arrival.getFullYear(); yr <= s.departure.getFullYear(); yr++) y.push(yr)
      return y
    }))
  ).sort((a, b) => b - a)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">IRS Substantial Presence Estimate</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Score = days(year) + ⌊days(year−1) ÷ 3⌋ + ⌊days(year−2) ÷ 6⌋. Score ≥ 183 may indicate resident alien tax status.
            </p>
          </div>
          <select
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sptYear}
            onChange={e => setSptYear(e.target.value)}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Days in {spt.year}</p>
            <p className="font-bold text-gray-900 text-lg">{spt.daysY}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">⅓ of days in {spt.year - 1}</p>
            <p className="font-bold text-gray-900 text-lg">{Math.floor(spt.daysY1 / 3)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">⅙ of days in {spt.year - 2}</p>
            <p className="font-bold text-gray-900 text-lg">{Math.floor(spt.daysY2 / 6)}</p>
          </div>
          <div className={`rounded-lg p-3 ${spt.isResident ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <p className="text-xs text-gray-500">SPT Score</p>
            <p className={`font-bold text-lg ${spt.isResident ? 'text-orange-700' : 'text-green-700'}`}>
              {spt.score}
            </p>
          </div>
        </div>

        <p className={`text-sm rounded-lg px-4 py-2 ${spt.isResident ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'}`}>
          {spt.isResident
            ? `SPT score of ${spt.score} meets the 183-day threshold. You may qualify as a resident alien for U.S. tax purposes in ${spt.year}. Consult a tax professional to confirm.`
            : `SPT score of ${spt.score} is below 183. You likely do not meet substantial presence for ${spt.year} based on this data alone.`
          }
        </p>

        <p className="text-xs text-gray-400">
          This is an estimate only. Exempt days, treaty positions, and other factors may apply. Consult a licensed tax advisor before making filing decisions.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Notable Periods</h3>

        {longest && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm">
              <p className="font-medium text-blue-900">Longest single stay</p>
              <p className="text-blue-700">
                {fmtDate(longest.arrival)} → {longest.isOngoing ? 'today' : fmtDate(longest.departure)} — <strong>{longest.days} days</strong>
              </p>
            </div>
          </div>
        )}

        {absences.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Longest absences from U.S.</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide text-left">
                  <th className="pb-2 pr-4">Departed</th>
                  <th className="pb-2 pr-4">Returned</th>
                  <th className="pb-2 pr-4">Days Away</th>
                  <th className="pb-2">Flag</th>
                </tr>
              </thead>
              <tbody>
                {absences.slice(0, 10).map((a, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 font-mono text-gray-700">{fmtDate(a.start)}</td>
                    <td className="py-2 pr-4 font-mono text-gray-700">{fmtDate(a.end)}</td>
                    <td className="py-2 pr-4 font-semibold text-gray-900">{a.days}</td>
                    <td className="py-2">
                      {a.days > 365
                        ? <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Breaks continuous residence</span>
                        : a.days > 180
                        ? <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">May interrupt continuous residence</span>
                        : null
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
