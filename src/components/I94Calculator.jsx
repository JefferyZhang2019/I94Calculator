import { useState } from 'react'
import { parseI94Text } from '../utils/parser'
import {
  buildStays, computeTotals, computeByYear, computeByMonth,
  computeRolling5Year, computeVisitStats,
} from '../utils/calculator'
import { useLang } from '../i18n/LangContext'

import InputPanel     from './InputPanel'
import StaysTable     from './StaysTable'
import YearBreakdown  from './YearBreakdown'
import MonthBreakdown from './MonthBreakdown'
import OverviewTab    from './OverviewTab'
import AnalysisTab    from './AnalysisTab'
import OverviewActions from './OverviewActions'

export default function I94Calculator({ activeTab, setActiveTab, embed = false }) {
  const { t, lang } = useLang()
  const [results, setResults] = useState(null)
  const [rawText, setRawText] = useState('')
  const [prDate, setPrDate]   = useState('')

  function handleCalculate({ rawText, prDate }) {
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    const { entries, warnings, error } = parseI94Text(rawText)
    if (error) {
      setResults({ error })
      return
    }

    const prDateObj = prDate ? new Date(prDate + 'T12:00:00') : null
    const stays      = buildStays(entries, today)
    const totals     = computeTotals(stays, prDateObj)
    const byYear     = computeByYear(stays)
    const byMonth    = computeByMonth(stays)
    const rolling    = computeRolling5Year(stays, today.getFullYear())
    const visitStats = computeVisitStats(stays)

    setResults({ entries, stays, totals, byYear, byMonth, rolling, visitStats, warnings, error: null })
    setActiveTab('overview')
  }

  const errorBanner = results?.error && (
    <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-800 text-sm">
      <strong>{t('errorParse')}</strong> {results.error}
    </div>
  )

  // Embed mode: stack all panels vertically, no tabs
  if (embed) {
    return (
      <div className="space-y-6 p-4">
        <InputPanel rawText={rawText} setRawText={setRawText} prDate={prDate} setPrDate={setPrDate} onCalculate={handleCalculate} />
        {errorBanner}
        {results && !results.error && (
          <>
            <OverviewTab results={results} onGoToByYear={() => {}} />
            <StaysTable stays={results.stays} warnings={results.warnings} />
            <YearBreakdown byYear={results.byYear} />
            <MonthBreakdown byMonth={results.byMonth} />
            <AnalysisTab results={results} />
          </>
        )}
      </div>
    )
  }

  const hasData = results && !results.error

  const noDataMsg = !hasData && activeTab !== 'stays' && (
    <div className="text-center py-16 text-gray-400">
      <p>{t('noDataPrompt')}</p>
      <button
        className="mt-4 text-blue-600 hover:underline text-sm"
        onClick={() => setActiveTab('stays')}
      >
        {t('goToInput')}
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      {activeTab === 'stays' && (
        <>
          {errorBanner}
          <InputPanel rawText={rawText} setRawText={setRawText} prDate={prDate} setPrDate={setPrDate} onCalculate={handleCalculate} />
          {hasData && (
            <StaysTable stays={results.stays} warnings={results.warnings} />
          )}
        </>
      )}
      {activeTab === 'overview' && (hasData
        ? (
          <>
            <OverviewTab results={results} onGoToByYear={() => setActiveTab('byyear')} />
            <OverviewActions
              stays={results.stays}
              byYear={results.byYear}
              byMonth={results.byMonth}
              results={results}
              lang={lang}
              onGoToStays={() => setActiveTab('stays')}
            />
          </>
        )
        : noDataMsg
      )}
      {activeTab === 'byyear' && (hasData
        ? <><YearBreakdown byYear={results.byYear} /><MonthBreakdown byMonth={results.byMonth} /></>
        : noDataMsg
      )}
      {activeTab === 'analysis' && (hasData
        ? <AnalysisTab results={results} />
        : noDataMsg
      )}
    </div>
  )
}
