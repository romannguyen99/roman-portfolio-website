import { isWebGLAvailable } from "./webgl";

describe("isWebGLAvailable", () => {
  it("returns false in jsdom (no WebGL context)", () => {
    expect(isWebGLAvailable()).toBe(false);
  });
});
