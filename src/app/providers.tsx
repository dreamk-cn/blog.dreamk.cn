import {ThemeProvider} from "next-themes";
import React from "react";

export async function AppProviders({ children }: { children: React.ReactNode}) {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      { children }
    </ThemeProvider>
  )
}