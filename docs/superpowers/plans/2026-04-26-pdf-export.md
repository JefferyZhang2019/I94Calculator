# PDF Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete PDF report export and a "View Stay Details" navigation shortcut to the Overview tab, replacing the Stays-tab CSV button with a unified three-action bar.

**Architecture:** `OverviewActions` renders below `OverviewTab` in `I94Calculator` (not inside it), keeping embed mode unaffected. `pdfReport.jsx` is a pure utility that builds a branded A4 PDF using `@react-pdf/renderer` and a locally hosted NotoSansSC font for CJK support. All new i18n strings are added to the existing `strings.js` — no new translation infrastructure.

**Tech Stack:** React 19, @react-pdf/renderer (new), NotoSansSC OTF font, Vitest + @testing-library/react (existing)

---

## File Map

| Action | File |
|--------|------|
| **Modify** | `src/i18n/strings.js` — add 15 i18n keys |
| **Create** | `public/fonts/NotoSansSC-Regular.otf` — CJK + Latin font |
| **Create** | `src/utils/pdfReport.jsx` — PDF document component + `generatePdf()` |
| **Create** | `src/components/OverviewActions.jsx` — three-button action bar |
| **Create** | `src/components/OverviewActions.test.jsx` — component tests |
| **Modify** | `src/components/I94Calculator.jsx` — wire OverviewActions, remove ExportButton |
| **Delete** | `src/components/ExportButton.jsx` — no longer used |

`OverviewTab.jsx` requires **no changes** — OverviewActions is rendered by I94Calculator after OverviewTab, so embed mode (`?embed=true`) naturally excludes the action bar.

---

## Task 1: Add i18n strings

**Files:**
- Modify: `src/i18n/strings.js`

- [ ] **Step 1: Add keys to the `en` section** — insert after `daysUnit` (line 110):

```js
    // Overview action bar
    actionViewStays: 'View Stay Details',
    actionViewStaysDesc: 'Browse the complete timeline of all {n} stays',
    actionExportCSVDesc: 'Open in Excel for filtering and analysis',
    actionExportPDF: 'Export PDF Report',
    actionExportPDFDesc: 'Generate a complete report for archiving or attorney submission',
    pdfGenerating: 'Generating…',
    // PDF document
    pdfTitle: 'I-94 U.S. Presence Report',
    pdfGenerated: 'Generated:',
    pdfChapter1: 'Overview',
    pdfChapter2: 'Stay Records',
    pdfChapter3: 'Year & Month Breakdown',
    pdfChapter4: 'IRS Substantial Presence Test',
    pdfChapter5: 'Residence Continuity',
    pdfChapter6: '5-Year Rolling Window',
    pdfChapter7: 'Visit Statistics',
    pdfFooterDisclaimer: 'For reference only. Consult an immigration attorney for legal advice.',
```

- [ ] **Step 2: Add keys to the `zh` section** — insert after `daysUnit` (line 220):

```js
    // Overview action bar
    actionViewStays: '查看入境记录明细',
    actionViewStaysDesc: '浏览所有 {n} 次入境的完整时间线',
    actionExportCSVDesc: '在 Excel 中打开，方便自行筛选和整理',
    actionExportPDF: '导出 PDF 报告',
    actionExportPDFDesc: '生成完整分析报告，适合存档或向律师提交',
    pdfGenerating: '生成中…',
    // PDF document
    pdfTitle: 'I-94 在美天数分析报告',
    pdfGenerated: '生成日期：',
    pdfChapter1: '总览',
    pdfChapter2: '入境记录',
    pdfChapter3: '年度与月度分解',
    pdfChapter4: 'IRS 实质存在测试',
    pdfChapter5: '连续居住分析',
    pdfChapter6: '5 年滚动窗口',
    pdfChapter7: '访问统计',
    pdfFooterDisclaimer: '仅供参考。如有法律问题，请咨询移民律师。',
```

- [ ] **Step 3: Run existing tests to confirm no breakage**

```bash
npm test
```

Expected: all tests pass (strings.js is pure data — adding keys cannot break existing tests).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/strings.js
git commit -m "feat: add i18n keys for PDF export and overview actions"
```

---

## Task 2: Install @react-pdf/renderer and download font

**Files:**
- Modify: `package.json` (via npm)
- Create: `public/fonts/NotoSansSC-Regular.otf`

- [ ] **Step 1: Install the library**

```bash
npm install @react-pdf/renderer
```

Expected: `package.json` now lists `"@react-pdf/renderer"` under `dependencies`.

- [ ] **Step 2: Create the fonts directory and download Noto Sans SC**

```bash
mkdir -p public/fonts
curl -L "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansSC-Regular.otf" -o public/fonts/NotoSansSC-Regular.otf
```

Expected: `public/fonts/NotoSansSC-Regular.otf` exists and is ~15 MB.

Verify:
```bash
ls -lh public/fonts/NotoSansSC-Regular.otf
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json public/fonts/NotoSansSC-Regular.otf
git commit -m "feat: add @react-pdf/renderer and NotoSansSC font"
```

---

## Task 3: Implement pdfReport.jsx

**Files:**
- Create: `src/utils/pdfReport.jsx`

This file has no unit tests — `@react-pdf/renderer` components cannot be rendered in jsdom. Correctness is verified by the smoke test in Step 2.

- [ ] **Step 1: Create `src/utils/pdfReport.jsx` with the complete implementation**

```jsx
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
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: Smoke-test the PDF generator**

