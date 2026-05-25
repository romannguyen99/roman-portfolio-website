import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { PageLoader } from "./page-loader";

const LOADER_SEEN_KEY = "loader-seen";

function withCompleteListener() {
  const handler = vi.fn();
  window.addEventListener("loader:complete", handler);
  return {
    handler,
    cleanup: () => window.removeEventListener("loader:complete", handler),
  };
}

describe("PageLoader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("shows the HOLD UP text on the first visit of a session", () => {
    render(<PageLoader />);
    expect(screen.getByText(/HOLD UP/i)).toBeInTheDocument();
  });

  it("does not fire loader:complete before the sequence finishes", () => {
    const { handler, cleanup } = withCompleteListener();
    render(<PageLoader />);

    act(() => {
      vi.advanceTimersByTime(1700);
    });

    expect(handler).not.toHaveBeenCalled();
    cleanup();
  });

  it("fires loader:complete, marks the session, and unmounts once the sequence finishes", () => {
    const { handler, cleanup } = withCompleteListener();
    render(<PageLoader />);

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(LOADER_SEEN_KEY)).toBe("1");
    expect(screen.queryByText(/HOLD UP/i)).not.toBeInTheDocument();
    cleanup();
  });

  it("skips the sequence and fires loader:complete immediately when already seen this session", () => {
    sessionStorage.setItem(LOADER_SEEN_KEY, "1");
    const { handler, cleanup } = withCompleteListener();

    const { container } = render(<PageLoader />);
    act(() => {
      vi.runAllTimers();
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/HOLD UP/i)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
    cleanup();
  });
});
