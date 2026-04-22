"use client";

import { FC, useEffect, useState } from "react";
import clsx from "clsx";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

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
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("theme");
    const preferredTheme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    root.classList.toggle("dark", preferredTheme === "dark");
    setTheme(preferredTheme);
    setMounted(true);
  }, []);

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
