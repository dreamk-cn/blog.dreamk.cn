"use client";

import { Button } from "@heroui/react";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <Button color="danger" onPress={() => signOut()}>
      Logout
    </Button>
  );
}
