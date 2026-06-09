import type { NextConfig } from "next";

function ossRemotePattern() {
  const ossUrl = process.env.OSS_URL?.trim();
  if (!ossUrl) return null;

  try {
    const { protocol, hostname } = new URL(ossUrl);
    if (!hostname) return null;
    return {
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
    };
  } catch {
    return null;
  }
}

const ossPattern = ossRemotePattern();

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "ali-oss"],
  // 兜底方案，但是.next 文件夹会非常大
  // output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      ...(ossPattern ? [ossPattern] : []),
    ],
  },
};

export default nextConfig;
