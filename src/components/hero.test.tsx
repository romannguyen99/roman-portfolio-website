import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./hero";

describe("Hero", () => {
  it("renders the headline split into words", () => {
    render(<Hero />);
    expect(screen.getByText("Roman")).toBeInTheDocument();
    expect(screen.getByText("Nguyen")).toBeInTheDocument();
  });

  it("renders the scroll-down control", () => {
    render(<Hero />);
    expect(screen.getByRole("button", { name: /scroll down/i })).toBeInTheDocument();
  });
});
