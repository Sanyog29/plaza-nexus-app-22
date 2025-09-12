import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  // Handle theme switching with smooth transitions
  const handleThemeChange = (newTheme: string) => {
    // Add class to disable transitions during theme change
    document.documentElement.classList.add('theme-switching')
    
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

  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          aria-label={`Current theme: ${theme}. Click to change theme`}
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
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-background border border-border shadow-lg z-50 min-w-[140px]"
        role="menu"
        aria-label="Theme selection"
      >
        <DropdownMenuItem 
          onClick={() => handleThemeChange("light")}
          className="cursor-pointer hover:bg-muted focus:bg-muted"
          role="menuitem"
          aria-current={theme === "light" ? "true" : undefined}
        >
          <Sun className="h-4 w-4 mr-2" aria-hidden="true" />
          <span>Light</span>
          {theme === "light" && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange("dark")}
          className="cursor-pointer hover:bg-muted focus:bg-muted"
          role="menuitem"
          aria-current={theme === "dark" ? "true" : undefined}
        >
          <Moon className="h-4 w-4 mr-2" aria-hidden="true" />
          <span>Dark</span>
          {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange("system")}
          className="cursor-pointer hover:bg-muted focus:bg-muted"
          role="menuitem"
          aria-current={theme === "system" ? "true" : undefined}
        >
          <Monitor className="h-4 w-4 mr-2" aria-hidden="true" />
          <span>System</span>
          {theme === "system" && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}