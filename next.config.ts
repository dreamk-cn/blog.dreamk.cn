import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      // 接入 OSS 后在此追加 bucket 域名，例如：
      // { protocol: "https", hostname: "your-bucket.oss-cn-hangzhou.aliyuncs.com" },
    ],
  },
};

export default nextConfig;
