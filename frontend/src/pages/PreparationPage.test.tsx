import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../App";
import { PreparationPage } from "./PreparationPage";

function renderPage() {
  return render(
    <MantineProvider env="test">
      <PreparationPage />
    </MantineProvider>,
  );
}

describe("preparation page", () => {
  it("starts with two of eight steps and updates progress in both directions", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText("Splněno 2 z 8 kroků (25 %)")).toBeDefined();
    expect(screen.getAllByRole("checkbox")).toHaveLength(8);
    const diet = screen.getByRole("checkbox", {
      name: /Připravit dostupné lékařské zprávy/,
    });
    await user.click(diet);
    expect(screen.getByText("Splněno 1 z 8 kroků (13 %)")).toBeDefined();
    await user.click(diet);
    expect(screen.getByText("Splněno 2 z 8 kroků (25 %)")).toBeDefined();
  });

  it("recalculates only on save and resets completion when the date changes", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    const date = screen.getByLabelText("Datum a čas návštěvy", {
      exact: false,
    });
    fireEvent.change(date, { target: { value: "2024-06-01T10:30" } });
    expect(screen.getByText("Neuložené změny")).toBeDefined();
    expect(screen.getByText("Splněno 2 z 8 kroků (25 %)")).toBeDefined();
    await user.click(
      screen.getByRole("button", {
        name: "Uložit zadané údaje a přepočítat plán",
      }),
    );
    expect(screen.getByText("Splněno 0 z 8 kroků (0 %)")).toBeDefined();
    expect(screen.queryByText("Neuložené změny")).toBeNull();
    const expected = new Date("2024-06-01T10:30").toISOString();
    expect(
      container.querySelector(`time[datetime="${expected}"]`),
    ).not.toBeNull();
  });

  it("preserves completion for location-only changes", async () => {
    const user = userEvent.setup();
    renderPage();
    const location = screen.getByRole("textbox", { name: /Oddělení/ });
    await user.clear(location);
    await user.type(location, "Budova C");
    await user.click(
      screen.getByRole("button", {
        name: "Uložit zadané údaje a přepočítat plán",
      }),
    );
    expect(screen.getByText("Splněno 2 z 8 kroků (25 %)")).toBeDefined();
    expect(screen.getByText(/Údaje byly uloženy v ukázce/)).toBeDefined();
  });

  it("rejects whitespace-only location without a save confirmation", async () => {
    const user = userEvent.setup();
    renderPage();
    const location = screen.getByRole("textbox", { name: /Oddělení/ });
    await user.clear(location);
    await user.type(location, "   ");
    await user.click(
      screen.getByRole("button", {
        name: "Uložit zadané údaje a přepočítat plán",
      }),
    );
    expect(screen.getByText("Zadejte oddělení nebo pracoviště.")).toBeDefined();
    expect(screen.queryByText(/Údaje byly uloženy v ukázce/)).toBeNull();
  });

  it("shows an explicit unavailable state for other procedures", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByRole("combobox"), "treatment-visit");
    await user.click(
      screen.getByRole("button", {
        name: "Uložit zadané údaje a přepočítat plán",
      }),
    );
    expect(screen.getByText("Plán není k dispozici")).toBeDefined();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(
      screen.queryByText(/Ukázkový harmonogram byl přepočítán/),
    ).toBeNull();
  });

  it("keeps the checklist when switching bottom-navigation sections", async () => {
    const user = userEvent.setup();
    render(
      <MantineProvider env="test">
        <App />
      </MantineProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Příprava" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: /Připravit dostupné lékařské zprávy/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Zprávy" }));
    expect(screen.queryByRole("checkbox")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Příprava" }));
    expect(screen.getByText("Splněno 1 z 8 kroků (13 %)")).toBeDefined();
  });
});
