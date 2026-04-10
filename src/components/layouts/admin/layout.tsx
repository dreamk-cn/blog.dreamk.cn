"use client";
// author: https://github.com/Siumauricio/nextui-dashboard-template
import React from "react";
import { useLockedBody } from "../../hooks/useBodyLock";
import { NavbarWrapper } from "./navbar/navbar";
import { SidebarWrapper } from "./sidebar/sidebar";
import { SidebarContext } from "./layout-content";
import NoSsr from "../no-ssr";

interface Props {
  children: React.ReactNode;
}

export const Layout = ({ children }: Props) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setLocked] = useLockedBody(false);
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setLocked(!sidebarOpen);
  };

  return (
    <NoSsr>
      <SidebarContext.Provider
        value={{
          collapsed: sidebarOpen,
          setCollapsed: handleToggleSidebar,
        }}>
        <section className='flex'>
          <SidebarWrapper />
          <NavbarWrapper>{children}</NavbarWrapper>
        </section>
      </SidebarContext.Provider>
    </NoSsr>
  );
};
