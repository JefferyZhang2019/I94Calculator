import { useState } from 'react'
import { computeForRange } from '../utils/calculator'

export default function CustomRange({ stays }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function calculate() {
    if (!start || !end) {
      setError('Please select both a start and end date.')
      return
    }
    const s = new Date(start + 'T12:00:00')
    const e = new Date(end + 'T12:00:00')
    if (s > e) {
      setError('Start date must be before end date.')
      return
    }
    setError('')
    const days = computeForRange(stays, s, e)
    const rangeLength = Math.floor((e - s) / 86400000) + 1
    setResult({ days, rangeLength, pct: Math.round(days / rangeLength * 100) })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Custom Date Range</h3>
      <p className="text-sm text-gray-500">
        Calculate how many days you were present in the U.S. within any specific window.
      </p>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input
            type="date"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={start}
            onChange={e => setStart(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input
            type="date"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={end}
            onChange={e => setEnd(e.target.value)}
          />
        </div>
        <button
          onClick={calculate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Calculate
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {result !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4">
          <p className="text-blue-900 font-semibold text-lg">
            {result.days} day{result.days !== 1 ? 's' : ''} in the U.S.
          </p>
          <p className="text-blue-700 text-sm mt-1">
            Out of {result.rangeLength} total days in range — {result.pct}% presence.
          </p>
        </div>
      )}
    </div>
  )
}
