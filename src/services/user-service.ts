import bcrypt from "bcryptjs";
import { env } from "@/config/env";
import { Prisma, UserStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { RegisterInput } from "@/schemas/auth";

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type AdminUserRecord = Prisma.UserGetPayload<{
  select: typeof adminUserSelect;
}>;

export type AdminUserListItem = {
  id: string;
  name: string | null;
  email: string;
  role: AdminUserRecord["role"];
  status: AdminUserRecord["status"];
  createdAt: string;
  updatedAt: string;
};

function toAdminUserListItem(user: AdminUserRecord): AdminUserListItem {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listUsers(params: { keyword?: string; status?: UserStatus }) {
  const keyword = params.keyword ?? "";
  const query: Prisma.UserFindManyArgs = {
    orderBy: { createdAt: "desc" },
    where: {},
    select: adminUserSelect,
  };

  if (keyword) {
    query.where = {
      ...query.where,
      OR: [
        { name: { contains: keyword, mode: "insensitive" } },
        { email: { contains: keyword, mode: "insensitive" } },
      ],
    };
  }
  if (params.status) {
    query.where = {
      ...query.where,
      status: params.status,
    };
  }

  const users = await prisma.user.findMany(query);
  return users.map(toAdminUserListItem);
}

export async function updateUserStatus(params: { id: string; status: UserStatus }) {
  const exist = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!exist) return { error: "用户不存在" as const };

  const data = await prisma.user.update({
    where: { id: params.id },
    data: { status: params.status },
    select: adminUserSelect,
  });
  return { data: toAdminUserListItem(data) };
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existingUser) {
    return { error: "该邮箱已经被注册了" as const };
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      password: hashedPassword,
      emailVerified: new Date(),
      role: env.adminEmail === input.email ? "ADMIN" : "USER",
    },
  });

  return { data: null };
}

const passwordSelect = {
  id: true,
  password: true,
} satisfies Prisma.UserSelect;

export type AccountSecurity = {
  email: string;
  name: string | null;
  hasPassword: boolean;
};

export async function getAccountSecurity(userId: string): Promise<AccountSecurity | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, password: true },
  });
  if (!user) return null;

  return {
    email: user.email,
    name: user.name,
    hasPassword: user.password !== null,
  };
}

export async function setPassword(params: { userId: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: passwordSelect,
  });
  if (!user) return { error: "not_found" as const };
  if (user.password) return { error: "already_set" as const };

  const hashedPassword = await bcrypt.hash(params.password, 12);
  await prisma.user.update({
    where: { id: params.userId },
    data: { password: hashedPassword },
  });

  return { data: { hasPassword: true as const } };
}

export async function changePassword(params: {
  userId: string;
  currentPassword: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: passwordSelect,
  });
  if (!user) return { error: "not_found" as const };
  if (!user.password) return { error: "not_set" as const };

  const currentMatch = await bcrypt.compare(params.currentPassword, user.password);
  if (!currentMatch) {
    return { error: "invalid_current" as const };
  }

  const hashedPassword = await bcrypt.hash(params.password, 12);
  await prisma.user.update({
    where: { id: params.userId },
    data: { password: hashedPassword },
  });

  return { data: { hasPassword: true as const } };
}
