"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return
  const root = window.document.documentElement
  const systemPrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches
  const resolved: Theme = theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme

  if (resolved === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
  root.setAttribute("data-theme-mode", resolved)
  root.style.colorScheme = resolved === "dark" ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system")

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem("mk_theme") as Theme | null
      if (stored) {
        setThemeState(stored)
        applyTheme(stored)
        return
      }
    } catch {
      // ignore
    }
    applyTheme("system")
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (theme !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next)
    try {
      window.localStorage.setItem("mk_theme", next)
    } catch {
      // ignore
    }
    applyTheme(next)
  }, [])

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    return {
      theme: "system",
      setTheme: applyTheme,
    }
  }
  return ctx
}


