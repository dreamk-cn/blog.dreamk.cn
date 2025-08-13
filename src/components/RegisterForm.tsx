"use client";

import CryptoJS from 'crypto-js';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmailRegex } from '@/utils/verify';

type RegisterFormProps = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormProps>({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const password = watch("password");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const onSubmit = async (data: RegisterFormProps) => {
    setSubmitError(null);
    
    try {
      // 前端验证确认密码（双重验证）
      if (data.password !== data.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // 发送注册请求
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // 处理API返回的错误
        setSubmitError(result.error || "注册遇到了未知错误");
        return;
      }

      // 注册成功后尝试登录
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: CryptoJS.MD5(data.password).toString(),
        redirect: false,
      });

      if (signInResult.error) {
        try {
          // 解析结构化错误
          const errorData = JSON.parse(signInResult.error);
          setSubmitError(errorData.errors[0].message);
        } catch {
          // 如果不是结构化错误，使用通用消息
          setSubmitError("无效的邮箱或密码");
        }
      } else {
        router.push(callbackUrl)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "遇到了未知错误");
    }
  };

  return (
    <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
      <form 
        className="mt-5 space-y-6" 
        onSubmit={handleSubmit(onSubmit)}
      >
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            {submitError}
          </div>
        )}
        
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            用户名
          </label>
          <div className="mt-2">
            <input
              {...register("name", {
                required: "请输入用户名",
                minLength: {
                  value: 2,
                  message: "用户名必须至少有2个字符",
                },
              })}
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
          <span className="text-red-500 text-xs">{errors.name?.message}</span>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            邮箱地址
          </label>
          <div className="mt-2">
            <input
              {...register("email", {
                required: "请输入邮箱地址",
                pattern: {
                  value: EmailRegex,
                  message: "请输入正确的邮箱格式",
                },
              })}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
          <span className="text-red-500 text-xs">{errors.email?.message}</span>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            密码
          </label>
          <div className="mt-2">
            <input
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "密码必须至少有8位",
                },
                validate: {
                  hasUpperCase: value => 
                    /[A-Z]/.test(value) || "密码必须包含一个大写字母",
                  hasLowerCase: value => 
                    /[a-z]/.test(value) || "密码必须包含一个小写字母",
                  hasNumber: value => 
                    /\d/.test(value) || "密码必须包含一个数字",
                }
              })}
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            密码必须至少包含8个字符，包含大写字母、小写字母和数字
          </div>
          <span className="text-red-500 text-xs">{errors.password?.message}</span>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            确认密码
          </label>
          <div className="mt-2">
            <input
              {...register("confirmPassword", {
                required: "请输入确认密码",
                validate: value => 
                  value === password || "两次输入的密码不匹配",
              })}
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
          <span className="text-red-500 text-xs">
            {errors.confirmPassword?.message}
          </span>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-75"
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </div>

        <div className="text-center text-sm">
          已经有账号?{" "}
          <a 
            href="/auth/signin" 
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            登录
          </a>
        </div>
      </form>
    </div>
  );
}