import { beforeEach, describe, expect, it, vi } from "vitest";

const rateLimits = vi.hoisted(() => ({
  POST_VIEW_RATE_MAX: undefined as number | undefined,
  POST_VIEW_RATE_WINDOW_SEC: undefined as number | undefined,
}));

vi.mock("@/config/env", () => ({
  env: { rateLimits },
}));

import { readRateLimitEnvInt } from "./fixed-window-rate-limit";

describe("readRateLimitEnvInt", () => {
  beforeEach(() => {
    rateLimits.POST_VIEW_RATE_MAX = undefined;
    rateLimits.POST_VIEW_RATE_WINDOW_SEC = undefined;
  });

  it("uses env value when set", () => {
    rateLimits.POST_VIEW_RATE_MAX = 3;
    expect(readRateLimitEnvInt("POST_VIEW_RATE_MAX", 1)).toBe(3);
  });

  it("falls back when env value is undefined", () => {
    expect(readRateLimitEnvInt("POST_VIEW_RATE_MAX", 1)).toBe(1);
  });

  it("applies Math.max with min", () => {
    rateLimits.POST_VIEW_RATE_WINDOW_SEC = 0;
    expect(readRateLimitEnvInt("POST_VIEW_RATE_WINDOW_SEC", 86400, 1)).toBe(1);
  });

  it("allows zero when min is 0 (disable rate limit)", () => {
    rateLimits.POST_VIEW_RATE_MAX = 0;
    expect(readRateLimitEnvInt("POST_VIEW_RATE_MAX", 1, 0)).toBe(0);
  });
});
