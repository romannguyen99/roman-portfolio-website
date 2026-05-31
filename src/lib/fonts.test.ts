import { vi } from "vitest";

vi.mock("next/font/google", () => ({
  Plus_Jakarta_Sans: vi.fn(() => ({
    variable: "--font-plus-jakarta",
    className: "plus-jakarta-sans",
    style: { fontFamily: "Plus Jakarta Sans" },
  })),
  JetBrains_Mono: vi.fn(() => ({
    variable: "--font-jetbrains",
    className: "jetbrains-mono",
    style: { fontFamily: "JetBrains Mono" },
  })),
}));

import { plusJakarta, jetbrainsMono } from "./fonts";

describe("fonts module", () => {
  it("exports plusJakarta with a CSS variable class", () => {
    expect(typeof plusJakarta.variable).toBe("string");
    expect(plusJakarta.variable.length).toBeGreaterThan(0);
  });

  it("exports jetbrainsMono with a CSS variable class", () => {
    expect(typeof jetbrainsMono.variable).toBe("string");
    expect(jetbrainsMono.variable.length).toBeGreaterThan(0);
  });
});
