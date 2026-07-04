"use client";

import { useState } from "react";
import { Button, Input, Label, Spinner, TextArea, TextField, toast } from "@heroui/react";
import { LinkIcon } from "@/components/icons";
import { request, type HttpError } from "@/lib/request";

type ApplyFormState = {
  name: string;
  url: string;
  email: string;
  avatar: string;
  description: string;
};

const initialForm: ApplyFormState = {
  name: "",
  url: "",
  email: "",
  avatar: "",
  description: "",
};

export function FriendLinkApplyForm() {
  const [form, setForm] = useState<ApplyFormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof ApplyFormState>(key: K, value: ApplyFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const name = form.name.trim();
    const url = form.url.trim();
    const email = form.email.trim();
    const avatar = form.avatar.trim();
    const description = form.description.trim();

    if (!name || !url || !email) {
      toast.warning("请填写站点名称、链接和联系邮箱");
      return;
    }

    setSubmitting(true);
    try {
      const res = await request.post<{ id: string }>(
        "/friend-links/apply",
        {
          name,
          url,
          email,
          avatar: avatar || undefined,
          description: description || undefined,
        },
        { showSuccessMessage: false },
      );

      if (res.code !== 200) {
        toast.danger("申请失败", { description: res.message || "请稍后再试" });
        return;
      }

      toast.success("申请已提交", { description: "等待审核通过后将展示在友链列表" });
      setForm(initialForm);
    } catch (error) {
      const message = (error as HttpError).message || "网络异常，请稍后重试";
      toast.danger("申请失败", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="apply"
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-border/80 bg-background shadow-sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <div className="relative border-b border-border/70 bg-primary/50 px-6 py-8 sm:px-8 lg:border-r lg:border-b-0">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--color-canvas),transparent_60%)] opacity-70"
          />
          <div className="relative space-y-4">
            <p className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-primary uppercase">
              <LinkIcon size={14} className="text-accent" />
              Apply
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-text-base sm:text-3xl">申请友链</h2>
            <p className="max-w-sm text-sm leading-7 text-text-muted">
              留下你的站点信息，审核通过后就会出现在上方友链列表。欢迎技术、设计与生活类站点互换链接。
            </p>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-4">
            <TextField isRequired>
              <Label className="text-text-muted">站点名称</Label>
              <Input
                variant="secondary"
                className="text-text-base placeholder:text-text-muted"
                placeholder="例如：梦刻"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                disabled={submitting}
              />
            </TextField>

            <TextField isRequired>
              <Label className="text-text-muted">站点链接</Label>
              <Input
                variant="secondary"
                className="text-text-base placeholder:text-text-muted"
                placeholder="https://example.com"
                value={form.url}
                onChange={(e) => updateField("url", e.target.value)}
                disabled={submitting}
              />
            </TextField>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-text-muted">站点简介（可选）</Label>
              <TextArea
                variant="secondary"
                className="w-full text-text-base placeholder:text-text-muted"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                disabled={submitting}
                placeholder="一句话介绍你的站点"
              />
            </div>

            <TextField>
              <Label className="text-text-muted">头像链接（可选）</Label>
              <Input
                variant="secondary"
                className="text-text-base placeholder:text-text-muted"
                placeholder="https://example.com/avatar.png"
                value={form.avatar}
                onChange={(e) => updateField("avatar", e.target.value)}
                disabled={submitting}
              />
            </TextField>

            <TextField isRequired>
              <Label className="text-text-muted">联系邮箱</Label>
              <Input
                type="email"
                variant="secondary"
                className="text-text-base placeholder:text-text-muted"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={submitting}
              />
            </TextField>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end md:col-span-2">
              <Button
                variant="outline"
                isDisabled={submitting}
                onPress={() => setForm(initialForm)}
              >
                重置
              </Button>
              <Button variant="primary" isDisabled={submitting} onPress={() => void handleSubmit()}>
                {submitting ? <Spinner color="current" size="sm" /> : null}
                {submitting ? "提交中..." : "提交申请"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
