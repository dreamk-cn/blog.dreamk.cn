import { $Enums } from '@prisma/client'
import type { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

type UserRole = $Enums.Role

declare module 'next-auth' {
  /**
   * 扩展 next-auth 的 User 接口
   * 这对应于从 authorize 回调返回的 user 对象，或从数据库适配器返回的用户。
   */
  interface User extends DefaultUser {
    role: UserRole
  }

  /**
   * 扩展 next-auth 的 Session 接口
   * 这定义了 useSession, getSession 返回的会话对象的类型。
   */
  interface Session extends DefaultSession {
    user: {
      role: UserRole
    } & DefaultSession["user"]
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: UserRole
  }
}