import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://test:test@127.0.0.1:5432/test",
      AUTH_SECRET: "test-auth-secret",
    },
  },
});
