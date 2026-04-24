'use client'

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { Toast } from "@heroui/react";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "next-themes";

export interface ProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <NextTopLoader color="var(--color-primary)" showSpinner={false} height={3} />
        <Toast.Provider placement="top" className="pt-16" />
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}