import I94Calculator from './components/I94Calculator'

export default function App() {
  const embed = new URLSearchParams(window.location.search).get('embed') === 'true'
  return (
    <div className={embed ? '' : 'min-h-screen bg-gray-50'}>
      {!embed && (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">I-94 U.S. Presence Calculator</h1>
          <p className="text-sm text-gray-500 mt-1">
            Estimate your physical presence in the United States from your I-94 travel history.
          </p>
        </header>
      )}
      <main className={embed ? '' : 'max-w-4xl mx-auto px-4 py-8'}>
        <I94Calculator />
      </main>
      {!embed && (
        <footer className="border-t border-gray-200 px-6 py-6 mt-12 text-xs text-gray-500 max-w-4xl mx-auto">
          <p className="font-semibold mb-1">Disclaimer</p>
          <p>
            This tool is a personal record-review aid only. It does not store, transmit, or share any
            information you enter — all processing happens locally in your browser. Calculated totals
            are estimates derived from the travel events you paste; they may differ from official
            government records. This tool does not constitute legal, immigration, or tax advice. For
            decisions involving residency status, naturalization eligibility, or tax filing, consult a
            qualified attorney or licensed tax professional. Always verify results against your own
            passport stamps, boarding passes, and any correspondence from USCIS or CBP.
          </p>
          <p className="mt-2">
            Official resources:{' '}
            <a className="underline" href="https://i94.cbp.dhs.gov/search/history-search" target="_blank" rel="noreferrer">
              CBP I-94 History Search
            </a>{' '}
            ·{' '}
            <a className="underline" href="https://www.dhs.gov/i-94-information" target="_blank" rel="noreferrer">
              DHS I-94 Information
            </a>{' '}
            ·{' '}
            <a className="underline" href="https://www.irs.gov/individuals/international-taxpayers/determining-alien-tax-status" target="_blank" rel="noreferrer">
              IRS: Alien Tax Status
            </a>
          </p>
        </footer>
      )}
    </div>
  )
}
