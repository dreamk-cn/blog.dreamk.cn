"use client";

import { Alert, Button, Form, FieldError, Input, Label, TextField } from "@heroui/react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [submitError, setSubmitError] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const getPasswordError = (value: string) => {
    if (value === '') {
      return '请输入密码'
    }
    return '';
  };


  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError('');
    setLoading(true)
    setPwdError(getPasswordError(formData.password))

    try {
      const result = await signIn("dreamk-credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl
      })

      if (result.error) {
        try {
          const errorData = JSON.parse(result.error);
          setSubmitError(errorData.errors[0].message);
        } catch {
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
    <div className="mt-5">
      {submitError && (
        <Alert status="danger" className="mb-4">
          <Alert.Title>{submitError}</Alert.Title>
        </Alert>
      )}
      <Form
        className="flex w-full flex-col gap-4"
        onSubmit={onSubmit}
      >
        <TextField isRequired>
          <Label>邮箱</Label>
          <Input
            name="email"
            placeholder="请输入邮箱地址"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </TextField>
        <TextField isRequired isInvalid={!!pwdError}>
          <Label>密码</Label>
          <Input
            name="password"
            placeholder="请输入密码"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onBlur={() => setPwdError(getPasswordError(formData.password))}
          />
          {pwdError ? <FieldError>{pwdError}</FieldError> : null}
        </TextField>
        <div className="flex w-full gap-2">
          <Button className="flex-1" variant="primary" type="submit" isDisabled={loading} isPending={loading}>
            登录
          </Button>
          <Button type="reset" variant="ghost" isDisabled={loading} onPress={() => setSubmitError('')}>
            重置
          </Button>
        </div>
      </Form>
    </div>
  );
}
