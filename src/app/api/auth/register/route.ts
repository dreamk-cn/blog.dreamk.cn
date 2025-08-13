import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import bcrypt from "bcryptjs";
import { isEmail, isStrongPassword } from "@/utils/verify";

export async function POST(request: Request) {
  try {
    const { email, password, name, confirmPassword } = await request.json();

    // 验证基础字段
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "邮箱，密码和用户名不能为空" },
        { status: 400 }
      );
    }

    if (!isEmail(email)) {
      return NextResponse.json(
        { error: "无效的邮箱格式" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已经被注册了" },
        { status: 409 }
      );
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { 
          error: "密码必须至少包含8个字符，包含大写字母、小写字母和数字" 
        },
        { status: 400 }
      );
    }

    // 验证确认密码
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "两次输入的密码不匹配" },
        { status: 400 }
      );
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

    return NextResponse.json(
      { message: "注册成功" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}