import { fail, internalError, ok, zodFail } from "@/lib/api-response";
import { RegisterSchema } from "@/schemas/auth";
import { registerUser } from "@/services/user-service";
import z from "zod";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = RegisterSchema.parse(json ?? {});

    const result = await registerUser(parsed);
    if (result.error) {
      return fail(409, result.error);
    }

    return ok(null, "注册成功");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodFail(error.issues[0]?.message || "参数错误");
    }
    return internalError("Internal server error");
  }
}