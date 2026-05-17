import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    if (theme === "dark") setTheme("light")
    else setTheme("dark")
  }

  return (
    <Button variant="outline" size="icon" onClick={cycle}>
      {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem]" />}
      {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem]" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}