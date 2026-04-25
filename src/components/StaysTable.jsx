import { useState } from 'react'
import { useLang } from '../i18n/LangContext'

export default function StaysTable({ stays, warnings }) {
  const { t, tpl, fmtDate } = useLang()
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        className="w-full flex justify-between items-center px-6 py-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-semibold text-gray-900">
          {tpl('staysTableTitle', { n: stays.length })}
        </span>
        <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-3">
          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 space-y-1">
              <p className="font-medium">{t('warningsTitle')}</p>
              {warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">{t('colArrival')}</th>
                  <th className="pb-2 pr-4">{t('colDeparture')}</th>
                  <th className="pb-2 pr-4">{t('colDays')}</th>
                  <th className="pb-2 pr-4">{t('colPort')}</th>
                  <th className="pb-2">{t('colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {stays.map((stay, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 text-gray-400">{stays.length - i}</td>
                    <td className="py-2 pr-4 font-mono text-gray-900">{fmtDate(stay.arrival)}</td>
                    <td className="py-2 pr-4 font-mono text-gray-900">
                      {stay.isOngoing
                        ? <span className="text-amber-600">{t('today')}</span>
                        : fmtDate(stay.departure)
                      }
                    </td>
                    <td className="py-2 pr-4 font-semibold text-gray-900">{stay.days}</td>
                    <td className="py-2 pr-4 text-gray-500">{stay.port || '—'}</td>
                    <td className="py-2">
                      {stay.isOngoing
                        ? <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{t('statusOngoing')}</span>
                        : <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{t('statusCompleted')}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
