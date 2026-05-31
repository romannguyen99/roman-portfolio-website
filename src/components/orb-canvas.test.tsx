import { render } from "@testing-library/react";

// jsdom does not implement matchMedia or IntersectionObserver; stub both.
beforeAll(() => {
  vi.stubGlobal("matchMedia", (q: string) => ({
    media: q,
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: () => {},
  useThree: () => ({ invalidate: () => {}, size: { width: 0, height: 0 } }),
}));

vi.mock("./orb", () => ({
  Orb: () => <div data-testid="orb-mesh" />,
}));

import { OrbCanvas } from "./orb-canvas";

describe("OrbCanvas", () => {
  it("renders a Canvas with the Orb mesh inside", () => {
    const { getByTestId } = render(<OrbCanvas onFirstFrame={() => {}} />);
    expect(getByTestId("r3f-canvas")).toBeInTheDocument();
    expect(getByTestId("orb-mesh")).toBeInTheDocument();
  });
});
