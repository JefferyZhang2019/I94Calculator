import { useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { computeSPT, computeAbsences, computeLongestStay } from '../utils/calculator'
import CustomRange from './CustomRange'
import PortHeatMap from './PortHeatMap'

function Accordion({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        className="w-full flex justify-between items-center px-6 py-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-semibold text-gray-900">{title}</span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold text-gray-900 text-lg mt-1">{value}</p>
    </div>
  )
}

export default function AnalysisTab({ results }) {
  const { t, tpl, fmtDate } = useLang()
  const { stays, rolling, visitStats } = results

  const currentYear = new Date().getFullYear()
  const [sptYear, setSptYear] = useState(String(currentYear))

  // SPT year range: first arrival year → max(currentYear, last stay year)
  const dataYears = stays.flatMap(s => {
    const ys = []
    for (let y = s.arrival.getFullYear(); y <= s.departure.getFullYear(); y++) ys.push(y)
    return ys
  })
  const minYear = Math.min(...dataYears)
  const maxYear = Math.max(currentYear, Math.max(...dataYears))
  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)

  const spt     = computeSPT(stays, parseInt(sptYear))
  const absences = computeAbsences(stays)
  const longest  = computeLongestStay(stays)

  return (
    <div className="space-y-3">

      {/* ── IRS Substantial Presence ── */}
      <Accordion title={t('sptTitle')}>
        <p className="text-xs text-gray-500 mb-4">{t('sptFormula')}</p>
        <div className="flex justify-end mb-4">
          <select
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sptYear}
            onChange={e => setSptYear(e.target.value)}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{tpl('sptDaysInYear', { year: spt.year })}</p>
            <p className="font-bold text-gray-900 text-lg">{spt.daysY}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{tpl('sptOneThird', { year: spt.year - 1 })}</p>
            <p className="font-bold text-gray-900 text-lg">{Math.floor(spt.daysY1 / 3)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{tpl('sptOneSixth', { year: spt.year - 2 })}</p>
            <p className="font-bold text-gray-900 text-lg">{Math.floor(spt.daysY2 / 6)}</p>
          </div>
          <div className={`rounded-lg p-3 ${spt.isResident ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <p className="text-xs text-gray-500">{t('sptScore')}</p>
            <p className={`font-bold text-lg ${spt.isResident ? 'text-orange-700' : 'text-green-700'}`}>
              {spt.score}
            </p>
          </div>
        </div>
        <p className={`text-sm rounded-lg px-4 py-2 ${spt.isResident ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'}`}>
          {spt.isResident
            ? tpl('sptResident', { score: spt.score, year: spt.year })
            : tpl('sptNonResident', { score: spt.score, year: spt.year })
          }
        </p>
        <p className="text-xs text-gray-400 mt-3">{t('sptDisclaimer')}</p>
      </Accordion>

      {/* ── Residence Continuity ── */}
      <Accordion title={t('residenceContinuityTitle')}>
        {longest && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <div className="text-sm">
              <p className="font-medium text-blue-900">{t('longestSingleStay')}</p>
              <p className="text-blue-700">
                {fmtDate(longest.arrival)} → {longest.isOngoing ? t('today') : fmtDate(longest.departure)}
                {' — '}<strong>{longest.days} {t('daysUnit')}</strong>
              </p>
            </div>
          </div>
        )}
        {absences.length > 0 && (
          <>
            <p className="text-sm font-medium text-gray-700 mb-2">{t('longestAbsencesTitle')}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide text-left">
                    <th className="pb-2 pr-4">{t('colDeparted')}</th>
                    <th className="pb-2 pr-4">{t('colReturned')}</th>
                    <th className="pb-2 pr-4">{t('colDaysAway')}</th>
                    <th className="pb-2">{t('colFlag')}</th>
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
                          ? <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{t('flagBreaks')}</span>
                          : a.days > 180
                          ? <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">{t('flagMayInterrupt')}</span>
                          : null
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Accordion>

      {/* ── 5-Year Rolling Window ── */}
      <Accordion title={t('rollingWindowTitle')}>
        <p className="text-xs text-gray-500 mb-4">{t('rollingWindowDesc')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide text-left">
                <th className="pb-2 pr-4">{t('colYear')}</th>
                <th className="pb-2 pr-4">{t('colRollingDays')}</th>
                <th className="pb-2">{t('colMeetsThreshold')}</th>
              </tr>
            </thead>
            <tbody>
              {[...rolling].reverse().map(r => (
                <tr key={r.year} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4 font-medium text-gray-900">{r.year}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.days}</td>
                  <td className="py-2">
                    {r.meetsThreshold
                      ? <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{t('rollingYes')}</span>
                      : <span className="text-gray-400 text-xs">{t('rollingNo')}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Accordion>

      {/* ── Custom Date Range ── */}
      <Accordion title={t('customRangeTitle')}>
        <CustomRange stays={stays} />
      </Accordion>

      {/* ── Visit Summary ── */}
      <Accordion title={t('visitSummaryTitle')} defaultOpen={true}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MiniStat label={t('avgVisitDuration')} value={`${visitStats.avgDuration} ${t('daysUnit')}`} />
          <MiniStat label={t('avgGapBetween')}   value={`${visitStats.avgGap} ${t('daysUnit')}`} />
          <MiniStat label={t('shortestStay')}     value={`${visitStats.minDuration} ${t('daysUnit')}`} />
          <MiniStat label={t('longestStayLabel')} value={`${visitStats.maxDuration} ${t('daysUnit')}`} />
          <MiniStat label={t('totalVisits')}      value={String(visitStats.count)} />
        </div>
      </Accordion>

      {/* ── Port Heat Map ── */}
      <Accordion title={t('portHeatMapTitle')} defaultOpen={false}>
        <PortHeatMap stays={stays} />
      </Accordion>

    </div>
  )
}
