import { useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { buildCSV, downloadCSV } from '../utils/exporter'
import { generatePdf } from '../utils/pdfReport'

export default function OverviewActions({ stays, byYear, byMonth, results, lang, onGoToStays }) {
  const { t, tpl } = useLang()
  const [pdfLoading, setPdfLoading] = useState(false)

  function handleCsv() {
    const today = new Date().toISOString().slice(0, 10)
    downloadCSV(buildCSV({ stays, byYear, byMonth }), `i94_presence_${today}.csv`)
  }

  async function handlePdf() {
    setPdfLoading(true)
    try {
      await generatePdf({ results, lang })
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
      <button
        onClick={onGoToStays}
        className="flex flex-col gap-1 rounded-xl border border-gray-200 hover:border-blue-400 bg-white p-4 text-left transition-colors group"
      >
        <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
          → {t('actionViewStays')}
        </span>
        <span className="text-xs text-gray-500">
          {tpl('actionViewStaysDesc', { n: stays.length })}
        </span>
      </button>

      <button
        onClick={handleCsv}
        className="flex flex-col gap-1 rounded-xl border border-gray-200 hover:border-blue-400 bg-white p-4 text-left transition-colors group"
      >
        <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
          ↓ {t('exportCSV')}
        </span>
        <span className="text-xs text-gray-500">{t('actionExportCSVDesc')}</span>
      </button>

      <button
        onClick={handlePdf}
        disabled={pdfLoading}
        className="flex flex-col gap-1 rounded-xl border border-gray-200 hover:border-blue-400 bg-white p-4 text-left transition-colors group disabled:opacity-60 disabled:cursor-wait"
      >
        <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
          {pdfLoading ? t('pdfGenerating') : `↓ ${t('actionExportPDF')}`}
        </span>
        <span className="text-xs text-gray-500">{t('actionExportPDFDesc')}</span>
      </button>
    </div>
  )
}
