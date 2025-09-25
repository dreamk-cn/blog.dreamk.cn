import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/libs/prisma'
import bcrypt from "bcryptjs";
import GitHub from "next-auth/providers/github";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
              role: true
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
    GitHub({})
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout'
  },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn(userDetail) {
      if (Object.keys(userDetail).length === 0) {
        return false;
      }
      return true;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}`;
    },
    async session({ session, token }) {
      // 将 token 中的 role 赋值给 session.user
      if (token?.role && session.user) {
        session.user.role = token.role;
      }
      // 您之前存在的 name 处理逻辑可以保留
      if (session.user?.name) {
        session.user.name = token.name;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true }
        })
        token.role = dbUser?.role || 'USER'
      }
      return token;
    },
  },
  events: {
    createUser: async ({ user }) => {
      console.log(`New user created: ${user.email}`)
      // set admin role when the admin email is found
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail && user.email === adminEmail) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' }
        })
      }
    }
  }
})