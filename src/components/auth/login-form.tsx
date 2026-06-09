"use client";

import { Button, Form, FieldError, Input, Label, TextField, Spinner, toast } from "@heroui/react";
import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { loginWithCredentials } from "@/lib/auth/credentials-login";
import { getLoginFieldErrors, LoginSchema } from "@/schemas/auth";

function navigateAfterAuth(callbackUrl: string) {
  window.location.assign(callbackUrl);
}

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  async function handleLogin() {
    if (submittingRef.current || loading) return;

    const parsed = LoginSchema.safeParse(formData);
    if (!parsed.success) {
      return;
    }

    const { email, password } = parsed.data;
    submittingRef.current = true;
    setLoading(true);
    let releaseLock = true;

    try {
      const result = await loginWithCredentials({ email, password, callbackUrl });

      if (!result.ok) {
        toast.danger('登录失败', { description: result.error });
        return;
      }

      releaseLock = false;
      navigateAfterAuth(callbackUrl);
    } catch {
      toast.danger('登录失败', { description: '遇到未知错误，请重试' });
    } finally {
      if (releaseLock) {
        submittingRef.current = false;
        setLoading(false);
      }
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await handleLogin();
  }

  return (
    <div className="mt-5">
      <Form
        className="flex w-full flex-col gap-4"
        onSubmit={onSubmit}
      >
        <TextField
          isRequired
          validate={(value) =>
            getLoginFieldErrors({ ...formData, email: value }).email
          }
        >
          <Label className="text-text-base">邮箱</Label>
          <Input
            className="text-text-base"
            name="email"
            placeholder="请输入邮箱地址"
            type="email"
            value={formData.email}
            disabled={loading}
            onChange={(e) => {
              const nextEmail = e.target.value;
              setFormData((prev) => ({ ...prev, email: nextEmail }));
            }}
          />
          <FieldError />
        </TextField>
        <TextField
          isRequired
          validate={(value) =>
            getLoginFieldErrors({ ...formData, password: value }).password
          }
        >
          <Label className="text-text-base">密码</Label>
          <Input
            className="text-text-base"
            name="password"
            placeholder="请输入密码"
            type="password"
            value={formData.password}
            disabled={loading}
            onChange={(e) => {
              const nextPassword = e.target.value;
              setFormData(prev => ({ ...prev, password: nextPassword }));
            }}
          />
          <FieldError />
        </TextField>
        <div className="flex w-full gap-2">
          <Button className="flex-1" variant="primary" type="submit" isDisabled={loading} isPending={loading}>
            { loading ? <Spinner color="current" size="sm" /> : null }
            { loading ? '登录中...' : '登录'}
          </Button>
          <Button
            type="reset"
            variant="ghost"
            isDisabled={loading}
            onPress={() => {
              setFormData({ email: '', password: '' });
            }}
          >
            重置
          </Button>
        </div>
      </Form>
    </div>
  );
}
