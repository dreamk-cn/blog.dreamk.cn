import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PasswordForm } from "@/components/auth/password-form";
import { auth } from "@/auth";
import { siteConfig } from "@/config/site";
import { buildCanonical, buildNoIndexRobots } from "@/lib/seo";
import { getAccountSecurity } from "@/services/user-service";

export const metadata: Metadata = {
  title: "账号设置",
  description: `管理 ${siteConfig.name} 账号密码。`,
  alternates: buildCanonical("/account"),
  robots: buildNoIndexRobots(),
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/account");
  }

  const account = await getAccountSecurity(session.user.id);
  if (!account) {
    redirect("/auth/signin?callbackUrl=/account");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-text-base">账号设置</h1>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">用户名</dt>
            <dd className="text-text-base">{account.name || "未设置"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">邮箱</dt>
            <dd className="text-text-base">{account.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">密码</dt>
            <dd className="text-text-base">
              {account.hasPassword ? "已设置" : "未设置"}
            </dd>
          </div>
        </dl>

        <div className="mt-8 border-t border-border pt-6">
          <h2 className="mb-4 text-lg font-medium text-text-base">
            {account.hasPassword ? "修改密码" : "设置密码"}
          </h2>
          <PasswordForm hasPassword={account.hasPassword} />
        </div>
      </div>
    </div>
  );
}
