import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

/**
 * Hook for advanced theme management with system preference detection
 * and improved accessibility features
 */
export function useThemePreference() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const changeTheme = (newTheme: string) => {
    if (!mounted) return

    // Disable transitions if user prefers reduced motion
    if (prefersReducedMotion) {
      document.documentElement.classList.add('theme-switching')
    }
    
    setTheme(newTheme)
    
    // Re-enable transitions after theme change
    if (prefersReducedMotion) {
      setTimeout(() => {
        document.documentElement.classList.remove('theme-switching')
      }, 50)
    }
  }

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    changeTheme(newTheme)
  }

  return {
    theme,
    systemTheme,
    resolvedTheme,
    mounted,
    prefersReducedMotion,
    changeTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system'
  }
}