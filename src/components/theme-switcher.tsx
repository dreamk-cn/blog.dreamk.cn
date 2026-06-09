"use client";

import { FC } from "react";
import clsx from "clsx";
import { useTheme } from "next-themes";

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
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const onToggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      aria-label={mounted ? (isDark ? "切换到浅色模式" : "切换到深色模式") : "切换主题"}
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
        ) : isDark ? (
          <MoonFilledIcon size={22} />
        ) : (
          <SunFilledIcon size={22} />
        )}
      </div>
    </button>
  );
};
