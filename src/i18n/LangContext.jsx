import { createContext, useContext, useState } from 'react'
import { strings } from './strings'

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_ZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export const LangContext = createContext()

export function LangProvider({ children }) {
  const defaultLang = typeof navigator !== 'undefined' && navigator.language.startsWith('zh') ? 'zh' : 'en'
  const [lang, setLang] = useState(
    () => (typeof localStorage !== 'undefined' && localStorage.getItem('i94-lang')) || defaultLang
  )

  const t = key => strings[lang][key] ?? key

  const tpl = (key, vars) => {
    let s = strings[lang][key] ?? key
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(`{${k}}`, String(v))
    }
    return s
  }

  const fmtDate = date => {
    if (lang === 'zh') {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    }
    return `${MONTHS_EN[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  const monthName = monthNum =>
    (lang === 'zh' ? MONTHS_ZH : MONTHS_EN)[monthNum - 1]

  const switchLang = l => {
    setLang(l)
    if (typeof localStorage !== 'undefined') localStorage.setItem('i94-lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, t, tpl, fmtDate, monthName, switchLang }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
