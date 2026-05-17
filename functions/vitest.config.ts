import { defineConfig } from "vitest/config";

// Prevents Vitest from walking up and picking up the root vite.config.ts,
// which imports `vite` and `@vitejs/plugin-react` — neither are deps here.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
