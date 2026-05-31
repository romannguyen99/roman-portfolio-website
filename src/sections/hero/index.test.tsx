import { render, screen } from "@testing-library/react";

vi.mock("@/components/orb-stage", () => ({
  OrbStage: () => <div data-testid="orb-stage" />,
}));

import { Hero } from "./index";

describe("Hero section", () => {
  it("renders a region with id='hero' and accessible name 'Hero'", () => {
    render(<Hero />);
    const region = screen.getByRole("region", { name: "Hero" });
    expect(region).toHaveAttribute("id", "hero");
  });

  it("mounts the OrbStage inside the section", () => {
    render(<Hero />);
    expect(screen.getByTestId("orb-stage")).toBeInTheDocument();
  });
});
