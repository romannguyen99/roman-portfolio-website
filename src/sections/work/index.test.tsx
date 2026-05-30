import { render, screen } from "@testing-library/react";
import { Work } from "./index";

describe("Work section", () => {
  it("renders a region with id='work' and accessible name 'Work'", () => {
    render(<Work />);
    const region = screen.getByRole("region", { name: "Work" });
    expect(region).toHaveAttribute("id", "work");
  });

  it("uses an <h2> for the heading", () => {
    render(<Work />);
    const heading = screen.getByRole("heading", { name: "Work", level: 2 });
    expect(heading).toBeInTheDocument();
  });
});
