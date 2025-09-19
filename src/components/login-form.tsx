"use client";

import { isStrongPassword } from "@/utils/verify";
import { Alert, Button, Form, Input } from "@heroui/react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

type FormError = {
  email?: string;
  password?: string;
}

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const getPasswordError = (value: string) => {
    if (!isStrongPassword(value)) {
      return '密码必须包含大小写字母、数字,长度至少为8位'
    }
    return '';
  };
  

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError('');
    setLoading(true)

    const newFormErr: FormError = {};

    const passwordError = getPasswordError(formData.password)
    if (passwordError) {
      newFormErr.password = passwordError;
    }

    try {
      const result = await signIn("dreamk-credentials", {
        email: formData.email,
        password: formData.password,
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
    <Suspense>
      <div className="mt-5">
        {submitError && (
          <Alert className="mb-4" color="danger" title={submitError} />
        )}
        <Form
          className="w-full flex flex-col gap-4"
          onSubmit={onSubmit}
        >
          <Input
            isRequired
            errorMessage="请输入正确的邮箱地址"
            label="邮箱"
            labelPlacement="outside"
            name="email"
            placeholder="请输入邮箱地址"
            type="email"
            value={formData.email}
            onValueChange={(value) => setFormData({ ...formData, email: value })}
          />
          <Input
            isRequired
            errorMessage={getPasswordError(formData.password)}
            isInvalid={getPasswordError(formData.password) !== ''}
            label="密码"
            labelPlacement="outside"
            name="password"
            placeholder="请输入密码"
            type="password"
            value={formData.password}
            onValueChange={(value) => setFormData({ ...formData, password: value })}
          />
          <div className="flex gap-2 w-full">
            <Button className="flex-1" color="primary" type="submit" disabled={loading} isLoading={loading}>
              登录
            </Button>
            <Button type="reset" variant="flat" disabled={loading} onPress={() => setSubmitError('')}>
              重置
            </Button>
          </div>
        </Form>
      </div>
    </Suspense>
  );
}
