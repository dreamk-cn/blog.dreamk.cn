import z from "zod";
import { DEV_SITE_ORIGIN } from "./env.public";

const DEEPSEEK_DEFAULT_MODEL = "deepseek-v4-flash";

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function readOptionalInt(raw: string | undefined, fallback: number, min = 0): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? Math.max(min, n) : fallback;
}

const rawEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    SKIP_ENV_VALIDATION: z.string().optional(),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
    NEXT_PUBLIC_BASE_URL: z.string().optional(),
    AUTH_URL: z.string().optional(),
    ADMIN_EMAIL: z.string().optional(),
    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    EMAIL_HOST: z.string().optional(),
    EMAIL_PORT: z.string().optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    OSS_ACCESS_KEY_ID: z.string().optional(),
    OSS_ACCESS_KEY_SECRET: z.string().optional(),
    OSS_ENDPOINT: z.string().optional(),
    OSS_BUCKET: z.string().optional(),
    OSS_URL: z.string().optional(),
    OSS_PREFIX: z.string().optional(),
    OSS_MAX_FILE_SIZE_MB: z.string().optional(),
    DEEPSEEK_API_KEY: z.string().optional(),
    DEEPSEEK_SLUG_MODEL: z.string().optional(),
    DEEPSEEK_EXCERPT_MODEL: z.string().optional(),
    DEEPSEEK_AGENT_MODEL: z.string().optional(),
    CACHE_DRIVER: z.string().optional(),
    AUTH_REGISTER_RATE_MAX: z.string().optional(),
    AUTH_REGISTER_RATE_WINDOW_SEC: z.string().optional(),
    AUTH_LOGIN_RATE_MAX: z.string().optional(),
    AUTH_LOGIN_RATE_WINDOW_SEC: z.string().optional(),
    AUTH_REGISTER_CODE_TTL_SEC: z.string().optional(),
    AUTH_REGISTER_SEND_CODE_IP_MAX: z.string().optional(),
    AUTH_REGISTER_SEND_CODE_IP_WINDOW_SEC: z.string().optional(),
    AUTH_REGISTER_SEND_CODE_EMAIL_MAX: z.string().optional(),
    AUTH_REGISTER_SEND_CODE_EMAIL_WINDOW_SEC: z.string().optional(),
    AUTH_REGISTER_SEND_CODE_COOLDOWN_SEC: z.string().optional(),
    ANONYMOUS_COMMENT_RATE_MAX: z.string().optional(),
    ANONYMOUS_COMMENT_RATE_WINDOW_SEC: z.string().optional(),
    TRUST_PROXY: z.string().optional(),
    ACCESS_LOG_RETENTION_DAYS: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && !trimOptional(data.NEXT_PUBLIC_BASE_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_BASE_URL"],
        message: "NEXT_PUBLIC_BASE_URL is required in production",
      });
    }

    const adminEmail = trimOptional(data.ADMIN_EMAIL);
    if (adminEmail && !z.string().email().safeParse(adminEmail).success) {
      ctx.addIssue({
        code: "custom",
        path: ["ADMIN_EMAIL"],
        message: "ADMIN_EMAIL must be a valid email",
      });
    }

    const authUrl = trimOptional(data.AUTH_URL);
    if (authUrl && !z.string().url().safeParse(authUrl).success) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_URL"],
        message: "AUTH_URL must be a valid URL",
      });
    }

    const siteUrl = trimOptional(data.NEXT_PUBLIC_BASE_URL);
    if (siteUrl && !z.string().url().safeParse(siteUrl).success) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_BASE_URL"],
        message: "NEXT_PUBLIC_BASE_URL must be a valid URL",
      });
    }

    const githubId = trimOptional(data.AUTH_GITHUB_ID);
    const githubSecret = trimOptional(data.AUTH_GITHUB_SECRET);
    if (Boolean(githubId) !== Boolean(githubSecret)) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_GITHUB_ID"],
        message: "AUTH_GITHUB_ID and AUTH_GITHUB_SECRET must be set together",
      });
    }

    const googleId = trimOptional(data.AUTH_GOOGLE_ID);
    const googleSecret = trimOptional(data.AUTH_GOOGLE_SECRET);
    if (Boolean(googleId) !== Boolean(googleSecret)) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_GOOGLE_ID"],
        message: "AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set together",
      });
    }

    const emailHost = trimOptional(data.EMAIL_HOST);
    const emailUser = trimOptional(data.EMAIL_USER);
    const emailPass = trimOptional(data.EMAIL_PASS);
    const emailFrom = trimOptional(data.EMAIL_FROM);
    const emailPort = trimOptional(data.EMAIL_PORT);
    const hasEmailConfig = Boolean(emailHost || emailUser || emailPass || emailFrom || emailPort);
    if (hasEmailConfig && (!emailHost || !emailUser || !emailPass)) {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_HOST"],
        message: "EMAIL_HOST, EMAIL_USER, and EMAIL_PASS are required when email is configured",
      });
    }

    const ossKeys = {
      accessKeyId: trimOptional(data.OSS_ACCESS_KEY_ID),
      accessKeySecret: trimOptional(data.OSS_ACCESS_KEY_SECRET),
      endpoint: trimOptional(data.OSS_ENDPOINT),
      bucket: trimOptional(data.OSS_BUCKET),
      publicUrl: trimOptional(data.OSS_URL),
      prefix: trimOptional(data.OSS_PREFIX),
    };
    const hasOssCore = Boolean(
      ossKeys.accessKeyId ||
        ossKeys.accessKeySecret ||
        ossKeys.endpoint ||
        ossKeys.bucket ||
        ossKeys.publicUrl,
    );
    if (hasOssCore) {
      const ossFieldPaths: Record<keyof typeof ossKeys, string> = {
        accessKeyId: "OSS_ACCESS_KEY_ID",
        accessKeySecret: "OSS_ACCESS_KEY_SECRET",
        endpoint: "OSS_ENDPOINT",
        bucket: "OSS_BUCKET",
        publicUrl: "OSS_URL",
        prefix: "OSS_PREFIX",
      };
      for (const [key, value] of Object.entries(ossKeys) as [keyof typeof ossKeys, string | undefined][]) {
        if (!value && key !== "prefix") {
          ctx.addIssue({
            code: "custom",
            path: [ossFieldPaths[key]],
            message: "OSS core variables must all be set when OSS is configured",
          });
        }
      }
    }

    const ossMaxMb = trimOptional(data.OSS_MAX_FILE_SIZE_MB);
    if (ossMaxMb) {
      const n = Number(ossMaxMb);
      if (!Number.isFinite(n) || n <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["OSS_MAX_FILE_SIZE_MB"],
          message: "OSS_MAX_FILE_SIZE_MB must be a positive number",
        });
      }
    }
  });

