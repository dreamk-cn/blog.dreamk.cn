"use client";

import { FC } from "react";
import { useTheme } from "next-themes";
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
  const { setTheme, resolvedTheme } = useTheme();
  const isLight = resolvedTheme !== "dark";

  const onToggleTheme = () => {
    setTheme(isLight ? "dark" : "light");
  };

  return (
    <button
      type="button"
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
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
            "mx-0 flex h-auto w-auto items-center justify-center rounded-lg bg-transparent px-0 pt-px text-default-500",
          ],
          classNames?.wrapper,
        )}
      >
        {isLight ? (
          <SunFilledIcon size={22} />
        ) : (
          <MoonFilledIcon size={22} />
        )}
      </div>
    </button>
  );
};
