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
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { request, type HttpError } from "@/lib/request";
import {
  ChangePasswordSchema,
  getChangePasswordFieldErrors,
  getSetPasswordFieldErrors,
  SetPasswordSchema,
} from "@/schemas/auth";

type PasswordFormProps = {
  hasPassword: boolean;
};

const emptySetForm = {
  password: "",
  confirmPassword: "",
};

const emptyChangeForm = {
  currentPassword: "",
  password: "",
  confirmPassword: "",
};

export function PasswordForm({ hasPassword }: PasswordFormProps) {
  const router = useRouter();
  const [setForm, setSetForm] = useState(emptySetForm);
  const [changeForm, setChangeForm] = useState(emptyChangeForm);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  async function handleSubmit() {
    if (submittingRef.current || loading) return;

    const parsed = hasPassword
      ? ChangePasswordSchema.safeParse(changeForm)
      : SetPasswordSchema.safeParse(setForm);
    if (!parsed.success) {
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      await request.post(
        "/account/password",
        { ...parsed.data },
        { showSuccessMessage: false, showErrorMessage: false },
      );
      toast.success(hasPassword ? "密码已修改" : "密码已设置", {
        description: hasPassword
          ? "下次可继续使用邮箱和密码登录"
          : "之后可以使用邮箱和密码登录",
      });
      setSetForm(emptySetForm);
      setChangeForm(emptyChangeForm);
      router.refresh();
    } catch (error) {
      const message = (error as HttpError).message || "请稍后再试";
      toast.danger(hasPassword ? "修改失败" : "设置失败", {
        description: message,
      });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await handleSubmit();
  }

  return (
    <Form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
      {hasPassword ? (
        <TextField
          isRequired
          validate={(value) =>
            getChangePasswordFieldErrors({ ...changeForm, currentPassword: value })
              .currentPassword
          }
        >
          <Label className="text-text-base">当前密码</Label>
          <Input
            className="text-text-base"
            variant="secondary"
            name="currentPassword"
            placeholder="请输入当前密码"
            type="password"
            autoComplete="current-password"
            value={changeForm.currentPassword}
            disabled={loading}
            onChange={(e) => {
              const next = e.target.value;
              setChangeForm((prev) => ({ ...prev, currentPassword: next }));
            }}
          />
          <FieldError />
        </TextField>
      ) : null}

      <TextField
        isRequired
        validate={(value) =>
          hasPassword
            ? getChangePasswordFieldErrors({ ...changeForm, password: value }).password
            : getSetPasswordFieldErrors({ ...setForm, password: value }).password
        }
      >
        <Label className="text-text-base">{hasPassword ? "新密码" : "密码"}</Label>
        <Description className="text-text-muted">
          至少 8 位，且需包含大写、小写字母与数字
        </Description>
        <Input
          className="text-text-base"
          variant="secondary"
          name="password"
          placeholder={hasPassword ? "请输入新密码" : "请设置密码"}
          type="password"
          autoComplete="new-password"
          value={hasPassword ? changeForm.password : setForm.password}
          disabled={loading}
          onChange={(e) => {
            const next = e.target.value;
            if (hasPassword) {
              setChangeForm((prev) => ({ ...prev, password: next }));
            } else {
              setSetForm((prev) => ({ ...prev, password: next }));
            }
          }}
        />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        validate={(value) =>
          hasPassword
            ? getChangePasswordFieldErrors({
                ...changeForm,
                confirmPassword: value,
              }).confirmPassword
            : getSetPasswordFieldErrors({ ...setForm, confirmPassword: value })
                .confirmPassword
        }
      >
        <Label className="text-text-base">确认密码</Label>
        <Input
          className="text-text-base"
          variant="secondary"
          name="confirmPassword"
          placeholder="请再次输入密码"
          type="password"
          autoComplete="new-password"
          value={hasPassword ? changeForm.confirmPassword : setForm.confirmPassword}
          disabled={loading}
          onChange={(e) => {
            const next = e.target.value;
            if (hasPassword) {
              setChangeForm((prev) => ({ ...prev, confirmPassword: next }));
            } else {
              setSetForm((prev) => ({ ...prev, confirmPassword: next }));
            }
          }}
        />
        <FieldError />
      </TextField>

      <Button
        className="w-full"
        variant="primary"
        type="submit"
        isDisabled={loading}
        isPending={loading}
      >
        {loading ? <Spinner color="current" size="sm" /> : null}
        {loading
          ? hasPassword
            ? "修改中..."
            : "设置中..."
          : hasPassword
            ? "修改密码"
            : "设置密码"}
      </Button>
    </Form>
  );
}
