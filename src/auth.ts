import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient as AuthPrismaClient } from "@prisma/client";
import type { UserStatus } from "@/generated/prisma";
import NextAuth from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from "bcryptjs";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

function isUserBlocked(status: UserStatus) {
  return status === "BAN" || status === "DELETED";
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as AuthPrismaClient),
  providers: [
    CredentialsProvider({
      id: 'dreamk-credentials',
      name: 'dreamk-credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error(JSON.stringify({
              errors: [{ 
                message: "邮箱和密码不能为空", 
                field: "credentials" 
              }]
            }));
          }
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              password: true,
              role: true,
              status: true,
            }
          })

          if (!user || !user.password) {
            throw new Error(JSON.stringify({
              errors: [{ 
                message: "账号不存在", 
                field: "credentials" 
              }]
            }));
          }

          const passwordMatch = await bcrypt.compare(credentials.password as string, user.password)

          if (!passwordMatch) {
            throw new Error(JSON.stringify({
              errors: [{ 
                message: "账号或密码错误", 
                field: "credentials" 
              }]
            }));
          }

          if (isUserBlocked(user.status)) {
            throw new Error(JSON.stringify({
              errors: [{
                message: user.status === "BAN" ? "账号已被禁用" : "账号不可用",
                field: "credentials",
              }],
            }));
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role
          }
        } catch (error) {
          if (error instanceof Error) {
            try {
              // 如果已经是JSON格式，直接抛出
              JSON.parse(error.message);
              throw error;
            } catch {
              // 如果不是JSON格式，包装成结构化错误
              throw new Error(JSON.stringify({
                errors: [{ 
                  message: "An unexpected error occurred", 
                  field: "system" 
                }]
              }));
            }
          }
          throw new Error(JSON.stringify({
            errors: [{ 
              message: "An unexpected error occurred", 
              field: "system" 
            }]
          }));
        }
      }
    }),
    GitHub({}),
    Google({})
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout'
  },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user) return false;

      const userId = typeof user.id === "string" ? user.id : null;
      const email = typeof user.email === "string" ? user.email : null;

      const dbUser = userId
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: { status: true },
          })
        : email
          ? await prisma.user.findUnique({
              where: { email },
              select: { status: true },
            })
          : null;

      if (dbUser && isUserBlocked(dbUser.status)) {
        return false;
      }

      return true;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}`;
    },
    async session({ session, token }) {
      if (token?.role && session.user) {
        session.user.role = token.role;
      }
      if (token.id) {
        session.user.id = token.id
      }
      return session;
    },
    async jwt({ token, user }) {
      const userId =
        typeof user?.id === "string"
          ? user.id
          : typeof token.id === "string"
            ? token.id
            : typeof token.sub === "string"
              ? token.sub
              : null;

      if (!userId) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, status: true },
      });

      if (!dbUser || isUserBlocked(dbUser.status)) {
        return null;
      }

      token.role = dbUser.role;
      token.id = userId;
      return token;
    },
  },
  events: {
    createUser: async ({ user }) => {
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail && user.email === adminEmail) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' }
        })
      }
    }
  },
  trustHost: true
})