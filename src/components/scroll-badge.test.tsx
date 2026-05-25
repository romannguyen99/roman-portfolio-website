import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScrollBadge } from "./scroll-badge";
import { setLenis } from "@/lib/lenis";

afterEach(() => {
  setLenis(null);
  vi.restoreAllMocks();
});

describe("ScrollBadge", () => {
  it("renders a labeled scroll-down button", () => {
    render(<ScrollBadge started />);
    expect(screen.getByRole("button", { name: /scroll down/i })).toBeInTheDocument();
  });

  it("scrolls down one viewport when clicked", async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<ScrollBadge started />);
    await user.click(screen.getByRole("button", { name: /scroll down/i }));
    expect(spy).toHaveBeenCalledWith({ top: window.scrollY + window.innerHeight, behavior: "smooth" });
  });
});
