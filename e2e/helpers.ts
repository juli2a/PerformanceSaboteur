import type { BrowserContext } from "@playwright/test";

// Mirrors hooks/useToggleCase.ts's own cookie shape (`path=/; max-age=...`), minus the click + reload: a Playwright context.addCookies call before the first page.goto stands in for "the user already made this choice on an earlier visit," which is exactly what a Server Component reading the cookie can't tell apart from a real prior click. The click-to-set-cookie mechanism itself is already covered at the hook level (useToggleCase.test.ts).
export async function setSsrCookie(
  context: BrowserContext,
  baseURL: string,
  name: string,
  value: "on" | "off",
) {
  const url = new URL(baseURL);
  await context.addCookies([
    {
      name,
      value,
      domain: url.hostname,
      path: "/",
    },
  ]);
}
