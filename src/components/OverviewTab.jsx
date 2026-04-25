import { useLang } from '../i18n/LangContext'
import { computeAbsences } from '../utils/calculator'

function StatCard({ label, value, highlight, green }) {
  return (
    <div className={`rounded-xl p-4 ${
      highlight ? 'bg-blue-600'
      : green    ? 'bg-green-50 border border-green-200'
      :            'bg-white border border-gray-200'
    }`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${
        highlight ? 'text-blue-100' : green ? 'text-green-600' : 'text-gray-500'
      }`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 tracking-tight ${
        highlight ? 'text-white' : green ? 'text-green-700' : 'text-gray-900'
      }`}>{value}</p>
    </div>
  )
}

export default function OverviewTab({ results, onGoToByYear }) {
  const { t, tpl } = useLang()
  const { totals, stays, entries, byYear, rolling } = results

  const absences = computeAbsences(stays)
  const longestAbsenceDays = absences.length > 0 ? absences[0].days : 0

  const continuousStatus = longestAbsenceDays >= 365 ? 'red'
    : longestAbsenceDays >= 180 ? 'amber'
    : 'green'

  const currentYear = new Date().getFullYear()
  const currentRolling = rolling.find(r => r.year === currentYear) ?? rolling[rolling.length - 1]
  const rollingDays = currentRolling?.days ?? 0
  const remaining = Math.max(0, 913 - rollingDays)

  const firstEntry = entries[0]
  const firstYear = firstEntry ? String(firstEntry.date.getFullYear()) : '—'

  return (
    <div className="space-y-6">
      {/* Row 1: 4 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={t('statTotalDays')} value={totals.total.toLocaleString()} highlight />
        <StatCard label={t('statTotalStays')} value={stays.length} />
        <StatCard
          label={t('statCurrentlyInUS')}
          value={totals.currentlyInUS ? t('statYes') : t('statNo')}
          green={totals.currentlyInUS}
        />
        <StatCard label={t('statFirstEntry')} value={firstYear} />
      </div>

      {/* Row 1b: PR split (conditional) */}
      {totals.beforePR !== null && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard label={t('statBeforePR')} value={totals.beforePR.toLocaleString()} />
          <StatCard label={t('statAfterPR')} value={totals.afterPR.toLocaleString()} />
        </div>
      )}

      {/* Ongoing notice */}
      {totals.currentlyInUS && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          {t('ongoingNotice')}
        </div>
      )}

      {/* Row 2: Continuous residence + Milestone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">{t('continuousResidenceTitle')}</h3>
          {continuousStatus === 'green' && (
            <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
              <span>🟢</span><span>{t('noAbsences')}</span>
            </div>
          )}
          {continuousStatus === 'amber' && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
              <span>🟡</span><span>{t('amberAbsence')}</span>
            </div>
          )}
          {continuousStatus === 'red' && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3">
              <span>🔴</span><span>{t('redAbsence')}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">{t('milestoneTitle')}</h3>
          {remaining === 0 ? (
            <div className="text-sm text-green-700 bg-green-50 rounded-lg p-3 font-medium">
              {t('milestoneMet')}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{rollingDays.toLocaleString()} / 913 {t('daysUnit')}</span>
                <span className="text-gray-400">{Math.round(rollingDays / 913 * 100)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, rollingDays / 913 * 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {tpl('milestoneNeed', { n: remaining.toLocaleString() })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Year bars */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{t('presenceByYear')}</h3>
          <button
            onClick={onGoToByYear}
            className="text-xs text-blue-600 hover:underline"
          >{t('viewFullBreakdown')}</button>
        </div>
        <div className="space-y-2">
          {[...byYear].reverse().slice(0, 8).map(y => (
            <div key={y.year} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-10 text-right">{y.year}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.round(y.days / 365 * 100))}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-14 text-right">{y.days}d</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
