import { useState } from 'react'
import { parseI94Text } from '../utils/parser'
import {
  buildStays, computeTotals,
  computeByYear, computeByMonth,
} from '../utils/calculator'

import InputPanel      from './InputPanel'
import SummaryBanner   from './SummaryBanner'
import StaysTable      from './StaysTable'
import YearBreakdown   from './YearBreakdown'
import MonthBreakdown  from './MonthBreakdown'
import CustomRange     from './CustomRange'
import BonusPanel      from './BonusPanel'
import ExportButton    from './ExportButton'

export default function I94Calculator() {
  const [results, setResults] = useState(null)

  function handleCalculate({ rawText, prDate }) {
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    const { entries, warnings, error } = parseI94Text(rawText)

    if (error) {
      setResults({ error })
      return
    }

    const prDateObj = prDate ? new Date(prDate + 'T12:00:00') : null
    const stays   = buildStays(entries, today)
    const totals  = computeTotals(stays, prDateObj)
    const byYear  = computeByYear(stays)
    const byMonth = computeByMonth(stays)

    setResults({ entries, stays, totals, byYear, byMonth, warnings, error: null })
  }

  return (
    <div className="space-y-6">
      <InputPanel onCalculate={handleCalculate} />

      {results?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-800 text-sm">
          <strong>Could not parse input:</strong> {results.error}
        </div>
      )}

      {results && !results.error && (
        <>
          <SummaryBanner
            totals={results.totals}
            stays={results.stays}
            entries={results.entries}
          />

          <div className="flex justify-end">
            <ExportButton
              stays={results.stays}
              byYear={results.byYear}
              byMonth={results.byMonth}
            />
          </div>

          <StaysTable stays={results.stays} warnings={results.warnings} />
          <YearBreakdown byYear={results.byYear} />
          <MonthBreakdown byMonth={results.byMonth} />
          <CustomRange stays={results.stays} />
          <BonusPanel stays={results.stays} />
        </>
      )}
    </div>
  )
}
