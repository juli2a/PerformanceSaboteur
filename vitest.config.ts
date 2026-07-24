import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // e2e/*.spec.ts files use @playwright/test's own test() — without this, Vitest's default include glob (**/*.spec.ts) picks them up too and crashes on the global `test` conflict.
    exclude: ["**/node_modules/**", "e2e/**"],
  },
});
