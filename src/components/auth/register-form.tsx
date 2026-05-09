"use client";

import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  getRegisterFieldErrors,
  RegisterSchema,
} from "@/schemas/auth";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (loading) return;
    e.preventDefault();
    const parsed = RegisterSchema.safeParse(formData);
    if (!parsed.success) {
      return;
    }
    const { name, email, password, confirmPassword } = parsed.data;
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (result.code !== 200) {
        toast.danger("注册失败", {
          description:
            typeof result.message === "string"
              ? result.message
              : "注册遇到了未知错误",
        });
        return;
      }

      const signInResult = await signIn("dreamk-credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (signInResult?.error) {
        try {
          const errorData = JSON.parse(signInResult.error);
          const msg = errorData.errors?.[0]?.message;
          toast.danger("自动登录失败", {
            description:
              typeof msg === "string" ? msg : "请切换到登录页手动登录",
          });
        } catch {
          toast.danger("自动登录失败", {
            description: "请切换到登录页手动登录",
          });
        }
      } else {
        router.push(callbackUrl);
      }
    } catch {
      toast.danger("注册失败", {
        description: "遇到未知错误，请重试",
      });
    } finally {
      setLoading(false);
    }
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
            getRegisterFieldErrors({ ...formData, name: value }).name
          }
        >
          <Label className="text-text-base">用户名</Label>
          <Input
            className="text-text-base"
            name="name"
            placeholder="请输入用户名"
            type="text"
            autoComplete="name"
            value={formData.name}
            disabled={loading}
            onChange={(e) => {
              const next = e.target.value;
              setFormData((prev) => ({ ...prev, name: next }));
            }}
          />
          <FieldError />
        </TextField>

        <TextField
          isRequired
          validate={(value) =>
            getRegisterFieldErrors({ ...formData, email: value }).email
          }
        >
          <Label className="text-text-base">邮箱</Label>
          <Input
            className="text-text-base"
            name="email"
            placeholder="请输入邮箱地址"
            type="email"
            autoComplete="email"
            value={formData.email}
            disabled={loading}
            onChange={(e) => {
              const next = e.target.value;
              setFormData((prev) => ({ ...prev, email: next }));
            }}
          />
          <FieldError />
        </TextField>

        <TextField
          isRequired
          validate={(value) =>
            getRegisterFieldErrors({ ...formData, password: value }).password
          }
        >
          <Label className="text-text-base">密码</Label>
          <Description className="text-text-muted">
            至少 8 位，且需包含大写、小写字母与数字
          </Description>
          <Input
            className="text-text-base"
            name="password"
            placeholder="请输入密码"
            type="password"
            autoComplete="new-password"
            value={formData.password}
            disabled={loading}
            onChange={(e) => {
              const next = e.target.value;
              setFormData((prev) => ({ ...prev, password: next }));
            }}
          />
          <FieldError />
        </TextField>

        <TextField
          isRequired
          validate={(value) =>
            getRegisterFieldErrors({
              ...formData,
              confirmPassword: value,
            }).confirmPassword
          }
        >
          <Label className="text-text-base">确认密码</Label>
          <Input
            className="text-text-base"
            name="confirmPassword"
            placeholder="请再次输入密码"
            type="password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            disabled={loading}
            onChange={(e) => {
              const next = e.target.value;
              setFormData((prev) => ({ ...prev, confirmPassword: next }));
            }}
          />
          <FieldError />
        </TextField>

        <div className="flex w-full gap-2">
          <Button
            className="flex-1"
            variant="primary"
            type="submit"
            isDisabled={loading}
            isPending={loading}
          >
            {loading ? <Spinner color="current" size="sm" /> : null}
            {loading ? "注册中..." : "注册"}
          </Button>
          <Button
            type="reset"
            variant="ghost"
            isDisabled={loading}
            onPress={() => {
              setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
              });
            }}
          >
            重置
          </Button>
        </div>
      </Form>
    </div>
  );
}
