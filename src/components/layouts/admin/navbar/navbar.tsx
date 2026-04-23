import React from "react";
import { BurguerButton } from "./burguer-button";
import { UserDropdown } from "./user-dropdown";
import { ThemeSwitch } from "@/components/theme-switcher";

interface Props {
  children: React.ReactNode;
}

export const NavbarWrapper = ({ children }: Props) => {
  return (
    <div className="relative flex h-screen flex-1 flex-col overflow-hidden text-text-base">
      <header className="sticky top-0 z-20 flex w-full items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center md:hidden">
          <BurguerButton />
        </div>
        <div className="flex w-fit shrink-0 items-center justify-end gap-2 md:ml-auto">
          <ThemeSwitch />
          <UserDropdown />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto overflow-x-hidden text-text-base">{children}</main>
    </div>
  );
};
