import { MantineProvider } from "@mantine/core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "../App";
import { auditCsv, auditRecords } from "../data/dashboard";

afterEach(() => window.history.replaceState(null, "", "/"));

function renderAt(path: string) {
  window.history.replaceState(null, "", path);
  return render(
    <MantineProvider env="test">
      <App />
    </MantineProvider>,
  );
}

describe("practitioner URL", () => {
  it.each(["/doctor", "/doctor/"])(
    "opens a separate desktop shell at %s",
    (path) => {
      renderAt(path);
      expect(
        screen.getByRole("heading", {
          name: "Klinický audit a monitoring asistenta pacientů",
        }),
      ).toBeDefined();
      expect(
        screen.getByRole("navigation", { name: "Administrace a audit" }),
      ).toBeDefined();
      expect(screen.queryByRole("button", { name: "Příprava" })).toBeNull();
      expect(
        screen
          .getByRole("link", { name: "Otevřít pacientskou aplikaci" })
          .getAttribute("href"),
      ).toBe("/");
    },
  );

  it("keeps the patient app at the root URL", () => {
    renderAt("/");
    expect(screen.getByRole("button", { name: "Příprava" })).toBeDefined();
    expect(
      screen.queryByRole("navigation", { name: "Administrace a audit" }),
    ).toBeNull();
  });

  it("does not treat unknown URLs as the patient app", () => {
    renderAt("/missing");
    expect(screen.getByText("Stránka nebyla nalezena.")).toBeDefined();
  });

  it("allows local review and updates the pending count", async () => {
    const user = userEvent.setup();
    renderAt("/doctor");
    await user.click(
      screen.getByRole("button", { name: "Prověřit dotaz Q-001" }),
    );
    const dialog = within(await screen.findByRole("dialog"));
    await user.type(dialog.getByRole("textbox"), "Testovací poznámka");
    await user.click(
      dialog.getByRole("button", { name: "Označit jako vyřešené v ukázce" }),
    );
    expect(screen.getByText("Čeká k vyřízení: 2")).toBeDefined();
    expect(screen.getByText("Vyřešeno v ukázce")).toBeDefined();
    expect(screen.getByRole("status").textContent).toContain("pouze v ukázce");
  });

  it("switches dashboard sections and explicitly reports unavailable live data", async () => {
    const user = userEvent.setup();
    renderAt("/doctor");
    await user.click(screen.getByRole("button", { name: "Log konverzací" }));
    expect(
      screen.queryByRole("heading", { name: "Nezodpovězené dotazy k revizi" }),
    ).toBeNull();
    expect(screen.getByRole("table")).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Obnovit data" }));
    expect(screen.getByRole("status").textContent).toContain(
      "Živá data nejsou připojena",
    );
    await user.click(
      screen.getByRole("button", { name: "Správa zdrojových dokumentů" }),
    );
    expect(screen.getByText("Správa dokumentů není připojena")).toBeDefined();
  });
});

describe("audit CSV", () => {
  it("exports exactly the supplied records with Czech CSV delimiters", () => {
    const csv = auditCsv(auditRecords);
    expect(csv.startsWith('\uFEFF"ID";"Čas"')).toBe(true);
    expect(csv.split("\r\n")).toHaveLength(4);
    for (const record of auditRecords) expect(csv).toContain(`"${record.id}"`);
  });

  it("escapes quotes and neutralizes spreadsheet formulas", () => {
    const record = auditRecords[0];
    if (!record) throw new Error("Missing demo record");
    const csv = auditCsv([{ ...record, question: '=HYPERLINK("example")' }]);
    expect(csv).toContain(`"'=HYPERLINK(""example"")"`);
  });
});
