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
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { loginWithCredentials } from "@/lib/auth/credentials-login";
import {
  getRegisterFieldErrors,
  RegisterSchema,
  SendRegisterCodeSchema,
} from "@/schemas/auth";

const SEND_CODE_COOLDOWN_SEC = 60;

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const submittingRef = useRef(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = window.setTimeout(() => {
      setCooldownSec((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldownSec]);

  async function handleRegister() {
    if (submittingRef.current || loading) return;

    const parsed = RegisterSchema.safeParse(formData);
    if (!parsed.success) {
      return;
    }

    const { name, email, code, password, confirmPassword } = parsed.data;
    submittingRef.current = true;
    setLoading(true);
    let releaseLock = true;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          code,
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

      const signInResult = await loginWithCredentials({ email, password, callbackUrl });

      if (!signInResult.ok) {
        toast.danger("自动登录失败", {
          description: signInResult.error || "请切换到登录页手动登录",
        });
        return;
      }

      releaseLock = false;
      window.location.assign(callbackUrl);
    } catch {
      toast.danger("注册失败", {
        description: "遇到未知错误，请重试",
      });
    } finally {
      if (releaseLock) {
        submittingRef.current = false;
        setLoading(false);
      }
    }
  }

  async function handleSendCode() {
    if (sendingCode || cooldownSec > 0 || loading) return;

    const parsed = SendRegisterCodeSchema.safeParse({ email: formData.email });
    if (!parsed.success) {
      toast.danger("无法发送验证码", {
        description: parsed.error.issues[0]?.message || "请先填写正确的邮箱",
      });
      return;
    }

    setSendingCode(true);
    try {
      const response = await fetch("/api/auth/register/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email }),
      });
      const result = await response.json();

      if (result.code !== 200) {
        toast.danger("发送失败", {
          description:
            typeof result.message === "string"
              ? result.message
              : "验证码发送失败，请稍后重试",
        });
        return;
      }

      setCooldownSec(SEND_CODE_COOLDOWN_SEC);
      toast.success("验证码已发送", {
        description: "请查收邮件并在 10 分钟内完成注册",
      });
    } catch {
      toast.danger("发送失败", {
        description: "遇到未知错误，请重试",
      });
    } finally {
      setSendingCode(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await handleRegister();
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
              setFormData((prev) => ({ ...prev, email: next, code: "" }));
              setCooldownSec(0);
            }}
          />
          <FieldError />
        </TextField>

        <div className="flex w-full items-start gap-2">
          <TextField
            isRequired
            className="min-w-0 flex-1"
            validate={(value) =>
              getRegisterFieldErrors({ ...formData, code: value }).code
            }
          >
            <Label className="text-text-base">验证码</Label>
            <Input
              className="text-text-base"
              name="code"
              placeholder="6 位数字验证码"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={formData.code}
              disabled={loading}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                setFormData((prev) => ({ ...prev, code: next }));
              }}
            />
            <FieldError />
          </TextField>
          <Button
            className="mt-7 shrink-0"
            type="button"
            variant="secondary"
            isDisabled={loading || sendingCode || cooldownSec > 0}
            isPending={sendingCode}
            onPress={handleSendCode}
          >
            {cooldownSec > 0 ? `重新发送 (${cooldownSec}s)` : "发送验证码"}
          </Button>
        </div>

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
                code: "",
                password: "",
                confirmPassword: "",
              });
              setCooldownSec(0);
            }}
          >
            重置
          </Button>
        </div>
      </Form>
    </div>
  );
}
