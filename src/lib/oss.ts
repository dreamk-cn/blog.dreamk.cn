import OSS from "ali-oss";
import { randomBytes } from "crypto";
import { isDev } from "@/utils/env";

export function getOssPrefix() {
  return isDev ? "blog-dev" : "blog";
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type OssUploadCategory = "covers" | "images" | "asset";

function requireOssEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少 OSS 环境变量: ${name}`);
  }
  return value;
}

export function getOssConfig() {
  return {
    accessKeyId: requireOssEnv("OSS_ACCESS_KEY_ID"),
    accessKeySecret: requireOssEnv("OSS_ACCESS_KEY_SECRET"),
    endpoint: requireOssEnv("OSS_ENDPOINT"),
    bucket: requireOssEnv("OSS_BUCKET"),
    publicUrl: requireOssEnv("OSS_URL").replace(/\/$/, ""),
  };
}

let ossClient: OSS | null = null;

function getOssClient() {
  if (!ossClient) {
    const { accessKeyId, accessKeySecret, endpoint, bucket } = getOssConfig();
    ossClient = new OSS({
      accessKeyId,
      accessKeySecret,
      endpoint,
      bucket,
    });
  }
  return ossClient;
}

export function extensionFromMime(mimeType: string) {
  return MIME_TO_EXT[mimeType] ?? null;
}

export function buildObjectKey(category: OssUploadCategory, extension: string) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const folder = category === "covers" ? "covers" : category === "images" ? "images" : "assets";
  const id = randomBytes(8).toString("hex");
  return `${getOssPrefix()}/${folder}/${year}/${month}/${id}.${extension}`;
}

export function buildPublicUrl(key: string) {
  const { publicUrl } = getOssConfig();
  return `${publicUrl}/${key}`;
}

export async function uploadImage(
  buffer: Buffer,
  input: { category: OssUploadCategory; contentType: string; extension: string },
) {
  const key = buildObjectKey(input.category, input.extension);
  const client = getOssClient();

  await client.put(key, buffer, {
    headers: {
      "Content-Type": input.contentType,
    },
  });

  return {
    key,
    url: buildPublicUrl(key),
  };
}

export function getOssHostname() {
  try {
    return new URL(getOssConfig().publicUrl).hostname;
  } catch {
    return null;
  }
}
