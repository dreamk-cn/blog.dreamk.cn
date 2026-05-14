import type { Metadata } from "next";
import { buildCanonical, buildNoIndexRobots } from "@/lib/seo";
import { SignInClient } from "./signin-client";

export const metadata: Metadata = {
  title: "登录",
  description: "登录或注册 Dreamk 博客账号。",
  alternates: buildCanonical("/auth/signin"),
  robots: buildNoIndexRobots(),
};

export default function SignIn() {
  return <SignInClient />;
}
