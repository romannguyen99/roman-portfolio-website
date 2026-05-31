import { hexToRgb } from "./color";

describe("hexToRgb", () => {
  it("parses 6-digit hex with leading #", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#ffffff")).toEqual([1, 1, 1]);
  });

  it("parses 6-digit hex without leading #", () => {
    expect(hexToRgb("0a0a0a")).toEqual([10 / 255, 10 / 255, 10 / 255]);
  });

  it("expands 3-digit hex", () => {
    expect(hexToRgb("#0f0")).toEqual([0, 1, 0]);
    expect(hexToRgb("#abc")).toEqual([
      0xaa / 255,
      0xbb / 255,
      0xcc / 255,
    ]);
  });

  it("trims surrounding whitespace (CSS values often have it)", () => {
    expect(hexToRgb("  #d4a574  ")).toEqual([
      0xd4 / 255,
      0xa5 / 255,
      0x74 / 255,
    ]);
  });
});
