# PDF Export Feature Design

**Date:** 2026-04-26  
**Status:** Approved

## Overview

Add a PDF report export feature to the I-94 U.S. Presence Calculator. Users can generate a complete, branded PDF report covering all analysis data, suitable for archiving or submitting to an attorney.

## User-Facing Changes

### Button Placement

Remove the existing CSV export button from inside the Stays tab. Add a new **OverviewActions** section at the bottom of the Overview tab containing three side-by-side action cards:

| Button | Title | Subtitle |
|--------|-------|----------|
| Navigate | 查看入境记录明细 / View Stay Details | 浏览所有 XX 次入境的完整时间线 / Browse the complete timeline of all XX stays |
| CSV Export | 导出 CSV / Export CSV | 在 Excel 中打开，方便自行筛选和整理 / Open in Excel for filtering and analysis |
| PDF Export | 导出 PDF 报告 / Export PDF Report | 生成完整分析报告，适合存档或向律师提交 / Generate a complete report for archiving or attorney submission |

The "View Stay Details" button navigates to the Stays tab (replacing the existing `onGoToByYear`-style prop pattern with a single `onGoToStays` callback). The PDF button shows a loading state ("生成中… / Generating…") while the PDF is being created.

The OverviewActions section is only rendered when results are available.

## PDF Report Structure

The PDF is a single multi-page document with a branded blue header and page numbers in the footer.

### Cover Header (every page)
- Report title: "I-94 在美天数分析报告 / I-94 U.S. Presence Report"
- Generation date
- One-line disclaimer

### Chapter 1: Overview
- Stat cards: total days, total stays, currently in U.S., first entry year
- PR split (before/after PR date) — shown only if user entered a PR date
- Continuous residence status badge (green / amber / red)
- 5-year rolling window progress toward 913-day threshold

### Chapter 2: Stay Records
- Full table: arrival date, departure date, days, entry port, exit port, status (Ongoing / Completed)

### Chapter 3: Year & Month Breakdown
- Year summary table: year, days in U.S., number of stays
- Month summary table: year, month, days in U.S.

### Chapter 4: IRS Substantial Presence Test
- SPT calculation for the current year: days in year Y, ⌊days in Y-1 ÷ 3⌋, ⌊days in Y-2 ÷ 6⌋, total score
- Resident / non-resident conclusion

### Chapter 5: Residence Continuity
- Longest single stay (arrival → departure, total days)
- Top absences table (departed, returned, days away, risk flag for >180 days or >365 days)

### Chapter 6: 5-Year Rolling Window
- Table: year, rolling days, meets 913-day threshold (yes/no)

### Chapter 7: Visit Statistics
- Average stay duration, average gap between stays, shortest stay, longest stay, total visit count

### Footer (every page)
- Page number (e.g., "1 / 8")
- Short disclaimer: "For reference only. Consult an immigration attorney for legal advice."

## Technical Design

### New Files

| File | Purpose |
|------|---------|
| `src/assets/fonts/NotoSansSC-Regular.ttf` | Noto Sans SC font for Chinese + Latin character rendering |
| `src/utils/pdfReport.jsx` | `@react-pdf/renderer` document component + `generatePdf({ results, lang })` async function |
| `src/components/PdfExportButton.jsx` | PDF export button with loading state |
| `src/components/OverviewActions.jsx` | Three-button action bar rendered at the bottom of OverviewTab |

### Modified Files

| File | Change |
|------|--------|
| `src/components/OverviewTab.jsx` | Add `<OverviewActions>` at bottom; accept `onGoToStays` prop instead of `onGoToByYear` |
| `src/components/I94Calculator.jsx` | Remove `<ExportButton>` from Stays tab; pass `onGoToStays` callback to OverviewTab |
| `src/i18n/strings.js` | Add ~10 new translation keys for button labels, PDF chapter titles, and footer disclaimer |

### Dependencies

- `@react-pdf/renderer` (new)
- `Noto Sans SC` TTF font file (placed in `src/assets/fonts/`)

### i18n

`pdfReport.jsx` cannot use React hooks. It receives a `lang` string parameter and imports the strings object from `strings.js` directly, selecting the appropriate language object. No new translation infrastructure is needed.

### PDF Generation Flow

```
User clicks "Export PDF Report"
  → PdfExportButton sets loading = true
  → generatePdf({ results, lang }) runs asynchronously
      → @react-pdf/renderer renders the document tree → Blob
  → Browser download triggered: i94_report_YYYY-MM-DD.pdf
  → PdfExportButton sets loading = false
```

### Font Strategy

Register `NotoSansSC-Regular.ttf` with `@react-pdf/renderer`'s `Font.register()` once at module load. All text in the PDF document uses this single font family, ensuring consistent Chinese and Latin rendering.

## Out of Scope

- Charts or bar graphs in the PDF (year bars from Overview are represented as a table)
- Custom date range section (interactive-only, excluded from PDF)
- Embed mode (`?embed=true`) — OverviewActions is not rendered in embed mode
