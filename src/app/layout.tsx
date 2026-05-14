import "@/styles/globals.css";
import type { Metadata } from "next";
import { AppProviders } from "./providers";
import { siteConfig } from "@/config/site";
import { geistMono, notoSansSc } from "@/config/fonts";
import { buildCanonical, buildIndexRobots, buildSiteJsonLd, getMetadataBase, stringifyJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: buildCanonical("/"),
  robots: buildIndexRobots(),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteJsonLd = buildSiteJsonLd();

  return (
    <html suppressHydrationWarning lang="zh">
      <head>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(siteJsonLd) }}
        />
      </head>
      <body
        className={`${notoSansSc.variable} ${geistMono.variable} antialiased duration-200`}
      >
        <AppProviders>
          { children }
        </AppProviders>
      </body>
    </html>
  );
}
