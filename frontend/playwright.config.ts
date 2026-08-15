import { defineConfig } from "@playwright/test";

const BACKEND_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql+asyncpg://theia:theia@localhost:5433/theia";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  webServer: [
    {
      command: "sh scripts/e2e_server.sh",
      url: "http://localhost:8000/health",
      reuseExistingServer: !process.env.CI,
      cwd: "../backend",
      env: {
        ...process.env,
        DATABASE_URL: BACKEND_DATABASE_URL,
        DATABASE_URL_SYNC: BACKEND_DATABASE_URL.replace("+asyncpg", ""),
      },
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
