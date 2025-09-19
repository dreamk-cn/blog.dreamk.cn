"use client";

import { Suspense, useEffect, useState } from "react";

import { getProviders } from "next-auth/react";
import { Divider, Tab, Tabs } from '@heroui/react'
import LoginForm from "@/components/login-form";
import LoginButton from '@/components/buttons/login-button';
import RegisterForm from "@/components/register-form";

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
  const [selected, setSelected] = useState<string | number>('login');

  useEffect(() => {
    async function fetchProviders() {
      const response = await getProviders();
      console.warn('response:', response)
      setProviders(response);
    }
    fetchProviders();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center mx-auto p-20 max-w-[40rem]">
      <Tabs
        selectedKey={selected}
        onSelectionChange={(key) => setSelected(key)}
      >
        <Tab key="login" title="登录">
          <Suspense>
            <LoginForm />
          </Suspense>
        </Tab>
        <Tab key="register" title="注册" disabled={true}>
          <Suspense>
            <RegisterForm />
          </Suspense>
        </Tab>
      </Tabs>
      <Divider content="Or" className="my-4" />
      <div className="flex flex-col items-center gap-y-4">
        {renderLoginButtons(providers)}
      </div>
    </div>
  );
}
