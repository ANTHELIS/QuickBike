import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import i18next from 'i18next'

export const CaptainSettingsContext = createContext()

const LANGUAGES = [
  { code: 'en-IN', label: 'English (IN)' },
  { code: 'en-UK', label: 'English (UK)' },
  { code: 'hi',    label: 'हिन्दी' },
  { code: 'bn',    label: 'বাংলা' },
  { code: 'ta',    label: 'தமிழ்' },
  { code: 'te',    label: 'తెలుగు' },
  { code: 'mr',    label: 'मराठी' },
]

export { LANGUAGES }

const CaptainSettingsProvider = ({ children }) => {
  /* ── dark mode ── */
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('captain_dark') === '1' }
    catch { return false }
  })

  /* ── language ── */
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('captain_lang') || 'en-IN' }
    catch { return 'en-IN' }
  })

  /* Sync dark class on <html> */
  useEffect(() => {
    const html = document.documentElement
    if (darkMode) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    try { localStorage.setItem('captain_dark', darkMode ? '1' : '0') }
    catch {}
  }, [darkMode])

  /* Persist language */
  useEffect(() => {
    try { 
      localStorage.setItem('captain_lang', language) 
      i18next.changeLanguage(language)
    }
    catch {}
  }, [language])

  const toggleDark = useCallback(() => setDarkMode(p => !p), [])

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  return (
    <CaptainSettingsContext.Provider value={{ darkMode, toggleDark, language, setLanguage, currentLang, LANGUAGES }}>
      {children}
    </CaptainSettingsContext.Provider>
  )
}

export const useCaptainSettings = () => useContext(CaptainSettingsContext)

export default CaptainSettingsProvider
