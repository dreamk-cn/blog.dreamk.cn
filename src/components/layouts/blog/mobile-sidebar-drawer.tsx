"use client";

import { Drawer, DrawerContent, DrawerBody, Button } from "@heroui/react";
import { type ReactNode, useState } from "react";

export function MobileSidebarDrawer({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        isIconOnly
        aria-label={isOpen ? "收起侧边栏" : "展开侧边栏"}
        className="fixed top-1/2 z-[70] h-10 w-10 -translate-y-1/2 rounded-full border border-default-200/80 bg-content1 text-default-700 shadow-md transition-all duration-300 lg:hidden"
        style={{
          left: isOpen ? "calc(min(82vw, 320px) - 20px)" : "-20px",
        }}
        onPress={() => setIsOpen((prev) => !prev)}
        variant="flat"
      >
        <span className="text-xl leading-none">›</span>
      </Button>

      <Drawer
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="left"
        size="xs"
        className="max-w-[320px] w-[82vw]"
      >
        <DrawerContent>
          {() => (
            <DrawerBody className="p-4">{children}</DrawerBody>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
