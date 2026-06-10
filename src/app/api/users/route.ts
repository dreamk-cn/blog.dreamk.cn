import { ResponseCode } from '@/config/response-code'
import { fail, ok } from '@/lib/api-response'
import { parseJson, withAdmin } from '@/lib/route-handler'
import { UserUpdateStatusSchema, UserListQuerySchema } from '@/schemas/user'
import { listUsers, updateUserStatus } from '@/services/user-service'
import { NextResponse } from 'next/server'

export const GET = withAdmin(async (request) => {
  const { searchParams } = request.nextUrl
  const parsed = UserListQuerySchema.parse({
    keyword: searchParams.get('keyword') || undefined,
    status: searchParams.get('status') || undefined,
  })
  const users = await listUsers(parsed)
  return ok(users, '获取用户列表成功')
}, '获取用户列表失败')

export const PUT = withAdmin(async (request, admin) => {
  const json = await parseJson(request)
  if (json instanceof NextResponse) return json
  const parsed = UserUpdateStatusSchema.parse(json ?? {})
  const { id, status } = parsed

  if (id === admin.session.user.id) {
    return fail(ResponseCode.FAIL, '不能操作自己的状态')
  }

  const result = await updateUserStatus({ id, status })
  if (result.error) return fail(ResponseCode.FAIL, result.error)
  return ok(result.data, '更新用户状态成功')
}, '更新用户状态失败')
