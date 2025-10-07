import React from "react"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = React.useState<ToasterProps["theme"]>("system")

  React.useEffect(() => {
    try {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
      setTheme(isDark ? "dark" : "light")
    } catch {
      setTheme("system")
    }
  }, [])

  return (
    <Sonner
      theme={theme}
      position="top-center"
      className="toaster group"
      toastOptions={{
        duration: 2000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
