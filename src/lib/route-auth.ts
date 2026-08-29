import { auth } from "@/auth";
import { forbidden, unauthorized } from "@/lib/api-response";
import type { Session } from "next-auth";

export type UserSession = Session & {
  user: Session["user"] & { id: string };
};

export type AdminSession = Session & {
  user: Session["user"] & { id: string; role: "ADMIN" };
};

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, response: unauthorized() };
  }
  return {
    ok: true as const,
    session: session as UserSession,
  };
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, response: unauthorized() };
  }
  if (session.user.role !== "ADMIN") {
    return { ok: false as const, response: forbidden() };
  }
  return {
    ok: true as const,
    session: session as AdminSession,
  };
}
