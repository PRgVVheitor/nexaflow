import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { applyTheme, getStoredTheme } from "../lib/theme";
import { Button } from "./ui";

export function ThemeToggle() {
  const [theme, setTheme] = useState(getStoredTheme);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <Button
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-pressed={theme === "light"}
      size="icon"
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      type="button"
      variant="ghost"
      onClick={toggle}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </Button>
  );
}
