"use client";

import Image from "next/image";

import { signIn } from "next-auth/react";
import { Button } from "@heroui/react";

type ClientSafeProvider = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

const Icon = ({ provider }: { provider: string }) => {
  let imagePath = "";

  if (provider === "Google") {
    imagePath = "/images/icons/google.svg";
  } else if (provider === "Discord") {
    imagePath = "/images/icons/discord.svg";
  } else if (provider === "Auth0") {
    imagePath = "/images/icons/auth0.svg";
  } else if (provider === 'GitHub') {
    imagePath = '/images/icons/github.svg'
  }

  if (imagePath) {
    return (
      <Image
        src={imagePath}
        width="20"
        height="20"
        alt="Google"
      />
    );
  }
};
export default function LoginButton({
  auth,
}: {
  auth: ClientSafeProvider | null;
}) {
  return (
    <Button color="default" onPress={() => signIn(auth?.id as string)}>
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
