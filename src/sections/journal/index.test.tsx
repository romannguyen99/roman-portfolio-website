import { render, screen } from "@testing-library/react";
import { Journal } from "./index";

describe("Journal section", () => {
  it("renders a region with id='journal' and accessible name 'Journal'", () => {
    render(<Journal />);
    const region = screen.getByRole("region", { name: "Journal" });
    expect(region).toHaveAttribute("id", "journal");
  });

  it("uses an <h2> for the heading", () => {
    render(<Journal />);
    const heading = screen.getByRole("heading", { name: "Journal", level: 2 });
    expect(heading).toBeInTheDocument();
  });
});
