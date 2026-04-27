import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'nt_dark_mode'

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Espelho do `toggleDarkMode` em `js/app.js` — classe em `document.body`. */
export function useLegacyDarkMode() {
  const [dark, setDarkState] = useState(readStored)

  useEffect(() => {
    document.body.classList.toggle('dark-mode', dark)
    try {
      localStorage.setItem(STORAGE_KEY, String(dark))
    } catch {
      /* ignore */
    }
  }, [dark])

  const setDark = useCallback((next: boolean) => setDarkState(next), [])
  const toggle = useCallback(() => setDarkState((d) => !d), [])

  return { dark, setDark, toggle }
}
