import { render, screen } from "@testing-library/react";
import { Contact } from "./index";

describe("Contact section", () => {
  it("renders a region with id='contact' and accessible name 'Contact'", () => {
    render(<Contact />);
    const region = screen.getByRole("region", { name: "Contact" });
    expect(region).toHaveAttribute("id", "contact");
  });

  it("uses an <h2> for the heading", () => {
    render(<Contact />);
    const heading = screen.getByRole("heading", { name: "Contact", level: 2 });
    expect(heading).toBeInTheDocument();
  });
});