```bash
npm run dev
```

Open the app, paste sample I-94 data, click Calculate, go to the Overview tab, click "Export PDF Report". Verify:
- The button shows "Generating…" briefly
- A file named `i94_report_YYYY-MM-DD.pdf` downloads
- Opening the PDF shows all 7 chapters with the blue header and page numbers
- Chinese characters render correctly when the UI is in 中文 mode

- [ ] **Step 3: Commit**

```bash
git add src/utils/pdfReport.jsx
git commit -m "feat: implement PDF report generator with 7-chapter A4 layout"
```

---

## Task 4: Implement OverviewActions.jsx

**Files:**
- Create: `src/components/OverviewActions.test.jsx`
- Create: `src/components/OverviewActions.jsx`

- [ ] **Step 1: Write the failing tests** — create `src/components/OverviewActions.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LangProvider } from '../i18n/LangContext'
import OverviewActions from './OverviewActions'

vi.mock('../utils/pdfReport', () => ({ generatePdf: vi.fn() }))
vi.mock('../utils/exporter', () => ({
  buildCSV: vi.fn().mockReturnValue('csv-content'),
  downloadCSV: vi.fn(),
}))

import { generatePdf } from '../utils/pdfReport'
import { downloadCSV } from '../utils/exporter'

const TWO_STAYS = [
  { arrival: new Date('2024-01-01T12:00:00'), departure: new Date('2024-02-01T12:00:00'), days: 32, port: 'JFK', exitPort: 'LAX', isOngoing: false },
  { arrival: new Date('2024-06-01T12:00:00'), departure: new Date('2024-07-01T12:00:00'), days: 31, port: 'SFO', exitPort: 'ORD', isOngoing: false },
]

const MOCK_RESULTS = {
  stays: TWO_STAYS,
  totals: { total: 63, beforePR: null, afterPR: null, currentlyInUS: false },
  byYear: [{ year: 2024, days: 63, stays: 2 }],
  byMonth: [{ year: 2024, month: 1, days: 32 }],
  rolling: [{ year: 2024, days: 63, meetsThreshold: false }],
  visitStats: { avgDuration: 31, avgGap: 119, minDuration: 31, maxDuration: 32, count: 2 },
  entries: [{ date: new Date('2024-01-01T12:00:00'), type: 'Arrival', port: 'JFK' }],
  warnings: [],
}

function Wrapper({ children }) {
  return <LangProvider>{children}</LangProvider>
}

beforeEach(() => {
  localStorage.setItem('i94-lang', 'en')
  vi.clearAllMocks()
  generatePdf.mockResolvedValue(undefined)
})

describe('OverviewActions', () => {
  it('calls onGoToStays when the view-stays button is clicked', () => {
    const onGoToStays = vi.fn()
    render(
      <Wrapper>
        <OverviewActions
          stays={TWO_STAYS} byYear={MOCK_RESULTS.byYear} byMonth={MOCK_RESULTS.byMonth}
          results={MOCK_RESULTS} lang="en" onGoToStays={onGoToStays}
        />
      </Wrapper>
    )
    fireEvent.click(screen.getByText(/View Stay Details/i))
    expect(onGoToStays).toHaveBeenCalledOnce()
  })

  it('shows the stay count in the view-stays description', () => {
    render(
      <Wrapper>
        <OverviewActions
          stays={TWO_STAYS} byYear={[]} byMonth={[]}
          results={MOCK_RESULTS} lang="en" onGoToStays={() => {}}
        />
      </Wrapper>
    )
    expect(screen.getByText(/all 2 stays/i)).toBeInTheDocument()
  })

  it('triggers a CSV download when the CSV button is clicked', () => {
    render(
      <Wrapper>
        <OverviewActions
          stays={TWO_STAYS} byYear={MOCK_RESULTS.byYear} byMonth={MOCK_RESULTS.byMonth}
          results={MOCK_RESULTS} lang="en" onGoToStays={() => {}}
        />
      </Wrapper>
    )
    fireEvent.click(screen.getByText(/Export CSV/i))
    expect(downloadCSV).toHaveBeenCalledOnce()
  })

  it('shows generating state while PDF is being created', async () => {
    let resolve
    generatePdf.mockReturnValueOnce(new Promise(r => { resolve = r }))
    render(
      <Wrapper>
        <OverviewActions
          stays={TWO_STAYS} byYear={[]} byMonth={[]}
          results={MOCK_RESULTS} lang="en" onGoToStays={() => {}}
        />
      </Wrapper>
    )
    fireEvent.click(screen.getByText(/Export PDF Report/i))
    expect(await screen.findByText(/Generating/i)).toBeInTheDocument()
    resolve()
    await waitFor(() => expect(screen.getByText(/Export PDF Report/i)).toBeInTheDocument())
  })

  it('disables the PDF button while generating', async () => {
    let resolve
    generatePdf.mockReturnValueOnce(new Promise(r => { resolve = r }))
    render(
      <Wrapper>
        <OverviewActions
          stays={TWO_STAYS} byYear={[]} byMonth={[]}
          results={MOCK_RESULTS} lang="en" onGoToStays={() => {}}
        />
      </Wrapper>
    )
    const pdfBtn = screen.getByText(/Export PDF Report/i).closest('button')
    fireEvent.click(pdfBtn)
    await screen.findByText(/Generating/i)
    expect(pdfBtn).toBeDisabled()
    resolve()
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
npm test -- OverviewActions
```

