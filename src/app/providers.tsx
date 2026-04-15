'use client'

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toast } from "@heroui/react";
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
          <Toast.Provider placement="top end" className="pt-16" />
        {children}
      </NextThemesProvider>
    </SessionProvider>
  )
}