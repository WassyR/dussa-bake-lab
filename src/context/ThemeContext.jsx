import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'dussa.theme.v1'
const ThemeContext = createContext(null)
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export const THEMES = [
  { id: 'bright', label: 'Bright', hint: 'Warm ivory and cream' },
  { id: 'chocolate', label: 'Chocolate', hint: 'Deep cocoa and gold' },
]

function readStored() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'chocolate' || saved === 'bright' ? saved : 'bright'
  } catch {
    return 'bright'
  }
}

/**
 * Two looks for the same site. Bright is the default; Chocolate is the darker
 * original. The choice sits on <html data-theme> so the CSS variables in
 * index.css do the rest, and it is remembered between visits.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('bright')
  const [restored, setRestored] = useState(false)

  // Match the pre-rendered HTML, then restore preferences before client paint.
  useBrowserLayoutEffect(() => {
    setThemeState(readStored())
    setRestored(true)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    // Keeps the browser chrome on mobile in step with the page.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'bright' ? '#FDF4E9' : '#2A1810')
    if (!restored) return
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* private mode: the theme just will not persist */
    }
  }, [theme, restored])

  const setTheme = useCallback((next) => setThemeState(next), [])
  const toggle = useCallback(
    () => setThemeState((t) => (t === 'bright' ? 'chocolate' : 'bright')),
    [],
  )

  const value = useMemo(
    () => ({ theme, setTheme, toggle, isBright: theme === 'bright' }),
    [theme, setTheme, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}
