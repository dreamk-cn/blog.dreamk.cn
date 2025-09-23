import { Geist_Mono, Noto_Sans_SC } from "next/font/google";

export const geistMono = Geist_Mono({
  variable: "--font-en",
  subsets: ["latin"],
});

export const notoSansSc = Noto_Sans_SC({
  variable: "--font-cn",
  subsets: ["latin"],
})
