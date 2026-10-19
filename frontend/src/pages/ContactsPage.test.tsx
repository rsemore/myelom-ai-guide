import { MantineProvider } from "@mantine/core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Contacts } from "../types/contacts";

import { App } from "../App";
import { contactIds, contacts as fnoContacts } from "../config/contacts";
import { ContactsPage } from "./ContactsPage";

const contacts: Contacts = {
  [contactIds.medicalHelp]: {
    id: contactIds.medicalHelp,
    label: "Záchranná služba",
    phone: "155",
  },
  [contactIds.emergency]: {
    id: contactIds.emergency,
    label: "Tísňová linka",
    phone: "112",
  },
  [contactIds.coordinator]: {
    id: contactIds.coordinator,
    label: "Koordinátor",
    phone: "+420 555 010 020",
    hours: "Po–Pá 7:00–15:30",
  },
  [contactIds.clinic]: {
    id: contactIds.clinic,
    label: "Ambulance",
    phone: "+420 555 020 030",
  },
  [contactIds.inpatient]: {
    id: contactIds.inpatient,
    label: "Pohotovost",
    phone: "+420 555 030 040",
  },
  [contactIds.gp]: {
    id: contactIds.gp,
    label: "Praktik",
    personName: "Testovací lékař",
    phone: "+420 555 040 050",
    hours: "Dle objednání",
  },
};

function renderPage(config: Contacts = contacts) {
  render(
    <MantineProvider env="test">
      <ContactsPage contacts={config} />
    </MantineProvider>,
  );
}

describe("contacts directory", () => {
  it("shows published FN Ostrava numbers and their official source links", () => {
    renderPage(fnoContacts);
    const myeloma = within(
      screen.getByRole("article", { name: "Myelomová ambulance FN Ostrava" }),
    );
    expect(
      myeloma.getByRole("link", { name: /Zavolat/ }).getAttribute("href"),
    ).toBe("tel:+420704960513");
    expect(
      myeloma
        .getByRole("link", { name: /Zdroj kontaktu/ })
        .getAttribute("href"),
    ).toBe("https://www.fno.cz/klinika-hematoonkologie/ambulance");
    const inpatient = within(
      screen.getByRole("article", {
        name: "Informace o hospitalizovaných pacientech",
      }),
    );
    expect(
      inpatient.getByRole("link", { name: /Zavolat/ }).getAttribute("href"),
    ).toBe("tel:+420553048832");
    expect(inpatient.getByText(/Nejde o pohotovost/)).toBeDefined();
  });

  it("shows emergency contacts first and resolves each telephone link from config", () => {
    renderPage();
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "tel:155",
      "tel:112",
      "tel:+420555010020",
      "tel:+420555020030",
      "tel:+420555030040",
    ]);
    const coordinator = within(
      screen.getByRole("article", { name: "Myelomová ambulance FN Ostrava" }),
    );
    expect(
      coordinator.getByText("Po–Pá 7:00–15:30", { exact: false }),
    ).toBeDefined();
    expect(screen.queryByText("Oficiální ověřený zdroj")).toBeNull();
    expect(screen.getByText(/nejsou nepřetržitou pohotovostí/)).toBeDefined();
  });

  it("expands and collapses configured GP details with an accessible toggle", async () => {
    const user = userEvent.setup();
    renderPage();
    const toggle = screen.getByRole("button", {
      name: "Zobrazit kontakt na praktika",
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen.queryByRole("link", { name: "Zavolat – Praktik" }),
    ).toBeNull();
    await user.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const detailsId = toggle.getAttribute("aria-controls");
    expect(
      detailsId && document.getElementById(detailsId)?.textContent,
    ).toContain("Testovací lékař");
    expect(
      screen
        .getByRole("link", { name: "Zavolat – Praktik" })
        .getAttribute("href"),
    ).toBe("tel:+420555040050");
    await user.click(
      screen.getByRole("button", { name: "Skrýt kontakt na praktika" }),
    );
    expect(
      screen.queryByRole("link", { name: "Zavolat – Praktik" }),
    ).toBeNull();
  });

  it("reports missing phone numbers without inventing contacts or emergency fallbacks", async () => {
    const user = userEvent.setup();
    renderPage({});
    expect(screen.queryByRole("link")).toBeNull();
    const clinic = within(
      screen.getByRole("article", {
        name: "Recepce hematologických ambulancí FN Ostrava",
      }),
    );
    expect(clinic.getByRole("alert").textContent).toContain(
      "telefonní číslo není k dispozici",
    );
    await user.click(
      screen.getByRole("button", { name: "Zobrazit kontakt na praktika" }),
    );
    const gp = within(
      screen.getByRole("article", { name: "Váš praktický lékař" }),
    );
    expect(gp.getByText("Kontakt není nastaven")).toBeDefined();
    expect(screen.queryByText("MUDr. Jan Novák")).toBeNull();
  });

  it("opens from bottom navigation and retains GP disclosure state across sections", async () => {
    const user = userEvent.setup();
    render(
      <MantineProvider env="test">
        <App />
      </MantineProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Kontakty" }));
    expect(
      screen.getByRole("heading", { name: "Důležité kontakty oddělení" }),
    ).toBeDefined();
    await user.click(
      screen.getByRole("button", { name: "Zobrazit kontakt na praktika" }),
    );
    await user.click(screen.getByRole("button", { name: "Zprávy" }));
    expect(
      screen.queryByRole("button", { name: "Skrýt kontakt na praktika" }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Kontakty" }));
    expect(
      screen
        .getByRole("button", { name: "Skrýt kontakt na praktika" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });
});
