"use client";

import { FC, useEffect, useState } from "react";
import clsx from "clsx";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";
import { useMounted } from "@/hooks/useMounted";

type ThemeSwitchClassNames = {
  base?: string;
  wrapper?: string;
};

export interface ThemeSwitchProps {
  className?: string;
  classNames?: ThemeSwitchClassNames;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
  className,
  classNames,
}) => {
  const mounted = useMounted();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const isLight = theme !== "dark";

  const onToggleTheme = () => {
    const nextTheme: "light" | "dark" = isLight ? "dark" : "light";
    const root = document.documentElement;

    root.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      aria-label={mounted ? `Switch to ${isLight ? "dark" : "light"} mode` : "Toggle theme"}
      onClick={onToggleTheme}
      className={clsx(
        "cursor-pointer px-px transition-opacity hover:opacity-80",
        className,
        classNames?.base,
      )}
    >
      <div
        className={clsx(
          [
            "mx-0 flex h-auto w-auto items-center justify-center rounded-lg bg-transparent px-0 pt-px text-text-muted",
          ],
          classNames?.wrapper,
        )}
      >
        {!mounted ? (
          <MoonFilledIcon size={22} />
        ) : isLight ? (
          <SunFilledIcon size={22} />
        ) : (
          <MoonFilledIcon size={22} />
        )}
      </div>
    </button>
  );
};
