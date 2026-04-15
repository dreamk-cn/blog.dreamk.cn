import React from "react";
import { BurguerButton } from "./burguer-button";
import { UserDropdown } from "./user-dropdown";
import { ThemeSwitch } from "@/components/theme-switcher";

interface Props {
  children: React.ReactNode;
}

export const NavbarWrapper = ({ children }: Props) => {
  return (
    <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
      <header className="flex w-full items-center justify-between gap-3 border-b border-default-200 bg-background px-4 py-3">
        <div className="flex md:hidden">
          <BurguerButton />
        </div>
        <div className="hidden w-full max-md:hidden md:flex md:justify-end">
          <ThemeSwitch />
        </div>
        <div className="flex w-fit shrink-0 items-center justify-end gap-2 md:ml-auto">
          <UserDropdown />
        </div>
      </header>
      {children}
    </div>
  );
};
