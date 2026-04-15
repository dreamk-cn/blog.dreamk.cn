"use client";

import { signIn } from "next-auth/react";
import { Button } from "@heroui/react";
import { GithubIcon, GoogleIcon, QuestionIcon } from "../icons";

type ClientSafeProvider = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

const Icon = ({ provider }: { provider: string }) => {
  if (provider === 'GitHub') {
    return <GithubIcon />
  } else if (provider === 'Google') {
    return <GoogleIcon />
  } else {
    return <QuestionIcon />
  }
};
export default function LoginButton({
  auth,
}: {
  auth: ClientSafeProvider | null;
}) {
  return (
    <Button variant="secondary" onPress={() => signIn(auth?.id as string)}>
      {auth ? (
        <div className="flex items-center gap-2">
          <Icon provider={auth.name as string} />
          Sign In with {auth.name as string}
        </div>
      ) : (
        "登录"
      )}
    </Button>
  );
}
