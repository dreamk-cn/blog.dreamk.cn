'use client'

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { HeroUIProvider, ToastProvider } from "@heroui/react";


export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}


export function AppProviders({ children, themeProps }: ProvidersProps) {
  const router = useRouter()

  return (
    <SessionProvider>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>
          <ToastProvider placement="top-right" toastOffset={65} />
          {children}
        </NextThemesProvider>
      </HeroUIProvider>
    </SessionProvider>
  )
}