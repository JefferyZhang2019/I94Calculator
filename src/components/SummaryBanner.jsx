function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-lg p-4 ${highlight ? 'bg-blue-600 text-white' : 'bg-gray-50 border border-gray-200'}`}>
      <p className={`text-xs uppercase tracking-wide font-medium ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}

export default function SummaryBanner({ totals, stays, entries }) {
  const firstEntry = entries[0]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Days in U.S." value={totals.total.toLocaleString()} highlight />
        <Stat label="Total Stays" value={stays.length} />
        <Stat label="Currently in U.S." value={totals.currentlyInUS ? 'Yes' : 'No'} />
        <Stat
          label="First Recorded Entry"
          value={firstEntry ? firstEntry.date.toISOString().slice(0, 10) : '—'}
        />
      </div>

      {totals.beforePR !== null && (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Days Before PR Approval" value={totals.beforePR.toLocaleString()} />
          <Stat label="Days After PR Approval" value={totals.afterPR.toLocaleString()} />
        </div>
      )}

      {totals.currentlyInUS && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          Your most recent entry is an <strong>Arrival</strong> with no subsequent Departure recorded. The ongoing stay is counted through today.
        </div>
      )}
    </div>
  )
}
