"use client";

import { Alert, Button, Form, FieldError, Input, Label, TextField } from "@heroui/react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const getEmailError = (value: string) => {
    if (!value.trim()) {
      return '请输入邮箱';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return '邮箱格式不正确';
    }
    return '';
  };

  const getPasswordError = (value: string) => {
    if (value === '') {
      return '请输入密码'
    }
    return '';
  };


  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHasSubmitted(true);
    setSubmitError('');
    const nextFieldErrors = {
      email: getEmailError(formData.email),
      password: getPasswordError(formData.password),
    };
    setFieldErrors(nextFieldErrors);
    if (nextFieldErrors.email || nextFieldErrors.password) {
      return;
    }
    setLoading(true)

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
        <TextField isRequired isInvalid={!!fieldErrors.email}>
          <Label>邮箱</Label>
          <Input
            name="email"
            placeholder="请输入邮箱地址"
            type="email"
            value={formData.email}
            onChange={(e) => {
              const nextEmail = e.target.value;
              setFormData({ ...formData, email: nextEmail });
              if (hasSubmitted) {
                setFieldErrors((prev) => ({ ...prev, email: getEmailError(nextEmail) }));
              }
            }}
          />
          {fieldErrors.email ? <FieldError>{fieldErrors.email}</FieldError> : null}
        </TextField>
        <TextField isRequired isInvalid={!!fieldErrors.password}>
          <Label>密码</Label>
          <Input
            name="password"
            placeholder="请输入密码"
            type="password"
            value={formData.password}
            onChange={(e) => {
              const nextPassword = e.target.value;
              setFormData({ ...formData, password: nextPassword });
              if (hasSubmitted) {
                setFieldErrors((prev) => ({ ...prev, password: getPasswordError(nextPassword) }));
              }
            }}
          />
          {fieldErrors.password ? <FieldError>{fieldErrors.password}</FieldError> : null}
        </TextField>
        <div className="flex w-full gap-2">
          <Button className="flex-1" variant="primary" type="submit" isDisabled={loading} isPending={loading}>
            登录
          </Button>
          <Button
            type="reset"
            variant="ghost"
            isDisabled={loading}
            onPress={() => {
              setFormData({ email: '', password: '' });
              setSubmitError('');
              setFieldErrors({ email: '', password: '' });
              setHasSubmitted(false);
            }}
          >
            重置
          </Button>
        </div>
      </Form>
    </div>
  );
}
