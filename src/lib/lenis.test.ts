import { afterEach, describe, expect, it, vi } from "vitest";
import type Lenis from "lenis";
import { getLenis, scrollToNext, setLenis } from "./lenis";

afterEach(() => {
  setLenis(null);
  vi.restoreAllMocks();
});

describe("lenis registry", () => {
  it("stores and returns the instance", () => {
    const fake = { scrollTo: vi.fn() } as unknown as Lenis;
    setLenis(fake);
    expect(getLenis()).toBe(fake);
  });

  it("scrollToNext uses the lenis instance when one is registered", () => {
    const scrollTo = vi.fn();
    setLenis({ scrollTo } as unknown as Lenis);
    scrollToNext();
    expect(scrollTo).toHaveBeenCalledWith(window.scrollY + window.innerHeight);
  });

  it("scrollToNext falls back to window.scrollTo when no instance", () => {
    const spy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    scrollToNext();
    expect(spy).toHaveBeenCalledWith({ top: window.scrollY + window.innerHeight, behavior: "smooth" });
  });
});
