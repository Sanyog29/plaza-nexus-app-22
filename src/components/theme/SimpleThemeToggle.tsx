import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

/**
 * Simple toggle button that switches between light and dark themes only
 * Alternative to the dropdown version for simpler use cases
 */
export function SimpleThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const handleThemeChange = () => {
    // Add class to disable transitions during theme change
    document.documentElement.classList.add('theme-switching')
    
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    
    // Re-enable transitions after theme change
    setTimeout(() => {
      document.documentElement.classList.remove('theme-switching')
    }, 100)
  }

  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size="icon" 
        aria-label="Loading theme toggle" 
        className="opacity-50 pointer-events-none"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button 
      variant="outline" 
      size="icon"
      onClick={handleThemeChange}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="relative overflow-hidden"
    >
      <Sun 
        className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" 
        aria-hidden="true"
      />
      <Moon 
        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" 
        aria-hidden="true"
      />
    </Button>
  )
}