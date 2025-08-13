"use client";

import Image from "next/image";

import { signIn } from "next-auth/react";

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

  return (
    <Image
      src={imagePath}
      width="20"
      height="20"
      alt="Google"
    />
  );
};
export default function LoginButton({
  auth,
}: {
  auth: ClientSafeProvider | null;
}) {
  return (
    <button
      type="button"
      className="cursor-pointer border shadow-1 rounded-md py-1.5 px-4 text-sm font-semibold shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 hover:shadow-lg hover:scale-102 transition duration-150"
      onClick={() => signIn(auth?.id as string)}
    >
      {auth ? (
        <div className="flex items-center gap-2">
          <Icon provider={auth.name as string} />
          Sign In with {auth.name as string}
        </div>
      ) : (
        "登录"
      )}
    </button>
  );
}
