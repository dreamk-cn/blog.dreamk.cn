import "@/styles/globals.css";
import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_SC } from "next/font/google";
import { AppProviders } from "./providers";
import Head from "next/head";
import { siteConfig } from "@/config/site";

const geistMono = Geist_Mono({
  variable: "--font-en",
  subsets: ["latin"],
});

const notoSansSc = Noto_Sans_SC({
  variable: "--font-cn",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="zh">
      <Head>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
      </Head>
      <body
        className={`${notoSansSc.variable} ${geistMono.variable} antialiased duration-200`}
      >
        <AppProviders themeProps={{attribute: 'class', defaultTheme: 'dark'}}>
          { children }
        </AppProviders>
      </body>
    </html>
  );
}
