import { useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

export function useAutoTheme() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Only set to system theme on first load if no preference is saved
    const savedTheme = localStorage.getItem("app-theme");
    if (!savedTheme) {
      setTheme("system");
    }
  }, []);

  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return { theme, setTheme };
}
