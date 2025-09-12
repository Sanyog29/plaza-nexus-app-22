import * as React from "react"
import { ThemeProvider as NextThemeProvider } from "next-themes"

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: "class" | "data-theme"
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({ 
  children, 
  attribute = "class",
  defaultTheme = "system", 
  enableSystem = true,
  disableTransitionOnChange = false, // Enable smooth transitions
  ...props 
}: ThemeProviderProps) {
  // Prevent flash of wrong theme on initial load
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme && savedTheme !== 'system') {
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    } else if (savedTheme === 'system' || !savedTheme) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', systemTheme)
    }
  }, [])

  return (
    <NextThemeProvider 
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      storageKey="theme"
      {...props}
    >
      {children}
    </NextThemeProvider>
  )
}