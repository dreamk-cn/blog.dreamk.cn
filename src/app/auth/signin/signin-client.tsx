"use client";

import { Suspense, useEffect, useState } from "react";
import { getProviders } from "next-auth/react";
import NextLink from "next/link";
import { Separator, Tabs, useIsMounted } from "@heroui/react";
import LoginForm from "@/components/auth/login-form";
import LoginButton from "@/components/buttons/login-button";
import RegisterForm from "@/components/auth/register-form";
import { LogoIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

type Providers = Awaited<ReturnType<typeof getProviders>>;

const renderLoginButtons = (providers: Providers | null) =>
  providers
    ? Object.values(providers)
        .filter((provider) => provider !== null)
        .filter(({ id }) => id !== "dreamk-credentials")
        .map((provider) => <LoginButton auth={provider} key={provider.id} />)
    : null;

export function SignInClient() {
  const [providers, setProviders] = useState<Providers | null>(null);
  const [selected, setSelected] = useState<string>("login");
  const isMounted = useIsMounted();

  useEffect(() => {
    async function fetchProviders() {
      const response = await getProviders();
      setProviders(response);
    }

    fetchProviders();
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[40rem] flex-col items-center bg-background p-8 sm:p-20">
      <div className="mb-8 flex w-full max-w-md items-center justify-between">
        <NextLink
          aria-label="返回首页"
          className="flex items-center gap-1 transition-opacity hover:opacity-80"
          href="/"
        >
          <LogoIcon className="dark:invert-90" height={34} width={34} />
          <span className="text-xl font-bold text-text-base">{siteConfig.name}</span>
        </NextLink>
        <NextLink
          className="text-sm text-text-muted transition-colors hover:text-accent"
          href="/"
        >
          返回首页
        </NextLink>
      </div>
      <Tabs
        className="w-full max-w-md"
        selectedKey={selected}
        onSelectionChange={(key) => setSelected(String(key))}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="登录或注册">
            <Tabs.Tab id="login" className="text-text-base">
              登录
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="register" className="text-text-base">
              <Tabs.Separator />
              注册
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="login" className="mt-4">
          <Suspense>
            <LoginForm />
          </Suspense>
        </Tabs.Panel>
        <Tabs.Panel id="register" className="mt-4">
          <Suspense>
            <RegisterForm />
          </Suspense>
        </Tabs.Panel>
      </Tabs>
      <div className="my-4 flex w-full items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-small text-text-muted">或</span>
        <Separator className="flex-1" />
      </div>
      <div className="flex flex-col items-center gap-y-4">{renderLoginButtons(providers)}</div>
    </div>
  );
}
