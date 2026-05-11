import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isEmail, isStrongPassword } from "@/utils/verify";
import { fail, internalError, ok } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const { email, password, name, confirmPassword } = await request.json();

    // 验证基础字段
    if (!email || !password || !name) {
      return fail(400, "邮箱，密码和用户名不能为空");
    }

    if (!isEmail(email)) {
      return fail(400, "无效的邮箱格式");
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return fail(409, "该邮箱已经被注册了");
    }

    if (!isStrongPassword(password)) {
      return fail(400, "密码必须至少包含8个字符，包含大写字母、小写字母和数字");
    }

    // 验证确认密码
    if (password !== confirmPassword) {
      return fail(400, "两次输入的密码不匹配");
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        // 新用户默认角色
        role: process.env.ADMIN_EMAIL === email ? "ADMIN" : "USER",
      },
    });

    return ok(null, "注册成功");
  } catch {
    return internalError("Internal server error");
  }
}