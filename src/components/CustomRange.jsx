import { useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { computeForRange } from '../utils/calculator'

export default function CustomRange({ stays }) {
  const { t, tpl } = useLang()
  const [start, setStart]   = useState('')
  const [end, setEnd]       = useState('')
  const [result, setResult] = useState(null)
  const [error, setError]   = useState('')

  function calculate() {
    if (!start || !end) {
      setError(t('errorSelectDates'))
      return
    }
    const s = new Date(start + 'T12:00:00')
    const e = new Date(end   + 'T12:00:00')
    if (s > e) {
      setError(t('errorStartBeforeEnd'))
      return
    }
    setError('')
    const days = computeForRange(stays, s, e)
    const rangeLength = Math.floor((e - s) / 86400000) + 1
    setResult({ days, rangeLength, pct: Math.round(days / rangeLength * 100) })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{t('customRangeDesc')}</p>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('fromLabel')}</label>
          <input
            type="date"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={start}
            onChange={e => setStart(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('toLabel')}</label>
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
          {t('calculateBtn')}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {result !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4">
          <p className="text-blue-900 font-semibold text-lg">
            {tpl('customRangeDays', { days: result.days })}
          </p>
          <p className="text-blue-700 text-sm mt-1">
            {tpl('customRangeOutOf', { total: result.rangeLength, pct: result.pct })}
          </p>
        </div>
      )}
    </div>
  )
}
