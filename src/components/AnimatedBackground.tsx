import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";

export function AnimatedBackground() {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      if (theme === "dark") {
        setIsDark(true);
      } else if (theme === "light") {
        setIsDark(false);
      } else {
        setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    };

    updateTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        setIsDark(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <>
      {/* Light Mode Background */}
      <div className={`fixed inset-0 -z-20 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-50" />

        {/* Soft orbs for light mode */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-cyan-300/30 to-blue-300/30 rounded-full filter blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-emerald-300/25 to-teal-300/25 rounded-full filter blur-3xl" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#11182708_1px,transparent_1px),linear-gradient(to_bottom,#11182708_1px,transparent_1px)] bg-[size:18px_28px]" />
      </div>

      {/* Dark Mode Background */}
      <div className={`fixed inset-0 -z-20 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-zinc-950" />

        {/* Sleek glow layers */}
        <div className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-br from-cyan-500/18 to-blue-500/18 rounded-full filter blur-3xl" />
        <div className="absolute bottom-16 right-12 w-96 h-96 bg-gradient-to-br from-emerald-500/14 to-teal-500/14 rounded-full filter blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-[420px] h-[420px] bg-gradient-to-br from-slate-700/10 to-slate-900/10 rounded-full filter blur-3xl" />

        {/* Subtle dots */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/70" />
      </div>
    </>
  );
}
