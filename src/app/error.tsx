'use client'

import { Alert, Button, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const isDev = process.env.NODE_ENV === "development";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (isDev) {
      console.error("[Error boundary]", error);
    } else if (error.digest) {
      console.error("[Error boundary]", error.digest);
    } else {
      console.error("[Error boundary] unexpected error");
    }
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-4">
        {isDev ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Chip color="warning" size="sm" variant="soft">
                <Chip.Label>开发模式</Chip.Label>
              </Chip>
              <span className="text-sm text-text-muted">
                以下为完整错误信息，生产构建不会展示给用户
              </span>
            </div>
            <Alert status="danger">
              <Alert.Title>
                {error.name}
                {error.message ? `：${error.message}` : ""}
              </Alert.Title>
              <Alert.Description>
                <div className="space-y-3">
                  {error.digest ? (
                    <p className="font-mono text-xs text-text-muted">
                      digest: {error.digest}
                    </p>
                  ) : null}
                  {error.stack ? (
                    <pre className="max-h-[min(50vh,320px)] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-foreground p-3 font-mono text-xs text-text-base">
                      {error.stack}
                    </pre>
                  ) : null}
                </div>
              </Alert.Description>
            </Alert>
          </div>
        ) : (
          <Alert status="danger">
            <Alert.Title>页面出错了</Alert.Title>
            <Alert.Description>
              <div className="space-y-2">
                <p>
                  抱歉，加载页面时遇到问题。请稍后重试，或返回首页继续浏览。
                </p>
                {error.digest ? (
                  <p className="font-mono text-xs text-text-muted">
                    错误编号（反馈时可附上）：{error.digest}
                  </p>
                ) : null}
              </div>
            </Alert.Description>
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onPress={() => reset()} variant="danger">
            重试
          </Button>
          <Button onPress={() => router.push("/")} variant="secondary">
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}
