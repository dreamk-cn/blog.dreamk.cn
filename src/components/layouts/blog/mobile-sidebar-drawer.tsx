"use client";

import { Drawer, DrawerBody, Button, useOverlayState } from "@heroui/react";
import { type ReactNode } from "react";

export function MobileSidebarDrawer({ children }: { children: ReactNode }) {
  const drawerState = useOverlayState({ defaultOpen: false });

  return (
    <>
      <Button
        isIconOnly
        aria-label={drawerState.isOpen ? "收起侧边栏" : "展开侧边栏"}
        className="fixed top-1/2 z-[70] h-10 w-10 -translate-y-1/2 rounded-full border border-default-200/80 bg-content1 text-default-700 shadow-md transition-all duration-300 lg:hidden"
        style={{
          left: drawerState.isOpen ? "calc(min(82vw, 320px) - 20px)" : "-20px",
        }}
        onPress={drawerState.toggle}
        variant="ghost"
      >
        <span className="text-xl leading-none">›</span>
      </Button>

      <Drawer state={drawerState}>
        <Drawer.Backdrop />
        <Drawer.Content placement="left" className="max-w-[320px] w-[82vw]">
          <Drawer.Dialog>
            <DrawerBody className="p-4">{children}</DrawerBody>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer>
    </>
  );
}
