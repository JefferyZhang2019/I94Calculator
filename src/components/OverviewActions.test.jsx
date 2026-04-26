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
