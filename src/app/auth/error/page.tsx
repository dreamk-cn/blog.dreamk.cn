import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { buildCanonical, buildNoIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "登录失败",
  description: `${siteConfig.name} 博客登录流程出现错误，请返回后重试。`,
  alternates: buildCanonical("/auth/error"),
  robots: buildNoIndexRobots(),
};

export default function Error() {
  return <h1>Failed to Sign In</h1>;
}
