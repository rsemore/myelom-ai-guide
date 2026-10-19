import { MantineProvider } from "@mantine/core";
import { IconMessage } from "@tabler/icons-react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BottomNavigationButton } from "./BottomNavigationButton";

describe("BottomNavigationButton", () => {
  it("renders an icon above a visible label and delegates clicks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <MantineProvider env="test">
        <BottomNavigationButton
          icon={<IconMessage />}
          label="Zprávy"
          active
          onClick={onClick}
        />
      </MantineProvider>,
    );

    const button = screen.getByRole("button", { name: "Zprávy" });
    const icon = button.querySelector('[aria-hidden="true"]');
    const label = screen.getByText("Zprávy");
    expect(icon?.querySelector("svg")).not.toBeNull();
    expect(icon?.nextElementSibling).toBe(label);
    expect(button.getAttribute("aria-current")).toBe("page");
    expect(button.getAttribute("type")).toBe("button");
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not mark inactive buttons as the current page", () => {
    render(
      <MantineProvider env="test">
        <BottomNavigationButton
          icon={<IconMessage />}
          label="Zprávy"
          active={false}
          onClick={vi.fn()}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("button").hasAttribute("aria-current")).toBe(false);
  });
});
