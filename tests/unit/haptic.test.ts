import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { haptic } from "@/lib/haptic";

describe("haptic", () => {
  const vibrate = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("navigator", { vibrate } as unknown as Navigator);
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
    } as unknown as Window);
    vibrate.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls navigator.vibrate with a numeric pattern for 'light'", () => {
    haptic("light");
    expect(vibrate).toHaveBeenCalledWith(10);
  });

  it("calls navigator.vibrate with an array pattern for 'success'", () => {
    haptic("success");
    expect(vibrate).toHaveBeenCalledWith([12, 30, 18]);
  });

  it("respects prefers-reduced-motion: never vibrates", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: true }),
    } as unknown as Window);
    haptic("error");
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("is a no-op when navigator.vibrate is missing", () => {
    vi.stubGlobal("navigator", {} as unknown as Navigator);
    expect(() => haptic("light")).not.toThrow();
    expect(vibrate).not.toHaveBeenCalled();
  });
});
