"use client";

import { Drawer, DrawerContent, DrawerBody, Button, useDisclosure } from "@heroui/react";
import { type ReactNode } from "react";

export function MobileSidebarDrawer({ children }: { children: ReactNode }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Button
        isIconOnly
        aria-label={isOpen ? "收起侧边栏" : "展开侧边栏"}
        className="fixed top-1/2 z-[70] h-10 w-10 -translate-y-1/2 rounded-full border border-default-200/80 bg-content1 text-default-700 shadow-md transition-all duration-300 lg:hidden"
        style={{
          left: isOpen ? "calc(min(82vw, 320px) - 20px)" : "-20px",
        }}
        onPress={onOpen}
        variant="flat"
      >
        <span className="text-xl leading-none">›</span>
      </Button>

      <Drawer 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        placement="left"
        size="xs"
        classNames={{
          base: "max-w-[320px] w-[82vw]",
          body: "p-4",
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerBody>
                {children}
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
