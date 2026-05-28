import { describe, expect, it } from "vitest";
import { hexToRgb } from "./color";

describe("hexToRgb", () => {
  it("converts a 6-digit hex to normalized rgb", () => {
    expect(hexToRgb("#ffffff")).toEqual([1, 1, 1]);
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
  });

  it("handles a leading/trailing whitespace and no-hash input", () => {
    expect(hexToRgb("  ff0000 ")).toEqual([1, 0, 0]);
  });

  it("expands 3-digit shorthand", () => {
    expect(hexToRgb("#0f0")).toEqual([0, 1, 0]);
  });
});
