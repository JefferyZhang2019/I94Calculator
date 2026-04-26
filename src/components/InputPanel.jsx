import { useState } from 'react'
import { useLang } from '../i18n/LangContext'

const EXAMPLE = `1\t2025-03-15\tArrival\tJFK
2\t2025-01-08\tDeparture\tLAX
3\t2024-11-22\tArrival\tORD
4\t2024-09-04\tDeparture\tSFO
5\t2024-09-03\tArrival\tMIA
6\t2024-06-17\tDeparture\tJFK
7\t2023-12-28\tArrival\tLAX
8\t2023-08-10\tDeparture\tORD`

export default function InputPanel({ rawText, setRawText, prDate, setPrDate, onCalculate }) {
  const { t } = useLang()
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!rawText.trim()) {
      setError(t('errorEmpty'))
      return
    }
    setError('')
    onCalculate({ rawText, prDate: prDate || null })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <details className="text-sm text-gray-600" open>
        <summary className="cursor-pointer font-medium text-gray-700 mb-2">{t('howToUse')}</summary>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>
            {t('howToStep1').split('i94.cbp.dhs.gov').map((part, i) =>
              i === 0
                ? <span key={i}>{part}<a href="https://i94.cbp.dhs.gov/search/history-search" target="_blank" rel="noreferrer" className="text-blue-600 underline">i94.cbp.dhs.gov</a></span>
                : <span key={i}>{part}</span>
            )}
          </li>
          <li>{t('howToStep2')}</li>
          <li>{t('howToStep3')}</li>
          <li>{t('howToStep4')}</li>
          <li>{t('howToStep5')}</li>
        </ol>
        <p className="mt-2 text-xs text-gray-500">{t('exampleFormat')}</p>
        <pre className="bg-gray-50 rounded p-2 text-xs mt-1 overflow-auto">{EXAMPLE}</pre>
      </details>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('inputLabel')} <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={10}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('inputPlaceholder')}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
          />
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>

        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('prDateLabel')}{' '}
            <span className="text-gray-400 font-normal">{t('prDateOptional')}</span>
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={prDate}
            onChange={e => setPrDate(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">{t('prDateHint')}</p>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {t('calculateBtn')}
        </button>
      </form>
    </div>
  )
}
