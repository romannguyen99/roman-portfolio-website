import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useHeroEntrance } from "./use-hero-entrance";

describe("useHeroEntrance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("does not start before any signal", () => {
    const { result } = renderHook(() => useHeroEntrance());
    expect(result.current).toBe(false);
  });

  it("starts when loader:complete fires", () => {
    const { result } = renderHook(() => useHeroEntrance());
    act(() => {
      window.dispatchEvent(new CustomEvent("loader:complete"));
    });
    expect(result.current).toBe(true);
  });

  it("starts on mount when the loader was already seen this session", () => {
    sessionStorage.setItem("loader-seen", "1");
    const { result } = renderHook(() => useHeroEntrance());
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe(true);
  });
});
