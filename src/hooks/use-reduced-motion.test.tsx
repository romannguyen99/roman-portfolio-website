import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "./use-reduced-motion";

describe("useReducedMotion", () => {
  type Listener = (e: { matches: boolean }) => void;
  let listeners: Listener[];
  let matches: boolean;

  beforeEach(() => {
    listeners = [];
    matches = false;
    vi.stubGlobal("matchMedia", (q: string) => ({
      media: q,
      get matches() {
        return matches;
      },
      addEventListener: (_t: string, cb: Listener) => listeners.push(cb),
      removeEventListener: (_t: string, cb: Listener) => {
        listeners = listeners.filter((l) => l !== cb);
      },
      addListener: (cb: Listener) => listeners.push(cb),
      removeListener: (cb: Listener) => {
        listeners = listeners.filter((l) => l !== cb);
      },
      dispatchEvent: () => true,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns current matchMedia value", () => {
    matches = true;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when the media query change event fires", () => {
    matches = false;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listeners.forEach((cb) => cb({ matches: true }));
    });
    expect(result.current).toBe(true);
  });
});
