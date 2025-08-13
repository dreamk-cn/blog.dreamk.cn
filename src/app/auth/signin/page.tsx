"use client";

import { Suspense, useEffect, useState } from "react";

import { getProviders } from "next-auth/react";

import Divider from '@/components/Divider'
import LoginForm from "@/components/LoginForm";
import LoginButton from '@/components/buttons/LoginButton';
import useToggle from "@/hooks/useToggle";
import RegisterForm from "@/components/RegisterForm";

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
  const [showLogin] = useToggle(true)

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
      <h1 className="font-bold text-3xl">
        { showLogin ? '登 录' : '注 册' }
      </h1>
      <Suspense>
        {
        showLogin ? <LoginForm /> : <RegisterForm />
        }
      </Suspense>
      <Divider message="Other Providers" />
      <div className="flex flex-col items-center gap-y-4">
        {renderLoginButtons(providers)}
      </div>
    </div>
  );
}