Expected: FAIL — `OverviewActions` module not found.

- [ ] **Step 3: Create `src/components/OverviewActions.jsx`**

```jsx
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
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npm test -- OverviewActions
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/OverviewActions.jsx src/components/OverviewActions.test.jsx
git commit -m "feat: add OverviewActions component with CSV, PDF, and navigation buttons"
```

---

## Task 5: Wire up I94Calculator.jsx

**Files:**
- Modify: `src/components/I94Calculator.jsx`
- Delete: `src/components/ExportButton.jsx`

- [ ] **Step 1: Open `src/components/I94Calculator.jsx` and make all changes at once**

Change line 7 (add `lang` to hook destructuring):
```js
// before
const { t } = useLang()
// after
const { t, lang } = useLang()
```

Remove line 13 (`import ExportButton`):
```js
// delete this line entirely:
import ExportButton   from './ExportButton'
```

Add new import after line 13:
```js
import OverviewActions from './OverviewActions'
```

Replace the `{hasData && ...}` block inside `activeTab === 'stays'` (lines 91–101) — remove the ExportButton wrapper, keep only StaysTable:
```jsx
// before
{hasData && (
  <>
    <div className="flex justify-end">
      <ExportButton
        stays={results.stays}
        byYear={results.byYear}
        byMonth={results.byMonth}
      />
    </div>
    <StaysTable stays={results.stays} warnings={results.warnings} />
  </>
)}
// after
{hasData && (
  <StaysTable stays={results.stays} warnings={results.warnings} />
)}
```

Replace the Overview tab render (lines 104–106) — wrap OverviewTab + OverviewActions in a fragment:
```jsx
// before
{activeTab === 'overview' && (hasData
  ? <OverviewTab results={results} onGoToByYear={() => setActiveTab('byyear')} />
  : noDataMsg
)}
// after
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
```

- [ ] **Step 2: Delete the now-unused ExportButton component**

```bash
rm src/components/ExportButton.jsx
```

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

Expected: all existing tests pass. The I94Calculator input-persistence tests must still pass — confirm "preserves textarea content" and "preserves PR date" both show PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/I94Calculator.jsx
git rm src/components/ExportButton.jsx
git commit -m "feat: wire OverviewActions into I94Calculator, remove standalone ExportButton"
```

---

## Task 6: End-to-end smoke test

- [ ] **Step 1: Start the dev server and do a full walkthrough**

```bash
npm run dev
```

Open `http://localhost:5173`. Paste a multi-year I-94 history sample and click Calculate.

Checklist:
- [ ] App navigates to Overview tab after Calculate
- [ ] Three action cards appear below the Overview content
- [ ] "View Stay Details" button navigates to the Stays tab
- [ ] Stays tab no longer shows a CSV export button above the table
- [ ] "Export CSV" button downloads a `.csv` file (open in Excel and verify data)
- [ ] "Export PDF Report" button shows "Generating…" while working, then downloads `i94_report_YYYY-MM-DD.pdf`
- [ ] PDF contains all 7 chapters with blue header and page numbers
- [ ] Switch to 中文 mode, export PDF again — all text is in Chinese, Chinese characters render without squares

- [ ] **Step 2: Verify embed mode is unaffected**

Open `http://localhost:5173/?embed=true`. Enter data and calculate. Confirm:
- No OverviewActions bar appears in the embed layout
- No console errors

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: pdf export feature complete"
```
