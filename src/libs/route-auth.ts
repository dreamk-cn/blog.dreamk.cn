import { auth } from "@/auth";
import { forbidden, unauthorized } from "@/libs/api-response";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, response: unauthorized() };
  }
  if (session.user.role !== "ADMIN") {
    return { ok: false as const, response: forbidden() };
  }
  return { ok: true as const, session };
}
