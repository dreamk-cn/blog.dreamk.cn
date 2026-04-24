"use client";

import { Suspense, useEffect, useState } from "react";

import { getProviders } from "next-auth/react";
import { Separator, Tabs, useIsMounted } from '@heroui/react'
import LoginForm from "@/components/auth/login-form";
import LoginButton from '@/components/buttons/login-button';
import RegisterForm from "@/components/auth/register-form";

type Providers = Awaited<ReturnType<typeof getProviders>>

const renderLoginButtons = (
  providers: Providers | null
) =>
  providers
    ? Object.values(providers)
      .filter((provider) => provider !== null)
      .filter(({ id }) => id !== "dreamk-credentials")
      .map((provider) => <LoginButton auth={provider} key={provider.id} />)
    : null;

export default function SignIn() {
  const [providers, setProviders] = useState<Providers | null>(null);
  const [selected, setSelected] = useState<string>('login');
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
    <div className="mx-auto flex min-h-screen max-w-[40rem] flex-col items-center p-20 bg-background">
      <Tabs selectedKey={selected} onSelectionChange={(key) => setSelected(String(key))}>
        <Tabs.ListContainer>
          <Tabs.List>
            <Tabs.Tab id="login" className="text-text-base">登录</Tabs.Tab>
            {/* <Tabs.Tab id="register" isDisabled>注册</Tabs.Tab> */}
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
        <span className="text-small text-text-muted">Or</span>
        <Separator className="flex-1" />
      </div>
      <div className="flex flex-col items-center gap-y-4">
        {renderLoginButtons(providers)}
      </div>
    </div>
  );
}
