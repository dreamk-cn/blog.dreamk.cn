import { PrismaAdapter } from "@auth/prisma-adapter";
import { env } from "@/config/env";
import type { PrismaClient as AuthPrismaClient, UserStatus } from "@/generated/prisma";
import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from "bcryptjs";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

function isUserBlocked(status: UserStatus) {
  return status === "BAN" || status === "DELETED";
}

class MissingCredentials extends CredentialsSignin {
  code = "credentials_required";
}

class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
}

class AccountBlocked extends CredentialsSignin {
  code = "account_blocked";
}

class AccountUnavailable extends CredentialsSignin {
  code = "account_unavailable";
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as unknown as AuthPrismaClient),
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
            throw new MissingCredentials();
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
            throw new InvalidCredentials();
          }

          const passwordMatch = await bcrypt.compare(credentials.password as string, user.password)

          if (!passwordMatch) {
            throw new InvalidCredentials();
          }

          if (isUserBlocked(user.status)) {
            throw user.status === "BAN" ? new AccountBlocked() : new AccountUnavailable();
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role
          }
        } catch (error) {
          if (error instanceof CredentialsSignin) {
            throw error;
          }
          console.error("[auth] credentials authorize failed:", error);
          throw new InvalidCredentials();
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
      const adminEmail = env.adminEmail;
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