type RawEnv = z.infer<typeof rawEnvSchema>;

function resolveSiteOrigin(raw: RawEnv): string {
  const siteUrl = trimOptional(raw.NEXT_PUBLIC_BASE_URL);
  if (siteUrl) return siteUrl.replace(/\/+$/, "");
  if (raw.NODE_ENV === "development") return DEV_SITE_ORIGIN;
  throw new Error("NEXT_PUBLIC_BASE_URL must be set in production");
}

function resolveCacheDriver(raw: string | undefined): "postgres" | "redis" {
  const driver = (raw ?? "postgres").trim().toLowerCase();
  return driver === "redis" ? "redis" : "postgres";
}

function buildEnv(raw: RawEnv) {
  const isDev = raw.NODE_ENV === "development";
  const adminEmail = trimOptional(raw.ADMIN_EMAIL) ?? null;

  const emailHost = trimOptional(raw.EMAIL_HOST);
  const emailUser = trimOptional(raw.EMAIL_USER);
  const emailPass = trimOptional(raw.EMAIL_PASS);
  const email =
    emailHost && emailUser && emailPass
      ? {
          host: emailHost,
          port: readOptionalInt(raw.EMAIL_PORT, 465, 1),
          user: emailUser,
          pass: emailPass,
          from: trimOptional(raw.EMAIL_FROM) ?? emailUser,
        }
      : null;

  const ossAccessKeyId = trimOptional(raw.OSS_ACCESS_KEY_ID);
  const ossAccessKeySecret = trimOptional(raw.OSS_ACCESS_KEY_SECRET);
  const ossEndpoint = trimOptional(raw.OSS_ENDPOINT);
  const ossBucket = trimOptional(raw.OSS_BUCKET);
  const ossPublicUrl = trimOptional(raw.OSS_URL);
  const oss =
    ossAccessKeyId && ossAccessKeySecret && ossEndpoint && ossBucket && ossPublicUrl
      ? {
          accessKeyId: ossAccessKeyId,
          accessKeySecret: ossAccessKeySecret,
          endpoint: ossEndpoint,
          bucket: ossBucket,
          publicUrl: ossPublicUrl.replace(/\/$/, ""),
          prefix: (trimOptional(raw.OSS_PREFIX) ?? "blog").replace(/^\/+|\/+$/g, ""),
          maxFileSizeMb: readOptionalInt(raw.OSS_MAX_FILE_SIZE_MB, 5, 1),
        }
      : null;

  const apiKey = trimOptional(raw.DEEPSEEK_API_KEY);
  const excerptModel = trimOptional(raw.DEEPSEEK_EXCERPT_MODEL) ?? DEEPSEEK_DEFAULT_MODEL;
  const agentModel = trimOptional(raw.DEEPSEEK_AGENT_MODEL) ?? excerptModel;
  const ai = apiKey
    ? {
        apiKey,
        slugModel: trimOptional(raw.DEEPSEEK_SLUG_MODEL) ?? excerptModel,
        excerptModel,
        agentModel,
      }
    : null;

  const rateLimits = {
    AUTH_REGISTER_RATE_MAX: readOptionalInt(raw.AUTH_REGISTER_RATE_MAX, 5),
    AUTH_REGISTER_RATE_WINDOW_SEC: readOptionalInt(raw.AUTH_REGISTER_RATE_WINDOW_SEC, 3600, 1),
    AUTH_LOGIN_RATE_MAX: readOptionalInt(raw.AUTH_LOGIN_RATE_MAX, 10),
    AUTH_LOGIN_RATE_WINDOW_SEC: readOptionalInt(raw.AUTH_LOGIN_RATE_WINDOW_SEC, 300, 1),
    AUTH_REGISTER_CODE_TTL_SEC: readOptionalInt(raw.AUTH_REGISTER_CODE_TTL_SEC, 600, 1),
    AUTH_REGISTER_SEND_CODE_IP_MAX: readOptionalInt(raw.AUTH_REGISTER_SEND_CODE_IP_MAX, 5),
    AUTH_REGISTER_SEND_CODE_IP_WINDOW_SEC: readOptionalInt(
      raw.AUTH_REGISTER_SEND_CODE_IP_WINDOW_SEC,
      3600,
      1,
    ),
    AUTH_REGISTER_SEND_CODE_EMAIL_MAX: readOptionalInt(raw.AUTH_REGISTER_SEND_CODE_EMAIL_MAX, 3),
    AUTH_REGISTER_SEND_CODE_EMAIL_WINDOW_SEC: readOptionalInt(
      raw.AUTH_REGISTER_SEND_CODE_EMAIL_WINDOW_SEC,
      3600,
      1,
    ),
    AUTH_REGISTER_SEND_CODE_COOLDOWN_SEC: readOptionalInt(
      raw.AUTH_REGISTER_SEND_CODE_COOLDOWN_SEC,
      60,
      1,
    ),
    ANONYMOUS_COMMENT_RATE_MAX: readOptionalInt(raw.ANONYMOUS_COMMENT_RATE_MAX, 5),
    ANONYMOUS_COMMENT_RATE_WINDOW_SEC: readOptionalInt(raw.ANONYMOUS_COMMENT_RATE_WINDOW_SEC, 60, 1),
  } as const;

  return {
    isDev,
    nodeEnv: raw.NODE_ENV,
    site: { origin: resolveSiteOrigin(raw) },
    adminEmail,
    email,
    oss,
    ai,
    cache: { driver: resolveCacheDriver(raw.CACHE_DRIVER) },
    rateLimits,
    trustProxy: trimOptional(raw.TRUST_PROXY) === "true",
    accessLogRetentionDays: readOptionalInt(raw.ACCESS_LOG_RETENTION_DAYS, 90, 1),
    oauth: {
      github: Boolean(trimOptional(raw.AUTH_GITHUB_ID) && trimOptional(raw.AUTH_GITHUB_SECRET)),
      google: Boolean(trimOptional(raw.AUTH_GOOGLE_ID) && trimOptional(raw.AUTH_GOOGLE_SECRET)),
    },
  };
}

function parseEnv() {
  const skipValidation = process.env.SKIP_ENV_VALIDATION === "1";
  const result = rawEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
    if (skipValidation) {
      console.warn("SKIP_ENV_VALIDATION=1, continuing despite invalid environment variables");
      return buildEnv({
        NODE_ENV: (process.env.NODE_ENV as RawEnv["NODE_ENV"]) ?? "development",
        DATABASE_URL: process.env.DATABASE_URL ?? "",
        AUTH_SECRET: process.env.AUTH_SECRET ?? "",
      });
    }
    throw new Error("Invalid environment variables");
  }

  return buildEnv(result.data);
}

export const env = parseEnv();
export const isDev = env.isDev;

export type RateLimitEnvKey = keyof typeof env.rateLimits;
