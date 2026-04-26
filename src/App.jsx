import { useState } from 'react'
import { LangProvider, useLang } from './i18n/LangContext'
import I94Calculator from './components/I94Calculator'
import { version } from '../package.json'

function AppContent() {
  const { t, lang, switchLang } = useLang()
  const embed = new URLSearchParams(window.location.search).get('embed') === 'true'
  const [activeTab, setActiveTab] = useState('stays')

  if (embed) {
    return (
      <>
        <I94Calculator activeTab={activeTab} setActiveTab={setActiveTab} embed />
        <div className="text-center text-gray-400 text-xs py-2">v{version}</div>
      </>
    )
  }

  const tabs = [
    { id: 'stays',    label: t('tabStays') },
    { id: 'overview', label: t('tabOverview') },
    { id: 'byyear',   label: t('tabByYear') },
    { id: 'analysis', label: t('tabAnalysis') },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb]">
        <div className="max-w-7xl mx-auto px-4 pt-5 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{t('appTitle')}</h1>
              <p className="text-blue-200 text-xs mt-0.5">{t('appSubtitle')}</p>
            </div>
            <div className="flex gap-1 items-center mt-1">
              <button
                onClick={() => switchLang('en')}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  lang === 'en'
                    ? 'bg-white text-blue-900 font-semibold'
                    : 'text-blue-200 hover:text-white'
                }`}
              >EN</button>
              <button
                onClick={() => switchLang('zh')}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  lang === 'zh'
                    ? 'bg-white text-blue-900 font-semibold'
                    : 'text-blue-200 hover:text-white'
                }`}
              >中文</button>
            </div>
          </div>
          <nav className="flex gap-1 mt-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-50 text-gray-900'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <I94Calculator activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>

      <footer className="border-t border-gray-200 px-4 py-6 mt-8 max-w-7xl mx-auto text-xs text-gray-500">
        <p className="font-semibold mb-1">{t('disclaimerTitle')}</p>
        <p>{t('disclaimerBody')}</p>
        <p className="mt-2">
          {t('officialResources')}{' '}
          <a className="underline" href="https://i94.cbp.dhs.gov/search/history-search" target="_blank" rel="noreferrer">CBP I-94 History Search</a>
          {' · '}
          <a className="underline" href="https://i94.cbp.dhs.gov/help" target="_blank" rel="noreferrer">{t('linkCBPI94Help')}</a>
          {' · '}
          <a className="underline" href="https://www.uscis.gov/citizenship" target="_blank" rel="noreferrer">{t('linkUSCISCitizenship')}</a>
          {' · '}
          <a className="underline" href="https://www.irs.gov/individuals/international-taxpayers/determining-alien-tax-status" target="_blank" rel="noreferrer">IRS: Alien Tax Status</a>
        </p>
        <p className="mt-3 text-gray-400">v{version}</p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AppContent />
    </LangProvider>
  )
}
