import { render, screen } from "@testing-library/react";

vi.mock("@/lib/webgl", () => ({
  isWebGLAvailable: vi.fn(),
}));

vi.mock("./orb-canvas", () => ({
  OrbCanvas: ({ onFirstFrame }: { onFirstFrame: () => void }) => {
    // Fire immediately so we can assert the post-firstFrame state.
    queueMicrotask(onFirstFrame);
    return <div data-testid="orb-canvas" />;
  },
}));

vi.mock("./orb-fallback", () => ({
  OrbFallback: () => <div data-testid="orb-fallback" />,
}));

import { isWebGLAvailable } from "@/lib/webgl";
import { OrbStage } from "./orb-stage";

describe("OrbStage", () => {
  afterEach(() => {
    vi.mocked(isWebGLAvailable).mockReset();
  });

  it("renders only the SVG fallback when WebGL is unavailable", () => {
    vi.mocked(isWebGLAvailable).mockReturnValue(false);
    render(<OrbStage />);
    expect(screen.getByTestId("orb-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("orb-canvas")).not.toBeInTheDocument();
  });

  it("renders both the SVG fallback and the canvas overlay when WebGL is available", () => {
    vi.mocked(isWebGLAvailable).mockReturnValue(true);
    render(<OrbStage />);
    expect(screen.getByTestId("orb-fallback")).toBeInTheDocument();
    expect(screen.getByTestId("orb-canvas")).toBeInTheDocument();
  });
});
