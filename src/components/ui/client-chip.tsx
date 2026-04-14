"use client";

import { Chip } from "@heroui/react";
import type { ReactNode } from "react";

type ClientChipProps = {
  children: ReactNode;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  className?: string;
};

export function ClientChip({ children, color = "default", className }: ClientChipProps) {
  return (
    <Chip
      size="sm"
      color={color}
      variant="flat"
      classNames={{ base: `h-6 ${className ?? ""}`.trim() }}
    >
      {children}
    </Chip>
  );
}
