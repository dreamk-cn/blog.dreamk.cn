'use client'

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastProvider } from "@heroui/react";
import NextTopLoader from "nextjs-toploader";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function AppProviders({ children, themeProps }: ProvidersProps) {
  return (
    <SessionProvider>
      <NextTopLoader color="var(--color-primary)" showSpinner={false} height={3} />
      <NextThemesProvider {...themeProps}>
        <ToastProvider placement="top-right" toastOffset={65} />
        {children}
      </NextThemesProvider>
    </SessionProvider>
  )
}