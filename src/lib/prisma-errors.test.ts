import { Prisma } from "@/generated/prisma";
import { ResponseCode } from "@/config/response-code";
import { describe, expect, it } from "vitest";
import { mapPrismaError } from "./prisma-errors";

function prismaError(code: string, message = "test") {
  return new Prisma.PrismaClientKnownRequestError(message, {
    code,
    clientVersion: "test",
  });
}

async function readBody(response: Response) {
  return response.json() as Promise<{ code: number; message: string }>;
}

describe("mapPrismaError", () => {
  it("maps P2002 to fail with default message", async () => {
    const result = mapPrismaError(prismaError("P2002"));
    expect(result).not.toBeNull();
    const body = await readBody(result!);
    expect(body.code).toBe(ResponseCode.FAIL);
    expect(body.message).toBe("数据已存在，请更换后重试");
  });

  it("maps P2025 to notFound", async () => {
    const result = mapPrismaError(prismaError("P2025"));
    expect(result).not.toBeNull();
    const body = await readBody(result!);
    expect(body.code).toBe(ResponseCode.NOT_FOUND);
    expect(body.message).toBe("关联资源不存在");
  });

  it("maps P2003 to fail", async () => {
    const result = mapPrismaError(prismaError("P2003"));
    expect(result).not.toBeNull();
    const body = await readBody(result!);
    expect(body.code).toBe(ResponseCode.FAIL);
    expect(body.message).toBe("存在关联数据，无法操作");
  });

  it("returns null for unknown Prisma codes", () => {
    expect(mapPrismaError(prismaError("P9999"))).toBeNull();
  });

  it("returns null for non-Prisma errors", () => {
    expect(mapPrismaError(new Error("boom"))).toBeNull();
  });

  it("allows custom messages", async () => {
    const result = mapPrismaError(prismaError("P2002"), { P2002: "slug 已占用" });
    const body = await readBody(result!);
    expect(body.message).toBe("slug 已占用");
  });
});
