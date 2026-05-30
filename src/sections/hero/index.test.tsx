import { render, screen } from "@testing-library/react";
import { Hero } from "./index";

describe("Hero section", () => {
  it("renders a region with id='hero' and accessible name 'Hero'", () => {
    render(<Hero />);
    const region = screen.getByRole("region", { name: "Hero" });
    expect(region).toHaveAttribute("id", "hero");
  });

  it("uses an <h1> for the heading", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { name: "Hero", level: 1 });
    expect(heading).toBeInTheDocument();
  });
});
