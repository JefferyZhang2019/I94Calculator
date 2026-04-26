import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer'
import { computeSPT, computeAbsences, computeLongestStay } from './calculator'
import { strings } from '../i18n/strings'

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_ZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

if (typeof window !== 'undefined') {
  Font.register({
    family: 'NotoSansSC',
    src: `${window.location.origin}${import.meta.env.BASE_URL}fonts/NotoSansSC-Regular.otf`,
  })
}

function fmtDate(date, lang) {
  if (lang === 'zh') {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }
  return `${MONTHS_EN[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

function monthLabel(monthNum, lang) {
  return (lang === 'zh' ? MONTHS_ZH : MONTHS_EN)[monthNum - 1]
}

function fill(str, vars) {
  let result = str
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(`{${k}}`, String(v))
  }
  return result
}

const BLUE = '#1e3a5f'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansSC',
    fontSize: 9,
    color: '#111827',
    paddingTop: 52,
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  pageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: BLUE,
    paddingVertical: 8,
    paddingHorizontal: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageHeaderTitle: { color: 'white', fontSize: 11 },
  pageHeaderDate:  { color: '#93c5fd', fontSize: 7 },
  pageFooter: {
    position: 'absolute',
    bottom: 14,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: '#9ca3af' },
  chapterTitle: {
    fontSize: 11,
    color: BLUE,
    marginTop: 16,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statRow:      { flexDirection: 'row', marginBottom: 8 },
  statCard: {
    flex: 1,
    marginRight: 6,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    padding: 8,
  },
  statCardBlue: {
    flex: 1,
    marginRight: 6,
    backgroundColor: BLUE,
    borderRadius: 3,
    padding: 8,
  },
  statCardLast:     { marginRight: 0 },
  statLabel:        { fontSize: 7, color: '#6b7280' },
  statLabelWhite:   { fontSize: 7, color: '#93c5fd' },
  statValue:        { fontSize: 14, color: '#111827', marginTop: 2 },
  statValueWhite:   { fontSize: 14, color: 'white',   marginTop: 2 },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: BLUE,
  },
  thCell: { color: 'white', fontSize: 7.5 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tdCell: { fontSize: 8, color: '#374151' },
  noticeGreen: {
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac',
    borderRadius: 3, padding: 6, marginBottom: 8, fontSize: 8, color: '#166534',
  },
  noticeAmber: {
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d',
    borderRadius: 3, padding: 6, marginBottom: 8, fontSize: 8, color: '#92400e',
  },
  noticeRed: {
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5',
    borderRadius: 3, padding: 6, marginBottom: 8, fontSize: 8, color: '#991b1b',
  },
  subLabel: { fontSize: 8, color: '#374151', marginBottom: 4 },
})

function ReportDocument({ results, lang }) {
  const s   = strings[lang]
  const today = new Date()
  const fmt = d => fmtDate(d, lang)

  const { stays, totals, byYear, byMonth, rolling, visitStats, entries } = results
  const currentYear    = today.getFullYear()
  const spt            = computeSPT(stays, currentYear)
  const absences       = computeAbsences(stays)
  const longest        = computeLongestStay(stays)
  const firstYear      = entries[0] ? String(entries[0].date.getFullYear()) : '—'
  const currentRolling = rolling.find(r => r.year === currentYear) ?? rolling[rolling.length - 1]
  const rollingDays    = currentRolling?.days ?? 0
  const remaining      = Math.max(0, 913 - rollingDays)
  const longestAbsDay  = absences.length > 0 ? absences[0].days : 0
  const contStatus     = longestAbsDay >= 365 ? 'red' : longestAbsDay >= 180 ? 'amber' : 'green'

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Fixed header on every page */}
        <View fixed style={styles.pageHeader}>
          <Text style={styles.pageHeaderTitle}>{s.pdfTitle}</Text>
          <Text style={styles.pageHeaderDate}>{s.pdfGenerated} {fmt(today)}</Text>
        </View>

        {/* Fixed footer on every page */}
        <View fixed style={styles.pageFooter}>
          <Text style={styles.footerText}>{s.pdfFooterDisclaimer}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>

        {/* ── Chapter 1: Overview ── */}
        <Text style={styles.chapterTitle}>{s.pdfChapter1}</Text>

        <View style={styles.statRow}>
          <View style={styles.statCardBlue}>
            <Text style={styles.statLabelWhite}>{s.statTotalDays}</Text>
            <Text style={styles.statValueWhite}>{totals.total.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{s.statTotalStays}</Text>
            <Text style={styles.statValue}>{stays.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{s.statCurrentlyInUS}</Text>
            <Text style={styles.statValue}>{totals.currentlyInUS ? s.statYes : s.statNo}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardLast]}>
            <Text style={styles.statLabel}>{s.statFirstEntry}</Text>
            <Text style={styles.statValue}>{firstYear}</Text>
          </View>
        </View>

        {totals.beforePR !== null && (
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{s.statBeforePR}</Text>
              <Text style={styles.statValue}>{totals.beforePR.toLocaleString()}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardLast]}>
              <Text style={styles.statLabel}>{s.statAfterPR}</Text>
              <Text style={styles.statValue}>{totals.afterPR.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {contStatus === 'green' && <View style={styles.noticeGreen}><Text>{s.noAbsences}</Text></View>}
        {contStatus === 'amber' && <View style={styles.noticeAmber}><Text>{s.amberAbsence}</Text></View>}
        {contStatus === 'red'   && <View style={styles.noticeRed}><Text>{s.redAbsence}</Text></View>}

        <View style={{ marginBottom: 10 }}>
          <Text style={styles.statLabel}>{s.milestoneTitle}</Text>
          {remaining === 0
            ? <Text style={{ fontSize: 9, color: '#166534', marginTop: 2 }}>{s.milestoneMet}</Text>
            : <Text style={{ fontSize: 9, color: '#374151', marginTop: 2 }}>
                {rollingDays.toLocaleString()} / 913 {s.daysUnit} · {fill(s.milestoneNeed, { n: remaining.toLocaleString() })}
              </Text>
          }
        </View>

        {/* ── Chapter 2: Stay Records ── */}
        <Text style={styles.chapterTitle}>{s.pdfChapter2}</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.thCell, { width: '13%' }]}>{s.colArrival}</Text>
          <Text style={[styles.thCell, { width: '13%' }]}>{s.colDeparture}</Text>
          <Text style={[styles.thCell, { width:  '7%' }]}>{s.colDays}</Text>
          <Text style={[styles.thCell, { width: '25%' }]}>{s.colEntryPort}</Text>
          <Text style={[styles.thCell, { width: '25%' }]}>{s.colExitPort}</Text>
          <Text style={[styles.thCell, { width: '17%' }]}>{s.colStatus}</Text>
        </View>
        {stays.map((stay, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
            <Text style={[styles.tdCell, { width: '13%' }]}>{fmt(stay.arrival)}</Text>
            <Text style={[styles.tdCell, { width: '13%' }]}>{stay.isOngoing ? s.today : fmt(stay.departure)}</Text>
            <Text style={[styles.tdCell, { width:  '7%' }]}>{stay.days}</Text>
            <Text style={[styles.tdCell, { width: '25%' }]}>{stay.port}</Text>
            <Text style={[styles.tdCell, { width: '25%' }]}>{stay.exitPort || '—'}</Text>
            <Text style={[styles.tdCell, { width: '17%' }]}>{stay.isOngoing ? s.statusOngoing : s.statusCompleted}</Text>
          </View>
        ))}

        {/* ── Chapter 3: Year & Month Breakdown ── */}
        <Text style={styles.chapterTitle}>{s.pdfChapter3}</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.thCell, { width: '25%' }]}>{s.colYear}</Text>
          <Text style={[styles.thCell, { width: '45%' }]}>{s.daysInUS}</Text>
          <Text style={[styles.thCell, { width: '30%' }]}>{s.colStays}</Text>
        </View>
        {[...byYear].reverse().map((y, i) => (
          <View key={y.year} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
            <Text style={[styles.tdCell, { width: '25%' }]}>{y.year}</Text>
            <Text style={[styles.tdCell, { width: '45%' }]}>{y.days}</Text>
            <Text style={[styles.tdCell, { width: '30%' }]}>{y.stays}</Text>
          </View>
        ))}

        <View style={{ marginTop: 10 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thCell, { width: '20%' }]}>{s.colYear}</Text>
            <Text style={[styles.thCell, { width: '50%' }]}>{s.colMonth}</Text>
            <Text style={[styles.thCell, { width: '30%' }]}>{s.daysInUS}</Text>
          </View>
          {[...byMonth].reverse().map((m, i) => (
            <View key={`${m.year}-${m.month}`} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
              <Text style={[styles.tdCell, { width: '20%' }]}>{m.year}</Text>
              <Text style={[styles.tdCell, { width: '50%' }]}>{monthLabel(m.month, lang)}</Text>
              <Text style={[styles.tdCell, { width: '30%' }]}>{m.days}</Text>
            </View>
          ))}
        </View>

        {/* ── Chapter 4: IRS SPT ── */}
        <Text style={styles.chapterTitle}>{s.pdfChapter4}</Text>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{fill(s.sptDaysInYear, { year: spt.year })}</Text>
            <Text style={styles.statValue}>{spt.daysY}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{fill(s.sptOneThird, { year: spt.year - 1 })}</Text>
            <Text style={styles.statValue}>{Math.floor(spt.daysY1 / 3)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{fill(s.sptOneSixth, { year: spt.year - 2 })}</Text>
            <Text style={styles.statValue}>{Math.floor(spt.daysY2 / 6)}</Text>
          </View>
          <View style={[
            styles.statCard, styles.statCardLast,
            spt.isResident
              ? { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }
              : { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
          ]}>
            <Text style={styles.statLabel}>{s.sptScore}</Text>
            <Text style={[styles.statValue, spt.isResident ? { color: '#c2410c' } : { color: '#166534' }]}>
              {spt.score}
            </Text>
          </View>
        </View>
        <View style={spt.isResident ? styles.noticeAmber : styles.noticeGreen}>
          <Text>
            {spt.isResident
              ? fill(s.sptResident,    { score: spt.score, year: spt.year })
              : fill(s.sptNonResident, { score: spt.score, year: spt.year })}
          </Text>
        </View>

        {/* ── Chapter 5: Residence Continuity ── */}
        <Text style={styles.chapterTitle}>{s.pdfChapter5}</Text>
        {longest && (
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.subLabel}>{s.longestSingleStay}</Text>
            <Text style={{ fontSize: 9, color: BLUE }}>
              {fmt(longest.arrival)} → {longest.isOngoing ? s.today : fmt(longest.departure)} — {longest.days} {s.daysUnit}
            </Text>
          </View>
        )}
        {absences.length > 0 && (
          <View>
            <Text style={[styles.subLabel, { marginBottom: 4 }]}>{s.longestAbsencesTitle}</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.thCell, { width: '25%' }]}>{s.colDeparted}</Text>
              <Text style={[styles.thCell, { width: '25%' }]}>{s.colReturned}</Text>
              <Text style={[styles.thCell, { width: '20%' }]}>{s.colDaysAway}</Text>
              <Text style={[styles.thCell, { width: '30%' }]}>{s.colFlag}</Text>
            </View>
            {absences.slice(0, 10).map((a, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
                <Text style={[styles.tdCell, { width: '25%' }]}>{fmt(a.start)}</Text>
                <Text style={[styles.tdCell, { width: '25%' }]}>{fmt(a.end)}</Text>
                <Text style={[styles.tdCell, { width: '20%' }]}>{a.days}</Text>
                <Text style={[styles.tdCell, { width: '30%' }]}>
                  {a.days > 365 ? s.flagBreaks : a.days > 180 ? s.flagMayInterrupt : '—'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Chapter 6: 5-Year Rolling Window ── */}
        <Text style={styles.chapterTitle}>{s.pdfChapter6}</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.thCell, { width: '30%' }]}>{s.colYear}</Text>
          <Text style={[styles.thCell, { width: '40%' }]}>{s.colRollingDays}</Text>
          <Text style={[styles.thCell, { width: '30%' }]}>{s.colMeetsThreshold}</Text>
        </View>
        {[...rolling].reverse().map((r, i) => (
          <View key={r.year} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
            <Text style={[styles.tdCell, { width: '30%' }]}>{r.year}</Text>
            <Text style={[styles.tdCell, { width: '40%' }]}>{r.days}</Text>
            <Text style={[styles.tdCell, { width: '30%' }]}>{r.meetsThreshold ? s.rollingYes : s.rollingNo}</Text>
          </View>
        ))}

        {/* ── Chapter 7: Visit Statistics ── */}
        <Text style={styles.chapterTitle}>{s.pdfChapter7}</Text>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{s.avgVisitDuration}</Text>
            <Text style={styles.statValue}>{visitStats.avgDuration} {s.daysUnit}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{s.avgGapBetween}</Text>
            <Text style={styles.statValue}>{visitStats.avgGap} {s.daysUnit}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{s.shortestStay}</Text>
            <Text style={styles.statValue}>{visitStats.minDuration} {s.daysUnit}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardLast]}>
            <Text style={styles.statLabel}>{s.longestStayLabel}</Text>
            <Text style={styles.statValue}>{visitStats.maxDuration} {s.daysUnit}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={[styles.statCard, { flex: 0, width: '22%', marginRight: 0 }]}>
            <Text style={styles.statLabel}>{s.totalVisits}</Text>
            <Text style={styles.statValue}>{visitStats.count}</Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}

export async function generatePdf({ results, lang }) {
  const blob  = await pdf(<ReportDocument results={results} lang={lang} />).toBlob()
  const today = new Date().toISOString().slice(0, 10)
  const url   = URL.createObjectURL(blob)
  const a     = document.createElement('a')
  a.href      = url
  a.download  = `i94_report_${today}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
