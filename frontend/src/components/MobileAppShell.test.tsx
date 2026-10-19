import type { ReactNode } from "react";

import { MantineProvider, Text } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as testingRender, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { contactIds, contacts } from "../config/contacts";
import { MobileAppShell } from "./MobileAppShell";

function render(ui: ReactNode) {
  const client = new QueryClient();
  return testingRender(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

vi.mock("@mantine/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mantine/hooks")>()),
  useElementSize: vi.fn(() => ({
    ref: { current: null },
    height: 128,
    width: 400,
  })),
}));

describe("MobileAppShell", () => {
  it("renders page content and a single persistent footer navigation", () => {
    render(
      <MantineProvider env="test">
        <MobileAppShell activeSection="messages" onNavigate={vi.fn()}>
          <Text>Page content</Text>
        </MobileAppShell>
      </MantineProvider>,
    );

    expect(
      within(screen.getByRole("main")).getByText("Page content"),
    ).toBeDefined();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(
      screen.getAllByRole("heading", { name: "Asistent pro pacienty" }),
    ).toHaveLength(1);
    expect(
      within(screen.getByRole("banner"))
        .getByRole("link", {
          name: "Kontaktovat zdravotníka",
        })
        .getAttribute("href"),
    ).toBe(`tel:${contacts[contactIds.medicalHelp]?.phone}`);
    expect(
      within(screen.getByRole("contentinfo")).getByRole("navigation"),
    ).toBeDefined();
    expect(
      screen
        .getByRole("button", { name: "Zprávy" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen
        .getByRole("button", { name: "Kontakty" })
        .hasAttribute("aria-current"),
    ).toBe(false);
  });

  it("updates the shell header height and main offset when the measured content changes", () => {
    function shell() {
      return (
        <MantineProvider env="test">
          <MobileAppShell activeSection="messages" onNavigate={vi.fn()}>
            <Text>Page content</Text>
          </MobileAppShell>
        </MantineProvider>
      );
    }
    const { container, rerender } = render(shell());
    expect(container.textContent).toContain(
      "--app-shell-header-height:calc(8rem * var(--mantine-scale))",
    );
    expect(container.textContent).toContain(
      "--app-shell-header-offset:calc(8rem * var(--mantine-scale))",
    );

    vi.mocked(useElementSize).mockReturnValueOnce({
      ref: { current: null },
      height: 192,
      width: 320,
    });
    rerender(shell());
    expect(container.textContent).toContain(
      "--app-shell-header-height:calc(12rem * var(--mantine-scale))",
    );
    expect(container.textContent).toContain(
      "--app-shell-header-offset:calc(12rem * var(--mantine-scale))",
    );
  });

  it("delegates navigation and preserves the footer when page content changes", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const { rerender } = render(
      <MantineProvider env="test">
        <MobileAppShell activeSection="messages" onNavigate={onNavigate}>
          <Text>Chat page</Text>
        </MobileAppShell>
      </MantineProvider>,
    );
    const navigation = screen.getByRole("navigation");
    await user.click(screen.getByRole("button", { name: "Kontakty" }));
    expect(onNavigate).toHaveBeenCalledWith("contacts");

    rerender(
      <MantineProvider env="test">
        <MobileAppShell activeSection="contacts" onNavigate={onNavigate}>
          <Text>Contacts page</Text>
        </MobileAppShell>
      </MantineProvider>,
    );
    expect(screen.getByRole("navigation")).toBe(navigation);
    expect(screen.queryByText("Chat page")).toBeNull();
    expect(screen.getByText("Contacts page")).toBeDefined();
    expect(
      screen
        .getByRole("button", { name: "Kontakty" })
        .getAttribute("aria-current"),
    ).toBe("page");
  });
});
