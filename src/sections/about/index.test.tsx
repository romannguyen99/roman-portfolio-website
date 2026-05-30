import { render, screen } from "@testing-library/react";
import { About } from "./index";

describe("About section", () => {
  it("renders a region with id='about' and accessible name 'About'", () => {
    render(<About />);
    const region = screen.getByRole("region", { name: "About" });
    expect(region).toHaveAttribute("id", "about");
  });

  it("uses an <h2> for the heading", () => {
    render(<About />);
    const heading = screen.getByRole("heading", { name: "About", level: 2 });
    expect(heading).toBeInTheDocument();
  });
});
