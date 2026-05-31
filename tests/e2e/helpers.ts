import { Page } from "@playwright/test";

/**
 * Wait until React has hydrated the page. networkidle alone isn't enough —
 * the JS bundle finishes loading but React's hydration happens just after.
 *
 * We poll a target element for the `__reactFiber*` key (attached only after
 * hydration). 15s budget; if it doesn't hydrate, tests should fail with a
 * clearer message than a click timeout.
 */
export async function waitForHydration(
  page: Page,
  selector = "main",
  timeoutMs = 20_000,
): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      return Reflect.ownKeys(el).some(
        (k) => typeof k === "string" && k.startsWith("__reactFiber"),
      );
    },
    selector,
    { timeout: timeoutMs },
  );
}

/**
 * Wait until a specific interactive element is React-hydrated.
 * Use this when waitForHydration("main") passes but a nested client
 * component's input still doesn't accept events.
 */
export async function waitForInteractive(
  page: Page,
  selector: string,
  timeoutMs = 20_000,
): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const keys = Reflect.ownKeys(el).map(String);
      return (
        keys.some((k) => k.startsWith("__reactFiber")) &&
        keys.some((k) => k.startsWith("__reactProps"))
      );
    },
    selector,
    { timeout: timeoutMs },
  );
}
