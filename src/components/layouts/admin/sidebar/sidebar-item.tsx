import { AppLink } from "@/components/ui/app-link";
import React from "react";
import { useSidebarContext } from "../layout-content";
import clsx from "clsx";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href?: string;
}

export const SidebarItem = ({ icon, title, isActive, href = "" }: Props) => {
  const { setCollapsed } = useSidebarContext();

  const handleClick = () => {
    if (window.innerWidth < 768) {
      setCollapsed();
    }
  };
  return (
    <AppLink href={href} className="max-w-full text-text-base active:bg-none">
      <div
        className={clsx(
          isActive ? "bg-primary/10 text-primary [&_svg_path]:fill-current" : "hover:bg-canvas",
          "flex h-full min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-xl px-3.5 transition-all duration-150 active:scale-[0.98]"
        )}
        onClick={handleClick}
      >
        {icon}
        <span className="text-text-base">{title}</span>
      </div>
    </AppLink>
  );
};
