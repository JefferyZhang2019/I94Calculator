import { buildCSV, downloadCSV } from '../utils/exporter'

export default function ExportButton({ stays, byYear, byMonth }) {
  function handleExport() {
    const csv = buildCSV({ stays, byYear, byMonth })
    const today = new Date().toISOString().slice(0, 10)
    downloadCSV(csv, `i94_presence_${today}.csv`)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Export CSV
    </button>
  )
}
