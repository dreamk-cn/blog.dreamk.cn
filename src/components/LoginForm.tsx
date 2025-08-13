"use client";

import { EmailRegex } from "@/utils/verify";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from "react-hook-form";

type LoginFormProps = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormProps>({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false)
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  async function handleSubmitForm(data: { email: string; password: string }) {
    setSubmitError(null);
    setLoading(true)
    try {
      const result = await signIn("dreamk-credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl
      })

      if (result.error) {
        try {
          // 解析结构化错误
          const errorData = JSON.parse(result.error);
          setSubmitError(errorData.errors[0].message);
        } catch {
          // 如果不是结构化错误，使用通用消息
          setSubmitError("无效的邮箱或密码");
        }
      } else {
        router.push(callbackUrl)
      }
    } catch {
      setSubmitError("遇到未知错误，请重试"); 
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
      <form
        className="mt-5 space-y-4"
        onSubmit={handleSubmit(handleSubmitForm)}
      >
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            {submitError}
          </div>
        )}
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
                required: "Email is required",
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
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              密码
            </label>
          </div>
          <div className="mt-2">
            <input
              {...register("password", { required: "请输入密码" })}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
          <span className="text-red-500 text-xs">
            {errors.password?.message}
          </span>
        </div>
        <div>
          <button
            type="submit"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-gray-200"
            disabled={loading}
          >
            {
              loading && 
              <Image
                className="animate-spin mx-2"
                src="/images/icons/loading.svg"
                width="20"
                height="20"
                color="#fff"
                alt="加载中"
              />
            }
            登 录
          </button>
        </div>
      </form>
    </div>
  );
}
