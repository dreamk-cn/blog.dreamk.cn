import { tv } from '@heroui/react';

/** 盖住 FAB (z-[200])，与 admin 侧栏 (z-[202]) 同级策略 */
export const adminAgentDrawerBackdrop = tv({
  base: '!z-[210]',
});

export const adminAgentFab = tv({
  base: 'fixed bottom-6 right-6 z-[200]',
});

export const adminAgentDialog = tv({
  base: 'flex flex-col bg-background p-0',
  variants: {
    fullscreen: {
      true: '!w-screen !max-w-none',
      false: '!h-full !w-[90vw] !max-w-[90vw] md:!w-[60vw] md:!max-w-[60vw]',
    },
  },
  defaultVariants: {
    fullscreen: false,
  },
});

export const adminAgentDrawerHeader = tv({
  base: 'flex shrink-0 flex-row items-center justify-between gap-3 border-b border-border px-4 py-3',
});

/** HeroUI Drawer.Footer 默认为 flex-row justify-end，需强制纵向撑满以适配输入框 */
export const adminAgentDrawerFooter = tv({
  base: 'mt-0 !flex w-full shrink-0 !flex-col !items-stretch gap-0 border-t border-border p-0',
});

/** HeroUI CloseTrigger 默认为 absolute top-4 right-4，放入 header 工具栏时需 static */
export const adminAgentCloseTrigger = tv({
  base: '!static !top-auto !right-auto shrink-0',
});
