import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { LangProvider } from '../i18n/LangContext'
import I94Calculator from './I94Calculator'

const SAMPLE_INPUT = '1\t2025-03-15\tArrival\tJFK\n2\t2025-01-08\tDeparture\tLAX'

function Wrapper() {
  const [activeTab, setActiveTab] = useState('stays')
  return (
    <LangProvider>
      <button onClick={() => setActiveTab('stays')}>Go to Stays</button>
      <I94Calculator activeTab={activeTab} setActiveTab={setActiveTab} />
    </LangProvider>
  )
}

describe('I94Calculator input persistence', () => {
  beforeEach(() => {
    localStorage.setItem('i94-lang', 'en')
  })

  it('preserves textarea content after navigating away and back to stays tab', () => {
    render(<Wrapper />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: SAMPLE_INPUT } })
    expect(textarea).toHaveValue(SAMPLE_INPUT)

    // Click Calculate — internally calls setActiveTab('overview'), unmounting InputPanel
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }))

    // InputPanel is now unmounted
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

    // Navigate back to stays tab
    fireEvent.click(screen.getByRole('button', { name: 'Go to Stays' }))

    // Textarea must still have the original content
    expect(screen.getByRole('textbox')).toHaveValue(SAMPLE_INPUT)
  })

  it('preserves PR date after navigating away and back to stays tab', () => {
    render(<Wrapper />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: SAMPLE_INPUT } })

    const dateInput = screen.getByDisplayValue('')
    fireEvent.change(dateInput, { target: { value: '2023-06-15' } })

    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go to Stays' }))

    expect(screen.getByDisplayValue('2023-06-15')).toBeInTheDocument()
  })
})
